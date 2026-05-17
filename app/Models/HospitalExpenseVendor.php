<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HospitalExpenseVendor extends Model
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

    protected function casts(): array
    {
        return [
            'current_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function dueExpenses(): HasMany
    {
        return $this->hasMany(HospitalDueExpense::class, 'vendor_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(HospitalExpenseVendorPayment::class, 'vendor_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithDue($query)
    {
        return $query->where('current_balance', '>', 0);
    }

    /**
     * Outstanding due per expense after applying vendor payments (FIFO by expense date).
     *
     * @return array<int, float>
     */
    public function outstandingDueByExpenseId(): array
    {
        $paymentPool = (float) $this->payments()->sum('amount');
        $outstanding = [];

        $expenses = $this->dueExpenses()
            ->orderBy('expense_date')
            ->orderBy('id')
            ->get(['id', 'due_amount']);

        foreach ($expenses as $expense) {
            $due = (float) $expense->due_amount;

            if ($due <= 0) {
                $outstanding[$expense->id] = 0.0;

                continue;
            }

            $allocated = min($due, max(0, $paymentPool));
            $outstanding[$expense->id] = round($due - $allocated, 2);
            $paymentPool = max(0, $paymentPool - $allocated);
        }

        return $outstanding;
    }
}
