<?php

namespace App\Http\Controllers\OpticsAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{OpticsAccount, OpticsFundTransaction, OpticsTransaction, OpticsExpenseCategory};
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use NumberFormatter;

class OpticsAccountController extends Controller
{
    public function index(): Response
    {
        $balance = OpticsAccount::getBalance();
        $monthlyReport = OpticsAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = OpticsTransaction::with(['expenseCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = OpticsFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        $expenseCategories = OpticsExpenseCategory::where('is_active', true)->get();

        return Inertia::render('OpticsAccount/Dashboard', compact(
            'balance',
            'monthlyReport',
            'recentTransactions',
            'recentFundTransactions',
            'expenseCategories'
        ));
    }

    public function fundIn(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        OpticsAccount::addFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date
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

        if ($request->amount > OpticsAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        OpticsAccount::withdrawFund(
            $request->amount,
            $request->purpose,
            $request->description,
            $request->date
        );

        return back()->with('success', 'Fund withdrawn successfully!');
    }

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

        $categoryName = $request->category;
        $categoryId = $request->expense_category_id;

        if ($categoryId && empty($categoryName)) {
            $category = OpticsExpenseCategory::find($categoryId);
            $categoryName = $category ? $category->name : $request->category;
        }

        if (!$categoryId && $categoryName) {
            $category = OpticsExpenseCategory::firstOrCreate(
                ['name' => $categoryName],
                ['is_active' => true]
            );
            $categoryId = $category->id;
        }

        OpticsAccount::addExpense(
            amount: $request->amount,
            category: $categoryName,
            description: $request->description,
            categoryId: $categoryId,
            date: $request->date
        );

        return back()->with('success', 'Expense added successfully!');
    }

    public function transactions(Request $request): Response
    {
        $validated = $request->validate([
            'type' => 'nullable|string',
            'category' => 'nullable|string',
            'expense_category_id' => 'nullable|integer',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        $query = OpticsTransaction::with(['expenseCategory', 'createdBy']);

        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (!empty($validated['expense_category_id'])) {
            $query->where('expense_category_id', $validated['expense_category_id']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('transaction_date', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('transaction_date', '<=', $validated['date_to']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('transaction_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $perPage = $validated['per_page'] ?? 50;
        $transactions = $query->latest('transaction_date')->paginate($perPage)->withQueryString();

        $categories = OpticsExpenseCategory::where('is_active', true)->get();

        return Inertia::render('OpticsAccount/Transactions', [
            'transactions' => $transactions,
            'categories' => $categories,
            'filters' => array_filter($request->only(['type', 'category', 'expense_category_id', 'date_from', 'date_to', 'search']))
        ]);
    }

    public function fundHistory(): Response
    {
        $fundTransactions = OpticsFundTransaction::with('addedBy')
            ->latest('date')->paginate(20);

        return Inertia::render('OpticsAccount/FundHistory', compact('fundTransactions'));
    }

    public function categories(): Response
    {
        $categories = OpticsExpenseCategory::withCount('transactions')->get();

        return Inertia::render('OpticsAccount/Categories', compact('categories'));
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:optics_expense_categories,name',
        ]);

        OpticsExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Category created successfully!');
    }

    public function updateCategory(Request $request, OpticsExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:optics_expense_categories,name,' . $category->id,
            'is_active' => 'boolean',
        ]);

        $category->update($request->only(['name', 'is_active']));

        return back()->with('success', 'Category updated successfully!');
    }

    public function monthlyReport(Request $request): Response
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
            'report',
            'categoryExpenses',
            'year',
            'month',
            'glassesPurchases',
            'glassesSales',
            'lensPurchases',
            'lensSales'
        ));
    }

    public function balanceSheet(): Response
    {
        $balance = OpticsAccount::getBalance();
        $totalIncome = OpticsTransaction::income()->sum('amount');
        $totalExpense = OpticsTransaction::expense()->sum('amount');
        $totalFundIn = OpticsFundTransaction::fundIn()->sum('amount');
        $totalFundOut = OpticsFundTransaction::fundOut()->sum('amount');

        $totalGlassesPurchases = OpticsTransaction::where('category', 'glasses_purchase')->sum('amount');
        $totalGlassesSales = OpticsTransaction::where('category', 'glasses_sale')->sum('amount');
        $totalLensPurchases = OpticsTransaction::where('category', 'lens_purchase')->sum('amount');
        $totalLensSales = OpticsTransaction::where('category', 'lens_sale')->sum('amount');

        $glassesProfit = $totalGlassesSales - $totalGlassesPurchases;
        $lensProfit = $totalLensSales - $totalLensPurchases;
        $opticsProfit = $glassesProfit + $lensProfit;

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
            'balance',
            'totalIncome',
            'totalExpense',
            'totalFundIn',
            'totalFundOut',
            'totalGlassesPurchases',
            'totalGlassesSales',
            'totalLensPurchases',
            'totalLensSales',
            'glassesProfit',
            'lensProfit',
            'opticsProfit',
            'currentMonthGlassesPurchases',
            'currentMonthGlassesSales',
            'currentMonthLensPurchases',
            'currentMonthLensSales'
        ));
    }

