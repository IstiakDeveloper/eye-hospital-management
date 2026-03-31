import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileText,
    Filter,
    Package,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

interface VendorTransaction {
    id: number;
    transaction_no: string;
    amount: number;
    due_amount: number;
    transaction_date: string;
    due_date: string;
    description: string;
    payment_status: 'pending' | 'partial' | 'paid';
    days_overdue: number;
}

interface VendorWithDues {
    id: number;
    name: string;
    company_name?: string;
    current_balance: number;
    credit_limit: number;
    overdue_amount: number;
    transactions: VendorTransaction[];
}

interface AgingAnalysis {
    current: number;
    '1_30_days': number;
    '31_60_days': number;
    '61_90_days': number;
    over_90_days: number;
}

interface DueReportProps {
    vendorsWithDues: VendorWithDues[];
    filters: {
        date_from: string;
        date_to: string;
    };
    summary: {
        total_dues: number;
        total_overdue: number;
        vendor_count: number;
    };
    agingAnalysis: AgingAnalysis;
}

export default function DueReport({ vendorsWithDues, filters, summary, agingAnalysis }: DueReportProps) {
    const [dateRange, setDateRange] = useState({ from: filters.date_from, to: filters.date_to });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('due_amount');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorWithDues | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        vendor_id: '',
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
    });

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDaysOverdue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getOverdueStatus = (days: number) => {
        if (days <= 0) return { label: 'Current', color: 'text-green-600 bg-green-100' };
        if (days <= 30) return { label: `${days}d overdue`, color: 'text-yellow-600 bg-yellow-100' };
        if (days <= 60) return { label: `${days}d overdue`, color: 'text-orange-600 bg-orange-100' };
        return { label: `${days}d overdue`, color: 'text-red-600 bg-red-100' };
    };

    const safeVendorsWithDues = Array.isArray(vendorsWithDues) ? vendorsWithDues : [];
    const filteredVendors = safeVendorsWithDues
        .filter(
            (vendor) =>
                vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'due_amount':
                    return b.current_balance - a.current_balance;
                case 'overdue_amount':
                    return b.overdue_amount - a.overdue_amount;
                default:
                    return 0;
            }
        });

    const handleDateRangeChange = async () => {
        setIsLoading(true);
        router.get(route('medicine-vendors.due-report'), dateRange, {
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.make-payment'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedVendor(null);
                reset();
            },
        });
    };

    const openPaymentModal = (vendor: VendorWithDues) => {
        setSelectedVendor(vendor);
        setData({
            vendor_id: vendor.id.toString(),
            amount: vendor.current_balance.toString(),
            payment_method: 'cash',
            reference_no: '',
            description: `Payment to ${vendor.name} for outstanding dues`,
        });
        setShowPaymentModal(true);
    };

    const exportReport = (format: string) => {
        router.get(route('medicine-vendors.export-report'), {
            type: 'due_report',
            format,
            date_from: dateRange.from,
            date_to: dateRange.to,
        });
    };

    return (
        <AdminLayout>
            <Head title="Vendor Due Report" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Due Report</h1>
                        <p className="mt-1 text-gray-600">Track and analyze outstanding vendor payments with aging analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                onChange={(e) => exportReport(e.target.value)}
                                className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Export Report
                                </option>
                                <option value="pdf">PDF Report</option>
                                <option value="excel">Excel Spreadsheet</option>
                                <option value="csv">CSV Data</option>
                            </select>
                            <Download className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        </div>
                        <button
                            onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                        >
                            <CreditCard className="h-4 w-4" />
                            Make Payments
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Report Period:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleDateRangeChange}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Total Outstanding</p>
                                <p className="mt-1 text-3xl font-bold text-red-900">{formatCurrency(summary.total_dues)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-700">All vendors</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-red-200 p-3">
                                <DollarSign className="h-8 w-8 text-red-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Overdue Amount</p>
                                <p className="mt-1 text-3xl font-bold text-orange-900">{formatCurrency(summary.total_overdue)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm text-orange-700">Past due date</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-orange-200 p-3">
                                <AlertTriangle className="h-8 w-8 text-orange-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Vendors with Dues</p>
                                <p className="mt-1 text-3xl font-bold text-blue-900">{summary.vendor_count}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">Need attention</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-200 p-3">
                                <Users className="h-8 w-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Avg Due per Vendor</p>
                                <p className="mt-1 text-3xl font-bold text-purple-900">
                                    {formatCurrency(summary.vendor_count > 0 ? summary.total_dues / summary.vendor_count : 0)}
                                </p>
                                <div className="mt-2 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm text-purple-700">Per supplier</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-200 p-3">
                                <FileText className="h-8 w-8 text-purple-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aging Analysis */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Aging Analysis</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(agingAnalysis.current)}</div>
                            <div className="mt-1 text-sm font-medium text-green-700">Current</div>
                            <div className="mt-1 text-xs text-green-600">Not overdue</div>
                        </div>
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(agingAnalysis['1_30_days'])}</div>
                            <div className="mt-1 text-sm font-medium text-yellow-700">1-30 Days</div>
                            <div className="mt-1 text-xs text-yellow-600">Overdue</div>
                        </div>
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(agingAnalysis['31_60_days'])}</div>
                            <div className="mt-1 text-sm font-medium text-orange-700">31-60 Days</div>
                            <div className="mt-1 text-xs text-orange-600">Overdue</div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(agingAnalysis['61_90_days'])}</div>
                            <div className="mt-1 text-sm font-medium text-red-700">61-90 Days</div>
                            <div className="mt-1 text-xs text-red-600">Overdue</div>
                        </div>
                        <div className="rounded-lg border border-red-300 bg-red-100 p-4 text-center">
                            <div className="text-2xl font-bold text-red-700">{formatCurrency(agingAnalysis.over_90_days)}</div>
                            <div className="mt-1 text-sm font-medium text-red-800">90+ Days</div>
                            <div className="mt-1 text-xs text-red-700">Critical</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="due_amount">Sort by Due Amount</option>
                            <option value="overdue_amount">Sort by Overdue Amount</option>
                            <option value="name">Sort by Name</option>
                        </select>
                    </div>
                </div>

                {/* Vendors List */}
                <div className="space-y-4">
                    {filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            {/* Vendor Header */}
                            <div className="border-b border-gray-100 bg-gray-50 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-lg bg-blue-100 p-3">
                                            <Building2 className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                                            {vendor.company_name && <p className="text-sm text-gray-600">{vendor.company_name}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Total Due</p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(vendor.current_balance)}</p>
                                            {vendor.overdue_amount > 0 && (
                                                <p className="text-sm font-medium text-orange-600">
                                                    Overdue: {formatCurrency(vendor.overdue_amount)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => openPaymentModal(vendor)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Pay Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Info */}
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Credit Limit</p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(vendor.credit_limit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Credit Used</p>
                                        <p className="font-semibold text-gray-900">
                                            {vendor.credit_limit > 0 ? ((vendor.current_balance / vendor.credit_limit) * 100).toFixed(1) : '0'}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Available Credit</p>
                                        <p className="font-semibold text-green-600">
                                            {formatCurrency(Math.max(0, vendor.credit_limit - vendor.current_balance))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="p-6">
                                <h4 className="mb-4 text-sm font-medium text-gray-900">Outstanding Transactions</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Transaction</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Days</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {vendor.transactions.map((transaction) => {
                                                const daysOverdue = getDaysOverdue(transaction.due_date);
                                                const status = getOverdueStatus(daysOverdue);

                                                return (
                                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{transaction.transaction_no}</p>
                                                                <p className="max-w-[150px] truncate text-xs text-gray-500">
                                                                    {transaction.description}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-red-600">{formatCurrency(transaction.due_amount)}</p>
                                                                <p className="text-xs text-gray-500">of {formatCurrency(transaction.amount)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(transaction.due_date)}</td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                    transaction.payment_status === 'paid'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : transaction.payment_status === 'partial'
                                                                          ? 'bg-yellow-100 text-yellow-800'
                                                                          : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {transaction.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                                                            >
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredVendors.length === 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No outstanding dues found</h3>
                            <p className="text-gray-500">{searchTerm ? 'Try adjusting your search terms.' : 'All vendor payments are up to date!'}</p>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="w-full max-w-lg rounded-xl bg-white">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Make Payment to {selectedVendor?.name}</h2>
                                    <button
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-4 p-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Payment Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter amount"
                                        max={selectedVendor?.current_balance}
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method *</label>
                                    <select
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_banking">Mobile Banking</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Reference Number</label>
                                    <input
                                        type="text"
                                        value={data.reference_no}
                                        onChange={(e) => setData('reference_no', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Transaction reference"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Description *</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Payment description"
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                {/* Summary */}
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Due:</span>
                                            <span className="font-medium text-red-600">{formatCurrency(selectedVendor?.current_balance ?? 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Amount:</span>
                                            <span className="font-medium text-green-600">{formatCurrency(parseFloat(data.amount) || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Remaining Due:</span>
                                            <span className="font-medium text-gray-900">
                                                {formatCurrency(Math.max(0, (selectedVendor?.current_balance ?? 0) - (parseFloat(data.amount) || 0)))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status after payment:</span>
                                            <span
                                                className={`font-medium ${
                                                    (parseFloat(data.amount) || 0) >= (selectedVendor?.current_balance ?? 0)
                                                        ? 'text-green-600'
                                                        : 'text-yellow-600'
                                                }`}
                                            >
                                                {(parseFloat(data.amount) || 0) >= (selectedVendor?.current_balance ?? 0)
                                                    ? 'Fully Paid'
                                                    : 'Partially Paid'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                Make Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">All Vendors</div>
                                <div className="text-sm text-gray-600">Manage suppliers</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.payment-history'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-green-100 p-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Payment History</div>
                                <div className="text-sm text-gray-600">View payments</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.analytics'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-purple-100 p-2">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Analytics</div>
                                <div className="text-sm text-gray-600">View insights</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-corner.purchase'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-orange-100 p-2">
                                <Package className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Add Purchase</div>
                                <div className="text-sm text-gray-600">Buy inventory</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
