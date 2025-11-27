import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    AlertTriangle,
    Building2,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Filter,
    Search,
    TrendingUp,
    Users,
    FileText,
    Eye,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowRight,
    Package
} from 'lucide-react';

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
    'over_90_days': number;
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

export default function DueReport({
    vendorsWithDues,
    filters,
    summary,
    agingAnalysis
}: DueReportProps) {
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
        .filter(vendor =>
            vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'due_amount': return b.current_balance - a.current_balance;
                case 'overdue_amount': return b.overdue_amount - a.overdue_amount;
                default: return 0;
            }
        });

    const handleDateRangeChange = async () => {
        setIsLoading(true);
        router.get(route('medicine-vendors.due-report'), dateRange, {
            onFinish: () => setIsLoading(false)
        });
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.make-payment'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedVendor(null);
                reset();
            }
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
            date_to: dateRange.to
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
                        <p className="text-gray-600 mt-1">Track and analyze outstanding vendor payments with aging analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                onChange={(e) => exportReport(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="" disabled>Export Report</option>
                                <option value="pdf">PDF Report</option>
                                <option value="excel">Excel Spreadsheet</option>
                                <option value="csv">CSV Data</option>
                            </select>
                            <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                            onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <CreditCard className="w-4 h-4" />
                            Make Payments
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Report Period:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleDateRangeChange}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Filter className="w-4 h-4" />
                                )}
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Total Outstanding</p>
                                <p className="text-3xl font-bold text-red-900 mt-1">
                                    {formatCurrency(summary.total_dues)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-red-700">All vendors</span>
                                </div>
                            </div>
                            <div className="bg-red-200 p-3 rounded-lg">
                                <DollarSign className="w-8 h-8 text-red-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Overdue Amount</p>
                                <p className="text-3xl font-bold text-orange-900 mt-1">
                                    {formatCurrency(summary.total_overdue)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-orange-700">Past due date</span>
                                </div>
                            </div>
                            <div className="bg-orange-200 p-3 rounded-lg">
                                <AlertTriangle className="w-8 h-8 text-orange-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Vendors with Dues</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">
                                    {summary.vendor_count}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">Need attention</span>
                                </div>
                            </div>
                            <div className="bg-blue-200 p-3 rounded-lg">
                                <Users className="w-8 h-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Avg Due per Vendor</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">
                                    {formatCurrency(summary.vendor_count > 0 ? summary.total_dues / summary.vendor_count : 0)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-purple-700">Per supplier</span>
                                </div>
                            </div>
                            <div className="bg-purple-200 p-3 rounded-lg">
                                <FileText className="w-8 h-8 text-purple-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aging Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Aging Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(agingAnalysis.current)}</div>
                            <div className="text-sm font-medium text-green-700 mt-1">Current</div>
                            <div className="text-xs text-green-600 mt-1">Not overdue</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(agingAnalysis['1_30_days'])}</div>
                            <div className="text-sm font-medium text-yellow-700 mt-1">1-30 Days</div>
                            <div className="text-xs text-yellow-600 mt-1">Overdue</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(agingAnalysis['31_60_days'])}</div>
                            <div className="text-sm font-medium text-orange-700 mt-1">31-60 Days</div>
                            <div className="text-xs text-orange-600 mt-1">Overdue</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(agingAnalysis['61_90_days'])}</div>
                            <div className="text-sm font-medium text-red-700 mt-1">61-90 Days</div>
                            <div className="text-xs text-red-600 mt-1">Overdue</div>
                        </div>
                        <div className="bg-red-100 rounded-lg p-4 text-center border border-red-300">
                            <div className="text-2xl font-bold text-red-700">{formatCurrency(agingAnalysis.over_90_days)}</div>
                            <div className="text-sm font-medium text-red-800 mt-1">90+ Days</div>
                            <div className="text-xs text-red-700 mt-1">Critical</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Vendor Header */}
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-lg">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                                            {vendor.company_name && (
                                                <p className="text-sm text-gray-600">{vendor.company_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Total Due</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {formatCurrency(vendor.current_balance)}
                                            </p>
                                            {vendor.overdue_amount > 0 && (
                                                <p className="text-sm text-orange-600 font-medium">
                                                    Overdue: {formatCurrency(vendor.overdue_amount)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => openPaymentModal(vendor)}
                                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Pay Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Info */}
                                <div className="grid grid-cols-3 gap-4 mt-4">
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
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Outstanding Transactions</h4>
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
                                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{transaction.description}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm">
                                                                <p className="font-semibold text-red-600">{formatCurrency(transaction.due_amount)}</p>
                                                                <p className="text-xs text-gray-500">of {formatCurrency(transaction.amount)}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {formatDate(transaction.due_date)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                transaction.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {transaction.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No outstanding dues found</h3>
                            <p className="text-gray-500">
                                {searchTerm ? 'Try adjusting your search terms.' : 'All vendor payments are up to date!'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedVendor && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-lg w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Make Payment to {selectedVendor?.name}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter amount"
                                        max={selectedVendor?.current_balance}
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                                    <select
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_banking">Mobile Banking</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                                    <input
                                        type="text"
                                        value={data.reference_no}
                                        onChange={(e) => setData('reference_no', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Transaction reference"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Payment description"
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 rounded-lg p-4">
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
                                            <span className={`font-medium ${
                                                (parseFloat(data.amount) || 0) >= (selectedVendor?.current_balance ?? 0)
                                                    ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                                {(parseFloat(data.amount) || 0) >= (selectedVendor?.current_balance ?? 0) ? 'Fully Paid' : 'Partially Paid'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">All Vendors</div>
                                <div className="text-sm text-gray-600">Manage suppliers</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.payment-history'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-green-100 p-2 rounded-lg">
                                <CreditCard className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Payment History</div>
                                <div className="text-sm text-gray-600">View payments</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.analytics'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Analytics</div>
                                <div className="text-sm text-gray-600">View insights</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-corner.purchase'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Package className="w-5 h-5 text-orange-600" />
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
