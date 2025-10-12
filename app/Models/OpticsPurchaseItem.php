<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpticsPurchaseItem extends Model
{
    protected $fillable = [
        'optics_purchase_id',
        'glass_id',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    // Relationships
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(OpticsPurchase::class, 'optics_purchase_id');
    }

    public function glass(): BelongsTo
    {
        return $this->belongsTo(Glasses::class, 'glass_id');
    }

    // Accessor for total price
    public function getTotalPriceAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
