import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    DollarSign,
    Download,
    Eye,
    Glasses,
    Package,
    PieChart,
    RefreshCw,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';

interface InventoryReportProps {
    accountBalance: number;
    totalInventoryValue: number;
    totalGlassesValue: number;
    totalLensValue: number;
    totalInvestment: number;
    totalSold: number;
}

const InventoryReport: React.FC<InventoryReportProps> = ({
    accountBalance,
    totalInventoryValue,
    totalGlassesValue,
    totalLensValue,
    totalInvestment,
    totalSold,
}) => {
    const [refreshing, setRefreshing] = useState(false);

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
    const totalProfit = totalSold - totalInvestment;
    const profitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
    const inventoryTurnover = totalInventoryValue > 0 ? totalSold / totalInventoryValue : 0;
    const remainingValue = totalInvestment - totalSold;
    const cashFlow = accountBalance + totalInventoryValue;

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        router.reload({
            onFinish: () => setRefreshing(false),
        });
    };

    // Export report
    const handleExport = (format: string) => {
        router.post('/optics-account/export-report', {
            type: 'inventory',
            format: format,
        });
    };

    return (
        <OpticsAccountLayout title="Inventory Report">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Inventory Value Report</h2>
                    <p className="text-gray-600">Complete overview of your optical inventory and investments</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center rounded-lg bg-gray-600 px-3 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </button>

                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Account Balance */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-sm text-gray-600">Account Balance</p>
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(accountBalance)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                </div>

                {/* Total Inventory Value */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-sm text-gray-600">Inventory Value</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalInventoryValue)}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                {/* Total Investment */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-sm text-gray-600">Total Investment</p>
                            <p className="text-2xl font-bold text-orange-600">{formatAmount(totalInvestment)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                </div>

                {/* Total Sold */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-sm text-gray-600">Total Sold</p>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(totalSold)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
                <h3 className="mb-4 text-lg font-semibold">Financial Summary</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                        <p className="mb-1 text-sm text-purple-200">Total Profit/Loss</p>
                        <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatAmount(totalProfit)}</p>
                        <p className="mt-1 text-sm text-purple-200">
                            {profitPercentage >= 0 ? '+' : ''}
                            {profitPercentage.toFixed(2)}% ROI
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 text-sm text-purple-200">Cash Flow</p>
                        <p className="text-2xl font-bold text-white">{formatAmount(cashFlow)}</p>
                        <p className="mt-1 text-sm text-purple-200">Balance + Inventory</p>
                    </div>
                    <div>
                        <p className="mb-1 text-sm text-purple-200">Inventory Turnover</p>
                        <p className="text-2xl font-bold text-white">{inventoryTurnover.toFixed(2)}x</p>
                        <p className="mt-1 text-sm text-purple-200">Sales / Inventory Value</p>
                    </div>
                </div>
            </div>

            {/* Inventory Breakdown */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Glasses Inventory */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Glasses Inventory</h3>
                        <Glasses className="h-5 w-5 text-blue-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Current Stock Value:</span>
                            <span className="font-bold text-blue-600">{formatAmount(totalGlassesValue)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Percentage of Total:</span>
                            <span className="font-semibold text-gray-900">
                                {totalInventoryValue > 0 ? ((totalGlassesValue / totalInventoryValue) * 100).toFixed(1) : 0}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                    width: totalInventoryValue > 0 ? `${(totalGlassesValue / totalInventoryValue) * 100}%` : '0%',
                                }}
                            ></div>
                        </div>

                        <div className="border-t pt-2">
                            <div className="flex items-center text-sm">
                                {totalGlassesValue > 0 ? (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                        <span className="text-green-600">In Stock</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                                        <span className="text-yellow-600">Low Stock</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lens Inventory */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Lens Inventory</h3>
                        <Eye className="h-5 w-5 text-purple-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Current Stock Value:</span>
                            <span className="font-bold text-purple-600">{formatAmount(totalLensValue)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Percentage of Total:</span>
                            <span className="font-semibold text-gray-900">
                                {totalInventoryValue > 0 ? ((totalLensValue / totalInventoryValue) * 100).toFixed(1) : 0}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{
                                    width: totalInventoryValue > 0 ? `${(totalLensValue / totalInventoryValue) * 100}%` : '0%',
                                }}
                            ></div>
                        </div>

                        <div className="border-t pt-2">
                            <div className="flex items-center text-sm">
                                {totalLensValue > 0 ? (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                        <span className="text-green-600">In Stock</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                                        <span className="text-yellow-600">Low Stock</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investment Analysis */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Analysis</h3>
                    <BarChart3 className="h-5 w-5 text-green-500" />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <p className="mb-2 text-sm text-gray-600">Total Invested</p>
                        <p className="text-xl font-bold text-red-600">{formatAmount(totalInvestment)}</p>
                        <p className="mt-1 text-xs text-gray-500">Purchase Cost</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <p className="mb-2 text-sm text-gray-600">Total Sold</p>
                        <p className="text-xl font-bold text-green-600">{formatAmount(totalSold)}</p>
                        <p className="mt-1 text-xs text-gray-500">Revenue Generated</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <p className="mb-2 text-sm text-gray-600">Remaining Investment</p>
                        <p className="text-xl font-bold text-orange-600">{formatAmount(remainingValue)}</p>
                        <p className="mt-1 text-xs text-gray-500">Unsold Stock Cost</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                        <p className="mb-2 text-sm text-gray-600">Net Profit</p>
                        <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(totalProfit)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {profitPercentage >= 0 ? '+' : ''}
                            {profitPercentage.toFixed(2)}% ROI
                        </p>
                    </div>
                </div>

                {/* Investment Performance Indicators */}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3">
                        <div className="text-center">
                            <div
                                className={`mx-auto mb-2 h-3 w-3 rounded-full ${
                                    profitPercentage >= 20 ? 'bg-green-500' : profitPercentage >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            ></div>
                            <p className="text-xs text-gray-600">ROI Status</p>
                            <p className="text-sm font-semibold">
                                {profitPercentage >= 20 ? 'Excellent' : profitPercentage >= 10 ? 'Good' : profitPercentage >= 0 ? 'Fair' : 'Loss'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3">
                        <div className="text-center">
                            <div
                                className={`mx-auto mb-2 h-3 w-3 rounded-full ${
                                    inventoryTurnover >= 2 ? 'bg-green-500' : inventoryTurnover >= 1 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            ></div>
                            <p className="text-xs text-gray-600">Turnover Rate</p>
                            <p className="text-sm font-semibold">{inventoryTurnover >= 2 ? 'High' : inventoryTurnover >= 1 ? 'Medium' : 'Low'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3">
                        <div className="text-center">
                            <div
                                className={`mx-auto mb-2 h-3 w-3 rounded-full ${
                                    totalInventoryValue >= 50000 ? 'bg-green-500' : totalInventoryValue >= 20000 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            ></div>
                            <p className="text-xs text-gray-600">Stock Level</p>
                            <p className="text-sm font-semibold">
                                {totalInventoryValue >= 50000 ? 'High' : totalInventoryValue >= 20000 ? 'Medium' : 'Low'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Business Recommendations</h3>
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Inventory Recommendations */}
                    <div className="space-y-3">
                        <h4 className="mb-3 font-medium text-gray-900">Inventory Management</h4>

                        {totalInventoryValue < 20000 && (
                            <div className="flex items-start rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-yellow-500" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Low Stock Alert</p>
                                    <p className="text-xs text-yellow-700">Consider restocking inventory to meet demand</p>
                                </div>
                            </div>
                        )}

                        {inventoryTurnover < 1 && (
                            <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Slow Moving Stock</p>
                                    <p className="text-xs text-red-700">Focus on sales strategies to improve turnover</p>
                                </div>
                            </div>
                        )}

                        {totalGlassesValue === 0 && (
                            <div className="flex items-start rounded-lg border border-orange-200 bg-orange-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Glasses Out of Stock</p>
                                    <p className="text-xs text-orange-700">Restock glasses inventory immediately</p>
                                </div>
                            </div>
                        )}

                        {totalLensValue === 0 && (
                            <div className="flex items-start rounded-lg border border-orange-200 bg-orange-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Lens Out of Stock</p>
                                    <p className="text-xs text-orange-700">Restock lens inventory immediately</p>
                                </div>
                            </div>
                        )}

                        {profitPercentage >= 20 && (
                            <div className="flex items-start rounded-lg border border-green-200 bg-green-50 p-3">
                                <CheckCircle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Excellent Performance</p>
                                    <p className="text-xs text-green-700">Consider expanding successful product lines</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Financial Recommendations */}
                    <div className="space-y-3">
                        <h4 className="mb-3 font-medium text-gray-900">Financial Management</h4>

                        {accountBalance < 10000 && (
                            <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Low Cash Balance</p>
                                    <p className="text-xs text-red-700">Monitor cash flow closely and plan for expenses</p>
                                </div>
                            </div>
                        )}

                        {totalProfit < 0 && (
                            <div className="flex items-start rounded-lg border border-red-200 bg-red-50 p-3">
                                <AlertTriangle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Operating at Loss</p>
                                    <p className="text-xs text-red-700">Review pricing strategy and reduce costs</p>
                                </div>
                            </div>
                        )}

                        {cashFlow >= 100000 && (
                            <div className="flex items-start rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <CheckCircle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Strong Cash Position</p>
                                    <p className="text-xs text-blue-700">Consider investing in new inventory or equipment</p>
                                </div>
                            </div>
                        )}

                        {profitPercentage >= 15 && inventoryTurnover >= 1.5 && (
                            <div className="flex items-start rounded-lg border border-green-200 bg-green-50 p-3">
                                <CheckCircle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Optimal Performance</p>
                                    <p className="text-xs text-green-700">Business is performing well across all metrics</p>
                                </div>
                            </div>
                        )}

                        {inventoryTurnover >= 2 && (
                            <div className="flex items-start rounded-lg border border-green-200 bg-green-50 p-3">
                                <CheckCircle className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">High Turnover Rate</p>
                                    <p className="text-xs text-green-700">Excellent inventory management performance</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Show message if no recommendations */}
                {totalInventoryValue >= 20000 &&
                    inventoryTurnover >= 1 &&
                    totalGlassesValue > 0 &&
                    totalLensValue > 0 &&
                    accountBalance >= 10000 &&
                    totalProfit >= 0 && (
                        <div className="py-8 text-center">
                            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                            <h4 className="mb-2 text-lg font-semibold text-gray-900">All Systems Running Smoothly!</h4>
                            <p className="text-gray-600">Your optical business is performing well across all metrics. Keep up the excellent work!</p>
                        </div>
                    )}
            </div>

            {/* Key Performance Indicators */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
                    <PieChart className="h-5 w-5 text-purple-500" />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Liquidity Ratio */}
                    <div className="rounded-lg border p-4 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                            <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="mb-1 text-sm text-gray-600">Liquidity Ratio</p>
                        <p className="text-xl font-bold text-blue-600">
                            {totalInventoryValue > 0 ? (accountBalance / totalInventoryValue).toFixed(2) : '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">Cash / Inventory</p>
                    </div>

                    {/* Asset Efficiency */}
                    <div className="rounded-lg border p-4 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="mb-1 text-sm text-gray-600">Asset Efficiency</p>
                        <p className="text-xl font-bold text-green-600">
                            {totalInventoryValue > 0 ? ((totalSold / totalInventoryValue) * 100).toFixed(1) : '0.0'}%
                        </p>
                        <p className="text-xs text-gray-500">Sales / Assets</p>
                    </div>

                    {/* Profit Margin */}
                    <div className="rounded-lg border p-4 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="mb-1 text-sm text-gray-600">Profit Margin</p>
                        <p className={`text-xl font-bold ${profitPercentage >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                            {profitPercentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Net Profit / Sales</p>
                    </div>

                    {/* Inventory Days */}
                    <div className="rounded-lg border p-4 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                            <Package className="h-8 w-8 text-orange-600" />
                        </div>
                        <p className="mb-1 text-sm text-gray-600">Inventory Days</p>
                        <p className="text-xl font-bold text-orange-600">{inventoryTurnover > 0 ? Math.round(365 / inventoryTurnover) : '∞'}</p>
                        <p className="text-xs text-gray-500">Days to sell</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <button
                        onClick={() => router.visit('/optics-account/transactions')}
                        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                        <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
                        <span className="font-medium">View Transactions</span>
                    </button>

                    <button
                        onClick={() => router.visit('/optics-account/analytics')}
                        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                        <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                        <span className="font-medium">Business Analytics</span>
                    </button>

                    <button
                        onClick={() => router.visit('/optics-account/balance-sheet')}
                        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                        <PieChart className="mr-2 h-5 w-5 text-green-500" />
                        <span className="font-medium">Balance Sheet</span>
                    </button>

                    <button
                        onClick={() => router.visit('/optics-account')}
                        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                        <Package className="mr-2 h-5 w-5 text-orange-500" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                </div>
            </div>
        </OpticsAccountLayout>
    );
};

export default InventoryReport;
