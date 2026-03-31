import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, DollarSign, Edit, Eye, Filter, Package, PlusCircle, Trash2, Users, X } from 'lucide-react';
import React, { useState } from 'react';

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
        is_active: filters.is_active !== undefined ? filters.is_active : true,
    });

    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
    });

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).replace('BDT', '৳');
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFilterData({
            ...filterData,
            [e.target.name]: value,
        });
    };

    const applyFilters = () => {
        router.get(route('hospital-account.fixed-asset-vendors.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            search: '',
            with_due: false,
            is_active: true,
        });
        router.get(
            route('hospital-account.fixed-asset-vendors.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const openPaymentModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setPaymentData({
            amount: vendor.current_balance.toString(),
            payment_method: 'cash',
            reference_no: '',
            description: '',
            payment_date: new Date().toISOString().split('T')[0],
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
                    payment_date: new Date().toISOString().split('T')[0],
                });
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleDelete = (id: number) => {
        setDeleting(id);
        router.delete(route('hospital-account.fixed-asset-vendors.destroy', id), {
            onSuccess: () => setDeleteConfirm(null),
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <HospitalAccountLayout title="Fixed Asset Vendors">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Fixed Asset Vendors</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage vendors and track payments</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </button>
                        <Link
                            href={route('hospital-account.fixed-asset-vendors.create')}
                            className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Vendor
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Vendors</p>
                                <p className="text-2xl font-bold text-gray-900">{totals.total_vendors}</p>
                            </div>
                            <Users className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Purchased</p>
                                <p className="text-2xl font-bold text-gray-900">৳{totals.total_purchased.toLocaleString()}</p>
                            </div>
                            <Package className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600">৳{totals.total_paid.toLocaleString()}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Due</p>
                                <p className="text-2xl font-bold text-red-600">৳{totals.total_due.toLocaleString()}</p>
                            </div>
                            <AlertCircle className="h-10 w-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filterData.search}
                                    onChange={handleFilterChange}
                                    placeholder="Name, company, phone..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="with_due"
                                        checked={filterData.with_due}
                                        onChange={handleFilterChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">With Due Only</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={filterData.is_active}
                                        onChange={handleFilterChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Active Only</span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={applyFilters} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Apply Filters
                            </button>
                            <button onClick={clearFilters} className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Vendors Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Assets</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Total Purchased
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Total Paid</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Current Due</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
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
                                                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                                                    {vendor.company_name && <div className="text-sm text-gray-500">{vendor.company_name}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{vendor.phone}</div>
                                                {vendor.email && <div className="text-sm text-gray-500">{vendor.email}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    {vendor.assets_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
                                                ৳{(vendor.assets_sum_total_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-green-600">
                                                ৳{(vendor.payments_sum_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                                <span className={`font-medium ${vendor.current_balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    ৳{vendor.current_balance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                        vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {vendor.current_balance > 0 && vendor.is_active && (
                                                        <button
                                                            onClick={() => openPaymentModal(vendor)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Make Payment"
                                                        >
                                                            <DollarSign className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.show', vendor.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Link>
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.edit', vendor.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Link>
                                                    {vendor.assets_count === 0 &&
                                                        (vendor.payments_sum_amount || 0) === 0 &&
                                                        (deleteConfirm === vendor.id ? (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(vendor.id)}
                                                                    disabled={deleting === vendor.id}
                                                                    className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                                                                >
                                                                    {deleting === vendor.id ? 'Deleting...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    disabled={deleting === vendor.id}
                                                                    className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
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
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        ))}
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
                        <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{vendors.current_page}</span> of{' '}
                                    <span className="font-medium">{vendors.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    {vendors.current_page > 1 && (
                                        <Link
                                            href={route('hospital-account.fixed-asset-vendors.index', {
                                                ...filterData,
                                                page: vendors.current_page - 1,
                                            })}
                                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {vendors.current_page < vendors.last_page && (
                                        <Link
                                            href={route('hospital-account.fixed-asset-vendors.index', {
                                                ...filterData,
                                                page: vendors.current_page + 1,
                                            })}
                                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Make Payment to Vendor</h3>
                            <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 rounded-lg bg-gray-50 p-4">
                            <div className="text-sm text-gray-600">
                                Vendor: <span className="font-medium text-gray-900">{selectedVendor.name}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Current Due: <span className="font-medium text-red-600">৳{selectedVendor.current_balance.toLocaleString()}</span>
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
                                    max={selectedVendor.current_balance}
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

export default Index;
