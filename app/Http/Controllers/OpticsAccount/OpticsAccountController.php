<?php

namespace App\Http\Controllers\OpticsAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{OpticsAccount, OpticsFundTransaction, OpticsTransaction, OpticsExpenseCategory};
use Inertia\Inertia;
use DB;

class OpticsAccountController extends Controller
{
    // Dashboard
    public function index()
    {
        $balance = OpticsAccount::getBalance();
        $monthlyReport = OpticsAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = OpticsTransaction::with(['expenseCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = OpticsFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        return Inertia::render('OpticsAccount/Dashboard', compact(
            'balance', 'monthlyReport', 'recentTransactions', 'recentFundTransactions'
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

        OpticsAccount::addFund($request->amount, $request->purpose, $request->description);

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

        if ($request->amount > OpticsAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        OpticsAccount::withdrawFund($request->amount, $request->purpose, $request->description);

        return back()->with('success', 'Fund withdrawn successfully!');
    }

    // Add Expense
    public function addExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:optics_expense_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > OpticsAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        OpticsAccount::addExpense(
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
        $query = OpticsTransaction::with(['expenseCategory', 'createdBy']);

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
        $categories = OpticsExpenseCategory::active()->get();

        return Inertia::render('OpticsAccount/Transactions', compact('transactions', 'categories'));
    }

    // Fund History
    public function fundHistory()
    {
        $fundTransactions = OpticsFundTransaction::with('addedBy')
            ->latest('date')->paginate(20);

        return Inertia::render('OpticsAccount/FundHistory', compact('fundTransactions'));
    }

    // Expense Categories
    public function categories()
    {
        $categories = OpticsExpenseCategory::withCount('transactions')->get();

        return Inertia::render('OpticsAccount/Categories', compact('categories'));
    }

    // Store Category
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:optics_expense_categories,name',
        ]);

        OpticsExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Category created successfully!');
    }

    // Update Category
    public function updateCategory(Request $request, OpticsExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:optics_expense_categories,name,' . $category->id,
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

        $report = OpticsAccount::monthlyReport($year, $month);

        $categoryExpenses = OpticsTransaction::where('type', 'expense')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->with('expenseCategory')
            ->get()
            ->groupBy('expenseCategory.name')
            ->map(fn($items) => $items->sum('amount'));

        // Optics specific metrics
        $glassesPurchases = OpticsTransaction::where('type', 'expense')
            ->where('category', 'glasses_purchase')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $glassesSales = OpticsTransaction::where('type', 'income')
            ->where('category', 'glasses_sale')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $lensPurchases = OpticsTransaction::where('type', 'expense')
            ->where('category', 'lens_purchase')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        $lensSales = OpticsTransaction::where('type', 'income')
            ->where('category', 'lens_sale')
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->sum('amount');

        return Inertia::render('OpticsAccount/MonthlyReport', compact(
            'report', 'categoryExpenses', 'year', 'month',
            'glassesPurchases', 'glassesSales', 'lensPurchases', 'lensSales'
        ));
    }

    // Balance Sheet
    public function balanceSheet()
    {
        $balance = OpticsAccount::getBalance();
        $totalIncome = OpticsTransaction::income()->sum('amount');
        $totalExpense = OpticsTransaction::expense()->sum('amount');
        $totalFundIn = OpticsFundTransaction::fundIn()->sum('amount');
        $totalFundOut = OpticsFundTransaction::fundOut()->sum('amount');

        // Optics specific metrics
        $totalGlassesPurchases = OpticsTransaction::where('category', 'glasses_purchase')->sum('amount');
        $totalGlassesSales = OpticsTransaction::where('category', 'glasses_sale')->sum('amount');
        $totalLensPurchases = OpticsTransaction::where('category', 'lens_purchase')->sum('amount');
        $totalLensSales = OpticsTransaction::where('category', 'lens_sale')->sum('amount');

        $glassesProfit = $totalGlassesSales - $totalGlassesPurchases;
        $lensProfit = $totalLensSales - $totalLensPurchases;
        $opticsProfit = $glassesProfit + $lensProfit;

        // Current month metrics
        $currentMonthGlassesPurchases = OpticsTransaction::where('category', 'glasses_purchase')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $currentMonthGlassesSales = OpticsTransaction::where('category', 'glasses_sale')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $currentMonthLensPurchases = OpticsTransaction::where('category', 'lens_purchase')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $currentMonthLensSales = OpticsTransaction::where('category', 'lens_sale')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        return Inertia::render('OpticsAccount/BalanceSheet', compact(
            'balance', 'totalIncome', 'totalExpense', 'totalFundIn', 'totalFundOut',
            'totalGlassesPurchases', 'totalGlassesSales', 'totalLensPurchases', 'totalLensSales',
            'glassesProfit', 'lensProfit', 'opticsProfit',
            'currentMonthGlassesPurchases', 'currentMonthGlassesSales',
            'currentMonthLensPurchases', 'currentMonthLensSales'
        ));
    }

