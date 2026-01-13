<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalIncomeCategory;
use App\Models\HospitalTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IncomeExpenditureController extends Controller
{
    /**
     * Display Income & Expenditure Report
     * Shows all incomes by category and all expenses by category with surplus/deficit
     */
    public function index(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        // Get all income categories with current month and cumulative amounts
        $incomes = $this->getIncomesWithAllCategories($fromDate, $toDate);

        // Get all expense categories with current month and cumulative amounts
        $expenses = $this->getExpensesWithAllCategories($fromDate, $toDate);

        // Calculate totals
        $currentMonthIncome = collect($incomes)->sum('current_month');
        $cumulativeIncome = collect($incomes)->sum('cumulative');

        $currentMonthExpenditure = collect($expenses)->sum('current_month');
        $cumulativeExpenditure = collect($expenses)->sum('cumulative');

        // Calculate surplus or deficit
        $currentSurplusDeficit = $currentMonthIncome - $currentMonthExpenditure;
        $cumulativeSurplusDeficit = $cumulativeIncome - $cumulativeExpenditure;

        return Inertia::render('Reports/IncomeExpenditure', [
            'incomes' => $incomes,
            'expenses' => $expenses,
            'totals' => [
                'current_month_income' => $currentMonthIncome,
                'current_month_expenditure' => $currentMonthExpenditure,
                'cumulative_income' => $cumulativeIncome,
                'cumulative_expenditure' => $cumulativeExpenditure,
                'current_surplus_deficit' => $currentSurplusDeficit,
                'cumulative_surplus_deficit' => $cumulativeSurplusDeficit,
                'current_is_surplus' => $currentSurplusDeficit >= 0,
                'cumulative_is_surplus' => $cumulativeSurplusDeficit >= 0,
            ],
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }

    /**
     * Get all income categories with their amounts
     * Includes categories even if they have zero transactions
     */
    private function getIncomesWithAllCategories($fromDate, $toDate)
    {
        // Get ALL income categories (including inactive for historical accuracy)
        $categories = HospitalIncomeCategory::orderBy('name')->get();

        $incomes = [];
        $serial = 1;

        foreach ($categories as $category) {
            // Special handling for Medicine Income and Optics Income - show PROFIT only, not total sales
            if (in_array($category->name, ['Medicine Income', 'Optics Income'])) {
                if ($category->name === 'Medicine Income') {
                    // Calculate medicine profit using direct database query for accuracy
                    // Total Sales - Total Cost = Profit
                    $salesData = DB::table('medicine_sales')
                        ->whereBetween('sale_date', [$fromDate, $toDate])
                        ->sum('total_amount');

                    $costData = DB::table('medicine_sale_items')
                        ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                        ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
                        ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                    $currentProfit = $salesData - $costData;

                    // Get ONLY manual/genuine income transactions (exclude sale-related entries)
                    // Sale entries contain "Medicine Sale:" keyword
                    $previousManualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<', $fromDate)
                        ->where('description', 'NOT LIKE', '%Medicine Sale:%')
                        ->sum('amount');

                    $currentManualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->whereBetween('transaction_date', [$fromDate, $toDate])
                        ->where('description', 'NOT LIKE', '%Medicine Sale:%')
                        ->sum('amount');

                    // Get previous profit (from beginning to fromDate - 1)
                    $previousSalesData = DB::table('medicine_sales')
                        ->where('sale_date', '<', $fromDate)
                        ->sum('total_amount');

                    $previousCostData = DB::table('medicine_sale_items')
                        ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                        ->where('medicine_sales.sale_date', '<', $fromDate)
                        ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                    $previousProfit = $previousSalesData - $previousCostData;

                    // Current month = Current period profit + Current manual income
                    $currentMonth = $currentProfit + $currentManualIncome;

                    // Cumulative = All manual income + All profit
                    $cumulative = $previousManualIncome + $currentManualIncome + $previousProfit + $currentProfit;
                } else {
                    // Optics Income - Calculate profit from Optics Buy-Sale-Stock Report + Only Fitting Charge
                    $glassesData = \App\Models\Glasses::getBuySaleStockReport($fromDate, $toDate);
                    $lensTypesData = \App\Models\LensType::getBuySaleStockReport($fromDate, $toDate);
                    $completeGlassesData = \App\Models\CompleteGlasses::getBuySaleStockReport($fromDate, $toDate);

                    $itemsProfit = collect($glassesData)->sum('total_profit')
                                 + collect($lensTypesData)->sum('total_profit')
                                 + collect($completeGlassesData)->sum('total_profit');

                    // Add only fitting charge (sales without any items)
                    $onlyFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function ($query) {
                            $query->select(DB::raw(1))
                                ->from('optics_sale_items')
                                ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59'])
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    $currentMonth = $itemsProfit + $onlyFittingCharge;

                    // Cumulative = Manual income (non-sale) + Previous profit + Current period profit
                    // Get ONLY manual/genuine income transactions (exclude sale-related payments)
                    // Sale payments contain "Advance Payment", "Due Payment", or "Invoice:" keywords
                    $previousManualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<', $fromDate)
                        ->where('description', 'NOT LIKE', '%Advance Payment%')
                        ->where('description', 'NOT LIKE', '%Due Payment%')
                        ->where('description', 'NOT LIKE', '%Invoice:%')
                        ->sum('amount');

                    $currentManualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->whereBetween('transaction_date', [$fromDate, $toDate])
                        ->where('description', 'NOT LIKE', '%Advance Payment%')
                        ->where('description', 'NOT LIKE', '%Due Payment%')
                        ->where('description', 'NOT LIKE', '%Invoice:%')
                        ->sum('amount');

                    // Get previous profit from Buy-Sale-Stock (from beginning to fromDate)
                    $previousGlassesData = \App\Models\Glasses::getBuySaleStockReport('1900-01-01', date('Y-m-d', strtotime($fromDate.' -1 day')));
                    $previousLensTypesData = \App\Models\LensType::getBuySaleStockReport('1900-01-01', date('Y-m-d', strtotime($fromDate.' -1 day')));
                    $previousCompleteGlassesData = \App\Models\CompleteGlasses::getBuySaleStockReport('1900-01-01', date('Y-m-d', strtotime($fromDate.' -1 day')));

                    $previousProfit = collect($previousGlassesData)->sum('total_profit')
                                    + collect($previousLensTypesData)->sum('total_profit')
                                    + collect($previousCompleteGlassesData)->sum('total_profit');

                    // Get previous only fitting charge (before fromDate)
                    $previousFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function ($query) {
                            $query->select(DB::raw(1))
                                ->from('optics_sale_items')
                                ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->where('created_at', '<', $fromDate.' 00:00:00')
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    // Update current month to include manual income
                    $currentMonth = $currentMonth + $currentManualIncome;

                    // Cumulative = Manual income (all) + All profit (previous + current) + All fitting charge
                    $cumulative = $previousManualIncome + $currentManualIncome + $previousProfit + $previousFittingCharge + $itemsProfit + $onlyFittingCharge;
                }
            } else {
                // Regular income categories - get from HospitalTransaction
                // Current month amount
                $currentMonth = HospitalTransaction::where('income_category_id', $category->id)
                    ->whereBetween('transaction_date', [$fromDate, $toDate])
                    ->sum('amount');

                // Cumulative amount (from beginning to toDate)
                $cumulative = HospitalTransaction::where('income_category_id', $category->id)
                    ->where('transaction_date', '<=', $toDate)
                    ->sum('amount');
            }

            $incomes[] = [
                'serial' => $serial++,
                'category' => $category->name,
                'category_id' => $category->id,
                'current_month' => (float) $currentMonth,
                'cumulative' => (float) $cumulative,
                'is_active' => $category->is_active,
            ];
        }

        return $incomes;
    }

    /**
     * Get all expense categories with their amounts
     * Includes categories even if they have zero transactions
     * Also includes special expenses without category_id
     */
    private function getExpensesWithAllCategories($fromDate, $toDate)
    {
        // Get ALL expense categories (including inactive for historical accuracy)
        // Exclude capital expenditures and purchase/payment categories (not operational expenses)
        $excludeCategories = [
            'Fixed Asset Purchase',
            'Fixed Asset Vendor Payment',
            'Medicine Purchase',
            'Medicine Vendor Payment',
            'Optics Purchase',
            'Optics Vendor Payment',
            'House Security',
        ];

        $categories = HospitalExpenseCategory::whereNotIn('name', $excludeCategories)
            ->orderBy('name')
            ->get();

        $expenses = [];
        $serial = 1;

        // Add House Rent (Adjustment) from Advance Rent Deductions - SEPARATED BY FLOOR
        // 2nd & 3rd Floor
        $houseRent2And3Current = \App\Models\AdvanceHouseRentDeduction::join('advance_house_rents', 'advance_house_rent_deductions.advance_house_rent_id', '=', 'advance_house_rents.id')
            ->where('advance_house_rents.floor_type', '2_3_floor')
            ->whereBetween('advance_house_rent_deductions.deduction_date', [$fromDate, $toDate])
            ->sum('advance_house_rent_deductions.amount');

        $houseRent2And3Cumulative = \App\Models\AdvanceHouseRentDeduction::join('advance_house_rents', 'advance_house_rent_deductions.advance_house_rent_id', '=', 'advance_house_rents.id')
            ->where('advance_house_rents.floor_type', '2_3_floor')
            ->where('advance_house_rent_deductions.deduction_date', '<=', $toDate)
            ->sum('advance_house_rent_deductions.amount');

        if ($houseRent2And3Current > 0 || $houseRent2And3Cumulative > 0) {
            $expenses[] = [
                'serial' => $serial++,
                'category' => 'House Rent (2nd & 3rd Floor)',
                'category_id' => null,
                'current_month' => (float) $houseRent2And3Current,
                'cumulative' => (float) $houseRent2And3Cumulative,
                'is_active' => true,
                'is_special' => true,
                'is_adjustment' => true,
            ];
        }

        // 4th Floor
        $houseRent4Current = \App\Models\AdvanceHouseRentDeduction::join('advance_house_rents', 'advance_house_rent_deductions.advance_house_rent_id', '=', 'advance_house_rents.id')
            ->where('advance_house_rents.floor_type', '4_floor')
            ->whereBetween('advance_house_rent_deductions.deduction_date', [$fromDate, $toDate])
            ->sum('advance_house_rent_deductions.amount');

        $houseRent4Cumulative = \App\Models\AdvanceHouseRentDeduction::join('advance_house_rents', 'advance_house_rent_deductions.advance_house_rent_id', '=', 'advance_house_rents.id')
            ->where('advance_house_rents.floor_type', '4_floor')
            ->where('advance_house_rent_deductions.deduction_date', '<=', $toDate)
            ->sum('advance_house_rent_deductions.amount');

        if ($houseRent4Current > 0 || $houseRent4Cumulative > 0) {
            $expenses[] = [
                'serial' => $serial++,
                'category' => 'House Rent (4th Floor)',
                'category_id' => null,
                'current_month' => (float) $houseRent4Current,
                'cumulative' => (float) $houseRent4Cumulative,
                'is_active' => true,
                'is_special' => true,
                'is_adjustment' => true,
            ];
        }

        // Add regular expense categories
        foreach ($categories as $category) {
            // Current month amount
            $currentMonth = HospitalTransaction::where('expense_category_id', $category->id)
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');

            // Cumulative amount (from beginning to toDate)
            $cumulative = HospitalTransaction::where('expense_category_id', $category->id)
                ->where('transaction_date', '<=', $toDate)
                ->sum('amount');

            $expenses[] = [
                'serial' => $serial++,
                'category' => $category->name,
                'category_id' => $category->id,
                'current_month' => (float) abs($currentMonth),
                'cumulative' => (float) abs($cumulative),
                'is_active' => $category->is_active,
            ];
        }

        $specialExpenses = DB::table('hospital_transactions')
            ->select(
                'description',
                DB::raw('SUM(ABS(amount)) as current_month')
            )
            ->whereNull('expense_category_id')
            ->whereNull('income_category_id')
            ->where('amount', '<', 0)
            ->where('description', 'NOT LIKE', '%Fixed Asset%')
            ->where('description', 'NOT LIKE', '%Asset Purchase%')
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->groupBy('description')
            ->get()
            ->map(function ($expense) use ($toDate) {

                $cumulative = DB::table('hospital_transactions')
                    ->whereNull('expense_category_id')
                    ->whereNull('income_category_id')
                    ->where('amount', '<', 0)
                    ->where('description', 'NOT LIKE', '%Fixed Asset%')
                    ->where('description', 'NOT LIKE', '%Asset Purchase%')
                    ->where('transaction_date', '<=', $toDate)
                    ->where('description', $expense->description)
                    ->sum(DB::raw('ABS(amount)'));

                return (object) [
                    'description' => $expense->description ?? 'Other Expenses',
                    'current_month' => $expense->current_month,
                    'cumulative' => $cumulative,
                ];
            });

        foreach ($specialExpenses as $expense) {
            $expenses[] = [
                'serial' => $serial++,
                'category' => $expense->description,
                'category_id' => null,
                'current_month' => (float) $expense->current_month,
                'cumulative' => (float) $expense->cumulative,
                'is_active' => true,
                'is_special' => true,
            ];
        }

        return $expenses;
    }

    /**
     * Get income details for a specific category
     */
    public function getIncomeDetails(Request $request, $categoryId)
    {
        $fromDate = $request->from_date ?? now()->startOfYear()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $transactions = HospitalTransaction::with(['createdBy'])
            ->where('income_category_id', $categoryId)
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->orderBy('transaction_date', 'desc')
            ->get()
            ->map(function ($txn) {
                return [
                    'id' => $txn->id,
                    'date' => $txn->transaction_date,
                    'description' => $txn->description,
                    'amount' => $txn->amount,
                    'created_by' => $txn->createdBy->name ?? 'N/A',
                ];
            });

        return response()->json([
            'transactions' => $transactions,
            'total' => $transactions->sum('amount'),
        ]);
    }

    /**
     * Get expense details for a specific category
     */
    public function getExpenseDetails(Request $request, $categoryId)
    {
        $fromDate = $request->from_date ?? now()->startOfYear()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        $query = HospitalTransaction::with(['createdBy'])
            ->whereBetween('transaction_date', [$fromDate, $toDate])
            ->orderBy('transaction_date', 'desc');

        if ($categoryId === 'special') {
            // Special expenses without category_id
            $query->whereNull('expense_category_id')
                ->whereNull('income_category_id')
                ->where('amount', '<', 0);
        } else {
            $query->where('expense_category_id', $categoryId);
        }

        $transactions = $query->get()->map(function ($txn) {
            return [
                'id' => $txn->id,
                'date' => $txn->transaction_date,
                'description' => $txn->description ?? $txn->purpose,
                'amount' => abs((float) $txn->amount),
                'created_by' => $txn->createdBy->name ?? 'N/A',
            ];
        });

        return response()->json([
            'transactions' => $transactions,
            'total' => $transactions->sum('amount'),
        ]);
    }

    /**
     * Export to PDF
     */
    public function export(Request $request)
    {
        return response()->json(['message' => 'PDF export coming soon']);
    }
}
