<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class FixedAsset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_number',
        'name',
        'description',
        'total_amount',
        'paid_amount',
        'due_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (FixedAsset $asset): void {
            if (! $asset->asset_number) {
                $date = now()->format('Ymd');
                $count = self::whereDate('created_at', now())->withTrashed()->count();
                $asset->asset_number = 'FA-'.$date.'-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
            }

            $asset->total_amount ??= 0;
            $asset->paid_amount ??= 0;
            $asset->due_amount ??= 0;
            $asset->status ??= 'active';
        });
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(FixedAssetPurchase::class);
    }

    public function latestPurchase(): HasOne
    {
        return $this->hasOne(FixedAssetPurchase::class)->latestOfMany('purchase_date');
    }

    public function recalculateTotals(): void
    {
        $totalAmount = (float) $this->purchases()->sum('total_amount');
        $paidAmount = (float) $this->purchases()->sum('paid_amount');
        $dueAmount = (float) $this->purchases()->sum('due_amount');

        $status = $this->status;
        if ($status !== 'inactive') {
            if ($dueAmount <= 0 && $totalAmount > 0) {
                $status = 'fully_paid';
            } elseif ($dueAmount > 0) {
                $status = 'active';
            }
        }

        $this->update([
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'due_amount' => $dueAmount,
            'status' => $status,
        ]);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFullyPaid($query)
    {
        return $query->where('status', 'fully_paid');
    }

    public function scopeWithDue($query)
    {
        return $query->where('due_amount', '>', 0);
    }
}
