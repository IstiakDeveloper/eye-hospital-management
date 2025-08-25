<?php

namespace App\Http\Controllers\MedicineAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{MedicineAccount, MedicineFundTransaction, MedicineTransaction, MedicineExpenseCategory};
use Inertia\Inertia;
use DB;

class MedicineAccountController extends Controller
{
    // Dashboard
    public function index()
    {
        $balance = MedicineAccount::getBalance();
        $monthlyReport = MedicineAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = MedicineTransaction::with(['expenseCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = MedicineFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        // Add expense categories
        $expenseCategories = MedicineExpenseCategory::all(); // or ::pluck('name', 'id')

        return Inertia::render('MedicineAccount/Dashboard', compact(
            'balance',
            'monthlyReport',
            'recentTransactions',
            'recentFundTransactions',
            'expenseCategories' // <- Add this
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

        MedicineAccount::addFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date  // <- Add this parameter
        );

        return back()->with('success', 'Fund added successfully!');
    }

    public function fundOut(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        MedicineAccount::withdrawFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date  // <- Add this parameter
        );

        return back()->with('success', 'Fund withdrawn successfully!');
    }

    public function expense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        MedicineAccount::addExpense(
            $request->amount,
            $request->category,
            $request->description,
            null, // categoryId
            $request->date  // <- Add this parameter
        );

        return back()->with('success', 'Expense added successfully!');
    }


    // Add Expense
    public function addExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:medicine_expense_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > MedicineAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        MedicineAccount::addExpense(
            $request->amount,
            $request->category,
            $request->description,
            $request->expense_category_id,
            $request->date
        );

        return back()->with('success', 'Expense added successfully!');
    }

    // Transactions List
    public function transactions(Request $request)
    {
        $query = MedicineTransaction::with(['expenseCategory', 'createdBy']);

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->month && $request->year) {
            $query->whereMonth('transaction_date', $request->month)
                ->whereYear('transaction_date', $request->year);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $transactions = $query->latest('transaction_date')->paginate(20);
        $categories = MedicineExpenseCategory::active()->get();

        return Inertia::render('MedicineAccount/Transactions', compact('transactions', 'categories'));
    }

    // Fund History
    public function fundHistory()
    {
        $fundTransactions = MedicineFundTransaction::with('addedBy')
            ->latest('date')->paginate(20);

        return Inertia::render('MedicineAccount/FundHistory', compact('fundTransactions'));
    }

    // Expense Categories
    public function categories()
    {
        $categories = MedicineExpenseCategory::withCount('transactions')->get();

        return Inertia::render('MedicineAccount/Categories', compact('categories'));
    }

    // Store Category
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:medicine_expense_categories,name',
        ]);

        MedicineExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Category created successfully!');
    }

    // Update Category
    public function updateCategory(Request $request, MedicineExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:medicine_expense_categories,name,' . $category->id,
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

        $report = MedicineAccount::monthlyReport($year, $month);

        $categoryExpenses = MedicineTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->with('expenseCategory')
            ->get()
            ->groupBy('expenseCategory.name')
            ->map(fn($items) => $items->sum('amount'));

        // Medicine specific metrics
        $medicinePurchases = MedicineTransaction::where('type', 'expense')
            ->where('category', 'medicine_purchase')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $medicineSales = MedicineTransaction::where('type', 'income')
            ->where('category', 'medicine_sale')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        return Inertia::render('MedicineAccount/MonthlyReport', compact(
            'report',
            'categoryExpenses',
            'year',
            'month',
            'medicinePurchases',
            'medicineSales'
        ));
    }

    // Balance Sheet
    public function balanceSheet()
    {
        $balance = MedicineAccount::getBalance();
        $totalIncome = MedicineTransaction::income()->sum('amount');
        $totalExpense = MedicineTransaction::expense()->sum('amount');
        $totalFundIn = MedicineFundTransaction::fundIn()->sum('amount');
        $totalFundOut = MedicineFundTransaction::fundOut()->sum('amount');

        // Medicine specific metrics
        $totalMedicinePurchases = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');
        $totalMedicineSales = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');
        $medicineProfit = $totalMedicineSales - $totalMedicinePurchases;

        // Current month metrics
        $currentMonthPurchases = MedicineTransaction::where('category', 'medicine_purchase')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $currentMonthSales = MedicineTransaction::where('category', 'medicine_sale')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        return Inertia::render('MedicineAccount/BalanceSheet', compact(
            'balance',
            'totalIncome',
            'totalExpense',
            'totalFundIn',
            'totalFundOut',
            'totalMedicinePurchases',
            'totalMedicineSales',
            'medicineProfit',
            'currentMonthPurchases',
            'currentMonthSales'
        ));
    }

    // Medicine Business Analytics
    public function analytics(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

        // Monthly trend for last 12 months
        $monthlyTrend = MedicineTransaction::where('created_at', '>=', now()->subMonths(12))
            ->selectRaw('
            YEAR(transaction_date) as year,
            MONTH(transaction_date) as month,
            SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expense
        ')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        // Purchase vs Sales comparison
        $purchaseVsSales = MedicineTransaction::where('transaction_date', '>=', now()->subMonths(6))
            ->whereIn('category', ['medicine_purchase', 'medicine_sale'])
            ->selectRaw('
            DATE_FORMAT(transaction_date, "%Y-%m") as month,
            category,
            SUM(amount) as total
        ')
            ->groupBy('month', 'category')
            ->orderBy('month', 'desc')
            ->get();

        // Top expense categories
        $topExpenseCategories = MedicineTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->with('expenseCategory')
            ->get()
            ->groupBy('expenseCategory.name')
            ->map(fn($items) => [
                'category' => $items->first()->expenseCategory->name ?? 'Uncategorized',
                'amount' => $items->sum('amount'),
                'count' => $items->count()
            ])
            ->sortByDesc('amount')
            ->values();

        // ✅ Add missing variables
        $totalMedicineSales = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');
        $totalMedicinePurchases = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');

        // Profit margin analysis
        $profitMargin = $totalMedicineSales > 0 ?
            (($totalMedicineSales - $totalMedicinePurchases) / $totalMedicineSales) * 100 : 0;

        return Inertia::render('MedicineAccount/Analytics', compact(
            'monthlyTrend',
            'purchaseVsSales',
            'topExpenseCategories',
            'profitMargin',
            'year',
            'month'
        ));
    }

    // Stock Value Report
    public function stockValueReport()
    {
        // This would integrate with medicine stock to show current inventory value
        // vs account balance for reconciliation

        $accountBalance = MedicineAccount::getBalance();

        // Get total stock value from medicine stocks
        $totalStockValue = \DB::table('medicine_stocks')
            ->where('available_quantity', '>', 0)
            ->selectRaw('SUM(available_quantity * buy_price) as total_value')
            ->first()->total_value ?? 0;

        // Investment vs Current Stock Value
        $totalInvestment = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');
        $totalSold = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');

        return Inertia::render('MedicineAccount/StockValueReport', compact(
            'accountBalance',
            'totalStockValue',
            'totalInvestment',
            'totalSold'
        ));
    }

    // Export Reports
    public function exportReport(Request $request)
    {
        $type = $request->get('type', 'transactions');
        $format = $request->get('format', 'excel');

        // Implementation for exporting reports
        // This can use Laravel Excel or similar package

        return response()->json([
            'success' => true,
            'message' => 'Export functionality to be implemented',
            'type' => $type,
            'format' => $format
        ]);
    }
}
