<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\{
    HospitalAccount,
    Medicine,
    Glasses,
    LensType,
    CompleteGlasses,
    FixedAsset,
    FixedAssetVendor,
    AdvanceHouseRent,
    OpticsVendor,
    MedicineVendor,
    OpticsSale,
    MedicineSale,
    OperationBooking,
    HospitalExpenseCategory
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BalanceSheetController extends Controller
{
    /**
     * Display Balance Sheet Report
     */
    public function index(Request $request)
    {
        $asOnDate = $request->as_on_date ?? now()->toDateString();

        // ==================== CALCULATE FUND (from Fund In - Fund Out) ====================

        $totalFundIn = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $totalFundOut = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        // Fund = Total Fund In - Total Fund Out
        $fund = $totalFundIn - $totalFundOut;

        // ==================== CALCULATE NET PROFIT FROM INCOME & EXPENDITURE (SAME AS INCOME & EXPENDITURE REPORT) ====================

        // For Balance Sheet, we need cumulative from beginning to asOnDate (EXACTLY same as Income & Expenditure)
        $toDate = $asOnDate;

        // Calculate Income - EXACTLY same logic as Income & Expenditure cumulative
        $incomeCategories = \App\Models\HospitalIncomeCategory::orderBy('name')->get();
        $totalIncome = 0;

        foreach ($incomeCategories as $category) {
            // Special handling for Medicine Income and Optics Income - show PROFIT only, not total sales
            if (in_array($category->name, ['Medicine Income', 'Optics Income'])) {
                if ($category->name === 'Medicine Income') {
                    // Calculate medicine profit - cumulative from beginning to toDate
                    // Total Sales - Total Cost = Profit (up to toDate)
                    $salesData = DB::table('medicine_sales')
                        ->where('sale_date', '<=', $toDate)
                        ->sum('total_amount');

                    $costData = DB::table('medicine_sale_items')
                        ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                        ->where('medicine_sales.sale_date', '<=', $toDate)
                        ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                    $profit = $salesData - $costData;

                    // Get ONLY manual/genuine income (exclude sale entries)
                    $manualIncome = \App\Models\HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<=', $toDate)
                        ->where('description', 'NOT LIKE', '%Medicine Sale:%')
                        ->sum('amount');

                    $cumulative = $manualIncome + $profit;
                    $totalIncome += $cumulative;
                } else {
                    // Optics Income - Calculate profit from beginning to toDate
                    // Get all profit (from beginning to toDate)
                    $glassesData = \App\Models\Glasses::getBuySaleStockReport('1900-01-01', $toDate);
                    $lensTypesData = \App\Models\LensType::getBuySaleStockReport('1900-01-01', $toDate);
                    $completeGlassesData = \App\Models\CompleteGlasses::getBuySaleStockReport('1900-01-01', $toDate);

                    $itemsProfit = collect($glassesData)->sum('total_profit')
                                 + collect($lensTypesData)->sum('total_profit')
                                 + collect($completeGlassesData)->sum('total_profit');

                    // Add only fitting charge (all up to toDate)
                    $onlyFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function($query) {
                            $query->select(DB::raw(1))
                                  ->from('optics_sale_items')
                                  ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->where('created_at', '<=', $toDate . ' 23:59:59')
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    $profit = $itemsProfit + $onlyFittingCharge;

                    // Get ONLY manual/genuine income (exclude sale-related payments)
                    $manualIncome = \App\Models\HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<=', $toDate)
                        ->where('description', 'NOT LIKE', '%Advance Payment%')
                        ->where('description', 'NOT LIKE', '%Due Payment%')
                        ->where('description', 'NOT LIKE', '%Invoice:%')
                        ->sum('amount');

                    $cumulative = $manualIncome + $profit;
                    $totalIncome += $cumulative;
                }
            } else {
                // Regular income categories - get from HospitalTransaction
                // Cumulative amount (from beginning to toDate)
                $cumulative = \App\Models\HospitalTransaction::where('income_category_id', $category->id)
                    ->where('transaction_date', '<=', $toDate)
                    ->sum('amount');

                $totalIncome += $cumulative;
            }
        }

        // Calculate Expenditure - EXACTLY same logic as Income & Expenditure cumulative
        // Exclude capital expenditures and purchase/payment categories (not operational expenses)
        $excludeCategories = [
            'Fixed Asset Purchase',
            'Fixed Asset Vendor Payment',
            'Medicine Purchase',
            'Medicine Vendor Payment',
            'Optics Purchase',
            'Optics Vendor Payment',
            'House Security'
        ];

        $expenseCategories = \App\Models\HospitalExpenseCategory::whereNotIn('name', $excludeCategories)
            ->orderBy('name')
            ->get();

        $totalExpenditure = 0;

        foreach ($expenseCategories as $category) {
            // Cumulative amount (from beginning to toDate)
            $cumulative = \App\Models\HospitalTransaction::where('expense_category_id', $category->id)
                ->where('transaction_date', '<=', $toDate)
                ->sum('amount');

            $totalExpenditure += abs($cumulative);
        }

        // Add House Rent (Adjustment) from Advance Rent Deductions - EXACTLY same as Income & Expenditure
        $houseRentAdjustment = \App\Models\AdvanceHouseRentDeduction::where('deduction_date', '<=', $toDate)
            ->sum('amount');

        $totalExpenditure += $houseRentAdjustment;

        // Add special expenses without category_id (excluding Fixed Asset and Advance House Rent related)
        $specialExpenses = DB::table('hospital_transactions')
            ->whereNull('expense_category_id')
            ->whereNull('income_category_id')
            ->where('amount', '<', 0)
            ->where('description', 'NOT LIKE', '%Fixed Asset%')
            ->where('description', 'NOT LIKE', '%Asset Purchase%')
            ->where('description', 'NOT LIKE', '%Advance House Rent%')
            ->where('transaction_date', '<=', $toDate)
            ->sum(DB::raw('ABS(amount)'));

        $totalExpenditure += $specialExpenses;

        // Net Profit/Loss (Surplus/Deficit) = Income - Expenditure (EXACTLY same as Income & Expenditure cumulative)
        $netProfit = $totalIncome - $totalExpenditure;

        // ==================== ASSETS ====================

        // 1. Bank Balance - DATE-WISE (using Daily Statement logic)
        // Formula: Manual Opening + Fund In - Fund Out + Income - Expense (up to date)
        // IMPORTANT: For Balance Sheet consistency with Income & Expenditure (which uses profit method),
        // we need to match the accrual basis by including Customer Dues in Assets
        $manualOpening = 114613.00; // Opening balance before any transactions

        $fundInUpToDate = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $fundOutUpToDate = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $incomeUpToDate = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('transaction_date', '<=', $asOnDate)
            ->sum('amount');

        $expenseUpToDate = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->where('transaction_date', '<=', $asOnDate)
            ->sum('amount');

        $bankBalance = $manualOpening + $fundInUpToDate - $fundOutUpToDate + $incomeUpToDate - $expenseUpToDate;

        // 2. Medicine Stock Value (Purchase - COGS up to date)
        // Formula: Total Purchase - Cost of Goods Sold
        // This accurately represents the remaining inventory value
        $medicineStockValue = Medicine::getTotalStockValue($asOnDate);

        // 3. Optics Stock Value (Frames + Lenses + Complete Glasses) - DATE-WISE CALCULATION
        // Calculate date-wise stock value using the same method as Buy-Sale-Stock Report
        $glassesData = Glasses::getBuySaleStockReport('1900-01-01', $asOnDate);
        $framesStockValue = collect($glassesData)->sum('available_value');

        $lensTypesData = LensType::getBuySaleStockReport('1900-01-01', $asOnDate);
        $lensesStockValue = collect($lensTypesData)->sum('available_value');

        $completeGlassesData = CompleteGlasses::getBuySaleStockReport('1900-01-01', $asOnDate);
        $completeGlassesStockValue = collect($completeGlassesData)->sum('available_value');

        $opticsStockValue = $framesStockValue + $lensesStockValue + $completeGlassesStockValue;

        // 4. Advance House Rent (Prepaid Expense) - DATE-WISE
        // Calculate by taking original advance_amount and subtracting deductions up to the date
        $advanceRents = AdvanceHouseRent::where('status', 'active')
            ->where('payment_date', '<=', $asOnDate)
            ->get();

        $advanceHouseRent = 0;
        foreach ($advanceRents as $rent) {
            // Start with original advance amount
            $amount = $rent->advance_amount;

            // Subtract only deductions up to the selected date
            $deductedUpToDate = DB::table('advance_house_rent_deductions')
                ->where('advance_house_rent_id', $rent->id)
                ->where('deduction_date', '<=', $asOnDate)
                ->sum('amount');

            $remainingAsOfDate = $amount - $deductedUpToDate;
            $advanceHouseRent += max(0, $remainingAsOfDate);
        }

        // 5. Fixed Assets - DATE-WISE
        $fixedAssets = FixedAsset::where('status', '!=', 'inactive')
            ->where('purchase_date', '<=', $asOnDate)
            ->sum('total_amount');

        // 5a. House Security (Prepaid Expense) - DATE-WISE
        // Get the cumulative amount spent on House Security category up to the date
        $houseSecurity = DB::table('hospital_transactions')
            ->join('hospital_expense_categories', 'hospital_transactions.expense_category_id', '=', 'hospital_expense_categories.id')
            ->where('hospital_expense_categories.name', 'House Security')
            ->where('hospital_transactions.transaction_date', '<=', $asOnDate)
            ->sum(DB::raw('ABS(hospital_transactions.amount)'));

        // 6. Customer Dues (Receivables) - DATE-WISE
        // Optics Sale Due - Calculate based on payments up to asOnDate
        $opticsSales = OpticsSale::whereDate('created_at', '<=', $asOnDate)
            ->whereNull('deleted_at')
            ->get(['id', 'total_amount', 'advance_payment']);

        $opticsSaleDue = 0;
        foreach ($opticsSales as $sale) {
            // Get payments from payment table up to asOnDate
            $paymentsUpToDate = DB::table('optics_sale_payments')
                ->where('optics_sale_id', $sale->id)
                ->whereDate('created_at', '<=', $asOnDate)
                ->sum('amount');

            // Check if advance payment is recorded in payment table
            $advanceInTable = DB::table('optics_sale_payments')
                ->where('optics_sale_id', $sale->id)
                ->where('notes', 'like', '%Advance%')
                ->whereDate('created_at', '<=', $asOnDate)
                ->sum('amount');

            // Calculate total paid correctly
            // If advance is in payment table, use only payment table (newer sales)
            // If advance is NOT in payment table, use advance_payment field + other payments (older sales)
            $totalPaid = $advanceInTable > 0 ? $paymentsUpToDate : ($sale->advance_payment + $paymentsUpToDate);

            // Due = Total - Total Paid
            $dueAsOnDate = $sale->total_amount - $totalPaid;
            if ($dueAsOnDate > 0) {
                $opticsSaleDue += $dueAsOnDate;
            }
        }

        // Medicine Sale Due
        $medicineSaleDue = MedicineSale::where('due_amount', '>', 0)
            ->where('sale_date', '<=', $asOnDate)
            ->sum('due_amount');

        // Operation Due - Only for COMPLETED operations (service already provided)
        // Scheduled/Pending operations are not assets yet (advance is unearned revenue)
        $operationDue = OperationBooking::where('due_amount', '>', 0)
            ->whereDate('created_at', '<=', $asOnDate)
            ->where('status', 'completed') // Only completed operations
            ->sum('due_amount');

        $totalAssets = $bankBalance
            + $medicineStockValue
            + $opticsStockValue
            + $advanceHouseRent
            + $fixedAssets
            + $houseSecurity
            + $opticsSaleDue
            + $medicineSaleDue
            + $operationDue;

        // ==================== LIABILITIES ====================

        // 1. Optics Vendor Due - DATE-WISE
        // Use current_balance and adjust for future transactions (same logic as Medicine Vendor)
        $vendors = OpticsVendor::all();
        $opticsVendorDue = 0;

        foreach ($vendors as $vendor) {
            // Get future purchases (after asOnDate) that need to be removed
            $futurePurchases = DB::table('optics_vendor_transactions')
                ->where('vendor_id', $vendor->id)
                ->where('transaction_date', '>', $asOnDate)
                ->where('type', 'purchase')
                ->sum('amount') ?? 0;

            // Get future payments (after asOnDate) that need to be added back
            $futurePayments = DB::table('optics_vendor_transactions')
                ->where('vendor_id', $vendor->id)
                ->where('transaction_date', '>', $asOnDate)
                ->where('type', 'payment')
                ->sum('amount') ?? 0;

            // Balance as of asOnDate = current_balance + future_payments - future_purchases
            $vendorBalanceAsOf = $vendor->current_balance + $futurePayments - $futurePurchases;

            // Only add positive balances for 'due' type vendors
            if ($vendor->balance_type === 'due' && $vendorBalanceAsOf > 0) {
                $opticsVendorDue += $vendorBalanceAsOf;
            }
        }

        // 2. Medicine Vendor Due - DATE-WISE
        // Use current_balance and adjust for future transactions (after asOnDate)

        $vendors = DB::table('medicine_vendors')->get();
        $medicineVendorDue = 0;

        foreach ($vendors as $vendor) {
            // Get future purchases (after asOnDate) that need to be removed
            $futurePurchases = DB::table('medicine_vendor_transactions')
                ->where('vendor_id', $vendor->id)
                ->where('transaction_date', '>', $asOnDate)
                ->where('type', 'purchase')
                ->sum('amount') ?? 0;

            // Get future payments (after asOnDate) that need to be added back
            $futurePayments = DB::table('medicine_vendor_payments')
                ->where('vendor_id', $vendor->id)
                ->where('payment_date', '>', $asOnDate)
                ->sum('amount') ?? 0;

            // Balance as of asOnDate = current_balance + future_payments - future_purchases
            $vendorBalanceAsOf = $vendor->current_balance + $futurePayments - $futurePurchases;

            // Only add positive balances (dues, not advances)
            $medicineVendorDue += max(0, $vendorBalanceAsOf);
        }

        // 3. Fixed Asset Purchase Due - DATE-WISE
        // Calculate due amount per vendor as of the specified date
        // For each asset purchased on or before the date, calculate: total_amount - (paid_amount at purchase + vendor payments up to date)

        $vendors = DB::table('fixed_assets')
            ->select('vendor_id')
            ->where('purchase_date', '<=', $asOnDate)
            ->whereNotNull('vendor_id')
            ->whereNull('deleted_at')
            ->distinct()
            ->pluck('vendor_id');

        $assetPurchaseDue = 0;

        foreach ($vendors as $vendorId) {
            // Get total amount and paid amount at time of purchase for this vendor's assets
            $assetTotals = DB::table('fixed_assets')
                ->where('vendor_id', $vendorId)
                ->where('purchase_date', '<=', $asOnDate)
                ->whereNull('deleted_at')
                ->selectRaw('SUM(total_amount) as total, SUM(paid_amount) as paid')
                ->first();

            // Get vendor payments made up to the date for this vendor
            $vendorPayments = DB::table('fixed_asset_vendor_payments')
                ->where('vendor_id', $vendorId)
                ->where('payment_date', '<=', $asOnDate)
                ->sum('amount');

            // Due = Total - Paid at purchase - Vendor payments up to date
            $vendorDue = ($assetTotals->total ?? 0) - ($assetTotals->paid ?? 0) - $vendorPayments;
            $assetPurchaseDue += max(0, $vendorDue); // Ensure non-negative
        }

        // Also handle assets without vendors (if any)
        $noVendorAssets = DB::table('fixed_assets')
            ->whereNull('vendor_id')
            ->where('purchase_date', '<=', $asOnDate)
            ->whereNull('deleted_at')
            ->selectRaw('SUM(total_amount) - SUM(paid_amount) as due')
            ->value('due');

        $assetPurchaseDue += $noVendorAssets ?? 0;

        $totalLiabilities = $opticsVendorDue
            + $medicineVendorDue
            + $assetPurchaseDue;

        // ==================== TOTAL CALCULATION ====================

        // Calculate actual totals WITHOUT forcing balance
        $actualTotalAssets = $bankBalance
            + $medicineStockValue
            + $opticsStockValue
            + $advanceHouseRent
            + $fixedAssets
            + $houseSecurity
            + $opticsSaleDue
            + $medicineSaleDue
            + $operationDue;

        // Total Liabilities + Fund + Net Profit should equal Total Assets
        $totalLiabilitiesAndFund = $totalLiabilities + $fund + $netProfit;

        // DO NOT force balance - show actual totals
        $totalAssets = $actualTotalAssets;
        $reconciliationAdjustment = 0;

        // Calculate the actual difference for debugging
        $balanceDifference = $totalAssets - $totalLiabilitiesAndFund;

        // Debug information
        Log::info('Balance Sheet Debug:', [
            'as_on_date' => $asOnDate,
            'fund_in' => $totalFundIn,
            'fund_out' => $totalFundOut,
            'total_fund' => $fund,
            'total_income' => $totalIncome,
            'total_expenditure' => $totalExpenditure,
            'house_rent_adjustment' => $houseRentAdjustment ?? 0,
            'net_profit' => $netProfit,
            'bank_balance' => $bankBalance,
            'medicine_stock' => $medicineStockValue,
            'optics_stock' => $opticsStockValue,
            'advance_house_rent' => $advanceHouseRent,
            'fixed_assets' => $fixedAssets,
            'house_security' => $houseSecurity,
            'optics_sale_due' => $opticsSaleDue,
            'medicine_sale_due' => $medicineSaleDue,
            'operation_due' => $operationDue,
            'actual_total_assets' => $actualTotalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_liabilities_and_fund' => $totalLiabilitiesAndFund,
            'balance_difference' => $balanceDifference
        ]);

        return Inertia::render('Reports/BalanceSheet', [
            'asOnDate' => $asOnDate,
            'asOnDateFormatted' => date('d M Y', strtotime($asOnDate)),

            // Assets
            'bankBalance' => $bankBalance,
            'medicineStockValue' => $medicineStockValue,
            'opticsStockValue' => $opticsStockValue,
            'advanceHouseRent' => $advanceHouseRent,
            'fixedAssets' => $fixedAssets,
            'houseSecurity' => $houseSecurity,
            'opticsSaleDue' => $opticsSaleDue,
            'medicineSaleDue' => $medicineSaleDue,
            'operationDue' => $operationDue,
            'reconciliationAdjustment' => $reconciliationAdjustment,
            'totalAssets' => $totalAssets,

            // Liabilities
            'opticsVendorDue' => $opticsVendorDue,
            'medicineVendorDue' => $medicineVendorDue,
            'assetPurchaseDue' => $assetPurchaseDue,
            'totalLiabilities' => $totalLiabilities,

            // Fund & Profit (both separate)
            'fund' => $fund, // Fund In - Fund Out
            'netProfit' => $netProfit, // Income - Expenditure (excluding Fixed Asset Purchase)
            'totalLiabilitiesAndFund' => $totalLiabilitiesAndFund,

            // Debug data for display
            'totalFundIn' => $totalFundIn,
            'totalFundOut' => $totalFundOut,
            'totalIncome' => $totalIncome,
            'totalExpenditure' => $totalExpenditure,
            'houseRentAdjustment' => $houseRentAdjustment ?? 0,
            'balanceDifference' => $balanceDifference,
            'actualTotalAssets' => $actualTotalAssets,

            // Date filter
            'filters' => [
                'as_on_date' => $asOnDate,
            ],
        ]);
    }

    /**
     * Export Balance Sheet
     */
    public function export(Request $request)
    {
        // TODO: Implement PDF/Excel export
        return response()->json(['message' => 'Export coming soon']);
    }
}
