import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatTaka } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Building2, ChevronDown, Edit, Filter, Home, Receipt, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categoryQuery, setCategoryQuery] = useState('');
    const categoryRef = useRef<HTMLDivElement>(null);
    const categorySearchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setCategoryOpen(false);
                setCategoryQuery('');
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    useEffect(() => {
        if (categoryOpen) {
            categorySearchRef.current?.focus();
        }
    }, [categoryOpen]);

    const categorySearch = categoryQuery.trim().toLowerCase();
    const filteredExpenseCategories = (expenseCategories ?? []).filter((category) => category.name.toLowerCase().includes(categorySearch));
    const filteredIncomeCategories = (incomeCategories ?? []).filter((category) => category.name.toLowerCase().includes(categorySearch));

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

    const selectCategory = (name: string) => {
        const newFilters = { ...filter, category: name };
        setFilter(newFilters);
        setCategoryOpen(false);
        setCategoryQuery('');
        applyFilters(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters = { type: '', date_from: '', date_to: '', category: '', category_filter: '' };
        setFilter(emptyFilters);
        setCategoryOpen(false);
        setCategoryQuery('');
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
                                <div className="text-[10px] tracking-wide text-gray-500">INCOME</div>
                                <div className="text-[13px] font-semibold text-gray-800 tabular-nums">{formatTaka(totals.total_income)}</div>
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
                                <div className="text-[10px] tracking-wide text-gray-500">EXPENSE</div>
                                <div className="text-[13px] font-semibold text-gray-800 tabular-nums">{formatTaka(totals.total_expense)}</div>
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
                                <div className="text-[10px] tracking-wide text-gray-500">ASSETS</div>
                                <div className="text-[13px] font-semibold text-gray-800 tabular-nums">
                                    {formatTaka(categoryStats.fixed_asset_expense)}
                                </div>
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
                                <div className="text-[10px] tracking-wide text-gray-500">ADVANCE RENT</div>
                                <div className="text-[13px] font-semibold text-gray-800 tabular-nums">
                                    {formatTaka(categoryStats.advance_rent_balance)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                <button
                    onClick={() => applyQuickFilter('')}
                    className={`inline-flex h-7 items-center rounded px-2 text-[12px] font-medium ${
                        !filter.category_filter ? 'bg-gray-800 text-white' : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Receipt className="mr-2 inline h-4 w-4" />
                    All Transactions
                </button>
                <button
                    onClick={() => applyQuickFilter('other_income')}
                    className={`inline-flex h-7 items-center rounded px-2 text-[12px] font-medium ${
                        filter.category_filter === 'other_income' ? 'bg-green-600 text-white' : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <TrendingUp className="mr-2 inline h-4 w-4" />
                    Income Only
                </button>
                <button
                    onClick={() => applyQuickFilter('other_expense')}
                    className={`inline-flex h-7 items-center rounded px-2 text-[12px] font-medium ${
                        filter.category_filter === 'other_expense' ? 'bg-red-600 text-white' : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <TrendingDown className="mr-2 inline h-4 w-4" />
                    Other Expenses
                </button>
                <button
                    onClick={() => applyQuickFilter('fixed_asset')}
                    className={`inline-flex h-7 items-center rounded px-2 text-[12px] font-medium ${
                        filter.category_filter === 'fixed_asset' ? 'bg-purple-600 text-white' : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Building2 className="mr-2 inline h-4 w-4" />
                    Fixed Assets
                </button>
                <button
                    onClick={() => applyQuickFilter('advance_house_rent')}
                    className={`inline-flex h-7 items-center rounded px-2 text-[12px] font-medium ${
                        filter.category_filter === 'advance_house_rent'
                            ? 'bg-indigo-600 text-white'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <Home className="mr-2 inline h-4 w-4" />
                    Advance Rent
                </button>
            </div>

            {/* Advanced Filter Section */}
            <div className="mb-3 rounded border bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[12px] font-semibold text-gray-700">Filters</span>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="h-7 w-full rounded border border-gray-300 px-2 text-[12px] focus:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">From</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filter.date_from}
                            onChange={handleFilterChange}
                            className="h-7 w-full rounded border border-gray-300 px-2 text-[12px] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">To</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filter.date_to}
                            onChange={handleFilterChange}
                            className="h-7 w-full rounded border border-gray-300 px-2 text-[12px] focus:outline-none"
                        />
                    </div>

                    <div className="relative" ref={categoryRef}>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">Category</label>
                        <button
                            type="button"
                            onClick={() => setCategoryOpen((open) => !open)}
                            className="flex h-7 w-full items-center justify-between gap-1 rounded border border-gray-300 bg-white px-2 text-left text-[12px] text-slate-800"
                        >
                            <span className="truncate">{filter.category || 'All Categories'}</span>
                            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 ${categoryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {categoryOpen && (
                            <div className="absolute right-0 z-30 mt-1 w-72 rounded border border-gray-200 bg-white shadow-lg">
                                <input
                                    ref={categorySearchRef}
                                    type="text"
                                    value={categoryQuery}
                                    onChange={(event) => setCategoryQuery(event.target.value)}
                                    placeholder="Search category"
                                    className="h-7 w-full border-b border-gray-200 px-2 text-[12px] outline-none"
                                />
                                <div className="max-h-56 overflow-auto py-1">
                                    <button
                                        type="button"
                                        onClick={() => selectCategory('')}
                                        className={`block w-full px-2 py-1 text-left text-[12px] hover:bg-slate-50 ${filter.category === '' ? 'bg-slate-100 font-medium' : ''}`}
                                    >
                                        All Categories
                                    </button>
                                    {filteredExpenseCategories.length > 0 && (
                                        <>
                                            <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                                                Expense
                                            </div>
                                            {filteredExpenseCategories.map((category) => (
                                                <button
                                                    key={`exp-${category.id}`}
                                                    type="button"
                                                    onClick={() => selectCategory(category.name)}
                                                    className={`block w-full truncate px-2 py-1 text-left text-[12px] hover:bg-slate-50 ${filter.category === category.name ? 'bg-slate-100 font-medium' : ''}`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {filteredIncomeCategories.length > 0 && (
                                        <>
                                            <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                                                Income
                                            </div>
                                            {filteredIncomeCategories.map((category) => (
                                                <button
                                                    key={`inc-${category.id}`}
                                                    type="button"
                                                    onClick={() => selectCategory(category.name)}
                                                    className={`block w-full truncate px-2 py-1 text-left text-[12px] hover:bg-slate-50 ${filter.category === category.name ? 'bg-slate-100 font-medium' : ''}`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {filteredExpenseCategories.length === 0 && filteredIncomeCategories.length === 0 && (
                                        <div className="px-2 py-2 text-[12px] text-slate-500">No category found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="inline-flex h-7 items-center gap-1 rounded bg-slate-700 px-2 text-[12px] text-white hover:bg-slate-800"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2">
                    <div>
                        <h3 className="text-[13px] font-semibold text-gray-800">Transactions</h3>
                        <p className="text-[11px] text-gray-500">
                            {transactions.data.length} of {totals.total_count}
                        </p>
                    </div>
                    <div className="text-right text-[11px] text-gray-500">
                        Page {transactions.current_page} of {transactions.last_page}
                    </div>
                </div>

                {transactions.data && transactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                            <thead>
                                <tr className="border-b border-gray-200 bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                                    <th className="px-3 py-1.5 font-medium">No</th>
                                    <th className="px-3 py-1.5 font-medium">Type</th>
                                    <th className="px-3 py-1.5 font-medium">Category</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                    <th className="px-3 py-1.5 font-medium">Date</th>
                                    <th className="px-3 py-1.5 font-medium">Description</th>
                                    <th className="px-3 py-1.5 font-medium">Created by</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.data.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-1.5 font-medium text-slate-800">{transaction.transaction_no}</td>
                                        <td className="px-3 py-1.5">
                                            <span
                                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
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
                                        <td className="px-3 py-1.5 text-slate-700">{transaction.category || '—'}</td>
                                        <td
                                            className={`px-3 py-1.5 text-right font-medium tabular-nums ${
                                                transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                                            }`}
                                        >
                                            {transaction.type === 'income' ? '+' : '−'}
                                            {formatTaka(transaction.amount)}
                                        </td>
                                        <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{formatDate(transaction.transaction_date)}</td>
                                        <td className="max-w-[220px] truncate px-3 py-1.5 text-slate-600" title={transaction.description}>
                                            {transaction.description || '—'}
                                        </td>
                                        <td className="px-3 py-1.5 whitespace-nowrap text-slate-800">{transaction.created_by?.name || '—'}</td>
                                        <td className="px-3 py-1.5">
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
                    <div className="px-3 py-8 text-center text-[12px] text-slate-500">No transactions in this filter.</div>
                )}

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-1.5">
                        <div className="text-[11px] text-gray-600">
                            Showing {(transactions.current_page - 1) * transactions.per_page + 1} to{' '}
                            {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of {transactions.total} results
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePagination(transactions.current_page - 1)}
                                disabled={transactions.current_page === 1}
                                className="h-6 rounded border px-2 text-[11px] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                        className={`h-6 rounded border px-2 text-[11px] ${
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
                                className="h-6 rounded border px-2 text-[11px] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
