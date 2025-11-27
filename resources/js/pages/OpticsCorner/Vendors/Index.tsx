import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Plus,
    Search,
    Edit,
    Eye,
    Users,
    TrendingUp,
    Clock,
    Filter,
    X
} from 'lucide-react';

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
        ghost: 'text-gray-700 hover:bg-gray-100'
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

export default function VendorsIndex() {
    const { vendors, stats } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        balance: ''
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('optics.vendors'), {
            search: searchQuery,
            ...filters
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const applyFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        router.get(route('optics.vendors'), {
            search: searchQuery,
            ...newFilters
        }, {
            preserveState: true,
            preserveScroll: true,
        });
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
                        <p className="text-gray-600">Manage your suppliers and vendors</p>
                    </div>
                    <Link href={route('optics.vendors.create')}>
                        <Button>
                            <Plus className="w-4 h-4" />
                            <span>Add Vendor</span>
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search vendors by name, company, or phone..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </form>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={filters.status}
                                onChange={(e) => applyFilter('status', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                value={filters.balance}
                                onChange={(e) => applyFilter('balance', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Balances</option>
                                <option value="with_due">With Due</option>
                                <option value="with_advance">With Advance</option>
                            </select>

                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={clearFilters}>
                                    <X className="w-4 h-4" />
                                    <span>Clear</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 mb-4 text-sm">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Active filters:</span>
                            {searchQuery && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    Search: {searchQuery}
                                </span>
                            )}
                            {filters.status && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    Status: {filters.status}
                                </span>
                            )}
                            {filters.balance && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                    Balance: {filters.balance.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Vendors Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balance
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Credit Terms
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchases
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendors.data.length > 0 ? (
                                    vendors.data.map((vendor) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{vendor.name}</div>
                                                    {vendor.company_name && (
                                                        <div className="text-sm text-gray-500">{vendor.company_name}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="text-gray-900">{vendor.phone}</div>
                                                    {vendor.email && (
                                                        <div className="text-gray-500">{vendor.email}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className={`font-semibold ${
                                                        vendor.balance_type === 'due' ? 'text-red-600' : 'text-blue-600'
                                                    }`}>
                                                        {formatCurrency(vendor.current_balance)}
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {vendor.balance_type === 'due' ? 'We Owe Them' : 'They Owe Us'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-gray-900">
                                                    Limit: {formatCurrency(vendor.credit_limit)}
                                                </div>
                                                <div className="text-gray-500">
                                                    {vendor.payment_terms_days} days
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                                                    {vendor.purchases_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    vendor.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {vendor.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        href={route('optics.vendors.transactions', vendor.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={route('optics.vendors.edit', vendor.id)}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No vendors found</p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                {hasActiveFilters
                                                    ? 'Try adjusting your filters'
                                                    : 'Add your first vendor to get started'}
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
