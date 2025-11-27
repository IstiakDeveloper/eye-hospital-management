<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FixedAssetVendor extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'current_balance',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function assets(): HasMany
    {
        return $this->hasMany(FixedAsset::class, 'vendor_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FixedAssetVendorPayment::class, 'vendor_id');
    }

    // Helper Methods
    public function makePayment(float $amount, string $description, string $paymentMethod = 'cash', ?string $referenceNo = null, ?string $date = null): FixedAssetVendorPayment
    {
        if ($amount > $this->current_balance) {
            throw new \Exception('Payment amount cannot exceed current balance');
        }

        // Create payment record
        $payment = $this->payments()->create([
            'payment_no' => $this->generatePaymentNo(),
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'reference_no' => $referenceNo,
            'description' => $description,
            'payment_date' => $date ?? now()->toDateString(),
            'created_by' => auth()->id(),
        ]);

        // Update vendor balance
        $this->decrement('current_balance', $amount);

        // Find or create expense category for Fixed Asset Vendor Payment
        $expenseCategory = HospitalExpenseCategory::firstOrCreate(
            ['name' => 'Fixed Asset Vendor Payment'],
            ['is_active' => true]
        );

        // Deduct from hospital account with proper category link
        HospitalAccount::addExpense(
            amount: $amount,
            category: 'Fixed Asset Vendor Payment',
            description: "Payment to {$this->name} - {$description}",
            categoryId: $expenseCategory->id,
            date: $date ?? now()->toDateString()
        );

        return $payment;
    }

    private function generatePaymentNo(): string
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', now())->count();
        return 'FAVP-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
    }

    public function addAssetPurchase(float $totalAmount, float $paidAmount): void
    {
        $dueAmount = $totalAmount - $paidAmount;
        $this->increment('current_balance', $dueAmount);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithDue($query)
    {
        return $query->where('current_balance', '>', 0);
    }

    // Accessors
    public function getTotalAssetsAttribute()
    {
        return $this->assets()->count();
    }

    public function getTotalPurchasedAttribute()
    {
        return $this->assets()->sum('total_amount');
    }

    public function getTotalPaidAttribute()
    {
        return $this->payments()->sum('amount');
    }
}
