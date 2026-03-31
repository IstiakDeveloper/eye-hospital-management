import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { router } from '@inertiajs/react';
import { BarChart3, Calendar, DollarSign, Download, Eye, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

interface MonthlyTrend {
    year: number;
    month: number;
    income: number;
    expense: number;
}

interface PurchaseVsSales {
    month: string;
    category: string;
    total: number;
}

interface TopExpenseCategory {
    category: string;
    amount: number;
    count: number;
}

interface ProductPerformance {
    sales: number;
    purchases: number;
    profit: number;
    margin: number;
}

interface AnalyticsProps {
    monthlyTrend: MonthlyTrend[];
    purchaseVsSales: PurchaseVsSales[];
    topExpenseCategories: TopExpenseCategory[];
    profitMargin: number;
    glassesPerformance: ProductPerformance;
    lensPerformance: ProductPerformance;
    year: number;
    month: number;
}

const Analytics: React.FC<AnalyticsProps> = ({
    monthlyTrend,
    purchaseVsSales,
    topExpenseCategories,
    profitMargin,
    glassesPerformance,
    lensPerformance,
    year,
    month,
}) => {
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedMonth, setSelectedMonth] = useState(month);

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

    // Format percentage
    const formatPercentage = (percentage: number) => {
        return `${percentage.toFixed(2)}%`;
    };

    // Get month name
    const getMonthName = (monthNum: number) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthNum - 1];
    };

    // Handle filter change
    const handleFilterChange = () => {
        router.get('/optics-account/analytics', {
            year: selectedYear,
            month: selectedMonth,
        });
    };

    // Export report
    const handleExport = (type: string) => {
        router.post('/optics-account/export-report', {
            type: 'analytics',
            format: type,
            year: selectedYear,
            month: selectedMonth,
        });
    };

    return (
        <OpticsAccountLayout title="Business Analytics">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Optics Business Analytics</h2>
                    <p className="text-gray-600">Detailed insights into your optical business performance</p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Date Filter */}
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {getMonthName(i + 1)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                        >
                            {Array.from({ length: 5 }, (_, i) => (
                                <option key={2020 + i} value={2020 + i}>
                                    {2020 + i}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleFilterChange} className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Overall Profit Margin Card */}
            <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">Overall Profit Margin</h3>
                        <p className="text-3xl font-bold">{formatPercentage(profitMargin)}</p>
                        <p className="mt-2 text-purple-200">Based on total sales vs purchases</p>
                    </div>
                    <div className="text-right">
                        <DollarSign className="h-16 w-16 text-purple-300" />
                    </div>
                </div>
            </div>

            {/* Product Performance Comparison */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Glasses Performance */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Glasses Performance</h3>
                        <Eye className="h-5 w-5 text-blue-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Sales:</span>
                            <span className="font-semibold text-green-600">{formatAmount(glassesPerformance.sales)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Purchases:</span>
                            <span className="font-semibold text-red-600">{formatAmount(glassesPerformance.purchases)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                            <span className="font-medium text-gray-900">Net Profit:</span>
                            <span className={`font-bold ${glassesPerformance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(glassesPerformance.profit)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Profit Margin:</span>
                            <span className={`font-semibold ${glassesPerformance.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(glassesPerformance.margin)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lens Performance */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Lens Performance</h3>
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Sales:</span>
                            <span className="font-semibold text-green-600">{formatAmount(lensPerformance.sales)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Purchases:</span>
                            <span className="font-semibold text-red-600">{formatAmount(lensPerformance.purchases)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                            <span className="font-medium text-gray-900">Net Profit:</span>
                            <span className={`font-bold ${lensPerformance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(lensPerformance.profit)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Profit Margin:</span>
                            <span className={`font-semibold ${lensPerformance.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(lensPerformance.margin)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Trend Analysis */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Trend (Last 12 Months)</h3>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2 text-left text-gray-600">Month</th>
                                <th className="py-2 text-right text-gray-600">Income</th>
                                <th className="py-2 text-right text-gray-600">Expense</th>
                                <th className="py-2 text-right text-gray-600">Profit</th>
                                <th className="py-2 text-right text-gray-600">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyTrend.map((trend, index) => {
                                const profit = trend.income - trend.expense;
                                const isProfit = profit >= 0;

                                return (
                                    <tr key={`${trend.year}-${trend.month}`} className="border-b hover:bg-gray-50">
                                        <td className="py-3 font-medium">
                                            {getMonthName(trend.month)} {trend.year}
                                        </td>
                                        <td className="py-3 text-right font-semibold text-green-600">{formatAmount(trend.income)}</td>
                                        <td className="py-3 text-right font-semibold text-red-600">{formatAmount(trend.expense)}</td>
                                        <td className={`py-3 text-right font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatAmount(profit)}
                                        </td>
                                        <td className="py-3 text-right">
                                            {isProfit ? (
                                                <TrendingUp className="inline h-4 w-4 text-green-500" />
                                            ) : (
                                                <TrendingDown className="inline h-4 w-4 text-red-500" />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {monthlyTrend.length === 0 && <div className="py-8 text-center text-gray-500">No monthly data available</div>}
            </div>

            {/* Top Expense Categories */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Top Expense Categories - {getMonthName(month)} {year}
                    </h3>
                    <PieChart className="h-5 w-5 text-orange-500" />
                </div>

                <div className="space-y-4">
                    {topExpenseCategories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                            <div className="flex items-center">
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{category.category}</p>
                                    <p className="text-sm text-gray-600">{category.count} transactions</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-red-600">{formatAmount(category.amount)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {topExpenseCategories.length === 0 && (
                    <div className="py-8 text-center">
                        <PieChart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">No expense data for this period</p>
                    </div>
                )}
            </div>
        </OpticsAccountLayout>
    );
};

export default Analytics;
