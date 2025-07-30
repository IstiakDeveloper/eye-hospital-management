<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpticsAccount extends Model
{
    protected $table = 'optics_account';
    protected $fillable = ['balance'];
    protected $casts = ['balance' => 'decimal:2'];

    // Relationships
    public function fundTransactions(): HasMany
    {
        return $this->hasMany(OpticsFundTransaction::class, 'id', 'id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(OpticsTransaction::class, 'id', 'id');
    }

    // Helper Methods
    public static function getBalance(): float
    {
        return self::first()?->balance ?? 0;
    }

    public static function addFund(float $amount, string $purpose, string $description): void
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        OpticsFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFI'),
            'type' => 'fund_in',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => now()->toDateString(),
            'added_by' => auth()->id(),
        ]);
    }

    public static function withdrawFund(float $amount, string $purpose, string $description): void
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        OpticsFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFO'),
            'type' => 'fund_out',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => now()->toDateString(),
            'added_by' => auth()->id(),
        ]);
    }

    public static function addIncome(float $amount, string $category, string $description, ?string $referenceType = null, ?int $referenceId = null): OpticsTransaction
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        return OpticsTransaction::create([
            'transaction_no' => self::generateVoucherNo('OI'),
            'type' => 'income',
            'amount' => $amount,
            'category' => $category,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
            'transaction_date' => now()->toDateString(),
            'created_by' => auth()->id(),
        ]);
    }

    public static function addExpense(float $amount, string $category, string $description, ?int $categoryId = null): OpticsTransaction
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        return OpticsTransaction::create([
            'transaction_no' => self::generateVoucherNo('OE'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => $category,
            'expense_category_id' => $categoryId,
            'description' => $description,
            'transaction_date' => now()->toDateString(),
            'created_by' => auth()->id(),
        ]);
    }

    private static function generateVoucherNo(string $prefix): string
    {
        return $prefix . '-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Report Methods
    public static function monthlyReport(int $year, int $month): array
    {
        $income = OpticsTransaction::where('type', 'income')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $expense = OpticsTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        return [
            'income' => $income,
            'expense' => $expense,
            'profit' => $income - $expense,
            'balance' => self::getBalance()
        ];
    }
}
