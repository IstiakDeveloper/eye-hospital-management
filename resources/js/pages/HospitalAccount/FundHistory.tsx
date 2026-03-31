import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { router } from '@inertiajs/react';
import { Filter, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

interface FundTransaction {
    id: number;
    voucher_no: string;
    type: 'fund_in' | 'fund_out';
    amount: number;
    purpose: string;
    description: string;
    date: string;
    added_by: {
        name: string;
    };
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface FundHistoryProps {
    fundTransactions: {
        data: FundTransaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: PaginationLinks[];
    };
    purposes: Array<string>;
    filters?: {
        type?: string;
        date_from?: string;
        date_to?: string;
        purpose?: string;
    };
    totals?: {
        total_fund_in: number;
        total_fund_out: number;
        net_fund: number;
    };
}

const FundHistory: React.FC<FundHistoryProps> = ({ fundTransactions, purposes = [], filters = {}, totals }) => {
    const [filter, setFilter] = useState({
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        purpose: filters.purpose || '',
    });

    const [deleteModal, setDeleteModal] = useState<{ show: boolean; transaction: FundTransaction | null }>({
        show: false,
        transaction: null,
    });

    // Auto filter function with debouncing
    const applyFilters = (newFilters: any) => {
        const params = new URLSearchParams();

        if (newFilters.type) params.set('type', newFilters.type);
        if (newFilters.date_from) params.set('date_from', newFilters.date_from);
        if (newFilters.date_to) params.set('date_to', newFilters.date_to);
        if (newFilters.purpose) params.set('purpose', newFilters.purpose);

        router.get('/hospital-account/fund-history?' + params.toString());
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
        const emptyFilters = { type: '', date_from: '', date_to: '', purpose: '' };
        setFilter(emptyFilters);
        router.get('/hospital-account/fund-history');
    };

    const handlePagination = (page: number) => {
        // Preserve filters when paginating
        const params = new URLSearchParams();

        if (filter.type) params.set('type', filter.type);
        if (filter.date_from) params.set('date_from', filter.date_from);
        if (filter.date_to) params.set('date_to', filter.date_to);
        if (filter.purpose) params.set('purpose', filter.purpose);
        params.set('page', page.toString());

        router.get('/hospital-account/fund-history?' + params.toString());
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleDelete = (transaction: FundTransaction) => {
        setDeleteModal({ show: true, transaction });
    };

    const confirmDelete = () => {
        if (deleteModal.transaction) {
            router.delete(`/hospital-account/fund-transactions/${deleteModal.transaction.id}`, {
                onSuccess: () => {
                    setDeleteModal({ show: false, transaction: null });
                },
            });
        }
    };

    // Use backend totals instead of calculating from current page data
    const totalFundIn = totals?.total_fund_in || 0;
    const totalFundOut = totals?.total_fund_out || 0;
    const netFund = totals?.net_fund || 0;

    return (
        <HospitalAccountLayout title="Fund History">
            {/* Simple Filter Section */}
            <div className="mb-4 rounded border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-5">
                    <div>
                        <label className="mb-1 block text-xs text-gray-600">Type</label>
                        <select
                            name="type"
                            value={filter.type}
                            onChange={handleFilterChange}
                            className="w-full rounded border px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="fund_in">Fund In</option>
                            <option value="fund_out">Fund Out</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-gray-600">From Date</label>
                        <input
                            type="date"
                            name="date_from"
                            value={filter.date_from}
                            onChange={handleFilterChange}
                            className="w-full rounded border px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-gray-600">To Date</label>
                        <input
                            type="date"
                            name="date_to"
                            value={filter.date_to}
                            onChange={handleFilterChange}
                            className="w-full rounded border px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-gray-600">Purpose</label>
                        <select
                            name="purpose"
                            value={filter.purpose}
                            onChange={handleFilterChange}
                            className="w-full rounded border px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 focus:outline-none"
                        >
                            <option value="">All Purposes</option>
                            {purposes?.map((purpose, index) => (
                                <option key={index} value={purpose}>
                                    {purpose}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 rounded bg-gray-500 px-3 py-1.5 text-xs text-white hover:bg-gray-600"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Clear
                        </button>

                        {/* Quick Summary */}
                        <div className="rounded bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                            <div>Fund In: ৳{totalFundIn.toLocaleString()}</div>
                            <div>Fund Out: ৳{totalFundOut.toLocaleString()}</div>
                            <div className={netFund >= 0 ? 'text-green-600' : 'text-red-600'}>
                                Net: ৳{Math.abs(netFund).toLocaleString()} {netFund >= 0 ? '↑' : '↓'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Data Table */}
            <div className="rounded border bg-white">
                <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                    <span className="text-sm font-medium">Fund Transactions ({fundTransactions.total || 0} total)</span>
                    <span className="text-xs text-gray-500">
                        Page {fundTransactions.current_page} of {fundTransactions.last_page}
                    </span>
                </div>

                {fundTransactions.data && fundTransactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Voucher No</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Purpose</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Added By</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fundTransactions.data.map((transaction, index) => (
                                    <tr key={transaction.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                        <td className="px-3 py-2 font-mono text-blue-600">{transaction.voucher_no}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                    transaction.type === 'fund_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {transaction.type === 'fund_in' ? 'Fund In' : 'Fund Out'}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-3 py-2 text-right font-mono font-medium ${
                                                transaction.type === 'fund_in' ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {transaction.type === 'fund_in' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{transaction.purpose}</td>
                                        <td className="px-3 py-2 text-gray-600">{formatDate(transaction.date)}</td>
                                        <td className="px-3 py-2 text-gray-700">{transaction.added_by?.name || 'Unknown'}</td>
                                        <td className="max-w-xs truncate px-3 py-2 text-gray-700" title={transaction.description}>
                                            {transaction.description || 'No description'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => handleDelete(transaction)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">No fund transactions found</p>
                        <p className="mt-1 text-xs text-gray-400">Try adjusting your filters</p>
                    </div>
                )}

                {/* Simple Pagination */}
                {fundTransactions.last_page > 1 && (
                    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-600">
                            Showing {fundTransactions.from || 0} to {fundTransactions.to || 0} of {fundTransactions.total} results
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePagination(fundTransactions.current_page - 1)}
                                disabled={fundTransactions.current_page === 1}
                                className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, fundTransactions.last_page) }, (_, i) => {
                                let pageNum;
                                if (fundTransactions.last_page <= 5) {
                                    pageNum = i + 1;
                                } else if (fundTransactions.current_page <= 3) {
                                    pageNum = i + 1;
                                } else if (fundTransactions.current_page >= fundTransactions.last_page - 2) {
                                    pageNum = fundTransactions.last_page - 4 + i;
                                } else {
                                    pageNum = fundTransactions.current_page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePagination(pageNum)}
                                        className={`rounded border px-2 py-1 text-xs ${
                                            pageNum === fundTransactions.current_page ? 'border-blue-500 bg-blue-500 text-white' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePagination(fundTransactions.current_page + 1)}
                                disabled={fundTransactions.current_page === fundTransactions.last_page}
                                className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="mx-4 w-96 max-w-lg rounded-lg bg-white p-6">
                        <h3 className="mb-4 text-lg font-semibold text-red-600">Delete Fund Transaction</h3>
                        <div className="mb-4">
                            <p className="mb-2 text-gray-700">Are you sure you want to delete this fund transaction?</p>
                            <div className="rounded bg-gray-50 p-3 text-sm">
                                <p>
                                    <strong>Voucher:</strong> {deleteModal.transaction?.voucher_no}
                                </p>
                                <p>
                                    <strong>Type:</strong> {deleteModal.transaction?.type}
                                </p>
                                <p>
                                    <strong>Amount:</strong> ৳{Number(deleteModal.transaction?.amount).toLocaleString('en-BD')}
                                </p>
                                <p>
                                    <strong>Purpose:</strong> {deleteModal.transaction?.purpose}
                                </p>
                            </div>
                            <p className="mt-2 text-xs text-red-600">
                                This action will reverse the transaction and update account balances accordingly.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={confirmDelete} className="flex-1 rounded bg-red-600 py-2 text-sm text-white hover:bg-red-700">
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteModal({ show: false, transaction: null })}
                                className="flex-1 rounded bg-gray-500 py-2 text-sm text-white hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HospitalAccountLayout>
    );
};

export default FundHistory;
