<?php

namespace App\Http\Controllers\Optics;

use App\Http\Controllers\Controller;
use App\Models\OpticsAccount;
use App\Models\OpticsTransaction;
use App\Models\OpticsFundTransaction;
use App\Models\Glasses;
use App\Models\LensType;
use App\Models\CompleteGlasses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OpticsReportController extends Controller
{
    public function dailyStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        // Get opening balance
        $openingBalance = $this->calculateOpeningBalance($fromDate);

        // Get all dates in range
        $dates = collect(range(strtotime($fromDate), strtotime($toDate), 86400))
            ->map(fn($ts) => date('Y-m-d', $ts));

        // Get all fund transactions in range
        $funds = DB::table('optics_fund_transactions')
            ->whereBetween('date', [$fromDate, $toDate])
            ->get();

        // Get all regular transactions in range
        $transactions = DB::table('optics_transactions')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->get();

        // Group by date
        $dailyRows = [];
        $balance = $openingBalance;

        foreach ($dates as $date) {
            $fundIn = $funds->where('date', $date)->where('type', 'fund_in')->sum('amount');
            $fundOut = $funds->where('date', $date)->where('type', 'fund_out')->sum('amount');

            // Income breakdown
            $sales = $transactions->where('transaction_date', $date)
                ->where('type', 'income')
                ->where('category', 'Sales')
                ->sum('amount');

            $otherIncome = $transactions->where('transaction_date', $date)
                ->where('type', 'income')
                ->where('category', '!=', 'Sales')
                ->sum('amount');

            // Expense breakdown
            $purchases = $transactions->where('transaction_date', $date)
                ->where('type', 'expense')
                ->whereIn('category', ['Frame Purchase', 'Glasses Purchase', 'Lens types Purchase', 'Complete glasses Purchase'])
                ->sum('amount');

            $otherExpense = $transactions->where('transaction_date', $date)
                ->where('type', 'expense')
                ->whereNotIn('category', ['Frame Purchase', 'Glasses Purchase', 'Lens types Purchase', 'Complete glasses Purchase'])
                ->sum('amount');

            $totalCredit = $fundIn + $sales + $otherIncome;
            $totalDebit = $fundOut + $purchases + $otherExpense;

            $balance += $totalCredit - $totalDebit;

            $dailyRows[] = [
                'date' => $date,
                'fund_in' => $fundIn,
                'sales' => $sales,
                'other_income' => $otherIncome,
                'fund_out' => $fundOut,
                'purchases' => $purchases,
                'expense' => $otherExpense,
                'total_credit' => $totalCredit,
                'total_debit' => $totalDebit,
                'balance' => $balance,
            ];
        }

        // Totals
        $totals = [
            'fund_in' => $dailyRows ? collect($dailyRows)->sum('fund_in') : 0,
            'sales' => $dailyRows ? collect($dailyRows)->sum('sales') : 0,
            'other_income' => $dailyRows ? collect($dailyRows)->sum('other_income') : 0,
            'fund_out' => $dailyRows ? collect($dailyRows)->sum('fund_out') : 0,
            'purchases' => $dailyRows ? collect($dailyRows)->sum('purchases') : 0,
            'expense' => $dailyRows ? collect($dailyRows)->sum('expense') : 0,
            'total_credit' => $dailyRows ? collect($dailyRows)->sum('total_credit') : 0,
            'total_debit' => $dailyRows ? collect($dailyRows)->sum('total_debit') : 0,
        ];

        return Inertia::render('OpticsCorner/Reports/DailyStatement', [
            'rows' => $dailyRows,
            'totals' => $totals,
            'openingBalance' => $openingBalance,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    public function accountStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        // Get opening balance (before from_date)
        $openingBalance = $this->calculateOpeningBalance($fromDate);

        // Get all transactions within date range
        $transactions = $this->getTransactions($fromDate, $toDate);

        // Calculate summary
        $summary = $this->calculateSummary($transactions, $openingBalance);

        // Get current account balance
        $currentBalance = OpticsAccount::getBalance();

        return Inertia::render('OpticsCorner/Reports/AccountStatement', [
            'transactions' => $transactions,
            'summary' => $summary,
            'openingBalance' => $openingBalance,
            'currentBalance' => $currentBalance,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    private function calculateOpeningBalance(string $fromDate): float
    {
        // Get all fund transactions before from_date
        $fundIns = DB::table('optics_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $fundOuts = DB::table('optics_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        // Get all regular transactions before from_date
        $incomes = DB::table('optics_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        $expenses = DB::table('optics_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        return $fundIns - $fundOuts + $incomes - $expenses;
    }

    private function getTransactions(string $fromDate, string $toDate): array
    {
        // Get fund transactions
        $fundTransactions = DB::table('optics_fund_transactions')
            ->leftJoin('users', 'optics_fund_transactions.added_by', '=', 'users.id')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select(
                'optics_fund_transactions.id',
                'optics_fund_transactions.voucher_no as reference_no',
                'optics_fund_transactions.date as transaction_date',
                'optics_fund_transactions.type',
                'optics_fund_transactions.amount',
                'optics_fund_transactions.purpose as description',
                DB::raw("'fund' as source"),
                'users.name as created_by_name'
            )
            ->get();

        // Get regular transactions
        $regularTransactions = DB::table('optics_transactions')
            ->leftJoin('users', 'optics_transactions.created_by', '=', 'users.id')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->select(
                'optics_transactions.id',
                'optics_transactions.transaction_no as reference_no',
                'optics_transactions.transaction_date',
                'optics_transactions.type',
                'optics_transactions.amount',
                DB::raw("CONCAT(optics_transactions.category, ' - ', optics_transactions.description) as description"),
                DB::raw("'transaction' as source"),
                'users.name as created_by_name'
            )
            ->get();

        // Merge and sort by date
        $allTransactions = $fundTransactions->merge($regularTransactions)
            ->sortBy('transaction_date')
            ->values();

        // Calculate running balance
        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $runningBalance = $openingBalance;

        return $allTransactions->map(function ($transaction) use (&$runningBalance) {
            $deposit = 0.0;
            $withdraw = 0.0;

            // Determine deposit or withdraw
            if ($transaction->source === 'fund') {
                if ($transaction->type === 'fund_in') {
                    $deposit = (float) $transaction->amount;
                    $runningBalance += (float) $transaction->amount;
                } else {
                    $withdraw = (float) $transaction->amount;
                    $runningBalance -= (float) $transaction->amount;
                }
            } else {
                if ($transaction->type === 'income') {
                    $deposit = (float) $transaction->amount;
                    $runningBalance += (float) $transaction->amount;
                } else {
                    $withdraw = (float) $transaction->amount;
                    $runningBalance -= (float) $transaction->amount;
                }
            }

            return [
                'id' => $transaction->id,
                'date' => $transaction->transaction_date,
                'reference_no' => $transaction->reference_no,
                'description' => $transaction->description,
                'deposit' => $deposit,
                'withdraw' => $withdraw,
                'balance' => round($runningBalance, 2),
                'created_by' => $transaction->created_by_name ?? 'System',
                'source' => $transaction->source,
            ];
        })->toArray();
    }

    private function calculateSummary(array $transactions, float $openingBalance): array
    {
        $totalDeposit = 0;
        $totalWithdraw = 0;

        foreach ($transactions as $transaction) {
            $totalDeposit += $transaction['deposit'];
            $totalWithdraw += $transaction['withdraw'];
        }

        $closingBalance = $openingBalance + $totalDeposit - $totalWithdraw;

        return [
            'opening_balance' => $openingBalance,
            'total_deposit' => $totalDeposit,
            'total_withdraw' => $totalWithdraw,
            'closing_balance' => $closingBalance,
            'transaction_count' => count($transactions),
        ];
    }

    public function exportAccountStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $transactions = $this->getTransactions($fromDate, $toDate);
        $summary = $this->calculateSummary($transactions, $openingBalance);

        return response()->json([
            'opening_balance' => $openingBalance,
            'transactions' => $transactions,
            'summary' => $summary,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
        ]);
    }

    /**
     * Buy-Sale-Stock Report
     * Shows detailed stock movement report with before stock, purchases, sales, and available stock
     */
    public function buySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;
        $itemType = $request->item_type ?? 'all'; // 'all', 'glasses', 'lens_types', 'complete_glasses'

        $reportData = [];

        // Get Glasses (Frames) data
        if ($itemType === 'all' || $itemType === 'glasses') {
            $glassesData = Glasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($glassesData as $item) {
                $item['item_type'] = 'Frame';
                $reportData[] = $item;
            }
        }

        // Get Lens Types data
        if ($itemType === 'all' || $itemType === 'lens_types') {
            $lensTypesData = LensType::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($lensTypesData as $item) {
                $item['item_type'] = 'Lens';
                $reportData[] = $item;
            }
        }

        // Get Complete Glasses data
        if ($itemType === 'all' || $itemType === 'complete_glasses') {
            $completeGlassesData = CompleteGlasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($completeGlassesData as $item) {
                $item['item_type'] = 'Complete Glasses';
                $reportData[] = $item;
            }
        }

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;
            return $item;
        })->values()->toArray();

        // Get only fitting charge (sales without any items)
        $onlyFittingCharge = DB::table('optics_sales')
            ->whereNotExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('optics_sale_items')
                      ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->whereNull('deleted_at')
            ->sum('glass_fitting_price');

        // Calculate totals
        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),

            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),

            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => collect($reportData)->sum('sale_subtotal'),
            'sale_discount' => collect($reportData)->sum('sale_discount'),
            'sale_fitting' => collect($reportData)->sum('sale_fitting'),
            'sale_total' => collect($reportData)->sum('sale_total'),
            'sale_due' => collect($reportData)->sum('sale_due'),

            'available_stock' => collect($reportData)->sum('available_stock'),
            'available_value' => collect($reportData)->sum('available_value'),

            'total_profit' => collect($reportData)->sum('total_profit'),

            'only_fitting_charge' => (float) $onlyFittingCharge,
        ];

        return Inertia::render('OpticsCorner/Reports/BuySaleStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
                'item_type' => $itemType,
            ],
        ]);
    }

    /**
     * Export Buy-Sale-Stock Report as JSON
     */
    public function exportBuySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;
        $itemType = $request->item_type ?? 'all';

        $reportData = [];

        // Get data based on item type
        if ($itemType === 'all' || $itemType === 'glasses') {
            $glassesData = Glasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($glassesData as $item) {
                $item['item_type'] = 'Frame';
                $reportData[] = $item;
            }
        }

        if ($itemType === 'all' || $itemType === 'lens_types') {
            $lensTypesData = LensType::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($lensTypesData as $item) {
                $item['item_type'] = 'Lens';
                $reportData[] = $item;
            }
        }

        if ($itemType === 'all' || $itemType === 'complete_glasses') {
            $completeGlassesData = CompleteGlasses::getBuySaleStockReport($fromDate, $toDate, $search);
            foreach ($completeGlassesData as $item) {
                $item['item_type'] = 'Complete Glasses';
                $reportData[] = $item;
            }
        }

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;
            return $item;
        })->values()->toArray();

        // Get only fitting charge (sales without any items)
        $onlyFittingCharge = DB::table('optics_sales')
            ->whereNotExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('optics_sale_items')
                      ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
            })
            ->where('glass_fitting_price', '>', 0)
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
            ->whereNull('deleted_at')
            ->sum('glass_fitting_price');

        // Calculate totals
        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),
            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),
            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => collect($reportData)->sum('sale_subtotal'),
            'sale_discount' => collect($reportData)->sum('sale_discount'),
            'sale_total' => collect($reportData)->sum('sale_total'),
            'sale_due' => collect($reportData)->sum('sale_due'),
            'available_stock' => collect($reportData)->sum('available_stock'),
            'available_value' => collect($reportData)->sum('available_value'),
            'total_profit' => collect($reportData)->sum('total_profit'),
            'only_fitting_charge' => (float) $onlyFittingCharge,
        ];

        return response()->json([
            'report_data' => $reportData,
            'totals' => $totals,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'filters' => [
                'search' => $search,
                'item_type' => $itemType,
            ],
        ]);
    }

}
