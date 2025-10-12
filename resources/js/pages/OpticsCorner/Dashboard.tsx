import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ShoppingBag,
    DollarSign,
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Eye,
    Plus,
    Users,
    FileText,
    Clock
} from 'lucide-react';

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

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
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
                {trend && (
                    <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const QuickAction = ({ title, href, icon: Icon, color }: {
    title: string;
    href: string;
    icon: any;
    color: string;
}) => (
    <Link
        href={href}
        className={`p-4 rounded-xl text-white ${color} hover:opacity-90 transition-all transform hover:scale-105 flex items-center space-x-3`}
    >
        <Icon className="w-5 h-5" />
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
                <div className="flex justify-between items-center">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <StatCard
                        title="Today's Sales"
                        value={formatCurrency(stats.today_sales)}
                        icon={DollarSign}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Today's Expenses"
                        value={formatCurrency(stats.today_expenses)}
                        icon={TrendingDown}
                        color="bg-red-500"
                    />

                    {/* ✅ Row 2: Vendor Stats */}
                    <StatCard
                        title="Total Vendors"
                        value={stats.total_vendors}
                        icon={Users}
                        color="bg-purple-500"
                        subtitle="Active suppliers"
                    />
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <QuickAction title="Add Frame" href="/optics/frames/create" icon={Plus} color="bg-blue-600" />
                    <QuickAction title="Add Stock" href="/optics/stock/add" icon={Package} color="bg-green-600" />
                    <QuickAction title="New Sale" href="/optics/sales/create" icon={ShoppingBag} color="bg-purple-600" />
                    <QuickAction title="View Stock" href="/optics/stock" icon={Eye} color="bg-indigo-600" />
                    {/* ✅ New vendor actions */}
                    <QuickAction title="Vendors" href="/optics/vendors" icon={Users} color="bg-orange-600" />
                    <QuickAction title="Purchases" href="/optics/purchases" icon={FileText} color="bg-pink-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Stock Alert */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                        {stats.low_stock_frames} items
                                    </span>
                                </div>
                                <Link
                                    href="/optics/stock/add"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Add Stock →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {lowStockItems.length > 0 ? (
                                <div className="space-y-3">
                                    {lowStockItems.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.brand && item.model ? `${item.brand} ${item.model}` : item.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Current: <span className="font-semibold text-red-600">{item.stock_quantity}</span> /
                                                    Min: <span className="font-semibold">{item.minimum_stock_level}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-red-600 font-medium text-sm">
                                                    Need {item.minimum_stock_level - item.stock_quantity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {lowStockItems.length > 5 && (
                                        <Link
                                            href="/optics/stock"
                                            className="block text-center text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            View all {lowStockItems.length} items →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <p className="text-green-600 font-medium">All items are in good stock!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                                <Link
                                    href="/optics/account"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {recentTransactions.slice(0, 5).map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <p className="font-medium text-gray-900">{transaction.category}</p>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{transaction.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(transaction.transaction_date).toLocaleDateString()} • {transaction.created_by.name}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Summary - Enhanced */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">This Month Summary</h2>
                        <Link
                            href="/optics/reports"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            View Reports →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                                <p className="text-sm font-medium text-gray-600">Total Income</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.month_profit.income)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                                <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.month_profit.expense)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                            <div className="flex items-center justify-center mb-2">
                                <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
                                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            </div>
                            <p className={`text-3xl font-bold ${stats.month_profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.month_profit.profit)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                {stats.month_profit.profit >= 0 ? '↑' : '↓'}
                                {' '}
                                {((stats.month_profit.profit / stats.month_profit.income) * 100).toFixed(1)}% margin
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✅ Quick Vendor Summary Card */}
                {stats.total_vendor_due > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-orange-600" />
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
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
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
