import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { BarChart3, DollarSign, Eye, Glasses, TrendingUp } from 'lucide-react';
import React from 'react';

interface BalanceSheetProps {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    totalFundIn: number;
    totalFundOut: number;
    totalGlassesPurchases: number;
    totalGlassesSales: number;
    totalLensPurchases: number;
    totalLensSales: number;
    glassesProfit: number;
    lensProfit: number;
    opticsProfit: number;
    currentMonthGlassesPurchases: number;
    currentMonthGlassesSales: number;
    currentMonthLensPurchases: number;
    currentMonthLensSales: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
    balance,
    totalIncome,
    totalExpense,
    totalFundIn,
    totalFundOut,
    totalGlassesPurchases,
    totalGlassesSales,
    totalLensPurchases,
    totalLensSales,
    glassesProfit,
    lensProfit,
    opticsProfit,
    currentMonthGlassesPurchases,
    currentMonthGlassesSales,
    currentMonthLensPurchases,
    currentMonthLensSales,
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
    const currentMonthGlassesProfit = currentMonthGlassesSales - currentMonthGlassesPurchases;
    const currentMonthLensProfit = currentMonthLensSales - currentMonthLensPurchases;
    const glassesMargin = totalGlassesSales > 0 ? (glassesProfit / totalGlassesSales) * 100 : 0;
    const lensMargin = totalLensSales > 0 ? (lensProfit / totalLensSales) * 100 : 0;

    return (
        <OpticsAccountLayout title="Balance Sheet">
            {/* Header */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Optics Account - Balance Sheet</h2>
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
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(balance)}</p>
                        </div>
                        <Glasses className="h-8 w-8 text-purple-600" />
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
                            <p className="text-2xl font-bold text-green-600">{formatAmount(totalEquity)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Optics Profit</p>
                            <p className={`text-2xl font-bold ${opticsProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(opticsProfit)}
                            </p>
                        </div>
                        <Eye className="h-8 w-8 text-green-600" />
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
                    <div className="border-b bg-purple-50 p-6">
                        <h3 className="text-lg font-semibold text-purple-800">ASSETS</h3>
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
                                <span className="text-purple-600">{formatAmount(totalAssets)}</span>
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

            {/* Product Business Analysis */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Glasses Business */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="flex items-center text-lg font-semibold">
                            <Glasses className="mr-2 h-5 w-5 text-green-600" />
                            Glasses Business Analysis
                        </h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-2">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Glasses Sales</span>
                                <span className="font-medium text-green-600">{formatAmount(totalGlassesSales)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Glasses Purchases</span>
                                <span className="font-medium text-orange-600">{formatAmount(totalGlassesPurchases)}</span>
                            </div>

                            <div className="flex justify-between border-t py-2 font-semibold">
                                <span>Glasses Gross Profit</span>
                                <span className={glassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(glassesProfit)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Profit Margin</span>
                                <span className={`font-medium ${glassesMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {glassesMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="mb-2 font-medium text-gray-900">Current Month</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Sales</span>
                                    <span className="font-medium text-green-600">{formatAmount(currentMonthGlassesSales)}</span>
                                </div>

                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Purchases</span>
                                    <span className="font-medium text-orange-600">{formatAmount(currentMonthGlassesPurchases)}</span>
                                </div>

                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Monthly Profit</span>
                                    <span className={currentMonthGlassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatAmount(currentMonthGlassesProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lens Business */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="flex items-center text-lg font-semibold">
                            <Eye className="mr-2 h-5 w-5 text-blue-600" />
                            Lens Business Analysis
                        </h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-2">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Lens Sales</span>
                                <span className="font-medium text-blue-600">{formatAmount(totalLensSales)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Total Lens Purchases</span>
                                <span className="font-medium text-purple-600">{formatAmount(totalLensPurchases)}</span>
                            </div>

                            <div className="flex justify-between border-t py-2 font-semibold">
                                <span>Lens Gross Profit</span>
                                <span className={lensProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(lensProfit)}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Profit Margin</span>
                                <span className={`font-medium ${lensMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{lensMargin.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="mb-2 font-medium text-gray-900">Current Month</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Sales</span>
                                    <span className="font-medium text-blue-600">{formatAmount(currentMonthLensSales)}</span>
                                </div>

                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Monthly Purchases</span>
                                    <span className="font-medium text-purple-600">{formatAmount(currentMonthLensPurchases)}</span>
                                </div>

                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Monthly Profit</span>
                                    <span className={currentMonthLensProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatAmount(currentMonthLensProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Financial Summary</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

            {/* Key Performance Indicators */}
            <div className="mb-6 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{glassesMargin.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Glasses Margin</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{lensMargin.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Lens Margin</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{roi.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Return on Investment</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {totalGlassesSales > totalLensSales ? 'Glasses' : totalLensSales > totalGlassesSales ? 'Lens' : 'Equal'}
                            </div>
                            <div className="text-sm text-gray-600">Top Performer</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Verification */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <h4 className="mb-2 font-semibold text-purple-900">Balance Sheet Equation</h4>
                <p className="text-purple-800">
                    Assets = Equity → {formatAmount(totalAssets)} = {formatAmount(totalEquity)}
                </p>
                <p className="mt-1 text-sm text-purple-700">
                    {totalAssets === totalEquity ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet needs reconciliation'}
                </p>

                <div className="mt-4 text-sm text-purple-700">
                    <p>
                        <strong>Optics Business Health:</strong>{' '}
                        {glassesMargin > 20 && lensMargin > 20
                            ? 'Excellent profit margins across both product lines!'
                            : glassesMargin > 15 || lensMargin > 15
                              ? 'Good performance, focus on optimizing lower-margin products'
                              : 'Review pricing strategy and supplier costs for better margins'}
                    </p>
                </div>
            </div>
        </OpticsAccountLayout>
    );
};

export default BalanceSheet;
