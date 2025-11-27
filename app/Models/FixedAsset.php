<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FixedAsset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_number',
        'vendor_id',
        'name',
        'description',
        'total_amount',
        'paid_amount',
        'due_amount',
        'purchase_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($asset) {
            if (!$asset->asset_number) {
                $date = now()->format('Ymd');
                $count = self::whereDate('created_at', now())->withTrashed()->count();
                $asset->asset_number = 'FA-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }

            // Calculate due amount
            $asset->due_amount = $asset->total_amount - $asset->paid_amount;

            // Set status based on payment
            if ($asset->paid_amount >= $asset->total_amount) {
                $asset->status = 'fully_paid';
            }

            // Update vendor balance if vendor exists
            if ($asset->vendor_id && $asset->due_amount > 0) {
                $vendor = FixedAssetVendor::find($asset->vendor_id);
                if ($vendor) {
                    $vendor->addAssetPurchase($asset->total_amount, $asset->paid_amount);
                }
            }
        });
    }

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(FixedAssetVendor::class, 'vendor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FixedAssetPayment::class);
    }

    // Helper Methods
    public function makePayment(float $amount, string $description, ?string $date = null): FixedAssetPayment
    {
        if ($amount > $this->due_amount) {
            throw new \Exception('Payment amount cannot exceed due amount');
        }

        // Create payment record
        $payment = $this->payments()->create([
            'payment_no' => $this->generatePaymentNo(),
            'amount' => $amount,
            'description' => $description,
            'payment_date' => $date ?? now()->toDateString(),
            'created_by' => auth()->id(),
        ]);

        // Update asset amounts
        $this->increment('paid_amount', $amount);
        $this->decrement('due_amount', $amount);

        // Update status if fully paid
        if ($this->due_amount <= 0) {
            $this->update(['status' => 'fully_paid']);
        }

        // Find or create expense category for Fixed Asset Payment
        $expenseCategory = HospitalExpenseCategory::firstOrCreate(
            ['name' => 'Fixed Asset Payment'],
            ['is_active' => true]
        );

        // Deduct from hospital account with proper category link
        HospitalAccount::addExpense(
            amount: $amount,
            category: 'Fixed Asset Payment',
            description: "{$this->name} - Payment: {$description}",
            categoryId: $expenseCategory->id,
            date: $date ?? now()->toDateString()
        );

        return $payment;
    }

    private function generatePaymentNo(): string
    {
        return 'FAP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Scopes
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
