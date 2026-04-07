<?php

namespace App\Support;

use App\Models\HospitalExpenseCategory;
use App\Models\HospitalIncomeCategory;
use App\Models\HospitalTransaction;
use Illuminate\Support\Facades\DB;

/**
 * Cumulative income & expenditure to a single date — same rules as BalanceSheetController
 * and Income & Expenditure report (cumulative column when the report period ends at $toDate).
 */
class IncomeExpenditureCumulativeCalculator
{
    /**
     * @return array{total_income: float, total_expenditure: float, house_rent_adjustment: float, net_profit: float}
     */
    public static function totalsToDate(string $toDate): array
    {
        $incomeCategories = HospitalIncomeCategory::orderBy('name')->get();
        $totalIncome = 0;

        foreach ($incomeCategories as $category) {
            if (in_array($category->name, ['Medicine Income', 'Optics Income'])) {
                if ($category->name === 'Medicine Income') {
                    $salesData = DB::table('medicine_sales')
                        ->where('sale_date', '<=', $toDate)
                        ->sum('total_amount');

                    $costData = DB::table('medicine_sale_items')
                        ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
                        ->where('medicine_sales.sale_date', '<=', $toDate)
                        ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

                    $profit = $salesData - $costData;

                    $manualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<=', $toDate)
                        ->where('description', 'NOT LIKE', '%Medicine Sale:%')
                        ->sum('amount');

                    $totalIncome += $manualIncome + $profit;
                } else {
                    $glassesData = \App\Models\Glasses::getBuySaleStockReport('1900-01-01', $toDate);
                    $lensTypesData = \App\Models\LensType::getBuySaleStockReport('1900-01-01', $toDate);
                    $completeGlassesData = \App\Models\CompleteGlasses::getBuySaleStockReport('1900-01-01', $toDate);

                    $itemsProfit = collect($glassesData)->sum('total_profit')
                        + collect($lensTypesData)->sum('total_profit')
                        + collect($completeGlassesData)->sum('total_profit');

                    $onlyFittingCharge = DB::table('optics_sales')
                        ->whereNotExists(function ($query) {
                            $query->select(DB::raw(1))
                                ->from('optics_sale_items')
                                ->whereColumn('optics_sale_items.optics_sale_id', 'optics_sales.id');
                        })
                        ->where('glass_fitting_price', '>', 0)
                        ->where('created_at', '<=', $toDate.' 23:59:59')
                        ->whereNull('deleted_at')
                        ->sum('glass_fitting_price');

                    $profit = $itemsProfit + $onlyFittingCharge;

                    $manualIncome = HospitalTransaction::where('income_category_id', $category->id)
                        ->where('transaction_date', '<=', $toDate)
                        ->where('description', 'NOT LIKE', '%Advance Payment%')
                        ->where('description', 'NOT LIKE', '%Due Payment%')
                        ->where('description', 'NOT LIKE', '%Invoice:%')
                        ->sum('amount');

                    $totalIncome += $manualIncome + $profit;
                }
            } else {
                $cumulative = HospitalTransaction::where('income_category_id', $category->id)
                    ->where('transaction_date', '<=', $toDate)
                    ->sum('amount');

                $totalIncome += $cumulative;
            }
        }

        $excludeCategories = [
            'Fixed Asset Purchase',
            'Fixed Asset Vendor Payment',
            'Medicine Purchase',
            'Medicine Vendor Payment',
            'Optics Purchase',
            'Optics Vendor Payment',
            'House Security',
        ];

        $expenseCategories = HospitalExpenseCategory::whereNotIn('name', $excludeCategories)
            ->orderBy('name')
            ->get();

        $totalExpenditure = 0;

        foreach ($expenseCategories as $category) {
            $cumulative = HospitalTransaction::where('expense_category_id', $category->id)
                ->where('transaction_date', '<=', $toDate)
                ->sum('amount');

            $totalExpenditure += abs($cumulative);
        }

        $asOnMonth = (int) date('n', strtotime($toDate));
        $asOnYear = (int) date('Y', strtotime($toDate));
        $periodEndCumulative = $asOnYear * 100 + $asOnMonth;

        $houseRentAdjustment = \App\Models\AdvanceHouseRentDeduction::whereRaw('(year * 100 + month) <= ?', [$periodEndCumulative])
            ->sum('amount');

        $totalExpenditure += $houseRentAdjustment;

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

        $netProfit = $totalIncome - $totalExpenditure;

        return [
            'total_income' => (float) $totalIncome,
            'total_expenditure' => (float) $totalExpenditure,
            'house_rent_adjustment' => (float) $houseRentAdjustment,
            'net_profit' => (float) $netProfit,
        ];
    }
}
