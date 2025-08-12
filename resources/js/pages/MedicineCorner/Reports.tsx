import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar as CalendarIcon,
    Package,
    DollarSign,
    PieChart,
    Activity,
    FileText,
    Building2,
    CreditCard,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    Zap,
    Eye,
    Filter,
    RefreshCw
} from 'lucide-react';

// Types
interface PurchaseSummary {
    date: string;
    total: number;
    count: number;
}

interface TopPurchased {
    name: string;
    total_amount: number;
    total_quantity: number;
}

interface TopVendor {
    vendor_name: string;
    company_name?: string;
    total_amount: number;
    transaction_count: number;
    total_due: number;
}

interface VendorDueSummary {
    name: string;
    current_balance: number;
    credit_limit: number;
}

interface PaymentSummary {
    date: string;
    total: number;
    count: number;
}

interface StockValuation {
    name: string;
    total_stock: number;
    total_value: number;
    average_price: number;
    vendors: Array<{
        vendor: string;
        quantity: number;
        value: number;
    }>;
}

interface MonthlyTrend {
    year: number;
    month: number;
    total: number;
}

interface ReportsPageProps {
    purchaseSummary: PurchaseSummary[];
    topPurchased: TopPurchased[];
    topVendors: TopVendor[];
    vendorDueSummary: VendorDueSummary[];
    paymentSummary: PaymentSummary[];
    stockValuation: StockValuation[];
    monthlyTrend: MonthlyTrend[];
    dateFrom: string;
    dateTo: string;
    totalPurchase: number;
    totalPayments: number;
    totalVendorDues: number;
}

