import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Building2,
    CreditCard,
    AlertTriangle,
    DollarSign,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Plus,
    Eye,
    FileText
} from 'lucide-react';

interface VendorTransaction {
    id: number;
    transaction_no: string;
    amount: number | string;
    due_amount: number | string;
    transaction_date: string;
    due_date: string;
    description: string;
    payment_status: 'pending' | 'partial' | 'paid';
    is_overdue: boolean;
}

interface VendorWithDues {
    id: number;
    name: string;
    company_name?: string;
    current_balance: number | string;
    credit_limit: number | string;
    payment_terms_days: number;
    overdue_amount: number | string;
    transactions: VendorTransaction[];
}

interface VendorDuesProps {
    vendorsWithDues: VendorWithDues[];
    summary: {
        total_dues: number | string;
        overdue_amount: number | string;
        near_due_amount: number | string;
        vendor_count: number;
    };
}

export default function VendorDues({ vendorsWithDues, summary }: VendorDuesProps) {
    const [selectedVendor, setSelectedVendor] = useState<VendorWithDues | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        vendor_id: '',
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
        allocated_transactions: [] as number[],
    });

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount) || numAmount === null || numAmount === undefined) return '৳0';

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

    const getDaysOverdue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const parseAmount = (amount: number | string): number => {
        const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(parsed) ? 0 : parsed;
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-corner.vendor-payment'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedVendor(null);
                reset();
                setSelectedTransactions([]);
            }
        });
    };

    const openPaymentModal = (vendor: VendorWithDues) => {
        setSelectedVendor(vendor);
        const vendorBalance = parseAmount(vendor.current_balance);
        setData({
            vendor_id: vendor.id.toString(),
            amount: vendorBalance.toString(),
            payment_method: 'cash',
            reference_no: '',
            description: `Payment to ${vendor.name}`,
            allocated_transactions: vendor.transactions.map(t => t.id),
        });
        setSelectedTransactions(vendor.transactions.map(t => t.id));
        setShowPaymentModal(true);
    };

    const handleTransactionSelect = (transactionId: number, checked: boolean) => {
        let newSelected = [...selectedTransactions];
        if (checked) {
            newSelected.push(transactionId);
        } else {
            newSelected = newSelected.filter(id => id !== transactionId);
        }
        setSelectedTransactions(newSelected);
        setData('allocated_transactions', newSelected);

        // Calculate total amount for selected transactions
        if (selectedVendor) {
            const totalAmount = selectedVendor.transactions
                .filter(t => newSelected.includes(t.id))
                .reduce((sum, t) => sum + parseAmount(t.due_amount), 0);
            setData('amount', totalAmount.toString());
        }
    };

    const filteredVendors = vendorsWithDues.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <Head title="Vendor Due Payments" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Due Payments</h1>
                        <p className="text-gray-600 mt-1">Manage and track payments to your medicine vendors</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.payment-history'))}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Payment History
                        </button>
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Building2 className="w-4 h-4" />
                            Manage Vendors
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {formatCurrency(summary.total_dues)}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {formatCurrency(summary.overdue_amount)}
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {formatCurrency(summary.near_due_amount)}
                                </p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Vendors with Dues</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {summary.vendor_count || 0}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
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
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Vendors List */}
                <div className="space-y-4">
                    {filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Vendor Header */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <Building2 className="w-5 h-5 text-blue-600" />
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
                                            <p className="text-xl font-bold text-red-600">
                                                {formatCurrency(vendor.current_balance)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => openPaymentModal(vendor)}
                                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Pay Now
                                        </button>
                                    </div>
                                </div>

                                {/* Vendor Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Credit Limit</p>
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(vendor.credit_limit)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Payment Terms</p>
                                        <p className="font-semibold text-gray-900">
                                            {vendor.payment_terms_days || 0} days
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Overdue</p>
                                        <p className="font-semibold text-orange-600">
                                            {formatCurrency(vendor.overdue_amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Transactions */}
                            <div className="p-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-4">Pending Transactions</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Transaction
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Due Date
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Status
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                                    Days
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {vendor.transactions.map((transaction) => {
                                                const daysOverdue = getDaysOverdue(transaction.due_date);
                                                const isOverdue = daysOverdue > 0;

                                                return (
                                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {transaction.transaction_no}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {transaction.description}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-semibold text-red-600">
                                                                {formatCurrency(transaction.due_amount)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                of {formatCurrency(transaction.amount)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-gray-900">
                                                                {formatDate(transaction.due_date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.payment_status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : transaction.payment_status === 'partial'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {transaction.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isOverdue ? (
                                                                <span className="text-sm font-medium text-red-600">
                                                                    {daysOverdue} overdue
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-gray-600">
                                                                    {Math.abs(daysOverdue)} days
                                                                </span>
                                                            )}
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
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors with dues found</h3>
                            <p className="text-gray-500">
                                {searchTerm ? 'Try adjusting your search terms.' : 'All vendor payments are up to date!'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedVendor && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Make Payment to {selectedVendor.name}
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

                            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                                {/* Payment Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Amount *
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                                max={parseAmount(selectedVendor.current_balance)}
                                            />
                                        </div>
                                        {errors.amount && (
                                            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method *
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="mobile_banking">Mobile Banking</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reference Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.reference_no}
                                            onChange={(e) => setData('reference_no', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Transaction reference"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Payment description"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction Allocation */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Allocate to Transactions</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                        {selectedVendor.transactions.map((transaction) => (
                                            <label key={transaction.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.includes(transaction.id)}
                                                    onChange={(e) => handleTransactionSelect(transaction.id, e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {transaction.transaction_no}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {transaction.description}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-semibold text-red-600">
                                                    {formatCurrency(transaction.due_amount)}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Buttons */}
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
            </div>
        </AdminLayout>
    );
}
