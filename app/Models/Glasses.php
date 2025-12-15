<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Glasses extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'brand',
        'model',
        'type',
        'frame_type',
        'material',
        'color',
        'gender',
        'size',
        'lens_width',
        'bridge_width',
        'temple_length',
        'shape',
        'purchase_price',
        'selling_price',
        'stock_quantity',
        'minimum_stock_level',
        'description',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'lens_width' => 'decimal:2',
        'bridge_width' => 'decimal:2',
        'temple_length' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
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
        return $this->hasMany(CompleteGlasses::class, 'frame_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'item_id')
            ->where('item_type', 'glasses');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->brand} {$this->model}";
    }

    public function getFormattedSizeAttribute(): string
    {
        if ($this->lens_width && $this->bridge_width && $this->temple_length) {
            return "{$this->lens_width}-{$this->bridge_width}-{$this->temple_length}";
        }
        return $this->size ?? 'N/A';
    }

    public function getProfitAttribute(): float
    {
        return $this->selling_price - $this->purchase_price;
    }

    /**
     * Update average purchase price based on new stock
     * Formula: ((old_stock * old_price) + (new_qty * new_price)) / (old_stock + new_qty)
     */
    public function updateAveragePurchasePrice(int $newQuantity, float $newUnitPrice): void
    {
        $oldStock = $this->stock_quantity;
        $oldPrice = $this->purchase_price;

        // Calculate weighted average
        if ($oldStock > 0) {
            $totalValue = ($oldStock * $oldPrice) + ($newQuantity * $newUnitPrice);
            $totalQuantity = $oldStock + $newQuantity;
            $averagePrice = $totalValue / $totalQuantity;
        } else {
            // First purchase
            $averagePrice = $newUnitPrice;
        }

        $this->update(['purchase_price' => round($averagePrice, 2)]);
    }

    public function getProfitPercentageAttribute(): float
    {
        if ($this->purchase_price > 0) {
            return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
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

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByGender($query, $gender)
    {
        return $query->where('gender', $gender);
    }

    public function defaultVendor(): BelongsTo
    {
        return $this->belongsTo(OpticsVendor::class, 'default_vendor_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(GlassesPurchase::class, 'glasses_id');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(OpticsSaleItem::class, 'item_id')
            ->whereIn('item_type', ['glasses', 'frame']);
    }

    /**
     * Get buy-sale-stock report data for a specific date range
     * This method calculates:
     * - Before stock (opening stock and value)
     * - Current period purchases (quantity, price, value)
     * - Current period sales (quantity, price, subtotal, discount, total)
     * - Available stock (closing stock and value)
     * - Due amount from sales
     */
    public static function getBuySaleStockReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()
            ->with(['saleItems'])
            ->where('is_active', true);

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('color', 'like', "%{$search}%");
            });
        }

        $glasses = $query->get();

        return $glasses->map(function ($glass) use ($fromDate, $toDate) {
            // Calculate before stock (stock before fromDate)
            $beforeStockQty = $glass->getStockBeforeDate($fromDate);
            $beforeStockValue = $beforeStockQty * $glass->purchase_price;

            // Get purchases in date range (using stock_movements to capture all purchases including cash)
            $buyData = $glass->getPurchasesInDateRange($fromDate, $toDate);
            $buyQty = $buyData['quantity'];
            $buyPrice = $buyData['price'];
            $buyValue = $buyData['total'];

            // Calculate sales in date range
            $salesData = $glass->getSalesInDateRange($fromDate, $toDate);

            $saleQty = $salesData['quantity'];
            $salePrice = $salesData['unit_price'];
            $saleSubtotal = $salesData['subtotal'];
            $saleDiscount = $salesData['discount'];
            $saleFitting = $salesData['fitting_charge'];
            $saleTotal = $salesData['total'];
            $saleDue = $salesData['due'];

            // Calculate available stock = Before Stock + Buy - Sale
            $availableQty = $beforeStockQty + $buyQty - $saleQty;

            // Calculate profit correctly
            // Total profit = Sale Total - Total Purchase Cost for sold items
            // Note: Sale Total already includes fitting charge, so we don't subtract it separately
            // Per unit profit = (Average Sale Price - Purchase Price)
            $purchaseCostForSoldItems = $saleQty * $glass->purchase_price;
            $totalProfit = $saleTotal - $purchaseCostForSoldItems;

            // Available Value = Before Stock Value + Buy Value - Cost of Sold Items
            // This is accurate because it accounts for the actual cost flow
            $availableValue = $beforeStockValue + $buyValue - $purchaseCostForSoldItems;
            $profitPerUnit = $saleQty > 0 ? ($salePrice - $glass->purchase_price) : 0;

            return [
                'id' => $glass->id,
                'sl' => null, // Will be set in controller
                'name' => $glass->brand . ' ' . $glass->model . ' - ' . ($glass->color ?? 'N/A'),
                'sku' => $glass->sku,

                // Before stock information
                'before_stock_qty' => $beforeStockQty,
                'before_stock_price' => round($glass->purchase_price, 2),
                'before_stock_value' => round($beforeStockValue, 2),

                // Buy information
                'buy_qty' => $buyQty,
                'buy_price' => round($buyPrice, 2),
                'buy_total' => round($buyValue, 2),

                // Sale information
                'sale_qty' => $saleQty,
                'sale_price' => round($salePrice, 2),
                'sale_subtotal' => round($saleSubtotal, 2),
                'sale_discount' => round($saleDiscount, 2),
                'sale_fitting' => round($saleFitting, 2),
                'sale_total' => round($saleTotal, 2),
                'sale_due' => round($saleDue, 2),

                // Available information
                'available_stock' => $availableQty,
                'available_value' => round($availableValue, 2),

                // Profit information
                'profit_per_unit' => round($profitPerUnit, 2),
                'total_profit' => round($totalProfit, 2),
            ];
        })->values()->toArray();
    }

    /**
     * Get stock quantity before a specific date
     */
    public function getStockBeforeDate($date)
    {
        // Get stock movements before date
        $movements = DB::table('stock_movements')
            ->where('item_type', 'glasses')
            ->where('item_id', $this->id)
            ->where(DB::raw('DATE(created_at)'), '<', $date)
            ->get();

        $totalQty = 0;
        foreach ($movements as $movement) {
            if (in_array($movement->movement_type, ['purchase', 'adjustment', 'return'])) {
                $totalQty += abs($movement->quantity);
            } elseif (in_array($movement->movement_type, ['sale', 'damage'])) {
                $totalQty -= abs($movement->quantity);
            }
        }

        // Also subtract sales before date (in case not all are in stock_movements)
        $soldQty = DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->whereIn('optics_sale_items.item_type', ['glasses', 'frame'])
            ->where('optics_sale_items.item_id', $this->id)
            ->where(DB::raw('DATE(optics_sales.created_at)'), '<', $date)
            ->whereNull('optics_sales.deleted_at')
            ->sum('optics_sale_items.quantity');

        $totalQty -= $soldQty;

        return max(0, $totalQty);
    }

    /**
     * Get purchases in date range using stock_movements
     * This captures both cash purchases and vendor purchases
     */
    public function getPurchasesInDateRange($fromDate, $toDate)
    {
        $movements = DB::table('stock_movements')
            ->where('item_type', 'glasses')
            ->where('item_id', $this->id)
            ->whereIn('movement_type', ['purchase', 'adjustment', 'return'])
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->get();

        $quantity = $movements->sum('quantity');
        $total = $movements->sum('total_amount') ?? ($quantity * $this->purchase_price);
        $price = $quantity > 0 ? $total / $quantity : $this->purchase_price;

        return [
            'quantity' => abs($quantity),
            'price' => $price,
            'total' => $total,
        ];
    }

    /**
     * Get sales data in a specific date range
     */
    public function getSalesInDateRange($fromDate, $toDate)
    {
        $sales = DB::table('optics_sale_items')
            ->join('optics_sales', 'optics_sale_items.optics_sale_id', '=', 'optics_sales.id')
            ->whereIn('optics_sale_items.item_type', ['glasses', 'frame'])
            ->where('optics_sale_items.item_id', $this->id)
            ->whereBetween('optics_sales.created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->whereNull('optics_sales.deleted_at')
            ->select(
                'optics_sale_items.quantity',
                'optics_sale_items.unit_price',
                'optics_sale_items.total_price',
                'optics_sales.id as sale_id',
                'optics_sales.total_amount',
                'optics_sales.advance_payment',
                'optics_sales.due_amount',
                'optics_sales.glass_fitting_price'
            )
            ->get();

        $quantity = $sales->sum('quantity');
        $unitPrice = $quantity > 0 ? $sales->sum('total_price') / $quantity : 0;
        $subtotal = $sales->sum('total_price');

        // Calculate discount (we need to proportionally distribute the discount)
        // Formula: Discount = (Items Total + Fitting) - Sale Total
        // Because: Sale Total = Items Total + Fitting - Discount
        $discount = 0;
        $uniqueSales = $sales->unique('sale_id');
        foreach ($uniqueSales as $sale) {
            // Get total of ALL items in this sale
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            // Get total price of THIS specific glass/item in this sale (may have multiple rows)
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
            // Get total of ALL items in this sale
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            // Get total price of THIS specific glass/item in this sale (may have multiple rows)
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
            // Get total of ALL items in this sale
            $saleItemsTotal = DB::table('optics_sale_items')
                ->where('optics_sale_id', $sale->sale_id)
                ->sum('total_price');

            // Get total price of THIS specific glass/item in this sale (may have multiple rows)
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
