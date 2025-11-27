<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicineReportController extends Controller
{
    // public function dailyStatement(Request $request)
    // {
    //     $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
    //     $toDate = $request->to_date ?? now()->toDateString();

    //     $openingBalance = $this->calculateOpeningBalance($fromDate);
    //     $dates = collect(range(strtotime($fromDate), strtotime($toDate), 86400))
    //         ->map(fn($ts) => date('Y-m-d', $ts));

    //     $funds = DB::table('medicine_fund_transactions')
    //         ->whereBetween('date', [$fromDate, $toDate])
    //         ->get();

    //     $transactions = DB::table('medicine_transactions')
    //         ->whereBetween('transaction_date', [$fromDate, $toDate])
    //         ->get();

    //     $dailyRows = [];
    //     $balance = $openingBalance;

    //     foreach ($dates as $date) {
    //         $fundIn = $funds->where('date', $date)->where('type', 'fund_in')->sum('amount');
    //         $fundOut = $funds->where('date', $date)->where('type', 'fund_out')->sum('amount');

    //         $sales = $transactions->where('transaction_date', $date)
    //             ->where('type', 'income')
    //             ->where('category', 'Sales')
    //             ->sum('amount');

    //         $otherIncome = $transactions->where('transaction_date', $date)
    //             ->where('type', 'income')
    //             ->where('category', '!=', 'Sales')
    //             ->sum('amount');

    //         $purchases = $transactions->where('transaction_date', $date)
    //             ->where('type', 'expense')
    //             ->where('category', 'Purchase')
    //             ->sum('amount');

    //         $otherExpense = $transactions->where('transaction_date', $date)
    //             ->where('type', 'expense')
    //             ->where('category', '!=', 'Purchase')
    //             ->sum('amount');

    //         $totalCredit = $fundIn + $sales + $otherIncome;
    //         $totalDebit = $fundOut + $purchases + $otherExpense;

    //         $balance += $totalCredit - $totalDebit;

    //         $dailyRows[] = [
    //             'date' => $date,
    //             'fund_in' => $fundIn,
    //             'sales' => $sales,
    //             'other_income' => $otherIncome,
    //             'fund_out' => $fundOut,
    //             'purchases' => $purchases,
    //             'expense' => $otherExpense,
    //             'total_credit' => $totalCredit,
    //             'total_debit' => $totalDebit,
    //             'balance' => $balance,
    //         ];
    //     }

    //     $totals = [
    //         'fund_in' => $dailyRows ? collect($dailyRows)->sum('fund_in') : 0,
    //         'sales' => $dailyRows ? collect($dailyRows)->sum('sales') : 0,
    //         'other_income' => $dailyRows ? collect($dailyRows)->sum('other_income') : 0,
    //         'fund_out' => $dailyRows ? collect($dailyRows)->sum('fund_out') : 0,
    //         'purchases' => $dailyRows ? collect($dailyRows)->sum('purchases') : 0,
    //         'expense' => $dailyRows ? collect($dailyRows)->sum('expense') : 0,
    //         'total_credit' => $dailyRows ? collect($dailyRows)->sum('total_credit') : 0,
    //         'total_debit' => $dailyRows ? collect($dailyRows)->sum('total_debit') : 0,
    //     ];

    //     return Inertia::render('MedicineCorner/Reports/DailyStatement', [
    //         'rows' => $dailyRows,
    //         'totals' => $totals,
    //         'openingBalance' => $openingBalance,
    //         'filters' => [
    //             'from_date' => $fromDate,
    //             'to_date' => $toDate,
    //         ],
    //     ]);
    // }

    // public function accountStatement(Request $request)
    // {
    //     $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
    //     $toDate = $request->to_date ?? now()->toDateString();

    //     $openingBalance = $this->calculateOpeningBalance($fromDate);
    //     $transactions = $this->getTransactions($fromDate, $toDate);
    //     $summary = $this->calculateSummary($transactions, $openingBalance);
    //     $currentBalance = DB::table('medicine_account')->value('balance');

    //     return Inertia::render('MedicineCorner/Reports/AccountStatement', [
    //         'transactions' => $transactions,
    //         'summary' => $summary,
    //         'openingBalance' => $openingBalance,
    //         'currentBalance' => $currentBalance,
    //         'filters' => [
    //             'from_date' => $fromDate,
    //             'to_date' => $toDate,
    //         ],
    //     ]);
    // }

    // private function calculateOpeningBalance(string $fromDate): float
    // {
    //     $fundIns = DB::table('medicine_fund_transactions')
    //         ->where('type', 'fund_in')
    //         ->where('date', '<', $fromDate)
    //         ->sum('amount');

    //     $fundOuts = DB::table('medicine_fund_transactions')
    //         ->where('type', 'fund_out')
    //         ->where('date', '<', $fromDate)
    //         ->sum('amount');

    //     $incomes = DB::table('medicine_transactions')
    //         ->where('type', 'income')
    //         ->where('transaction_date', '<', $fromDate)
    //         ->sum('amount');

    //     $expenses = DB::table('medicine_transactions')
    //         ->where('type', 'expense')
    //         ->where('transaction_date', '<', $fromDate)
    //         ->sum('amount');

    //     return $fundIns - $fundOuts + $incomes - $expenses;
    // }

    // private function getTransactions(string $fromDate, string $toDate): array
    // {
    //     $fundTransactions = DB::table('medicine_fund_transactions')
    //         ->leftJoin('users', 'medicine_fund_transactions.added_by', '=', 'users.id')
    //         ->whereBetween('date', [$fromDate, $toDate])
    //         ->select(
    //             'medicine_fund_transactions.id',
    //             'medicine_fund_transactions.voucher_no as reference_no',
    //             'medicine_fund_transactions.date as transaction_date',
    //             'medicine_fund_transactions.type',
    //             'medicine_fund_transactions.amount',
    //             'medicine_fund_transactions.purpose as description',
    //             DB::raw("'fund' as source"),
    //             'users.name as created_by_name'
    //         )
    //         ->get();

    //     $regularTransactions = DB::table('medicine_transactions')
    //         ->leftJoin('users', 'medicine_transactions.created_by', '=', 'users.id')
    //         ->whereBetween('transaction_date', [$fromDate, $toDate])
    //         ->select(
    //             'medicine_transactions.id',
    //             'medicine_transactions.transaction_no as reference_no',
    //             'medicine_transactions.transaction_date',
    //             'medicine_transactions.type',
    //             'medicine_transactions.amount',
    //             DB::raw("CONCAT(medicine_transactions.category, ' - ', medicine_transactions.description) as description"),
    //             DB::raw("'transaction' as source"),
    //             'users.name as created_by_name'
    //         )
    //         ->get();

    //     $allTransactions = $fundTransactions->merge($regularTransactions)
    //         ->sortBy('transaction_date')
    //         ->values();

    //     $openingBalance = $this->calculateOpeningBalance($fromDate);
    //     $runningBalance = $openingBalance;

    //     return $allTransactions->map(function ($transaction) use (&$runningBalance) {
    //         $deposit = 0.0;
    //         $withdraw = 0.0;

    //         if ($transaction->source === 'fund') {
    //             if ($transaction->type === 'fund_in') {
    //                 $deposit = (float) $transaction->amount;
    //                 $runningBalance += (float) $transaction->amount;
    //             } else {
    //                 $withdraw = (float) $transaction->amount;
    //                 $runningBalance -= (float) $transaction->amount;
    //             }
    //         } else {
    //             if ($transaction->type === 'income') {
    //                 $deposit = (float) $transaction->amount;
    //                 $runningBalance += (float) $transaction->amount;
    //             } else {
    //                 $withdraw = (float) $transaction->amount;
    //                 $runningBalance -= (float) $transaction->amount;
    //             }
    //         }

    //         return [
    //             'id' => $transaction->id,
    //             'date' => $transaction->transaction_date,
    //             'reference_no' => $transaction->reference_no,
    //             'description' => $transaction->description,
    //             'deposit' => $deposit,
    //             'withdraw' => $withdraw,
    //             'balance' => round($runningBalance, 2),
    //             'created_by' => $transaction->created_by_name ?? 'System',
    //             'source' => $transaction->source,
    //         ];
    //     })->toArray();
    // }

    // private function calculateSummary(array $transactions, float $openingBalance): array
    // {
    //     $totalDeposit = 0;
    //     $totalWithdraw = 0;

    //     foreach ($transactions as $transaction) {
    //         $totalDeposit += $transaction['deposit'];
    //         $totalWithdraw += $transaction['withdraw'];
    //     }

    //     $closingBalance = $openingBalance + $totalDeposit - $totalWithdraw;

    //     return [
    //         'opening_balance' => $openingBalance,
    //         'total_deposit' => $totalDeposit,
    //         'total_withdraw' => $totalWithdraw,
    //         'closing_balance' => $closingBalance,
    //         'transaction_count' => count($transactions),
    //     ];
    // }

    // public function exportAccountStatement(Request $request)
    // {
    //     $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
    //     $toDate = $request->to_date ?? now()->toDateString();

    //     $openingBalance = $this->calculateOpeningBalance($fromDate);
    //     $transactions = $this->getTransactions($fromDate, $toDate);
    //     $summary = $this->calculateSummary($transactions, $openingBalance);

    //     return response()->json([
    //         'opening_balance' => $openingBalance,
    //         'transactions' => $transactions,
    //         'summary' => $summary,
    //         'period' => [
    //             'from' => $fromDate,
    //             'to' => $toDate,
    //         ],
    //     ]);
    // }

    /**
     * Buy-Sale-Stock Report
     */
    public function buySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        // Get report data
        $reportData = Medicine::getBuySaleStockReport($fromDate, $toDate, $search);

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;
            return $item;
        })->values()->toArray();

        // Calculate totals - use direct database values for accuracy
        $directTotals = DB::table('medicine_sales')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('
                SUM(subtotal) as total_subtotal,
                SUM(discount) as total_discount,
                SUM(total_amount) as total_amount,
                SUM(due_amount) as total_due
            ')
            ->first();

        // Calculate profit directly: Total Sales - Total Cost (100% accurate)
        $totalCost = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
            ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),

            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),

            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => round((float)$directTotals->total_subtotal, 2),
            'sale_discount' => round((float)$directTotals->total_discount, 2),
            'sale_total' => round((float)$directTotals->total_amount, 2),
            'sale_due' => round((float)$directTotals->total_due, 2),

            'available_stock' => collect($reportData)->sum('available_stock'),
            // Use getTotalStockValue() for accurate current stock value
            'available_value' => Medicine::getTotalStockValue(),

            'total_profit' => round((float)$directTotals->total_amount - $totalCost, 2),
        ];

        return Inertia::render('MedicineCorner/Reports/BuySaleStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }

}
