<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_number',
        'expense_category_id',
        'amount',
        'description',
        'expense_date',
        'payment_method_id',
        'vendor_name',
        'receipt_number',
        'attachments',
        'approved_by',
        'status',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'attachments' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($expense) {
            if (!$expense->expense_number) {
                $date = now()->format('Ymd');
                $count = self::whereDate('created_at', now())->count();
                $expense->expense_number = 'EXP-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }

            if (!$expense->expense_date) {
                $expense->expense_date = today();
            }
        });
    }

    public function expenseCategory(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('expense_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year);
    }
}
