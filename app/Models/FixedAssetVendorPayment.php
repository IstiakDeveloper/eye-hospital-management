<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAssetVendorPayment extends Model
{
    protected $fillable = [
        'payment_no',
        'vendor_id',
        'amount',
        'payment_method',
        'reference_no',
        'description',
        'payment_date',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(FixedAssetVendor::class, 'vendor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
