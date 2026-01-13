<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class CompleteGlasses extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'frame_id',
        'lens_type_id',
        'sphere_power',
        'cylinder_power',
        'axis',
        'total_cost',
        'selling_price',
        'stock_quantity',
        'minimum_stock_level',
        'description',
        'is_active',
    ];

    protected $casts = [
        'sphere_power' => 'decimal:2',
        'cylinder_power' => 'decimal:2',
        'axis' => 'integer',
        'total_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'minimum_stock_level' => 'integer',
        'is_active' => 'boolean',
    ];

    public function frame(): BelongsTo
    {
        return $this->belongsTo(Glasses::class, 'frame_id');
    }

    public function lensType(): BelongsTo
    {
        return $this->belongsTo(LensType::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'item_id')
            ->where('item_type', 'complete_glasses');
    }

    public function getFullNameAttribute(): string
    {
        $frameName = $this->frame ? $this->frame->full_name : 'Unknown Frame';
        $lensName = $this->lensType ? $this->lensType->name : 'Unknown Lens';
        $power = $this->sphere_power ? " ({$this->sphere_power})" : '';

        return "{$frameName} + {$lensName}{$power}";
    }

    public function getProfitAttribute(): float
    {
        return $this->selling_price - $this->total_cost;
    }

    public function getProfitPercentageAttribute(): float
    {
        if ($this->total_cost > 0) {
            return (($this->selling_price - $this->total_cost) / $this->total_cost) * 100;
        }

        return 0;
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
            ->where('item_type', 'complete_glasses');
    }

    /**
     * Get cumulative stock value from beginning till a specific date
     * Formula: Total Purchases - Total COGS
     */
    public function getCumulativeStockValue($tillDate)
    {
        // Get all purchases till date from stock_movements (inclusive)
        $totalPurchases = \DB::table('stock_movements')
            ->where('item_type', 'complete_glasses')
            ->where('item_id', $this->id)
            ->whereIn('movement_type', ['purchase', 'adjustment', 'return'])
            ->where('created_at', '<=', $tillDate.' 23:59:59')
            ->sum('total_amount');

        // Get all sales till date (inclusive)
        $totalSalesQty = \DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->where('optics_sale_items.item_type', 'complete_glasses')
            ->where('optics_sale_items.item_id', $this->id)
            ->where('optics_sales.created_at', '<=', $tillDate.' 23:59:59')
            ->whereNull('optics_sales.deleted_at')
            ->sum('optics_sale_items.quantity');

        // Calculate COGS
        $totalCOGS = $totalSalesQty * $this->total_cost;

        // Get quantity
        $totalPurchaseQty = \DB::table('stock_movements')
            ->where('item_type', 'complete_glasses')
            ->where('item_id', $this->id)
            ->whereIn('movement_type', ['purchase', 'adjustment', 'return'])
            ->where('created_at', '<=', $tillDate.' 23:59:59')
            ->sum(\DB::raw('ABS(quantity)'));

        return [
            'quantity' => $totalPurchaseQty - $totalSalesQty,
            'value' => $totalPurchases - $totalCOGS,
        ];
    }

    /**
     * Get buy-sale-stock report data for complete glasses
     */
    public static function getBuySaleStockReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()
            ->with(['frame', 'lensType', 'saleItems'])
            ->where('is_active', true);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                    ->orWhereHas('frame', function ($fq) use ($search) {
                        $fq->where('brand', 'like', "%{$search}%")
                            ->orWhere('model', 'like', "%{$search}%");
                    })
                    ->orWhereHas('lensType', function ($lq) use ($search) {
                        $lq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $completeGlasses = $query->get();

        return $completeGlasses->map(function ($cg) use ($fromDate, $toDate) {
            // Use cumulative method for perfect continuity - calculate till day BEFORE fromDate
            $dayBeforeFrom = date('Y-m-d', strtotime($fromDate.' -1 day'));
            $beforeStockData = $cg->getCumulativeStockValue($dayBeforeFrom);
            $beforeStockQty = $beforeStockData['quantity'];
            $beforeStockValue = $beforeStockData['value'];

            // Get purchases in date range (via stock movements)
            $buyData = $cg->getPurchasesInDateRange($fromDate, $toDate);
            $buyQty = $buyData['quantity'];
            $buyPrice = $buyData['price'];
            $buyValue = $buyData['total'];

            // Calculate sales in date range
            $salesData = $cg->getSalesInDateRange($fromDate, $toDate);
            $saleQty = $salesData['quantity'];
            $salePrice = $salesData['unit_price'];
            $saleSubtotal = $salesData['subtotal'];
            $saleDiscount = $salesData['discount'];
            $saleFitting = $salesData['fitting_charge'];
            $saleTotal = $salesData['total'];
            $saleDue = $salesData['due'];

            // Calculate available stock = Before Stock + Buy - Sale
            $availableQty = $beforeStockQty + $buyQty - $saleQty;

            // Profit calculation
            $purchaseCostForSoldItems = $saleQty * $cg->total_cost;
            $totalProfit = $saleTotal - $purchaseCostForSoldItems;

            // Available Value = Before + Buy - COGS (NO ROUNDING for continuity)
            $availableValue = $beforeStockValue + $buyValue - $purchaseCostForSoldItems;
            $profitPerUnit = $saleQty > 0 ? ($salePrice - $cg->total_cost) : 0;

            $frameName = $cg->frame ? $cg->frame->brand.' '.$cg->frame->model : 'N/A';
            $lensName = $cg->lensType ? $cg->lensType->name : 'N/A';

            return [
                'id' => $cg->id,
                'sl' => null,
                'name' => $frameName.' + '.$lensName,
                'sku' => $cg->sku,

                // Before stock information - raw values for continuity (cast to prevent null)
                'before_stock_qty' => (int) $beforeStockQty,
                'before_stock_price' => (float) ($cg->total_cost ?? 0),
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
            ->where('item_type', 'complete_glasses')
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
            ->where('optics_sale_items.item_type', 'complete_glasses')
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
            ->where('item_type', 'complete_glasses')
            ->where('item_id', $this->id)
            ->whereIn('movement_type', ['purchase', 'adjustment'])
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->get();

        $quantity = $movements->sum('quantity');
        $total = $movements->sum('total_amount') ?? ($quantity * $this->total_cost);
        $price = $quantity > 0 ? $total / $quantity : $this->total_cost;

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
            ->where('optics_sale_items.item_type', 'complete_glasses')
            ->where('optics_sale_items.item_id', $this->id)
            ->whereBetween('optics_sales.created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
            ->whereNull('optics_sales.deleted_at')
            ->select(
                'optics_sale_items.quantity',
                'optics_sale_items.unit_price',
                'optics_sale_items.total_price',
                'optics_sales.id as sale_id',
                'optics_sales.total_amount',
                'optics_sales.due_amount',
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

        // Calculate due amount proportionally for this specific item
        $due = 0;
        foreach ($uniqueSales as $sale) {
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            $thisItemTotal = $sales->where('sale_id', $sale->sale_id)->sum('total_price');

            if ($saleItemsTotal > 0) {
                $itemPortion = $thisItemTotal / $saleItemsTotal;
                $due += ($sale->due_amount ?? 0) * $itemPortion;
            }
        }

        return [
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'fitting_charge' => $fittingCharge,
            'total' => $total,
            'due' => $due,
        ];
    }
}
