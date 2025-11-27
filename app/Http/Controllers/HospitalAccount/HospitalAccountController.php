<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{HospitalAccount, HospitalFundTransaction, HospitalTransaction, HospitalExpenseCategory, HospitalIncomeCategory, MainAccount, MainAccountVoucher, AdvanceHouseRent};
use Inertia\Inertia;
use DB;

class HospitalAccountController extends Controller
{
    // Dashboard
    public function index()
    {
        $balance = HospitalAccount::getBalance();
        $monthlyReport = HospitalAccount::monthlyReport(now()->year, now()->month);

        $recentTransactions = HospitalTransaction::with(['expenseCategory', 'incomeCategory', 'createdBy'])
            ->latest()->take(10)->get();

        $recentFundTransactions = HospitalFundTransaction::with('addedBy')
            ->latest()->take(5)->get();

        // Add expense and income categories
        $expenseCategories = HospitalExpenseCategory::where('is_active', true)->get();
        $incomeCategories = HospitalIncomeCategory::where('is_active', true)->get();

        // Get unique investor names (purpose field)
        $investorNames = HospitalFundTransaction::distinct()
            ->pluck('purpose')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        return Inertia::render('HospitalAccount/Dashboard', compact(
            'balance',
            'monthlyReport',
            'recentTransactions',
            'recentFundTransactions',
            'expenseCategories',
            'incomeCategories',
            'investorNames'
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

    // Add Expense
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

    // Edit Transaction
    public function editTransaction(HospitalTransaction $transaction)
    {
        $transaction->load(['expenseCategory', 'createdBy']);
        $expenseCategories = HospitalExpenseCategory::where('is_active', true)->get();

        return Inertia::render('HospitalAccount/EditTransaction', compact('transaction', 'expenseCategories'));
    }

    // Update Transaction
    public function updateTransaction(Request $request, HospitalTransaction $transaction)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:hospital_expense_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $transaction) {
            $oldAmount = $transaction->amount;
            $newAmount = $request->amount;
            $amountDifference = $newAmount - $oldAmount;

            // Update hospital account balance
            $account = HospitalAccount::firstOrCreate([]);

            if ($transaction->type === 'expense') {
                // For expense: if new amount is higher, decrease balance more
                // if new amount is lower, increase balance
                $account->decrement('balance', $amountDifference);

                // Check if balance is sufficient for expense increase
                if ($amountDifference > 0 && $account->balance < 0) {
                    throw new \Exception('Insufficient balance for this expense amount!');
                }
            } else {
                // For income: if new amount is higher, increase balance more
                // if new amount is lower, decrease balance
                $account->increment('balance', $amountDifference);
            }

            // Update main account voucher
            $mainAccountVoucher = MainAccountVoucher::where('source_voucher_no', $transaction->transaction_no)
                ->where('source_account', 'hospital')
                ->where('source_reference_id', $transaction->id)
                ->first();

            if ($mainAccountVoucher) {
                $mainAccount = MainAccount::firstOrCreate([]);

                if ($transaction->type === 'expense') {
                    // For expense (debit voucher): decrease main account balance by difference
                    $mainAccount->decrement('balance', $amountDifference);
                } else {
                    // For income (credit voucher): increase main account balance by difference
                    $mainAccount->increment('balance', $amountDifference);
                }

                // Update voucher
                $mainAccountVoucher->update([
                    'amount' => $newAmount,
                    'date' => $request->date,
                    'narration' => $transaction->type === 'expense'
                        ? "Hospital Expense - {$request->category}: {$request->description}"
                        : "Hospital Income - {$request->category}: {$request->description}"
                ]);
            }

            // Handle category update
            $categoryName = $request->category;
            $categoryId = $request->expense_category_id;

            if ($categoryId && empty($categoryName)) {
                $category = HospitalExpenseCategory::find($categoryId);
                $categoryName = $category ? $category->name : $request->category;
            }

            if (!$categoryId && $categoryName) {
                $category = HospitalExpenseCategory::firstOrCreate(
                    ['name' => $categoryName],
                    ['is_active' => true]
                );
                $categoryId = $category->id;
            }

            // Update transaction
            $transaction->update([
                'amount' => $newAmount,
                'category' => $categoryName,
                'expense_category_id' => $categoryId,
                'description' => $request->description,
                'transaction_date' => $request->date,
            ]);
        });

        return back()->with('success', 'Transaction updated successfully!');
    }

