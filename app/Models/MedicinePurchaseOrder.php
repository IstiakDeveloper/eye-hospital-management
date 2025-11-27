<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};

class MedicinePurchaseOrder extends Model
{
    protected $fillable = [
        'po_number',
        'vendor_id',
        'order_date',
        'expected_delivery_date',
        'total_amount',
        'status',
        'notes',
        'created_by'
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(MedicineVendor::class, 'vendor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MedicinePurchaseOrderItem::class, 'purchase_order_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(MedicineStock::class, 'purchase_order_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generatePONumber()
    {
        $prefix = 'PO-';
        $date = now()->format('ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return $prefix . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    public function updateStatus()
    {
        $totalOrdered = $this->items()->sum('ordered_quantity');
        $totalReceived = $this->items()->sum('received_quantity');

        if ($totalReceived == 0) {
            $status = 'pending';
        } elseif ($totalReceived < $totalOrdered) {
            $status = 'partial';
        } else {
            $status = 'completed';
        }

        $this->update(['status' => $status]);
    }
}
