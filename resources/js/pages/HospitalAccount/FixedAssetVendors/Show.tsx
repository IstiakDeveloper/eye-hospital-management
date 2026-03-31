import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Building, CreditCard, DollarSign, Edit, FileText, Mail, MapPin, Package, Phone, User, X } from 'lucide-react';
import React, { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
    contact_person: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    current_balance: number;
    is_active: boolean;
    notes: string | null;
    created_at: string;
}

interface Asset {
    id: number;
    asset_number: string;
    name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    purchase_date: string;
    status: string;
}

interface Payment {
    id: number;
    payment_no: string;
    amount: number;
    payment_method: string;
    reference_no: string | null;
    payment_date: string;
    description: string | null;
    created_by: {
        name: string;
    };
}

interface ShowProps {
    vendor: Vendor;
    assets: {
        data: Asset[];
        current_page: number;
        last_page: number;
    };
    payments: {
        data: Payment[];
        current_page: number;
        last_page: number;
    };
}

const Show: React.FC<ShowProps> = ({ vendor, assets, payments }) => {
    const [paymentModal, setPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: vendor.current_balance.toString(),
        payment_method: 'cash',
        reference_no: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return `৳${amount.toLocaleString()}`;
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('hospital-account.fixed-asset-vendors.payment', vendor.id), paymentData, {
            onSuccess: () => {
                setPaymentModal(false);
                setPaymentData({
                    amount: '',
                    payment_method: 'cash',
                    reference_no: '',
                    description: '',
                    payment_date: new Date().toISOString().split('T')[0],
                });
            },
            onFinish: () => setLoading(false),
        });
    };

    const totalPurchased = assets.data.reduce((sum, asset) => sum + asset.total_amount, 0);
    const totalPaid = payments.data.reduce((sum, payment) => sum + payment.amount, 0);

    return (
        <HospitalAccountLayout title={`Vendor: ${vendor.name}`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.visit(route('hospital-account.fixed-asset-vendors.index'))}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Vendors
                    </button>
                    <div className="flex gap-2">
                        {vendor.current_balance > 0 && vendor.is_active && (
                            <button
                                onClick={() => setPaymentModal(true)}
                                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                            >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Make Payment
                            </button>
                        )}
                        <Link
                            href={route('hospital-account.fixed-asset-vendors.edit', vendor.id)}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Vendor
                        </Link>
                    </div>
                </div>

                {/* Vendor Information Card */}
                <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
                                {vendor.company_name && <p className="mt-1 text-blue-100">{vendor.company_name}</p>}
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${
                                    vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {vendor.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="mb-3 text-lg font-semibold text-gray-900">Contact Information</h3>

                                {vendor.contact_person && (
                                    <div className="flex items-start gap-3">
                                        <User className="mt-0.5 h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Contact Person</p>
                                            <p className="text-sm font-medium text-gray-900">{vendor.contact_person}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{vendor.phone}</p>
                                    </div>
                                </div>

                                {vendor.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{vendor.email}</p>
                                        </div>
                                    </div>
                                )}

                                {vendor.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="text-sm font-medium text-gray-900">{vendor.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="space-y-4">
                                <h3 className="mb-3 text-lg font-semibold text-gray-900">Financial Summary</h3>

                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        <p className="text-sm text-blue-700">Total Assets</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">{assets.data.length}</p>
                                </div>

                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Building className="h-5 w-5 text-purple-600" />
                                        <p className="text-sm text-purple-700">Total Purchased</p>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">{formatAmount(totalPurchased)}</p>
                                </div>

                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-green-600" />
                                        <p className="text-sm text-green-700">Total Paid</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">{formatAmount(totalPaid)}</p>
                                </div>

                                <div
                                    className={`rounded-lg border p-4 ${
                                        vendor.current_balance > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="mb-2 flex items-center gap-2">
                                        <DollarSign className={`h-5 w-5 ${vendor.current_balance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                                        <p className={`text-sm ${vendor.current_balance > 0 ? 'text-red-700' : 'text-gray-700'}`}>Current Due</p>
                                    </div>
                                    <p className={`text-2xl font-bold ${vendor.current_balance > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                                        {formatAmount(vendor.current_balance)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {vendor.notes && (
                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="mb-1 text-sm text-gray-600">Notes</p>
                                        <p className="text-sm text-gray-900">{vendor.notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assets Table */}
                <div className="rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Purchased Assets</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {assets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No assets purchased from this vendor yet.
                                        </td>
                                    </tr>
                                ) : (
                                    assets.data.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                                    <div className="text-sm text-gray-500">{asset.asset_number}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{formatAmount(asset.total_amount)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                                {formatAmount(asset.paid_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                                                {formatAmount(asset.due_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(asset.purchase_date)}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        asset.status === 'fully_paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : asset.status === 'active'
                                                              ? 'bg-blue-100 text-blue-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {asset.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment No</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {payments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No payments made to this vendor yet.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{payment.payment_no}</div>
                                                {payment.description && <div className="text-sm text-gray-500">{payment.description}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                                {formatAmount(payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{payment.reference_no || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(payment.payment_date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{payment.created_by.name}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Make Payment</h3>
                            <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 rounded-lg bg-gray-50 p-4">
                            <div className="text-sm text-gray-600">
                                Current Due: <span className="font-medium text-red-600">{formatAmount(vendor.current_balance)}</span>
                            </div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Payment Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    max={vendor.current_balance}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Payment Method <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            {paymentData.payment_method !== 'cash' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Reference No</label>
                                    <input
                                        type="text"
                                        value={paymentData.reference_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference_no: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Cheque no, transaction no..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Payment Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={paymentData.description}
                                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Payment note..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Make Payment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(false)}
                                    disabled={loading}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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
