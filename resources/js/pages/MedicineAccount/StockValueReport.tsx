import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { AlertTriangle, CheckCircle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

interface StockValueReportProps {
    accountBalance: number;
    totalStockValue: number;
    totalInvestment: number;
    totalSold: number;
}

const StockValueReport: React.FC<StockValueReportProps> = ({ accountBalance, totalStockValue, totalInvestment, totalSold }) => {
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

    // Calculate metrics
    const stockSoldValue = totalInvestment - totalStockValue;
    const totalAssets = accountBalance + totalStockValue;
    const roi = totalInvestment > 0 ? ((totalSold - totalInvestment) / totalInvestment) * 100 : 0;
    const inventoryTurnover = totalInvestment > 0 ? stockSoldValue / totalStockValue : 0;
    const stockUtilization = totalInvestment > 0 ? (stockSoldValue / totalInvestment) * 100 : 0;

    // Health indicators
    const isBalanced = Math.abs(totalAssets - (accountBalance + totalStockValue)) < 1;
    const isHealthyRoi = roi > 15;
    const isGoodTurnover = inventoryTurnover > 2;
    const isOptimalUtilization = stockUtilization > 60 && stockUtilization < 90;

    return (
        <MedicineAccountLayout title="Stock Value Report">
            {/* Header */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Inventory & Account Reconciliation Report</h2>
                <p className="text-gray-600">Real-time stock valuation vs account balance analysis</p>
            </div>

            {/* Key Metrics */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Stock Value</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalStockValue)}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Assets</p>
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(totalAssets)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">ROI</p>
                            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}%</p>
                        </div>
                        {roi >= 0 ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />}
                    </div>
                </div>
            </div>

            {/* Reconciliation Status */}
            <div className={`mb-8 rounded-lg border p-6 ${isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center">
                    {isBalanced ? <CheckCircle className="mr-3 h-6 w-6 text-green-600" /> : <AlertTriangle className="mr-3 h-6 w-6 text-red-600" />}
                    <div>
                        <h3 className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                            {isBalanced ? 'Account Reconciliation: BALANCED' : 'Account Reconciliation: IMBALANCED'}
                        </h3>
                        <p className={`text-sm ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                            {isBalanced
                                ? 'Your account balance and stock valuation are properly reconciled.'
                                : 'There may be discrepancies between your account records and actual stock value.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Breakdown */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Investment Analysis */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">Investment Analysis</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="flex justify-between border-b py-2">
                            <span className="text-gray-600">Total Investment (Purchases)</span>
                            <span className="font-medium text-orange-600">{formatAmount(totalInvestment)}</span>
                        </div>

                        <div className="flex justify-between border-b py-2">
                            <span className="text-gray-600">Current Stock Value</span>
                            <span className="font-medium text-blue-600">{formatAmount(totalStockValue)}</span>
                        </div>

                        <div className="flex justify-between border-b py-2">
                            <span className="text-gray-600">Stock Sold Value</span>
                            <span className="font-medium text-gray-600">{formatAmount(stockSoldValue)}</span>
                        </div>

                        <div className="flex justify-between border-b py-2">
                            <span className="text-gray-600">Cash from Sales</span>
                            <span className="font-medium text-green-600">{formatAmount(totalSold)}</span>
                        </div>

                        <div className="flex justify-between py-2 text-lg font-semibold">
                            <span>Net Gain/Loss</span>
                            <span className={`${totalSold - totalInvestment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(totalSold - totalInvestment)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Asset Composition */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">Asset Composition</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-medium">Liquid Assets (Cash)</span>
                                    <span className="text-sm text-green-600">
                                        {totalAssets > 0 ? ((accountBalance / totalAssets) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-200">
                                    <div
                                        className="h-3 rounded-full bg-green-500"
                                        style={{ width: `${totalAssets > 0 ? (accountBalance / totalAssets) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-right text-sm text-gray-600">{formatAmount(accountBalance)}</div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-sm font-medium">Inventory Assets (Stock)</span>
                                    <span className="text-sm text-blue-600">
                                        {totalAssets > 0 ? ((totalStockValue / totalAssets) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-gray-200">
                                    <div
                                        className="h-3 rounded-full bg-blue-500"
                                        style={{ width: `${totalAssets > 0 ? (totalStockValue / totalAssets) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-right text-sm text-gray-600">{formatAmount(totalStockValue)}</div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between font-semibold">
                                <span>Total Assets</span>
                                <span className="text-purple-600">{formatAmount(totalAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Indicators */}
            <div className="mb-8 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Business Performance Indicators</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className={`rounded-lg p-4 ${isHealthyRoi ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-medium">Return on Investment</span>
                                {isHealthyRoi ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${isHealthyRoi ? 'text-green-600' : 'text-yellow-600'}`}>{roi.toFixed(1)}%</div>
                            <p className={`text-sm ${isHealthyRoi ? 'text-green-700' : 'text-yellow-700'}`}>
                                {isHealthyRoi ? 'Excellent ROI!' : 'ROI could be improved'}
                            </p>
                        </div>

                        <div className={`rounded-lg p-4 ${isGoodTurnover ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-medium">Inventory Turnover</span>
                                {isGoodTurnover ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${isGoodTurnover ? 'text-green-600' : 'text-yellow-600'}`}>
                                {inventoryTurnover.toFixed(1)}x
                            </div>
                            <p className={`text-sm ${isGoodTurnover ? 'text-green-700' : 'text-yellow-700'}`}>
                                {isGoodTurnover ? 'Good stock movement' : 'Slow inventory turnover'}
                            </p>
                        </div>

                        <div className={`rounded-lg p-4 ${isOptimalUtilization ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-medium">Stock Utilization</span>
                                {isOptimalUtilization ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${isOptimalUtilization ? 'text-green-600' : 'text-yellow-600'}`}>
                                {stockUtilization.toFixed(1)}%
                            </div>
                            <p className={`text-sm ${isOptimalUtilization ? 'text-green-700' : 'text-yellow-700'}`}>
                                {isOptimalUtilization ? 'Optimal utilization' : 'Review stock levels'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Business Recommendations</h3>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {!isHealthyRoi && (
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <h4 className="mb-2 font-medium text-yellow-800">Improve ROI</h4>
                                <p className="text-sm text-yellow-700">
                                    Consider optimizing your pricing strategy or reducing operational costs to improve return on investment.
                                </p>
                            </div>
                        )}

                        {!isGoodTurnover && (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                <h4 className="mb-2 font-medium text-orange-800">Increase Inventory Turnover</h4>
                                <p className="text-sm text-orange-700">
                                    Focus on fast-moving medicines and consider promotional strategies to move slow-selling inventory.
                                </p>
                            </div>
                        )}

                        {!isOptimalUtilization && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <h4 className="mb-2 font-medium text-blue-800">Optimize Stock Levels</h4>
                                <p className="text-sm text-blue-700">
                                    {stockUtilization < 60
                                        ? 'You have excess inventory. Consider reducing future orders or implementing promotions.'
                                        : 'Your stock levels are running low. Consider restocking popular medicines.'}
                                </p>
                            </div>
                        )}

                        {isHealthyRoi && isGoodTurnover && isOptimalUtilization && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <h4 className="mb-2 font-medium text-green-800">Excellent Performance!</h4>
                                <p className="text-sm text-green-700">
                                    Your medicine business is performing very well across all key metrics. Keep up the good work!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MedicineAccountLayout>
    );
};

export default StockValueReport;
