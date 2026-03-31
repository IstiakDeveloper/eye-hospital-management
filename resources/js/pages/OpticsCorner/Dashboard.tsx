import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, Clock, DollarSign, Eye, FileText, Package, Plus, ShoppingBag, TrendingDown, TrendingUp, Users } from 'lucide-react';

interface Stats {
    total_frames: number;
    frames_in_stock: number;
    low_stock_frames: number;
    total_complete_glasses: number;
    lens_types: number;
    account_balance: number;
    today_sales: number;
    today_expenses: number;
    month_profit: {
        income: number;
        expense: number;
        profit: number;
        balance: number;
    };
    // ✅ Vendor stats যোগ করা হয়েছে
    total_vendors: number;
    total_vendor_due: number;
    pending_purchases: number;
}

interface LowStockItem {
    id: number;
    brand?: string;
    model?: string;
    name?: string;
    stock_quantity: number;
    minimum_stock_level: number;
}

interface Transaction {
    id: number;
    transaction_no: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    created_by: {
        name: string;
    };
}

interface PageProps {
    stats: Stats;
    lowStockItems: LowStockItem[];
    recentTransactions: Transaction[];
}

const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    subtitle,
}: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
}) => (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
                {trend && (
                    <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <div className={`rounded-lg p-3 ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    </div>
);

const QuickAction = ({ title, href, icon: Icon, color }: { title: string; href: string; icon: any; color: string }) => (
    <Link
        href={href}
        className={`rounded-xl p-4 text-white ${color} flex transform items-center space-x-3 transition-all hover:scale-105 hover:opacity-90`}
    >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{title}</span>
    </Link>
);

export default function Dashboard() {
    const { stats, lowStockItems, recentTransactions } = usePage<PageProps>().props;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    return (
        <AdminLayout>
            <Head title="OpticsCorner Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">OpticsCorner Dashboard</h1>
                        <p className="text-gray-600">Eye Hospital Inventory Management</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Account Balance</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.account_balance)}</p>
                    </div>
                </div>

                {/* Stats Grid - Updated with 2 rows */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Row 1: Stock & Sales */}
                    <StatCard
                        title="Total Frames"
                        value={stats.total_frames}
                        icon={Eye}
                        color="bg-blue-500"
                        subtitle={`${stats.frames_in_stock} in stock`}
                    />
                    <StatCard
                        title="Complete Glasses"
                        value={stats.total_complete_glasses}
                        icon={Package}
                        color="bg-green-500"
                        subtitle={`${stats.lens_types} lens types`}
                    />
                    <StatCard title="Today's Sales" value={formatCurrency(stats.today_sales)} icon={DollarSign} color="bg-emerald-500" />
                    <StatCard title="Today's Expenses" value={formatCurrency(stats.today_expenses)} icon={TrendingDown} color="bg-red-500" />

                    {/* ✅ Row 2: Vendor Stats */}
                    <StatCard title="Total Vendors" value={stats.total_vendors} icon={Users} color="bg-purple-500" subtitle="Active suppliers" />
                    <StatCard
                        title="Vendor Due"
                        value={formatCurrency(stats.total_vendor_due)}
                        icon={Clock}
                        color="bg-orange-500"
                        subtitle="Outstanding payments"
                    />
                    <StatCard
                        title="Pending Purchases"
                        value={stats.pending_purchases}
                        icon={FileText}
                        color="bg-pink-500"
                        subtitle="Unpaid orders"
                    />
                    <StatCard
                        title="Low Stock Alert"
                        value={stats.low_stock_frames}
                        icon={AlertTriangle}
                        color="bg-amber-500"
                        subtitle="Need restock"
                    />
                </div>

                {/* Quick Actions - Updated with Vendor actions */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <QuickAction title="Add Frame" href="/optics/frames/create" icon={Plus} color="bg-blue-600" />
                    <QuickAction title="Add Stock" href="/optics/stock/add" icon={Package} color="bg-green-600" />
                    <QuickAction title="New Sale" href="/optics/sales/create" icon={ShoppingBag} color="bg-purple-600" />
                    <QuickAction title="View Stock" href="/optics/stock" icon={Eye} color="bg-indigo-600" />
                    {/* ✅ New vendor actions */}
                    <QuickAction title="Vendors" href="/optics/vendors" icon={Users} color="bg-orange-600" />
                    <QuickAction title="Purchases" href="/optics/purchases" icon={FileText} color="bg-pink-600" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Low Stock Alert */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="border-b p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
                                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">{stats.low_stock_frames} items</span>
                                </div>
                                <Link href="/optics/stock/add" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                    Add Stock →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {lowStockItems.length > 0 ? (
                                <div className="space-y-3">
                                    {lowStockItems.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.brand && item.model ? `${item.brand} ${item.model}` : item.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Current: <span className="font-semibold text-red-600">{item.stock_quantity}</span> / Min:{' '}
                                                    <span className="font-semibold">{item.minimum_stock_level}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-red-600">
                                                    Need {item.minimum_stock_level - item.stock_quantity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {lowStockItems.length > 5 && (
                                        <Link
                                            href="/optics/stock"
                                            className="block rounded-lg py-2 text-center font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                                        >
                                            View all {lowStockItems.length} items →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Package className="mx-auto mb-2 h-12 w-12 text-green-500" />
                                    <p className="font-medium text-green-600">All items are in good stock!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="border-b p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                                <Link href="/optics/account" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {recentTransactions.slice(0, 5).map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                                                    ></span>
                                                    <p className="font-medium text-gray-900">{transaction.category}</p>
                                                </div>
                                                <p className="mt-1 line-clamp-1 text-sm text-gray-600">{transaction.description}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {new Date(transaction.transaction_date).toLocaleDateString()} • {transaction.created_by.name}
                                                </p>
                                            </div>
                                            <div className="ml-4 text-right">
                                                <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <FileText className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                                    <p className="text-gray-500">No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Summary - Enhanced */}
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">This Month Summary</h2>
                        <Link href="/optics/reports" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            View Reports →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                            <div className="mb-2 flex items-center justify-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                                <p className="text-sm font-medium text-gray-600">Total Income</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.month_profit.income)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                            <div className="mb-2 flex items-center justify-center">
                                <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.month_profit.expense)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-6 text-center shadow-sm">
                            <div className="mb-2 flex items-center justify-center">
                                <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            </div>
                            <p className={`text-3xl font-bold ${stats.month_profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.month_profit.profit)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                                {stats.month_profit.profit >= 0 ? '↑' : '↓'}{' '}
                                {((stats.month_profit.profit / stats.month_profit.income) * 100).toFixed(1)}% margin
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✅ Quick Vendor Summary Card */}
                {stats.total_vendor_due > 0 && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-lg bg-orange-100 p-3">
                                    <Clock className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Vendor Payments Due</h3>
                                    <p className="text-sm text-gray-600">
                                        You have {stats.pending_purchases} pending purchases with {formatCurrency(stats.total_vendor_due)} outstanding
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/optics/vendors"
                                className="rounded-lg bg-orange-600 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-700"
                            >
                                Manage Vendors
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
