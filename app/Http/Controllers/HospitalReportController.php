<?php

namespace App\Http\Controllers;

use App\Models\MedicalTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class HospitalReportController extends Controller
{
    public function dailyStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        // Calculate opening balance correctly
        // Manual opening balance: ৳1,14,613.00 (before any transactions)
        // Then add all fund in/out and transactions before fromDate
        $openingBalance = $this->calculateOpeningBalanceWithManual($fromDate);

        $dates = collect(range(strtotime($fromDate), strtotime($toDate), 86400))
            ->map(fn($ts) => date('Y-m-d', $ts));

        $funds = DB::table('hospital_fund_transactions')
            ->whereBetween('date', [$fromDate, $toDate])
            ->get();

        $transactions = DB::table('hospital_transactions')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->get();

        $dailyRows = [];
        $balance = $openingBalance;

        foreach ($dates as $date) {
            // CREDIT SIDE
            $fundIn = $funds->where('date', $date)->where('type', 'fund_in')->sum('amount');

            // Medicine Income (profit only)
            $medicineIncome = $transactions->where('transaction_date', $date)
                ->where('category', 'Medicine Income')
                ->sum('amount');

            // Optics Income (profit only)
            $opticsIncome = $transactions->where('transaction_date', $date)
                ->where('category', 'Optics Income')
                ->sum('amount');

            // Medical Test Income
            $medicalTestIncome = $transactions->where('transaction_date', $date)
                ->where('category', 'Medical Test')
                ->sum('amount');

            // OPD Income
            $opdIncome = $transactions->where('transaction_date', $date)
                ->where('category', 'OPD Income')
                ->sum('amount');

            // Operation Income
            $operationIncome = $transactions->where('transaction_date', $date)
                ->where('category', 'Operation Income')
                ->sum('amount');

            // Other Income (all other income categories)
            $otherIncome = $transactions->where('transaction_date', $date)
                ->where('type', 'income')
                ->whereNotIn('category', ['Medicine Income', 'Optics Income', 'Medical Test', 'OPD Income', 'Operation Income'])
                ->sum('amount');

            // DEBIT SIDE
            $fundOut = $funds->where('date', $date)->where('type', 'fund_out')->sum('amount');

            // Medicine Purchase
            $medicinePurchase = $transactions->where('transaction_date', $date)
                ->where('category', 'Medicine Purchase')
                ->sum('amount');

            // Optics Purchase
            $opticsPurchase = $transactions->where('transaction_date', $date)
                ->where('category', 'Optics Vendor Payment')
                ->sum('amount');

            // Fixed Assets
            $fixedAssets = $transactions->where('transaction_date', $date)
                ->whereIn('category', ['Fixed Asset Purchase', 'Fixed Asset Vendor Payment'])
                ->sum('amount');

            // Advance House Rent (from hospital transactions)
            $advanceHouseRent = $transactions->where('transaction_date', $date)
                ->where('category', 'Advance House Rent')
                ->sum('amount');

            // Other Expenses (all other expense categories except the ones already counted)
            $otherExpenses = $transactions->where('transaction_date', $date)
                ->where('type', 'expense')
                ->whereNotIn('category', ['Medicine Purchase', 'Optics Vendor Payment', 'Fixed Asset Purchase', 'Fixed Asset Vendor Payment', 'Advance House Rent'])
                ->sum('amount');

            $totalCredit = $fundIn + $medicineIncome + $opticsIncome + $medicalTestIncome + $opdIncome + $operationIncome + $otherIncome;
            $totalDebit = $fundOut + $medicinePurchase + $opticsPurchase + $fixedAssets + $advanceHouseRent + $otherExpenses;

            $balance += $totalCredit - $totalDebit;

            $dailyRows[] = [
                'date' => $date,
                // Credit
                'fund_in' => $fundIn,
                'medicine_income' => $medicineIncome,
                'optics_income' => $opticsIncome,
                'medical_test_income' => $medicalTestIncome,
                'opd_income' => $opdIncome,
                'operation_income' => $operationIncome,
                'other_income' => $otherIncome,
                'total_credit' => $totalCredit,
                // Debit
                'fund_out' => $fundOut,
                'advance_house_rent' => $advanceHouseRent,
                'medicine_purchase' => $medicinePurchase,
                'optics_purchase' => $opticsPurchase,
                'fixed_assets' => $fixedAssets,
                'other_expenses' => $otherExpenses,
                'total_debit' => $totalDebit,
                // Balance
                'balance' => $balance,
            ];
        }

        $totals = [
            // Credit
            'fund_in' => collect($dailyRows)->sum('fund_in'),
            'medicine_income' => collect($dailyRows)->sum('medicine_income'),
            'optics_income' => collect($dailyRows)->sum('optics_income'),
            'medical_test_income' => collect($dailyRows)->sum('medical_test_income'),
            'opd_income' => collect($dailyRows)->sum('opd_income'),
            'operation_income' => collect($dailyRows)->sum('operation_income'),
            'other_income' => collect($dailyRows)->sum('other_income'),
            'total_credit' => collect($dailyRows)->sum('total_credit'),
            // Debit
            'fund_out' => collect($dailyRows)->sum('fund_out'),
            'advance_house_rent' => collect($dailyRows)->sum('advance_house_rent'),
            'medicine_purchase' => collect($dailyRows)->sum('medicine_purchase'),
            'optics_purchase' => collect($dailyRows)->sum('optics_purchase'),
            'fixed_assets' => collect($dailyRows)->sum('fixed_assets'),
            'other_expenses' => collect($dailyRows)->sum('other_expenses'),
            'total_debit' => collect($dailyRows)->sum('total_debit'),
        ];

        return Inertia::render('HospitalCorner/Reports/DailyStatement', [
            'rows' => $dailyRows,
            'totals' => $totals,
            'openingBalance' => $openingBalance,
            'currentBalance' => DB::table('hospital_account')->value('balance') ?? 0,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    private function calculateOpeningBalanceWithManual(string $fromDate): float
    {
        // Manual opening balance before any transactions: ৳1,14,613.00
        $manualOpening = 114613.00;

        // Calculate all transactions before fromDate
        $fundIns = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $fundOuts = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $incomes = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        $expenses = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        return $manualOpening + $fundIns - $fundOuts + $incomes - $expenses;
    }

    public function accountStatement(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $openingBalance = $this->calculateOpeningBalanceWithManual($fromDate);
        $transactions = $this->getTransactions($fromDate, $toDate, $openingBalance);
        $summary = $this->calculateSummary($transactions, $openingBalance);
        $currentBalance = DB::table('hospital_account')->value('balance');

        return Inertia::render('HospitalCorner/Reports/AccountStatement', [
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
        $fundIns = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $fundOuts = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<', $fromDate)
            ->sum('amount');

        $incomes = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        $expenses = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<', $fromDate)
            ->sum('amount');

        return $fundIns - $fundOuts + $incomes - $expenses;
    }

    private function getTransactions(string $fromDate, string $toDate, float $openingBalance): array
    {
        $fundTransactions = DB::table('hospital_fund_transactions')
            ->leftJoin('users', 'hospital_fund_transactions.added_by', '=', 'users.id')
            ->whereBetween('date', [$fromDate, $toDate])
            ->select(
                'hospital_fund_transactions.id',
                'hospital_fund_transactions.voucher_no as reference_no',
                'hospital_fund_transactions.date as transaction_date',
                'hospital_fund_transactions.type',
                'hospital_fund_transactions.amount',
                'hospital_fund_transactions.purpose as description',
                DB::raw("'fund' as source"),
                'users.name as created_by_name'
            )
            ->get();

        $regularTransactions = DB::table('hospital_transactions')
            ->leftJoin('users', 'hospital_transactions.created_by', '=', 'users.id')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->select(
                'hospital_transactions.id',
                'hospital_transactions.transaction_no as reference_no',
                'hospital_transactions.transaction_date',
                'hospital_transactions.type',
                'hospital_transactions.amount',
                DB::raw("CONCAT(hospital_transactions.category, ' - ', hospital_transactions.description) as description"),
                DB::raw("'transaction' as source"),
                'users.name as created_by_name'
            )
            ->get();

        $allTransactions = $fundTransactions->merge($regularTransactions)
            ->sortBy('transaction_date')
            ->values();

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

        $openingBalance = $this->calculateOpeningBalanceWithManual($fromDate);
        $transactions = $this->getTransactions($fromDate, $toDate, $openingBalance);
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

    public function medicalTestIncomeReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        $reportData = MedicalTest::getIncomeReport($fromDate, $toDate, $search);

        // Add serial numbers
        foreach ($reportData as $index => $item) {
            $reportData[$index]['sl'] = $index + 1;
        }

        // Calculate totals
        $totals = [
            'total_tests' => collect($reportData)->sum('total_tests'),
            'total_original_price' => collect($reportData)->sum('total_original_price'),
            'total_discount' => collect($reportData)->sum('total_discount'),
            'total_income' => collect($reportData)->sum('total_income'),
            'total_paid' => collect($reportData)->sum('total_paid'),
            'total_due' => collect($reportData)->sum('total_due'),
        ];

        return Inertia::render('HospitalCorner/Reports/MedicalTestIncomeReport', [
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
