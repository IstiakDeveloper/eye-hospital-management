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
    Plus
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

const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {trend && (
                    <div className={`flex items-center mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
        className={`p-4 rounded-xl text-white ${color} hover:opacity-90 transition-opacity flex items-center space-x-3`}
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Frames"
                        value={stats.total_frames}
                        icon={Eye}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Frames in Stock"
                        value={stats.frames_in_stock}
                        icon={Package}
                        color="bg-green-500"
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
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction title="Add Frame" href="/optics/frames/create" icon={Plus} color="bg-blue-600" />
                    <QuickAction title="Add Stock" href="/optics/stock/add" icon={Package} color="bg-green-600" />
                    <QuickAction title="New Sale" href="/optics/sales/create" icon={ShoppingBag} color="bg-purple-600" />
                    <QuickAction title="View Stock" href="/optics/stock" icon={Eye} color="bg-indigo-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Stock Alert */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    {stats.low_stock_frames} items
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            {lowStockItems.length > 0 ? (
                                <div className="space-y-3">
                                    {lowStockItems.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.brand && item.model ? `${item.brand} ${item.model}` : item.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Stock: {item.stock_quantity} / Min: {item.minimum_stock_level}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-red-600 font-medium">Low Stock</span>
                                            </div>
                                        </div>
                                    ))}
                                    {lowStockItems.length > 5 && (
                                        <Link
                                            href="/optics/stock"
                                            className="block text-center text-blue-600 hover:text-blue-800 font-medium py-2"
                                        >
                                            View all {lowStockItems.length} items
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <p className="text-green-600 text-center py-4">All items are in good stock!</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {recentTransactions.slice(0, 5).map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                <p className="font-medium text-gray-900">{transaction.category}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(transaction.transaction_date).toLocaleDateString()} by {transaction.created_by.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Summary */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">This Month Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Income</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.month_profit.income)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.month_profit.expense)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Net Profit</p>
                            <p className={`text-2xl font-bold ${stats.month_profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.month_profit.profit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
