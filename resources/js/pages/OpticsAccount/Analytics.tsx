import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Eye,
  Download,
  DollarSign
} from 'lucide-react';

interface MonthlyTrend {
  year: number;
  month: number;
  income: number;
  expense: number;
}

interface PurchaseVsSales {
  month: string;
  category: string;
  total: number;
}

interface TopExpenseCategory {
  category: string;
  amount: number;
  count: number;
}

interface ProductPerformance {
  sales: number;
  purchases: number;
  profit: number;
  margin: number;
}

interface AnalyticsProps {
  monthlyTrend: MonthlyTrend[];
  purchaseVsSales: PurchaseVsSales[];
  topExpenseCategories: TopExpenseCategory[];
  profitMargin: number;
  glassesPerformance: ProductPerformance;
  lensPerformance: ProductPerformance;
  year: number;
  month: number;
}

const Analytics: React.FC<AnalyticsProps> = ({
  monthlyTrend,
  purchaseVsSales,
  topExpenseCategories,
  profitMargin,
  glassesPerformance,
  lensPerformance,
  year,
  month
}) => {
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  // Format amount helper
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  // Get month name
  const getMonthName = (monthNum: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum - 1];
  };

  // Handle filter change
  const handleFilterChange = () => {
    router.get('/optics-account/analytics', {
      year: selectedYear,
      month: selectedMonth
    });
  };

  // Export report
  const handleExport = (type: string) => {
    router.post('/optics-account/export-report', {
      type: 'analytics',
      format: type,
      year: selectedYear,
      month: selectedMonth
    });
  };

  return (
    <OpticsAccountLayout title="Business Analytics">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Optics Business Analytics</h2>
          <p className="text-gray-600">Detailed insights into your optical business performance</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2020 + i} value={2020 + i}>
                  {2020 + i}
                </option>
              ))}
            </select>
            <button
              onClick={handleFilterChange}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Overall Profit Margin Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overall Profit Margin</h3>
            <p className="text-3xl font-bold">{formatPercentage(profitMargin)}</p>
            <p className="text-purple-200 mt-2">
              Based on total sales vs purchases
            </p>
          </div>
          <div className="text-right">
            <DollarSign className="w-16 h-16 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Product Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Glasses Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Glasses Performance</h3>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales:</span>
              <span className="font-semibold text-green-600">
                {formatAmount(glassesPerformance.sales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Purchases:</span>
              <span className="font-semibold text-red-600">
                {formatAmount(glassesPerformance.purchases)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-900 font-medium">Net Profit:</span>
              <span className={`font-bold ${
                glassesPerformance.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(glassesPerformance.profit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit Margin:</span>
              <span className={`font-semibold ${
                glassesPerformance.margin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(glassesPerformance.margin)}
              </span>
            </div>
          </div>
        </div>

        {/* Lens Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lens Performance</h3>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales:</span>
              <span className="font-semibold text-green-600">
                {formatAmount(lensPerformance.sales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Purchases:</span>
              <span className="font-semibold text-red-600">
                {formatAmount(lensPerformance.purchases)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-900 font-medium">Net Profit:</span>
              <span className={`font-bold ${
                lensPerformance.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(lensPerformance.profit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Profit Margin:</span>
              <span className={`font-semibold ${
                lensPerformance.margin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(lensPerformance.margin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Trend (Last 12 Months)</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-600">Month</th>
                <th className="text-right py-2 text-gray-600">Income</th>
                <th className="text-right py-2 text-gray-600">Expense</th>
                <th className="text-right py-2 text-gray-600">Profit</th>
                <th className="text-right py-2 text-gray-600">Trend</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((trend, index) => {
                const profit = trend.income - trend.expense;
                const isProfit = profit >= 0;

                return (
                  <tr key={`${trend.year}-${trend.month}`} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">
                      {getMonthName(trend.month)} {trend.year}
                    </td>
                    <td className="text-right py-3 text-green-600 font-semibold">
                      {formatAmount(trend.income)}
                    </td>
                    <td className="text-right py-3 text-red-600 font-semibold">
                      {formatAmount(trend.expense)}
                    </td>
                    <td className={`text-right py-3 font-bold ${
                      isProfit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(profit)}
                    </td>
                    <td className="text-right py-3">
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {monthlyTrend.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No monthly data available
          </div>
        )}
      </div>

      {/* Top Expense Categories */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Expense Categories - {getMonthName(month)} {year}
          </h3>
          <PieChart className="w-5 h-5 text-orange-500" />
        </div>

        <div className="space-y-4">
          {topExpenseCategories.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{category.category}</p>
                  <p className="text-sm text-gray-600">{category.count} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{formatAmount(category.amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {topExpenseCategories.length === 0 && (
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No expense data for this period</p>
          </div>
        )}
      </div>
    </OpticsAccountLayout>
  );
};

export default Analytics;
