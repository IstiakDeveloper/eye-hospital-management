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

    public static function generatePaymentNo(): string
    {
        $date = now()->format('Ymd');
        $sequence = self::query()
            ->whereDate('created_at', today())
            ->count() + 1;

        do {
            $paymentNo = 'FAVP-'.$date.'-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
            $sequence++;
        } while (self::query()->where('payment_no', $paymentNo)->exists());

        return $paymentNo;
    }
}
