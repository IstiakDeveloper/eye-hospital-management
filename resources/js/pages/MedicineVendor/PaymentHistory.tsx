import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    CreditCard,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Building2,
    User,
    FileText,
    Download,
    Eye,
    ArrowUpDown,
    TrendingUp,
    CheckCircle,
    Clock,
    RefreshCw,
    BarChart3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

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
        search: ''
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
            year: 'numeric'
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
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
        router.get(route('medicine-vendors.payment-history'), {
            ...searchFilters,
            sort_by: sortBy,
            sort_order: sortOrder
        }, {
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const exportPayments = (format: string) => {
        router.get(route('medicine-vendors.export-report'), {
            type: 'payment_history',
            format,
            ...searchFilters
        });
    };

    // Calculate summary statistics
    const currentPageTotal = payments.data.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const paymentMethodStats = payments.data.reduce((acc, payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        const validAmount = isNaN(amount) ? 0 : amount;
        acc[payment.payment_method] = (acc[payment.payment_method] || 0) + validAmount;
        return acc;
    }, {} as Record<string, number>);

    const topPaymentMethod = Object.entries(paymentMethodStats).sort((a, b) => b[1] - a[1])[0];

    return (
        <AdminLayout>
            <Head title="Payment History" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                        <p className="text-gray-600 mt-1">Track all vendor payments with detailed records and analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.analytics'))}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </button>
                        <div className="relative">
                            <select
                                onChange={(e) => exportPayments(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="" disabled>Export Data</option>
                                <option value="pdf">PDF Report</option>
                                <option value="excel">Excel Spreadsheet</option>
                                <option value="csv">CSV Data</option>
                            </select>
                            <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Payments</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">
                                    {formatCurrency(totalPayments)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">All time</span>
                                </div>
                            </div>
                            <div className="bg-blue-200 p-3 rounded-lg">
                                <DollarSign className="w-8 h-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">This Period</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">
                                    {formatCurrency(currentPageTotal)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-700">{payments.data.length} payments</span>
                                </div>
                            </div>
                            <div className="bg-green-200 p-3 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Avg Payment</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">
                                    {formatCurrency(payments.data.length > 0 ? currentPageTotal / payments.data.length : 0)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <BarChart3 className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-purple-700">Per transaction</span>
                                </div>
                            </div>
                            <div className="bg-purple-200 p-3 rounded-lg">
                                <FileText className="w-8 h-8 text-purple-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Top Method</p>
                                <p className="text-2xl font-bold text-orange-900 mt-1 capitalize">
                                    {topPaymentMethod ? topPaymentMethod[0].replace('_', ' ') : 'N/A'}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <CreditCard className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-orange-700">
                                        {topPaymentMethod ? formatCurrency(topPaymentMethod[1]) : '৳0'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-orange-200 p-3 rounded-lg">
                                <CreditCard className="w-8 h-8 text-orange-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search payments, vendors..."
                                    value={searchFilters.search}
                                    onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={searchFilters.date_from}
                                onChange={(e) => setSearchFilters({...searchFilters, date_from: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <input
                                type="date"
                                value={searchFilters.date_to}
                                onChange={(e) => setSearchFilters({...searchFilters, date_to: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <select
                                value={searchFilters.vendor_id}
                                onChange={(e) => setSearchFilters({...searchFilters, vendor_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                onChange={(e) => setSearchFilters({...searchFilters, payment_method: e.target.value})}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Filter className="w-4 h-4" />
                                )}
                                {isLoading ? 'Loading...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(paymentMethodStats).map(([method, amount]) => (
                            <div key={method} className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</div>
                                <div className="text-sm text-gray-600 capitalize mt-1">{method.replace('_', ' ')}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {currentPageTotal > 0 ? ((amount / currentPageTotal) * 100).toFixed(1) : '0'}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Payment Records</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('payment_no')}
                                            className="flex items-center gap-1 hover:text-gray-700"
                                        >
                                            Payment No
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('amount')}
                                            className="flex items-center gap-1 hover:text-gray-700"
                                        >
                                            Amount
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('payment_date')}
                                            className="flex items-center gap-1 hover:text-gray-700"
                                        >
                                            Date
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added By
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.data.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.payment_no}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                                    {payment.description}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {payment.vendor.name}
                                                    </div>
                                                    {payment.vendor.company_name && (
                                                        <div className="text-sm text-gray-500">
                                                            {payment.vendor.company_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPaymentMethodBadge(payment.payment_method)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {payment.reference_no || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(payment.payment_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div className="text-sm text-gray-900">
                                                    {payment.created_by.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.visit(route('medicine-vendors.show', payment.vendor.id))}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
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
                        <div className="text-center py-12">
                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                            <p className="text-gray-500">
                                {Object.values(searchFilters).some(v => v !== '')
                                    ? 'Try adjusting your search filters.'
                                    : 'No payment records available for the selected period.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {payments.data.length > 0 && payments.meta && payments.meta.last_page > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
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
                                        const prevLink = payments.links?.find(link => link.label === '&laquo; Previous');
                                        if (prevLink?.url) router.get(prevLink.url);
                                    }}
                                    disabled={!payments.links?.find(link => link.label === '&laquo; Previous')?.url}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-1">
                                    {payments.links?.slice(1, -1).map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                            disabled={!link.url}
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        const nextLink = payments.links?.find(link => link.label === 'Next &raquo;');
                                        if (nextLink?.url) router.get(nextLink.url);
                                    }}
                                    disabled={!payments.links?.find(link => link.label === 'Next &raquo;')?.url}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Stats Footer */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{payments.meta?.total || 0}</div>
                            <div className="text-sm text-gray-600">Total Records</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(currentPageTotal)}</div>
                            <div className="text-sm text-gray-600">Current Page Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {Object.keys(paymentMethodStats).length}
                            </div>
                            <div className="text-sm text-gray-600">Payment Methods Used</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
