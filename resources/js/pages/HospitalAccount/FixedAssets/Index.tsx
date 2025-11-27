import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    PlusCircle,
    Edit,
    Trash2,
    Eye,
    DollarSign,
    Filter,
    X,
    Package,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
}

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    description: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    purchase_date: string;
    status: 'active' | 'fully_paid' | 'inactive';
    vendor: Vendor | null;
    created_by: {
        name: string;
    };
}

interface IndexProps {
    assets: {
        data: FixedAsset[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    vendors: Vendor[];
    totals: {
        total_assets: number;
        total_amount: number;
        total_paid: number;
        total_due: number;
    };
    filters: {
        status?: string;
        vendor_id?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
}

const Index: React.FC<IndexProps> = ({ assets, vendors, totals, filters }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [filterData, setFilterData] = useState({
        status: filters.status || '',
        vendor_id: filters.vendor_id || '',
        search: filters.search || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || ''
    });

    const [paymentData, setPaymentData] = useState({
        amount: '',
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

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace('BDT', '৳');
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Active' },
            fully_paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Fully Paid' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Inactive' }
        };
        const badge = badges[status as keyof typeof badges];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilterData({
            ...filterData,
            [e.target.name]: e.target.value
        });
    };

    const applyFilters = () => {
        router.get(route('hospital-account.fixed-assets.index'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setFilterData({
            status: '',
            vendor_id: '',
            search: '',
            date_from: '',
            date_to: ''
        });
        router.get(route('hospital-account.fixed-assets.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const openPaymentModal = (asset: FixedAsset) => {
        setSelectedAsset(asset);
        setPaymentData({
            amount: asset.due_amount.toString(),
            description: '',
            payment_date: new Date().toISOString().split('T')[0]
        });
        setPaymentModal(true);
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) return;

        setLoading(true);
        router.post(route('hospital-account.fixed-assets.payment', selectedAsset.id), paymentData, {
            onSuccess: () => {
                setPaymentModal(false);
                setSelectedAsset(null);
                setPaymentData({
                    amount: '',
                    description: '',
                    payment_date: new Date().toISOString().split('T')[0]
                });
            },
            onFinish: () => setLoading(false)
        });
    };

    const handleDelete = (id: number) => {
        setDeleting(id);
        router.delete(route('hospital-account.fixed-assets.destroy', id), {
            onSuccess: () => setDeleteConfirm(null),
            onFinish: () => setDeleting(null)
        });
    };

    return (
        <HospitalAccountLayout title="Fixed Assets">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Fixed Assets</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage hospital fixed assets and payments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </button>
                        <Link
                            href={route('hospital-account.fixed-assets.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Asset
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Assets</p>
                                <p className="text-2xl font-bold text-gray-900">{totals.total_assets}</p>
                            </div>
                            <Package className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">৳{totals.total_amount.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-10 h-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600">৳{totals.total_paid.toLocaleString()}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Due</p>
                                <p className="text-2xl font-bold text-red-600">৳{totals.total_due.toLocaleString()}</p>
                            </div>
                            <Clock className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filterData.search}
                                    onChange={handleFilterChange}
                                    placeholder="Asset name or number..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor
                                </label>
                                <select
                                    name="vendor_id"
                                    value={filterData.vendor_id}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Vendors</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.name} {vendor.company_name && `(${vendor.company_name})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={filterData.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="fully_paid">Fully Paid</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    name="date_from"
                                    value={filterData.date_from}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    name="date_to"
                                    value={filterData.date_to}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Assets Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Asset Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Paid
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchase Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No fixed assets</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new fixed asset.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    assets.data.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {asset.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {asset.asset_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {asset.vendor ? (
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.show', asset.vendor.id)}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        {asset.vendor.name}
                                                        {asset.vendor.company_name && (
                                                            <div className="text-xs text-gray-500">{asset.vendor.company_name}</div>
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {asset.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                ৳{asset.total_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                                                ৳{asset.paid_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                                                ৳{asset.due_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(asset.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(asset.purchase_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {asset.due_amount > 0 && asset.status === 'active' && (
                                                        <button
                                                            onClick={() => openPaymentModal(asset)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Make Payment"
                                                        >
                                                            <DollarSign className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('hospital-account.fixed-assets.show', asset.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                    <Link
                                                        href={route('hospital-account.fixed-assets.edit', asset.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    {asset.paid_amount === 0 && (
                                                        deleteConfirm === asset.id ? (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(asset.id)}
                                                                    disabled={deleting === asset.id}
                                                                    className="text-red-600 hover:text-red-900 text-xs disabled:opacity-50"
                                                                >
                                                                    {deleting === asset.id ? 'Deleting...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    disabled={deleting === asset.id}
                                                                    className="text-gray-600 hover:text-gray-900 text-xs disabled:opacity-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(asset.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {assets.last_page > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{assets.current_page}</span> of{' '}
                                    <span className="font-medium">{assets.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    {assets.current_page > 1 && (
                                        <Link
                                            href={route('hospital-account.fixed-assets.index', { ...filterData, page: assets.current_page - 1 })}
                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {assets.current_page < assets.last_page && (
                                        <Link
                                            href={route('hospital-account.fixed-assets.index', { ...filterData, page: assets.current_page + 1 })}
                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModal && selectedAsset && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                            <div className="text-sm text-gray-600">Asset: <span className="font-medium text-gray-900">{selectedAsset.name}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Due Amount: <span className="font-medium text-red-600">৳{selectedAsset.due_amount.toLocaleString()}</span></div>
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
                                    max={selectedAsset.due_amount}
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

export default Index;
