import Pagination from '@/components/ui/pagination';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Building2, Calendar, CreditCard, Edit3, Eye, Filter, Package, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface Stock {
    id: number;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    available_quantity: number;
    buy_price: number;
    sale_price: number;
    due_amount: number;
    payment_status: 'pending' | 'partial' | 'paid';
    medicine: {
        id: number;
        name: string;
        generic_name: string;
        unit: string;
    };
    vendor?: Vendor;
    added_by: {
        name: string;
    };
}

interface PendingVendorPayment {
    id: number;
    due_amount: number;
    purchase_date: string;
    vendor: Vendor;
    medicine: {
        name: string;
    };
}

interface StockPageProps {
    stocks: {
        data: Stock[];
        links: any[];
        meta: any;
    };
    companyNames: string[];
    lowStockMedicines: any[];
    expiringStock: Stock[];
    totalStockValue: number;
    pendingVendorPayments: PendingVendorPayment[];
}

export default function Stock({ stocks, companyNames, lowStockMedicines, expiringStock, totalStockValue, pendingVendorPayments }: StockPageProps) {
    const query = useMemo(() => {
        if (typeof window === 'undefined') return new URLSearchParams();
        return new URLSearchParams(window.location.search);
    }, []);

    const [search, setSearch] = useState(query.get('search') || '');
    const [dateType, setDateType] = useState(query.get('date_type') || 'expiry'); // expiry | purchase
    const [fromDate, setFromDate] = useState(query.get('from_date') || '');
    const [toDate, setToDate] = useState(query.get('to_date') || '');
    const [companyName, setCompanyName] = useState(query.get('company_name') || '');
    const [syncingSalePrices, setSyncingSalePrices] = useState(false);
    const [deletingStockId, setDeletingStockId] = useState<number | null>(null);

    const hasActiveFilters = useMemo(() => {
        return Boolean(search || fromDate || toDate || companyName || dateType !== 'expiry');
    }, [search, fromDate, toDate, companyName, dateType]);

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (dateType && dateType !== 'expiry') params.date_type = dateType;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (companyName) params.company_name = companyName;

        router.get(route('medicine-corner.stock'), params, {
            preserveState: true,
            preserveScroll: false,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setDateType('expiry');
        setFromDate('');
        setToDate('');
        setCompanyName('');

        router.get(
            route('medicine-corner.stock'),
            {},
            {
                preserveState: true,
                preserveScroll: false,
                replace: true,
            },
        );
    };

    const handleDeleteStock = (stock: Stock) => {
        const canDelete = stock.available_quantity === stock.quantity;
        if (!canDelete) {
            window.alert('Cannot delete this stock batch because some units were already sold.');
            return;
        }

        const ok = window.confirm(
            `Delete this stock entry?\n\nMedicine: ${stock.medicine.name}\nBatch: ${stock.batch_number}\nQuantity: ${stock.quantity}\n\nThis will refund any paid amount back to Hospital Account and remove vendor purchase records.`,
        );
        if (!ok) return;

        setDeletingStockId(stock.id);
        router.delete(route('medicine-corner.delete-stock', stock.id), {
            preserveScroll: true,
            onFinish: () => setDeletingStockId(null),
        });
    };

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB');
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
            partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
            pending: { color: 'bg-red-100 text-red-800', label: 'Pending' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>{config.label}</span>;
    };

    const totalPendingPayments = pendingVendorPayments.reduce((sum, payment) => sum + payment.due_amount, 0);

    return (
        <AdminLayout>
            <Head title="Stock Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Stock Management </h1>
                        <p className="mt-1 text-gray-600">Manage your medicine inventory, vendor payments and track stock levels</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const ok = window.confirm('Sync all stock sale prices with medicine sale prices?');
                                if (!ok) return;
                                setSyncingSalePrices(true);
                                router.post(
                                    route('medicine-corner.sync-sale-prices'),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => setSyncingSalePrices(false),
                                        onFinish: () => setSyncingSalePrices(false),
                                    },
                                );
                            }}
                            disabled={syncingSalePrices}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Sync stock sale prices"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {syncingSalePrices ? 'Syncing...' : 'Sync Sale Prices'}
                        </button>
                        <button
                            onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
                        >
                            <CreditCard className="h-4 w-4" />
                            Vendor Payments
                        </button>
                        <button
                            onClick={() => router.visit(route('medicine-corner.purchase'))}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Stock
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Stock Value</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalStockValue)}</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Vendor Payments</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(totalPendingPayments)}</p>
                            </div>
                            <div className="rounded-lg bg-red-100 p-3">
                                <CreditCard className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{lowStockMedicines.length}</p>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                <p className="mt-1 text-2xl font-bold text-orange-600">{expiringStock.length}</p>
                            </div>
                            <div className="rounded-lg bg-orange-100 p-3">
                                <Calendar className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert Banners */}
                {pendingVendorPayments.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 flex-shrink-0 text-red-600" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800">Pending Vendor Payments</h3>
                                <p className="mt-1 text-sm text-red-700">
                                    You have {formatCurrency(totalPendingPayments)} pending payments to vendors.
                                    <button
                                        onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                                        className="ml-2 text-red-800 underline hover:no-underline"
                                    >
                                        Make Payments
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {lowStockMedicines.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                            <div>
                                <h3 className="text-sm font-medium text-amber-800">Low Stock Alert</h3>
                                <p className="mt-1 text-sm text-amber-700">
                                    {lowStockMedicines.length} medicines are running low on stock.
                                    <button
                                        onClick={() => router.visit(route('medicine-corner.alerts'))}
                                        className="ml-2 text-amber-800 underline hover:no-underline"
                                    >
                                        View Details
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by medicine name, batch, vendor/company..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
                                >
                                    <Filter className="h-4 w-4" />
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Date Type</label>
                                <select
                                    value={dateType}
                                    onChange={(e) => setDateType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="expiry">Expiry date</option>
                                    <option value="purchase">Purchase date</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">From</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">To</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-600">Company</label>
                                <select
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All companies</option>
                                    {companyNames.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Stock Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Current Stock</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Medicine</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Batch</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Prices</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Payment Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Expiry</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {stocks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            No stock found for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    stocks.data.map((stock) => {
                                        const daysUntilExpiry = getDaysUntilExpiry(stock.expiry_date);
                                        const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                        const isExpired = daysUntilExpiry <= 0;
                                        const canDelete = stock.available_quantity === stock.quantity;

                                        return (
                                            <tr key={stock.id} className="transition-colors hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{stock.medicine.name}</div>
                                                        {stock.medicine.generic_name && (
                                                            <div className="text-sm text-gray-500">{stock.medicine.generic_name}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {stock.vendor ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-gray-400" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{stock.vendor.name}</div>
                                                                {stock.vendor.company_name && (
                                                                    <div className="text-xs text-gray-500">{stock.vendor.company_name}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Not specified</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                        {stock.batch_number}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        <span className="font-medium">{stock.available_quantity}</span>
                                                        <span className="text-gray-500">
                                                            /{stock.quantity} {stock.medicine.unit}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className="h-1.5 rounded-full bg-blue-600"
                                                            style={{
                                                                width: `${(stock.available_quantity / stock.quantity) * 100}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="text-gray-900">Total: {formatCurrency(stock.buy_price * stock.quantity)}</div>
                                                        <div className="text-xs text-gray-500">Unit Buy: {formatCurrency(stock.buy_price)}</div>
                                                        <div className="text-gray-500">Sale: {formatCurrency(stock.sale_price)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {getPaymentStatusBadge(stock.payment_status)}
                                                        {stock.due_amount > 0 && (
                                                            <div className="text-xs font-medium text-red-600">
                                                                Due: {formatCurrency(stock.due_amount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div
                                                            className={`font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-gray-900'}`}
                                                        >
                                                            {formatDate(stock.expiry_date)}
                                                        </div>
                                                        <div
                                                            className={`text-xs ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-gray-500'}`}
                                                        >
                                                            {isExpired
                                                                ? 'Expired'
                                                                : isExpiring
                                                                  ? `${daysUntilExpiry} days left`
                                                                  : `${daysUntilExpiry} days`}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.visit(route('medicine-corner.edit-stock', stock.id))}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-700 transition-colors hover:bg-orange-200"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteStock(stock)}
                                                            disabled={!canDelete || deletingStockId === stock.id}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                            title={!canDelete ? 'Cannot delete: some units were already sold' : 'Delete Stock'}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            {deletingStockId === stock.id ? 'Deleting...' : 'Delete'}
                                                        </button>

                                                        <button
                                                            className="inline-flex items-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination links={stocks.links} className="mt-0" />
                    </div>
                </div>

                {/* Pending Vendor Payments Section */}
                {pendingVendorPayments.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-red-600" />
                                    <h2 className="text-lg font-semibold text-red-900">Pending Vendor Payments</h2>
                                </div>
                                <button
                                    onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                                >
                                    Make Payments
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingVendorPayments.slice(0, 6).map((payment) => (
                                    <div key={payment.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{payment.medicine.name}</h3>
                                                <p className="mt-1 text-sm text-gray-600">Vendor: {payment.vendor.name}</p>
                                                <p className="text-xs text-gray-500">Purchase: {formatDate(payment.purchase_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">{formatCurrency(payment.due_amount)}</p>
                                                <p className="text-xs text-gray-500">Due</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {pendingVendorPayments.length > 6 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => router.visit(route('medicine-corner.vendor-dues'))}
                                        className="text-sm font-medium text-red-600 hover:text-red-700"
                                    >
                                        View all {pendingVendorPayments.length} pending payments →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Expiring Stock Section */}
                {expiringStock.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-amber-600" />
                                <h2 className="text-lg font-semibold text-amber-900">Expiring Soon (Next 30 Days)</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {expiringStock.map((stock) => (
                                    <div key={stock.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                                                <p className="mt-1 text-sm text-gray-600">Batch: {stock.batch_number}</p>
                                                <p className="text-sm text-gray-600">
                                                    Stock: {stock.available_quantity} {stock.medicine.unit}
                                                </p>
                                                {stock.vendor && <p className="mt-1 text-xs text-blue-600">Vendor: {stock.vendor.name}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-amber-600">{getDaysUntilExpiry(stock.expiry_date)} days</p>
                                                <p className="text-xs text-gray-500">{formatDate(stock.expiry_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
