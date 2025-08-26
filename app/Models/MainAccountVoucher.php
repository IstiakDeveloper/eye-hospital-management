<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MainAccountVoucher extends Model
{
    protected $fillable = [
        'voucher_no',
        'voucher_type',
        'date',
        'narration',
        'amount',
        'source_account',
        'source_transaction_type',
        'source_voucher_no',
        'source_reference_id',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date'
    ];

    // Relationships
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Accessors
    public function getSlNoAttribute(): int
    {
        return $this->id;
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2);
    }

    public function getSourceAccountNameAttribute(): string
    {
        return match ($this->source_account) {
            'hospital' => 'Hospital Account',
            'medicine' => 'Medicine Account',
            'optics' => 'Optics Account',
            default => ucfirst($this->source_account)
        };
    }

    public function getTransactionTypeNameAttribute(): string
    {
        return match ($this->source_transaction_type) {
            'income' => 'Income',
            'expense' => 'Expense',
            'fund_in' => 'Fund In',
            'fund_out' => 'Fund Out',
            default => ucfirst(str_replace('_', ' ', $this->source_transaction_type))
        };
    }

    // Scopes
    public function scopeDebit($query)
    {
        return $query->where('voucher_type', 'Debit');
    }

    public function scopeCredit($query)
    {
        return $query->where('voucher_type', 'Credit');
    }

    public function scopeBySourceAccount($query, string $account)
    {
        return $query->where('source_account', $account);
    }

    public function scopeByTransactionType($query, string $type)
    {
        return $query->where('source_transaction_type', $type);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('date', now()->month)
            ->whereYear('date', now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('date', now()->year);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Static methods for reporting
    public static function getRunningBalance($voucherId): float
    {
        $vouchers = self::where('id', '<=', $voucherId)
            ->orderBy('id')
            ->get();

        $balance = 0;
        foreach ($vouchers as $voucher) {
            if ($voucher->voucher_type === 'Credit') { // আসা (+)
                $balance += $voucher->amount;
            } else { // Debit - যাওয়া (-)
                $balance -= $voucher->amount;
            }
        }

        return $balance;
    }

    public static function getDailyTotals($date)
    {
        $debitTotal = self::where('date', $date)
            ->where('voucher_type', 'Debit')
            ->sum('amount'); // যাওয়া

        $creditTotal = self::where('date', $date)
            ->where('voucher_type', 'Credit')
            ->sum('amount'); // আসা

        return [
            'debit_total' => (float) $debitTotal,
            'credit_total' => (float) $creditTotal,
            'net_change' => (float) ($creditTotal - $debitTotal), // আসা - যাওয়া
            'voucher_count' => self::where('date', $date)->count()
        ];
    }
}
