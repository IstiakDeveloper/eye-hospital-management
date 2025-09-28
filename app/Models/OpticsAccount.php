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

    public static function addFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = OpticsFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFI'),
            'type' => 'fund_in',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Credit Voucher (Money coming in - RECEIPT)
        MainAccount::createCreditVoucher(
            amount: $amount,
            narration: "Optics Fund In - {$purpose}: {$description}",
            sourceAccount: 'optics',
            sourceTransactionType: 'fund_in',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id,
            date: $transactionDate
        );
    }

    public static function withdrawFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = OpticsFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('OFO'),
            'type' => 'fund_out',
            'amount' => $amount,
            'purpose' => $purpose,
            'description' => $description,
            'date' => $transactionDate,
            'added_by' => auth()->id(),
        ]);

        // Create Main Account Debit Voucher (Money going out - PAYMENT)
        MainAccount::createDebitVoucher(
            amount: $amount,
            narration: "Optics Fund Out - {$purpose}: {$description}",
            sourceAccount: 'optics',
            sourceTransactionType: 'fund_out',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id,
            date: $transactionDate
        );
    }

    public static function addIncome(float $amount, string $category, string $description, ?string $referenceType = null, ?int $referenceId = null, ?string $date = null): OpticsTransaction
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = OpticsTransaction::create([
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

        // Check if voucher already exists for this date for optics income
        $existingVoucher = MainAccountVoucher::where('source_account', 'optics')
            ->where('source_transaction_type', 'income')
            ->where('date', $transactionDate)
            ->first();

        if ($existingVoucher) {
            // Update existing voucher
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $amount);

            $existingVoucher->increment('amount', $amount);
            $existingVoucher->update([
                'narration' => $existingVoucher->narration . " + Optics Income - {$category}: {$description}",
            ]);
        } else {
            // Create new Main Account Credit Voucher (Money coming in - RECEIPT)
            MainAccount::createCreditVoucher(
                amount: $amount,
                narration: "Optics Income - {$category}: {$description}",
                sourceAccount: 'optics',
                sourceTransactionType: 'income',
                sourceVoucherNo: $transaction->transaction_no,
                sourceReferenceId: $transaction->id,
                date: $transactionDate
            );
        }

        return $transaction;
    }

    public static function addExpense(float $amount, string $category, string $description, ?int $categoryId = null, ?string $date = null): OpticsTransaction
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = OpticsTransaction::create([
            'transaction_no' => self::generateVoucherNo('OE'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => $category,
            'expense_category_id' => $categoryId,
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        // Create Main Account Debit Voucher (Money going out - PAYMENT)
        MainAccount::createDebitVoucher(
            amount: $amount,
            narration: "Optics Expense - {$category}: {$description}",
            sourceAccount: 'optics',
            sourceTransactionType: 'expense',
            sourceVoucherNo: $transaction->transaction_no,
            sourceReferenceId: $transaction->id,
            date: $transactionDate
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


    public static function updateTransaction(int $transactionId, float $newAmount, string $newCategory, string $newDescription): void
    {
        $transaction = OpticsTransaction::findOrFail($transactionId);
        $oldAmount = $transaction->amount;
        $amountDifference = $newAmount - $oldAmount;

        $account = self::firstOrCreate([]);

        // Update OpticsAccount balance
        if ($amountDifference > 0) {
            if ($transaction->type === 'income') {
                $account->increment('balance', $amountDifference);
            } else {
                $account->decrement('balance', $amountDifference);
            }
        } elseif ($amountDifference < 0) {
            if ($transaction->type === 'income') {
                $account->decrement('balance', abs($amountDifference));
            } else {
                $account->increment('balance', abs($amountDifference));
            }
        }

        // Update transaction record
        $transaction->update([
            'amount' => $newAmount,
            'category' => $newCategory,
            'description' => $newDescription,
        ]);

        // Find and update MainAccount voucher
        $voucher = MainAccountVoucher::where('source_account', 'optics')
            ->where('source_reference_id', $transactionId)
            ->first();

        if ($voucher && $amountDifference != 0) {
            $mainAccount = MainAccount::firstOrCreate([]);

            if ($amountDifference > 0) {
                if ($transaction->type === 'income') {
                    $mainAccount->increment('balance', $amountDifference);
                } else {
                    $mainAccount->decrement('balance', $amountDifference);
                }
            } else {
                if ($transaction->type === 'income') {
                    $mainAccount->decrement('balance', abs($amountDifference));
                } else {
                    $mainAccount->increment('balance', abs($amountDifference));
                }
            }

            $voucher->update([
                'amount' => $newAmount,
                'narration' => "Optics " . ucfirst($transaction->type) . " - {$newCategory}: {$newDescription}",
            ]);
        }
    }

    public static function deleteTransaction(int $transactionId): void
    {
        $transaction = OpticsTransaction::findOrFail($transactionId);
        $account = self::firstOrCreate([]);

        // Reverse OpticsAccount balance
        if ($transaction->type === 'income') {
            $account->decrement('balance', $transaction->amount);
        } else {
            $account->increment('balance', $transaction->amount);
        }

        // Find and delete MainAccount voucher
        $voucher = MainAccountVoucher::where('source_account', 'optics')
            ->where('source_reference_id', $transactionId)
            ->first();

        if ($voucher) {
            $mainAccount = MainAccount::firstOrCreate([]);

            // Reverse MainAccount balance
            if ($transaction->type === 'income') {
                $mainAccount->decrement('balance', $transaction->amount);
            } else {
                $mainAccount->increment('balance', $transaction->amount);
            }

            $voucher->delete();
        }

        // Delete transaction
        $transaction->delete();
    }

    public static function adjustAmount(float $amount, string $type, string $category, string $description): void
    {
        $account = self::firstOrCreate([]);

        if ($type === 'income') {
            $account->increment('balance', $amount);

            MainAccount::createCreditVoucher(
                $amount,
                "Optics Adjustment - {$category}: {$description}",
                'optics',
                'income'
            );
        } else {
            $account->decrement('balance', $amount);

            MainAccount::createDebitVoucher(
                $amount,
                "Optics Adjustment - {$category}: {$description}",
                'optics',
                'expense'
            );
        }
    }
}
