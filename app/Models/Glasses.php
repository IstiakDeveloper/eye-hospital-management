<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Glasses extends Model
{
    use HasFactory;

    protected $fillable = [
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
        'price',
        'stock_quantity',
        'supplier',
        'description',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'lens_width' => 'decimal:2',
        'bridge_width' => 'decimal:2',
        'temple_length' => 'decimal:2',
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function prescriptionGlasses(): HasMany
    {
        return $this->hasMany(PrescriptionGlasses::class);
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

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }
}
