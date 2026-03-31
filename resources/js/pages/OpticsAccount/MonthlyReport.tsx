import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { router } from '@inertiajs/react';
import { Calendar, DollarSign, Eye, Glasses, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';

interface MonthlyReportProps {
    report: {
        income: number;
        expense: number;
        profit: number;
        balance: number;
    };
    categoryExpenses: Record<string, number>;
    glassesPurchases: number;
    glassesSales: number;
    lensPurchases: number;
    lensSales: number;
    year: number;
    month: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
    report,
    categoryExpenses,
    glassesPurchases,
    glassesSales,
    lensPurchases,
    lensSales,
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

    const handleFilterChange = () => {
        router.get('/optics-account/monthly-report', {
            year: selectedYear,
            month: selectedMonth,
        });
    };

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const categoryExpenseEntries = Object.entries(categoryExpenses);
    const totalCategoryExpenses = categoryExpenseEntries.reduce((sum, [, amount]) => sum + amount, 0);

    // Calculate metrics
    const glassesProfit = glassesSales - glassesPurchases;
    const lensProfit = lensSales - lensPurchases;
    const totalProductSales = glassesSales + lensSales;
    const totalProductPurchases = glassesPurchases + lensPurchases;
    const productProfitMargin = totalProductSales > 0 ? ((totalProductSales - totalProductPurchases) / totalProductSales) * 100 : 0;

    return (
        <OpticsAccountLayout title="Monthly Report">
            {/* Date Filter */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="rounded-lg border px-3 py-2"
                    >
                        {months.map((monthName, index) => (
                            <option key={index} value={index + 1}>
                                {monthName}
                            </option>
                        ))}
                    </select>

                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="rounded-lg border px-3 py-2">
                        {years.map((yearOption) => (
                            <option key={yearOption} value={yearOption}>
                                {yearOption}
                            </option>
                        ))}
                    </select>

                    <button onClick={handleFilterChange} className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Report Header */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-bold text-gray-900">
                    {months[month - 1]} {year} - Optics Financial Report
                </h2>
                <p className="text-gray-600">Optics Account Monthly Performance & Optical Business Analytics</p>
            </div>

            {/* Product Performance Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-6">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Glasses Sales</p>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(glassesSales)}</p>
                        </div>
                        <Glasses className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Lens Sales</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(lensSales)}</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Glasses Purchase</p>
                            <p className="text-2xl font-bold text-orange-600">{formatAmount(glassesPurchases)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-orange-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Lens Purchase</p>
                            <p className="text-2xl font-bold text-purple-600">{formatAmount(lensPurchases)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            <p className={`text-2xl font-bold ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(report.profit)}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Balance</p>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(report.balance)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Product Analysis */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <h3 className="text-lg font-semibold">Product Performance Analysis</h3>
                    </div>

                    <div className="space-y-6 p-6">
                        {/* Glasses Performance */}
                        <div className="space-y-3">
                            <h4 className="flex items-center font-medium text-gray-900">
                                <Glasses className="mr-2 h-4 w-4 text-green-600" />
                                Glasses Business
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Sales Revenue</span>
                                    <span className="font-medium text-green-600">{formatAmount(glassesSales)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Purchase Cost</span>
                                    <span className="font-medium text-orange-600">{formatAmount(glassesPurchases)}</span>
                                </div>
                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Glasses Profit</span>
                                    <span className={glassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(glassesProfit)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Profit Margin</span>
                                    <span className={`font-medium ${glassesSales > 0 && glassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {glassesSales > 0 ? ((glassesProfit / glassesSales) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Lens Performance */}
                        <div className="space-y-3">
                            <h4 className="flex items-center font-medium text-gray-900">
                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                Lens Business
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Sales Revenue</span>
                                    <span className="font-medium text-blue-600">{formatAmount(lensSales)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Purchase Cost</span>
                                    <span className="font-medium text-purple-600">{formatAmount(lensPurchases)}</span>
                                </div>
                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Lens Profit</span>
                                    <span className={lensProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(lensProfit)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Profit Margin</span>
                                    <span className={`font-medium ${lensSales > 0 && lensProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {lensSales > 0 ? ((lensProfit / lensSales) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category-wise Expenses */}
                <div className="rounded-lg border bg-white shadow-sm">
                    {categoryExpenseEntries.length > 0 ? (
                        <div className="p-6">
                            <div className="space-y-4">
                                {categoryExpenseEntries.map(([category, amount]) => {
                                    const percentage = totalCategoryExpenses > 0 ? (amount / totalCategoryExpenses) * 100 : 0;

                                    return (
                                        <div key={category} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900">{category || 'Uncategorized'}</span>
                                                <div className="text-right">
                                                    <span className="text-sm font-medium text-gray-900">{formatAmount(amount)}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-purple-600 transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total Expenses</span>
                                    <span className="text-base font-semibold text-red-600">{formatAmount(totalCategoryExpenses)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <p>No expenses recorded for this month</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Optics Account Financial Summary</h3>
                </div>

                <div className="space-y-4 p-6">
                    <div className="flex justify-between border-b py-2">
                        <span className="text-gray-600">Opening Balance</span>
                        <span className="font-medium">{formatAmount(report.balance - report.profit)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span className="text-green-600">+ Glasses Sales Revenue</span>
                        <span className="font-medium text-green-600">{formatAmount(glassesSales)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span className="text-blue-600">+ Lens Sales Revenue</span>
                        <span className="font-medium text-blue-600">{formatAmount(lensSales)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span className="text-orange-600">- Glasses Purchases</span>
                        <span className="font-medium text-orange-600">{formatAmount(glassesPurchases)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span className="text-purple-600">- Lens Purchases</span>
                        <span className="font-medium text-purple-600">{formatAmount(lensPurchases)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span className="text-red-600">- Other Expenses</span>
                        <span className="font-medium text-red-600">{formatAmount(report.expense - totalProductPurchases)}</span>
                    </div>

                    <div className="flex justify-between py-2 text-lg font-semibold">
                        <span>Closing Balance</span>
                        <span className={report.balance >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(report.balance)}</span>
                    </div>
                </div>
            </div>

            {/* Business Insights */}
            <div className="mt-8 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Business Insights</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-lg bg-purple-50 p-4">
                            <h4 className="mb-2 font-medium text-purple-800">Product Performance</h4>
                            <p className="text-sm text-purple-700">
                                {glassesSales > lensSales
                                    ? `Glasses are your top performer this month, generating ${formatAmount(glassesSales)} vs ${formatAmount(lensSales)} from lenses.`
                                    : lensSales > glassesSales
                                      ? `Lenses are outperforming glasses this month, generating ${formatAmount(lensSales)} vs ${formatAmount(glassesSales)} from glasses.`
                                      : 'Glasses and lens sales are balanced this month.'}
                            </p>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4">
                            <h4 className="mb-2 font-medium text-blue-800">Profit Analysis</h4>
                            <p className="text-sm text-blue-700">
                                {productProfitMargin > 25
                                    ? 'Excellent profit margins! Your optics business is highly profitable.'
                                    : productProfitMargin > 15
                                      ? 'Good profit margins. Consider optimizing costs for better returns.'
                                      : productProfitMargin > 5
                                        ? 'Fair profit margins. Focus on premium products or cost reduction.'
                                        : 'Low profit margins. Review pricing strategy and supplier costs.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </OpticsAccountLayout>
    );
};

export default MonthlyReport;
