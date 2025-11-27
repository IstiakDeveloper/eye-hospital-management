import React from 'react';
import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { Package, DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface StockValueReportProps {
    accountBalance: number;
    totalStockValue: number;
    totalInvestment: number;
    totalSold: number;
}

const StockValueReport: React.FC<StockValueReportProps> = ({
    accountBalance,
    totalStockValue,
    totalInvestment,
    totalSold
}) => {
    // Format amount helper
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('BDT', '৳');
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
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Inventory & Account Reconciliation Report
                </h2>
                <p className="text-gray-600">
                    Real-time stock valuation vs account balance analysis
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Stock Value</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalStockValue)}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Assets</p>
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(totalAssets)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">ROI</p>
                            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {roi.toFixed(1)}%
                            </p>
                        </div>
                        {roi >= 0 ? (
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        ) : (
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                </div>
            </div>

            {/* Reconciliation Status */}
            <div className={`p-6 rounded-lg border mb-8 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                    {isBalanced ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                    )}
                    <div>
                        <h3 className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                            {isBalanced ? 'Account Reconciliation: BALANCED' : 'Account Reconciliation: IMBALANCED'}
                        </h3>
                        <p className={`text-sm ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                            {isBalanced
                                ? 'Your account balance and stock valuation are properly reconciled.'
                                : 'There may be discrepancies between your account records and actual stock value.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Investment Analysis */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold">Investment Analysis</h3>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total Investment (Purchases)</span>
                            <span className="font-medium text-orange-600">{formatAmount(totalInvestment)}</span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Current Stock Value</span>
                            <span className="font-medium text-blue-600">{formatAmount(totalStockValue)}</span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Stock Sold Value</span>
                            <span className="font-medium text-gray-600">{formatAmount(stockSoldValue)}</span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Cash from Sales</span>
                            <span className="font-medium text-green-600">{formatAmount(totalSold)}</span>
                        </div>

                        <div className="flex justify-between py-2 font-semibold text-lg">
                            <span>Net Gain/Loss</span>
                            <span className={`${(totalSold - totalInvestment) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(totalSold - totalInvestment)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Asset Composition */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold">Asset Composition</h3>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">Liquid Assets (Cash)</span>
                                    <span className="text-sm text-green-600">
                                        {totalAssets > 0 ? ((accountBalance / totalAssets) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded-full"
                                        style={{ width: `${totalAssets > 0 ? (accountBalance / totalAssets) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="text-right text-sm text-gray-600 mt-1">
                                    {formatAmount(accountBalance)}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">Inventory Assets (Stock)</span>
                                    <span className="text-sm text-blue-600">
                                        {totalAssets > 0 ? ((totalStockValue / totalAssets) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-500 h-3 rounded-full"
                                        style={{ width: `${totalAssets > 0 ? (totalStockValue / totalAssets) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="text-right text-sm text-gray-600 mt-1">
                                    {formatAmount(totalStockValue)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Assets</span>
                                <span className="text-purple-600">{formatAmount(totalAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Indicators */}
            <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Business Performance Indicators</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-lg ${isHealthyRoi ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Return on Investment</span>
                                {isHealthyRoi ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${isHealthyRoi ? 'text-green-600' : 'text-yellow-600'}`}>
                                {roi.toFixed(1)}%
                            </div>
                            <p className={`text-sm ${isHealthyRoi ? 'text-green-700' : 'text-yellow-700'}`}>
                                {isHealthyRoi ? 'Excellent ROI!' : 'ROI could be improved'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg ${isGoodTurnover ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Inventory Turnover</span>
                                {isGoodTurnover ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold ${isGoodTurnover ? 'text-green-600' : 'text-yellow-600'}`}>
                                {inventoryTurnover.toFixed(1)}x
                            </div>
                            <p className={`text-sm ${isGoodTurnover ? 'text-green-700' : 'text-yellow-700'}`}>
                                {isGoodTurnover ? 'Good stock movement' : 'Slow inventory turnover'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg ${isOptimalUtilization ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Stock Utilization</span>
                                {isOptimalUtilization ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Business Recommendations</h3>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {!isHealthyRoi && (
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h4 className="font-medium text-yellow-800 mb-2">Improve ROI</h4>
                                <p className="text-sm text-yellow-700">
                                    Consider optimizing your pricing strategy or reducing operational costs to improve return on investment.
                                </p>
                            </div>
                        )}

                        {!isGoodTurnover && (
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <h4 className="font-medium text-orange-800 mb-2">Increase Inventory Turnover</h4>
                                <p className="text-sm text-orange-700">
                                    Focus on fast-moving medicines and consider promotional strategies to move slow-selling inventory.
                                </p>
                            </div>
                        )}

                        {!isOptimalUtilization && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-800 mb-2">Optimize Stock Levels</h4>
                                <p className="text-sm text-blue-700">
                                    {stockUtilization < 60
                                        ? 'You have excess inventory. Consider reducing future orders or implementing promotions.'
                                        : 'Your stock levels are running low. Consider restocking popular medicines.'
                                    }
                                </p>
                            </div>
                        )}

                        {isHealthyRoi && isGoodTurnover && isOptimalUtilization && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h4 className="font-medium text-green-800 mb-2">Excellent Performance!</h4>
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
