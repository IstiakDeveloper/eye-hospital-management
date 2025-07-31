<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
