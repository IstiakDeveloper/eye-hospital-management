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
        $totalValue = 0;
        $totalQuantity = 0;

        foreach ($this->stocks()->where('available_quantity', '>', 0)->get() as $stock) {
            $totalValue += $stock->buy_price * $stock->available_quantity;
            $totalQuantity += $stock->available_quantity;
        }

        $this->average_buy_price = $totalQuantity > 0 ? $totalValue / $totalQuantity : 0;
        $this->save();
    }
}
