import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  BarChart3,
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  Package,
  Activity,
  Download,
  FileText,
  Glasses,
  Eye
} from 'lucide-react';

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

export default function MyReport({
  salesSummary,
  topItems,
  totalSales,
  totalProfit,
  totalTransactions,
  dateFrom,
  dateTo
}: MyReportProps) {
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
      month: 'short'
    });
  };

  const handleDateRangeChange = () => {
    router.get('/optics-seller/my-report', {
      date_from: dateRange.from,
      date_to: dateRange.to
    });
  };

  const averageDailySales = salesSummary.length > 0 ? totalSales / salesSummary.length : 0;
  const averageDailyProfit = salesSummary.length > 0 ? totalProfit / salesSummary.length : 0;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'glasses':
        return <Glasses className="w-4 h-4 text-blue-600" />;
      case 'complete_glasses':
        return <Eye className="w-4 h-4 text-green-600" />;
      case 'lens_types':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Optics Sales Report</h1>
            <p className="text-gray-600 mt-1">Analyze your personal optics sales performance</p>
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
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalSales)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {formatCurrency(averageDailySales)}/day
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
                <p className="text-sm font-medium text-gray-600">Estimated Profit</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {formatCurrency(averageDailyProfit)}/day
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalTransactions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {(salesSummary.length > 0 ? totalTransactions / salesSummary.length : 0).toFixed(1)}/day
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Estimated margin
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Daily Performance</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {salesSummary.slice(0, 15).map((item) => {
                const maxValue = Math.max(...salesSummary.map(s => s.total_sales));
                const percentage = maxValue > 0 ? (item.total_sales / maxValue) * 100 : 0;

                return (
                  <div key={item.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{formatDate(item.date)}</span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(item.total_sales)}</span>
                        <span className="text-gray-500 text-xs ml-2">({item.sales_count} sales)</span>
                      </div>
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

              {salesSummary.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No sales data available for selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Items</h2>
              <Package className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {topItems.slice(0, 10).map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getItemTypeIcon(item.item_type)}
                          <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Type: {getItemTypeName(item.item_type)}</span>
                          <span>Qty: {item.total_quantity} {item.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 text-sm">
                        {formatCurrency(item.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {topItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{salesSummary.length}</div>
              <div className="text-sm text-gray-600 mt-1">Active Days</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(0) : '0'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Sale Value</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{topItems.length}</div>
              <div className="text-sm text-gray-600 mt-1">Products Sold</div>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {salesSummary.length > 0 ? Math.max(...salesSummary.map(s => s.sales_count)) : '0'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Best Day Sales</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
