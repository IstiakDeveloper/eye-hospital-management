import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

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
    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Format amount helper
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const totalFundIn = fundTransactions.data.filter((t) => t.type === 'fund_in').reduce((sum, t) => sum + t.amount, 0);

    const totalFundOut = fundTransactions.data.filter((t) => t.type === 'fund_out').reduce((sum, t) => sum + t.amount, 0);

    return (
        <MedicineAccountLayout title="Fund History">
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Total Fund In</h3>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(totalFundIn)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Total Fund Out</h3>
                            <p className="text-2xl font-bold text-red-600">{formatAmount(totalFundOut)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-600">Net Fund</h3>
                            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalFundIn - totalFundOut)}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Fund Transactions Table */}
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-semibold">Fund Transactions ({fundTransactions.total} total)</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {fundTransactions.data.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{transaction.voucher_no}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                transaction.type === 'fund_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {transaction.type === 'fund_in' ? 'Fund In' : 'Fund Out'}
                                        </span>
                                    </td>
                                    <td
                                        className={`px-6 py-4 text-sm font-medium ${
                                            transaction.type === 'fund_in' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                    >
                                        {transaction.type === 'fund_in' ? '+' : '-'}
                                        {formatAmount(transaction.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <span className="font-medium">{transaction.purpose}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.added_by.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="max-w-xs truncate" title={transaction.description}>
                                            {transaction.description}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {fundTransactions.last_page > 1 && (
                    <div className="border-t px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {(fundTransactions.current_page - 1) * fundTransactions.per_page + 1} to{' '}
                                {Math.min(fundTransactions.current_page * fundTransactions.per_page, fundTransactions.total)} of{' '}
                                {fundTransactions.total} results
                            </div>
                            <div className="flex gap-2">
                                {fundTransactions.current_page > 1 && (
                                    <button
                                        onClick={() =>
                                            router.get('/medicine-account/fund-history', {
                                                page: fundTransactions.current_page - 1,
                                            })
                                        }
                                        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                )}

                                <span className="px-3 py-1 text-sm">
                                    Page {fundTransactions.current_page} of {fundTransactions.last_page}
                                </span>

                                {fundTransactions.current_page < fundTransactions.last_page && (
                                    <button
                                        onClick={() =>
                                            router.get('/medicine-account/fund-history', {
                                                page: fundTransactions.current_page + 1,
                                            })
                                        }
                                        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MedicineAccountLayout>
    );
};

export default FundHistory;
