<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlassesPurchase extends Model
{
    protected $fillable = [
        'purchase_no',
        'vendor_id',
        'glasses_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'paid_amount',
        'due_amount',
        'payment_status',
        'purchase_date',
        'notes',
        'added_by',
        'optics_transaction_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(OpticsVendor::class, 'vendor_id');
    }

    public function glasses(): BelongsTo
    {
        return $this->belongsTo(Glasses::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function opticsTransaction(): BelongsTo
    {
        return $this->belongsTo(OpticsTransaction::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopePartial($query)
    {
        return $query->where('payment_status', 'partial');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }
}
