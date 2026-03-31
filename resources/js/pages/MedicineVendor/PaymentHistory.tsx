import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    BarChart3,
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileText,
    Filter,
    RefreshCw,
    Search,
    TrendingUp,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface VendorPayment {
    id: number;
    payment_no: string;
    amount: number | string;
    payment_method: string;
    reference_no?: string;
    payment_date: string;
    description: string;
    vendor: Vendor;
    created_by: {
        name: string;
    };
    allocated_transactions?: number[];
}

interface PaymentHistoryProps {
    payments: {
        data: VendorPayment[];
        links: any[];
        meta: any;
    };
    vendors: Vendor[];
    filters: {
        date_from: string;
        date_to: string;
        vendor_id?: string;
        payment_method?: string;
    };
    totalPayments: number | string;
}

export default function PaymentHistory({ payments, vendors, filters, totalPayments }: PaymentHistoryProps) {
    const [searchFilters, setSearchFilters] = useState({
        date_from: filters.date_from,
        date_to: filters.date_to,
        vendor_id: filters.vendor_id || '',
        payment_method: filters.payment_method || '',
        search: '',
    });

    const [sortBy, setSortBy] = useState('payment_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isLoading, setIsLoading] = useState(false);

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '৳0';

        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(numAmount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPaymentMethodBadge = (method: string) => {
        const methodConfig = {
            cash: { color: 'bg-green-100 text-green-800', label: 'Cash' },
            bank_transfer: { color: 'bg-blue-100 text-blue-800', label: 'Bank Transfer' },
            cheque: { color: 'bg-purple-100 text-purple-800', label: 'Cheque' },
            mobile_banking: { color: 'bg-orange-100 text-orange-800', label: 'Mobile Banking' },
        };

        const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.cash;

        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>{config.label}</span>;
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }

        // Apply sorting logic here or make API call
        applyFilters();
    };

    const applyFilters = async () => {
        setIsLoading(true);
        router.get(
            route('medicine-vendors.payment-history'),
            {
                ...searchFilters,
                sort_by: sortBy,
                sort_order: sortOrder,
            },
            {
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const exportPayments = (format: string) => {
        router.get(route('medicine-vendors.export-report'), {
            type: 'payment_history',
            format,
            ...searchFilters,
        });
    };

    // Calculate summary statistics
    const currentPageTotal = payments.data.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const paymentMethodStats = payments.data.reduce(
        (acc, payment) => {
            const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
            const validAmount = isNaN(amount) ? 0 : amount;
            acc[payment.payment_method] = (acc[payment.payment_method] || 0) + validAmount;
            return acc;
        },
        {} as Record<string, number>,
    );

    const topPaymentMethod = Object.entries(paymentMethodStats).sort((a, b) => b[1] - a[1])[0];

    return (
        <AdminLayout>
            <Head title="Payment History" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                        <p className="mt-1 text-gray-600">Track all vendor payments with detailed records and analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.analytics'))}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </button>
                        <div className="relative">
                            <select
                                onChange={(e) => exportPayments(e.target.value)}
                                className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Export Data
                                </option>
                                <option value="pdf">PDF Report</option>
                                <option value="excel">Excel Spreadsheet</option>
                                <option value="csv">CSV Data</option>
                            </select>
                            <Download className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Payments</p>
                                <p className="mt-1 text-3xl font-bold text-blue-900">{formatCurrency(totalPayments)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">All time</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-200 p-3">
                                <DollarSign className="h-8 w-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">This Period</p>
                                <p className="mt-1 text-3xl font-bold text-green-900">{formatCurrency(currentPageTotal)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700">{payments.data.length} payments</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-green-200 p-3">
                                <TrendingUp className="h-8 w-8 text-green-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Avg Payment</p>
                                <p className="mt-1 text-3xl font-bold text-purple-900">
                                    {formatCurrency(payments.data.length > 0 ? currentPageTotal / payments.data.length : 0)}
                                </p>
                                <div className="mt-2 flex items-center gap-1">
                                    <BarChart3 className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm text-purple-700">Per transaction</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-200 p-3">
                                <FileText className="h-8 w-8 text-purple-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Top Method</p>
                                <p className="mt-1 text-2xl font-bold text-orange-900 capitalize">
                                    {topPaymentMethod ? topPaymentMethod[0].replace('_', ' ') : 'N/A'}
                                </p>
                                <div className="mt-2 flex items-center gap-1">
                                    <CreditCard className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm text-orange-700">{topPaymentMethod ? formatCurrency(topPaymentMethod[1]) : '৳0'}</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-orange-200 p-3">
                                <CreditCard className="h-8 w-8 text-orange-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search payments, vendors..."
                                    value={searchFilters.search}
                                    onChange={(e) => setSearchFilters({ ...searchFilters, search: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={searchFilters.date_from}
                                onChange={(e) => setSearchFilters({ ...searchFilters, date_from: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <input
                                type="date"
                                value={searchFilters.date_to}
                                onChange={(e) => setSearchFilters({ ...searchFilters, date_to: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <select
                                value={searchFilters.vendor_id}
                                onChange={(e) => setSearchFilters({ ...searchFilters, vendor_id: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Vendors</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} {vendor.company_name && `(${vendor.company_name})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={searchFilters.payment_method}
                                onChange={(e) => setSearchFilters({ ...searchFilters, payment_method: e.target.value })}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="mobile_banking">Mobile Banking</option>
                            </select>

                            <button
                                onClick={applyFilters}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                {isLoading ? 'Loading...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Method Breakdown</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {Object.entries(paymentMethodStats).map(([method, amount]) => (
                            <div key={method} className="rounded-lg bg-gray-50 p-4 text-center">
                                <div className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</div>
                                <div className="mt-1 text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {currentPageTotal > 0 ? ((amount / currentPageTotal) * 100).toFixed(1) : '0'}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payments Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Payment Records</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        <button onClick={() => handleSort('payment_no')} className="flex items-center gap-1 hover:text-gray-700">
                                            Payment No
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-gray-700">
                                            Amount
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        <button onClick={() => handleSort('payment_date')} className="flex items-center gap-1 hover:text-gray-700">
                                            Date
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Added By</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {payments.data.map((payment) => (
                                    <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{payment.payment_no}</div>
                                                <div className="max-w-[200px] truncate text-sm text-gray-500">{payment.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{payment.vendor.name}</div>
                                                    {payment.vendor.company_name && (
                                                        <div className="text-sm text-gray-500">{payment.vendor.company_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</div>
                                        </td>
                                        <td className="px-6 py-4">{getPaymentMethodBadge(payment.payment_method)}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{payment.reference_no || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{formatDate(payment.payment_date)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <div className="text-sm text-gray-900">{payment.created_by.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.visit(route('medicine-vendors.show', payment.vendor.id))}
                                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Vendor
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {payments.data.length === 0 && (
                        <div className="py-12 text-center">
                            <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No payments found</h3>
                            <p className="text-gray-500">
                                {Object.values(searchFilters).some((v) => v !== '')
                                    ? 'Try adjusting your search filters.'
                                    : 'No payment records available for the selected period.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {payments.data.length > 0 && payments.meta && payments.meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span>Showing</span>
                                <span className="font-medium">{payments.meta?.from || 0}</span>
                                <span>to</span>
                                <span className="font-medium">{payments.meta?.to || 0}</span>
                                <span>of</span>
                                <span className="font-medium">{payments.meta?.total || 0}</span>
                                <span>results</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const prevLink = payments.links?.find((link) => link.label === '&laquo; Previous');
                                        if (prevLink?.url) router.get(prevLink.url);
                                    }}
                                    disabled={!payments.links?.find((link) => link.label === '&laquo; Previous')?.url}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-1">
                                    {payments.links?.slice(1, -1).map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                            disabled={!link.url}
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        const nextLink = payments.links?.find((link) => link.label === 'Next &raquo;');
                                        if (nextLink?.url) router.get(nextLink.url);
                                    }}
                                    disabled={!payments.links?.find((link) => link.label === 'Next &raquo;')?.url}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Stats Footer */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{payments.meta?.total || 0}</div>
                            <div className="text-sm text-gray-600">Total Records</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(currentPageTotal)}</div>
                            <div className="text-sm text-gray-600">Current Page Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{Object.keys(paymentMethodStats).length}</div>
                            <div className="text-sm text-gray-600">Payment Methods Used</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
