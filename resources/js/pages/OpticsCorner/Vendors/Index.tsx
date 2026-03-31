import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Edit, Eye, Filter, Plus, Search, TrendingUp, Users, X } from 'lucide-react';
import React, { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
    phone: string;
    email?: string;
    current_balance: number;
    balance_type: 'due' | 'advance';
    is_active: boolean;
    purchases_count: number;
    credit_limit: number;
    payment_terms_days: number;
}

interface Stats {
    total_vendors: number;
    active_vendors: number;
    total_due: number;
    total_advance: number;
}

interface PageProps {
    vendors: {
        data: Vendor[];
        links: any;
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: Stats;
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'text-gray-700 hover:bg-gray-100',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
}: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
}) => (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
            </div>
            <div className={`rounded-lg p-3 ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </div>
);

export default function VendorsIndex() {
    const { vendors, stats } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        balance: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('optics.vendors'),
            {
                search: searchQuery,
                ...filters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const applyFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        router.get(
            route('optics.vendors'),
            {
                search: searchQuery,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ status: '', balance: '' });
        router.get(route('optics.vendors.index'));
    };

    const hasActiveFilters = searchQuery || filters.status || filters.balance;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    return (
        <AdminLayout>
            <Head title="Vendors" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
                        <p className="text-gray-600">Manage your suppliers and vendors</p>
                    </div>
                    <Link href={route('optics.vendors.create')}>
                        <Button>
                            <Plus className="h-4 w-4" />
                            <span>Add Vendor</span>
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Vendors"
                        value={stats.total_vendors}
                        icon={Users}
                        color="bg-blue-500"
                        subtitle={`${stats.active_vendors} active`}
                    />
                    <StatCard
                        title="Active Vendors"
                        value={stats.active_vendors}
                        icon={TrendingUp}
                        color="bg-green-500"
                        subtitle="Currently supplying"
                    />
                    <StatCard
                        title="Total Due"
                        value={formatCurrency(stats.total_due)}
                        icon={Clock}
                        color="bg-red-500"
                        subtitle="Outstanding payments"
                    />
                    <StatCard
                        title="Total Advance"
                        value={formatCurrency(stats.total_advance)}
                        icon={TrendingUp}
                        color="bg-indigo-500"
                        subtitle="Prepaid amount"
                    />
                </div>

                {/* Search and Filters */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 md:flex-row">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search vendors by name, company, or phone..."
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </form>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={filters.status}
                                onChange={(e) => applyFilter('status', e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                value={filters.balance}
                                onChange={(e) => applyFilter('balance', e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Balances</option>
                                <option value="with_due">With Due</option>
                                <option value="with_advance">With Advance</option>
                            </select>

                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters}>
                                    <X className="h-4 w-4" />
                                    <span>Clear</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="mb-4 flex items-center gap-2 text-sm">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Active filters:</span>
                            {searchQuery && <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Search: {searchQuery}</span>}
                            {filters.status && <span className="rounded bg-green-100 px-2 py-1 text-green-700">Status: {filters.status}</span>}
                            {filters.balance && (
                                <span className="rounded bg-orange-100 px-2 py-1 text-orange-700">Balance: {filters.balance.replace('_', ' ')}</span>
                            )}
                        </div>
                    )}

                    {/* Vendors Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Balance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Credit Terms</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Purchases</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {vendors.data.length > 0 ? (
                                    vendors.data.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{vendor.name}</div>
                                                    {vendor.company_name && <div className="text-sm text-gray-500">{vendor.company_name}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="text-gray-900">{vendor.phone}</div>
                                                    {vendor.email && <div className="text-gray-500">{vendor.email}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span
                                                        className={`font-semibold ${
                                                            vendor.balance_type === 'due' ? 'text-red-600' : 'text-blue-600'
                                                        }`}
                                                    >
                                                        {formatCurrency(vendor.current_balance)}
                                                    </span>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {vendor.balance_type === 'due' ? 'We Owe Them' : 'They Owe Us'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-gray-900">Limit: {formatCurrency(vendor.credit_limit)}</div>
                                                <div className="text-gray-500">{vendor.payment_terms_days} days</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                                                    {vendor.purchases_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        href={route('optics.vendors.transactions', vendor.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={route('optics.vendors.edit', vendor.id)}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p className="font-medium text-gray-500">No vendors found</p>
                                            <p className="mt-1 text-sm text-gray-400">
                                                {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first vendor to get started'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {vendors.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-gray-600">
                                Showing page {vendors.current_page} of {vendors.last_page}
                                <span className="ml-1">({vendors.total} total vendors)</span>
                            </div>
                            <div className="flex space-x-2">
                                {vendors.links.map((link: any, index: number) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveState
                                        preserveScroll
                                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
