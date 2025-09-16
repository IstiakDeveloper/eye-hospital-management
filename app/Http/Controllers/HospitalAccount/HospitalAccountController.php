<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{HospitalAccount, HospitalFundTransaction, HospitalTransaction, HospitalExpenseCategory, MainAccount, MainAccountVoucher};
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

        // Add expense categories
        $expenseCategories = HospitalExpenseCategory::where('is_active', true)->get();

        return Inertia::render('HospitalAccount/Dashboard', compact(
            'balance',
            'monthlyReport',
            'recentTransactions',
            'recentFundTransactions',
            'expenseCategories'
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

        HospitalAccount::addFund(
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

        if ($request->amount > HospitalAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        HospitalAccount::withdrawFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date
        );

        return back()->with('success', 'Fund withdrawn successfully!');
    }

    // Add Expense - UPDATED
    public function addExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:hospital_expense_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > HospitalAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        // If expense_category_id is provided, get the category name from it
        $categoryName = $request->category;
        $categoryId = $request->expense_category_id;

        // If category ID is provided but category name is empty, get the name
        if ($categoryId && empty($categoryName)) {
            $category = HospitalExpenseCategory::find($categoryId);
            $categoryName = $category ? $category->name : $request->category;
        }

        // If category name is provided but no ID, try to find or create the category
        if (!$categoryId && $categoryName) {
            $category = HospitalExpenseCategory::firstOrCreate(
                ['name' => $categoryName],
                ['is_active' => true]
            );
            $categoryId = $category->id;
        }

        HospitalAccount::addExpense(
            amount: $request->amount,
            category: $categoryName,
            description: $request->description,
            categoryId: $categoryId,
            date: $request->date
        );

        return back()->with('success', 'Expense added successfully!');
    }

    public function transactions(Request $request)
    {
        $query = HospitalTransaction::with(['expenseCategory', 'createdBy']);

        // Apply filters
        if ($request->type) {
            $query->where('type', $request->type);
        }

        // Date range filtering
        if ($request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $transactions = $query->latest('transaction_date')->paginate(20);
        $transactions->appends(request()->query()); // Preserve query parameters in pagination links

        $categories = HospitalExpenseCategory::where('is_active', true)->get();

        // Pass current filters to the view
        $filters = [
            'type' => $request->type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'category' => $request->category,
        ];

        return Inertia::render('HospitalAccount/Transactions', compact('transactions', 'categories', 'filters'));
    }

    // Fund History
    public function fundHistory(Request $request)
    {
        $query = HospitalFundTransaction::with('addedBy');

        // Apply filters
        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->purpose) {
            $query->where('purpose', 'like', '%' . $request->purpose . '%');
        }

        $fundTransactions = $query->latest('date')->paginate(20);
        $fundTransactions->appends(request()->query());

        // Create fresh query builder instances for totals
        $fundInQuery = HospitalFundTransaction::query();
        $fundOutQuery = HospitalFundTransaction::query();

        // Apply same filters to both queries
        if ($request->type) {
            if ($request->type === 'fund_in') {
                $fundInQuery->where('type', 'fund_in');
                // Don't apply type filter to fundOutQuery if filtering by fund_in
            } elseif ($request->type === 'fund_out') {
                $fundOutQuery->where('type', 'fund_out');
                // Don't apply type filter to fundInQuery if filtering by fund_out
            } else {
                $fundInQuery->where('type', 'fund_in');
                $fundOutQuery->where('type', 'fund_out');
            }
        } else {
            $fundInQuery->where('type', 'fund_in');
            $fundOutQuery->where('type', 'fund_out');
        }

        if ($request->date_from) {
            $fundInQuery->whereDate('date', '>=', $request->date_from);
            $fundOutQuery->whereDate('date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $fundInQuery->whereDate('date', '<=', $request->date_to);
            $fundOutQuery->whereDate('date', '<=', $request->date_to);
        }

        if ($request->purpose) {
            $fundInQuery->where('purpose', 'like', '%' . $request->purpose . '%');
            $fundOutQuery->where('purpose', 'like', '%' . $request->purpose . '%');
        }

        // Calculate totals
        $totalFundIn = $request->type === 'fund_out' ? 0 : $fundInQuery->sum('amount');
        $totalFundOut = $request->type === 'fund_in' ? 0 : $fundOutQuery->sum('amount');

        $purposes = HospitalFundTransaction::distinct()
            ->whereNotNull('purpose')
            ->where('purpose', '!=', '')
            ->pluck('purpose')
            ->toArray();

        $filters = [
            'type' => $request->type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'purpose' => $request->purpose,
        ];

        $totals = [
            'total_fund_in' => $totalFundIn,
            'total_fund_out' => $totalFundOut,
            'net_fund' => $totalFundIn - $totalFundOut
        ];

        return Inertia::render('HospitalAccount/FundHistory', compact('fundTransactions', 'purposes', 'filters', 'totals'));
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

    public function addOtherIncome(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        HospitalAccount::addIncome(
            amount: $request->amount,
            category: $request->category,
            description: $request->description,
            referenceType: 'other_income',
            referenceId: null,
            date: $request->date
        );

        return back()->with('success', 'Other income added successfully!');
    }

    public function deleteFundTransaction(HospitalFundTransaction $fundTransaction)
    {
        // Reverse the fund transaction
        $account = HospitalAccount::firstOrCreate([]);

        if ($fundTransaction->type === 'fund_in') {
            // Reverse fund in - decrease balance
            $account->decrement('balance', $fundTransaction->amount);
        } else {
            // Reverse fund out - increase balance
            $account->increment('balance', $fundTransaction->amount);
        }

        // Find and delete the related main account voucher
        $mainAccountVoucher = MainAccountVoucher::where('source_voucher_no', $fundTransaction->voucher_no)
            ->where('source_account', 'hospital')
            ->where('source_reference_id', $fundTransaction->id)
            ->first();

        if ($mainAccountVoucher) {
            // Reverse main account balance
            $mainAccount = MainAccount::firstOrCreate([]);

            if ($fundTransaction->type === 'fund_in') {
                $mainAccount->decrement('balance', $fundTransaction->amount);
            } else {
                $mainAccount->increment('balance', $fundTransaction->amount);
            }

            $mainAccountVoucher->delete();
        }

        // Delete the fund transaction
        $fundTransaction->delete();

        return back()->with('success', 'Fund transaction deleted successfully!');
    }

}
