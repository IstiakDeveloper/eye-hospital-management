import React from 'react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { TrendingUp, TrendingDown, Calendar, User, FileText, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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

interface FundHistoryProps {
    fundTransactions: {
        data: FundTransaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const FundHistory: React.FC<FundHistoryProps> = ({ fundTransactions }) => {
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

                {/* Pagination */}
                {fundTransactions.total > fundTransactions.per_page && (
                    <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-700">
                                Showing {((fundTransactions.current_page - 1) * fundTransactions.per_page) + 1} to{' '}
                                {Math.min(fundTransactions.current_page * fundTransactions.per_page, fundTransactions.total)} of{' '}
                                {fundTransactions.total} results
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    disabled={fundTransactions.current_page === 1}
                                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
                                    {fundTransactions.current_page}
                                </span>

                                <button
                                    disabled={fundTransactions.current_page === fundTransactions.last_page}
                                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default FundHistory;
