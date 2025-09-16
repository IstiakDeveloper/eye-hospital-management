import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Filter, RefreshCw, Trash2 } from 'lucide-react';

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
        purpose: filters.purpose || ''
    });

    const [deleteModal, setDeleteModal] = useState<{ show: boolean; transaction: FundTransaction | null }>({
        show: false,
        transaction: null
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
            year: 'numeric'
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
                }
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
                            <option value="fund_in">Fund In</option>
                            <option value="fund_out">Fund Out</option>
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
                        <label className="block text-xs text-gray-600 mb-1">Purpose</label>
                        <select
                            name="purpose"
                            value={filter.purpose}
                            onChange={handleFilterChange}
                            className="w-full text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Clear
                        </button>

                        {/* Quick Summary */}
                        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
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
            <div className="bg-white border rounded">
                <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
                    <span className="text-sm font-medium">
                        Fund Transactions ({fundTransactions.total || 0} total)
                    </span>
                    <span className="text-xs text-gray-500">
                        Page {fundTransactions.current_page} of {fundTransactions.last_page}
                    </span>
                </div>

                {fundTransactions.data && fundTransactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b">
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
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${transaction.type === 'fund_in'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {transaction.type === 'fund_in' ? 'Fund In' : 'Fund Out'}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-2 text-right font-mono font-medium ${transaction.type === 'fund_in' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'fund_in' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{transaction.purpose}</td>
                                        <td className="px-3 py-2 text-gray-600">{formatDate(transaction.date)}</td>
                                        <td className="px-3 py-2 text-gray-700">{transaction.added_by?.name || 'Unknown'}</td>
                                        <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={transaction.description}>
                                            {transaction.description || 'No description'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => handleDelete(transaction)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No fund transactions found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                )}

                {/* Simple Pagination */}
                {fundTransactions.last_page > 1 && (
                    <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                            Showing {fundTransactions.from || 0} to {fundTransactions.to || 0} of {fundTransactions.total} results
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePagination(fundTransactions.current_page - 1)}
                                disabled={fundTransactions.current_page === 1}
                                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className={`px-2 py-1 text-xs border rounded ${pageNum === fundTransactions.current_page
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePagination(fundTransactions.current_page + 1)}
                                disabled={fundTransactions.current_page === fundTransactions.last_page}
                                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Fund Transaction</h3>
                        <div className="mb-4">
                            <p className="text-gray-700 mb-2">
                                Are you sure you want to delete this fund transaction?
                            </p>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><strong>Voucher:</strong> {deleteModal.transaction?.voucher_no}</p>
                                <p><strong>Type:</strong> {deleteModal.transaction?.type}</p>
                                <p><strong>Amount:</strong> ৳{Number(deleteModal.transaction?.amount).toLocaleString('en-BD')}</p>
                                <p><strong>Purpose:</strong> {deleteModal.transaction?.purpose}</p>
                            </div>
                            <p className="text-red-600 text-xs mt-2">
                                This action will reverse the transaction and update account balances accordingly.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteModal({ show: false, transaction: null })}
                                className="flex-1 bg-gray-500 text-white py-2 rounded text-sm hover:bg-gray-600"
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
