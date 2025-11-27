<?php

namespace App\Traits;

use App\Models\MainAccount;

trait HasAccountVouchers
{
    /**
     * Create main account voucher entry when transaction occurs
     */
    protected static function createMainAccountVoucher(
        string $voucherType, // 'Debit' or 'Credit'
        float $amount,
        string $narration,
        string $sourceAccount, // 'hospital', 'medicine', 'optics'
        string $sourceTransactionType, // 'income', 'expense', 'fund_in', 'fund_out'
        ?string $sourceVoucherNo = null,
        ?int $sourceReferenceId = null
    ) {
        if ($voucherType === 'Debit') {
            return MainAccount::createDebitVoucher(
                amount: $amount,
                narration: $narration,
                sourceAccount: $sourceAccount,
                sourceTransactionType: $sourceTransactionType,
                sourceVoucherNo: $sourceVoucherNo,
                sourceReferenceId: $sourceReferenceId
            );
        } else {
            return MainAccount::createCreditVoucher(
                amount: $amount,
                narration: $narration,
                sourceAccount: $sourceAccount,
                sourceTransactionType: $sourceTransactionType,
                sourceVoucherNo: $sourceVoucherNo,
                sourceReferenceId: $sourceReferenceId
            );
        }
    }

    /**
     * Generate narration text for different transaction types
     */
    protected static function generateNarration(
        string $sourceAccount,
        string $transactionType,
        string $category,
        string $description
    ): string {
        $accountName = match($sourceAccount) {
            'hospital' => 'Hospital',
            'medicine' => 'Medicine',
            'optics' => 'Optics',
            default => ucfirst($sourceAccount)
        };

        $typeText = match($transactionType) {
            'income' => 'Income',
            'expense' => 'Expense',
            'fund_in' => 'Fund In',
            'fund_out' => 'Fund Out',
            default => ucfirst(str_replace('_', ' ', $transactionType))
        };

        return "{$accountName} {$typeText} - {$category}: {$description}";
    }
}
