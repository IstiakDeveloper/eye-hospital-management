<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OpticsBuySaleStockMetrics
{
    /**
     * Allocated current due and cash **received within the report date range** for item-level rows.
     *
     * Cash uses sum(`optics_sale_payments.amount`) in `[fromDate, toDate]` per sale, allocated by
     * each line’s share of `optics_sales.total_amount`, so period totals match the hospital ledger
     * when every payment is posted there in the same period.
     *
     * @param  Collection<int, object>  $uniqueSales  from `$sales->unique('sale_id')`
     * @param  Collection<int, object>  $sales  full optics_sale_items join optics_sales rows for this item
     * @return array{cash: float, due: float}
     */
    public static function allocatedDueAndPeriodCash(
        Collection $uniqueSales,
        Collection $sales,
        string $fromDate,
        string $toDate,
    ): array {
        if ($uniqueSales->isEmpty()) {
            return ['cash' => 0.0, 'due' => 0.0];
        }

        $saleIds = $uniqueSales->pluck('sale_id')->unique()->values();

        $paidInPeriodBySaleId = DB::table('optics_sale_payments')
            ->whereIn('optics_sale_id', $saleIds)
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->groupBy('optics_sale_id')
            ->selectRaw('optics_sale_id, SUM(amount) as paid_in_period')
            ->get()
            ->keyBy('optics_sale_id');

        $salesMap = DB::table('optics_sales')
            ->whereIn('id', $saleIds)
            ->whereNull('deleted_at')
            ->select('id', 'total_amount', 'advance_payment')
            ->get()
            ->keyBy('id');

        $paymentsUpToToDateBySaleId = DB::table('optics_sale_payments')
            ->whereIn('optics_sale_id', $saleIds)
            ->where('created_at', '<=', $toDate.' 23:59:59')
            ->groupBy('optics_sale_id')
            ->selectRaw('optics_sale_id, SUM(amount) as paid_sum')
            ->get()
            ->keyBy('optics_sale_id');

        $advanceInTableUpToToDateBySaleId = DB::table('optics_sale_payments')
            ->whereIn('optics_sale_id', $saleIds)
            ->where('created_at', '<=', $toDate.' 23:59:59')
            ->where('notes', 'like', '%Advance%')
            ->groupBy('optics_sale_id')
            ->selectRaw('optics_sale_id, SUM(amount) as advance_sum')
            ->get()
            ->keyBy('optics_sale_id');

        $cash = 0.0;
        $due = 0.0;

        foreach ($uniqueSales as $sale) {
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            $thisItemTotal = $sales->where('sale_id', $sale->sale_id)->sum('total_price');

            if ($saleItemsTotal <= 0) {
                continue;
            }

            $itemPortion = $thisItemTotal / $saleItemsTotal;
            $saleRow = $salesMap->get($sale->sale_id);
            $paymentsRow = $paymentsUpToToDateBySaleId->get($sale->sale_id);
            $advanceRow = $advanceInTableUpToToDateBySaleId->get($sale->sale_id);

            $saleDue = OpticsSaleDueCalculator::outstandingDue(
                (float) ($saleRow->total_amount ?? 0),
                (float) ($saleRow->advance_payment ?? 0),
                (float) ($paymentsRow->paid_sum ?? 0),
                (float) ($advanceRow->advance_sum ?? 0),
            );
            $due += $saleDue * $itemPortion;

            $paidRow = $paidInPeriodBySaleId->get($sale->sale_id);
            $paidInPeriod = (float) ($paidRow->paid_in_period ?? 0);

            $saleDiscount = ($saleItemsTotal + ($sale->glass_fitting_price ?? 0)) - $sale->total_amount;
            $lineTotalForSale = $thisItemTotal - ($saleDiscount * $itemPortion) + (($sale->glass_fitting_price ?? 0) * $itemPortion);
            $invTotal = (float) $sale->total_amount;

            if ($invTotal > 0) {
                $cash += $paidInPeriod * ($lineTotalForSale / $invTotal);
            }
        }

        return ['cash' => $cash, 'due' => $due];
    }
}
