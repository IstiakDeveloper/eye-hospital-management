import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    Download,
    Filter,
    PieChart,
    RefreshCw,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface TopVendor {
    name: string;
    company_name?: string;
    total_purchases: number | string;
    transaction_count: number;
    current_due: number | string;
}

interface MonthlyTrend {
    year: number;
    month: number;
    income: number | string;
    expense: number | string;
}

interface PaymentMethod {
    payment_method: string;
    total: number | string;
    count: number;
}

interface VendorMetrics {
    total_active_vendors: number;
    vendors_with_dues: number;
    average_payment_terms: number | string;
    total_credit_limit: number | string;
}

interface VendorAnalyticsProps {
    topVendors: TopVendor[];
    monthlyTrend: MonthlyTrend[];
    paymentMethods: PaymentMethod[];
    vendorMetrics: VendorMetrics;
    filters: {
        year: number;
        month: number;
    };
}

export default function VendorAnalytics({ topVendors, monthlyTrend, paymentMethods, vendorMetrics, filters }: VendorAnalyticsProps) {
    const [dateFilter, setDateFilter] = useState({ year: filters.year, month: filters.month });
    const [isLoading, setIsLoading] = useState(false);

    const parseAmount = (amount: number | string): number => {
        const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(parsed) || parsed === null || parsed === undefined ? 0 : parsed;
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = parseAmount(amount);
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(numAmount);
        return `৳${formatted}`;
    };

    const formatCompactCurrency = (amount: number | string) => {
        const numAmount = parseAmount(amount);
        if (numAmount >= 10000000) return `৳${(numAmount / 10000000).toFixed(1)}Cr`;
        if (numAmount >= 100000) return `৳${(numAmount / 100000).toFixed(1)}L`;
        if (numAmount >= 1000) return `৳${(numAmount / 1000).toFixed(1)}K`;
        return formatCurrency(numAmount);
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1] || 'Unknown';
    };

    const handleDateFilter = async () => {
        setIsLoading(true);
        router.get(route('medicine-vendors.analytics'), dateFilter, {
            onFinish: () => setIsLoading(false),
        });
    };

    // Calculate totals and trends with safe parsing
    const totalPurchases = topVendors.reduce((sum, vendor) => sum + parseAmount(vendor.total_purchases), 0);
    const totalDues = topVendors.reduce((sum, vendor) => sum + parseAmount(vendor.current_due), 0);
    const averagePurchasePerVendor = topVendors.length > 0 ? totalPurchases / topVendors.length : 0;

    // Monthly trend calculations with safe parsing
    const currentMonthData = monthlyTrend.find((m) => m.year === dateFilter.year && m.month === dateFilter.month);
    const previousMonthData = monthlyTrend.find((m) => {
        const prevMonth = dateFilter.month === 1 ? 12 : dateFilter.month - 1;
        const prevYear = dateFilter.month === 1 ? dateFilter.year - 1 : dateFilter.year;
        return m.year === prevYear && m.month === prevMonth;
    });

    const currentExpense = currentMonthData ? parseAmount(currentMonthData.expense) : 0;
    const previousExpense = previousMonthData ? parseAmount(previousMonthData.expense) : 0;

    const purchaseGrowth = currentExpense > 0 && previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;

    return (
        <AdminLayout>
            <Head title="Vendor Analytics Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Analytics</h1>
                        <p className="mt-1 text-gray-600">Comprehensive insights into vendor relationships and performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-corner.reports'))}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Medicine Reports
                        </button>
                        <button
                            onClick={() => router.get(route('medicine-vendors.export-report'), { type: 'analytics', format: 'pdf' })}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Analysis Period:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={dateFilter.month}
                                onChange={(e) => setDateFilter({ ...dateFilter, month: parseInt(e.target.value) })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {getMonthName(i + 1)}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={dateFilter.year}
                                onChange={(e) => setDateFilter({ ...dateFilter, year: parseInt(e.target.value) })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    );
                                })}
                            </select>
                            <button
                                onClick={handleDateFilter}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Active Vendors</p>
                                <p className="mt-1 text-3xl font-bold text-blue-900">{vendorMetrics.total_active_vendors || 0}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">Total suppliers</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-200 p-3">
                                <Building2 className="h-8 w-8 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Total Purchases</p>
                                <p className="mt-1 text-3xl font-bold text-green-900">{formatCompactCurrency(totalPurchases)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    {purchaseGrowth >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${purchaseGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(purchaseGrowth).toFixed(1)}% vs last month
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-green-200 p-3">
                                <DollarSign className="h-8 w-8 text-green-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Outstanding Dues</p>
                                <p className="mt-1 text-3xl font-bold text-red-900">{formatCompactCurrency(totalDues)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-700">{vendorMetrics.vendors_with_dues || 0} vendors</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-red-200 p-3">
                                <CreditCard className="h-8 w-8 text-red-700" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Avg. Purchase/Vendor</p>
                                <p className="mt-1 text-3xl font-bold text-purple-900">{formatCompactCurrency(averagePurchasePerVendor)}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Target className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm text-purple-700">Per vendor</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-200 p-3">
                                <Activity className="h-8 w-8 text-purple-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Performance Indicators */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Performance Indicators</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="text-center">
                            <div className="mb-3 rounded-lg bg-blue-100 p-4">
                                <Zap className="mx-auto h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{parseAmount(vendorMetrics.average_payment_terms).toFixed(0)}</div>
                            <div className="text-sm text-gray-600">Avg. Payment Terms</div>
                            <div className="mt-1 text-xs text-gray-500">Days</div>
                        </div>

                        <div className="text-center">
                            <div className="mb-3 rounded-lg bg-green-100 p-4">
                                <CreditCard className="mx-auto h-8 w-8 text-green-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatCompactCurrency(vendorMetrics.total_credit_limit)}</div>
                            <div className="text-sm text-gray-600">Total Credit Limit</div>
                            <div className="mt-1 text-xs text-gray-500">Available</div>
                        </div>

                        <div className="text-center">
                            <div className="mb-3 rounded-lg bg-purple-100 p-4">
                                <TrendingUp className="mx-auto h-8 w-8 text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {totalPurchases > 0 ? ((totalDues / totalPurchases) * 100).toFixed(1) : '0'}%
                            </div>
                            <div className="text-sm text-gray-600">Outstanding Ratio</div>
                            <div className="mt-1 text-xs text-gray-500">Of total purchases</div>
                        </div>

                        <div className="text-center">
                            <div className="mb-3 rounded-lg bg-orange-100 p-4">
                                <Activity className="mx-auto h-8 w-8 text-orange-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {topVendors.reduce((sum, v) => sum + (v.transaction_count || 0), 0)}
                            </div>
                            <div className="text-sm text-gray-600">Total Transactions</div>
                            <div className="mt-1 text-xs text-gray-500">This period</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Vendors Performance */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Top Vendor Performance</h2>
                            <Building2 className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                            {topVendors.slice(0, 8).map((vendor, index) => {
                                const vendorPurchases = parseAmount(vendor.total_purchases);
                                const vendorDue = parseAmount(vendor.current_due);
                                const maxPurchase = Math.max(...topVendors.map((v) => parseAmount(v.total_purchases)));
                                const percentage = maxPurchase > 0 ? (vendorPurchases / maxPurchase) * 100 : 0;

                                return (
                                    <div key={vendor.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{vendor.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {vendor.transaction_count || 0} transactions
                                                        {vendorDue > 0 && (
                                                            <span className="ml-2 text-red-500">Due: {formatCompactCurrency(vendorDue)}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">{formatCompactCurrency(vendorPurchases)}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-200">
                                            <div
                                                className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Methods Analysis */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                            <PieChart className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                            {paymentMethods.map((method, index) => {
                                const methodTotal = parseAmount(method.total);
                                const totalPayments = paymentMethods.reduce((sum, m) => sum + parseAmount(m.total), 0);
                                const percentage = totalPayments > 0 ? (methodTotal / totalPayments) * 100 : 0;

                                const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600'];

                                return (
                                    <div key={method.payment_method} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-4 w-4 rounded-full ${colors[index % colors.length]}`}></div>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">{method.payment_method.replace('_', ' ')}</p>
                                                <p className="text-sm text-gray-500">{method.count || 0} payments</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCompactCurrency(methodTotal)}</p>
                                            <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {paymentMethods.length === 0 && (
                            <div className="py-8 text-center">
                                <CreditCard className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <p className="text-gray-500">No payment data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Trend Analysis */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Monthly Purchase & Payment Trend</h2>
                        <Activity className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {monthlyTrend.slice(0, 12).map((item, index) => {
                            const income = parseAmount(item.income);
                            const expense = parseAmount(item.expense);
                            const netFlow = income - expense;
                            const isCurrentMonth = item.year === dateFilter.year && item.month === dateFilter.month;

                            return (
                                <div
                                    key={`${item.year}-${item.month}`}
                                    className={`rounded-lg p-4 text-center ${isCurrentMonth ? 'border-2 border-blue-200 bg-blue-50' : 'bg-gray-50'}`}
                                >
                                    <div className="text-lg font-bold text-gray-900">
                                        {getMonthName(item.month)} {item.year}
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Purchases</p>
                                            <p className="text-sm font-semibold text-red-600">{formatCompactCurrency(expense)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">Payments</p>
                                            <p className="text-sm font-semibold text-green-600">{formatCompactCurrency(income)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">Net Flow</p>
                                            <p className={`text-sm font-semibold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {netFlow >= 0 ? '+' : ''}
                                                {formatCompactCurrency(Math.abs(netFlow))}
                                            </p>
                                        </div>
                                    </div>

                                    {isCurrentMonth && (
                                        <div className="mt-2">
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">Current</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vendor Health Score */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-xl font-semibold text-gray-900">Vendor Relationship Health</h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Healthy Vendors */}
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                            <div className="text-3xl font-bold text-green-600">
                                {topVendors.filter((v) => parseAmount(v.current_due) === 0).length}
                            </div>
                            <div className="mt-1 text-sm font-medium text-green-700">Healthy Vendors</div>
                            <div className="mt-2 text-xs text-green-600">No outstanding dues</div>
                        </div>

                        {/* At-Risk Vendors */}
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
                            <div className="text-3xl font-bold text-yellow-600">
                                {
                                    topVendors.filter((v) => {
                                        const due = parseAmount(v.current_due);
                                        return due > 0 && due <= averagePurchasePerVendor * 0.1;
                                    }).length
                                }
                            </div>
                            <div className="mt-1 text-sm font-medium text-yellow-700">At-Risk Vendors</div>
                            <div className="mt-2 text-xs text-yellow-600">Minor outstanding amounts</div>
                        </div>

                        {/* High-Risk Vendors */}
                        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                            <div className="text-3xl font-bold text-red-600">
                                {topVendors.filter((v) => parseAmount(v.current_due) > averagePurchasePerVendor * 0.1).length}
                            </div>
                            <div className="mt-1 text-sm font-medium text-red-700">High-Risk Vendors</div>
                            <div className="mt-2 text-xs text-red-600">Significant overdue amounts</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Manage Vendors</div>
                                <div className="text-sm text-gray-600">View all vendors</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.due-report'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-red-100 p-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Due Report</div>
                                <div className="text-sm text-gray-600">Outstanding payments</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-vendors.payment-history'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-green-100 p-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Payment History</div>
                                <div className="text-sm text-gray-600">All payments</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-corner.purchase'))}
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                        >
                            <div className="rounded-lg bg-purple-100 p-2">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">New Purchase</div>
                                <div className="text-sm text-gray-600">Add inventory</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
