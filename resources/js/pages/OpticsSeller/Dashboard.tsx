import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

interface Sale {
    id: number;
    invoice_number: string;
    patient_name: string;
    patient_phone: string;
    total_amount: number;
    due_amount: number;
    status: 'pending' | 'ready' | 'delivered';
    created_at: string;
}

interface DashboardProps {
    todaySales: number;
    todayDue: number;
    todaySalesCount: number;
    monthSales: number;
    monthDue: number;
    accountBalance: number;
    salesGrowth: number;
    pendingCount: number;
    pendingReadyCount: number;
    recentSales: Sale[];
    lowStockFrames: any[];
    lowStockCompleteGlasses: any[];
    lowStockLenses: any[];
    topSellingItems: any[];
}

export default function Dashboard({
    todaySales,
    todayDue,
    todaySalesCount,
    monthSales,
    monthDue,
    accountBalance,
    salesGrowth,
    pendingCount,
    pendingReadyCount,
    recentSales,
    lowStockFrames,
    lowStockCompleteGlasses,
    lowStockLenses,
    topSellingItems,
}: DashboardProps) {
    const formatCurrency = (amount: number | null | undefined) => {
        const numericAmount = Number(amount) || 0;
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(numericAmount);
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

    const lowStockCount = lowStockFrames.length + lowStockCompleteGlasses.length + lowStockLenses.length;

    return (
        <AdminLayout>
            <Head title="Optics Seller Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Optics Sales Dashboard</h1>
                        <p className="mt-1 text-gray-600">Monitor your optics sales performance and manage transactions</p>
                    </div>
                    <Link
                        href="/optics-seller/pos"
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
                                <p className="text-sm font-medium text-gray-600">Today's Due</p>
                                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(todayDue)}</p>
                                <p className="mt-2 text-sm text-gray-500">{todaySalesCount} transactions</p>
                            </div>
                            <div className="rounded-lg bg-orange-100 p-3">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(monthSales)}</p>
                                <p className="mt-2 text-sm text-orange-600">Due: {formatCurrency(monthDue)}</p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="mt-1 text-2xl font-bold text-blue-600">{pendingCount + pendingReadyCount}</p>
                                <p className="mt-2 text-sm text-gray-500">
                                    {pendingCount} Pending • {pendingReadyCount} Ready
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Sales */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                            <Link href="/optics-seller/sales" className="text-sm text-blue-600 hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentSales.slice(0, 5).map((sale) => (
                                    <Link
                                        key={sale.id}
                                        href={`/optics-seller/sales/${sale.id}`}
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
                                                        {sale.patient_name} • {sale.patient_phone} • {formatDate(sale.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    sale.status === 'delivered'
                                                        ? 'bg-green-100 text-green-800'
                                                        : sale.status === 'ready'
                                                          ? 'bg-blue-100 text-blue-800'
                                                          : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {sale.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-6">
                        {/* Top Selling Items */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Top Selling</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {topSellingItems.slice(0, 5).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="max-w-[120px] truncate text-sm font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.total_quantity} {item.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-green-600">{formatCurrency(item.total_amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Inventory Alerts */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {lowStockCount > 0 ? (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                <p className="text-sm font-medium text-red-800">{lowStockCount} Low Stock Items</p>
                                            </div>
                                            <div className="mt-2 text-xs text-red-700">
                                                {lowStockFrames.length > 0 && <p>• {lowStockFrames.length} Frames</p>}
                                                {lowStockCompleteGlasses.length > 0 && <p>• {lowStockCompleteGlasses.length} Complete Glasses</p>}
                                                {lowStockLenses.length > 0 && <p>• {lowStockLenses.length} Lenses</p>}
                                            </div>
                                        </div>
                                    ) : (
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
