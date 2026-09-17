<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereNotNull('expense_category_id')
            ->update(['expense_category_id' => null]);

        $opticsIncomeExpenseCategory = DB::table('hospital_expense_categories')
            ->where('name', 'Optics Income')
            ->first();

        if ($opticsIncomeExpenseCategory === null) {
            return;
        }

        $hasExpenseTransactions = DB::table('hospital_transactions')
            ->where('expense_category_id', $opticsIncomeExpenseCategory->id)
            ->where('type', 'expense')
            ->exists();

        if (! $hasExpenseTransactions) {
            DB::table('hospital_expense_categories')
                ->where('id', $opticsIncomeExpenseCategory->id)
                ->delete();
        }
    }

    public function down(): void
    {
        // Data correction cannot be reversed safely.
    }
};
