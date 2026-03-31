// resources/js/Pages/MedicineSeller/Dashboard.tsx

import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

interface DashboardProps {
    todaySales: number;
    todaySalesCount: number;
    monthSales: number;
    pendingPayments: number;
    salesGrowth: number;
    recentSales: any[];
    lowStockMedicines: any[];
    expiringMedicines: any[];
    topSellingMedicines: any[];
}

export default function Dashboard({
    todaySales,
    todaySalesCount,
    monthSales,
    pendingPayments,
    salesGrowth,
    recentSales,
    lowStockMedicines,
    expiringMedicines,
    topSellingMedicines,
}: DashboardProps) {
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout>
            <Head title="Medicine Seller Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
                        <p className="mt-1 text-gray-600">Monitor your sales performance and manage transactions</p>
                    </div>
                    <Link
                        href="/medicine-seller/pos"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        New Sale
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(todaySales)}</p>
                                <div className="mt-2 flex items-center">
                                    {salesGrowth >= 0 ? (
                                        <ArrowUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <ArrowDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`ml-1 text-sm ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(salesGrowth).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                                <p className="mt-1 text-2xl font-bold text-green-600">{todaySalesCount}</p>
                                <p className="mt-2 text-sm text-gray-500">Total transactions</p>
                            </div>
                            <div className="rounded-lg bg-green-100 p-3">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(monthSales)}</p>
                                <p className="mt-2 text-sm text-gray-500">This month total</p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(pendingPayments)}</p>
                                <Link
                                    href="/medicine-seller/sales?payment_status=partial"
                                    className="mt-2 inline-block text-sm text-amber-600 hover:underline"
                                >
                                    View Details
                                </Link>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Sales */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                            <Link href="/medicine-seller/sales" className="text-sm text-blue-600 hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentSales.slice(0, 5).map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-blue-100 p-2">
                                                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{sale.invoice_number}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {sale.patient?.name || 'Walk-in Customer'} • {formatDate(sale.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {sale.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-6">
                        {/* Top Selling Medicines */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Top Selling</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {topSellingMedicines.slice(0, 5).map((medicine, index) => (
                                        <div key={medicine.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="max-w-[120px] truncate text-sm font-medium text-gray-900">{medicine.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {medicine.total_quantity} {medicine.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-green-600">{formatCurrency(medicine.total_amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {lowStockMedicines.length > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                <p className="text-sm font-medium text-red-800">{lowStockMedicines.length} Low Stock Items</p>
                                            </div>
                                        </div>
                                    )}
                                    {expiringMedicines.length > 0 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-amber-600" />
                                                <p className="text-sm font-medium text-amber-800">{expiringMedicines.length} Expiring Soon</p>
                                            </div>
                                        </div>
                                    )}
                                    {lowStockMedicines.length === 0 && expiringMedicines.length === 0 && (
                                        <div className="py-4 text-center">
                                            <Package className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                            <p className="text-sm text-gray-500">No inventory alerts</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