    public function analytics(Request $request): Response
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

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

        $totalGlassesSales = OpticsTransaction::where('category', 'glasses_sale')->sum('amount');
        $totalGlassesPurchases = OpticsTransaction::where('category', 'glasses_purchase')->sum('amount');
        $totalLensSales = OpticsTransaction::where('category', 'lens_sale')->sum('amount');
        $totalLensPurchases = OpticsTransaction::where('category', 'lens_purchase')->sum('amount');

        $totalSales = $totalGlassesSales + $totalLensSales;
        $totalPurchases = $totalGlassesPurchases + $totalLensPurchases;

        $profitMargin = $totalSales > 0 ?
            (($totalSales - $totalPurchases) / $totalSales) * 100 : 0;

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
            'monthlyTrend',
            'purchaseVsSales',
            'topExpenseCategories',
            'profitMargin',
            'glassesPerformance',
            'lensPerformance',
            'year',
            'month'
        ));
    }

    public function inventoryReport(): Response
    {
        $accountBalance = OpticsAccount::getBalance();

        $totalGlassesValue = \DB::table('glasses')
            ->where('is_active', true)
            ->selectRaw('SUM(stock_quantity * price) as total_value')
            ->first()->total_value ?? 0;

        $totalLensValue = 0;

        $totalInventoryValue = $totalGlassesValue + $totalLensValue;

        $totalInvestment = OpticsTransaction::whereIn('category', ['glasses_purchase', 'lens_purchase'])->sum('amount');
        $totalSold = OpticsTransaction::whereIn('category', ['glasses_sale', 'lens_sale'])->sum('amount');

        return Inertia::render('OpticsAccount/InventoryReport', compact(
            'accountBalance',
            'totalInventoryValue',
            'totalGlassesValue',
            'totalLensValue',
            'totalInvestment',
            'totalSold'
        ));
    }

    public function dailyReport(Request $request): Response
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'type' => 'required|in:income,expense',
        ]);

        $date = $validated['date'];
        $type = $validated['type'];

        $transactions = OpticsTransaction::where('transaction_date', $date)
            ->where('type', $type)
            ->with('expenseCategory')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($transaction, $index) {
                return [
                    'sl_no' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                    'transaction_no' => $transaction->transaction_no,
                    'date' => $transaction->transaction_date->format('d/m/Y'),
                    'category' => $transaction->category,
                    'description' => $transaction->description,
                    'amount' => number_format($transaction->amount, 2),
                    'amount_raw' => $transaction->amount,
                ];
            });

        $totalAmount = $transactions->sum('amount_raw');
        $amountInWords = $this->convertToWords($totalAmount);

        return Inertia::render('OpticsAccount/DailyReport', [
            'date' => Carbon::parse($date)->format('d/m/Y'),
            'type' => $type,
            'transactions' => $transactions,
            'total_amount' => number_format($totalAmount, 2),
            'amount_in_words' => $amountInWords,
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }

    public function reports(): Response
    {
        return Inertia::render('OpticsAccount/Reports');
    }

    public function exportReport(Request $request)
    {
        $type = $request->get('type', 'transactions');
        $format = $request->get('format', 'excel');

        return response()->json([
            'success' => true,
            'message' => 'Export functionality to be implemented',
            'type' => $type,
            'format' => $format
        ]);
    }

    private function convertToWords(float $amount): string
    {
        $formatter = new NumberFormatter('en', NumberFormatter::SPELLOUT);
        $words = $formatter->format($amount);
        return ucwords($words) . ' Taka Only';
    }
}
