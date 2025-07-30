<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{HospitalAccount, HospitalFundTransaction, HospitalTransaction, HospitalExpenseCategory};
use Inertia\Inertia;
use DB;

class HospitalAccountController extends Controller
{
    // Dashboard
    public function index()
    {
        $balance = HospitalAccount::getBalance();
        $monthlyReport = HospitalAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = HospitalTransaction::with(['expenseCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = HospitalFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        return Inertia::render('HospitalAccount/Dashboard', compact(
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
        ]);

        HospitalAccount::addFund($request->amount, $request->purpose, $request->description);

        return back()->with('success', 'Fund added successfully!');
    }

    // Fund Out
    public function fundOut(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
        ]);

        if ($request->amount > HospitalAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        HospitalAccount::withdrawFund($request->amount, $request->purpose, $request->description);

        return back()->with('success', 'Fund withdrawn successfully!');
    }

    // Add Expense
    public function addExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:hospital_expense_categories,id',
            'description' => 'required|string|max:500',
        ]);

        if ($request->amount > HospitalAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        HospitalAccount::addExpense(
            $request->amount,
            $request->category,
            $request->description,
            $request->expense_category_id
        );

        return back()->with('success', 'Expense added successfully!');
    }

    // Transactions List
    public function transactions(Request $request)
    {
        $query = HospitalTransaction::with(['expenseCategory', 'createdBy']);

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->month && $request->year) {
            $query->whereMonth('transaction_date', $request->month)
                ->whereYear('transaction_date', $request->year);
        }

        $transactions = $query->latest('transaction_date')->paginate(20);
        $categories = HospitalExpenseCategory::active()->get();

        return Inertia::render('HospitalAccount/Transactions', compact('transactions', 'categories'));
    }

    // Fund History
    public function fundHistory()
    {
        $fundTransactions = HospitalFundTransaction::with('addedBy')
            ->latest('date')->paginate(20);

        return Inertia::render('HospitalAccount/FundHistory', compact('fundTransactions'));
    }

    // Expense Categories
    public function categories()
    {
        $categories = HospitalExpenseCategory::withCount('transactions')->get();

        return Inertia::render('HospitalAccount/Categories', compact('categories'));
    }

    // Store Category
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_expense_categories,name',
        ]);

        HospitalExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Category created successfully!');
    }

    // Update Category
    public function updateCategory(Request $request, HospitalExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_expense_categories,name,' . $category->id,
            'is_active' => 'boolean',
        ]);

        $category->update($request->only(['name', 'is_active']));

        return back()->with('success', 'Category updated successfully!');
    }

    // Monthly Report
    public function monthlyReport(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

        $report = HospitalAccount::monthlyReport($year, $month);

        $categoryExpenses = HospitalTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->with('expenseCategory')
            ->get()
            ->groupBy('expenseCategory.name')
            ->map(fn($items) => $items->sum('amount'));

        return Inertia::render('HospitalAccount/MonthlyReport', compact('report', 'categoryExpenses', 'year', 'month'));
    }

    // Balance Sheet
    public function balanceSheet()
    {
        $balance = HospitalAccount::getBalance();
        $totalIncome = HospitalTransaction::income()->sum('amount');
        $totalExpense = HospitalTransaction::expense()->sum('amount');
        $totalFundIn = HospitalFundTransaction::fundIn()->sum('amount');
        $totalFundOut = HospitalFundTransaction::fundOut()->sum('amount');

        return Inertia::render('HospitalAccount/BalanceSheet', compact(
            'balance',
            'totalIncome',
            'totalExpense',
            'totalFundIn',
            'totalFundOut'
        ));
    }
}
