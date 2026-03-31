import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Clock, DollarSign, Filter, Package, Search, ShoppingCart, X } from 'lucide-react';
import React, { useState } from 'react';

interface Purchase {
    id: number;
    purchase_no: string;
    vendor: {
        id: number;
        name: string;
        company_name?: string;
    };
    glasses: {
        brand: string;
        model: string;
        sku: string;
    };
    quantity: number;
    unit_cost: number;
    total_cost: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'pending' | 'partial' | 'paid';
    purchase_date: string;
    added_by: {
        name: string;
    };
}

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface PageProps {
    purchases: {
        data: Purchase[];
        links: any;
        current_page: number;
        last_page: number;
        total: number;
    };
    vendors: Vendor[];
    paymentMethods: PaymentMethod[];
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses =
        'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
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

const StatusBadge = ({ status }: { status: 'pending' | 'partial' | 'paid' }) => {
    const styles = {
        pending: 'bg-red-100 text-red-800',
        partial: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
    };

    const labels = {
        pending: 'Pending',
        partial: 'Partial',
        paid: 'Paid',
    };

    return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default function PurchasesIndex() {
    const { purchases, vendors, paymentMethods } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        vendor_id: '',
        payment_status: '',
    });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method_id: '',
        payment_date: new Date().toISOString().split('T')[0],
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('optics.purchases'),
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
            route('optics.purchases'),
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
        setFilters({ vendor_id: '', payment_status: '' });
        router.get(route('optics.purchases.index'));
    };

    const handlePaymentClick = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setData('amount', purchase.due_amount.toString());
        setShowPaymentModal(true);
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchase) return;

        post(route('optics.purchases.pay', selectedPurchase.id), {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedPurchase(null);
                reset();
            },
        });
    };

    const hasActiveFilters = searchQuery || filters.vendor_id || filters.payment_status;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');

    // Calculate stats
    const stats = {
        total: purchases.total,
        pending: purchases.data.filter((p) => p.payment_status === 'pending').length,
        partial: purchases.data.filter((p) => p.payment_status === 'partial').length,
        paid: purchases.data.filter((p) => p.payment_status === 'paid').length,
        totalDue: purchases.data.reduce((sum, p) => sum + p.due_amount, 0),
    };

    return (
        <AdminLayout>
            <Head title="Glasses Purchases" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Glasses Purchases</h1>
                        <p className="text-gray-600">Manage vendor purchases and payments</p>
                    </div>
                    {/* <Link href={route('optics.purchases.create')}>
                        <Button>
                            <Plus className="w-4 h-4" />
                            <span>New Purchase</span>
                        </Button>
                    </Link> */}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Purchases</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Partial</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Paid</p>
                                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                            </div>
                            <ShoppingCart className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Due</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDue)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
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
                                    placeholder="Search by purchase number, vendor, or item..."
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </form>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={filters.vendor_id}
                                onChange={(e) => applyFilter('vendor_id', e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Vendors</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                        {vendor.company_name && ` (${vendor.company_name})`}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filters.payment_status}
                                onChange={(e) => applyFilter('payment_status', e.target.value)}
                                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
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
                            {filters.vendor_id && (
                                <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                                    Vendor: {vendors.find((v) => v.id.toString() === filters.vendor_id)?.name}
                                </span>
                            )}
                            {filters.payment_status && (
                                <span className="rounded bg-orange-100 px-2 py-1 text-orange-700">Status: {filters.payment_status}</span>
                            )}
                        </div>
                    )}

                    {/* Purchases Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Purchase Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {purchases.data.length > 0 ? (
                                    purchases.data.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{purchase.purchase_no}</div>
                                                    <div className="text-xs text-gray-500">By {purchase.added_by.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{purchase.vendor.name}</div>
                                                    {purchase.vendor.company_name && (
                                                        <div className="text-xs text-gray-500">{purchase.vendor.company_name}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {purchase.glasses.brand} {purchase.glasses.model}
                                                    </div>
                                                    <div className="text-xs text-gray-500">SKU: {purchase.glasses.sku}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                                    {purchase.quantity} pcs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="font-semibold text-gray-900">Total: {formatCurrency(purchase.total_cost)}</div>
                                                    <div className="text-green-600">Paid: {formatCurrency(purchase.paid_amount)}</div>
                                                    {purchase.due_amount > 0 && (
                                                        <div className="text-red-600">Due: {formatCurrency(purchase.due_amount)}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={purchase.payment_status} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(purchase.purchase_date)}</td>
                                            <td className="px-6 py-4">
                                                {purchase.due_amount > 0 && (
                                                    <Button variant="success" onClick={() => handlePaymentClick(purchase)} className="text-sm">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span>Pay</span>
                                                    </Button>
                                                )}
                                                {purchase.payment_status === 'paid' && (
                                                    <span className="text-sm font-medium text-green-600">✓ Paid</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                            <p className="font-medium text-gray-500">No purchases found</p>
                                            <p className="mt-1 text-sm text-gray-400">
                                                {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first purchase to get started'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {purchases.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-gray-600">
                                Showing page {purchases.current_page} of {purchases.last_page}
                                <span className="ml-1">({purchases.total} total purchases)</span>
                            </div>
                            <div className="flex space-x-2">
                                {purchases.links.map((link: any, index: number) => (
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

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedPurchase(null);
                    reset();
                }}
                title="Pay Purchase Due"
            >
                {selectedPurchase && (
                    <form onSubmit={handlePayment} className="space-y-4">
                        {/* Purchase Info */}
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Purchase No:</span>
                                    <span className="font-medium text-gray-900">{selectedPurchase.purchase_no}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vendor:</span>
                                    <span className="font-medium text-gray-900">{selectedPurchase.vendor.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Item:</span>
                                    <span className="font-medium text-gray-900">
                                        {selectedPurchase.glasses.brand} {selectedPurchase.glasses.model}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Due Amount Alert */}
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-700">Due Amount:</span>
                                <span className="text-xl font-bold text-red-900">{formatCurrency(selectedPurchase.due_amount)}</span>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Payment Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={selectedPurchase.due_amount}
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                    errors.amount ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="0.00"
                                required
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Payment Method <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.payment_method_id}
                                onChange={(e) => setData('payment_method_id', e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                    errors.payment_method_id ? 'border-red-300' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select payment method</option>
                                {paymentMethods.map((method) => (
                                    <option key={method.id} value={method.id}>
                                        {method.name}
                                    </option>
                                ))}
                            </select>
                            {errors.payment_method_id && <p className="mt-1 text-sm text-red-600">{errors.payment_method_id}</p>}
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Payment Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.payment_date}
                                onChange={(e) => setData('payment_date', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Payment Summary */}
                        {data.amount && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-green-700">Payment Amount:</span>
                                        <span className="font-semibold text-green-900">{formatCurrency(parseFloat(data.amount || '0'))}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-green-300 pt-2">
                                        <span className="text-green-700">Remaining Due:</span>
                                        <span className="font-bold text-green-900">
                                            {formatCurrency(selectedPurchase.due_amount - parseFloat(data.amount || '0'))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-3 border-t pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedPurchase(null);
                                    reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <DollarSign className="h-4 w-4" />
                                <span>{processing ? 'Processing...' : 'Make Payment'}</span>
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AdminLayout>
    );
}
