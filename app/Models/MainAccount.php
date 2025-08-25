<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MainAccount extends Model
{
    protected $fillable = ['balance'];
    protected $casts = ['balance' => 'decimal:2'];

    // Relationships
    public function vouchers(): HasMany
    {
        return $this->hasMany(MainAccountVoucher::class, 'id', 'id');
    }

    // Helper Methods
    public static function getBalance(): float
    {
        return self::first()?->balance ?? 0;
    }

    /**
     * Create a debit voucher entry (Money coming into main account)
     * This happens when sub-accounts receive income or fund_in
     */
    public static function createDebitVoucher(
        float $amount,
        string $narration,
        string $sourceAccount,
        string $sourceTransactionType,
        ?string $sourceVoucherNo = null,
        ?int $sourceReferenceId = null
    ): MainAccountVoucher {
        $account = self::firstOrCreate([]);
        $account->increment('balance', $amount);

        return MainAccountVoucher::create([
            'voucher_no' => self::generateVoucherNo(),
            'voucher_type' => 'Debit',
            'date' => now()->toDateString(),
            'narration' => $narration,
            'amount' => $amount,
            'source_account' => $sourceAccount,
            'source_transaction_type' => $sourceTransactionType,
            'source_voucher_no' => $sourceVoucherNo,
            'source_reference_id' => $sourceReferenceId,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Create a credit voucher entry (Money going out from main account)
     * This happens when sub-accounts have expenses or fund_out
     */
    public static function createCreditVoucher(
        float $amount,
        string $narration,
        string $sourceAccount,
        string $sourceTransactionType,
        ?string $sourceVoucherNo = null,
        ?int $sourceReferenceId = null
    ): MainAccountVoucher {
        $account = self::firstOrCreate([]);
        $account->decrement('balance', $amount);

        return MainAccountVoucher::create([
            'voucher_no' => self::generateVoucherNo(),
            'voucher_type' => 'Credit',
            'date' => now()->toDateString(),
            'narration' => $narration,
            'amount' => $amount,
            'source_account' => $sourceAccount,
            'source_transaction_type' => $sourceTransactionType,
            'source_voucher_no' => $sourceVoucherNo,
            'source_reference_id' => $sourceReferenceId,
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Generate auto-incremented voucher number
     */
    private static function generateVoucherNo(): string
    {
        $lastVoucher = MainAccountVoucher::orderBy('id', 'desc')->first();
        $nextNumber = $lastVoucher ? ((int) $lastVoucher->voucher_no) + 1 : 1;

        return str_pad($nextNumber, 2, '0', STR_PAD_LEFT);
    }

    // Report Methods
    public static function getVouchersByDateRange($startDate, $endDate)
    {
        return MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();
    }

    public static function getMonthlyReport(int $year, int $month): array
    {
        $debitTotal = MainAccountVoucher::where('voucher_type', 'Debit')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $creditTotal = MainAccountVoucher::where('voucher_type', 'Credit')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        return [
            'debit_total' => $debitTotal,
            'credit_total' => $creditTotal,
            'net_change' => $debitTotal - $creditTotal,
            'closing_balance' => self::getBalance()
        ];
    }

    public static function getAccountSummary(): array
    {
        $totalDebits = MainAccountVoucher::where('voucher_type', 'Debit')->sum('amount');
        $totalCredits = MainAccountVoucher::where('voucher_type', 'Credit')->sum('amount');

        return [
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'current_balance' => self::getBalance(),
            'total_vouchers' => MainAccountVoucher::count(),
        ];
    }

    public static function getSourceAccountSummary(): array
    {
        return MainAccountVoucher::selectRaw('
        source_account,
        source_transaction_type,
        SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE 0 END) as debit_total,
        SUM(CASE WHEN voucher_type = "Credit" THEN amount ELSE 0 END) as credit_total,
        COUNT(*) as transaction_count
    ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->groupBy('source_account')
            ->toArray();  // ✅ convert Collection to array
    }
}
