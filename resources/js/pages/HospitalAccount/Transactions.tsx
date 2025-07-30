import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatDate } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Filter,
    X,
    Calendar,
    DollarSign,
    FileText,
    User,
    Search,
    RefreshCw
} from 'lucide-react';

interface Transaction {
    id: number;
    transaction_no: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    expense_category?: {
        name: string;
    };
    created_by?: {
        name: string;
    };
}

interface TransactionsProps {
    transactions: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: Array<{
        id: number;
        name: string;
    }>;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories }) => {
    const [filter, setFilter] = useState({
        type: '',
        month: '',
        year: '',
        category: ''
    });

    // Safe calculations with fallbacks
    const totalIncome = transactions.data
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const totalExpense = transactions.data
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const netAmount = totalIncome - totalExpense;

    const handleFilter = () => {
        router.get('/hospital-account/transactions', filter);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'month_year' && value) {
            const [year, month] = value.split('-');
            setFilter({ ...filter, year, month: parseInt(month).toString() });
        } else {
            setFilter({ ...filter, [name]: value });
        }
    };

    const clearFilters = () => {
        setFilter({ type: '', month: '', year: '', category: '' });
        router.get('/hospital-account/transactions');
    };

    return (
        <HospitalAccountLayout title="Transactions">
            {/* Enhanced Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="flex items-center mb-4">
                    <Filter className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Filter Transactions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month & Year</label>
                        <input
                            type="month"
                            name="month_year"
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            name="category"
                            value={filter.category}
                            onChange={handleFilterChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            onClick={handleFilter}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Income Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-green-700">Total Income</h3>
                            <p className="text-3xl font-bold text-green-800 mb-1">
                                ৳{totalIncome.toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-green-600">
                                {transactions.data?.filter(t => t.type === 'income').length || 0} transactions
                            </p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-full">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Total Expense Card */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-red-700">Total Expense</h3>
                            <p className="text-3xl font-bold text-red-800 mb-1">
                                ৳{totalExpense.toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-red-600">
                                {transactions.data?.filter(t => t.type === 'expense').length || 0} transactions
                            </p>
                        </div>
                        <div className="bg-red-500 p-3 rounded-full">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Net Amount Card */}
                <div className={`bg-gradient-to-br ${netAmount >= 0
                        ? 'from-blue-50 to-blue-100 border-blue-500'
                        : 'from-orange-50 to-orange-100 border-orange-500'
                    } p-6 rounded-lg shadow-sm border-l-4`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`text-sm font-medium ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'
                                }`}>
                                Net Amount
                            </h3>
                            <p className={`text-3xl font-bold mb-1 ${netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'
                                }`}>
                                ৳{Math.abs(netAmount).toLocaleString('en-BD')}
                            </p>
                            <p className={`text-xs ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                {netAmount >= 0 ? 'Profit' : 'Loss'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${netAmount >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}>
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Transactions ({transactions.total || 0} total)
                        </h3>
                        <div className="text-sm text-gray-500">
                            Page {transactions.current_page} of {transactions.last_page}
                        </div>
                    </div>
                </div>

                {transactions.data && transactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.data.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                                            {transaction.transaction_no}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                {transaction.type === 'income' ? (
                                                    <>
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        Income
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                        Expense
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                                {transaction.category || 'Uncategorized'}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            <span className="font-mono">
                                                {transaction.type === 'income' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString('en-BD')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                {formatDate(transaction.transaction_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs break-words overflow-hidden" title={transaction.description}>
                                                {transaction.description || 'No description'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Try adjusting your filters or add your first transaction.
                        </p>
                    </div>
                )}

                {/* Enhanced Pagination */}
                {transactions.last_page > 1 && (
                    <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Showing {((transactions.current_page - 1) * transactions.per_page) + 1} to{' '}
                                {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of{' '}
                                {transactions.total} results
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => router.get('/hospital-account/transactions', {
                                        ...filter,
                                        page: transactions.current_page - 1
                                    })}
                                    disabled={transactions.current_page === 1}
                                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    Previous
                                </button>

                                <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
                                    {transactions.current_page} of {transactions.last_page}
                                </span>

                                <button
                                    onClick={() => router.get('/hospital-account/transactions', {
                                        ...filter,
                                        page: transactions.current_page + 1
                                    })}
                                    disabled={transactions.current_page === transactions.last_page}
                                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HospitalAccountLayout>
    );
};

export default Transactions;
