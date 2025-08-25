<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HospitalAccount extends Model
{
    protected $table = 'hospital_account';
    protected $fillable = ['balance'];
    protected $casts = ['balance' => 'decimal:2'];

    // Relationships
    public function fundTransactions(): HasMany
    {
        return $this->hasMany(HospitalFundTransaction::class, 'id', 'id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(HospitalTransaction::class, 'id', 'id');
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

        $fundTransaction = HospitalFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('HFI'),
            'type' => 'fund_in',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => now()->toDateString(),
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Debit Voucher (Money coming in)
        MainAccount::createDebitVoucher(
            amount: $amount,
            narration: "Hospital Fund In - {$purpose}: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'fund_in',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id
        );
    }

    public static function withdrawFund(float $amount, string $purpose, string $description): void
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $fundTransaction = HospitalFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('HFO'),
            'type' => 'fund_out',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => now()->toDateString(),
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Credit Voucher (Money going out)
        MainAccount::createCreditVoucher(
            amount: $amount,
            narration: "Hospital Fund Out - {$purpose}: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'fund_out',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id
        );
    }

    public static function addIncome(
        float $amount,
        string $category,
        string $description,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): HospitalTransaction {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $today = now()->toDateString();

        // 🔹 MainAccountVoucher check for today's hospital income
        $existingVoucher = MainAccountVoucher::where('source_account', 'hospital')
            ->where('source_transaction_type', 'income')
            ->whereDate('date', $today) // use voucher date, not created_at
            ->value('voucher_no');

        // Generate voucher_no for MainAccountVoucher if not exists
        $voucherNo = $existingVoucher ?? self::generateVoucherNo('HI');

        // ✅ Always create a new HospitalTransaction
        $transaction = HospitalTransaction::create([
            'transaction_no'   => 'HT-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT), // unique per transaction
            'type'             => 'income',
            'amount'           => $amount,
            'category'         => $category,
            'reference_type'   => $referenceType,
            'reference_id'     => $referenceId,
            'description'      => $description,
            'transaction_date' => $today,
            'created_by'       => auth()->id(),
        ]);

        // ✅ Create or update MainAccountVoucher
        if (!$existingVoucher) {
            MainAccount::createDebitVoucher(
                amount: $amount,
                narration: "Hospital Income - {$category}: {$description}",
                sourceAccount: 'hospital',
                sourceTransactionType: 'income',
                sourceVoucherNo: $voucherNo,
                sourceReferenceId: $transaction->id
            );
        } else {
            // Update voucher amount
            MainAccountVoucher::where('voucher_no', $voucherNo)->increment('amount', $amount);

            // ✅ Also increment MainAccount balance
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $amount);
        }

        return $transaction;
    }




    public static function addExpense(float $amount, string $category, string $description, ?int $categoryId = null): HospitalTransaction
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transaction = HospitalTransaction::create([
            'transaction_no' => self::generateVoucherNo('HE'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => $category,
            'expense_category_id' => $categoryId,
            'description' => $description,
            'transaction_date' => now()->toDateString(),
            'created_by' => auth()->id(),
        ]);

        // Create Main Account Credit Voucher (Money going out)
        MainAccount::createCreditVoucher(
            amount: $amount,
            narration: "Hospital Expense - {$category}: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'expense',
            sourceVoucherNo: $transaction->transaction_no,
            sourceReferenceId: $transaction->id
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
        $income = HospitalTransaction::where('type', 'income')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $expense = HospitalTransaction::where('type', 'expense')
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
