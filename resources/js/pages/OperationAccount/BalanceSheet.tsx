import React from 'react';
import OperationAccountLayout from '@/layouts/OperationAccountLayout';
import { FileText, TrendingUp, TrendingDown, PieChart, DollarSign } from 'lucide-react';

interface MonthlyData {
    income: number;
    expense: number;
    profit: number;
}

interface CategoryData {
    category: string;
    total: number;
}

interface Props {
    summary: {
        total_income: number;
        total_expense: number;
        net_balance: number;
        current_balance: number;
    };
    balance: number;
    monthlyBreakdown: MonthlyData[];
    expensesByCategory: CategoryData[];
    incomeByCategory: CategoryData[];
    year: number;
}

const BalanceSheet: React.FC<Props> = ({
    summary,
    balance,
    monthlyBreakdown,
    expensesByCategory,
    incomeByCategory,
    year
}) => {
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
        <OperationAccountLayout title="Balance Sheet">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Current Balance</p>
                        <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{formatAmount(balance)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Total Income</p>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(summary.total_income)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Total Expense</p>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatAmount(summary.total_expense)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Net Balance</p>
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className={`text-2xl font-bold ${summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(summary.net_balance)}
                    </p>
                </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Monthly Breakdown - {year}</h3>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Income</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expense</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {monthlyBreakdown.map((data, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{months[index]}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{formatAmount(data.income)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{formatAmount(data.expense)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatAmount(data.profit)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Category-wise Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income by Category */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Income by Category</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {incomeByCategory.length > 0 ? (
                            <div className="space-y-3">
                                {incomeByCategory.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{item.category}</span>
                                        <span className="text-green-600 font-semibold">{formatAmount(item.total)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-t-2 border-green-600">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-green-600 font-bold">
                                        {formatAmount(incomeByCategory.reduce((sum, item) => sum + item.total, 0))}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No income data</p>
                        )}
                    </div>
                </div>

                {/* Expense by Category */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-semibold">Expense by Category</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {expensesByCategory.length > 0 ? (
                            <div className="space-y-3">
                                {expensesByCategory.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{item.category}</span>
                                        <span className="text-red-600 font-semibold">{formatAmount(item.total)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-t-2 border-red-600">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-red-600 font-bold">
                                        {formatAmount(expensesByCategory.reduce((sum, item) => sum + item.total, 0))}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No expense data</p>
                        )}
                    </div>
                </div>
            </div>
        </OperationAccountLayout>
    );
};

export default BalanceSheet;
