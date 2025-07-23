import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    BarChart3,
    TrendingUp,
    Download,
    Calendar as CalendarIcon,
    Package,
    DollarSign,
    PieChart,
    Activity,
    FileText
} from 'lucide-react';

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

interface StockValuation {
    name: string;
    total_stock: number;
    total_value: number;
    average_price: number;
}

interface MonthlyTrend {
    year: number;
    month: number;
    total: number;
}

interface ReportsPageProps {
    purchaseSummary: PurchaseSummary[];
    topPurchased: TopPurchased[];
    stockValuation: StockValuation[];
    monthlyTrend: MonthlyTrend[];
    dateFrom: string;
    dateTo: string;
    totalPurchase: number;
}

export default function Reports({
    purchaseSummary,
    topPurchased,
    stockValuation,
    monthlyTrend,
    dateFrom,
    dateTo,
    totalPurchase
}: ReportsPageProps) {
    const [dateRange, setDateRange] = useState({ from: dateFrom, to: dateTo });

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short'
        });
    };

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    const handleDateRangeChange = () => {
        router.get('/medicine-corner/reports', {
            date_from: dateRange.from,
            date_to: dateRange.to
        });
    };

    return (
        <AdminLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">Comprehensive insights into your medicine inventory</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(totalPurchase)}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Purchase Orders</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {purchaseSummary.reduce((sum, item) => sum + item.count, 0)}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(stockValuation.reduce((sum, item) => sum + item.total_value, 0))}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Daily Purchase</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(purchaseSummary.length > 0 ? totalPurchase / purchaseSummary.length : 0)}
                                </p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <Activity className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Purchase Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Daily Purchase Trend</h2>
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                            {purchaseSummary.slice(0, 10).map((item) => (
                                <div key={item.date} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatDate(item.date)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.count} orders
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(item.total / Math.max(...purchaseSummary.map(p => p.total))) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900 w-20 text-right">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Purchased Medicines */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Top Purchased Medicines</h2>
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                            {topPurchased.slice(0, 8).map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.total_quantity} units
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

                {/* Monthly Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Monthly Purchase Trend</h2>
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {monthlyTrend.slice(0, 12).map((item) => (
                            <div key={`${item.year}-${item.month}`} className="text-center">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(item.total).replace('৳', '৳')}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {getMonthName(item.month)} {item.year}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Valuation Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Stock Valuation</h2>
                            <PieChart className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medicine
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Qty
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Avg. Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        % of Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stockValuation.slice(0, 15).map((item) => {
                                    const totalStockValue = stockValuation.reduce((sum, val) => sum + val.total_value, 0);
                                    const percentage = totalStockValue > 0 ? (item.total_value / totalStockValue) * 100 : 0;

                                    return (
                                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
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
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
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
                </div>
            </div>
        </AdminLayout>
    );
}
