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
    Pill,
    Plus,
    Users,
    FileText,
    Clock,
    Activity
} from 'lucide-react';

interface Stats {
    total_medicines: number;
    medicines_in_stock: number;
    low_stock_medicines: number;
    total_stock_value: number;
    account_balance: number;
    today_sales: number;
    today_profit: number;
    month_profit: {
        income: number;
        expense: number;
        profit: number;
        balance: number;
    };
    total_vendors: number;
    total_vendor_due: number;
    pending_purchases: number;
}

interface LowStockMedicine {
    id: number;
    name: string;
    generic_name?: string;
    total_stock: number;
    stock_alert?: {
        minimum_stock: number;
    };
}

interface ExpiringMedicine {
    id: number;
    batch_number: string;
    expiry_date: string;
    available_quantity: number;
    medicine: {
        name: string;
        generic_name?: string;
    };
    vendor?: {
        name: string;
    };
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

interface RecentSale {
    id: number;
    sale_no: string;
    total_amount: number;
    payment_status: string;
    sale_date: string;
    patient?: {
        name: string;
    };
    customer_name?: string;
    sold_by: {
        name: string;
    };
}

interface PageProps {
    [key: string]: any;
    stats: Stats;
    lowStockMedicines: LowStockMedicine[];
    expiringMedicines: ExpiringMedicine[];
    recentTransactions: Transaction[];
    recentSales: RecentSale[];
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
    const { stats, lowStockMedicines, expiringMedicines, recentTransactions, recentSales } = usePage<PageProps>().props;

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800';
            case 'due':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AdminLayout>
            <Head title="Medicine Corner Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Medicine Corner Dashboard</h1>
                        <p className="text-gray-600">Pharmacy Inventory Management System</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Account Balance</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.account_balance)}</p>
                    </div>
                </div>

                {/* Stats Grid - 2 rows of 4 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Row 1: Stock & Sales */}
                    <StatCard
                        title="Total Medicines"
                        value={stats.total_medicines}
                        icon={Pill}
                        color="bg-blue-500"
                        subtitle={`${stats.medicines_in_stock} in stock`}
                    />
                    <StatCard
                        title="Stock Value"
                        value={formatCurrency(stats.total_stock_value)}
                        icon={Package}
                        color="bg-green-500"
                        subtitle="Total inventory value"
                    />
                    <StatCard
                        title="Today's Sales"
                        value={formatCurrency(stats.today_sales)}
                        icon={DollarSign}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Today's Profit"
                        value={formatCurrency(stats.today_profit)}
                        icon={TrendingUp}
                        color="bg-purple-500"
                    />

                    {/* Row 2: Vendor & Alert Stats */}
                    <StatCard
                        title="Total Vendors"
                        value={stats.total_vendors}
                        icon={Users}
                        color="bg-indigo-500"
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
                        value={stats.low_stock_medicines}
                        icon={AlertTriangle}
                        color="bg-red-500"
                        subtitle="Need restock"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <QuickAction title="Add Medicine" href="/medicine-corner/medicines" icon={Plus} color="bg-blue-600" />
                    <QuickAction title="Add Stock" href="/medicine-corner/purchase" icon={Package} color="bg-green-600" />
                    <QuickAction title="Stock List" href="/medicine-corner/stock" icon={Activity} color="bg-indigo-600" />
                    <QuickAction title="Sales" href="/medicine-corner/sales" icon={ShoppingBag} color="bg-purple-600" />
                    <QuickAction title="Vendors" href={route('medicine-vendors.index')} icon={Users} color="bg-orange-600" />
                    <QuickAction title="Reports" href="/medicine-corner/reports" icon={FileText} color="bg-pink-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Stock Alert */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                        {stats.low_stock_medicines} medicines
                                    </span>
                                </div>
                                <Link
                                    href="/medicine-corner/purchase"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Add Stock →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {lowStockMedicines.length > 0 ? (
                                <div className="space-y-3">
                                    {lowStockMedicines.slice(0, 5).map((medicine) => (
                                        <div key={medicine.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{medicine.name}</p>
                                                {medicine.generic_name && (
                                                    <p className="text-xs text-gray-500">{medicine.generic_name}</p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Current: <span className="font-semibold text-red-600">{medicine.total_stock}</span>
                                                    {medicine.stock_alert && (
                                                        <> / Min: <span className="font-semibold">{medicine.stock_alert.minimum_stock}</span></>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {medicine.stock_alert && (
                                                    <span className="text-red-600 font-medium text-sm">
                                                        Need {medicine.stock_alert.minimum_stock - medicine.total_stock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {lowStockMedicines.length > 5 && (
                                        <Link
                                            href="/medicine-corner/alerts"
                                            className="block text-center text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            View all {lowStockMedicines.length} medicines →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <p className="text-green-600 font-medium">All medicines are in good stock!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expiring Soon */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Expiring Soon</h2>
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                        Next 30 days
                                    </span>
                                </div>
                                <Link
                                    href="/medicine-corner/alerts"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {expiringMedicines.length > 0 ? (
                                <div className="space-y-3">
                                    {expiringMedicines.slice(0, 5).map((stock) => (
                                        <div key={stock.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{stock.medicine.name}</p>
                                                {stock.medicine.generic_name && (
                                                    <p className="text-xs text-gray-500">{stock.medicine.generic_name}</p>
                                                )}
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Batch: {stock.batch_number}
                                                    {stock.vendor && <> • Vendor: {stock.vendor.name}</>}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm font-medium text-amber-600">
                                                    {new Date(stock.expiry_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    Qty: {stock.available_quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {expiringMedicines.length > 5 && (
                                        <Link
                                            href="/medicine-corner/alerts"
                                            className="block text-center text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            View all {expiringMedicines.length} items →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Clock className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                    <p className="text-green-600 font-medium">No medicines expiring soon!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                                <Link
                                    href="/medicine-corner/sales"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {recentSales.length > 0 ? (
                                <div className="space-y-3">
                                    {recentSales.map((sale) => (
                                        <Link
                                            key={sale.id}
                                            href={`/medicine-corner/sales/${sale.id}`}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-medium text-gray-900">#{sale.sale_no}</p>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(sale.payment_status)}`}>
                                                        {sale.payment_status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {sale.patient?.name || sale.customer_name || 'Walk-in Customer'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(sale.sale_date).toLocaleDateString()} • {sale.sold_by.name}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(sale.total_amount)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No recent sales</p>
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
                                    href="/medicine-account"
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

                {/* Monthly Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">This Month Summary</h2>
                        <Link
                            href="/medicine-corner/reports"
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
                                {stats.month_profit.income > 0
                                    ? ((stats.month_profit.profit / stats.month_profit.income) * 100).toFixed(1)
                                    : '0.0'}% margin
                            </p>
                        </div>
                    </div>
                </div>

                {/* Vendor Payment Alert */}
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
                                href={route('medicine-vendors.index')}
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
