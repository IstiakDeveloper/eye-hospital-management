<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationTransaction extends Model
{
    protected $fillable = [
        'transaction_no',
        'type',
        'amount',
        'category',
        'reference_type',
        'reference_id',
        'description',
        'transaction_date',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date'
    ];

    // Relationships
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

    public function scopeToday($query)
    {
        return $query->whereDate('transaction_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('transaction_date', now()->year);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Accessors
    public function getFormattedAmountAttribute(): string
    {
        return number_format((float)$this->amount, 2);
    }

    public function getTypeNameAttribute(): string
    {
        return $this->type === 'income' ? 'Income' : 'Expense';
    }

    // Statistics
    public static function getTodayIncome(): float
    {
        return (float) self::income()->today()->sum('amount');
    }

    public static function getTodayExpense(): float
    {
        return (float) self::expense()->today()->sum('amount');
    }

    public static function getMonthlyIncome(): float
    {
        return (float) self::income()->thisMonth()->sum('amount');
    }

    public static function getMonthlyExpense(): float
    {
        return (float) self::expense()->thisMonth()->sum('amount');
    }

    public static function getCategoryWiseReport(?string $startDate = null, ?string $endDate = null)
    {
        $query = self::query();

        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        } else {
            $query->thisMonth();
        }

        return $query->selectRaw('
            category,
            type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('category', 'type')
            ->get()
            ->groupBy('type');
    }
}
