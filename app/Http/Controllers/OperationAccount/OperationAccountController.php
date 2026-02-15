<?php

namespace App\Http\Controllers\OperationAccount;

use App\Http\Controllers\Controller;
use App\Models\OperationAccount;
use App\Models\OperationFundTransaction;
use App\Models\OperationTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OperationAccountController extends Controller
{
    // Dashboard
    public function index()
    {
        $balance = OperationAccount::getBalance();
        $monthlyReport = OperationAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = OperationTransaction::with('createdBy')
            ->latest('transaction_date')
            ->take(10)
            ->get();

        $recentFundTransactions = OperationFundTransaction::with('addedBy')
            ->latest('date')
            ->take(5)
            ->get();

        return Inertia::render('OperationAccount/Dashboard', compact(
            'balance',
            'monthlyReport',
            'recentTransactions',
            'recentFundTransactions'
        ));
    }

    // Fund In
    public function fundIn(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        OperationAccount::addFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date
        );

        return back()->with('success', 'Fund added successfully!');
    }

    // Fund Out
    public function fundOut(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > OperationAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        OperationAccount::withdrawFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date
        );

        return back()->with('success', 'Fund withdrawn successfully!');
    }

    // Add Expense
    public function addExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > OperationAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        OperationAccount::addExpense(
            $request->amount,
            $request->category,
            $request->description,
            $request->date
        );

        return back()->with('success', 'Expense added successfully!');
    }

    // Add Other Income
    public function addOtherIncome(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        OperationAccount::addIncome(
            $request->amount,
            $request->category,
            $request->description,
            null,
            null,
            $request->date
        );

        return back()->with('success', 'Income added successfully!');
    }

    // Transactions List
    public function transactions(Request $request)
    {
        $query = OperationTransaction::with('createdBy')->latest('transaction_date');

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('transaction_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('transaction_date', '<=', $request->end_date);
        }

        $transactions = $query->paginate(20);
        $balance = OperationAccount::getBalance();

        return Inertia::render('OperationAccount/Transactions', compact('transactions', 'balance'));
    }

    // Fund History
    public function fundHistory(Request $request)
    {
        $query = OperationFundTransaction::with('addedBy')->latest('date');

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $fundTransactions = $query->paginate(20);
        $balance = OperationAccount::getBalance();

        return Inertia::render('OperationAccount/FundHistory', compact('fundTransactions', 'balance'));
    }

    // Monthly Report
    public function monthlyReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        $monthlyData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyData[] = OperationAccount::monthlyReport($year, $m);
        }

        $currentMonthReport = OperationAccount::monthlyReport($year, $month);
        $balance = OperationAccount::getBalance();

        return Inertia::render('OperationAccount/MonthlyReport', compact(
            'monthlyData',
            'currentMonthReport',
            'balance',
            'year',
            'month'
        ));
    }

    // Balance Sheet
    public function balanceSheet()
    {
        $summary = OperationAccount::getAccountSummary();
        $balance = OperationAccount::getBalance();

        // Monthly breakdown for current year
        $year = now()->year;
        $monthlyBreakdown = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthlyBreakdown[] = OperationAccount::monthlyReport($year, $month);
        }

        // Category-wise expense breakdown
        $expensesByCategory = OperationTransaction::where('type', 'expense')
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        // Category-wise income breakdown
        $incomeByCategory = OperationTransaction::where('type', 'income')
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('OperationAccount/BalanceSheet', compact(
            'summary',
            'balance',
            'monthlyBreakdown',
            'expensesByCategory',
            'incomeByCategory',
            'year'
        ));
    }

    // Analytics
    public function analytics(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        // Daily trend
        $dailyTrend = OperationTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
                DB::raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expense')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top income categories
        $topIncomeCategories = OperationTransaction::where('type', 'income')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        // Top expense categories
        $topExpenseCategories = OperationTransaction::where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $balance = OperationAccount::getBalance();

        return Inertia::render('OperationAccount/Analytics', compact(
            'dailyTrend',
            'topIncomeCategories',
            'topExpenseCategories',
            'balance',
            'startDate',
            'endDate'
        ));
    }

    // Export Report
    public function exportReport(Request $request)
    {
        // TODO: Implement export functionality
        return back()->with('info', 'Export functionality coming soon!');
    }
}
