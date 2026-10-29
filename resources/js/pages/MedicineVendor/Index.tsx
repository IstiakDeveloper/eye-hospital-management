import AdminLayout from '@/layouts/admin-layout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle, Edit3, Eye, Filter, Plus, Search, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import VendorTabs from './VendorTabs';

interface VendorTransaction {
    id: number;
    amount: number;
    due_amount: number;
    transaction_date: string;
    payment_status: 'pending' | 'partial' | 'paid';
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
    current_balance: number | string;
    balance_type: 'due' | 'advance';
    credit_limit: number | string;
    payment_terms_days: number;
    is_active: boolean;
    notes?: string;
    transactions: VendorTransaction[];
    created_at: string;
}

interface VendorIndexProps {
    vendors: {
        data: Vendor[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
    statistics: {
        total_vendors: number;
        total_dues: number | string;
        overdue_amount: number | string;
        vendors_with_dues: number;
    };
}

export default function VendorIndex({ vendors, filters, statistics }: VendorIndexProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        trade_license: '',
        opening_balance: '',
        credit_limit: '',
        payment_terms_days: '30',
        notes: '',
    });

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const formatCurrency = (amount: number | string | null | undefined) => formatTaka(amount);

    const getCreditUtilization = (vendor: Vendor) => {
        const limit = moneyAmount(vendor.credit_limit);
        if (limit <= 0) {
            return 0;
        }

        return (moneyAmount(vendor.current_balance) / limit) * 100;
    };

    const getStatusBadge = (vendor: Vendor) => {
        if (!vendor.is_active) {
            return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">Inactive</span>;
        }

        if (moneyAmount(vendor.current_balance) <= 0) {
            return <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Clear</span>;
        }

        return <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">Due</span>;
    };

    const handleSearch = () => {
        router.get(route('medicine-vendors.index'), {
            search: searchTerm,
            status: statusFilter,
        });
    };

