<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineAccount extends Model
{
    protected $table = 'medicine_account';
    protected $fillable = ['balance'];
    protected $casts = ['balance' => 'decimal:2'];

    // Relationships
    public function fundTransactions(): HasMany
    {
        return $this->hasMany(MedicineFundTransaction::class, 'id', 'id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(MedicineTransaction::class, 'id', 'id');
    }

    // Helper Methods
    public static function getBalance(): float
    {
        return self::first()?->balance ?? 0;
    }

    public static function addFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = MedicineFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('MFI'),
            'type' => 'fund_in',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Debit Voucher (Money coming in) - Pass date parameter
        MainAccount::createDebitVoucher(
            amount: $amount,
            narration: "Medicine Fund In - {$purpose}: {$description}",
            sourceAccount: 'medicine',
            sourceTransactionType: 'fund_in',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id,
            date: $transactionDate  // <- Pass the transaction date
        );
    }

    public static function withdrawFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = MedicineFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('MFO'),
            'type' => 'fund_out',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Credit Voucher (Money going out) - Pass date parameter
        MainAccount::createCreditVoucher(
            amount: $amount,
            narration: "Medicine Fund Out - {$purpose}: {$description}",
            sourceAccount: 'medicine',
            sourceTransactionType: 'fund_out',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id,
            date: $transactionDate  // <- Pass the transaction date
        );
    }

    public static function addIncome(float $amount, string $category, string $description, ?string $referenceType = null, ?int $referenceId = null, ?string $date = null): MedicineTransaction
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = MedicineTransaction::create([
            'transaction_no' => self::generateVoucherNo('MI'),
            'type' => 'income',
            'amount' => $amount,
            'category' => $category,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        // Check if voucher already exists for this date for medicine income
        $existingVoucher = MainAccountVoucher::where('source_account', 'medicine')
            ->where('source_transaction_type', 'income')
            ->where('date', $transactionDate)
            ->first();

        if ($existingVoucher) {
            // Update existing voucher
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $amount);

            $existingVoucher->increment('amount', $amount);
            $existingVoucher->update([
                'narration' => $existingVoucher->narration . " + Medicine Income - {$category}: {$description}",
            ]);
        } else {
            // Create new Main Account Debit Voucher (Money coming in) - Pass date parameter
            MainAccount::createDebitVoucher(
                amount: $amount,
                narration: "Medicine Income - {$category}: {$description}",
                sourceAccount: 'medicine',
                sourceTransactionType: 'income',
                sourceVoucherNo: $transaction->transaction_no,
                sourceReferenceId: $transaction->id,
                date: $transactionDate  // <- Pass the transaction date
            );
        }

        return $transaction;
    }

    public static function addExpense(float $amount, string $category, string $description, ?int $categoryId = null, ?string $date = null): MedicineTransaction
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = MedicineTransaction::create([
            'transaction_no' => self::generateVoucherNo('ME'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => $category,
            'expense_category_id' => $categoryId,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        // Create Main Account Credit Voucher - Pass date parameter
        MainAccount::createCreditVoucher(
            amount: $amount,
            narration: "Medicine Expense - {$category}: {$description}",
            sourceAccount: 'medicine',
            sourceTransactionType: 'expense',
            sourceVoucherNo: $transaction->transaction_no,
            sourceReferenceId: $transaction->id,
            date: $transactionDate  // <- Pass the transaction date
        );

        return $transaction;
    }

    private static function generateVoucherNo(string $prefix): string
    {
        return $prefix . '-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    // Report Methods
    public static function monthlyReport(int $year, int $month): array
    {
        $income = MedicineTransaction::where('type', 'income')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $expense = MedicineTransaction::where('type', 'expense')
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
