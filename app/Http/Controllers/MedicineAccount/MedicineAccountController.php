<?php

namespace App\Http\Controllers\MedicineAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{MedicineAccount, MedicineFundTransaction, MedicineTransaction, MedicineExpenseCategory};
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use NumberFormatter;

class MedicineAccountController extends Controller
{
    public function index(): Response
    {
        $balance = MedicineAccount::getBalance();
        $monthlyReport = MedicineAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = MedicineTransaction::with(['expenseCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = MedicineFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        $expenseCategories = MedicineExpenseCategory::where('is_active', true)->get();

        return Inertia::render('MedicineAccount/Dashboard', compact(
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

        MedicineAccount::addFund(
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

        if ($request->amount > MedicineAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        MedicineAccount::withdrawFund(
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
            'expense_category_id' => 'nullable|exists:medicine_expense_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        if ($request->amount > MedicineAccount::getBalance()) {
            return back()->withErrors(['amount' => 'Insufficient balance!']);
        }

        $categoryName = $request->category;
        $categoryId = $request->expense_category_id;

        if ($categoryId && empty($categoryName)) {
            $category = MedicineExpenseCategory::find($categoryId);
            $categoryName = $category ? $category->name : $request->category;
        }

        if (!$categoryId && $categoryName) {
            $category = MedicineExpenseCategory::firstOrCreate(
                ['name' => $categoryName],
                ['is_active' => true]
            );
            $categoryId = $category->id;
        }

        MedicineAccount::addExpense(
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

        $query = MedicineTransaction::with(['expenseCategory', 'createdBy']);

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

        $categories = MedicineExpenseCategory::where('is_active', true)->get();

        return Inertia::render('MedicineAccount/Transactions', [
            'transactions' => $transactions,
            'categories' => $categories,
            'filters' => array_filter($request->only(['type', 'category', 'expense_category_id', 'date_from', 'date_to', 'search']))
        ]);
    }

    public function fundHistory(): Response
    {
        $fundTransactions = MedicineFundTransaction::with('addedBy')
            ->latest('date')->paginate(20);

        return Inertia::render('MedicineAccount/FundHistory', compact('fundTransactions'));
    }

    public function categories(): Response
    {
        $categories = MedicineExpenseCategory::withCount('transactions')->get();

        return Inertia::render('MedicineAccount/Categories', compact('categories'));
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:medicine_expense_categories,name',
        ]);

        MedicineExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Category created successfully!');
    }

    public function updateCategory(Request $request, MedicineExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:medicine_expense_categories,name,' . $category->id,
            'is_active' => 'boolean',
        ]);

        $category->update($request->only(['name', 'is_active']));

        return back()->with('success', 'Category updated successfully!');
    }

    public function monthlyReport(Request $request): Response
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

    public function balanceSheet(): Response
    {
        $balance = MedicineAccount::getBalance();
        $totalIncome = MedicineTransaction::income()->sum('amount');
        $totalExpense = MedicineTransaction::expense()->sum('amount');
        $totalFundIn = MedicineFundTransaction::fundIn()->sum('amount');
        $totalFundOut = MedicineFundTransaction::fundOut()->sum('amount');

        $totalMedicinePurchases = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');
        $totalMedicineSales = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');
        $medicineProfit = $totalMedicineSales - $totalMedicinePurchases;

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

    public function analytics(Request $request): Response
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

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

        $totalMedicineSales = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');
        $totalMedicinePurchases = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');

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

    public function stockValueReport(): Response
    {
        $accountBalance = MedicineAccount::getBalance();

        $totalStockValue = \DB::table('medicine_stocks')
            ->where('available_quantity', '>', 0)
            ->selectRaw('SUM(available_quantity * buy_price) as total_value')
            ->first()->total_value ?? 0;

        $totalInvestment = MedicineTransaction::where('category', 'medicine_purchase')->sum('amount');
        $totalSold = MedicineTransaction::where('category', 'medicine_sale')->sum('amount');

        return Inertia::render('MedicineAccount/StockValueReport', compact(
            'accountBalance',
            'totalStockValue',
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

        $transactions = MedicineTransaction::where('transaction_date', $date)
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

        return Inertia::render('MedicineAccount/DailyReport', [
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
        return Inertia::render('MedicineAccount/Reports');
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
