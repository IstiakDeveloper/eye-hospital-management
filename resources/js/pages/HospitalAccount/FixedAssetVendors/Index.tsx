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
    Users,
    CheckCircle,
    AlertCircle,
    Package
} from 'lucide-react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
    phone: string;
    email: string | null;
    current_balance: number;
    is_active: boolean;
    assets_count: number;
    assets_sum_total_amount: number;
    payments_sum_amount: number;
}

interface IndexProps {
    vendors: {
        data: Vendor[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    totals: {
        total_vendors: number;
        total_due: number;
        total_purchased: number;
        total_paid: number;
    };
    filters: {
        search?: string;
        with_due?: boolean;
        is_active?: boolean;
    };
}

const Index: React.FC<IndexProps> = ({ vendors, totals, filters }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [filterData, setFilterData] = useState({
        search: filters.search || '',
        with_due: filters.with_due || false,
        is_active: filters.is_active !== undefined ? filters.is_active : true
    });

    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace('BDT', '৳');
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFilterData({
            ...filterData,
            [e.target.name]: value
        });
    };

    const applyFilters = () => {
        router.get(route('hospital-account.fixed-asset-vendors.index'), filterData, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setFilterData({
            search: '',
            with_due: false,
            is_active: true
        });
        router.get(route('hospital-account.fixed-asset-vendors.index'), {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const openPaymentModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setPaymentData({
            amount: vendor.current_balance.toString(),
            payment_method: 'cash',
            reference_no: '',
            description: '',
            payment_date: new Date().toISOString().split('T')[0]
        });
        setPaymentModal(true);
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor) return;

        setLoading(true);
        router.post(route('hospital-account.fixed-asset-vendors.payment', selectedVendor.id), paymentData, {
            onSuccess: () => {
                setPaymentModal(false);
                setSelectedVendor(null);
                setPaymentData({
                    amount: '',
                    payment_method: 'cash',
                    reference_no: '',
                    description: '',
                    payment_date: new Date().toISOString().split('T')[0]
                });
            },
            onFinish: () => setLoading(false)
        });
    };

    const handleDelete = (id: number) => {
        setDeleting(id);
        router.delete(route('hospital-account.fixed-asset-vendors.destroy', id), {
            onSuccess: () => setDeleteConfirm(null),
            onFinish: () => setDeleting(null)
        });
    };

    return (
        <HospitalAccountLayout title="Fixed Asset Vendors">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Fixed Asset Vendors</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage vendors and track payments
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
                            href={route('hospital-account.fixed-asset-vendors.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Vendor
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Vendors</p>
                                <p className="text-2xl font-bold text-gray-900">{totals.total_vendors}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Purchased</p>
                                <p className="text-2xl font-bold text-gray-900">৳{totals.total_purchased.toLocaleString()}</p>
                            </div>
                            <Package className="w-10 h-10 text-purple-500" />
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
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filterData.search}
                                    onChange={handleFilterChange}
                                    placeholder="Name, company, phone..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="with_due"
                                        checked={filterData.with_due}
                                        onChange={handleFilterChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">With Due Only</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={filterData.is_active}
                                        onChange={handleFilterChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Active Only</span>
                                </label>
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

                {/* Vendors Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assets
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Purchased
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Paid
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Current Due
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendors.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by adding a new vendor.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    vendors.data.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {vendor.name}
                                                    </div>
                                                    {vendor.company_name && (
                                                        <div className="text-sm text-gray-500">
                                                            {vendor.company_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{vendor.phone}</div>
                                                {vendor.email && (
                                                    <div className="text-sm text-gray-500">{vendor.email}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {vendor.assets_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                ৳{(vendor.assets_sum_total_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                                                ৳{(vendor.payments_sum_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`font-medium ${vendor.current_balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    ৳{vendor.current_balance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    vendor.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {vendor.current_balance > 0 && vendor.is_active && (
                                                        <button
                                                            onClick={() => openPaymentModal(vendor)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Make Payment"
                                                        >
                                                            <DollarSign className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.show', vendor.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.edit', vendor.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    {vendor.assets_count === 0 && (vendor.payments_sum_amount || 0) === 0 && (
                                                        deleteConfirm === vendor.id ? (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(vendor.id)}
                                                                    disabled={deleting === vendor.id}
                                                                    className="text-red-600 hover:text-red-900 text-xs disabled:opacity-50"
                                                                >
                                                                    {deleting === vendor.id ? 'Deleting...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    disabled={deleting === vendor.id}
                                                                    className="text-gray-600 hover:text-gray-900 text-xs disabled:opacity-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(vendor.id)}
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
                    {vendors.last_page > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{vendors.current_page}</span> of{' '}
                                    <span className="font-medium">{vendors.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    {vendors.current_page > 1 && (
                                        <Link
                                            href={route('hospital-account.fixed-asset-vendors.index', { ...filterData, page: vendors.current_page - 1 })}
                                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {vendors.current_page < vendors.last_page && (
                                        <Link
                                            href={route('hospital-account.fixed-asset-vendors.index', { ...filterData, page: vendors.current_page + 1 })}
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
            {paymentModal && selectedVendor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Make Payment to Vendor</h3>
                            <button
                                onClick={() => setPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Vendor: <span className="font-medium text-gray-900">{selectedVendor.name}</span></div>
                            <div className="text-sm text-gray-600 mt-1">Current Due: <span className="font-medium text-red-600">৳{selectedVendor.current_balance.toLocaleString()}</span></div>
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
                                    max={selectedVendor.current_balance}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={paymentData.payment_method}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            {paymentData.payment_method !== 'cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reference No
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentData.reference_no}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference_no: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Cheque no, transaction no..."
                                    />
                                </div>
                            )}

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
