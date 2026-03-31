import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import React from 'react';

interface BalanceSheetProps {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    totalFundIn: number;
    totalFundOut: number;
    totalMedicinePurchases: number;
    totalMedicineSales: number;
    medicineProfit: number;
    currentMonthPurchases: number;
    currentMonthSales: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
    balance,
    totalIncome,
    totalExpense,
    totalFundIn,
    totalFundOut,
    totalMedicinePurchases,
    totalMedicineSales,
    medicineProfit,
    currentMonthPurchases,
    currentMonthSales,
}) => {
    // Format amount helper
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const netProfit = totalIncome - totalExpense;
    const netFund = totalFundIn - totalFundOut;
    const totalAssets = balance;
    const totalEquity = netFund + netProfit;

    // Calculate ROI and other metrics
    const roi = totalFundIn > 0 ? (netProfit / totalFundIn) * 100 : 0;
    const currentMonthProfit = currentMonthSales - currentMonthPurchases;
    const profitMargin = totalMedicineSales > 0 ? (medicineProfit / totalMedicineSales) * 100 : 0;

    return (
        <MedicineAccountLayout title="Balance Sheet">
            {/* Header */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Medicine Account - Balance Sheet</h2>
                <p className="text-gray-600">
                    As of{' '}
                    {new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-5">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Balance</p>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(balance)}</p>
                        </div>
                        <Package className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Assets</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalAssets)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Equity</p>
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(totalEquity)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Medicine Profit</p>
                            <p className={`text-2xl font-bold ${medicineProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(medicineProfit)}
                            </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">ROI</p>
                            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}%</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Balance Sheet Tables */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Assets */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-green-50 p-6">
                        <h3 className="text-lg font-semibold text-green-800">ASSETS</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium tracking-wide text-gray-900 uppercase">Current Assets</h4>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Cash & Bank Balance</span>
                                <span className="font-medium">{formatAmount(balance)}</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>TOTAL ASSETS</span>
                                <span className="text-green-600">{formatAmount(totalAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equity */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-blue-50 p-6">
                        <h3 className="text-lg font-semibold text-blue-800">EQUITY</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium tracking-wide text-gray-900 uppercase">Owner's Equity</h4>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Capital (Fund In - Fund Out)</span>
                                <span className="font-medium">{formatAmount(netFund)}</span>
                            </div>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Retained Earnings (Net Profit)</span>
                                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(netProfit)}</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>TOTAL EQUITY</span>
                                <span className="text-blue-600">{formatAmount(totalEquity)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medicine Business Analysis */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Medicine Business Performance */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">Medicine Business Analysis</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-2">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Medicine Sales</span>
                                <span className="font-medium text-green-600">{formatAmount(totalMedicineSales)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Medicine Purchases</span>
                                <span className="font-medium text-orange-600">{formatAmount(totalMedicinePurchases)}</span>
                            </div>

                            <div className="flex justify-between border-t py-2 font-semibold">
                                <span>Medicine Gross Profit</span>
                                <span className={medicineProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(medicineProfit)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Profit Margin</span>
                                <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {profitMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="mb-2 font-medium text-gray-900">Current Month</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Sales</span>
                                    <span className="font-medium text-green-600">{formatAmount(currentMonthSales)}</span>
                                </div>

                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Purchases</span>
                                    <span className="font-medium text-orange-600">{formatAmount(currentMonthPurchases)}</span>
                                </div>

                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Monthly Profit</span>
                                    <span className={currentMonthProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatAmount(currentMonthProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">Financial Summary</h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Income Statement Summary */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Income Statement Summary</h4>

                                <div className="space-y-2">
                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">Total Revenue</span>
                                        <span className="font-medium text-green-600">{formatAmount(totalIncome)}</span>
                                    </div>

                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">Total Expenses</span>
                                        <span className="font-medium text-red-600">{formatAmount(totalExpense)}</span>
                                    </div>

                                    <div className="flex justify-between border-t py-2 font-semibold">
                                        <span>Net Profit/Loss</span>
                                        <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(netProfit)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Flow Summary */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Cash Flow Summary</h4>

                                <div className="space-y-2">
                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">Total Fund In</span>
                                        <span className="font-medium text-green-600">{formatAmount(totalFundIn)}</span>
                                    </div>

                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">Total Fund Out</span>
                                        <span className="font-medium text-red-600">{formatAmount(totalFundOut)}</span>
                                    </div>

                                    <div className="flex justify-between border-t py-2 font-semibold">
                                        <span>Net Cash Flow</span>
                                        <span className={netFund >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(netFund)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="mb-6 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{profitMargin.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Profit Margin</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{roi.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Return on Investment</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {totalMedicinePurchases > 0 ? (totalMedicineSales / totalMedicinePurchases).toFixed(1) : '0'}x
                            </div>
                            <div className="text-sm text-gray-600">Sales Multiplier</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {totalFundIn > 0 ? ((balance / totalFundIn) * 100).toFixed(1) : '0'}%
                            </div>
                            <div className="text-sm text-gray-600">Fund Efficiency</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Verification */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h4 className="mb-2 font-semibold text-green-900">Balance Sheet Equation</h4>
                <p className="text-green-800">
                    Assets = Equity → {formatAmount(totalAssets)} = {formatAmount(totalEquity)}
                </p>
                <p className="mt-1 text-sm text-green-700">
                    {totalAssets === totalEquity ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet needs reconciliation'}
                </p>

                <div className="mt-4 text-sm text-green-700">
                    <p>
                        <strong>Medicine Business Health:</strong>{' '}
                        {profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : profitMargin > 0 ? 'Fair' : 'Needs Improvement'} profit margin
                        of {profitMargin.toFixed(1)}%
                    </p>
                </div>
            </div>
        </MedicineAccountLayout>
    );
};

export default BalanceSheet;
