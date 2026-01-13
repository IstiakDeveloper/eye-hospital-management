<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OperationReportController extends Controller
{
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
        $summary = Operation::getIncomeReportSummary($fromDate, $toDate);

        return Inertia::render('OperationCorner/Reports/OperationIncomeReport', [
            'reportData' => $reportData,
            'summary' => $summary,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }
}
