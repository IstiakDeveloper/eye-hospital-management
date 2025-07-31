<?php

// App\Models\Glasses.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
