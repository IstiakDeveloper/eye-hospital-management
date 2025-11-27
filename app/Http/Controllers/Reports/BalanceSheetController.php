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
    OperationBooking
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
                    // Calculate medicine profit EXACTLY same as Income & Expenditure cumulative
                    // Use HospitalTransaction for historical data + Direct DB for current data

                    // Get start of current month
                    $fromDate = date('Y-m-01', strtotime($toDate));

                    // Current month profit (direct database calculation)
                    $salesData = DB::table('medicine_sales')
                        ->whereBetween('sale_date', [$fromDate, $toDate])
                        ->sum('total_amount');

                    $costData = DB::table('medicine_sale_items')
                        ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                        ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
                        ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                    $currentMonth = $salesData - $costData;

                    // Previous transactions (before current month)
                    $previousTransactions = \App\Models\HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<', $fromDate)
                        ->sum('amount');

                    $cumulative = $previousTransactions + $currentMonth;
                    $totalIncome += $cumulative;
                } else {
                    // Optics Income - Calculate profit EXACTLY same as Income & Expenditure cumulative
                    // Use HospitalTransaction for historical data + Buy-Sale-Stock for current data

                    // Get start of current month
                    $fromDate = date('Y-m-01', strtotime($toDate));

                    // Current month profit
                    $glassesData = \App\Models\Glasses::getBuySaleStockReport($fromDate, $toDate);
                    $lensTypesData = \App\Models\LensType::getBuySaleStockReport($fromDate, $toDate);
                    $completeGlassesData = \App\Models\CompleteGlasses::getBuySaleStockReport($fromDate, $toDate);

                    $itemsProfit = collect($glassesData)->sum('total_profit')
                                 + collect($lensTypesData)->sum('total_profit')
                                 + collect($completeGlassesData)->sum('total_profit');

                    // Add only fitting charge (current month)
                    $onlyFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function($query) {
                            $query->select(DB::raw(1))
                                  ->from('optics_sale_items')
                                  ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    $currentMonth = $itemsProfit + $onlyFittingCharge;

                    // Previous transactions (before current month)
                    $previousTransactions = \App\Models\HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<', $fromDate)
                        ->sum('amount');

                    // Previous only fitting charge (before current month)
                    $previousFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function($query) {
                            $query->select(DB::raw(1))
                                  ->from('optics_sale_items')
                                  ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->where('created_at', '<', $fromDate . ' 00:00:00')
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    $cumulative = $previousTransactions + $previousFittingCharge + $currentMonth;
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
            'Optics Vendor Payment'
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

        // Add special expenses without category_id (excluding Fixed Asset related)
        $specialExpenses = DB::table('hospital_transactions')
            ->whereNull('expense_category_id')
            ->whereNull('income_category_id')
            ->where('amount', '<', 0)
            ->where('description', 'NOT LIKE', '%Fixed Asset%')
            ->where('description', 'NOT LIKE', '%Asset Purchase%')
            ->where('transaction_date', '<=', $toDate)
            ->sum(DB::raw('ABS(amount)'));

        $totalExpenditure += $specialExpenses;

        // Net Profit/Loss (Surplus/Deficit) = Income - Expenditure (EXACTLY same as Income & Expenditure cumulative)
        $netProfit = $totalIncome - $totalExpenditure;

        // ==================== ASSETS ====================

        // 1. Bank Balance (Main source: hospital_account) - DATE-WISE
        $bankBalance = HospitalAccount::getBalance($asOnDate);

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
        $advanceHouseRent = AdvanceHouseRent::where('status', 'active')
            ->where('payment_date', '<=', $asOnDate)
            ->sum('remaining_amount');

        // 5. Fixed Assets - DATE-WISE
        $fixedAssets = FixedAsset::where('status', '!=', 'inactive')
            ->where('purchase_date', '<=', $asOnDate)
            ->sum('total_amount');

        // 6. Customer Dues (Receivables) - DATE-WISE
        // Optics Sale Due
        $opticsSaleDue = OpticsSale::where('due_amount', '>', 0)
            ->whereDate('created_at', '<=', $asOnDate)
            ->sum('due_amount');

        // Medicine Sale Due
        $medicineSaleDue = MedicineSale::where('due_amount', '>', 0)
            ->where('sale_date', '<=', $asOnDate)
            ->sum('due_amount');

        // Operation Due
        $operationDue = OperationBooking::where('due_amount', '>', 0)
            ->where('scheduled_date', '<=', $asOnDate)
            ->sum('due_amount');

        $totalAssets = $bankBalance
            + $medicineStockValue
            + $opticsStockValue
            + $advanceHouseRent
            + $fixedAssets
            + $opticsSaleDue
            + $medicineSaleDue
            + $operationDue;

        // ==================== LIABILITIES ====================

        // 1. Optics Vendor Due - DATE-WISE
        // Check if vendor transactions exist, otherwise use vendor current_balance
        $opticsVendorTxnCount = DB::table('optics_vendor_transactions')->count();

        if ($opticsVendorTxnCount > 0) {
            // Calculate from transactions
            $opticsVendorDue = DB::table('optics_vendor_transactions')
                ->where('transaction_date', '<=', $asOnDate)
                ->selectRaw('SUM(CASE WHEN type = "purchase" THEN amount ELSE 0 END) - SUM(CASE WHEN type = "payment" THEN amount ELSE 0 END) as balance')
                ->value('balance') ?? 0;
        } else {
            // Use vendor current_balance (no transaction history)
            $opticsVendorDue = OpticsVendor::sum('current_balance');
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

        // Total Liabilities + Fund + Net Profit should equal Total Assets
        $totalLiabilitiesAndFund = $totalLiabilities + $fund + $netProfit;

        // Debug information
        Log::info('Balance Sheet Debug:', [
            'fund_in' => $totalFundIn,
            'fund_out' => $totalFundOut,
            'total_fund' => $fund,
            'total_income' => $totalIncome,
            'total_expenditure' => $totalExpenditure,
            'net_profit' => $netProfit,
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'balance_check' => $totalAssets - $totalLiabilitiesAndFund
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
            'opticsSaleDue' => $opticsSaleDue,
            'medicineSaleDue' => $medicineSaleDue,
            'operationDue' => $operationDue,
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
