import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Building2, CheckCircle, Clock, CreditCard, DollarSign, FileText, Filter, Search, XCircle } from 'lucide-react';
import React, { useState } from 'react';

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
            year: 'numeric',
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
            },
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
            allocated_transactions: vendor.transactions.map((t) => t.id),
        });
        setSelectedTransactions(vendor.transactions.map((t) => t.id));
        setShowPaymentModal(true);
    };

    const handleTransactionSelect = (transactionId: number, checked: boolean) => {
        let newSelected = [...selectedTransactions];
        if (checked) {
            newSelected.push(transactionId);
        } else {
            newSelected = newSelected.filter((id) => id !== transactionId);
        }
        setSelectedTransactions(newSelected);
        setData('allocated_transactions', newSelected);

        // Calculate total amount for selected transactions
        if (selectedVendor) {
            const totalAmount = selectedVendor.transactions
                .filter((t) => newSelected.includes(t.id))
                .reduce((sum, t) => sum + parseAmount(t.due_amount), 0);
            setData('amount', totalAmount.toString());
        }
    };

    const filteredVendors = vendorsWithDues.filter(
        (vendor) =>
            vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <AdminLayout>
            <Head title="Vendor Due Payments" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Due Payments</h1>
                        <p className="mt-1 text-gray-600">Manage and track payments to your medicine vendors</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.payment-history'))}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                            <FileText className="h-4 w-4" />
                            Payment History
                        </button>
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Building2 className="h-4 w-4" />
                            Manage Vendors
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(summary.total_dues)}</p>
                            </div>
                            <div className="rounded-lg bg-red-100 p-3">
                                <DollarSign className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(summary.overdue_amount)}</p>
                            </div>
                            <div className="rounded-lg bg-orange-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(summary.near_due_amount)}</p>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Vendors with Dues</p>
                                <p className="mt-1 text-2xl font-bold text-blue-600">{summary.vendor_count || 0}</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
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
                        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50">
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Vendors List */}
                <div className="space-y-4">
                    {filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            {/* Vendor Header */}
                            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-blue-100 p-2">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                                            {vendor.company_name && <p className="text-sm text-gray-600">{vendor.company_name}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Total Due</p>
                                            <p className="text-xl font-bold text-red-600">{formatCurrency(vendor.current_balance)}</p>
                                        </div>
                                        <button
                                            onClick={() => openPaymentModal(vendor)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Pay Now
                                        </button>
                                    </div>
                                </div>

                                {/* Vendor Stats */}
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Credit Limit</p>
                                        <p className="font-semibold text-gray-900">{formatCurrency(vendor.credit_limit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Payment Terms</p>
                                        <p className="font-semibold text-gray-900">{vendor.payment_terms_days || 0} days</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Overdue</p>
                                        <p className="font-semibold text-orange-600">{formatCurrency(vendor.overdue_amount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Transactions */}
                            <div className="p-6">
                                <h4 className="mb-4 text-sm font-medium text-gray-900">Pending Transactions</h4>
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
                                                const isOverdue = daysOverdue > 0;

                                                return (
                                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{transaction.transaction_no}</div>
                                                                <div className="text-xs text-gray-500">{transaction.description}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-semibold text-red-600">
                                                                {formatCurrency(transaction.due_amount)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">of {formatCurrency(transaction.amount)}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-gray-900">{formatDate(transaction.due_date)}</div>
                                                        </td>
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
                                                            {isOverdue ? (
                                                                <span className="text-sm font-medium text-red-600">{daysOverdue} overdue</span>
                                                            ) : (
                                                                <span className="text-sm text-gray-600">{Math.abs(daysOverdue)} days</span>
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
                        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                            <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No vendors with dues found</h3>
                            <p className="text-gray-500">{searchTerm ? 'Try adjusting your search terms.' : 'All vendor payments are up to date!'}</p>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Make Payment to {selectedVendor.name}</h2>
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

                            <form onSubmit={handlePaymentSubmit} className="space-y-6 p-6">
                                {/* Payment Details */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Payment Amount *</label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                max={parseAmount(selectedVendor.current_balance)}
                                            />
                                        </div>
                                        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method *</label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Transaction reference"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Description *</label>
                                        <input
                                            type="text"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Payment description"
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>
                                </div>

                                {/* Transaction Allocation */}
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-gray-900">Allocate to Transactions</h3>
                                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                                        {selectedVendor.transactions.map((transaction) => (
                                            <label key={transaction.id} className="flex items-center gap-3 rounded p-2 hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.includes(transaction.id)}
                                                    onChange={(e) => handleTransactionSelect(transaction.id, e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-gray-900">{transaction.transaction_no}</div>
                                                    <div className="truncate text-xs text-gray-500">{transaction.description}</div>
                                                </div>
                                                <div className="text-sm font-semibold text-red-600">{formatCurrency(transaction.due_amount)}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Buttons */}
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
            </div>
        </AdminLayout>
    );
}
