import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Building2,
    Plus,
    Search,
    Filter,
    Edit3,
    Eye,
    Users,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Calendar,
    MoreVertical,
    TrendingUp,
    Clock
} from 'lucide-react';

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
            year: 'numeric'
        });
    };

    const getCreditUtilization = (vendor: Vendor) => {
        if (vendor.credit_limit === 0) return 0;
        return (vendor.current_balance / vendor.credit_limit) * 100;
    };

    const getStatusBadge = (vendor: Vendor) => {
        if (!vendor.is_active) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
        }

        if (vendor.current_balance === 0) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Clear</span>;
        }

        const utilization = getCreditUtilization(vendor);
        if (utilization > 90) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Critical</span>;
        }
        if (utilization > 70) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">High</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Active</span>;
    };

    const handleSearch = () => {
        router.get(route('medicine-vendors.index'), {
            search: searchTerm,
            status: statusFilter
        });
    };

    const handleAddVendor = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.store'), {
            onSuccess: () => {
                setShowAddModal(false);
                reset();
            }
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
            }
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
                        <p className="text-gray-600 mt-1">Manage your medicine suppliers and track their payments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.due-report'))}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <DollarSign className="w-4 h-4" />
                            Due Report
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Vendor
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {statistics.total_vendors}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {formatCurrency(statistics.total_dues)}
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
                                    {formatCurrency(statistics.overdue_amount)}
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
                                <p className="text-sm font-medium text-gray-600">Vendors with Dues</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {statistics.vendors_with_dues}
                                </p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <Building2 className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search vendors by name, phone, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="with_dues">With Dues</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Apply
                        </button>
                    </div>
                </div>

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.data.map((vendor) => (
                        <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
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
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(vendor)}
                                        <div className="relative">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                                <MoreVertical className="w-4 h-4" />
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
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900">{vendor.phone}</span>
                                        </div>
                                        {vendor.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900">{vendor.email}</span>
                                            </div>
                                        )}
                                        {vendor.contact_person && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="w-4 h-4 text-gray-400" />
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
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(vendor.credit_limit)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Credit Utilization */}
                                    {vendor.credit_limit > 0 && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-500">Credit Utilization</span>
                                                <span className="text-xs font-medium text-gray-900">
                                                    {getCreditUtilization(vendor).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${getCreditUtilization(vendor) > 80 ? 'bg-red-500' :
                                                        getCreditUtilization(vendor) > 60 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(getCreditUtilization(vendor), 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Terms */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Payment Terms:</span>
                                        <span className="font-medium text-gray-900">{vendor.payment_terms_days} days</span>
                                    </div>

                                    {/* Recent Transactions */}
                                    {vendor.transactions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                                            <div className="space-y-2">
                                                {vendor.transactions.slice(0, 2).map((transaction) => (
                                                    <div key={transaction.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">
                                                            {formatDate(transaction.transaction_date)}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-red-600">
                                                                {formatCurrency(transaction.due_amount)}
                                                            </span>
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${transaction.payment_status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : transaction.payment_status === 'partial'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}>
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
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => openEditModal(vendor)}
                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit
                                    </button>
                                    {vendor.current_balance > 0 && (
                                        <button
                                            onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search filters.'
                                : 'Get started by adding your first vendor.'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Vendor
                            </button>
                        )}
                    </div>
                )}

                {/* Add Vendor Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Add New Vendor</h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            reset();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAddVendor} className="p-6 space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vendor Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Vendor name"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Company name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Person
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Contact person name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Phone number"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trade License
                                            </label>
                                            <input
                                                type="text"
                                                value={data.trade_license}
                                                onChange={(e) => setData('trade_license', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Trade license number"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Complete address"
                                        />
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Opening Balance
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.opening_balance}
                                                onChange={(e) => setData('opening_balance', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Credit Limit
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.credit_limit}
                                                onChange={(e) => setData('credit_limit', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Terms (Days)
                                            </label>
                                            <input
                                                type="number"
                                                value={data.payment_terms_days}
                                                onChange={(e) => setData('payment_terms_days', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Any additional notes about the vendor..."
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            reset();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
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
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
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
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleEditVendor} className="p-6 space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vendor Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Vendor name"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Company name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Person
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Contact person name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Phone number"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trade License
                                            </label>
                                            <input
                                                type="text"
                                                value={data.trade_license}
                                                onChange={(e) => setData('trade_license', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Trade license number"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Complete address"
                                        />
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Credit Limit
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.credit_limit}
                                                onChange={(e) => setData('credit_limit', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Terms (Days)
                                            </label>
                                            <input
                                                type="number"
                                                value={data.payment_terms_days}
                                                onChange={(e) => setData('payment_terms_days', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>

                                    {/* Current Status Display */}
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Current Balance: </span>
                                                <span className={`font-semibold ${selectedVendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Any additional notes about the vendor..."
                                    />
                                </div>

                                {/* Vendor Status Toggle */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Vendor Status</h4>
                                        <p className="text-sm text-gray-600">
                                            {selectedVendor.is_active ? 'Vendor is currently active' : 'Vendor is currently inactive'}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="hidden"
                                            name="is_active"
                                            value={selectedVendor.is_active ? '1' : '0'}
                                        />
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedVendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedVendor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
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
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
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
