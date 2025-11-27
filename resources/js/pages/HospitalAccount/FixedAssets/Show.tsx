import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    ArrowLeft,
    Edit,
    DollarSign,
    Calendar,
    Package,
    FileText,
    User,
    CheckCircle,
    Clock,
    X
} from 'lucide-react';

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    description: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    purchase_date: string;
    status: string;
    created_at: string;
    created_by: {
        name: string;
    };
    payments: Array<{
        id: number;
        payment_no: string;
        amount: number;
        description: string;
        payment_date: string;
        created_at: string;
        created_by: {
            name: string;
        };
    }>;
}

interface ShowProps {
    fixedAsset: FixedAsset;
}

const Show: React.FC<ShowProps> = ({ fixedAsset }) => {
    const [paymentModal, setPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: fixedAsset.due_amount.toString(),
        description: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Active' },
            fully_paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Fully Paid' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X, label: 'Inactive' }
        };
        const badge = badges[status as keyof typeof badges];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        router.post(route('hospital-account.fixed-assets.payment', fixedAsset.id), paymentData, {
            onSuccess: () => {
                setPaymentModal(false);
                setPaymentData({
                    amount: '',
                    description: '',
                    payment_date: new Date().toISOString().split('T')[0]
                });
            },
            onFinish: () => setLoading(false)
        });
    };

    const paymentPercentage = (fixedAsset.paid_amount / fixedAsset.total_amount) * 100;

    return (
        <HospitalAccountLayout title="Fixed Asset Details">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <Link
                        href={route('hospital-account.fixed-assets.index')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Fixed Assets
                    </Link>
                </div>

                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{fixedAsset.name}</h1>
                                    {getStatusBadge(fixedAsset.status)}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Asset Number: <span className="font-medium text-gray-900">{fixedAsset.asset_number}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {fixedAsset.due_amount > 0 && fixedAsset.status === 'active' && (
                                    <button
                                        onClick={() => setPaymentModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Make Payment
                                    </button>
                                )}
                                <Link
                                    href={route('hospital-account.fixed-assets.edit', fixedAsset.id)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Payment Progress Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-600 mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    ৳{fixedAsset.total_amount.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600 mb-1">Paid Amount</p>
                                <p className="text-2xl font-bold text-green-900">
                                    ৳{fixedAsset.paid_amount.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4">
                                <p className="text-sm text-red-600 mb-1">Due Amount</p>
                                <p className="text-2xl font-bold text-red-900">
                                    ৳{fixedAsset.due_amount.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Progress</span>
                                <span className="font-semibold text-gray-900">{paymentPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all"
                                    style={{ width: `${paymentPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Asset Details Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Asset Name</p>
                                        <p className="font-medium text-gray-900">{fixedAsset.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Purchase Date</p>
                                        <p className="font-medium text-gray-900">{formatDate(fixedAsset.purchase_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Created By</p>
                                        <p className="font-medium text-gray-900">{fixedAsset.created_by.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Description</p>
                                        <p className="font-medium text-gray-900">
                                            {fixedAsset.description || 'No description provided'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Created At</p>
                                        <p className="font-medium text-gray-900">{formatDateTime(fixedAsset.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Payment History ({fixedAsset.payments.length})
                        </h2>

                        {fixedAsset.payments.length === 0 ? (
                            <div className="text-center py-8">
                                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Payment history will appear here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Payment No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Created By
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {fixedAsset.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {payment.payment_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(payment.payment_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                    ৳{payment.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {payment.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.created_by.name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Make Payment</h3>
                            <button
                                onClick={() => setPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Asset: <span className="font-medium text-gray-900">{fixedAsset.name}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Due Amount: <span className="font-medium text-red-600">৳{fixedAsset.due_amount.toLocaleString()}</span></div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    max={fixedAsset.due_amount}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={paymentData.description}
                                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Payment note..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : 'Make Payment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(false)}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </HospitalAccountLayout>
    );
};

export default Show;
