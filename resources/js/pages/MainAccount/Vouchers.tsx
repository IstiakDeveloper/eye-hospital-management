import AdminLayout from '@/layouts/MainAccountLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, FileText, Filter, Search } from 'lucide-react';
import { useState } from 'react';

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
        setLocalFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const applyFilters = () => {
        router.get('/main-account/vouchers', localFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get(
            '/main-account/vouchers',
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
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
                        <Link href="/main-account" className="flex items-center text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Account Vouchers</h1>
                            <p className="mt-1 text-gray-600">
                                Showing {vouchers.from}-{vouchers.to} of {vouchers.total} vouchers
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center rounded-lg px-4 py-2 transition-colors ${
                                showFilters ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </button>
                        <button
                            onClick={exportVouchers}
                            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
                                <div className="relative">
                                    <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={localFilters.search || ''}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        placeholder="Search vouchers..."
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Voucher Type</label>
                                <select
                                    value={localFilters.voucher_type || ''}
                                    onChange={(e) => handleFilterChange('voucher_type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {filterOptions.voucher_types.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Source Account</label>
                                <select
                                    value={localFilters.source_account || ''}
                                    onChange={(e) => handleFilterChange('source_account', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Accounts</option>
                                    {filterOptions.source_accounts.map((account) => (
                                        <option key={account} value={account}>
                                            {account}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Transaction Type</label>
                                <select
                                    value={localFilters.source_transaction_type || ''}
                                    onChange={(e) => handleFilterChange('source_transaction_type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {filterOptions.transaction_types.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Date From</label>
                                <div className="relative">
                                    <Calendar className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={localFilters.date_from || ''}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Date To</label>
                                <div className="relative">
                                    <Calendar className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={localFilters.date_to || ''}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                            <button
                                onClick={clearFilters}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={applyFilters}
                                className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Vouchers Table */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">SL</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Voucher Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Account & Type</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Running Balance
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {vouchers.data && vouchers.data.length > 0 ? (
                                    vouchers.data.map((voucher) => (
                                        <tr key={voucher.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{voucher.sl_no}</td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <div className="text-sm font-medium text-gray-900">{voucher.voucher_no}</div>
                                                    <div className="truncate text-sm text-gray-500" title={voucher.narration}>
                                                        {voucher.narration}
                                                    </div>
                                                    {voucher.source_voucher_no && (
                                                        <div className="text-xs text-gray-400">Ref: {voucher.source_voucher_no}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                {new Date(voucher.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                        voucher.voucher_type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {voucher.voucher_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <div className="truncate text-sm text-gray-900" title={voucher.source_account_name}>
                                                        {voucher.source_account_name}
                                                    </div>
                                                    <div className="truncate text-xs text-gray-500" title={voucher.transaction_type_name}>
                                                        {voucher.transaction_type_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                                                {formatCurrency(voucher.running_balance)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <Link
                                                    href={`/main-account/vouchers/${voucher.id}`}
                                                    className="inline-flex items-center rounded px-2 py-1 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="mb-4 h-12 w-12 text-gray-400" />
                                                <p className="text-sm text-gray-500">No vouchers found</p>
                                                <p className="mt-1 text-xs text-gray-400">Try adjusting your search criteria or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {vouchers.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{vouchers.from}</span> to <span className="font-medium">{vouchers.to}</span> of{' '}
                                <span className="font-medium">{vouchers.total}</span> results
                            </div>
                            <div className="flex items-center space-x-2">
                                {vouchers.links.map((link, index) => {
                                    if (link.label === '&laquo; Previous') {
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`rounded-lg p-2 ${
                                                    link.url
                                                        ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                        : 'cursor-not-allowed text-gray-300'
                                                }`}
                                                preserveState
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Link>
                                        );
                                    }
                                    if (link.label === 'Next &raquo;') {
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`rounded-lg p-2 ${
                                                    link.url
                                                        ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                        : 'cursor-not-allowed text-gray-300'
                                                }`}
                                                preserveState
                                            >
                                                <ChevronRight className="h-4 w-4" />
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
                                            className={`rounded-lg px-3 py-1 text-sm ${
                                                link.active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
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
