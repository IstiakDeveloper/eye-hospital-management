<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Medicine extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'generic_name',
        'type',
        'manufacturer',
        'description',
        'is_active',
        'total_stock',
        'average_buy_price',
        'standard_sale_price',
        'track_stock',
        'unit',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'track_stock' => 'boolean',
        'total_stock' => 'integer',
        'average_buy_price' => 'decimal:2',
        'standard_sale_price' => 'decimal:2',
    ];

    /**
     * Get the prescription medicines that include this medicine.
     */
    public function prescriptionMedicines(): HasMany
    {
        return $this->hasMany(PrescriptionMedicine::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(MedicineStock::class);
    }

    public function stockAlert(): HasOne
    {
        return $this->hasOne(StockAlert::class);
    }

    /**
     * Scope a query to only include active medicines.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by type.
     */


    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('stockAlert', function ($q) {
            $q->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
        });
    }

    public function scopeInStock($query)
    {
        return $query->where('total_stock', '>', 0);
    }

    // Helper methods
    public function getAvailableStockAttribute()
    {
        return $this->stocks()->where('is_active', true)
            ->where('available_quantity', '>', 0)
            ->where('expiry_date', '>', now())
            ->sum('available_quantity');
    }

    public function getExpiredStockAttribute()
    {
        return $this->stocks()->where('expiry_date', '<=', now())->sum('available_quantity');
    }

    public function getExpiringStockAttribute()
    {
        $alertDays = $this->stockAlert?->expiry_alert_days ?? 30;
        return $this->stocks()
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays($alertDays))
            ->sum('available_quantity');
    }

    public function updateTotalStock()
    {
        $this->total_stock = $this->stocks()->sum('available_quantity');
        $this->save();
    }

    public function updateAverageBuyPrice()
    {
        $totalValue = '0';
        $totalQuantity = 0;

        foreach ($this->stocks()->where('available_quantity', '>', 0)->get() as $stock) {
            // Get original purchase transaction
            $purchaseTxn = \DB::table('stock_transactions')
                ->where('medicine_stock_id', $stock->id)
                ->where('type', 'purchase')
                ->first();

            if ($purchaseTxn && $stock->quantity > 0) {
                // Calculate proportional value based on available quantity
                $proportion = bcdiv((string)$stock->available_quantity, (string)$stock->quantity, 6);
                $itemValue = bcmul($proportion, (string)$purchaseTxn->total_amount, 6);
                $totalValue = bcadd($totalValue, $itemValue, 6);
                $totalQuantity += $stock->available_quantity;
            }
        }

        $this->average_buy_price = $totalQuantity > 0 ? round((float)bcdiv($totalValue, (string)$totalQuantity, 6), 2) : 0;
        $this->save();
    }

    /**
     * Update average purchase price based on new stock purchase
     * Formula: ((old_stock × old_price) + (new_qty × new_price)) / (old_stock + new_qty)
     */
    public function updateAveragePurchasePrice(int $newQuantity, float $newUnitPrice): void
    {
        $oldStock = $this->total_stock;
        $oldPrice = $this->average_buy_price ?? 0;

        // Calculate weighted average using bcmath for precision
        if ($oldStock > 0 && $oldPrice > 0) {
            $oldValue = bcmul((string)$oldStock, (string)$oldPrice, 6);
            $newValue = bcmul((string)$newQuantity, (string)$newUnitPrice, 6);
            $totalValue = bcadd($oldValue, $newValue, 6);
            $totalQuantity = $oldStock + $newQuantity;
            $averagePrice = bcdiv($totalValue, (string)$totalQuantity, 6);
        } else {
            // First purchase
            $averagePrice = $newUnitPrice;
        }

        $this->update(['average_buy_price' => round((float)$averagePrice, 2)]);
    }

    /**
     * Get accurate total stock value for all medicines
     * Formula: Total Purchase - Cost of Goods Sold (COGS)
     * This ensures stock value matches actual inventory accounting
     */
    public static function getTotalStockValue($asOnDate = null)
    {
        if (!$asOnDate) {
            $asOnDate = now()->format('Y-m-d');
        }

        // Total Purchase up to date
        $totalPurchase = \DB::table('stock_transactions')
            ->where('type', 'purchase')
            ->whereDate('created_at', '<=', $asOnDate)
            ->sum('total_amount');

        // Cost of Goods Sold (COGS) - sum of (quantity * buy_price) from sales
        $costOfGoodsSold = \DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->where('medicine_sales.sale_date', '<=', $asOnDate)
            ->sum(\DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

        // Stock Value = Purchase - COGS
        $stockValue = $totalPurchase - $costOfGoodsSold;

        return round($stockValue, 2);
    }

    /**
     * Get Buy-Sale-Stock Report for a specific date range
     */
    public static function getBuySaleStockReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()->where('track_stock', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        $medicines = $query->get();
        $reportData = [];

        foreach ($medicines as $medicine) {
            // Get stock before the start date
            $beforeStockData = $medicine->getStockBeforeDate($fromDate);
            $beforeStockQty = $beforeStockData['quantity'];
            $beforeStockValue = $beforeStockData['value'];

            // Get purchases in the date range
            $purchaseData = $medicine->getPurchasesInDateRange($fromDate, $toDate);
            $buyQty = $purchaseData['quantity'];
            $buyPrice = $purchaseData['average_price'];
            $buyValue = $purchaseData['total'];

            // Get sales in the date range
            $salesData = $medicine->getSalesInDateRange($fromDate, $toDate);
            $saleQty = $salesData['quantity'];
            $salePrice = $salesData['unit_price'];
            $saleSubtotal = $salesData['subtotal'];
            $saleDiscount = $salesData['discount'];
            $saleTotal = $salesData['total'];
            $saleDue = $salesData['due'];

            // Calculate available stock
            $availableQty = $beforeStockQty + $buyQty - $saleQty;

            // Calculate profit
            $purchaseCostForSoldItems = $salesData['cost'];
            $totalProfit = $saleTotal - $purchaseCostForSoldItems;

            // Available Value = Before + Buy - Sale Cost
            $availableValue = $beforeStockValue + $buyValue - $purchaseCostForSoldItems;
            $profitPerUnit = $saleQty > 0 ? ($salePrice - ($purchaseCostForSoldItems / $saleQty)) : 0;

            $reportData[] = [
                'id' => $medicine->id,
                'sl' => null,
                'name' => $medicine->name,
                'generic_name' => $medicine->generic_name ?? 'N/A',
                'manufacturer' => $medicine->manufacturer ?? 'N/A',
                'unit' => $medicine->unit,

                // Before stock information
                'before_stock_qty' => $beforeStockQty,
                'before_stock_price' => $beforeStockQty > 0 ? round($beforeStockValue / $beforeStockQty, 2) : 0,
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
                'sale_total' => round($saleTotal, 2),
                'sale_due' => round($saleDue, 2),

                // Available information
                'available_stock' => $availableQty,
                'available_value' => round($availableValue, 2),

                // Profit information
                'profit_per_unit' => round($profitPerUnit, 2),
                'total_profit' => round($totalProfit, 2),
            ];
        }

        return $reportData;
    }

    /**
     * Get stock quantity and value before a specific date
     */
    public function getStockBeforeDate($date)
    {
        // Get all stock purchases before the date
        $stocks = \DB::table('medicine_stocks')
            ->where('medicine_id', $this->id)
            ->where('purchase_date', '<', $date)
            ->get();

        $totalQty = 0;
        $totalValue = '0'; // Use string for bcmath

        foreach ($stocks as $stock) {
            // Get purchase transaction for accurate total_amount
            $purchaseTxn = \DB::table('stock_transactions')
                ->where('medicine_stock_id', $stock->id)
                ->where('type', 'purchase')
                ->first();

            if (!$purchaseTxn) continue;

            // Calculate how much was sold from this stock before the date
            $soldQty = \DB::table('medicine_sale_items')
                ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                ->where('medicine_sale_items.medicine_stock_id', $stock->id)
                ->where('medicine_sales.sale_date', '<', $date)
                ->sum('medicine_sale_items.quantity');

            $remainingQty = $stock->quantity - $soldQty;
            $totalQty += $remainingQty;

            // Calculate proportional value from original total_amount
            if ($stock->quantity > 0) {
                $proportion = bcdiv((string)$remainingQty, (string)$stock->quantity, 6);
                $itemValue = bcmul($proportion, (string)$purchaseTxn->total_amount, 6);
                $totalValue = bcadd($totalValue, $itemValue, 6);
            }
        }

        return [
            'quantity' => $totalQty,
            'value' => (float)$totalValue,
        ];
    }    /**
     * Get purchases in a specific date range
     */
    public function getPurchasesInDateRange($fromDate, $toDate)
    {
        // Get purchases directly from stock_transactions for accuracy
        $transactions = \DB::table('stock_transactions')
            ->join('medicine_stocks', 'stock_transactions.medicine_stock_id', '=', 'medicine_stocks.id')
            ->where('medicine_stocks.medicine_id', $this->id)
            ->where('stock_transactions.type', 'purchase')
            ->whereBetween('stock_transactions.created_at', [$fromDate, $toDate])
            ->select('stock_transactions.quantity', 'stock_transactions.total_amount')
            ->get();

        $totalQty = $transactions->sum('quantity');
        $totalValue = $transactions->sum('total_amount'); // Use original total_amount
        $avgPrice = $totalQty > 0 ? $totalValue / $totalQty : 0;

        return [
            'quantity' => $totalQty,
            'total' => (float)$totalValue,
            'average_price' => (float)$avgPrice,
        ];
    }    /**
     * Get sales in a specific date range
     */
    public function getSalesInDateRange($fromDate, $toDate)
    {
        $saleItems = \DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
            ->where('medicine_stocks.medicine_id', $this->id)
            ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
            ->select(
                'medicine_sale_items.quantity',
                'medicine_sale_items.unit_price',
                'medicine_sale_items.buy_price',
                \DB::raw('medicine_sale_items.quantity * medicine_sale_items.unit_price as item_total'),
                \DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price as item_cost'),
                'medicine_sales.id as sale_id',
                'medicine_sales.discount as sale_discount',
                'medicine_sales.subtotal as sale_subtotal',
                'medicine_sales.total_amount',
                'medicine_sales.due_amount'
            )
            ->get();

        $quantity = $saleItems->sum('quantity');

        // Use bcmath for precise calculations
        $subtotal = '0';
        $cost = '0';
        foreach ($saleItems as $item) {
            $subtotal = bcadd($subtotal, (string)$item->item_total, 6);
            $cost = bcadd($cost, (string)$item->item_cost, 6);
        }

        $unitPrice = $quantity > 0 ? bcdiv($subtotal, (string)$quantity, 6) : '0';

        // Calculate proportional discount and due using bcmath for precision
        $discount = '0';
        $due = '0';
        $uniqueSales = $saleItems->unique('sale_id');

        foreach ($uniqueSales as $sale) {
            // Get total of ALL items in this sale using bcmath
            $allItems = \DB::table('medicine_sale_items')
                ->where('medicine_sale_id', $sale->sale_id)
                ->select('quantity', 'unit_price')
                ->get();

            $saleItemsTotal = '0';
            foreach ($allItems as $item) {
                $itemTotal = bcmul((string)$item->quantity, (string)$item->unit_price, 6);
                $saleItemsTotal = bcadd($saleItemsTotal, $itemTotal, 6);
            }

            // Get total for THIS medicine in this sale using bcmath
            $thisMedicineTotal = '0';
            foreach ($saleItems->where('sale_id', $sale->sale_id) as $item) {
                $thisMedicineTotal = bcadd($thisMedicineTotal, (string)$item->item_total, 6);
            }

            if (bccomp($saleItemsTotal, '0', 6) > 0) {
                $itemPortion = bcdiv($thisMedicineTotal, $saleItemsTotal, 6);
                $saleDiscount = bcmul((string)($sale->sale_discount ?? 0), $itemPortion, 6);
                $saleDue = bcmul((string)($sale->due_amount ?? 0), $itemPortion, 6);
                $discount = bcadd($discount, $saleDiscount, 6);
                $due = bcadd($due, $saleDue, 6);
            }
        }

        $total = bcsub($subtotal, $discount, 6);

        // Round only at the end for display
        return [
            'quantity' => $quantity,
            'unit_price' => round((float)$unitPrice, 2),
            'subtotal' => round((float)$subtotal, 2),
            'discount' => round((float)$discount, 2),
            'total' => round((float)$total, 2),
            'due' => round((float)$due, 2),
            'cost' => round((float)$cost, 2),
        ];
    }
}
