import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    FileText,
    Package,
    PlusCircle,
    User,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
    phone: string;
    current_balance: number;
}

interface Purchase {
    id: number;
    purchase_number: string;
    description: string | null;
    quantity: number | null;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    purchase_date: string;
    vendor: Vendor | null;
    created_by: {
        name: string;
    };
}

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    description: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: string;
    created_at: string;
    created_by: {
        name: string;
    };
    purchases: Purchase[];
}

interface ShowProps {
    fixedAsset: FixedAsset;
    vendors: Vendor[];
    defaultVendorId: number | null;
}

const Show: React.FC<ShowProps> = ({ fixedAsset, vendors, defaultVendorId }) => {
    const [purchaseModal, setPurchaseModal] = useState(false);

    const purchaseForm = useForm({
        vendor_id: defaultVendorId ? String(defaultVendorId) : '',
        quantity: '',
        total_amount: '',
        purchase_date: new Date().toISOString().split('T')[0],
    });

    const resetPurchaseForm = () => {
        purchaseForm.reset();
        purchaseForm.clearErrors();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Active' },
            fully_paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Fully Paid' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: X, label: 'Inactive' },
        };
        const badge = badges[status as keyof typeof badges];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="h-4 w-4" />
                {badge.label}
            </span>
        );
    };

    const handlePurchaseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        purchaseForm.post(route('hospital-account.fixed-assets.purchases.store', fixedAsset.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPurchaseModal(false);
                resetPurchaseForm();
            },
        });
    };

    const paymentPercentage = fixedAsset.total_amount > 0 ? (fixedAsset.paid_amount / fixedAsset.total_amount) * 100 : 0;
    const vendorsWithDue = vendors.filter((v) => v.current_balance > 0);

    return (
        <HospitalAccountLayout title="Fixed Asset Details">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <Link
                        href={route('hospital-account.fixed-assets.index')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fixed Assets
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{fixedAsset.name}</h1>
                                    {getStatusBadge(fixedAsset.status)}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Asset Number: <span className="font-medium text-gray-900">{fixedAsset.asset_number}</span>
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    Purchases: <span className="font-medium text-gray-900">{fixedAsset.purchases.length}</span>
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetPurchaseForm();
                                        setPurchaseModal(true);
                                    }}
                                    className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Quantity
                                </button>
                                {fixedAsset.due_amount > 0 && vendorsWithDue.length > 0 && (
                                    <Link
                                        href={route('hospital-account.fixed-asset-vendors.show', vendorsWithDue[0].id)}
                                        className="inline-flex items-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Pay Vendor
                                    </Link>
                                )}
                                <Link
                                    href={route('hospital-account.fixed-assets.edit', fixedAsset.id)}
                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Progress (All Purchases)</h2>

                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-blue-50 p-4">
                                <p className="mb-1 text-sm text-blue-600">Total Amount</p>
                                <p className="text-2xl font-bold text-blue-900">৳{fixedAsset.total_amount.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-4">
                                <p className="mb-1 text-sm text-green-600">Paid Amount</p>
                                <p className="text-2xl font-bold text-green-900">৳{fixedAsset.paid_amount.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg bg-red-50 p-4">
                                <p className="mb-1 text-sm text-red-600">Due Amount</p>
                                <p className="text-2xl font-bold text-red-900">৳{fixedAsset.due_amount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment Progress</span>
                                <span className="font-semibold text-gray-900">{paymentPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-gray-200">
                                <div
                                    className="h-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                                    style={{ width: `${paymentPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Asset Details</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Package className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Asset Name</p>
                                        <p className="font-medium text-gray-900">{fixedAsset.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Created By</p>
                                        <p className="font-medium text-gray-900">{fixedAsset.created_by.name}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Description</p>
                                        <p className="font-medium text-gray-900">{fixedAsset.description || 'No description provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Created At</p>
                                        <p className="font-medium text-gray-900">{formatDateTime(fixedAsset.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Purchase History ({fixedAsset.purchases.length})</h2>

                        {fixedAsset.purchases.length === 0 ? (
                            <div className="py-8 text-center">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {fixedAsset.purchases.map((purchase) => (
                                            <tr key={purchase.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                    {purchase.purchase_number}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {formatDate(purchase.purchase_date)}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {purchase.vendor ? (
                                                        <Link
                                                            href={route('hospital-account.fixed-asset-vendors.show', purchase.vendor.id)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            {purchase.vendor.name}
                                                        </Link>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                    {purchase.quantity ?? '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
                                                    ৳{purchase.total_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-green-600">
                                                    ৳{purchase.paid_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-red-600">
                                                    ৳{purchase.due_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{purchase.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {purchaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add Quantity — {fixedAsset.name}</h3>
                            <button onClick={() => setPurchaseModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-gray-500">
                            Full amount will be deducted from hospital account on the purchase date you select.
                        </p>

                        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                            {!defaultVendorId && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Vendor <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={purchaseForm.data.vendor_id}
                                        onChange={(e) => purchaseForm.setData('vendor_id', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.id} value={String(vendor.id)}>
                                                {vendor.name}
                                            </option>
                                        ))}
                                    </select>
                                    {purchaseForm.errors.vendor_id && (
                                        <p className="mt-1 text-sm text-red-600">{purchaseForm.errors.vendor_id}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity (optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={purchaseForm.data.quantity}
                                    onChange={(e) => purchaseForm.setData('quantity', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 10"
                                />
                                {purchaseForm.errors.quantity && (
                                    <p className="mt-1 text-sm text-red-600">{purchaseForm.errors.quantity}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-3 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        value={purchaseForm.data.total_amount}
                                        onChange={(e) => purchaseForm.setData('total_amount', e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-8 focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                {purchaseForm.errors.total_amount && (
                                    <p className="mt-1 text-sm text-red-600">{purchaseForm.errors.total_amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Purchase Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={purchaseForm.data.purchase_date}
                                    onChange={(e) => purchaseForm.setData('purchase_date', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                                {purchaseForm.errors.purchase_date && (
                                    <p className="mt-1 text-sm text-red-600">{purchaseForm.errors.purchase_date}</p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={purchaseForm.processing}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {purchaseForm.processing ? 'Saving...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPurchaseModal(false)}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
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