    const handleAddVendor = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.store'), {
            onSuccess: () => {
                setShowAddModal(false);
                reset();
            },
        });
    };

    const handleEditVendor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor) return;

        put(route('medicine-vendors.update', selectedVendor.id), {
            onSuccess: () => {
                setShowEditModal(false);
                setSelectedVendor(null);
                reset();
            },
        });
    };

    const openEditModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setData({
            name: vendor.name,
            company_name: vendor.company_name || '',
            contact_person: vendor.contact_person || '',
            phone: vendor.phone,
            email: vendor.email || '',
            address: vendor.address || '',
            trade_license: vendor.trade_license || '',
            opening_balance: '',
            credit_limit: moneyAmount(vendor.credit_limit).toString(),
            payment_terms_days: vendor.payment_terms_days.toString(),
            notes: vendor.notes || '',
        });
        setShowEditModal(true);
    };

    return (
        <AdminLayout>
            <Head title="Vendor Management" />

            <div className="mx-auto max-w-6xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Vendors</h1>
                        <p className="text-[12px] text-slate-500">Suppliers, dues, and payments in one place</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex h-7 items-center gap-1.5 rounded bg-slate-800 px-2.5 text-[12px] font-medium text-white hover:bg-slate-700"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Vendor
                    </button>
                </div>

                <VendorTabs current="vendors" />

                <div className="grid grid-cols-2 overflow-hidden rounded border border-slate-200 bg-white md:grid-cols-4">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Vendors</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{statistics.total_vendors}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Outstanding</p>
                        <p className="text-[13px] font-semibold text-red-700 tabular-nums">{formatCurrency(statistics.total_dues)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Overdue</p>
                        <p className="text-[13px] font-semibold text-orange-700 tabular-nums">{formatCurrency(statistics.overdue_amount)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">With dues</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{statistics.vendors_with_dues}</p>
                    </div>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSearch();
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-7 w-full rounded border border-slate-300 pr-2 pl-7 text-[12px]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="with_dues">With dues</option>
                    </select>
                    <button type="submit" className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 hover:bg-slate-50">
                        <Filter className="h-3.5 w-3.5" />
                        Show
                    </button>
                </form>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">Vendor</th>
                                <th className="px-3 py-1.5 font-medium">Phone</th>
                                <th className="px-3 py-1.5 text-right font-medium">Due</th>
                                <th className="px-3 py-1.5 font-medium">Status</th>
                                <th className="px-3 py-1.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-slate-500">
                                        No vendors found.
                                    </td>
                                </tr>
                            )}
                            {vendors.data.map((vendor) => (
                                <tr key={vendor.id} className="border-t border-slate-100 text-slate-800">
                                    <td className="px-3 py-1.5">
                                        <p className="font-medium text-slate-900">{vendor.name}</p>
                                        {vendor.company_name && <p className="text-[11px] text-slate-500">{vendor.company_name}</p>}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap">{vendor.phone}</td>
                                    <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${moneyAmount(vendor.current_balance) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {formatCurrency(vendor.current_balance)}
                                    </td>
                                    <td className="px-3 py-1.5">{getStatusBadge(vendor)}</td>
                                    <td className="px-3 py-1.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                                className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => openEditModal(vendor)}
                                                className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            {moneyAmount(vendor.current_balance) > 0 && (
                                                <button
                                                    onClick={() => router.visit(route('medicine-vendors.due-report'))}
                                                    className="inline-flex h-6 items-center rounded bg-slate-800 px-1.5 text-[11px] text-white hover:bg-slate-700"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Vendor Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Add New Vendor</h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            reset();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAddVendor} className="space-y-6 p-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Basic Information</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Vendor Name *</label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Vendor name"
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Company Name</label>
                                            <input
                                                type="text"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Company name"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Contact Person</label>
                                            <input
                                                type="text"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Contact person name"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number *</label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Phone number"
                                            />
                                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Trade License</label>
                                            <input
                                                type="text"
                                                value={data.trade_license}
                                                onChange={(e) => setData('trade_license', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Trade license number"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Complete address"
                                        />
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div>
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Financial Information</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Opening Balance</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.opening_balance}
                                                onChange={(e) => setData('opening_balance', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Credit Limit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.credit_limit}
                                                onChange={(e) => setData('credit_limit', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Terms (Days)</label>
                                            <input
                                                type="number"
                                                value={data.payment_terms_days}
                                                onChange={(e) => setData('payment_terms_days', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any additional notes about the vendor..."
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            reset();
                                        }}
                                        className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                Add Vendor
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Vendor Modal */}
                {showEditModal && selectedVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Edit Vendor: {selectedVendor.name}</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleEditVendor} className="space-y-6 p-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Basic Information</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Vendor Name *</label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Vendor name"
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Company Name</label>
                                            <input
                                                type="text"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Company name"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Contact Person</label>
                                            <input
                                                type="text"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Contact person name"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Phone Number *</label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Phone number"
                                            />
                                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Trade License</label>
                                            <input
                                                type="text"
                                                value={data.trade_license}
                                                onChange={(e) => setData('trade_license', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="Trade license number"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Complete address"
                                        />
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div>
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Financial Information</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Credit Limit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.credit_limit}
                                                onChange={(e) => setData('credit_limit', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Terms (Days)</label>
                                            <input
                                                type="number"
                                                value={data.payment_terms_days}
                                                onChange={(e) => setData('payment_terms_days', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>

                                    {/* Current Status Display */}
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                                        <h4 className="mb-2 text-sm font-medium text-gray-900">Current Status</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Current Balance: </span>
                                                <span
                                                    className={`font-semibold ${selectedVendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                                                >
                                                    {formatCurrency(selectedVendor.current_balance)}
                                                </span>
                                            </div>
                                            {moneyAmount(selectedVendor.credit_limit) > 0 && (
                                                <div>
                                                    <span className="text-gray-600">Credit used: </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {getCreditUtilization(selectedVendor).toFixed(1)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any additional notes about the vendor..."
                                    />
                                </div>

                                {/* Vendor Status Toggle */}
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Vendor Status</h4>
                                        <p className="text-sm text-gray-600">
                                            {selectedVendor.is_active ? 'Vendor is currently active' : 'Vendor is currently inactive'}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="hidden" name="is_active" value={selectedVendor.is_active ? '1' : '0'} />
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                                selectedVendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {selectedVendor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
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
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                Update Vendor
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
