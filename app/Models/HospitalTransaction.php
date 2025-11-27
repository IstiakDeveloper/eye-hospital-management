<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalTransaction extends Model
{
    protected $fillable = [
        'transaction_no', 'type', 'amount', 'category', 'expense_category_id', 'income_category_id',
        'reference_type', 'reference_id', 'description', 'transaction_date', 'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date'
    ];

    public function expenseCategory(): BelongsTo
    {
        return $this->belongsTo(HospitalExpenseCategory::class);
    }

    public function incomeCategory(): BelongsTo
    {
        return $this->belongsTo(HospitalIncomeCategory::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeIncome($query)
    {
        return $query->where('type', 'income');
    }

    public function scopeExpense($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year);
    }
}
