<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number',
        'type',
        'amount',
        'description',
        'account_category_id',
        'payment_method_id',
        'transaction_date',
        'reference_type',
        'reference_id',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            if (!$transaction->transaction_number) {
                $prefix = $transaction->type === 'income' ? 'INC' : 'EXP';
                $date = now()->format('Ymd');
                $count = self::where('type', $transaction->type)
                    ->whereDate('created_at', now())
                    ->count();

                $transaction->transaction_number = $prefix . '-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function accountCategory(): BelongsTo
    {
        return $this->belongsTo(AccountCategory::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

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
}
