<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicineVendorPayment extends Model
{
    protected $fillable = [
        'payment_no',
        'vendor_id',
        'amount',
        'payment_method',
        'reference_no',
        'payment_date',
        'description',
        'allocated_transactions',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'allocated_transactions' => 'json',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(MedicineVendor::class, 'vendor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Generate unique payment number
    public static function generatePaymentNo()
    {
        $prefix = 'VP-';
        $date = now()->format('ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return $prefix . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
