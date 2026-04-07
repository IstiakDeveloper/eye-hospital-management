<?php

namespace App\Http\Controllers\Optics;

use App\Http\Controllers\Controller;
use App\Models\CompleteGlasses;
use App\Models\Glasses;
use App\Models\LensType;
use App\Models\OpticsSale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OpticsReportController extends Controller
{
    public function opticsDueMonthlyLedger(Request $request)
    {
        $months = (int) ($request->months ?? 5);
        $months = max(1, min(60, $months));

        $toMonth = $request->to_month ?: now()->format('Y-m');
        $fromMonth = $request->from_month;

        $to = Carbon::createFromFormat('Y-m', $toMonth)->startOfMonth();

        if ($fromMonth) {
            $from = Carbon::createFromFormat('Y-m', $fromMonth)->startOfMonth();
        } else {
            $from = $to->copy()->subMonths($months - 1)->startOfMonth();
        }

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to, $from];
        }

        $rows = [];
        $cursor = $from->copy();
        while ($cursor->lessThanOrEqualTo($to)) {
            $periodStart = $cursor->copy()->startOfMonth();
            $periodEnd = $cursor->copy()->endOfMonth();
            $prevEnd = $periodStart->copy()->subDay();

            $openingDue = OpticsSale::sumOutstandingDueAsOf($prevEnd->toDateString());
            $closingDue = OpticsSale::sumOutstandingDueAsOf($periodEnd->toDateString());
            $thisMonthDue = OpticsSale::sumOutstandingDueAsOfForSalesCreatedBetween(
                $periodStart->toDateString(),
                $periodEnd->toDateString(),
                $periodEnd->toDateString(),
            );

            // Due cash received in this month: payments received in this period for sales booked BEFORE this month.
            $dueCashReceived = (float) DB::table('optics_sale_payments')
                ->join('optics_sales', 'optics_sale_payments.optics_sale_id', '=', 'optics_sales.id')
                ->whereNull('optics_sales.deleted_at')
                ->whereBetween('optics_sale_payments.created_at', [
                    $periodStart->format('Y-m-d 00:00:00'),
                    $periodEnd->format('Y-m-d 23:59:59'),
                ])
                ->where('optics_sales.created_at', '<', $periodStart->format('Y-m-d 00:00:00'))
                ->sum('optics_sale_payments.amount');

            $rows[] = [
                'month' => $periodStart->format('Y-m'),
                'label' => $periodStart->format('M Y'),
                'opening_due' => (float) $openingDue,
                'this_month_due' => (float) $thisMonthDue,
                'due_cash_received' => (float) $dueCashReceived,
                'closing_due' => (float) $closingDue,
            ];

            $cursor->addMonth();
        }

        return Inertia::render('OpticsCorner/Reports/OpticsDueMonthlyLedger', [
            'rows' => $rows,
            'filters' => [
                'from_month' => $from->format('Y-m'),
                'to_month' => $to->format('Y-m'),
                'months' => $months,
            ],
        ]);
    }

    /**
     * Buy-Sale-Stock Report
     * Shows detailed stock movement report with before stock, purchases, sales, and available stock
     */
    public function buySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;
        $itemType = $request->item_type ?? 'all'; // 'all', 'glasses', 'lens_types', 'complete_glasses'

        $fromDateTime = $fromDate.' 00:00:00';
        $toDateTime = $toDate.' 23:59:59';

        $reportData = [];

        // Get Glasses (Frames) data
        if ($itemType === 'all' || $itemType === 'glasses') {
            $glassesData = Glasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($glassesData as $item) {
                $item['item_type'] = 'Frame';
                $reportData[] = $item;
            }
        }

        // Get Lens Types data
        if ($itemType === 'all' || $itemType === 'lens_types') {
            $lensTypesData = LensType::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($lensTypesData as $item) {
                $item['item_type'] = 'Lens';
                $reportData[] = $item;
            }
        }

        // Get Complete Glasses data
        if ($itemType === 'all' || $itemType === 'complete_glasses') {
            $completeGlassesData = CompleteGlasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($completeGlassesData as $item) {
                $item['item_type'] = 'Complete Glasses';
                $reportData[] = $item;
            }
        }

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;

            return $item;
        })->values()->toArray();

        // Get only fitting charge (sales without any items)
        $onlyFittingCharge = DB::table('optics_sales')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('optics_sale_items')
                    ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDateTime, $toDateTime])
            ->whereNull('deleted_at')
            ->sum('glass_fitting_price');

        // Fitting-only sales: use stored due_amount (synced from payments)
        $onlyFittingChargeDue = DB::table('optics_sales')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('optics_sale_items')
                    ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDateTime, $toDateTime])
            ->whereNull('deleted_at')
            ->sum('due_amount');

        // Cash received in period for fitting-only sales (payments dated in this period; matches hospital ledger)
        $onlyFittingChargeCash = $this->onlyFittingCashReceivedInPeriod($fromDateTime, $toDateTime);

        // Calculate previous due receive in this period
        // Definition: payments received in this period for sales whose sale date is BEFORE fromDate
        $previousDueReceiveCash = DB::table('optics_sale_payments')
            ->join('optics_sales', 'optics_sale_payments.optics_sale_id', '=', 'optics_sales.id')
            ->whereBetween('optics_sale_payments.created_at', [$fromDateTime, $toDateTime])
            ->whereDate('optics_sales.created_at', '<', $fromDate)
            ->sum('optics_sale_payments.amount');

        // Optics receivable snapshot as of end of toDate (historical as-on date).
        // This differs from `sale_due` below, which is based on current due_amount for sales within the period.
        $opticsSaleDueAsOnDate = OpticsSale::sumOutstandingDueAsOf($toDate);

        // Calculate totals - no rounding, sum raw values for continuity
        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),

            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),

            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => collect($reportData)->sum('sale_subtotal'),
            'sale_discount' => collect($reportData)->sum('sale_discount'),
            'sale_fitting' => collect($reportData)->sum('sale_fitting'),
            'sale_total' => collect($reportData)->sum('sale_total'),
            'sale_cash' => collect($reportData)->sum('sale_cash') + $onlyFittingChargeCash,
            // Show TOTAL receivable as-on toDate (matches Balance Sheet).
            'sale_due' => (float) $opticsSaleDueAsOnDate,

            'available_stock' => collect($reportData)->sum('available_stock'),
            'available_value' => collect($reportData)->sum('available_value'),

            'total_profit' => collect($reportData)->sum('total_profit'),

            'only_fitting_charge' => (float) $onlyFittingCharge,
            'only_fitting_charge_due' => (float) $onlyFittingChargeDue,
            'only_fitting_charge_cash' => (float) $onlyFittingChargeCash,
            'previous_due_receive_cash' => (float) $previousDueReceiveCash,
        ];

        // Calculate optics-only totals (without only_fitting_charge)
        $opticsTotals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),
            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),
            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => collect($reportData)->sum('sale_subtotal'),
            'sale_discount' => collect($reportData)->sum('sale_discount'),
            'sale_fitting' => collect($reportData)->sum('sale_fitting'),
            'sale_total' => collect($reportData)->sum('sale_total'),
            'sale_cash' => collect($reportData)->sum('sale_cash'),
            'sale_due' => collect($reportData)->sum('sale_due'),
            'available_stock' => collect($reportData)->sum('available_stock'),
            'available_value' => collect($reportData)->sum('available_value'),
            'total_profit' => collect($reportData)->sum('total_profit'),
        ];

        return Inertia::render('OpticsCorner/Reports/BuySaleStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'opticsTotals' => $opticsTotals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
                'item_type' => $itemType,
            ],
        ]);
    }

    /**
     * Export Buy-Sale-Stock Report as JSON
     */
    public function exportBuySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $fromDateTime = $fromDate.' 00:00:00';
        $toDateTime = $toDate.' 23:59:59';
        $search = $request->search ?? null;
        $itemType = $request->item_type ?? 'all';

        $reportData = [];

        // Get data based on item type
        if ($itemType === 'all' || $itemType === 'glasses') {
            $glassesData = Glasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($glassesData as $item) {
                $item['item_type'] = 'Frame';
                $reportData[] = $item;
            }
        }

        if ($itemType === 'all' || $itemType === 'lens_types') {
            $lensTypesData = LensType::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($lensTypesData as $item) {
                $item['item_type'] = 'Lens';
                $reportData[] = $item;
            }
        }

        if ($itemType === 'all' || $itemType === 'complete_glasses') {
            $completeGlassesData = CompleteGlasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($completeGlassesData as $item) {
                $item['item_type'] = 'Complete Glasses';
                $reportData[] = $item;
            }
        }

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;

            return $item;
        })->values()->toArray();

        // Get only fitting charge (sales without any items)
        $onlyFittingCharge = DB::table('optics_sales')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('optics_sale_items')
                    ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->whereNull('deleted_at')
            ->sum('glass_fitting_price');

        $onlyFittingChargeDue = DB::table('optics_sales')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('optics_sale_items')
                    ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->whereNull('deleted_at')
            ->sum('due_amount');
        $onlyFittingChargeCash = $this->onlyFittingCashReceivedInPeriod($fromDateTime, $toDateTime);

        // Calculate totals
        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),
            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),
            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => collect($reportData)->sum('sale_subtotal'),
            'sale_discount' => collect($reportData)->sum('sale_discount'),
            'sale_total' => collect($reportData)->sum('sale_total'),
            'sale_cash' => collect($reportData)->sum('sale_cash') + $onlyFittingChargeCash,
            'sale_due' => collect($reportData)->sum('sale_due') + $onlyFittingChargeDue,
            'available_stock' => collect($reportData)->sum('available_stock'),
            'available_value' => collect($reportData)->sum('available_value'),
            'total_profit' => collect($reportData)->sum('total_profit'),
            'only_fitting_charge' => (float) $onlyFittingCharge,
            'only_fitting_charge_due' => (float) $onlyFittingChargeDue,
            'only_fitting_charge_cash' => (float) $onlyFittingChargeCash,
        ];

        return response()->json([
            'report_data' => $reportData,
            'totals' => $totals,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'filters' => [
                'search' => $search,
                'item_type' => $itemType,
            ],
        ]);
    }

    /**
     * Sum of optics_sale_payments in the period for fitting-only sales booked in the same period.
     */
    private function onlyFittingCashReceivedInPeriod(string $fromDateTime, string $toDateTime): float
    {
        return (float) DB::table('optics_sale_payments')
            ->join('optics_sales', 'optics_sale_payments.optics_sale_id', '=', 'optics_sales.id')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('optics_sale_items')
                    ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('optics_sales.glass_fitting_price', '>', 0)
            ->whereBetween('optics_sales.created_at', [$fromDateTime, $toDateTime])
            ->whereNull('optics_sales.deleted_at')
            ->whereBetween('optics_sale_payments.created_at', [$fromDateTime, $toDateTime])
            ->sum('optics_sale_payments.amount');
    }
}
