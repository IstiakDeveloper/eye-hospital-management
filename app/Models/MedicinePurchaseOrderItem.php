<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicinePurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'medicine_id',
        'ordered_quantity',
        'received_quantity',
        'unit_price',
        'total_price'
    ];

    protected $casts = [
        'ordered_quantity' => 'integer',
        'received_quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(MedicinePurchaseOrder::class, 'purchase_order_id');
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class, 'medicine_id');
    }

    public function getPendingQuantityAttribute()
    {
        return $this->ordered_quantity - $this->received_quantity;
    }
}
