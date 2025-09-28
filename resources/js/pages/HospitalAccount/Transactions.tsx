import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatDate } from '@/lib/utils';
import {
    Filter,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Eye
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
    filters?: {
        type?: string;
        date_from?: string;
        date_to?: string;
        category?: string;
    };
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, filters = {} }) => {
    const [filter, setFilter] = useState({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        category: filters.category || ''
    });

    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Auto filter function with debouncing
    const applyFilters = (newFilters: any) => {
        const params = new URLSearchParams();

        if (newFilters.type) params.set('type', newFilters.type);
        if (newFilters.date_from) params.set('date_from', newFilters.date_from);
        if (newFilters.date_to) params.set('date_to', newFilters.date_to);
        if (newFilters.category) params.set('category', newFilters.category);

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
        const emptyFilters = { type: '', date_from: '', date_to: '', category: '' };
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
        params.set('page', page.toString());

        router.get('/hospital-account/transactions?' + params.toString());
    };

    // Calculate totals
    const totalIncome = transactions.data
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const totalExpense = transactions.data
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const netAmount = totalIncome - totalExpense;

    // Handle edit transaction
    const handleEdit = (transactionId: number) => {
        router.get(`/hospital-account/transactions/${transactionId}/edit`);
    };

    // Handle delete transaction
    const handleDelete = (transactionId: number) => {
        if (deleteConfirm === transactionId) {
            router.delete(`/hospital-account/transactions/${transactionId}`, {
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
                onError: () => {
                    setDeleteConfirm(null);
                }
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
            {/* Simple Filter Section */}
            <div className="bg-white border rounded p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filter.date_from}
                            onChange={handleFilterChange}
                            className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filter.date_to}
                            onChange={handleFilterChange}
                            className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Category</label>
                        <select
                            name="category"
                            value={filter.category}
                            onChange={handleFilterChange}
                            className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                            <option value="">All Categories</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Clear
                        </button>

                        {/* Quick Summary */}
                        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                            <div>Income: ৳{totalIncome.toLocaleString()}</div>
                            <div>Expense: ৳{totalExpense.toLocaleString()}</div>
                            <div className={netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                Net: ৳{Math.abs(netAmount).toLocaleString()} {netAmount >= 0 ? '↑' : '↓'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Data Table */}
            <div className="bg-white border rounded">
                <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
                    <span className="text-sm font-medium">
                        Transactions ({transactions.total || 0} total)
                    </span>
                    <span className="text-xs text-gray-500">
                        Page {transactions.current_page} of {transactions.last_page}
                    </span>
                </div>

                {transactions.data && transactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Trans. No</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.data.map((transaction, index) => (
                                    <tr key={transaction.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                        <td className="px-3 py-2 font-mono text-blue-600">{transaction.transaction_no}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                            {transaction.category || 'Uncategorized'}
                                        </td>
                                        <td className={`px-3 py-2 text-right font-mono font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                            {formatDate(transaction.transaction_date)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={transaction.description}>
                                            {transaction.description || 'No description'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(transaction.id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Transaction"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>

                                                {/* Delete Button */}
                                                {deleteConfirm === transaction.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                                            title="Confirm Delete"
                                                        >
                                                            Yes
                                                        </button>
                                                        <button
                                                            onClick={cancelDelete}
                                                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                                            title="Cancel Delete"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(transaction.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
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
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No transactions found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                )}

                {/* Simple Pagination */}
                {transactions.last_page > 1 && (
                    <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                            Showing {((transactions.current_page - 1) * transactions.per_page) + 1} to{' '}
                            {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of{' '}
                            {transactions.total} results
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePagination(transactions.current_page - 1)}
                                disabled={transactions.current_page === 1}
                                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className={`px-2 py-1 text-xs border rounded ${pageNum === transactions.current_page
                                                ? 'bg-blue-500 text-white border-blue-500'
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
                                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
