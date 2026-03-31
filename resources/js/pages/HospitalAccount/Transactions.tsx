import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatDate } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Building2, DollarSign, Edit, Filter, Home, Receipt, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

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

const Transactions: React.FC<TransactionsProps> = ({ transactions, expenseCategories, incomeCategories, filters = {}, totals, categoryStats }) => {
    const [filter, setFilter] = useState({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        category: filters.category || '',
        category_filter: filters.category_filter || '',
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
                onFinish: () => setLoading(false),
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
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                {/* Income Card */}
                <div className="rounded-lg border-l-4 border-green-500 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded bg-green-50 p-1.5">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">INCOME</div>
                                <div className="text-xl font-bold text-gray-800">৳{totals.total_income.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expense Card */}
                <div className="rounded-lg border-l-4 border-red-500 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded bg-red-50 p-1.5">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">EXPENSE</div>
                                <div className="text-xl font-bold text-gray-800">৳{totals.total_expense.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Assets Card */}
                <div className="rounded-lg border-l-4 border-purple-500 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded bg-purple-50 p-1.5">
                                <Building2 className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">ASSETS</div>
                                <div className="text-xl font-bold text-gray-800">৳{categoryStats.fixed_asset_expense.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advance Rent Balance Card */}
                <div className="rounded-lg border-l-4 border-indigo-500 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded bg-indigo-50 p-1.5">
                                <Home className="h-4 w-4 text-indigo-600" />
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
            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    onClick={() => applyQuickFilter('')}
                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        !filter.category_filter ? 'bg-gray-800 text-white shadow-lg' : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Receipt className="mr-2 inline h-4 w-4" />
                    All Transactions
                </button>
                <button
                    onClick={() => applyQuickFilter('other_income')}
                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        filter.category_filter === 'other_income'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <TrendingUp className="mr-2 inline h-4 w-4" />
                    Income Only
                </button>
                <button
                    onClick={() => applyQuickFilter('other_expense')}
                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        filter.category_filter === 'other_expense'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <TrendingDown className="mr-2 inline h-4 w-4" />
                    Other Expenses
                </button>
                <button
                    onClick={() => applyQuickFilter('fixed_asset')}
                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        filter.category_filter === 'fixed_asset'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Building2 className="mr-2 inline h-4 w-4" />
                    Fixed Assets
                </button>
                <button
                    onClick={() => applyQuickFilter('advance_house_rent')}
                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        filter.category_filter === 'advance_house_rent'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Home className="mr-2 inline h-4 w-4" />
                    Advance Rent
                </button>
            </div>

            {/* Advanced Filter Section */}
            <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Advanced Filters</span>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">From Date</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filter.date_from}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">To Date</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filter.date_to}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Specific Category</label>
                        <select
                            name="category"
                            value={filter.category}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Transaction Records</h3>
                        <p className="mt-1 text-xs text-gray-600">
                            Showing {transactions.data.length} of {totals.total_count} total filtered transactions
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                            Page {transactions.current_page} of {transactions.last_page}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{transactions.per_page} per page</div>
                    </div>
                </div>

                {transactions.data && transactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase">Trans. No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-gray-700 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase">Description</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {transactions.data.map((transaction, index) => (
                                    <tr key={transaction.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-sm font-medium text-blue-600">{transaction.transaction_no}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="mr-1 h-3 w-3" />
                                                )}
                                                {transaction.type === 'income' ? 'Income' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{transaction.category || 'Uncategorized'}</td>
                                        <td
                                            className={`px-4 py-3 text-right font-mono text-sm font-bold ${
                                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(transaction.transaction_date)}</td>
                                        <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700" title={transaction.description}>
                                            {transaction.description || 'No description'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(transaction.id)}
                                                    className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                                                    title="Edit Transaction"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>

                                                {/* Delete Button */}
                                                {deleteConfirm === transaction.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            disabled={loading}
                                                            className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                                                            title="Confirm Delete"
                                                        >
                                                            {loading ? 'Deleting...' : 'Yes'}
                                                        </button>
                                                        <button
                                                            onClick={cancelDelete}
                                                            disabled={loading}
                                                            className="rounded-lg bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                                                            title="Cancel Delete"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                    <div className="py-16 text-center">
                        <DollarSign className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                        <p className="text-lg font-medium text-gray-600">No transactions found</p>
                        <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or add a new transaction</p>
                    </div>
                )}

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
                        <div className="text-xs text-gray-600">
                            Showing {(transactions.current_page - 1) * transactions.per_page + 1} to{' '}
                            {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of {transactions.total} results
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePagination(transactions.current_page - 1)}
                                disabled={transactions.current_page === 1}
                                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                            pageNum === transactions.current_page
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-md'
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
                                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
