<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'minimum_stock',
        'reorder_level',
        'low_stock_alert',
        'expiry_alert',
        'expiry_alert_days',
    ];

    protected $casts = [
        'minimum_stock' => 'integer',
        'reorder_level' => 'integer',
        'low_stock_alert' => 'boolean',
        'expiry_alert' => 'boolean',
        'expiry_alert_days' => 'integer',
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function shouldAlertLowStock(): bool
    {
        return $this->low_stock_alert &&
            $this->medicine->total_stock <= $this->minimum_stock;
    }

    public function shouldAlertExpiry(): bool
    {
        return $this->expiry_alert &&
            $this->medicine->expiring_stock > 0;
    }
}
