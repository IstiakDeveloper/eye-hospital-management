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

    public function purchases(): HasMany
    {
        return $this->hasMany(FixedAssetPurchase::class, 'vendor_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FixedAssetVendorPayment::class, 'vendor_id');
    }

    public function makePayment(float $amount, string $description, string $paymentMethod = 'cash', ?string $referenceNo = null, ?string $date = null): FixedAssetVendorPayment
    {
        if ($amount > $this->current_balance) {
            throw new \Exception('Payment amount cannot exceed current balance');
        }

        $payment = $this->payments()->create([
            'payment_no' => FixedAssetVendorPayment::generatePaymentNo(),
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'reference_no' => $referenceNo,
            'description' => $description,
            'payment_date' => $date ?? now()->toDateString(),
            'created_by' => auth()->id(),
        ]);

        $this->decrement('current_balance', $amount);

        $expenseCategory = HospitalExpenseCategory::firstOrCreate(
            ['name' => 'Fixed Asset Vendor Payment'],
            ['is_active' => true]
        );

        HospitalAccount::addExpense(
            amount: $amount,
            category: 'Fixed Asset Vendor Payment',
            description: "Payment to {$this->name} - {$description}",
            categoryId: $expenseCategory->id,
            date: $date ?? now()->toDateString()
        );

        return $payment;
    }

    public function addAssetPurchase(float $totalAmount, float $paidAmount): void
    {
        $dueAmount = $totalAmount - $paidAmount;
        $this->increment('current_balance', $dueAmount);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithDue($query)
    {
        return $query->where('current_balance', '>', 0);
    }

    public function getTotalAssetsAttribute(): int
    {
        return $this->purchases()->distinct('fixed_asset_id')->count('fixed_asset_id');
    }

    public function getTotalPurchasedAttribute(): float
    {
        return (float) $this->purchases()->sum('total_amount');
    }

    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    /**
     * Outstanding due per purchase after applying vendor payments (FIFO by purchase date).
     *
     * @return array<int, float>
     */
    public function outstandingDueByPurchaseId(): array
    {
        $paymentPool = (float) $this->payments()->sum('amount');
        $outstanding = [];

        $purchases = $this->purchases()
            ->orderBy('purchase_date')
            ->orderBy('id')
            ->get(['id', 'due_amount']);

        foreach ($purchases as $purchase) {
            $due = (float) $purchase->due_amount;

            if ($due <= 0) {
                $outstanding[$purchase->id] = 0.0;

                continue;
            }

            $allocated = min($due, max(0, $paymentPool));
            $outstanding[$purchase->id] = round($due - $allocated, 2);
            $paymentPool = max(0, $paymentPool - $allocated);
        }

        return $outstanding;
    }
}
