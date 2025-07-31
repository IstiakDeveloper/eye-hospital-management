<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
