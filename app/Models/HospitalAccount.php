<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HospitalAccount extends Model
{
    /**
     * Update an existing income transaction and its linked main account voucher.
     * Adjusts balances by the difference between old and new amount.
     */
    public static function updateIncome(
        HospitalTransaction $transaction,
        float $newAmount,
        string $newCategory,
        string $newDescription,
        ?int $newCategoryId = null
    ): void {
        $oldAmount = $transaction->amount;
        $diff = $newAmount - $oldAmount;
        $account = self::firstOrCreate([]);
        $account->increment('balance', $diff);

        // Update transaction
        $transaction->update([
            'amount' => $newAmount,
            'category' => $newCategory,
            'description' => $newDescription,
            'income_category_id' => $newCategoryId,
        ]);

        // 👉 Determine source_transaction_type the same way as addIncome
        $referenceType = $transaction->reference_type;
        $sourceTransactionType = in_array($referenceType, ['other_income', 'bank_interest', 'medicine_sale', 'optics_sale'])
            ? $referenceType
            : 'income';

        // Update MainAccountVoucher
        $voucher = MainAccountVoucher::where('source_account', 'hospital')
            ->where('source_transaction_type', $sourceTransactionType)
            ->where('source_voucher_no', $transaction->transaction_no)
            ->first();

        if ($voucher) {
            // Update main account balance by difference
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $diff);

            $voucher->increment('amount', $diff);
            $voucher->update([
                'narration' => "Hospital Income - {$newCategory}: {$newDescription}",
            ]);
        }
    }

    /**
     * Update an existing expense transaction and its linked main account voucher.
     * Adjusts balances by the difference between old and new amount.
     */
    public static function updateExpense(
        HospitalTransaction $transaction,
        float $newAmount,
        string $newCategory,
        string $newDescription,
        ?int $newCategoryId = null
    ): void {
        $oldAmount = $transaction->amount;
        $diff = $newAmount - $oldAmount;
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $diff * -1); // If diff is positive, decrease more; if negative, increase

        // Update transaction
        $transaction->update([
            'amount' => $newAmount,
            'category' => $newCategory,
            'description' => $newDescription,
            'expense_category_id' => $newCategoryId,
        ]);

        // Update MainAccountVoucher
        $voucher = MainAccountVoucher::where('source_account', 'hospital')
            ->where('source_transaction_type', 'expense')
            ->where('source_voucher_no', $transaction->transaction_no)
            ->first();
        if ($voucher) {
            $voucher->increment('amount', $diff);
            $voucher->update([
                'narration' => "Hospital Expense - {$newCategory}: {$newDescription}",
            ]);
        }
    }
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
    public static function getBalance(?string $asOnDate = null): float
    {
        if (!$asOnDate) {
            // Current balance from hospital_accounts table
            return self::first()?->balance ?? 0;
        }

        // Get opening balance (balance before any transactions)
        $currentBalance = self::first()?->balance ?? 0;

        $totalIncome = \DB::table('hospital_transactions')
            ->where('type', 'income')
            ->sum('amount');

        $totalExpense = \DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->sum('amount');

        $openingBalance = $currentBalance - ($totalIncome - $totalExpense);

        // Calculate balance up to specific date from transactions
        $incomeUpToDate = \DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<=', $asOnDate)
            ->sum('amount');

        $expenseUpToDate = \DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<=', $asOnDate)
            ->sum('amount');

        // Opening Balance + Income (up to date) - Expense (up to date)
        return $openingBalance + $incomeUpToDate - $expenseUpToDate;
    }

    public static function addFund(float $amount, string $purpose, string $description, ?string $date = null): void
    {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $fundTransaction = HospitalFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('HFI'),
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
            narration: "Hospital Fund In - {$purpose}: {$description}",
            sourceAccount: 'hospital',
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

        $fundTransaction = HospitalFundTransaction::create([
            'voucher_no' => self::generateVoucherNo('HFO'),
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
            narration: "Hospital Fund Out - {$purpose}: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'fund_out',
            sourceVoucherNo: $fundTransaction->voucher_no,
            sourceReferenceId: $fundTransaction->id,
            date: $transactionDate
        );
    }

    public static function addIncome(
        float $amount,
        string $category,
        string $description,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $date = null,
        ?int $incomeCategoryId = null
    ): HospitalTransaction {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        // If income category ID is provided but category name is empty, get the name
        if ($incomeCategoryId && empty($category)) {
            $incomeCategory = HospitalIncomeCategory::find($incomeCategoryId);
            $category = $incomeCategory ? $incomeCategory->name : $category;
        }

        // If category name is provided but no ID, try to find or create the category
        if (!$incomeCategoryId && $category) {
            $incomeCategory = HospitalIncomeCategory::firstOrCreate(
                ['name' => $category],
                ['is_active' => true]
            );
            $incomeCategoryId = $incomeCategory->id;
        }

        $transaction = HospitalTransaction::create([
            'transaction_no'   => 'HT-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'type'             => 'income',
            'amount'           => $amount,
            'category'         => $category,
            'income_category_id' => $incomeCategoryId,
            'reference_type'   => $referenceType,
            'reference_id'     => $referenceId,
            'description'      => $description,
            'transaction_date' => $transactionDate,
            'created_by'       => auth()->id(),
        ]);

        // 👉 Determine source_transaction_type dynamically
        $sourceTransactionType = in_array($referenceType, ['other_income', 'bank_interest', 'medicine_sale', 'optics_sale'])
            ? $referenceType
            : 'income';

        // Check if voucher already exists
        $existingVoucher = MainAccountVoucher::where('source_account', 'hospital')
            ->where('source_transaction_type', $sourceTransactionType)
            ->where('date', $transactionDate)
            ->first();

        if ($existingVoucher) {
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $amount);

            $existingVoucher->increment('amount', $amount);
            $existingVoucher->update([
                'narration' => $existingVoucher->narration . " + Hospital Income - {$category}: {$description}",
            ]);
        } else {
            // 👉 Use dynamic sourceTransactionType here
            MainAccount::createCreditVoucher(
                amount: $amount,
                narration: "Hospital Income - {$category}: {$description}",
                sourceAccount: 'hospital',
                sourceTransactionType: $sourceTransactionType,
                sourceVoucherNo: $transaction->transaction_no,
                sourceReferenceId: $transaction->id,
                date: $transactionDate
            );
        }

        return $transaction;
    }


    public static function addExpense(float $amount, string $category, string $description, ?int $categoryId = null, ?string $date = null): HospitalTransaction
    {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        $transaction = HospitalTransaction::create([
            'transaction_no' => self::generateVoucherNo('HE'),
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
            narration: "Hospital Expense - {$category}: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'expense',
            sourceVoucherNo: $transaction->transaction_no,
            sourceReferenceId: $transaction->id,
            date: $transactionDate
        );

        return $transaction;
    }

    /**
     * Update an existing patient payment transaction and its linked main account voucher.
     * Adjusts balances by the difference between old and new amount.
     */
    public static function updatePatientPayment(
        HospitalTransaction $transaction,
        float $newAmount,
        string $newDescription
    ): void {
        $oldAmount = $transaction->amount;
        $diff = $newAmount - $oldAmount;

        // Update hospital account balance
        $account = self::firstOrCreate([]);
        $account->increment('balance', $diff);

        // Update transaction
        $transaction->update([
            'amount' => $newAmount,
            'description' => $newDescription,
        ]);

        // 👉 Determine source_transaction_type the same way as addIncome
        $referenceType = $transaction->reference_type;
        $sourceTransactionType = in_array($referenceType, ['other_income', 'bank_interest']) ? $referenceType : 'income';

        \Log::info('🔍 Searching for voucher:', [
            'source_account' => 'hospital',
            'source_transaction_type' => $sourceTransactionType,
            'source_voucher_no' => $transaction->transaction_no,
            'reference_type' => $referenceType,
        ]);

        // Update MainAccountVoucher - Try by transaction_no first
        $voucher = MainAccountVoucher::where('source_account', 'hospital')
            ->where('source_transaction_type', $sourceTransactionType)
            ->where('source_voucher_no', $transaction->transaction_no)
            ->first();

        // If not found by transaction_no, try by source_reference_id (transaction id)
        if (!$voucher) {
            \Log::info('🔍 Voucher not found by transaction_no, trying by source_reference_id...', [
                'transaction_id' => $transaction->id
            ]);

            $voucher = MainAccountVoucher::where('source_account', 'hospital')
                ->where('source_transaction_type', $sourceTransactionType)
                ->where('source_reference_id', $transaction->id)
                ->first();
        }

        if ($voucher) {
            \Log::info('✅ Voucher found! Updating...', ['voucher_id' => $voucher->id]);

            // Update main account balance
            $mainAccount = MainAccount::firstOrCreate([]);
            $mainAccount->increment('balance', $diff);

            // Update voucher amount and narration
            $voucher->update([
                'amount' => $newAmount,
                'narration' => "Hospital Income - patient_payment: {$newDescription}",
            ]);

            \Log::info('✅ Main account and voucher updated successfully');
        } else {
            \Log::warning('❌ Voucher NOT FOUND! Main account NOT updated');
            \Log::warning('Available vouchers for hospital:',
                MainAccountVoucher::where('source_account', 'hospital')
                    ->select('id', 'source_transaction_type', 'source_voucher_no', 'source_reference_id')
                    ->get()
                    ->toArray()
            );
        }
    }

    /**
     * Create a fixed asset purchase record.
     * Deducts initial payment from hospital account if any.
     */
    public static function createFixedAsset(
        string $name,
        string $description,
        float $totalAmount,
        float $paidAmount = 0,
        ?string $date = null,
        ?int $vendorId = null
    ): FixedAsset {
        $transactionDate = $date ?? now()->toDateString();

        // Deduct initial payment from hospital account if any
        if ($paidAmount > 0) {
            $account = self::firstOrCreate([]);
            $account->decrement('balance', $paidAmount);

            // Create expense transaction for initial payment
            $transaction = HospitalTransaction::create([
                'transaction_no' => self::generateVoucherNo('HE'),
                'type' => 'expense',
                'amount' => $paidAmount,
                'category' => 'Fixed Asset Purchase',
                'description' => "{$name} - Initial Payment: {$description}",
                'transaction_date' => $transactionDate,
                'created_by' => auth()->id(),
            ]);

            // Create Main Account Debit Voucher
            MainAccount::createDebitVoucher(
                amount: $paidAmount,
                narration: "Fixed Asset Purchase - {$name}: {$description}",
                sourceAccount: 'hospital',
                sourceTransactionType: 'fixed_asset_purchase',
                sourceVoucherNo: $transaction->transaction_no,
                sourceReferenceId: $transaction->id,
                date: $transactionDate
            );
        }

        // Create fixed asset record
        $asset = FixedAsset::create([
            'vendor_id' => $vendorId,
            'name' => $name,
            'description' => $description,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'due_amount' => $totalAmount - $paidAmount,
            'purchase_date' => $transactionDate,
            'created_by' => auth()->id(),
        ]);

        return $asset;
    }

    /**
     * Add advance house rent payment.
     * Deducts from Hospital Account and Main Account.
     */
    public static function addAdvanceRent(
        float $amount,
        string $description,
        ?string $date = null
    ): AdvanceHouseRent {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        $transactionDate = $date ?? now()->toDateString();

        // Create advance rent record
        $advanceRent = AdvanceHouseRent::create([
            'advance_amount' => $amount,
            'used_amount' => 0,
            'remaining_amount' => $amount,
            'status' => 'active',
            'description' => $description,
            'payment_date' => $transactionDate,
            'created_by' => auth()->id() ?? 1,
        ]);

        // Create expense transaction
        $transaction = HospitalTransaction::create([
            'transaction_no' => self::generateVoucherNo('HE'),
            'type' => 'expense',
            'amount' => $amount,
            'category' => 'Advance House Rent',
            'description' => $description,
            'transaction_date' => $transactionDate,
            'created_by' => auth()->id() ?? 1,
            'reference_type' => 'advance_rent',
            'reference_id' => $advanceRent->id,
        ]);

        // Create Main Account Debit Voucher
        MainAccount::createDebitVoucher(
            amount: $amount,
            narration: "Advance House Rent Payment: {$description}",
            sourceAccount: 'hospital',
            sourceTransactionType: 'advance_rent',
            sourceVoucherNo: $transaction->transaction_no,
            sourceReferenceId: $advanceRent->id,
            date: $transactionDate
        );

        return $advanceRent;
    }

    /**
     * Deduct monthly rent from advance balance.
     * NO account deduction - only advance balance adjustment.
     */
    public static function deductMonthlyRent(
        AdvanceHouseRent $advanceRent,
        float $amount,
        int $month,
        int $year,
        ?string $notes = null
    ): AdvanceHouseRentDeduction {
        // Deduct from advance rent balance (NO hospital account deduction)
        $deduction = $advanceRent->deduct($amount, $month, $year, $notes);

        return $deduction;
    }

    /**
     * Get total advance house rent balance available.
     */
    public static function getAdvanceRentBalance(): float
    {
        return AdvanceHouseRent::getActiveBalance();
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
