import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Building2,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Calendar,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Edit3,
    Package,
    TrendingUp,
    Clock,
    FileText,
    User,
    ArrowLeft,
    Plus,
    Filter
} from 'lucide-react';

interface VendorTransaction {
    id: number;
    transaction_no: string;
    type: 'purchase' | 'payment' | 'adjustment';
    amount: number;
    due_amount: number;
    paid_amount: number;
    payment_status: 'pending' | 'partial' | 'paid';
    payment_method?: string;
    description: string;
    transaction_date: string;
    due_date?: string;
    is_overdue: boolean;
    created_by: {
        name: string;
    };
}

interface VendorPayment {
    id: number;
    payment_no: string;
    amount: number;
    payment_method: string;
    reference_no?: string;
    payment_date: string;
    description: string;
    created_by: {
        name: string;
    };
}

interface RecentPurchase {
    id: number;
    batch_number: string;
    quantity: number;
    buy_price: number;
    total_cost: number;
    purchase_date: string;
    medicine: {
        name: string;
        generic_name?: string;
    };
    added_by: {
        name: string;
    };
}

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
    contact_person?: string;
    phone: string;
    email?: string;
    address?: string;
    trade_license?: string;
    current_balance: number;
    balance_type: 'due' | 'advance';
    credit_limit: number;
    payment_terms_days: number;
    is_active: boolean;
    notes?: string;
    created_at: string;
    transactions: VendorTransaction[];
    payments: VendorPayment[];
}

interface VendorShowProps {
    vendor: Vendor;
    overdueTransactions: VendorTransaction[];
    recentPurchases: RecentPurchase[];
}

