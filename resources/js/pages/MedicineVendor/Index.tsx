import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    Edit3,
    Eye,
    Filter,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Users,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

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
    current_balance: number;
    balance_type: 'due' | 'advance';
    credit_limit: number;
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
        total_dues: number;
        overdue_amount: number;
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

    const getCreditUtilization = (vendor: Vendor) => {
        if (vendor.credit_limit === 0) return 0;
        return (vendor.current_balance / vendor.credit_limit) * 100;
    };

    const getStatusBadge = (vendor: Vendor) => {
        if (!vendor.is_active) {
            return (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Inactive</span>
            );
        }

        if (vendor.current_balance === 0) {
            return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Clear</span>;
        }

        const utilization = getCreditUtilization(vendor);
        if (utilization > 90) {
            return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Critical</span>;
        }
        if (utilization > 70) {
            return (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">High</span>
            );
        }
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Active</span>;
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
            credit_limit: vendor.credit_limit.toString(),
            payment_terms_days: vendor.payment_terms_days.toString(),
            notes: vendor.notes || '',
        });
        setShowEditModal(true);
    };

    return (
        <AdminLayout>
            <Head title="Vendor Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="mt-1 text-gray-600">Manage your medicine suppliers and track their payments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.due-report'))}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                            <DollarSign className="h-4 w-4" />
                            Due Report
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Vendor
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{statistics.total_vendors}</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(statistics.total_dues)}</p>
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
                                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(statistics.overdue_amount)}</p>
                            </div>
                            <div className="rounded-lg bg-orange-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Vendors with Dues</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{statistics.vendors_with_dues}</p>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <Building2 className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search vendors by name, phone, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="with_dues">With Dues</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Filter className="h-4 w-4" />
                            Apply
                        </button>
                    </div>
                </div>

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {vendors.data.map((vendor) => (
                        <div
                            key={vendor.id}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-100 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2">
                                                <Building2 className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                                                {vendor.company_name && <p className="text-sm text-gray-600">{vendor.company_name}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(vendor)}
                                        <div className="relative">
                                            <button className="rounded p-1 text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* Contact Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-900">{vendor.phone}</span>
                                        </div>
                                        {vendor.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{vendor.email}</span>
                                            </div>
                                        )}
                                        {vendor.contact_person && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{vendor.contact_person}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Current Balance</p>
                                            <p className={`font-semibold ${vendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(vendor.current_balance)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Credit Limit</p>
                                            <p className="font-semibold text-gray-900">{formatCurrency(vendor.credit_limit)}</p>
                                        </div>
                                    </div>

                                    {/* Credit Utilization */}
                                    {vendor.credit_limit > 0 && (
                                        <div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Credit Utilization</span>
                                                <span className="text-xs font-medium text-gray-900">{getCreditUtilization(vendor).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        getCreditUtilization(vendor) > 80
                                                            ? 'bg-red-500'
                                                            : getCreditUtilization(vendor) > 60
                                                              ? 'bg-yellow-500'
                                                              : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${Math.min(getCreditUtilization(vendor), 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Terms */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Payment Terms:</span>
                                        <span className="font-medium text-gray-900">{vendor.payment_terms_days} days</span>
                                    </div>

                                    {/* Recent Transactions */}
                                    {vendor.transactions.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium text-gray-900">Recent Transactions</h4>
                                            <div className="space-y-2">
                                                {vendor.transactions.slice(0, 2).map((transaction) => (
                                                    <div key={transaction.id} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">{formatDate(transaction.transaction_date)}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-red-600">{formatCurrency(transaction.due_amount)}</span>
                                                            <span
                                                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                                                                    transaction.payment_status === 'paid'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : transaction.payment_status === 'partial'
                                                                          ? 'bg-yellow-100 text-yellow-800'
                                                                          : 'bg-red-100 text-red-800'
                                                                }`}
                                                            >
                                                                {transaction.payment_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-100 bg-gray-50 p-6">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => openEditModal(vendor)}
                                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </button>
                                    {vendor.current_balance > 0 && (
                                        <button
                                            onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Pay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {vendors.data.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                        <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900">No vendors found</h3>
                        <p className="mb-6 text-gray-500">
                            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search filters.' : 'Get started by adding your first vendor.'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add First Vendor
                            </button>
                        )}
                    </div>
                )}

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
                                            <div>
                                                <span className="text-gray-600">Credit Utilization: </span>
                                                <span className="font-semibold text-gray-900">
                                                    {getCreditUtilization(selectedVendor).toFixed(1)}%
                                                </span>
                                            </div>
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
