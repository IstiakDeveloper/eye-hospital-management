import React from 'react';
import OperationAccountLayout from '@/layouts/OperationAccountLayout';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface MonthlyData {
    income: number;
    expense: number;
    profit: number;
    balance: number;
}

interface Props {
    monthlyData: MonthlyData[];
    currentMonthReport: MonthlyData;
    balance: number;
    year: number;
    month: number;
}

const MonthlyReport: React.FC<Props> = ({ monthlyData, currentMonthReport, balance, year, month }) => {
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleMonthChange = (newMonth: number) => {
        window.location.href = `/operation-account/monthly-report?year=${year}&month=${newMonth}`;
    };

    const handleYearChange = (newYear: number) => {
        window.location.href = `/operation-account/monthly-report?year=${newYear}&month=${month}`;
    };

    return (
        <OperationAccountLayout title="Monthly Report">
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Year</label>
                            <select
                                value={year}
                                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                className="border rounded-lg px-4 py-2"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Month</label>
                            <select
                                value={month}
                                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                                className="border rounded-lg px-4 py-2"
                            >
                                {months.map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-2xl font-bold text-purple-600">{formatAmount(balance)}</p>
                    </div>
                </div>
            </div>

            {/* Current Month Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Income</p>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(currentMonthReport.income)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Expense</p>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatAmount(currentMonthReport.expense)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Profit</p>
                        <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className={`text-2xl font-bold ${currentMonthReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(currentMonthReport.profit)}
                    </p>
                </div>
            </div>

            {/* Yearly Overview */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Yearly Overview - {year}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Month</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Income</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Expense</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Profit/Loss</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {monthlyData.map((data, index) => (
                                <tr
                                    key={index}
                                    className={`hover:bg-gray-50 ${index + 1 === month ? 'bg-purple-50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{months[index]}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-green-600 font-semibold">{formatAmount(data.income)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-red-600 font-semibold">{formatAmount(data.expense)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatAmount(data.profit)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-semibold">
                                <td className="px-6 py-4">Total</td>
                                <td className="px-6 py-4 text-right text-green-600">
                                    {formatAmount(monthlyData.reduce((sum, d) => sum + d.income, 0))}
                                </td>
                                <td className="px-6 py-4 text-right text-red-600">
                                    {formatAmount(monthlyData.reduce((sum, d) => sum + d.expense, 0))}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {(() => {
                                        const total = monthlyData.reduce((sum, d) => sum + d.profit, 0);
                                        return (
                                            <span className={total >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatAmount(total)}
                                            </span>
                                        );
                                    })()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </OperationAccountLayout>
    );
};

export default MonthlyReport;