    // Optics Business Analytics
    public function analytics(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

        // Monthly trend for last 12 months
        $monthlyTrend = OpticsTransaction::where('created_at', '>=', now()->subMonths(12))
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

        // Purchase vs Sales comparison for glasses and lens
        $purchaseVsSales = OpticsTransaction::where('transaction_date', '>=', now()->subMonths(6))
            ->whereIn('category', ['glasses_purchase', 'glasses_sale', 'lens_purchase', 'lens_sale'])
            ->selectRaw('
                DATE_FORMAT(transaction_date, "%Y-%m") as month,
                category,
                SUM(amount) as total
            ')
            ->groupBy('month', 'category')
            ->orderBy('month', 'desc')
            ->get();

        // Top expense categories
        $topExpenseCategories = OpticsTransaction::where('type', 'expense')
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

        // Calculate totals for profit margin
        $totalGlassesSales = OpticsTransaction::where('category', 'glasses_sale')->sum('amount');
        $totalGlassesPurchases = OpticsTransaction::where('category', 'glasses_purchase')->sum('amount');
        $totalLensSales = OpticsTransaction::where('category', 'lens_sale')->sum('amount');
        $totalLensPurchases = OpticsTransaction::where('category', 'lens_purchase')->sum('amount');

        $totalSales = $totalGlassesSales + $totalLensSales;
        $totalPurchases = $totalGlassesPurchases + $totalLensPurchases;

        // Profit margin analysis
        $profitMargin = $totalSales > 0 ?
            (($totalSales - $totalPurchases) / $totalSales) * 100 : 0;

        // Product-wise performance
        $glassesPerformance = [
            'sales' => $totalGlassesSales,
            'purchases' => $totalGlassesPurchases,
            'profit' => $totalGlassesSales - $totalGlassesPurchases,
            'margin' => $totalGlassesSales > 0 ? (($totalGlassesSales - $totalGlassesPurchases) / $totalGlassesSales) * 100 : 0
        ];

        $lensPerformance = [
            'sales' => $totalLensSales,
            'purchases' => $totalLensPurchases,
            'profit' => $totalLensSales - $totalLensPurchases,
            'margin' => $totalLensSales > 0 ? (($totalLensSales - $totalLensPurchases) / $totalLensSales) * 100 : 0
        ];

        return Inertia::render('OpticsAccount/Analytics', compact(
            'monthlyTrend', 'purchaseVsSales', 'topExpenseCategories', 'profitMargin',
            'glassesPerformance', 'lensPerformance', 'year', 'month'
        ));
    }

    // Inventory Value Report
    public function inventoryReport()
    {
        $accountBalance = OpticsAccount::getBalance();

        // Get total inventory value from glasses and lens stocks
        $totalGlassesValue = \DB::table('glasses')
            ->where('is_active', true)
            ->selectRaw('SUM(stock_quantity * price) as total_value')
            ->first()->total_value ?? 0;

        // If you have lens inventory table, add it here
        $totalLensValue = 0; // Add lens inventory calculation if available

        $totalInventoryValue = $totalGlassesValue + $totalLensValue;

        // Investment vs Current Inventory Value
        $totalInvestment = OpticsTransaction::whereIn('category', ['glasses_purchase', 'lens_purchase'])->sum('amount');
        $totalSold = OpticsTransaction::whereIn('category', ['glasses_sale', 'lens_sale'])->sum('amount');

        return Inertia::render('OpticsAccount/InventoryReport', compact(
            'accountBalance', 'totalInventoryValue', 'totalGlassesValue', 'totalLensValue',
            'totalInvestment', 'totalSold'
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
