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
  FileText
} from 'lucide-react';

interface SalesSummary {
  date: string;
  total_sales: number;
  sales_count: number;
}

interface TopMedicine {
  name: string;
  unit: string;
  total_quantity: number;
  total_amount: number;
}

interface MyReportProps {
  salesSummary: SalesSummary[];
  topMedicines: TopMedicine[];
  totalSales: number;
  totalTransactions: number;
  dateFrom: string;
  dateTo: string;
}

export default function MyReport({
  salesSummary,
  topMedicines,
  totalSales,
  totalTransactions,
  dateFrom,
  dateTo
}: MyReportProps) {
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

  const handleDateRangeChange = () => {
    router.get('/medicine-seller/my-report', {
      date_from: dateRange.from,
      date_to: dateRange.to
    });
  };

  const averageDailySales = salesSummary.length > 0 ? totalSales / salesSummary.length : 0;

  return (
    <AdminLayout>
      <Head title="My Sales Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Sales Report</h1>
            <p className="text-gray-600 mt-1">Analyze your personal sales performance</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {totalTransactions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {(salesSummary.length > 0 ? totalTransactions / salesSummary.length : 0).toFixed(1)}/day
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
                <p className="text-sm font-medium text-gray-600">Active Days</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {salesSummary.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Days with sales
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
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

          {/* Top Selling Medicines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Medicines</h2>
              <Package className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {topMedicines.slice(0, 10).map((medicine, index) => (
                <div key={medicine.name} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{medicine.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Qty: {medicine.total_quantity} {medicine.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 text-sm">
                        {formatCurrency(medicine.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {topMedicines.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No medicine sales data available</p>
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
              <div className="text-2xl font-bold text-purple-600">{topMedicines.length}</div>
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
