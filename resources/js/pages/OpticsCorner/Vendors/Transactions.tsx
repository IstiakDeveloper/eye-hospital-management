import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ChevronLeft,
    DollarSign,
    TrendingUp,
    Clock,
    FileText,
    AlertCircle,
    X
} from 'lucide-react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
    phone: string;
    email?: string;
    address?: string;
    current_balance: number;
    balance_type: 'due' | 'advance';
    credit_limit: number;
    payment_terms_days: number;
    is_active: boolean;
}

interface Transaction {
    id: number;
    transaction_no: string;
    type: 'purchase' | 'payment' | 'return' | 'adjustment';
    amount: number;
    previous_balance: number;
    new_balance: number;
    description: string;
    transaction_date: string;
    payment_method?: {
        name: string;
    };
    created_by: {
        name: string;
    };
}

interface Purchase {
    id: number;
    purchase_no: string;
    glasses: {
        brand: string;
        model: string;
    };
    quantity: number;
    total_cost: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    purchase_date: string;
}

interface PageProps {
    vendor: Vendor;
    transactions: {
        data: Transaction[];
        links: any;
    };
    purchases: {
        data: Purchase[];
        links: any;
    };
    paymentMethods: Array<{
        id: number;
        name: string;
    }>;
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function VendorTransactions() {
    const { vendor, transactions, purchases, paymentMethods } = usePage<PageProps>().props;
    // Fallbacks to prevent .map on undefined
    const safeTransactions = transactions?.data ?? [];
    const safePurchases = purchases?.data ?? [];
    const safePaymentMethods = paymentMethods ?? [];
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method_id: 1, // Default to Cash (id 1)
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
    });

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('optics.vendors.payment', vendor.id), {
            onSuccess: () => {
                setShowPaymentModal(false);
                reset();
            },
        });
    };

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');

    const totalPurchases = safePurchases.reduce((sum, p) => sum + p.total_cost, 0);
    const totalPaid = safePurchases.reduce((sum, p) => sum + p.paid_amount, 0);

    return (
        <AdminLayout>
            <Head title={`${vendor.name} - Transactions`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={route('optics.vendors.index')}>
                            <Button variant="secondary">
                                <ChevronLeft className="w-4 h-4" />
                                <span>Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                            {vendor.company_name && (
                                <p className="text-gray-600">{vendor.company_name}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link href={route('optics.vendors.edit', vendor.id)}>
                            <Button variant="secondary">Edit Vendor</Button>
                        </Link>
                        {vendor.balance_type === 'due' && vendor.current_balance > 0 && (
                            <Button onClick={() => setShowPaymentModal(true)}>
                                <DollarSign className="w-4 h-4" />
                                <span>Make Payment</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Vendor Info Card */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Contact</p>
                            <p className="font-medium text-gray-900">{vendor.phone}</p>
                            {vendor.email && (
                                <p className="text-sm text-gray-500">{vendor.email}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="font-medium text-gray-900">
                                {vendor.address || 'Not provided'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Credit Limit</p>
                            <p className="font-medium text-gray-900">
                                {formatCurrency(vendor.credit_limit)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Payment Terms</p>
                            <p className="font-medium text-gray-900">
                                {vendor.payment_terms_days} days
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Current Balance"
                        value={formatCurrency(vendor.current_balance)}
                        icon={vendor.balance_type === 'due' ? Clock : TrendingUp}
                        color={vendor.balance_type === 'due' ? 'bg-red-500' : 'bg-blue-500'}
                    />
                    <StatCard
                        title="Total Purchases"
                        value={formatCurrency(totalPurchases)}
                        icon={FileText}
                        color="bg-purple-500"
                    />
                    <StatCard
                        title="Total Paid"
                        value={formatCurrency(totalPaid)}
                        icon={DollarSign}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Purchase Count"
                        value={safePurchases.length}
                        icon={FileText}
                        color="bg-indigo-500"
                    />
                </div>

                {/* Due Alert */}
                {vendor.balance_type === 'due' && vendor.current_balance > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-red-900">Outstanding Payment</h3>
                                    <p className="text-sm text-red-700">
                                        You have {formatCurrency(vendor.current_balance)} due to this vendor
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setShowPaymentModal(true)}>
                                Pay Now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="border-b">
                        <nav className="flex space-x-8 px-6">
                            <button className="py-4 px-1 border-b-2 border-blue-500 font-medium text-blue-600 text-sm">
                                Transactions
                            </button>
                            <button className="py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 text-sm">
                                Purchases
                            </button>
                        </nav>
                    </div>

                    {/* Transactions List */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {safeTransactions.length > 0 ? (
                                safeTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    transaction.type === 'purchase' ? 'bg-red-500' :
                                                    transaction.type === 'payment' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                                }`}></div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {transaction.transaction_no}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {transaction.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                        <span>{formatDate(transaction.transaction_date)}</span>
                                                        <span>•</span>
                                                        <span>By {transaction.created_by.name}</span>
                                                        {transaction.payment_method && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{transaction.payment_method.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className={`text-lg font-bold ${
                                                transaction.type === 'purchase' ? 'text-red-600' :
                                                transaction.type === 'payment' ? 'text-green-600' :
                                                'text-blue-600'
                                            }`}>
                                                {transaction.type === 'purchase' ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Balance: {formatCurrency(transaction.new_balance)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No transactions yet</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Transactions will appear here once you make purchases or payments
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Purchases Table */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {safePurchases.length > 0 ? (
                                    safePurchases.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {purchase.purchase_no}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {purchase.glasses.brand} {purchase.glasses.model}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {purchase.quantity} pcs
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="font-semibold text-gray-900">
                                                        {formatCurrency(purchase.total_cost)}
                                                    </div>
                                                    {purchase.due_amount > 0 && (
                                                        <div className="text-red-600">
                                                            Due: {formatCurrency(purchase.due_amount)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {purchase.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(purchase.purchase_date)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No purchases from this vendor yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    reset();
                }}
                title="Make Payment to Vendor"
            >
                <form onSubmit={handlePayment} className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-orange-700">Current Due:</span>
                            <span className="text-xl font-bold text-orange-900">
                                {formatCurrency(vendor.current_balance)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={vendor.current_balance}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.amount ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                            required
                        />
                        {errors.amount && (
                            <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.payment_method_id}
                            onChange={(e) => setData('payment_method_id', Number(e.target.value))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.payment_method_id ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
                        >
                            <option value="">Select payment method</option>
                            {safePaymentMethods.map((method) => (
                                <option key={method.id} value={method.id}>
                                    {method.name}
                                </option>
                            ))}
                        </select>
                        {errors.payment_method_id && (
                            <p className="text-red-600 text-sm mt-1">{errors.payment_method_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.payment_date}
                            onChange={(e) => setData('payment_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.description ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Payment description..."
                            required
                        />
                        {errors.description && (
                            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    {data.amount && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">Payment Amount:</span>
                                    <span className="font-semibold text-green-900">
                                        {formatCurrency(parseFloat(data.amount || '0'))}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-green-300">
                                    <span className="text-green-700">Remaining Due:</span>
                                    <span className="font-bold text-green-900">
                                        {formatCurrency(vendor.current_balance - parseFloat(data.amount || '0'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowPaymentModal(false);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <DollarSign className="w-4 h-4" />
                            <span>{processing ? 'Processing...' : 'Make Payment'}</span>
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
