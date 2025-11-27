<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OperationReportController extends Controller
{
    public function dailyStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $dates = collect(range(strtotime($fromDate), strtotime($toDate), 86400))
            ->map(fn($ts) => date('Y-m-d', $ts));

        $funds = DB::table('operation_fund_transactions')
            ->whereBetween('date', [$fromDate, $toDate])
            ->get();

        $transactions = DB::table('operation_transactions')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->get();

        $dailyRows = [];
        $balance = $openingBalance;

        foreach ($dates as $date) {
            $fundIn = $funds->where('date', $date)->where('type', 'fund_in')->sum('amount');
            $fundOut = $funds->where('date', $date)->where('type', 'fund_out')->sum('amount');

            $income = $transactions->where('transaction_date', $date)
                ->where('type', 'income')
                ->sum('amount');

            $expense = $transactions->where('transaction_date', $date)
                ->where('type', 'expense')
                ->sum('amount');

            $totalCredit = $fundIn + $income;
            $totalDebit = $fundOut + $expense;

            $balance += $totalCredit - $totalDebit;

            $dailyRows[] = [
                'date' => $date,
                'fund_in' => $fundIn,
                'income' => $income,
                'fund_out' => $fundOut,
                'expense' => $expense,
                'total_credit' => $totalCredit,
                'total_debit' => $totalDebit,
                'balance' => $balance,
            ];
        }

        $totals = [
            'fund_in' => $dailyRows ? collect($dailyRows)->sum('fund_in') : 0,
            'income' => $dailyRows ? collect($dailyRows)->sum('income') : 0,
            'fund_out' => $dailyRows ? collect($dailyRows)->sum('fund_out') : 0,
            'expense' => $dailyRows ? collect($dailyRows)->sum('expense') : 0,
            'total_credit' => $dailyRows ? collect($dailyRows)->sum('total_credit') : 0,
            'total_debit' => $dailyRows ? collect($dailyRows)->sum('total_debit') : 0,
        ];

        return Inertia::render('OperationCorner/Reports/DailyStatement', [
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

        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $transactions = $this->getTransactions($fromDate, $toDate);
        $summary = $this->calculateSummary($transactions, $openingBalance);
        $currentBalance = DB::table('operation_account')->value('balance');

        return Inertia::render('OperationCorner/Reports/AccountStatement', [
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
        $fundIns = DB::table('operation_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $fundOuts = DB::table('operation_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $incomes = DB::table('operation_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        $expenses = DB::table('operation_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        return $fundIns - $fundOuts + $incomes - $expenses;
    }

    private function getTransactions(string $fromDate, string $toDate): array
    {
        $fundTransactions = DB::table('operation_fund_transactions')
            ->leftJoin('users', 'operation_fund_transactions.added_by', '=', 'users.id')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select(
                'operation_fund_transactions.id',
                'operation_fund_transactions.voucher_no as reference_no',
                'operation_fund_transactions.date as transaction_date',
                'operation_fund_transactions.type',
                'operation_fund_transactions.amount',
                'operation_fund_transactions.purpose as description',
                DB::raw("'fund' as source"),
                'users.name as created_by_name'
            )
            ->get();

        $regularTransactions = DB::table('operation_transactions')
            ->leftJoin('users', 'operation_transactions.created_by', '=', 'users.id')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->select(
                'operation_transactions.id',
                'operation_transactions.transaction_no as reference_no',
                'operation_transactions.transaction_date',
                'operation_transactions.type',
                'operation_transactions.amount',
                DB::raw("CONCAT(operation_transactions.category, ' - ', operation_transactions.description) as description"),
                DB::raw("'transaction' as source"),
                'users.name as created_by_name'
            )
            ->get();

        $allTransactions = $fundTransactions->merge($regularTransactions)
            ->sortBy('transaction_date')
            ->values();

        $openingBalance = $this->calculateOpeningBalance($fromDate);
        $runningBalance = $openingBalance;

        return $allTransactions->map(function ($transaction) use (&$runningBalance) {
            $deposit = 0.0;
            $withdraw = 0.0;

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

    public function operationIncomeReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        $reportData = Operation::getIncomeReport($fromDate, $toDate, $search);

        // Add serial numbers
        foreach ($reportData as $index => $item) {
            $reportData[$index]['sl'] = $index + 1;
        }

        // Calculate totals
        $totals = [
            'total_bookings' => collect($reportData)->sum('total_bookings'),
            'scheduled' => collect($reportData)->sum('scheduled'),
            'confirmed' => collect($reportData)->sum('confirmed'),
            'completed' => collect($reportData)->sum('completed'),
            'total_original_price' => collect($reportData)->sum('total_original_price'),
            'total_discount' => collect($reportData)->sum('total_discount'),
            'total_income' => collect($reportData)->sum('total_income'),
            'total_paid' => collect($reportData)->sum('total_paid'),
            'total_due' => collect($reportData)->sum('total_due'),
        ];

        return Inertia::render('OperationCorner/Reports/OperationIncomeReport', [
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