export default function VendorShow({ vendor, overdueTransactions, recentPurchases }: VendorShowProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
        adjustment_type: 'increase',
        reason: '',
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
            year: 'numeric'
        });
    };

    const getCreditUtilization = () => {
        if (vendor.credit_limit === 0) return 0;
        return (vendor.current_balance / vendor.credit_limit) * 100;
    };

    const getDaysOverdue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.make-payment'), {
            ...data,
            vendor_id: vendor.id,
            onSuccess: () => {
                setShowPaymentModal(false);
                reset();
            }
        });
    };

    const handleAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.adjust-balance'), {
            ...data,
            vendor_id: vendor.id,
            onSuccess: () => {
                setShowAdjustModal(false);
                reset();
            }
        });
    };

    const totalPurchases = vendor.transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = vendor.payments.reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = overdueTransactions.reduce((sum, t) => sum + t.due_amount, 0);

    return (
        <AdminLayout>
            <Head title={`${vendor.name} - Vendor Details`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Vendors
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
                            <p className="text-gray-600 mt-1">
                                {vendor.company_name && `${vendor.company_name} • `}
                                Vendor since {formatDate(vendor.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAdjustModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                            Adjust Balance
                        </button>
                        {vendor.current_balance > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                Make Payment
                            </button>
                        )}
                        <button
                            onClick={() => router.visit(route('medicine-vendors.update', vendor.id))}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Vendor
                        </button>
                    </div>
                </div>

                {/* Vendor Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                                <p className={`text-2xl font-bold mt-1 ${vendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(vendor.current_balance)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {vendor.balance_type === 'due' ? 'Amount due' : 'Advance paid'}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${vendor.current_balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                <DollarSign className={`w-6 h-6 ${vendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Credit Utilization</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {getCreditUtilization().toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    of {formatCurrency(vendor.credit_limit)}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getCreditUtilization() > 80 ? 'bg-red-500' :
                                            getCreditUtilization() > 60 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(getCreditUtilization(), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {formatCurrency(totalPurchases)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {vendor.transactions.filter(t => t.type === 'purchase').length} orders
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {formatCurrency(overdueAmount)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {overdueTransactions.length} transactions
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert for Overdue */}
                {overdueTransactions.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Overdue Payments</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    This vendor has {overdueTransactions.length} overdue transactions totaling {formatCurrency(overdueAmount)}.
                                    Consider making payments or adjusting terms.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendor Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Vendor Information</h2>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                                            {vendor.company_name && (
                                                <p className="text-sm text-gray-600">{vendor.company_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    {vendor.contact_person && (
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm text-gray-900">{vendor.contact_person}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <p className="text-sm text-gray-900">{vendor.phone}</p>
                                    </div>

                                    {vendor.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <p className="text-sm text-gray-900">{vendor.email}</p>
                                        </div>
                                    )}

                                    {vendor.address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-900">{vendor.address}</p>
                                        </div>
                                    )}

                                    {vendor.trade_license && (
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Trade License</p>
                                                <p className="text-sm text-gray-900">{vendor.trade_license}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Financial Terms</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Credit Limit</span>
                                        <span className="text-sm font-medium text-gray-900">{formatCurrency(vendor.credit_limit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Payment Terms</span>
                                        <span className="text-sm font-medium text-gray-900">{vendor.payment_terms_days} days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Available Credit</span>
                                        <span className="text-sm font-medium text-green-600">
                                            {formatCurrency(Math.max(0, vendor.credit_limit - vendor.current_balance))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {vendor.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notes</h3>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{vendor.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex border-b border-gray-200">
                        {[
                            { key: 'overview', label: 'Overview', icon: TrendingUp },
                            { key: 'transactions', label: 'Transactions', icon: FileText },
                            { key: 'payments', label: 'Payments', icon: CreditCard },
                            { key: 'purchases', label: 'Recent Purchases', icon: Package },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.key
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Financial Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPurchases)}</div>
                                        <div className="text-sm text-blue-700 mt-1">Total Purchases</div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</div>
                                        <div className="text-sm text-green-700 mt-1">Total Payments</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {totalPurchases > 0 ? ((totalPayments / totalPurchases) * 100).toFixed(1) : '0'}%
                                        </div>
                                        <div className="text-sm text-purple-700 mt-1">Payment Rate</div>
                                    </div>
                                </div>

                                {/* Recent Activity Summary */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                                    <div className="space-y-3">
                                        {[...vendor.transactions, ...vendor.payments]
                                            .sort((a, b) => new Date(b.created_at || b.payment_date || b.transaction_date).getTime() -
                                                new Date(a.created_at || a.payment_date || a.transaction_date).getTime())
                                            .slice(0, 5)
                                            .map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        {'type' in item ? (
                                                            item.type === 'purchase' ? (
                                                                <Package className="w-4 h-4 text-blue-600" />
                                                            ) : (
                                                                <CreditCard className="w-4 h-4 text-green-600" />
                                                            )
                                                        ) : (
                                                            <CreditCard className="w-4 h-4 text-green-600" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {'payment_no' in item ? `Payment ${item.payment_no}` :
                                                                    'type' in item ? `${item.type} ${item.transaction_no}` : 'Transaction'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate('payment_date' in item ? item.payment_date : item.transaction_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium ${'payment_no' in item || ('type' in item && item.type === 'payment')
                                                                ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {formatCurrency(item.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">All Transactions</h3>
                                    <div className="flex items-center gap-2">
                                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="">All Types</option>
                                            <option value="purchase">Purchase</option>
                                            <option value="payment">Payment</option>
                                            <option value="adjustment">Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {vendor.transactions.map((transaction) => (
                                                <tr key={transaction.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{transaction.transaction_no}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{transaction.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'purchase' ? 'bg-blue-100 text-blue-800' :
                                                                transaction.type === 'payment' ? 'bg-green-100 text-green-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {transaction.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {formatCurrency(transaction.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-red-600">
                                                        {formatCurrency(transaction.due_amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                transaction.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {transaction.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {formatDate(transaction.transaction_date)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {transaction.due_date && (
                                                            <div className="text-sm">
                                                                <p className={`${transaction.is_overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                                    {formatDate(transaction.due_date)}
                                                                </p>
                                                                {transaction.is_overdue && (
                                                                    <p className="text-xs text-red-500">
                                                                        {getDaysOverdue(transaction.due_date)} days overdue
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Payments Tab */}
                        {activeTab === 'payments' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment No</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {vendor.payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{payment.payment_no}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{payment.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {payment.payment_method.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {payment.reference_no || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {formatDate(payment.payment_date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {payment.created_by.name}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent Purchases Tab */}
                        {activeTab === 'purchases' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Purchases</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recentPurchases.map((purchase) => (
                                        <div key={purchase.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{purchase.medicine.name}</h4>
                                                    {purchase.medicine.generic_name && (
                                                        <p className="text-sm text-gray-600">{purchase.medicine.generic_name}</p>
                                                    )}
                                                </div>
                                                <span className="text-sm font-bold text-green-600">
                                                    {formatCurrency(purchase.total_cost)}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>Batch: {purchase.batch_number}</p>
                                                <p>Quantity: {purchase.quantity}</p>
                                                <p>Unit Price: {formatCurrency(purchase.buy_price)}</p>
                                                <p>Date: {formatDate(purchase.purchase_date)}</p>
                                                <p>Added by: {purchase.added_by.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-lg w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Make Payment</h2>
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter amount"
                                        max={vendor.current_balance}
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
                                    <input
                                        type="text"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Payment description"
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
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

                {/* Balance Adjustment Modal */}
                {showAdjustModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-lg w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Adjust Balance</h2>
                                    <button
                                        onClick={() => setShowAdjustModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type *</label>
                                    <select
                                        value={data.adjustment_type}
                                        onChange={(e) => setData('adjustment_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="increase">Increase Due</option>
                                        <option value="decrease">Decrease Due</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter adjustment amount"
                                    />
                                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                                    <textarea
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Reason for adjustment"
                                    />
                                    {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdjustModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Adjust Balance
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
