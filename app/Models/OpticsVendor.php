<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpticsVendor extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'trade_license',
        'opening_balance',
        'current_balance',
        'balance_type',
        'credit_limit',
        'payment_terms_days',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'payment_terms_days' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function transactions(): HasMany
    {
        return $this->hasMany(OpticsVendorTransaction::class, 'vendor_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(GlassesPurchase::class, 'vendor_id');
    }

    public function glasses(): HasMany
    {
        return $this->hasMany(Glasses::class, 'default_vendor_id');
    }

    // Helper Methods
    public function addPurchase(float $amount, string $description, ?int $referenceId = null): void
    {
        $previousBalance = $this->current_balance;

        if ($this->balance_type === 'due') {
            $this->increment('current_balance', $amount);
        } else {
            $this->decrement('current_balance', $amount);
        }

        OpticsVendorTransaction::create([
            'transaction_no' => $this->generateTransactionNo('OVPURCH'),
            'vendor_id' => $this->id,
            'type' => 'purchase',
            'amount' => $amount,
            'previous_balance' => $previousBalance,
            'new_balance' => $this->fresh()->current_balance,
            'reference_type' => 'glasses_purchase',
            'reference_id' => $referenceId,
            'description' => $description,
            'transaction_date' => now()->toDateString(),
            'created_by' => auth()->id(),
        ]);
    }

    public function addPayment(float $amount, string $description, int $paymentMethodId, ?string $date = null): OpticsVendorTransaction
    {
        $previousBalance = $this->current_balance;
        $transactionDate = $date ?? now()->toDateString();

        if ($this->balance_type === 'due') {
            $this->decrement('current_balance', $amount);
        } else {
            $this->increment('current_balance', $amount);
        }

        $transaction = OpticsVendorTransaction::create([
            'transaction_no' => $this->generateTransactionNo('OVPAY'),
            'vendor_id' => $this->id,
            'type' => 'payment',
            'amount' => $amount,
            'previous_balance' => $previousBalance,
            'new_balance' => $this->fresh()->current_balance,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'payment_method_id' => $paymentMethodId,
            'created_by' => auth()->id(),
        ]);

        // ✅ OpticsAccount এ expense করা হবে না - শুধু Hospital Account ব্যবহার হবে
        // Hospital Account expense already handled in controller

        return $transaction;
    }

    private function generateTransactionNo(string $prefix): string
    {
        return $prefix . '-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithDue($query)
    {
        return $query->where('balance_type', 'due')->where('current_balance', '>', 0);
    }

    public function scopeWithAdvance($query)
    {
        return $query->where('balance_type', 'advance')->where('current_balance', '>', 0);
    }
}
