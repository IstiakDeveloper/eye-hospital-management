<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineVendor extends Model
{
    use HasFactory;

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
        'notes'
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'payment_terms_days' => 'integer',
    ];

    // Relationships
    public function transactions(): HasMany
    {
        return $this->hasMany(MedicineVendorTransaction::class, 'vendor_id');
    }

    public function purchases(): HasMany
    {
        return $this->transactions()->where('type', 'purchase');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MedicineVendorPayment::class, 'vendor_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(MedicineStock::class, 'vendor_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(MedicinePurchaseOrder::class, 'vendor_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithDues($query)
    {
        return $query->where('current_balance', '>', 0)->where('balance_type', 'due');
    }

    // Helper methods
    public function getTotalPurchasesAttribute()
    {
        return $this->purchases()->sum('amount');
    }

    public function getTotalPaymentsAttribute()
    {
        return $this->payments()->sum('amount');
    }

    public function getOverdueAmountAttribute()
    {
        return $this->transactions()
            ->where('type', 'purchase')
            ->where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->sum('due_amount');
    }

    public function updateBalance()
    {
        $totalPurchases = $this->purchases()->sum('amount');
        $totalPayments = $this->payments()->sum('amount');
        $balance = $totalPurchases - $totalPayments + $this->opening_balance;

        $this->update([
            'current_balance' => abs($balance),
            'balance_type' => $balance >= 0 ? 'due' : 'advance'
        ]);
    }
}
