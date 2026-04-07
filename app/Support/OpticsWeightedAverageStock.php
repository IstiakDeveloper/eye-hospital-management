<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class OpticsWeightedAverageStock
{
    /** @var array<string, list<string>> optics_sale_items.item_type values per stock item_type */
    public const OPTIC_SALE_ITEM_TYPES = [
        'glasses' => ['glasses', 'frame'],
        'lens_types' => ['lens', 'lens_types'],
        'complete_glasses' => ['complete_glasses'],
    ];

    /**
     * Same as movement-only WAC, then aligns closing qty/value to **active optics sales** vs **sale**
     * movements only. Fixes legacy drift (sale lines without movements, orphan movements, etc.).
     * Damage/adjustment-only outflows stay inside the WAC walk and are not part of this delta.
     *
     * @return array{quantity: float, value: float}
     */
    public static function cumulativeStockValueReconciled(
        string $stockItemType,
        int $itemId,
        string $tillDate,
        float $fallbackUnitCost,
    ): array {
        $wac = self::cumulativeStockValue($stockItemType, $itemId, $tillDate);
        $opticTypes = self::OPTIC_SALE_ITEM_TYPES[$stockItemType] ?? [];
        if ($opticTypes === []) {
            return $wac;
        }

        $soldOptics = self::soldQuantityFromOpticsSaleItems($itemId, $tillDate, $opticTypes);
        $soldMovements = self::soldQuantityFromSaleMovementsOnly($stockItemType, $itemId, $tillDate);

        return self::adjustForSaleBookVsMovementDelta(
            $wac['quantity'],
            $wac['value'],
            $soldOptics,
            $soldMovements,
            $fallbackUnitCost,
        );
    }

    /**
     * Closing quantity and inventory value using chronological weighted-average (moving average) cost.
     * Inward movements (positive quantity) add stock at movement total_amount (purchase cost).
     * Outward movements (negative quantity) reduce stock at the average cost at that moment; sale
     * rows store selling price in total_amount — that field is ignored for COGS.
     *
     * @return array{quantity: float, value: float}
     */
    public static function cumulativeStockValue(string $itemType, int $itemId, string $tillDate): array
    {
        $movements = DB::table('stock_movements')
            ->where('item_type', $itemType)
            ->where('item_id', $itemId)
            ->where('created_at', '<=', $tillDate.' 23:59:59')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'movement_type', 'quantity', 'unit_price', 'total_amount']);

        return self::applyMovements($movements);
    }

    public static function soldQuantityFromOpticsSaleItems(int $itemId, string $tillDate, array $opticItemTypes): int
    {
        return (int) DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->whereIn('optics_sale_items.item_type', $opticItemTypes)
            ->where('optics_sale_items.item_id', $itemId)
            ->where('optics_sales.created_at', '<=', $tillDate.' 23:59:59')
            ->whereNull('optics_sales.deleted_at')
            ->sum('optics_sale_items.quantity');
    }

    public static function soldQuantityFromSaleMovementsOnly(string $stockItemType, int $itemId, string $tillDate): int
    {
        return (int) DB::table('stock_movements')
            ->where('item_type', $stockItemType)
            ->where('item_id', $itemId)
            ->where('movement_type', 'sale')
            ->where('created_at', '<=', $tillDate.' 23:59:59')
            ->sum(DB::raw('ABS(quantity)'));
    }

    /**
     * @return array{quantity: float, value: float}
     */
    public static function adjustForSaleBookVsMovementDelta(
        float $qtyWac,
        float $valueWac,
        int $soldOptics,
        int $soldMovements,
        float $fallbackUnitCost,
    ): array {
        $delta = $soldOptics - $soldMovements;
        if ($delta === 0) {
            return [
                'quantity' => $qtyWac,
                'value' => max(0.0, $valueWac),
            ];
        }

        $avg = ($qtyWac > 0 && $valueWac > 0) ? ($valueWac / $qtyWac) : max(0.0, $fallbackUnitCost);
        $qtyAdj = $qtyWac - $delta;
        $valueAdj = $valueWac - ($delta * $avg);

        return [
            'quantity' => $qtyAdj,
            'value' => max(0.0, $valueAdj),
        ];
    }

    /**
     * @param  Collection<int, object>|iterable<int, object>  $movements
     * @return array{quantity: float, value: float}
     */
    public static function applyMovements(iterable $movements): array
    {
        $qty = 0.0;
        $value = 0.0;

        foreach ($movements as $m) {
            $q = (int) $m->quantity;
            if ($q > 0) {
                $addVal = (float) $m->total_amount;
                if ($addVal <= 0 && isset($m->unit_price) && (float) $m->unit_price > 0) {
                    $addVal = abs((float) $m->unit_price) * $q;
                }
                $qty += $q;
                $value += $addVal;
            } elseif ($q < 0) {
                $out = abs($q);
                if ($qty > 0 && $value >= 0) {
                    $avg = $value / $qty;
                    $take = min($out, $qty);
                    $value -= $avg * $take;
                    $qty -= $take;
                    $out -= $take;
                }
                if ($out > 0) {
                    $qty -= $out;
                }
            }
        }

        return [
            'quantity' => $qty,
            'value' => max(0.0, $value),
        ];
    }
}
