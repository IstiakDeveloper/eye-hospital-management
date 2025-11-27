<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationAccount extends Model
{
    protected $table = 'operation_account';
    protected $fillable = ['balance'];
    protected $casts = ['balance' => 'decimal:2'];

    // Relationships
    public function fundTransactions(): HasMany
    {
        return $this->hasMany(OperationFundTransaction::class, 'id', 'id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(OperationTransaction::class, 'id', 'id');
    }

    // Helper Methods
    public static function getBalance(): float
    {
        return (float) (self::first()?->balance ?? 0);
    }

    public static function addFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = OperationFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFI'),
            'type' => 'fund_in',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);


    }

    public static function withdrawFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = OperationFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFO'),
            'type' => 'fund_out',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);

        // Main Account integration removed - using Hospital Account only
    }

    public static function addIncome(
        float $amount,
        string $category,
        string $description,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $date = null
    ): OperationTransaction {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = OperationTransaction::create([
            'transaction_no' => self::generateVoucherNo('OI'),
            'type' => 'income',
            'amount' => $amount,
            'category' => $category,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        // Main Account integration removed - using Hospital Account only

        return $transaction;
    }

    public static function addExpense(
        float $amount,
        string $category,
        string $description,
        ?string $date = null
    ): OperationTransaction {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = OperationTransaction::create([
            'transaction_no' => self::generateVoucherNo('OE'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => $category,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        // Main Account integration removed - using Hospital Account only

        return $transaction;
    }

    private static function generateVoucherNo(string $prefix): string
    {
        return $prefix . '-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Report Methods
    public static function monthlyReport(int $year, int $month): array
    {
        $income = OperationTransaction::where('type', 'income')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $expense = OperationTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        return [
            'income' => (float) $income,
            'expense' => (float) $expense,
            'profit' => (float) ($income - $expense),
            'balance' => self::getBalance()
        ];
    }

    public static function getAccountSummary(): array
    {
        $totalIncome = OperationTransaction::where('type', 'income')->sum('amount');
        $totalExpense = OperationTransaction::where('type', 'expense')->sum('amount');

        return [
            'total_income' => (float) $totalIncome,
            'total_expense' => (float) $totalExpense,
            'net_balance' => (float) ($totalIncome - $totalExpense),
            'current_balance' => self::getBalance()
        ];
    }

    public static function getDailyReport(?string $date = null): array
    {
        $targetDate = $date ?? now()->toDateString();

        $income = OperationTransaction::where('type', 'income')
            ->whereDate('transaction_date', $targetDate)
            ->sum('amount');

        $expense = OperationTransaction::where('type', 'expense')
            ->whereDate('transaction_date', $targetDate)
            ->sum('amount');

        return [
            'date' => $targetDate,
            'income' => (float) $income,
            'expense' => (float) $expense,
            'net' => (float) ($income - $expense),
            'balance' => self::getBalance()
        ];
    }
}
