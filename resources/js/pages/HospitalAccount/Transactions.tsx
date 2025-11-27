import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatDate } from '@/lib/utils';
import {
    Filter,
    RefreshCw,
    Edit,
    Trash2,
    TrendingUp,
    TrendingDown,
    Wallet,
    Building2,
    Home,
    Receipt,
    DollarSign
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
    income_category?: {
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
    expenseCategories: Array<{
        id: number;
        name: string;
    }>;
    incomeCategories: Array<{
        id: number;
        name: string;
    }>;
    filters?: {
        type?: string;
        date_from?: string;
        date_to?: string;
        category?: string;
        category_filter?: string;
    };
    totals: {
        total_income: number;
        total_expense: number;
        net_amount: number;
        total_count: number;
    };
    categoryStats: {
        fixed_asset_expense: number;
        advance_rent_balance: number;
        advance_rent_deductions: number;
        other_expense: number;
        other_income: number;
    };
}

const Transactions: React.FC<TransactionsProps> = ({
    transactions,
    expenseCategories,
    incomeCategories,
    filters = {},
    totals,
    categoryStats
}) => {
    const [filter, setFilter] = useState({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        category: filters.category || '',
        category_filter: filters.category_filter || ''
    });

    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Auto filter function with debouncing
    const applyFilters = (newFilters: any) => {
        const params = new URLSearchParams();

        if (newFilters.type) params.set('type', newFilters.type);
        if (newFilters.date_from) params.set('date_from', newFilters.date_from);
        if (newFilters.date_to) params.set('date_to', newFilters.date_to);
        if (newFilters.category) params.set('category', newFilters.category);
        if (newFilters.category_filter) params.set('category_filter', newFilters.category_filter);

        router.get('/hospital-account/transactions?' + params.toString());
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filter, [name]: value };

        setFilter(newFilters);

        // Auto apply filters with slight delay for better UX
        setTimeout(() => {
            applyFilters(newFilters);
        }, 300);
    };

    const clearFilters = () => {
        const emptyFilters = { type: '', date_from: '', date_to: '', category: '', category_filter: '' };
        setFilter(emptyFilters);
        router.get('/hospital-account/transactions');
    };

    const handlePagination = (page: number) => {
        // Preserve filters when paginating
        const params = new URLSearchParams();

        if (filter.type) params.set('type', filter.type);
        if (filter.date_from) params.set('date_from', filter.date_from);
        if (filter.date_to) params.set('date_to', filter.date_to);
        if (filter.category) params.set('category', filter.category);
        if (filter.category_filter) params.set('category_filter', filter.category_filter);
        params.set('page', page.toString());

        router.get('/hospital-account/transactions?' + params.toString());
    };

    // Quick category filter
    const applyQuickFilter = (categoryFilter: string) => {
        const newFilters = { ...filter, category_filter: categoryFilter, type: '', category: '' };
        setFilter(newFilters);
        applyFilters(newFilters);
    };

    // Handle edit transaction
    const handleEdit = (transactionId: number) => {
        router.get(`/hospital-account/transactions/${transactionId}/edit`);
    };

    // Handle delete transaction
    const handleDelete = (transactionId: number) => {
        if (deleteConfirm === transactionId) {
            setLoading(true);
            router.delete(`/hospital-account/transactions/${transactionId}`, {
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
                onError: () => {
                    setDeleteConfirm(null);
                },
                onFinish: () => setLoading(false)
            });
        } else {
            setDeleteConfirm(transactionId);
        }
    };

    // Cancel delete confirmation
    const cancelDelete = () => {
        setDeleteConfirm(null);
    };

    return (
        <HospitalAccountLayout title="Transactions">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                {/* Income Card */}
                <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-50 p-1.5 rounded">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">INCOME</div>
                                <div className="text-xl font-bold text-gray-800">৳{totals.total_income.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-50 p-1.5 rounded">
                                <TrendingDown className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">EXPENSE</div>
                                <div className="text-xl font-bold text-gray-800">৳{totals.total_expense.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Assets Card */}
                <div className="bg-white border-l-4 border-purple-500 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-50 p-1.5 rounded">
                                <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">ASSETS</div>
                                <div className="text-xl font-bold text-gray-800">৳{categoryStats.fixed_asset_expense.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advance Rent Balance Card */}
                <div className="bg-white border-l-4 border-indigo-500 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-50 p-1.5 rounded">
                                <Home className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">ADVANCE RENT</div>
                                <div className="text-xl font-bold text-gray-800">৳{categoryStats.advance_rent_balance.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => applyQuickFilter('')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !filter.category_filter
                            ? 'bg-gray-800 text-white shadow-lg'
                            : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                >
                    <Receipt className="w-4 h-4 inline mr-2" />
                    All Transactions
                </button>
                <button
                    onClick={() => applyQuickFilter('other_income')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter.category_filter === 'other_income'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Income Only
                </button>
                <button
                    onClick={() => applyQuickFilter('other_expense')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter.category_filter === 'other_expense'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                >
                    <TrendingDown className="w-4 h-4 inline mr-2" />
                    Other Expenses
                </button>
                <button
                    onClick={() => applyQuickFilter('fixed_asset')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter.category_filter === 'fixed_asset'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Fixed Assets
                </button>
                <button
                    onClick={() => applyQuickFilter('advance_house_rent')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filter.category_filter === 'advance_house_rent'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                >
                    <Home className="w-4 h-4 inline mr-2" />
                    Advance Rent
                </button>
            </div>

            {/* Advanced Filter Section */}
            <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Advanced Filters</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filter.date_from}
                            onChange={handleFilterChange}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filter.date_to}
                            onChange={handleFilterChange}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Specific Category</label>
                        <select
                            name="category"
                            value={filter.category}
                            onChange={handleFilterChange}
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            <optgroup label="Expense Categories">
                                {expenseCategories?.map((category) => (
                                    <option key={`exp-${category.id}`} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Income Categories">
                                {incomeCategories?.map((category) => (
                                    <option key={`inc-${category.id}`} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Transaction Records</h3>
                        <p className="text-xs text-gray-600 mt-1">
                            Showing {transactions.data.length} of {totals.total_count} total filtered transactions
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                            Page {transactions.current_page} of {transactions.last_page}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {transactions.per_page} per page
                        </div>
                    </div>
                </div>

                {transactions.data && transactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trans. No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.data.map((transaction, index) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-blue-600 font-medium">{transaction.transaction_no}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3 mr-1" />
                                                )}
                                                {transaction.type === 'income' ? 'Income' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                            {transaction.category || 'Uncategorized'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(transaction.transaction_date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={transaction.description}>
                                            {transaction.description || 'No description'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(transaction.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Transaction"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete Button */}
                                                {deleteConfirm === transaction.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            disabled={loading}
                                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                            title="Confirm Delete"
                                                        >
                                                            {loading ? 'Deleting...' : 'Yes'}
                                                        </button>
                                                        <button
                                                            onClick={cancelDelete}
                                                            disabled={loading}
                                                            className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50"
                                                            title="Cancel Delete"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-600">No transactions found</p>
                        <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or add a new transaction</p>
                    </div>
                )}

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                            Showing {((transactions.current_page - 1) * transactions.per_page) + 1} to{' '}
                            {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of{' '}
                            {transactions.total} results
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePagination(transactions.current_page - 1)}
                                disabled={transactions.current_page === 1}
                                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, transactions.last_page) }, (_, i) => {
                                let pageNum;
                                if (transactions.last_page <= 5) {
                                    pageNum = i + 1;
                                } else if (transactions.current_page <= 3) {
                                    pageNum = i + 1;
                                } else if (transactions.current_page >= transactions.last_page - 2) {
                                    pageNum = transactions.last_page - 4 + i;
                                } else {
                                    pageNum = transactions.current_page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePagination(pageNum)}
                                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${pageNum === transactions.current_page
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePagination(transactions.current_page + 1)}
                                disabled={transactions.current_page === transactions.last_page}
                                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </HospitalAccountLayout>
    );
};

export default Transactions;
