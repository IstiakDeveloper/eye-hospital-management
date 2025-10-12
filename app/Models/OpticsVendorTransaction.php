<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpticsVendorTransaction extends Model
{
    protected $fillable = [
        'transaction_no',
        'vendor_id',
        'type',
        'amount',
        'previous_balance',
        'new_balance',
        'reference_type',
        'reference_id',
        'description',
        'transaction_date',
        'payment_method_id',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(OpticsVendor::class, 'vendor_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopePurchase($query)
    {
        return $query->where('type', 'purchase');
    }

    public function scopePayment($query)
    {
        return $query->where('type', 'payment');
    }
}
