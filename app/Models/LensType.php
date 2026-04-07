<?php

namespace App\Models;

use App\Support\OpticsBuySaleStockMetrics;
use App\Support\OpticsWeightedAverageStock;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class LensType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'material',
        'coating',
        'price',
        'stock_quantity',
        'minimum_stock_level',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'minimum_stock_level' => 'integer',
        'is_active' => 'boolean',
    ];

    public function prescriptionGlasses(): HasMany
    {
        return $this->hasMany(PrescriptionGlasses::class);
    }

    public function completeGlasses(): HasMany
    {
        return $this->hasMany(CompleteGlasses::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'item_id')
            ->where('item_type', 'lens_types');
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= $this->minimum_stock_level;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock_quantity <= minimum_stock_level');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(OpticsSaleItem::class, 'item_id')
            ->whereIn('item_type', ['lens', 'lens_types']);
    }

    /**
     * Get cumulative stock quantity and value up to end of day $tillDate using chronological
     * weighted-average cost from stock_movements.
     */
    public function getCumulativeStockValue($tillDate): array
    {
        $state = OpticsWeightedAverageStock::cumulativeStockValueReconciled(
            'lens_types',
            $this->id,
            $tillDate,
            (float) ($this->price ?? 0),
        );

        return [
            'quantity' => (int) round($state['quantity']),
            'value' => round($state['value'], 2),
        ];
    }

    /**
     * Get buy-sale-stock report data for lens types
     */
    public static function getBuySaleStockReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()
            ->with(['saleItems'])
            ->where('is_active', true);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('material', 'like', "%{$search}%");
            });
        }

        $lensTypes = $query->get();

        return $lensTypes->map(function ($lens) use ($fromDate, $toDate) {
            // Use cumulative method for perfect continuity - calculate till day BEFORE fromDate
            $dayBeforeFrom = date('Y-m-d', strtotime($fromDate.' -1 day'));
            $beforeStockData = $lens->getCumulativeStockValue($dayBeforeFrom);
            $beforeStockQty = $beforeStockData['quantity'];
            $beforeStockValue = $beforeStockData['value'];

            // For lens types, purchases are tracked via stock_movements or direct stock adjustments
            // We'll calculate based on stock movements
            $buyData = $lens->getPurchasesInDateRange($fromDate, $toDate);
            $buyQty = $buyData['quantity'];
            $buyPrice = $buyData['price'];
            $buyValue = $buyData['total'];

            // Calculate sales in date range
            $salesData = $lens->getSalesInDateRange($fromDate, $toDate);
            $saleQty = $salesData['quantity'];
            $salePrice = $salesData['unit_price'];
            $saleSubtotal = $salesData['subtotal'];
            $saleDiscount = $salesData['discount'];
            $saleFitting = $salesData['fitting_charge'];
            $saleTotal = $salesData['total'];
            $saleDue = $salesData['due'];
            $saleCash = $salesData['cash'];

            $endStockData = $lens->getCumulativeStockValue($toDate);
            $availableQty = $endStockData['quantity'];
            $availableValue = $endStockData['value'];

            $cogsInPeriod = $beforeStockValue + $buyValue - $availableValue;
            $totalProfit = $saleTotal - $cogsInPeriod;
            $profitPerUnit = $saleQty > 0 ? (($saleTotal - $cogsInPeriod) / $saleQty) : 0;

            return [
                'id' => $lens->id,
                'sl' => null,
                'name' => $lens->name.' - '.$lens->type,
                'sku' => 'LENS-'.$lens->id,

                // Before stock information - raw values for continuity (cast to prevent null)
                'before_stock_qty' => (int) $beforeStockQty,
                'before_stock_price' => (float) ($beforeStockQty > 0 ? $beforeStockValue / $beforeStockQty : ($buyPrice > 0 ? $buyPrice : ($lens->price ?? 0))),
                'before_stock_value' => (float) $beforeStockValue,

                // Buy information - raw values (cast to prevent null)
                'buy_qty' => (int) $buyQty,
                'buy_price' => (float) $buyPrice,
                'buy_total' => (float) $buyValue,

                // Sale information (cast to prevent null)
                'sale_qty' => (int) $saleQty,
                'sale_price' => (float) $salePrice,
                'sale_subtotal' => (float) $saleSubtotal,
                'sale_discount' => (float) $saleDiscount,
                'sale_fitting' => (float) $saleFitting,
                'sale_total' => (float) $saleTotal,
                'sale_cash' => (float) $saleCash,
                'sale_due' => (float) $saleDue,

                // Available information - raw values for continuity (cast to prevent null)
                'available_stock' => (int) $availableQty,
                'available_value' => (float) $availableValue,

                // Profit information - raw values (cast to prevent null)
                'profit_per_unit' => (float) $profitPerUnit,
                'total_profit' => (float) $totalProfit,
            ];
        })->values()->toArray();
    }

    public function getStockBeforeDate($date)
    {
        // Get stock movements before date
        $movements = DB::table('stock_movements')
            ->where('item_type', 'lens_types')
            ->where('item_id', $this->id)
            ->where(DB::raw('DATE(created_at)'), '<', $date)
            ->get();

        $totalQty = 0;
        foreach ($movements as $movement) {
            if (in_array($movement->movement_type, ['purchase', 'adjustment'])) {
                $totalQty += abs($movement->quantity);
            } elseif (in_array($movement->movement_type, ['sale', 'damage'])) {
                $totalQty -= abs($movement->quantity);
            }
        }

        // Also subtract sales before date
        $soldQty = DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->whereIn('optics_sale_items.item_type', ['lens', 'lens_types'])
            ->where('optics_sale_items.item_id', $this->id)
            ->where(DB::raw('DATE(optics_sales.created_at)'), '<', $date)
            ->whereNull('optics_sales.deleted_at')
            ->sum('optics_sale_items.quantity');

        $totalQty -= $soldQty;

        return max(0, $totalQty);
    }

    public function getPurchasesInDateRange($fromDate, $toDate)
    {
        $movements = DB::table('stock_movements')
            ->where('item_type', 'lens_types')
            ->where('item_id', $this->id)
            ->whereIn('movement_type', ['purchase', 'adjustment'])
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->get();

        $quantity = $movements->sum('quantity');
        $total = $movements->sum('total_amount') ?? ($quantity * $this->price);
        $price = $quantity > 0 ? $total / $quantity : $this->price;

        return [
            'quantity' => abs($quantity),
            'price' => $price,
            'total' => $total,
        ];
    }

    public function getSalesInDateRange($fromDate, $toDate)
    {
        $sales = DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->whereIn('optics_sale_items.item_type', ['lens', 'lens_types'])
            ->where('optics_sale_items.item_id', $this->id)
            ->whereBetween('optics_sales.created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->whereNull('optics_sales.deleted_at')
            ->select(
                'optics_sale_items.quantity',
                'optics_sale_items.unit_price',
                'optics_sale_items.total_price',
                'optics_sales.id as sale_id',
                'optics_sales.total_amount',
                'optics_sales.advance_payment',
                'optics_sales.glass_fitting_price'
            )
            ->get();

        $quantity = $sales->sum('quantity');
        $unitPrice = $quantity > 0 ? $sales->sum('total_price') / $quantity : 0;
        $subtotal = $sales->sum('total_price');

        // Calculate discount proportionally
        // Formula: Discount = (Items Total + Fitting) - Sale Total
        // Because: Sale Total = Items Total + Fitting - Discount
        $discount = 0;
        $uniqueSales = $sales->unique('sale_id');
        foreach ($uniqueSales as $sale) {
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            $thisItemTotal = $sales->where('sale_id', $sale->sale_id)->sum('total_price');

            if ($saleItemsTotal > 0) {
                $itemPortion = $thisItemTotal / $saleItemsTotal;
                $saleDiscount = ($saleItemsTotal + ($sale->glass_fitting_price ?? 0)) - $sale->total_amount;
                $discount += $saleDiscount * $itemPortion;
            }
        }

        // Calculate fitting charge proportionally for this specific item
        $fittingCharge = 0;
        foreach ($uniqueSales as $sale) {
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            $thisItemTotal = $sales->where('sale_id', $sale->sale_id)->sum('total_price');

            if ($saleItemsTotal > 0) {
                $itemPortion = $thisItemTotal / $saleItemsTotal;
                $fittingCharge += ($sale->glass_fitting_price ?? 0) * $itemPortion;
            }
        }

        $total = $subtotal - $discount + $fittingCharge;

        $metrics = OpticsBuySaleStockMetrics::allocatedDueAndPeriodCash(
            $uniqueSales,
            $sales,
            $fromDate,
            $toDate,
        );
        $due = $metrics['due'];
        $cash = $metrics['cash'];

        return [
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'fitting_charge' => $fittingCharge,
            'total' => $total,
            'due' => $due,
            'cash' => $cash,
        ];
    }
}
