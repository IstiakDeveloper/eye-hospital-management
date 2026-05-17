<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAssetPurchase extends Model
{
    protected $fillable = [
        'purchase_number',
        'fixed_asset_id',
        'vendor_id',
        'description',
        'quantity',
        'total_amount',
        'paid_amount',
        'due_amount',
        'purchase_date',
        'created_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'purchase_date' => 'date',
        'quantity' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (FixedAssetPurchase $purchase): void {
            if (! $purchase->purchase_number) {
                $purchase->purchase_number = self::generatePurchaseNumber();
            }

            $purchase->due_amount = $purchase->total_amount - $purchase->paid_amount;

            if ($purchase->vendor_id && $purchase->due_amount > 0) {
                $vendor = FixedAssetVendor::find($purchase->vendor_id);
                $vendor?->addAssetPurchase((float) $purchase->total_amount, (float) $purchase->paid_amount);
            }
        });

        static::created(function (FixedAssetPurchase $purchase): void {
            $purchase->fixedAsset?->recalculateTotals();
        });
    }

    public function fixedAsset(): BelongsTo
    {
        return $this->belongsTo(FixedAsset::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(FixedAssetVendor::class, 'vendor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generatePurchaseNumber(): string
    {
        $date = now()->format('Ymd');
        $sequence = self::query()->whereDate('created_at', today())->count() + 1;

        do {
            $purchaseNumber = 'FAP-'.$date.'-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
            $sequence++;
        } while (self::query()->where('purchase_number', $purchaseNumber)->exists());

        return $purchaseNumber;
    }
}
