import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, Clock, DollarSign, Edit, Eye, Filter, Package, PlusCircle, Trash2, XCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
}

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: 'active' | 'fully_paid' | 'inactive';
    latest_purchase?: {
        purchase_date: string;
        vendor: Vendor | null;
    } | null;
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
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [filterData, setFilterData] = useState({
        status: filters.status || '',
        vendor_id: filters.vendor_id || '',
        search: filters.search || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).replace('BDT', '৳');
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Active' },
            fully_paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Fully Paid' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Inactive' },
        };
        const badge = badges[status as keyof typeof badges];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilterData({
            ...filterData,
            [e.target.name]: e.target.value,
        });
    };

    const applyFilters = () => {
        router.get(route('hospital-account.fixed-assets.index'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            status: '',
            vendor_id: '',
            search: '',
            date_from: '',
            date_to: '',
        });
        router.get(
            route('hospital-account.fixed-assets.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = (id: number) => {
        setDeleting(id);
        router.delete(route('hospital-account.fixed-assets.destroy', id), {
            onSuccess: () => setDeleteConfirm(null),
            onFinish: () => setDeleting(null),
        });
    };

    const renderActions = (asset: FixedAsset) => (
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
            <Link
                href={route('hospital-account.fixed-assets.show', asset.id)}
                className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                title="View Details"
            >
                <Eye className="h-5 w-5" />
            </Link>
            <Link
                href={route('hospital-account.fixed-assets.edit', asset.id)}
                className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                title="Edit"
            >
                <Edit className="h-5 w-5" />
            </Link>
            {asset.paid_amount === 0 &&
                (deleteConfirm === asset.id ? (
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleDelete(asset.id)}
                            disabled={deleting === asset.id}
                            className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                            {deleting === asset.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting === asset.id}
                            className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setDeleteConfirm(asset.id)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-900"
                        title="Delete"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                ))}
        </div>
    );

    return (
        <HospitalAccountLayout title="Fixed Assets">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Fixed Assets</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage hospital fixed assets and payments</p>
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
                            href={route('hospital-account.fixed-assets.create')}
                            className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Asset
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Assets</p>
                                <p className="text-2xl font-bold text-gray-900">{totals.total_assets}</p>
                            </div>
                            <Package className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">৳{totals.total_amount.toLocaleString()}</p>
                            </div>
                            <DollarSign className="h-10 w-10 text-purple-500" />
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
                            <Clock className="h-10 w-10 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filterData.search}
                                    onChange={handleFilterChange}
                                    placeholder="Asset name or number..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Vendor</label>
                                <select
                                    name="vendor_id"
                                    value={filterData.vendor_id}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={filterData.status}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="fully_paid">Fully Paid</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Date From</label>
                                <input
                                    type="date"
                                    name="date_from"
                                    value={filterData.date_from}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Date To</label>
                                <input
                                    type="date"
                                    name="date_to"
                                    value={filterData.date_to}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
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

                {/* Mobile list */}
                <div className="space-y-3 lg:hidden">
                    {assets.data.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-12 text-center shadow">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No fixed assets</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new fixed asset.</p>
                        </div>
                    ) : (
                        assets.data.map((asset) => (
                            <div key={asset.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={route('hospital-account.fixed-assets.show', asset.id)}
                                            className="block truncate text-base font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            {asset.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">{asset.asset_number}</p>
                                        <div className="mt-2">{getStatusBadge(asset.status)}</div>
                                    </div>
                                    {renderActions(asset)}
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-xs">
                                    <div>
                                        <p className="text-gray-500">Total</p>
                                        <p className="mt-0.5 font-semibold text-gray-900">৳{asset.total_amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Paid</p>
                                        <p className="mt-0.5 font-semibold text-green-600">৳{asset.paid_amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Due</p>
                                        <p className="mt-0.5 font-semibold text-red-600">৳{asset.due_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-4">
                                    <span>
                                        Vendor:{' '}
                                        {asset.latest_purchase?.vendor ? (
                                            <Link
                                                href={route('hospital-account.fixed-asset-vendors.show', asset.latest_purchase.vendor.id)}
                                                className="font-medium text-blue-600"
                                            >
                                                {asset.latest_purchase.vendor.name}
                                            </Link>
                                        ) : (
                                            '-'
                                        )}
                                    </span>
                                    <span>
                                        Last purchase:{' '}
                                        {asset.latest_purchase?.purchase_date
                                            ? formatDate(asset.latest_purchase.purchase_date)
                                            : '-'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-lg bg-white shadow lg:block">
                    <div className="-mx-px overflow-x-auto">
                        <table className="w-full min-w-[720px] divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Asset
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Paid
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Due
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Status
                                    </th>
                                    <th className="hidden px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:table-cell xl:px-6">
                                        Purchase Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase xl:px-6">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {assets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No fixed assets</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new fixed asset.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    assets.data.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-4 xl:px-6">
                                                <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                                <div className="text-xs text-gray-500 sm:text-sm">{asset.asset_number}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 xl:px-6">
                                                {asset.latest_purchase?.vendor ? (
                                                    <Link
                                                        href={route('hospital-account.fixed-asset-vendors.show', asset.latest_purchase.vendor.id)}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        {asset.latest_purchase.vendor.name}
                                                        {asset.latest_purchase.vendor.company_name && (
                                                            <div className="text-xs text-gray-500">
                                                                {asset.latest_purchase.vendor.company_name}
                                                            </div>
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900 xl:px-6">
                                                ৳{asset.total_amount.toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-green-600 xl:px-6">
                                                ৳{asset.paid_amount.toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-red-600 xl:px-6">
                                                ৳{asset.due_amount.toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 xl:px-6">{getStatusBadge(asset.status)}</td>
                                            <td className="hidden whitespace-nowrap px-4 py-4 text-sm text-gray-500 xl:table-cell xl:px-6">
                                                {asset.latest_purchase?.purchase_date
                                                    ? formatDate(asset.latest_purchase.purchase_date)
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right xl:px-6">{renderActions(asset)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {assets.last_page > 1 && (
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-gray-700">
                                    Page <span className="font-medium">{assets.current_page}</span> of{' '}
                                    <span className="font-medium">{assets.last_page}</span>
                                </div>
                                <div className="flex gap-2">
                                    {assets.current_page > 1 && (
                                        <Link
                                            href={route('hospital-account.fixed-assets.index', { ...filterData, page: assets.current_page - 1 })}
                                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {assets.current_page < assets.last_page && (
                                        <Link
                                            href={route('hospital-account.fixed-assets.index', { ...filterData, page: assets.current_page + 1 })}
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

        </HospitalAccountLayout>
    );
};

export default Index;
