import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OperationAccountLayout from '@/layouts/OperationAccountLayout';
import { History, Filter, PlusCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface FundTransaction {
    id: number;
    voucher_no: string;
    type: string;
    amount: number;
    purpose: string;
    description: string;
    date: string;
    added_by: {
        name: string;
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedFundTransactions {
    data: FundTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    fundTransactions: PaginatedFundTransactions;
    balance: number;
}

const FundHistory: React.FC<Props> = ({ fundTransactions, balance }) => {
    const [filters, setFilters] = useState({
        type: '',
        start_date: '',
        end_date: ''
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const applyFilters = () => {
        router.get('/operation-account/fund-history', filters, { preserveState: true });
    };

    const resetFilters = () => {
        setFilters({ type: '', start_date: '', end_date: '' });
        router.get('/operation-account/fund-history', {}, { preserveState: true });
    };

    return (
        <OperationAccountLayout title="Fund History">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-6 mb-6 shadow-lg">
                <p className="text-sm opacity-90 mb-1">Current Balance</p>
                <p className="text-3xl font-bold">{formatAmount(balance)}</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="">All Types</option>
                            <option value="fund_in">Fund In</option>
                            <option value="fund_out">Fund Out</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                        >
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Fund Transactions Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Voucher No</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Purpose</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Added By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {fundTransactions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p className="text-lg font-medium">No fund transactions found</p>
                                    </td>
                                </tr>
                            ) : (
                                fundTransactions.data.map((fund) => (
                                    <tr key={fund.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm">{fund.voucher_no}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(fund.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {fund.type === 'fund_in' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <PlusCircle className="w-3 h-3" />
                                                    Fund In
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <MinusCircle className="w-3 h-3" />
                                                    Fund Out
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{fund.purpose}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 line-clamp-2">{fund.description}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-semibold ${fund.type === 'fund_in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {fund.type === 'fund_in' ? '+' : '-'}{formatAmount(fund.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {fund.added_by.name}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {fundTransactions.last_page > 1 && (
                    <div className="px-6 py-4 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{fundTransactions.data.length}</span> of{' '}
                                <span className="font-medium">{fundTransactions.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {fundTransactions.links.map((link, index) => {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.visit(link.url)}
                                                disabled={!link.url}
                                                className="px-3 py-1 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.visit(link.url)}
                                                disabled={!link.url}
                                                className="px-3 py-1 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        );
                                    }
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className={`px-3 py-1 rounded-lg border ${
                                                link.active
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'hover:bg-gray-100'
                                            }`}
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
        </OperationAccountLayout>
    );
};

export default FundHistory;
