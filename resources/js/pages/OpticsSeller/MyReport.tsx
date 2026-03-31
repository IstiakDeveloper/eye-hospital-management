import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { Activity, BarChart3, Calendar as CalendarIcon, DollarSign, Download, Eye, FileText, Glasses, Package, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface SalesSummary {
    date: string;
    total_sales: number;
    sales_count: number;
}

interface TopItem {
    name: string;
    item_type: string;
    total_quantity: number;
    total_amount: number;
    unit: string;
}

interface MyReportProps {
    salesSummary: SalesSummary[];
    topItems: TopItem[];
    totalSales: number;
    totalProfit: number;
    totalTransactions: number;
    dateFrom: string;
    dateTo: string;
}

export default function MyReport({ salesSummary, topItems, totalSales, totalProfit, totalTransactions, dateFrom, dateTo }: MyReportProps) {
    const [dateRange, setDateRange] = useState({ from: dateFrom, to: dateTo });

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
        });
    };

    const handleDateRangeChange = () => {
        router.get('/optics-seller/my-report', {
            date_from: dateRange.from,
            date_to: dateRange.to,
        });
    };

    const averageDailySales = salesSummary.length > 0 ? totalSales / salesSummary.length : 0;
    const averageDailyProfit = salesSummary.length > 0 ? totalProfit / salesSummary.length : 0;
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    const getItemTypeIcon = (itemType: string) => {
        switch (itemType) {
            case 'glasses':
                return <Glasses className="h-4 w-4 text-blue-600" />;
            case 'complete_glasses':
                return <Eye className="h-4 w-4 text-green-600" />;
            case 'lens_types':
                return <Package className="h-4 w-4 text-purple-600" />;
            default:
                return <Package className="h-4 w-4 text-gray-600" />;
        }
    };

    const getItemTypeName = (itemType: string) => {
        switch (itemType) {
            case 'glasses':
                return 'Frame';
            case 'complete_glasses':
                return 'Complete Glasses';
            case 'lens_types':
                return 'Lens';
            default:
                return 'Item';
        }
    };

    return (
        <AdminLayout>
            <Head title="My Optics Sales Report" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Optics Sales Report</h1>
                        <p className="mt-1 text-gray-600">Analyze your personal optics sales performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Date Range:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleDateRangeChange}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                                <p className="mt-1 text-sm text-gray-500">Avg: {formatCurrency(averageDailySales)}/day</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Estimated Profit</p>
                                <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
                                <p className="mt-1 text-sm text-gray-500">Avg: {formatCurrency(averageDailyProfit)}/day</p>
                            </div>
                            <div className="rounded-lg bg-green-100 p-3">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{totalTransactions}</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Avg: {(salesSummary.length > 0 ? totalTransactions / salesSummary.length : 0).toFixed(1)}/day
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">{profitMargin.toFixed(1)}%</p>
                                <p className="mt-1 text-sm text-gray-500">Estimated margin</p>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <Activity className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Daily Sales Chart */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Daily Performance</h2>
                            <BarChart3 className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="max-h-80 space-y-4 overflow-y-auto">
                            {salesSummary.slice(0, 15).map((item) => {
                                const maxValue = Math.max(...salesSummary.map((s) => s.total_sales));
                                const percentage = maxValue > 0 ? (item.total_sales / maxValue) * 100 : 0;

                                return (
                                    <div key={item.date} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-900">{formatDate(item.date)}</span>
                                            <div className="text-right">
                                                <span className="font-semibold text-gray-900">{formatCurrency(item.total_sales)}</span>
                                                <span className="ml-2 text-xs text-gray-500">({item.sales_count} sales)</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-200">
                                            <div
                                                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}

                            {salesSummary.length === 0 && (
                                <div className="py-8 text-center">
                                    <BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p className="text-gray-500">No sales data available for selected period</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Selling Items */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Top Selling Items</h2>
                            <Package className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="max-h-80 space-y-4 overflow-y-auto">
                            {topItems.slice(0, 10).map((item, index) => (
                                <div key={index} className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    {getItemTypeIcon(item.item_type)}
                                                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>Type: {getItemTypeName(item.item_type)}</span>
                                                    <span>
                                                        Qty: {item.total_quantity} {item.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600">{formatCurrency(item.total_amount)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {topItems.length === 0 && (
                                <div className="py-8 text-center">
                                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p className="text-gray-500">No items sales data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-gray-900">Performance Insights</h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-blue-50 p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{salesSummary.length}</div>
                            <div className="mt-1 text-sm text-gray-600">Active Days</div>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(0) : '0'}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">Avg Sale Value</div>
                        </div>

                        <div className="rounded-lg bg-purple-50 p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{topItems.length}</div>
                            <div className="mt-1 text-sm text-gray-600">Products Sold</div>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-4 text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {salesSummary.length > 0 ? Math.max(...salesSummary.map((s) => s.sales_count)) : '0'}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">Best Day Sales</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
