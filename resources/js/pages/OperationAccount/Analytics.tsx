import OperationAccountLayout from '@/layouts/OperationAccountLayout';
import { router } from '@inertiajs/react';
import { BarChart3, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

interface DailyTrend {
    date: string;
    income: number;
    expense: number;
}

interface CategoryData {
    category: string;
    total: number;
}

interface Props {
    dailyTrend: DailyTrend[];
    topIncomeCategories: CategoryData[];
    topExpenseCategories: CategoryData[];
    balance: number;
    startDate: string;
    endDate: string;
}

const Analytics: React.FC<Props> = ({ dailyTrend, topIncomeCategories, topExpenseCategories, balance, startDate, endDate }) => {
    const [dates, setDates] = useState({
        start_date: startDate,
        end_date: endDate,
    });

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
        });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDates({
            ...dates,
            [e.target.name]: e.target.value,
        });
    };

    const applyDateFilter = () => {
        router.get('/operation-account/analytics', dates, { preserveState: true });
    };

    const totalIncome = dailyTrend.reduce((sum, day) => sum + parseFloat(day.income.toString()), 0);
    const totalExpense = dailyTrend.reduce((sum, day) => sum + parseFloat(day.expense.toString()), 0);
    const netProfit = totalIncome - totalExpense;

    return (
        <OperationAccountLayout title="Analytics">
            {/* Date Range Filter */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={dates.start_date}
                                onChange={handleDateChange}
                                className="rounded-lg border px-4 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={dates.end_date}
                                onChange={handleDateChange}
                                className="rounded-lg border px-4 py-2"
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={applyDateFilter} className="rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700">
                                Apply
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-2xl font-bold text-purple-600">{formatAmount(balance)}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Total Income</p>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Total Expense</p>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense)}</p>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Net Profit/Loss</p>
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(netProfit)}</p>
                </div>
            </div>

            {/* Daily Trend */}
            <div className="mb-8 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold">Daily Trend</h3>
                    </div>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Income</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Expense</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Net</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dailyTrend.length > 0 ? (
                                    dailyTrend.map((day, index) => {
                                        const net = parseFloat(day.income.toString()) - parseFloat(day.expense.toString());
                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-medium">{formatDate(day.date)}</td>
                                                <td className="px-6 py-3 text-right text-green-600">{formatAmount(day.income)}</td>
                                                <td className="px-6 py-3 text-right text-red-600">{formatAmount(day.expense)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={net >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                                                        {formatAmount(net)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            No data for selected period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Top Categories */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Top Income Categories */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Top Income Categories</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {topIncomeCategories.length > 0 ? (
                            <div className="space-y-3">
                                {topIncomeCategories.map((item, index) => {
                                    const maxTotal = topIncomeCategories[0]?.total || 1;
                                    const percentage = (item.total / maxTotal) * 100;
                                    return (
                                        <div key={index}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                                                <span className="text-sm font-semibold text-green-600">{formatAmount(item.total)}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div className="h-2 rounded-full bg-green-600" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-gray-500">No income data</p>
                        )}
                    </div>
                </div>

                {/* Top Expense Categories */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b p-6">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-semibold">Top Expense Categories</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {topExpenseCategories.length > 0 ? (
                            <div className="space-y-3">
                                {topExpenseCategories.map((item, index) => {
                                    const maxTotal = topExpenseCategories[0]?.total || 1;
                                    const percentage = (item.total / maxTotal) * 100;
                                    return (
                                        <div key={index}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                                                <span className="text-sm font-semibold text-red-600">{formatAmount(item.total)}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div className="h-2 rounded-full bg-red-600" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-gray-500">No expense data</p>
                        )}
                    </div>
                </div>
            </div>
        </OperationAccountLayout>
    );
};

export default Analytics;
