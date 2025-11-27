<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\HospitalAccount;
use App\Models\HospitalTransaction;
use App\Models\HospitalFundTransaction;
use App\Models\HospitalIncomeCategory;
use App\Models\HospitalExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReceiptPaymentController extends Controller
{
    /**
     * Display Receipt & Payment Report
     * Shows receipts (incomes) and payments (expenses) with opening and closing bank balance
     */
    public function index(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        // Calculate Opening Bank Balance for Current Month (balance before fromDate)
        $currentOpeningBalance = $this->calculateOpeningBalance($fromDate);

        // Cumulative Opening Balance = Manual Adjustment (DB Balance - All Transactions up to toDate)
        $cumulativeOpeningBalance = $this->calculateCumulativeOpeningBalance($toDate);

        // Get ALL categories and their amounts
        $receipts = $this->getReceiptsWithAllCategories($fromDate, $toDate);
        $payments = $this->getPaymentsWithAllCategories($fromDate, $toDate);

        // Calculate Totals
        $currentMonthReceiptsTotal = collect($receipts)->sum('current_month');
        $cumulativeReceiptsTotal = collect($receipts)->sum('cumulative');

        $currentMonthPaymentsTotal = collect($payments)->sum('current_month');
        $cumulativePaymentsTotal = collect($payments)->sum('cumulative');

        // Calculate Closing Balances
        $currentClosingBalance = $currentOpeningBalance + $currentMonthReceiptsTotal - $currentMonthPaymentsTotal;
        $cumulativeClosingBalance = $cumulativeOpeningBalance + $cumulativeReceiptsTotal - $cumulativePaymentsTotal;

        // Verify calculations match
        $currentReceiptSideTotal = $currentOpeningBalance + $currentMonthReceiptsTotal;
        $currentPaymentSideTotal = $currentMonthPaymentsTotal + $currentClosingBalance;

        $cumulativeReceiptSideTotal = $cumulativeOpeningBalance + $cumulativeReceiptsTotal;
        $cumulativePaymentSideTotal = $cumulativePaymentsTotal + $cumulativeClosingBalance;

        return Inertia::render('Reports/ReceiptPayment', [
            'openingBalance' => [
                'current' => round($currentOpeningBalance, 2),
                'cumulative' => round($cumulativeOpeningBalance, 2),
            ],
            'closingBalance' => [
                'current' => round($currentClosingBalance, 2),
                'cumulative' => round($cumulativeClosingBalance, 2),
            ],
            'receipts' => $receipts,
            'payments' => $payments,
            'totals' => [
                'current_month_receipts' => round($currentMonthReceiptsTotal, 2),
                'cumulative_receipts' => round($cumulativeReceiptsTotal, 2),
                'current_month_payments' => round($currentMonthPaymentsTotal, 2),
                'cumulative_payments' => round($cumulativePaymentsTotal, 2),
                'current_receipt_side_total' => round($currentReceiptSideTotal, 2),
                'current_payment_side_total' => round($currentPaymentSideTotal, 2),
                'cumulative_receipt_side_total' => round($cumulativeReceiptSideTotal, 2),
                'cumulative_payment_side_total' => round($cumulativePaymentSideTotal, 2),
            ],
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
            'verification' => [
                'current_is_balanced' => round($currentReceiptSideTotal, 2) === round($currentPaymentSideTotal, 2),
                'current_difference' => round($currentReceiptSideTotal - $currentPaymentSideTotal, 2),
                'cumulative_is_balanced' => round($cumulativeReceiptSideTotal, 2) === round($cumulativePaymentSideTotal, 2),
                'cumulative_difference' => round($cumulativeReceiptSideTotal - $cumulativePaymentSideTotal, 2),
            ]
        ]);
    }

    /**
     * Get all receipts with ALL categories (showing 0 for categories with no transactions)
     */
    private function getReceiptsWithAllCategories(string $fromDate, string $toDate): array
    {
        $receipts = [];
        $serialNumber = 1;

        // 1. Get Fund In transactions
        $fundInCurrent = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select('purpose', DB::raw('SUM(amount) as amount'))
            ->groupBy('purpose')
            ->get()
            ->keyBy('purpose');

        $fundInCumulative = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<=', $toDate)
            ->select('purpose', DB::raw('SUM(amount) as amount'))
            ->groupBy('purpose')
            ->get()
            ->keyBy('purpose');

        // Get all unique fund in purposes
        $allFundInPurposes = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->distinct()
            ->pluck('purpose');

        foreach ($allFundInPurposes as $purpose) {
            $receipts[] = [
                'serial' => $serialNumber++,
                'category' => 'Fund In - ' . $purpose,
                'current_month' => (float) ($fundInCurrent[$purpose]->amount ?? 0),
                'cumulative' => (float) ($fundInCumulative[$purpose]->amount ?? 0),
                'type' => 'fund_in',
            ];
        }

        // 2. Get ALL income categories (including inactive ones for historical data)
        $allCategories = HospitalIncomeCategory::orderBy('name')->get();

        // Get current month amounts grouped by category
        $currentMonthData = DB::table('hospital_transactions')
            ->leftJoin('hospital_income_categories', 'hospital_transactions.income_category_id', '=', 'hospital_income_categories.id')
            ->where('hospital_transactions.type', 'income')
            ->whereBetween('hospital_transactions.transaction_date', [$fromDate, $toDate])
            ->select(
                'hospital_income_categories.id as category_id',
                DB::raw('SUM(hospital_transactions.amount) as amount')
            )
            ->whereNotNull('hospital_income_categories.id')
            ->groupBy('hospital_income_categories.id')
            ->pluck('amount', 'category_id');

        // Get cumulative amounts grouped by category
        $cumulativeData = DB::table('hospital_transactions')
            ->leftJoin('hospital_income_categories', 'hospital_transactions.income_category_id', '=', 'hospital_income_categories.id')
            ->where('hospital_transactions.type', 'income')
            ->where('hospital_transactions.transaction_date', '<=', $toDate)
            ->select(
                'hospital_income_categories.id as category_id',
                DB::raw('SUM(hospital_transactions.amount) as amount')
            )
            ->whereNotNull('hospital_income_categories.id')
            ->groupBy('hospital_income_categories.id')
            ->pluck('amount', 'category_id');

        // Build receipts array with ALL categories
        foreach ($allCategories as $category) {
            $receipts[] = [
                'serial' => $serialNumber++,
                'category' => $category->name,
                'current_month' => (float) ($currentMonthData[$category->id] ?? 0),
                'cumulative' => (float) ($cumulativeData[$category->id] ?? 0),
                'type' => 'income',
            ];
        }

        return $receipts;
    }

    /**
     * Get all payments with ALL categories (showing 0 for categories with no transactions)
     */
    private function getPaymentsWithAllCategories(string $fromDate, string $toDate): array
    {
        $payments = [];
        $serialNumber = 1;

        // 1. Get Fund Out transactions
        $fundOutCurrent = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select('purpose', DB::raw('SUM(amount) as amount'))
            ->groupBy('purpose')
            ->get()
            ->keyBy('purpose');

        $fundOutCumulative = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<=', $toDate)
            ->select('purpose', DB::raw('SUM(amount) as amount'))
            ->groupBy('purpose')
            ->get()
            ->keyBy('purpose');

        // Get all unique fund out purposes
        $allFundOutPurposes = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->distinct()
            ->pluck('purpose');

        foreach ($allFundOutPurposes as $purpose) {
            $payments[] = [
                'serial' => $serialNumber++,
                'category' => 'Fund Out - ' . $purpose,
                'current_month' => (float) ($fundOutCurrent[$purpose]->amount ?? 0),
                'cumulative' => (float) ($fundOutCumulative[$purpose]->amount ?? 0),
                'type' => 'fund_out',
            ];
        }


        // 2. Get expense transactions for special categories (Fixed Asset Purchase, Advance House Rent)
        // These can exist both WITH and WITHOUT expense_category_id, so we need to combine both

        // First, get special expense category names and IDs
        $specialExpenseCategories = HospitalExpenseCategory::whereIn('name', ['Fixed Asset Purchase', 'Advance House Rent'])
            ->get()
            ->keyBy('name');

        $specialExpenseNames = ['Fixed Asset Purchase', 'Advance House Rent'];
        $specialExpenseCategoryIds = $specialExpenseCategories->pluck('id')->toArray();

        // Get transactions WITHOUT expense_category_id
        $specialExpensesCurrentWithoutCat = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereNull('expense_category_id')
            ->whereIn('category', $specialExpenseNames)
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->select('category', DB::raw('SUM(amount) as amount'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $specialExpensesCumulativeWithoutCat = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereNull('expense_category_id')
            ->whereIn('category', $specialExpenseNames)
            ->where('transaction_date', '<=', $toDate)
            ->select('category', DB::raw('SUM(amount) as amount'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        // Get transactions WITH expense_category_id
        $specialExpensesCurrentWithCat = DB::table('hospital_transactions')
            ->leftJoin('hospital_expense_categories', 'hospital_transactions.expense_category_id', '=', 'hospital_expense_categories.id')
            ->where('hospital_transactions.type', 'expense')
            ->whereIn('hospital_transactions.expense_category_id', $specialExpenseCategoryIds)
            ->whereBetween('hospital_transactions.transaction_date', [$fromDate, $toDate])
            ->select('hospital_expense_categories.name as category', DB::raw('SUM(hospital_transactions.amount) as amount'))
            ->groupBy('hospital_expense_categories.name')
            ->get()
            ->keyBy('category');

        $specialExpensesCumulativeWithCat = DB::table('hospital_transactions')
            ->leftJoin('hospital_expense_categories', 'hospital_transactions.expense_category_id', '=', 'hospital_expense_categories.id')
            ->where('hospital_transactions.type', 'expense')
            ->whereIn('hospital_transactions.expense_category_id', $specialExpenseCategoryIds)
            ->where('hospital_transactions.transaction_date', '<=', $toDate)
            ->select('hospital_expense_categories.name as category', DB::raw('SUM(hospital_transactions.amount) as amount'))
            ->groupBy('hospital_expense_categories.name')
            ->get()
            ->keyBy('category');

        // Combine both types for each special expense category
        foreach ($specialExpenseNames as $categoryName) {
            $currentWithoutCat = (float) ($specialExpensesCurrentWithoutCat[$categoryName]->amount ?? 0);
            $currentWithCat = (float) ($specialExpensesCurrentWithCat[$categoryName]->amount ?? 0);
            $cumulativeWithoutCat = (float) ($specialExpensesCumulativeWithoutCat[$categoryName]->amount ?? 0);
            $cumulativeWithCat = (float) ($specialExpensesCumulativeWithCat[$categoryName]->amount ?? 0);

            // Only add if there are any transactions
            if ($currentWithoutCat + $currentWithCat + $cumulativeWithoutCat + $cumulativeWithCat > 0) {
                $payments[] = [
                    'serial' => $serialNumber++,
                    'category' => $categoryName,
                    'current_month' => $currentWithoutCat + $currentWithCat,
                    'cumulative' => $cumulativeWithoutCat + $cumulativeWithCat,
                    'type' => 'special_expense',
                ];
            }
        }

        // 3. Get ALL other expense categories (excluding special expense categories to avoid duplicates)
        $allCategories = HospitalExpenseCategory::whereNotIn('name', $specialExpenseNames)
            ->orderBy('name')
            ->get();

        // Get current month amounts grouped by category (only for transactions WITH expense_category_id)
        $currentMonthData = DB::table('hospital_transactions')
            ->leftJoin('hospital_expense_categories', 'hospital_transactions.expense_category_id', '=', 'hospital_expense_categories.id')
            ->where('hospital_transactions.type', 'expense')
            ->whereNotNull('hospital_transactions.expense_category_id')
            ->whereBetween('hospital_transactions.transaction_date', [$fromDate, $toDate])
            ->select(
                'hospital_expense_categories.id as category_id',
                DB::raw('SUM(hospital_transactions.amount) as amount')
            )
            ->whereNotNull('hospital_expense_categories.id')
            ->groupBy('hospital_expense_categories.id')
            ->pluck('amount', 'category_id');

        // Get cumulative amounts grouped by category (only for transactions WITH expense_category_id)
        $cumulativeData = DB::table('hospital_transactions')
            ->leftJoin('hospital_expense_categories', 'hospital_transactions.expense_category_id', '=', 'hospital_expense_categories.id')
            ->where('hospital_transactions.type', 'expense')
            ->whereNotNull('hospital_transactions.expense_category_id')
            ->where('hospital_transactions.transaction_date', '<=', $toDate)
            ->select(
                'hospital_expense_categories.id as category_id',
                DB::raw('SUM(hospital_transactions.amount) as amount')
            )
            ->whereNotNull('hospital_expense_categories.id')
            ->groupBy('hospital_expense_categories.id')
            ->pluck('amount', 'category_id');

        // Build payments array with ALL categories (excluding special expenses)
        foreach ($allCategories as $category) {
            $payments[] = [
                'serial' => $serialNumber++,
                'category' => $category->name,
                'current_month' => (float) ($currentMonthData[$category->id] ?? 0),
                'cumulative' => (float) ($cumulativeData[$category->id] ?? 0),
                'type' => 'expense',
            ];
        }

        return $payments;
    }

    /**
     * Calculate Opening Bank Balance (actual hospital account balance before the selected date range)
     * Uses actual hospital_account.balance and subtracts transactions from fromDate onwards
     */
    private function calculateOpeningBalance(string $fromDate): float
    {
        // Get current actual hospital account balance from database
        $currentBalance = HospitalAccount::getBalance();

        // Calculate transactions FROM fromDate to NOW (to subtract from current balance)
        $fundInsAfter = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '>=', $fromDate)
            ->sum('amount');

        $fundOutsAfter = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '>=', $fromDate)
            ->sum('amount');

        $incomesAfter = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '>=', $fromDate)
            ->sum('amount');

        $expensesAfter = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '>=', $fromDate)
            ->sum('amount');

        // Opening Balance = Current DB Balance - Net Change After fromDate
        // Because: Opening + NetChange = Current, so Opening = Current - NetChange
        $netChangeAfter = ($fundInsAfter + $incomesAfter) - ($fundOutsAfter + $expensesAfter);

        return $currentBalance - $netChangeAfter;
    }

    /**
     * Calculate Cumulative Opening Balance (manual adjustment to match actual DB balance)
     * This represents any manual balance adjustments or initial stock/inventory amounts
     * that were added directly to the account without transaction records.
     */
    private function calculateCumulativeOpeningBalance(string $toDate): float
    {
        // Get current actual hospital account balance
        $currentBalance = HospitalAccount::getBalance();

        // Calculate total from all transactions (from beginning to toDate)
        $fundIns = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<=', $toDate)
            ->sum('amount');

        $fundOuts = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<=', $toDate)
            ->sum('amount');

        $incomes = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<=', $toDate)
            ->sum('amount');

        $expenses = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<=', $toDate)
            ->sum('amount');

        $calculatedBalance = ($fundIns + $incomes) - ($fundOuts + $expenses);

        // Manual adjustment = Difference between actual and calculated
        // This represents stock payment, inventory, or other manual adjustments
        return $currentBalance - $calculatedBalance;
    }

    /**
     * Export Receipt & Payment Report as JSON
     */
    public function export(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $receipts = $this->getReceiptsWithAllCategories($fromDate, $toDate);
        $payments = $this->getPaymentsWithAllCategories($fromDate, $toDate);

        $currentMonthReceiptsTotal = collect($receipts)->sum('current_month');
        $cumulativeReceiptsTotal = collect($receipts)->sum('cumulative');
        $currentMonthPaymentsTotal = collect($payments)->sum('current_month');
        $cumulativePaymentsTotal = collect($payments)->sum('cumulative');
        $closingBalance = $openingBalance + $currentMonthReceiptsTotal - $currentMonthPaymentsTotal;

        return response()->json([
            'report_type' => 'Receipt & Payment',
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'opening_balance' => round($openingBalance, 2),
            'closing_balance' => round($closingBalance, 2),
            'receipts' => $receipts,
            'payments' => $payments,
            'receipts_totals' => [
                'current_month_total' => round($currentMonthReceiptsTotal, 2),
                'cumulative_total' => round($cumulativeReceiptsTotal, 2),
            ],
            'payments_totals' => [
                'current_month_total' => round($currentMonthPaymentsTotal, 2),
                'cumulative_total' => round($cumulativePaymentsTotal, 2),
            ],
            'grand_totals' => [
                'receipt_side' => round($openingBalance + $currentMonthReceiptsTotal, 2),
                'payment_side' => round($currentMonthPaymentsTotal + $closingBalance, 2),
            ],
            'generated_at' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Get detailed breakdown of receipts
     */
    public function getReceiptDetails(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $category = $request->category;
        $type = $request->type; // 'fund_in' or 'income'

        $details = [];

        if ($type === 'fund_in') {
            $details = DB::table('hospital_fund_transactions')
                ->where('type', 'fund_in')
                ->where('purpose', $category)
                ->whereBetween('date', [$fromDate, $toDate])
                ->select('voucher_no', 'date', 'purpose as category', 'description', 'amount')
                ->orderBy('date', 'desc')
                ->get();
        } else {
            $details = DB::table('hospital_transactions')
                ->where('type', 'income')
                ->where('category', $category)
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->select('transaction_no as voucher_no', 'transaction_date as date', 'category', 'description', 'amount')
                ->orderBy('transaction_date', 'desc')
                ->get();
        }

        return response()->json([
            'category' => $category,
            'type' => $type,
            'period' => ['from' => $fromDate, 'to' => $toDate],
            'details' => $details,
            'total' => $details->sum('amount'),
        ]);
    }

    /**
     * Get detailed breakdown of payments
     */
    public function getPaymentDetails(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $category = $request->category;
        $type = $request->type; // 'fund_out', 'expense', or 'special_expense'

        $details = [];

        if ($type === 'fund_out') {
            $details = DB::table('hospital_fund_transactions')
                ->where('type', 'fund_out')
                ->where('purpose', $category)
                ->whereBetween('date', [$fromDate, $toDate])
                ->select('voucher_no', 'date', 'purpose as category', 'description', 'amount')
                ->orderBy('date', 'desc')
                ->get();
        } elseif ($type === 'special_expense') {
            $details = DB::table('hospital_transactions')
                ->where('type', 'expense')
                ->where('category', $category)
                ->whereNull('expense_category_id')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->select('transaction_no as voucher_no', 'transaction_date as date', 'category', 'description', 'amount')
                ->orderBy('transaction_date', 'desc')
                ->get();
        } else {
            $details = DB::table('hospital_transactions')
                ->where('type', 'expense')
                ->where('category', $category)
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->select('transaction_no as voucher_no', 'transaction_date as date', 'category', 'description', 'amount')
                ->orderBy('transaction_date', 'desc')
                ->get();
        }

        return response()->json([
            'category' => $category,
            'type' => $type,
            'period' => ['from' => $fromDate, 'to' => $toDate],
            'details' => $details,
            'total' => $details->sum('amount'),
        ]);
    }
}