    // Delete Transaction
    public function deleteTransaction(HospitalTransaction $transaction)
    {
        DB::transaction(function () use ($transaction) {
            // Reverse hospital account balance
            $account = HospitalAccount::firstOrCreate([]);

            if ($transaction->type === 'expense') {
                // Reverse expense - increase balance
                $account->increment('balance', $transaction->amount);
            } else {
                // Reverse income - decrease balance
                $account->decrement('balance', $transaction->amount);
            }

            // Find and reverse main account voucher
            $mainAccountVoucher = MainAccountVoucher::where('source_voucher_no', $transaction->transaction_no)
                ->where('source_account', 'hospital')
                ->where('source_reference_id', $transaction->id)
                ->first();

            if ($mainAccountVoucher) {
                $mainAccount = MainAccount::firstOrCreate([]);

                if ($transaction->type === 'expense') {
                    // Reverse expense (was debit) - increase main account balance
                    $mainAccount->increment('balance', $transaction->amount);
                } else {
                    // Reverse income (was credit) - decrease main account balance
                    $mainAccount->decrement('balance', $transaction->amount);
                }

                $mainAccountVoucher->delete();
            }

            // Delete the transaction
            $transaction->delete();
        });

        return back()->with('success', 'Transaction deleted successfully!');
    }

    // Edit Fund Transaction
    public function editFundTransaction(HospitalFundTransaction $fundTransaction)
    {
        $fundTransaction->load('addedBy');

        return Inertia::render('HospitalAccount/EditFundTransaction', compact('fundTransaction'));
    }

    // Update Fund Transaction
    public function updateFundTransaction(Request $request, HospitalFundTransaction $fundTransaction)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'purpose' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        DB::transaction(function () use ($request, $fundTransaction) {
            $oldAmount = $fundTransaction->amount;
            $newAmount = $request->amount;
            $amountDifference = $newAmount - $oldAmount;

            // Update hospital account balance
            $account = HospitalAccount::firstOrCreate([]);

            if ($fundTransaction->type === 'fund_out') {
                // For fund_out: if new amount is higher, decrease balance more
                $account->decrement('balance', $amountDifference);

                // Check if balance is sufficient
                if ($amountDifference > 0 && $account->balance < 0) {
                    throw new \Exception('Insufficient balance for this fund out amount!');
                }
            } else {
                // For fund_in: if new amount is higher, increase balance more
                $account->increment('balance', $amountDifference);
            }

            // Update main account voucher
            $mainAccountVoucher = MainAccountVoucher::where('source_voucher_no', $fundTransaction->voucher_no)
                ->where('source_account', 'hospital')
                ->where('source_reference_id', $fundTransaction->id)
                ->first();

            if ($mainAccountVoucher) {
                $mainAccount = MainAccount::firstOrCreate([]);

                if ($fundTransaction->type === 'fund_out') {
                    // For fund_out (debit voucher): decrease main account balance by difference
                    $mainAccount->decrement('balance', $amountDifference);
                } else {
                    // For fund_in (credit voucher): increase main account balance by difference
                    $mainAccount->increment('balance', $amountDifference);
                }

                // Update voucher
                $mainAccountVoucher->update([
                    'amount' => $newAmount,
                    'date' => $request->date,
                    'narration' => $fundTransaction->type === 'fund_out'
                        ? "Hospital Fund Out - {$request->purpose}: {$request->description}"
                        : "Hospital Fund In - {$request->purpose}: {$request->description}"
                ]);
            }

            // Update fund transaction
            $fundTransaction->update([
                'amount' => $newAmount,
                'purpose' => $request->purpose,
                'description' => $request->description,
                'date' => $request->date,
            ]);
        });