export default function Reports({
    purchaseSummary,
    topPurchased,
    topVendors,
    vendorDueSummary,
    paymentSummary,
    stockValuation,
    monthlyTrend,
    dateFrom,
    dateTo,
    totalPurchase,
    totalPayments,
    totalVendorDues
}: ReportsPageProps) {
    const [dateRange, setDateRange] = useState({ from: dateFrom, to: dateTo });
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);

    // Utility Functions
    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatCompactCurrency = (amount: number) => {
        if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
        return formatCurrency(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short'
        });
    };

    const formatFullDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const getGrowthPercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Calculations
    const totalStockValue = stockValuation.reduce((sum, item) => sum + item.total_value, 0);
    const averageDailyPurchase = purchaseSummary.length > 0 ? totalPurchase / purchaseSummary.length : 0;
    const paymentRatio = totalPurchase > 0 ? (totalPayments / totalPurchase) * 100 : 0;
    const outstandingRatio = totalPurchase > 0 ? (totalVendorDues / totalPurchase) * 100 : 0;

    // Trend calculations
    const currentPeriodTotal = purchaseSummary.slice(0, 15).reduce((sum, item) => sum + item.total, 0);
    const previousPeriodTotal = purchaseSummary.slice(15, 30).reduce((sum, item) => sum + item.total, 0);
    const growthPercentage = getGrowthPercentage(currentPeriodTotal, previousPeriodTotal);

    const handleDateRangeChange = async () => {
        setIsLoading(true);
        router.get(route('medicine-corner.reports'), {
            date_from: dateRange.from,
            date_to: dateRange.to
        }, {
            onFinish: () => setIsLoading(false)
        });
    };

    const exportReport = (format: string) => {
        router.get(route('medicine-corner.export-reports'), {
            format,
            type: activeTab,
            date_from: dateRange.from,
            date_to: dateRange.to
        });
    };

    return (
        <AdminLayout>
            <Head title="Reports & Analytics - Medicine Corner" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine Corner Analytics</h1>
                        <p className="text-gray-600 mt-1">
                            Comprehensive insights into inventory, purchases, vendors, and financial performance
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.analytics'))}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Building2 className="w-4 h-4" />
                            Vendor Analytics
                        </button>
                        <div className="relative">
                            <select
                                onChange={(e) => exportReport(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500"
                                defaultValue=""
                            >
                                <option value="" disabled>Export Report</option>
                                <option value="pdf">PDF Report</option>
                                <option value="excel">Excel Spreadsheet</option>
                                <option value="csv">CSV Data</option>
                            </select>
                            <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Date Range & Quick Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Date Range */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Date Range:</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleDateRangeChange}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Filter className="w-4 h-4" />
                                    )}
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Quick Date Filters */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Quick:</span>
                            {[
                                { label: 'Today', days: 0 },
                                { label: '7 Days', days: 7 },
                                { label: '30 Days', days: 30 },
                                { label: '3 Months', days: 90 },
                            ].map((period) => (
                                <button
                                    key={period.label}
                                    onClick={() => {
                                        const endDate = new Date();
                                        const startDate = new Date();
                                        startDate.setDate(endDate.getDate() - period.days);
                                        setDateRange({
                                            from: startDate.toISOString().split('T')[0],
                                            to: endDate.toISOString().split('T')[0]
                                        });
                                    }}
                                    className="px-3 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {[
                            { key: 'overview', label: 'Overview', icon: Activity },
                            { key: 'purchases', label: 'Purchases', icon: Package },
                            { key: 'vendors', label: 'Vendors', icon: Building2 },
                            { key: 'inventory', label: 'Inventory', icon: PieChart },
                            { key: 'financial', label: 'Financial', icon: DollarSign },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Key Metrics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-600">Total Purchases</p>
                                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                                    {formatCurrency(totalPurchase)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    {growthPercentage >= 0 ? (
                                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className={`text-sm font-medium ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {Math.abs(growthPercentage).toFixed(1)}%
                                                    </span>
                                                    <span className="text-sm text-gray-600">vs previous</span>
                                                </div>
                                            </div>
                                            <div className="bg-blue-200 p-3 rounded-lg">
                                                <DollarSign className="w-6 h-6 text-blue-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-600">Vendor Payments</p>
                                                <p className="text-2xl font-bold text-green-900 mt-1">
                                                    {formatCurrency(totalPayments)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <Target className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium text-green-600">
                                                        {paymentRatio.toFixed(1)}%
                                                    </span>
                                                    <span className="text-sm text-gray-600">of purchases</span>
                                                </div>
                                            </div>
                                            <div className="bg-green-200 p-3 rounded-lg">
                                                <CreditCard className="w-6 h-6 text-green-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-red-600">Outstanding Dues</p>
                                                <p className="text-2xl font-bold text-red-900 mt-1">
                                                    {formatCurrency(totalVendorDues)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                                    <span className="text-sm font-medium text-red-600">
                                                        {outstandingRatio.toFixed(1)}%
                                                    </span>
                                                    <span className="text-sm text-gray-600">outstanding</span>
                                                </div>
                                            </div>
                                            <div className="bg-red-200 p-3 rounded-lg">
                                                <Building2 className="w-6 h-6 text-red-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-purple-600">Stock Value</p>
                                                <p className="text-2xl font-bold text-purple-900 mt-1">
                                                    {formatCurrency(totalStockValue)}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <Package className="w-4 h-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-purple-600">
                                                        {stockValuation.length}
                                                    </span>
                                                    <span className="text-sm text-gray-600">items</span>
                                                </div>
                                            </div>
                                            <div className="bg-purple-200 p-3 rounded-lg">
                                                <Package className="w-6 h-6 text-purple-700" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Indicators */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Avg. Daily Purchase</span>
                                                <span className="font-semibold text-gray-900">{formatCurrency(averageDailyPurchase)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Active Vendors</span>
                                                <span className="font-semibold text-gray-900">{topVendors.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Purchase Orders</span>
                                                <span className="font-semibold text-gray-900">
                                                    {purchaseSummary.reduce((sum, item) => sum + item.count, 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Payment Rate</span>
                                                <span className={`font-semibold ${paymentRatio >= 80 ? 'text-green-600' : paymentRatio >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {paymentRatio.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Purchase Trend</h3>
                                            <div className="space-y-3">
                                                {purchaseSummary.slice(0, 7).map((item, index) => {
                                                    const maxAmount = Math.max(...purchaseSummary.slice(0, 7).map(p => p.total));
                                                    const percentage = maxAmount > 0 ? (item.total / maxAmount) * 100 : 0;

                                                    return (
                                                        <div key={item.date} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="text-sm font-medium text-gray-900 w-12">
                                                                    {formatDate(item.date)}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'}`}
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <span className="text-xs text-gray-500">{item.count} orders</span>
                                                                <span className="text-sm font-semibold text-gray-900">
                                                                    {formatCompactCurrency(item.total)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Purchases Tab */}
                        {activeTab === 'purchases' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Daily Purchase Analysis */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Daily Purchase Analysis</h3>
                                            <BarChart3 className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="space-y-4">
                                            {purchaseSummary.slice(0, 10).map((item) => {
                                                const maxAmount = Math.max(...purchaseSummary.map(p => p.total));
                                                const percentage = maxAmount > 0 ? (item.total / maxAmount) * 100 : 0;

                                                return (
                                                    <div key={item.date} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {formatFullDate(item.date)}
                                                                </span>
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                    {item.count} orders
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {formatCurrency(item.total)}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Top Purchased Medicines */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Top Purchased Medicines</h3>
                                            <TrendingUp className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="space-y-4">
                                            {topPurchased.slice(0, 10).map((item, index) => (
                                                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.total_quantity} units purchased
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-semibold text-green-600">
                                                        {formatCurrency(item.total_amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Purchase Trend */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Monthly Purchase Trend</h3>
                                        <Activity className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {monthlyTrend.slice(0, 12).map((item, index) => {
                                            const isCurrentMonth = index === 0;
                                            return (
                                                <div key={`${item.year}-${item.month}`} className="text-center">
                                                    <div className={`rounded-lg p-4 ${isCurrentMonth ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                                                        <div className={`text-2xl font-bold ${isCurrentMonth ? 'text-blue-600' : 'text-gray-700'}`}>
                                                            {formatCompactCurrency(item.total)}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {getMonthName(item.month)} {item.year}
                                                        </div>
                                                        {isCurrentMonth && (
                                                            <div className="text-xs text-blue-600 mt-1 font-medium">Current</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Vendors Tab */}
                        {activeTab === 'vendors' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Vendors */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Top Vendors by Volume</h3>
                                            <Building2 className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="space-y-4">
                                            {topVendors.slice(0, 8).map((vendor, index) => (
                                                <div key={vendor.vendor_name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {vendor.vendor_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {vendor.transaction_count} transactions
                                                                {vendor.total_due > 0 && (
                                                                    <span className="text-red-500 ml-2">
                                                                        Due: {formatCompactCurrency(vendor.total_due)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-semibold text-green-600">
                                                        {formatCurrency(vendor.total_amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vendor Payment Status */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Vendor Payment Status</h3>
                                            <CreditCard className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="space-y-4">
                                            {vendorDueSummary.slice(0, 8).map((vendor, index) => {
                                                const creditUtilization = vendor.credit_limit > 0
                                                    ? (vendor.current_balance / vendor.credit_limit) * 100
                                                    : 0;

                                                return (
                                                    <div key={vendor.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {vendor.name}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-red-600">
                                                                    {formatCurrency(vendor.current_balance)}
                                                                </span>
                                                                {vendor.current_balance > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        Due
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                            <span>Credit Limit: {formatCurrency(vendor.credit_limit)}</span>
                                                            <span className={`font-medium ${creditUtilization > 80 ? 'text-red-500' : creditUtilization > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                                                                {creditUtilization.toFixed(1)}% utilized
                                                            </span>
                                                        </div>

                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                                    creditUtilization > 80 ? 'bg-red-500' :
                                                                    creditUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                                }`}
                                                                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase vs Payment Comparison */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Purchase vs Payment Analysis</h3>
                                        <Activity className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="space-y-4">
                                        {purchaseSummary.slice(0, 10).map((purchase) => {
                                            const payment = paymentSummary.find(p => p.date === purchase.date) || { total: 0, count: 0 };
                                            const maxAmount = Math.max(...purchaseSummary.slice(0, 10).map(p => p.total));
                                            const purchasePercentage = maxAmount > 0 ? (purchase.total / maxAmount) * 100 : 0;
                                            const paymentPercentage = maxAmount > 0 ? (payment.total / maxAmount) * 100 : 0;

                                            return (
                                                <div key={purchase.date} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">{formatFullDate(purchase.date)}</span>
                                                        <div className="flex gap-6 text-xs">
                                                            <span className="text-blue-600 font-medium">
                                                                Purchase: {formatCurrency(purchase.total)}
                                                            </span>
                                                            <span className="text-green-600 font-medium">
                                                                Payment: {formatCurrency(payment.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-blue-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${purchasePercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="bg-green-200 rounded-full h-2">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${paymentPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inventory Tab */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-6">
                                {/* Stock Valuation Overview */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Stock Valuation Overview</h3>
                                        <div className="text-2xl font-bold text-purple-600">
                                            {formatCurrency(totalStockValue)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{stockValuation.length}</div>
                                            <div className="text-sm text-gray-600">Total Items</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {stockValuation.reduce((sum, item) => sum + item.total_stock, 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Units</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {formatCompactCurrency(totalStockValue / stockValuation.length || 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Avg Value</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {new Set(stockValuation.flatMap(item => item.vendors.map(v => v.vendor))).size}
                                            </div>
                                            <div className="text-sm text-gray-600">Suppliers</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Valuation Table */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">Detailed Stock Analysis</h3>
                                            <PieChart className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Medicine
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Stock Qty
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Avg Price
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Value
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Vendors
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        % Share
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {stockValuation.slice(0, 20).map((item, index) => {
                                                    const percentage = totalStockValue > 0 ? (item.total_value / totalStockValue) * 100 : 0;

                                                    return (
                                                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {item.name}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900 font-medium">
                                                                    {item.total_stock}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    {formatCurrency(item.average_price)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-semibold text-green-600">
                                                                    {formatCurrency(item.total_value)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.vendors.slice(0, 3).map((vendor, idx) => (
                                                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {vendor.vendor}: {vendor.quantity}
                                                                        </span>
                                                                    ))}
                                                                    {item.vendors.length > 3 && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                            +{item.vendors.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-sm text-gray-600 font-medium">
                                                                        {percentage.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {stockValuation.length > 20 && (
                                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                                            <button
                                                onClick={() => router.visit(route('medicine-corner.stock'))}
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View all {stockValuation.length} items
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Financial Tab */}
                        {activeTab === 'financial' && (
                            <div className="space-y-6">
                                {/* Financial Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-700">Cash Flow</p>
                                                <p className="text-2xl font-bold text-green-900 mt-1">
                                                    {formatCurrency(totalPayments - totalPurchase)}
                                                </p>
                                                <div className="text-sm text-green-600 mt-1">
                                                    {totalPayments > totalPurchase ? 'Positive' : 'Negative'} Flow
                                                </div>
                                            </div>
                                            <div className="bg-green-200 p-3 rounded-lg">
                                                <Activity className="w-6 h-6 text-green-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-700">Payment Efficiency</p>
                                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                                    {paymentRatio.toFixed(1)}%
                                                </p>
                                                <div className="text-sm text-blue-600 mt-1">
                                                    of purchases paid
                                                </div>
                                            </div>
                                            <div className="bg-blue-200 p-3 rounded-lg">
                                                <Target className="w-6 h-6 text-blue-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-purple-700">Working Capital</p>
                                                <p className="text-2xl font-bold text-purple-900 mt-1">
                                                    {formatCurrency(totalStockValue - totalVendorDues)}
                                                </p>
                                                <div className="text-sm text-purple-600 mt-1">
                                                    Net investment
                                                </div>
                                            </div>
                                            <div className="bg-purple-200 p-3 rounded-lg">
                                                <Zap className="w-6 h-6 text-purple-700" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Financial Summary</h3>
                                        <div className="space-y-4">
                                            {monthlyTrend.slice(0, 6).map((item, index) => {
                                                const paymentData = paymentSummary.find(p =>
                                                    new Date(p.date).getMonth() === item.month - 1 &&
                                                    new Date(p.date).getFullYear() === item.year
                                                );
                                                const payments = paymentData?.total || 0;
                                                const netFlow = payments - item.total;

                                                return (
                                                    <div key={`${item.year}-${item.month}`} className="p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-gray-900">
                                                                {getMonthName(item.month)} {item.year}
                                                            </span>
                                                            <span className={`text-sm font-semibold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {netFlow >= 0 ? '+' : ''}{formatCompactCurrency(netFlow)}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-600">Purchases: </span>
                                                                <span className="font-medium text-red-600">{formatCompactCurrency(item.total)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Payments: </span>
                                                                <span className="font-medium text-green-600">{formatCompactCurrency(payments)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Financial Ratios</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Payment Coverage Ratio</span>
                                                    <span className="font-semibold text-gray-900">{paymentRatio.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${paymentRatio >= 80 ? 'bg-green-500' : paymentRatio >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(paymentRatio, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Outstanding Ratio</span>
                                                    <span className="font-semibold text-gray-900">{outstandingRatio.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${outstandingRatio <= 20 ? 'bg-green-500' : outstandingRatio <= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(outstandingRatio, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Inventory Turnover</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {totalStockValue > 0 ? (totalPurchase / totalStockValue).toFixed(1) : '0'}x
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Higher is better (stock moving faster)
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Working Capital Ratio</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {totalVendorDues > 0 ? (totalStockValue / totalVendorDues).toFixed(1) : '∞'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Stock value vs outstanding dues
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor Credit Analysis */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Vendor Credit Analysis</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available Credit</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {vendorDueSummary.map((vendor) => {
                                                    const utilization = vendor.credit_limit > 0 ? (vendor.current_balance / vendor.credit_limit) * 100 : 0;
                                                    const availableCredit = Math.max(0, vendor.credit_limit - vendor.current_balance);

                                                    return (
                                                        <tr key={vendor.name} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{vendor.name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(vendor.credit_limit)}</td>
                                                            <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(vendor.current_balance)}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-sm text-gray-600">{utilization.toFixed(0)}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(availableCredit)}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    utilization > 90 ? 'bg-red-100 text-red-800' :
                                                                    utilization > 80 ? 'bg-yellow-100 text-yellow-800' :
                                                                    utilization > 60 ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {utilization > 90 ? 'Critical' :
                                                                     utilization > 80 ? 'High' :
                                                                     utilization > 60 ? 'Medium' : 'Good'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => router.visit(route('medicine-vendors.index'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Manage Vendors</div>
                                <div className="text-sm text-gray-600">Add/edit suppliers</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.visit(route('medicine-corner.stock'))}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Eye className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-gray-900">View Stock</div>
                                <div className="text-sm text-gray-600">Inventory details</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
