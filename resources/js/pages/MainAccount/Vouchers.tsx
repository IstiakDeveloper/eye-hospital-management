import React, { useState } from 'react';
import AdminLayout from '@/layouts/MainAccountLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    Filter,
    Download,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw
} from 'lucide-react';

interface Voucher {
    id: number;
    sl_no: number;
    voucher_no: string;
    voucher_type: 'Debit' | 'Credit';
    date: string;
    narration: string;
    amount: number;
    formatted_amount: string;
    source_account: string;
    source_account_name: string;
    source_transaction_type: string;
    transaction_type_name: string;
    source_voucher_no: string;
    running_balance: number;
    created_by: { id: number; name: string } | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface VouchersPagination {
    data: Voucher[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface FilterOptions {
    voucher_types: string[];
    source_accounts: string[];
    transaction_types: string[];
}

interface Filters {
    voucher_type?: string;
    source_account?: string;
    source_transaction_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}

interface Props {
    vouchers: VouchersPagination;
    filters: Filters;
    filterOptions: FilterOptions;
}

export default function Vouchers({ vouchers, filters, filterOptions }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '৳0.00';

        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);

        return `৳${formatted}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        router.get('/main-account/vouchers', localFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get('/main-account/vouchers', {}, {
            preserveState: true,
            replace: true
        });
    };

    const exportVouchers = () => {
        const params = new URLSearchParams(filters as Record<string, string>);
        window.open(`/main-account/export?${params.toString()}`);
    };

    return (
        <AdminLayout>
            <Head title="Main Account Vouchers" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/main-account"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Account Vouchers</h1>
                            <p className="text-gray-600 mt-1">
                                Showing {vouchers.from}-{vouchers.to} of {vouchers.total} vouchers
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${showFilters
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </button>
                        <button
                            onClick={exportVouchers}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={localFilters.search || ''}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        placeholder="Search vouchers..."
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Voucher Type
                                </label>
                                <select
                                    value={localFilters.voucher_type || ''}
                                    onChange={(e) => handleFilterChange('voucher_type', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {filterOptions.voucher_types.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Source Account
                                </label>
                                <select
                                    value={localFilters.source_account || ''}
                                    onChange={(e) => handleFilterChange('source_account', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Accounts</option>
                                    {filterOptions.source_accounts.map(account => (
                                        <option key={account} value={account}>{account}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction Type
                                </label>
                                <select
                                    value={localFilters.source_transaction_type || ''}
                                    onChange={(e) => handleFilterChange('source_transaction_type', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {filterOptions.transaction_types.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date From
                                </label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="date"
                                        value={localFilters.date_from || ''}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date To
                                </label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="date"
                                        value={localFilters.date_to || ''}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Vouchers Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SL
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Voucher Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account & Type
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Running Balance
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vouchers.data && vouchers.data.length > 0 ? (
                                    vouchers.data.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {voucher.sl_no}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <div className="text-sm font-medium text-gray-900">{voucher.voucher_no}</div>
                                                    <div className="text-sm text-gray-500 truncate" title={voucher.narration}>
                                                        {voucher.narration}
                                                    </div>
                                                    {voucher.source_voucher_no && (
                                                        <div className="text-xs text-gray-400">
                                                            Ref: {voucher.source_voucher_no}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(voucher.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${voucher.voucher_type === 'Credit'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {voucher.voucher_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`text-sm font-medium ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <div className="text-sm text-gray-900 truncate" title={voucher.source_account_name}>
                                                        {voucher.source_account_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate" title={voucher.transaction_type_name}>
                                                        {voucher.transaction_type_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                                                {formatCurrency(voucher.running_balance)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/main-account/vouchers/${voucher.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                                                <p className="text-sm text-gray-500">No vouchers found</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Try adjusting your search criteria or filters
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {vouchers.last_page > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{vouchers.from}</span> to{' '}
                                <span className="font-medium">{vouchers.to}</span> of{' '}
                                <span className="font-medium">{vouchers.total}</span> results
                            </div>
                            <div className="flex items-center space-x-2">
                                {vouchers.links.map((link, index) => {
                                    if (link.label === '&laquo; Previous') {
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`p-2 rounded-lg ${link.url
                                                        ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                        : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                                preserveState
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Link>
                                        );
                                    }
                                    if (link.label === 'Next &raquo;') {
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`p-2 rounded-lg ${link.url
                                                        ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                        : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                                preserveState
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        );
                                    }
                                    if (link.label === '...') {
                                        return (
                                            <span key={index} className="px-3 py-1 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 rounded-lg text-sm ${link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                }`}
                                            preserveState
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
