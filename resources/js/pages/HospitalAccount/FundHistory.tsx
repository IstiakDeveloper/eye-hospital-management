import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { TrendingUp, TrendingDown, Calendar, User, FileText, DollarSign, Trash2 } from 'lucide-react';

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
}

const FundHistory: React.FC<FundHistoryProps> = ({ fundTransactions }) => {
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; transaction: FundTransaction | null }>({
        show: false,
        transaction: null
    });

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

    const handlePagination = (url: string | null) => {
        if (url) {
            router.get(url);
        }
    };

    // Safe calculation with fallback for empty data
    const totalFundIn = fundTransactions.data
        ?.filter(t => t.type === 'fund_in')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const totalFundOut = fundTransactions.data
        ?.filter(t => t.type === 'fund_out')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const netFund = totalFundIn - totalFundOut;

    return (
        <HospitalAccountLayout title="Fund History">
            {/* Enhanced Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Fund In Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-green-700">Total Fund In</h3>
                            <p className="text-3xl font-bold text-green-800 mb-1">
                                ৳{totalFundIn.toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-green-600">
                                {fundTransactions.data?.filter(t => t.type === 'fund_in').length || 0} transactions
                            </p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-full">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Total Fund Out Card */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-red-700">Total Fund Out</h3>
                            <p className="text-3xl font-bold text-red-800 mb-1">
                                ৳{totalFundOut.toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-red-600">
                                {fundTransactions.data?.filter(t => t.type === 'fund_out').length || 0} transactions
                            </p>
                        </div>
                        <div className="bg-red-500 p-3 rounded-full">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Net Fund Card */}
                <div className={`bg-gradient-to-br ${netFund >= 0
                        ? 'from-blue-50 to-blue-100 border-blue-500'
                        : 'from-orange-50 to-orange-100 border-orange-500'
                    } p-6 rounded-lg shadow-sm border-l-4`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`text-sm font-medium ${netFund >= 0 ? 'text-blue-700' : 'text-orange-700'
                                }`}>
                                Net Fund Balance
                            </h3>
                            <p className={`text-3xl font-bold mb-1 ${netFund >= 0 ? 'text-blue-800' : 'text-orange-800'
                                }`}>
                                ৳{Math.abs(netFund).toLocaleString('en-BD')}
                            </p>
                            <p className={`text-xs ${netFund >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                {netFund >= 0 ? 'Surplus' : 'Deficit'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${netFund >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}>
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fund Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Fund Transactions ({fundTransactions.total || 0} total)
                        </h3>
                        <div className="text-sm text-gray-500">
                            Page {fundTransactions.current_page} of {fundTransactions.last_page}
                        </div>
                    </div>
                </div>

                {fundTransactions.data && fundTransactions.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Voucher No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purpose
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {fundTransactions.data.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                                            {transaction.voucher_no}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${transaction.type === 'fund_in'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                {transaction.type === 'fund_in' ? (
                                                    <>
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        Fund In
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                        Fund Out
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-semibold ${transaction.type === 'fund_in' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            <span className="font-mono">
                                                {transaction.type === 'fund_in' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString('en-BD')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                                {transaction.purpose}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                {formatDate(transaction.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                                {transaction.added_by?.name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs break-words overflow-hidden" title={transaction.description}>
                                                {transaction.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleDelete(transaction)}
                                                className="text-red-600 hover:text-red-800 transition-colors duration-150"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No fund transactions</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first fund transaction.
                        </p>
                    </div>
                )}

                {/* Fixed Pagination */}
                {fundTransactions.total > fundTransactions.per_page && (
                    <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Showing {fundTransactions.from || 0} to {fundTransactions.to || 0} of {fundTransactions.total} results
                            </div>

                            <div className="flex items-center space-x-1">
                                {fundTransactions.links?.map((link, index) => {
                                    if (link.label === '&laquo; Previous') {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handlePagination(link.url)}
                                                disabled={!link.url}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                        );
                                    }

                                    if (link.label === 'Next &raquo;') {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handlePagination(link.url)}
                                                disabled={!link.url}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        );
                                    }

                                    if (link.label === '...') {
                                        return (
                                            <span key={index} className="px-3 py-2 text-sm font-medium text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handlePagination(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-2 text-sm font-medium border ${
                                                link.active
                                                    ? 'bg-blue-50 text-blue-600 border-blue-300'
                                                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {link.label}
                                        </button>
                                    );
                                })}
                            </div>
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
                            <div className="bg-gray-50 p-3 rounded">
                                <p><strong>Voucher:</strong> {deleteModal.transaction?.voucher_no}</p>
                                <p><strong>Type:</strong> {deleteModal.transaction?.type}</p>
                                <p><strong>Amount:</strong> ৳{Number(deleteModal.transaction?.amount).toLocaleString('en-BD')}</p>
                                <p><strong>Purpose:</strong> {deleteModal.transaction?.purpose}</p>
                            </div>
                            <p className="text-red-600 text-sm mt-2">
                                This action will reverse the transaction and update account balances accordingly.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteModal({ show: false, transaction: null })}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
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