        return back()->with('success', 'Fund transaction updated successfully!');
    }

    public function transactions(Request $request)
    {
        $query = HospitalTransaction::with(['expenseCategory', 'incomeCategory', 'createdBy']);

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

        // Category-based filtering
        if ($request->category_filter) {
            if ($request->category_filter === 'fixed_asset') {
                $query->where('category', 'LIKE', '%Fixed Asset%')
                      ->orWhere('category', 'LIKE', '%Asset%');
            } elseif ($request->category_filter === 'advance_house_rent') {
                $query->where('category', 'LIKE', '%Advance House Rent%');
            } elseif ($request->category_filter === 'fund_transaction') {
                $query->where('category', 'LIKE', '%Fund%');
            } elseif ($request->category_filter === 'other_expense') {
                $query->where('type', 'expense')
                      ->where('category', 'NOT LIKE', '%Fixed Asset%')
                      ->where('category', 'NOT LIKE', '%Asset%')
                      ->where('category', 'NOT LIKE', '%Advance House Rent%')
                      ->where('category', 'NOT LIKE', '%Fund%');
            } elseif ($request->category_filter === 'other_income') {
                $query->where('type', 'income')
                      ->where('category', 'NOT LIKE', '%Fund%');
            }
        }

        // Clone query for totals calculation (before pagination)
        $totalsQuery = clone $query;

        // Calculate totals across ALL filtered records (not just current page)
        $totalIncome = (clone $totalsQuery)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $totalsQuery)->where('type', 'expense')->sum('amount');
        $totalCount = $totalsQuery->count();

        // Get transactions for current page
        $transactions = $query->latest('transaction_date')->paginate(20);
        $transactions->appends(request()->query());

        // Get all unique categories for filter dropdown
        $expenseCategories = HospitalExpenseCategory::where('is_active', true)->get();
        $incomeCategories = HospitalIncomeCategory::where('is_active', true)->get();

        // Get category-wise breakdown
        $categoryStats = [
            'fixed_asset_expense' => HospitalTransaction::where('type', 'expense')
                ->where(function($q) {
                    $q->where('category', 'LIKE', '%Fixed Asset%')
                      ->orWhere('category', 'LIKE', '%Asset%');
                })
                ->sum('amount'),
            'advance_rent_balance' => AdvanceHouseRent::active()->sum('remaining_amount'),
            'advance_rent_deductions' => HospitalTransaction::where('type', 'expense')
                ->where(function($q) {
                    $q->where('category', 'LIKE', '%Rent Deduction%')
                      ->orWhere('category', 'LIKE', '%House Rent - Monthly%');
                })
                ->sum('amount'),
            'other_expense' => HospitalTransaction::where('type', 'expense')
                ->where('category', 'NOT LIKE', '%Fixed Asset%')
                ->where('category', 'NOT LIKE', '%Asset%')
                ->where('category', 'NOT LIKE', '%Advance House Rent%')
                ->sum('amount'),
            'other_income' => HospitalTransaction::where('type', 'income')->sum('amount'),
        ];

        $filters = [
            'type' => $request->type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'category' => $request->category,
            'category_filter' => $request->category_filter,
        ];

        $totals = [
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'net_amount' => $totalIncome - $totalExpense,
            'total_count' => $totalCount,
        ];

        return Inertia::render('HospitalAccount/Transactions', compact(
            'transactions',
            'expenseCategories',
            'incomeCategories',
            'filters',
            'totals',
            'categoryStats'
        ));
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
            } elseif ($request->type === 'fund_out') {
                $fundOutQuery->where('type', 'fund_out');
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

    // Categories (Both Income and Expense)
    public function categories()
    {
        $expenseCategories = HospitalExpenseCategory::withCount('transactions')->get();
        $incomeCategories = HospitalIncomeCategory::withCount('transactions')->get();

        return Inertia::render('HospitalAccount/Categories', compact('expenseCategories', 'incomeCategories'));
    }

    // Store Expense Category
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_expense_categories,name',
        ]);

        HospitalExpenseCategory::create(['name' => $request->name]);

        return back()->with('success', 'Expense category created successfully!');
    }

    // Store Income Category
    public function storeIncomeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_income_categories,name',
        ]);

        HospitalIncomeCategory::create(['name' => $request->name]);

        return back()->with('success', 'Income category created successfully!');
    }

    // Update Expense Category
    public function updateCategory(Request $request, HospitalExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_expense_categories,name,' . $category->id,
            'is_active' => 'boolean',
        ]);

        $category->update($request->only(['name', 'is_active']));

        return back()->with('success', 'Expense category updated successfully!');
    }

    // Update Income Category
    public function updateIncomeCategory(Request $request, HospitalIncomeCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:hospital_income_categories,name,' . $category->id,
            'is_active' => 'boolean',
        ]);

        $category->update($request->only(['name', 'is_active']));

        return back()->with('success', 'Income category updated successfully!');
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
            'income_category_id' => 'nullable|exists:hospital_income_categories,id',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
        ]);

        // If income_category_id is provided, get the category name from it
        $categoryName = $request->category;
        $categoryId = $request->income_category_id;

        // If category ID is provided but category name is empty, get the name
        if ($categoryId && empty($categoryName)) {
            $category = HospitalIncomeCategory::find($categoryId);
            $categoryName = $category ? $category->name : $request->category;
        }

        // If category name is provided but no ID, try to find or create the category
        if (!$categoryId && $categoryName) {
            $category = HospitalIncomeCategory::firstOrCreate(
                ['name' => $categoryName],
                ['is_active' => true]
            );
            $categoryId = $category->id;
        }

        HospitalAccount::addIncome(
            amount: $request->amount,
            category: $categoryName,
            description: $request->description,
            referenceType: 'other_income',
            referenceId: null,
            date: $request->date,
            incomeCategoryId: $categoryId
        );

        return back()->with('success', 'Other income added successfully!');
    }

    public function deleteFundTransaction(HospitalFundTransaction $fundTransaction)
    {
        DB::transaction(function () use ($fundTransaction) {
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
        });

        return back()->with('success', 'Fund transaction deleted successfully!');
    }
}
