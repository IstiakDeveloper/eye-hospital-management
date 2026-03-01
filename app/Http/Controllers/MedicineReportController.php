<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicineReportController extends Controller
{
    public function buySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        // Get report data
        $reportData = Medicine::getBuySaleStockReport($fromDate, $toDate, $search);

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;

            return $item;
        })->values()->toArray();

        // Calculate totals - use direct database values for accuracy
        $directTotals = DB::table('medicine_sales')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('
                SUM(subtotal) as total_subtotal,
                SUM(discount) as total_discount,
                SUM(total_amount) as total_amount,
                SUM(due_amount) as total_due
            ')
            ->first();

        // Calculate profit directly: Total Sales - Total Cost (100% accurate)
        $totalCost = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
            ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),

            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),

            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => (float) $directTotals->total_subtotal,
            'sale_discount' => (float) $directTotals->total_discount,
            'sale_total' => (float) $directTotals->total_amount,
            'sale_due' => (float) $directTotals->total_due,

            'available_stock' => collect($reportData)->sum('available_stock'),
            // Sum unrounded values for perfect continuity
            'available_value' => collect($reportData)->sum('available_value'),

            'total_profit' => (float) $directTotals->total_amount - $totalCost,
        ];

        return Inertia::render('MedicineCorner/Reports/BuySaleStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Company-wise stock summary report.
     * Shows each manufacturer's total medicine count, sale info for the period, and current available stock.
     */
    public function companyStockReport(Request $request): \Inertia\Response
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        $query = Medicine::query()->where('track_stock', true);

        if ($search) {
            $query->where('manufacturer', 'like', "%{$search}%");
        }

        $medicines = $query->get();

        $companies = $medicines->groupBy('manufacturer')->map(function ($meds, $manufacturer) use ($fromDate, $toDate) {
            $medicineIds = $meds->pluck('id')->toArray();

            $saleData = DB::table('medicine_sale_items')
                ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
                ->whereIn('medicine_stocks.medicine_id', $medicineIds)
                ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
                ->selectRaw('
                    SUM(medicine_sale_items.quantity) as total_qty,
                    SUM(medicine_sale_items.quantity * medicine_sale_items.unit_price) as total_subtotal,
                    SUM(medicine_sale_items.quantity * medicine_sale_items.buy_price) as total_cost,
                    SUM(medicine_sale_items.quantity * medicine_sale_items.unit_price)
                        - SUM(medicine_sale_items.quantity * medicine_sale_items.buy_price) as total_profit
                ')
                ->first();

            $buyData = DB::table('stock_transactions')
                ->join('medicine_stocks', 'stock_transactions.medicine_stock_id', '=', 'medicine_stocks.id')
                ->whereIn('medicine_stocks.medicine_id', $medicineIds)
                ->where('stock_transactions.type', 'purchase')
                ->whereBetween('stock_transactions.created_at', [$fromDate, $toDate.' 23:59:59'])
                ->selectRaw('SUM(stock_transactions.quantity) as total_qty, SUM(stock_transactions.total_amount) as total_amount')
                ->first();

            $availableStockQty = (int) $meds->sum('total_stock');

            // Use Total Purchases - COGS (same as Buy/Sale/Stock report) for accuracy
            $totalPurchases = DB::table('stock_transactions')
                ->join('medicine_stocks', 'stock_transactions.medicine_stock_id', '=', 'medicine_stocks.id')
                ->whereIn('medicine_stocks.medicine_id', $medicineIds)
                ->where('stock_transactions.type', 'purchase')
                ->sum('stock_transactions.total_amount');

            $totalCogs = DB::table('medicine_sale_items')
                ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
                ->whereIn('medicine_stocks.medicine_id', $medicineIds)
                ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

            $availableStockValue = round($totalPurchases - $totalCogs, 2);

            return [
                'manufacturer' => $manufacturer ?: 'Unknown',
                'total_medicines' => $meds->count(),
                'buy_qty' => (int) ($buyData->total_qty ?? 0),
                'buy_total' => round((float) ($buyData->total_amount ?? 0), 2),
                'sale_qty' => (int) ($saleData->total_qty ?? 0),
                'sale_total' => round((float) ($saleData->total_subtotal ?? 0), 2),
                'total_profit' => round((float) ($saleData->total_profit ?? 0), 2),
                'available_stock_qty' => $availableStockQty,
                'available_stock_value' => $availableStockValue,
            ];
        })->sortBy('manufacturer')->values();

        $totals = [
            'total_medicines' => $companies->sum('total_medicines'),
            'buy_qty' => $companies->sum('buy_qty'),
            'buy_total' => round($companies->sum('buy_total'), 2),
            'sale_qty' => $companies->sum('sale_qty'),
            'sale_total' => round($companies->sum('sale_total'), 2),
            'total_profit' => round($companies->sum('total_profit'), 2),
            'available_stock_qty' => $companies->sum('available_stock_qty'),
            'available_stock_value' => round($companies->sum('available_stock_value'), 2),
        ];

        $reportData = $companies->map(function ($item, $index) {
            $item['sl'] = $index + 1;

            return $item;
        })->values()->toArray();

        return Inertia::render('MedicineCorner/Reports/CompanyStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Company-wise medicine stock detail report.
     * Shows each manufacturer with all their medicines and individual stock details.
     */
    public function companyMedicineStockReport(Request $request): \Inertia\Response
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;
        $manufacturer = $request->manufacturer ?? null;

        $query = Medicine::query()->where('track_stock', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        if ($manufacturer) {
            $query->where('manufacturer', $manufacturer);
        }

        $medicines = $query->orderBy('manufacturer')->orderBy('name')->get();

        $companies = $medicines->groupBy('manufacturer')->map(function ($meds, $manufacturer) use ($fromDate, $toDate) {
            $medicineList = $meds->map(function ($medicine) use ($fromDate, $toDate) {
                $saleData = DB::table('medicine_sale_items')
                    ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                    ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
                    ->where('medicine_stocks.medicine_id', $medicine->id)
                    ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
                    ->selectRaw('
                        SUM(medicine_sale_items.quantity) as total_qty,
                        SUM(medicine_sale_items.quantity * medicine_sale_items.unit_price) as total_subtotal,
                        SUM(medicine_sale_items.quantity * medicine_sale_items.buy_price) as total_cost
                    ')
                    ->first();

                $saleQty = (int) ($saleData->total_qty ?? 0);
                $saleTotal = (float) ($saleData->total_subtotal ?? 0);
                $saleCost = (float) ($saleData->total_cost ?? 0);

                $purchaseData = $medicine->getPurchasesInDateRange($fromDate, $toDate);

                // Use Total Purchases - COGS for available stock value (matches Buy/Sale/Stock report)
                $allTimePurchases = DB::table('stock_transactions')
                    ->join('medicine_stocks', 'stock_transactions.medicine_stock_id', '=', 'medicine_stocks.id')
                    ->where('medicine_stocks.medicine_id', $medicine->id)
                    ->where('stock_transactions.type', 'purchase')
                    ->sum('stock_transactions.total_amount');

                $allTimeCogs = DB::table('medicine_sale_items')
                    ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
                    ->where('medicine_stocks.medicine_id', $medicine->id)
                    ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'generic_name' => $medicine->generic_name ?? '-',
                    'type' => $medicine->type ?? '-',
                    'unit' => $medicine->unit ?? '-',
                    'buy_qty' => (int) $purchaseData['quantity'],
                    'buy_total' => round($purchaseData['total'], 2),
                    'sale_qty' => $saleQty,
                    'sale_total' => round($saleTotal, 2),
                    'profit' => round($saleTotal - $saleCost, 2),
                    'available_stock_qty' => (int) $medicine->total_stock,
                    'available_stock_value' => round($allTimePurchases - $allTimeCogs, 2),
                ];
            })->values()->toArray();

            return [
                'manufacturer' => $manufacturer ?: 'Unknown',
                'total_medicines' => count($medicineList),
                'total_buy_qty' => (int) array_sum(array_column($medicineList, 'buy_qty')),
                'total_buy_total' => round(array_sum(array_column($medicineList, 'buy_total')), 2),
                'total_sale_qty' => (int) array_sum(array_column($medicineList, 'sale_qty')),
                'total_sale_total' => round(array_sum(array_column($medicineList, 'sale_total')), 2),
                'total_profit' => round(array_sum(array_column($medicineList, 'profit')), 2),
                'available_stock_qty' => (int) array_sum(array_column($medicineList, 'available_stock_qty')),
                'available_stock_value' => round(array_sum(array_column($medicineList, 'available_stock_value')), 2),
                'medicines' => $medicineList,
            ];
        })->sortBy('manufacturer')->values()->toArray();

        $allManufacturers = Medicine::query()
            ->where('track_stock', true)
            ->whereNotNull('manufacturer')
            ->where('manufacturer', '!=', '')
            ->distinct()
            ->orderBy('manufacturer')
            ->pluck('manufacturer');

        return Inertia::render('MedicineCorner/Reports/CompanyMedicineStockReport', [
            'reportData' => $companies,
            'allManufacturers' => $allManufacturers,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
                'manufacturer' => $manufacturer,
            ],
        ]);
    }
}
