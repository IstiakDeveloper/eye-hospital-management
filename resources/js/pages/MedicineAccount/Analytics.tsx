import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, Target } from 'lucide-react';

interface AnalyticsProps {
  monthlyTrend: Array<{
    year: number;
    month: number;
    income: number;
    expense: number;
  }>;
  purchaseVsSales: Array<{
    month: string;
    category: string;
    total: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  profitMargin: number;
  year: number;
  month: number;
}

const Analytics: React.FC<AnalyticsProps> = ({
  monthlyTrend,
  purchaseVsSales,
  topExpenseCategories,
  profitMargin,
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

  const handleFilterChange = () => {
    router.get('/medicine-account/analytics', {
      year: selectedYear,
      month: selectedMonth
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Process purchase vs sales data
  const salesData = purchaseVsSales.filter(item => item.category === 'medicine_sale');
  const purchaseData = purchaseVsSales.filter(item => item.category === 'medicine_purchase');

  // Calculate trend metrics
  const latestTrend = monthlyTrend[0];
  const previousTrend = monthlyTrend[1];
  const incomeGrowth = previousTrend ? ((latestTrend?.income - previousTrend.income) / previousTrend.income) * 100 : 0;
  const expenseGrowth = previousTrend ? ((latestTrend?.expense - previousTrend.expense) / previousTrend.expense) * 100 : 0;

  return (
    <MedicineAccountLayout title="Business Analytics">
      {/* Date Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {months.map((monthName, index) => (
              <option key={index} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {years.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>

          <button
            onClick={handleFilterChange}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Update Analytics
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
              <p className={`text-2xl font-bold ${incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {incomeGrowth.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expense Growth</p>
              <p className={`text-2xl font-bold ${expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseGrowth.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{topExpenseCategories.length}</p>
            </div>
            <PieChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Monthly Income vs Expense Trend</h3>
            <p className="text-sm text-gray-600">Last 12 months performance</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {monthlyTrend.slice(0, 6).map((item, index) => {
                const monthName = months[item.month - 1];
                const profit = item.income - item.expense;
                const maxAmount = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)));

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{monthName} {item.year}</span>
                      <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(profit)}
                      </span>
                    </div>

                    <div className="relative">
                      {/* Income Bar */}
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-green-600 w-16">Income:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(item.income / maxAmount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-20 text-right">
                          {formatAmount(item.income)}
                        </span>
                      </div>

                      {/* Expense Bar */}
                      <div className="flex items-center">
                        <span className="text-xs text-red-600 w-16">Expense:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(item.expense / maxAmount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-20 text-right">
                          {formatAmount(item.expense)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Purchase vs Sales Comparison */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Medicine Purchase vs Sales</h3>
            <p className="text-sm text-gray-600">Monthly comparison over last 6 months</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {salesData.slice(0, 6).map((sale, index) => {
                const purchase = purchaseData.find(p => p.month === sale.month);
                const profit = sale.total - (purchase?.total || 0);
                const maxAmount = Math.max(sale.total, purchase?.total || 0);

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{sale.month}</span>
                      <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Profit: {formatAmount(profit)}
                      </span>
                    </div>

                    <div className="relative">
                      {/* Sales Bar */}
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-green-600 w-16">Sales:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${maxAmount > 0 ? (sale.total / maxAmount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-20 text-right">
                          {formatAmount(sale.total)}
                        </span>
                      </div>

                      {/* Purchase Bar */}
                      <div className="flex items-center">
                        <span className="text-xs text-orange-600 w-16">Purchase:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${maxAmount > 0 ? ((purchase?.total || 0) / maxAmount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-20 text-right">
                          {formatAmount(purchase?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Expense Categories */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Top Expense Categories</h3>
          <p className="text-sm text-gray-600">Breakdown by category for {months[month - 1]} {year}</p>
        </div>

        <div className="p-6">
          {topExpenseCategories.length > 0 ? (
            <div className="space-y-4">
              {topExpenseCategories.map((category, index) => {
                const maxAmount = Math.max(...topExpenseCategories.map(c => c.amount));
                const percentage = maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                        <span className="text-xs text-gray-500 ml-2">({category.count} transactions)</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {formatAmount(category.amount)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No expense data available for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Business Insights</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Profitability</h4>
              <p className="text-sm text-green-700">
                {profitMargin > 25 ? 'Excellent profit margin! Your business is highly profitable.' :
                 profitMargin > 15 ? 'Good profit margin. Consider optimizing costs for better returns.' :
                 profitMargin > 5 ? 'Fair profit margin. Focus on increasing sales or reducing costs.' :
                 'Low profit margin. Review pricing strategy and cost management.'}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Growth Trend</h4>
              <p className="text-sm text-blue-700">
                {incomeGrowth > 10 ? 'Strong revenue growth! Maintain current strategies.' :
                 incomeGrowth > 0 ? 'Positive growth trend. Look for acceleration opportunities.' :
                 'Revenue declining. Consider marketing and customer retention strategies.'}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Cost Management</h4>
              <p className="text-sm text-purple-700">
                {expenseGrowth < 0 ? 'Great cost control! Expenses are decreasing.' :
                 expenseGrowth < incomeGrowth ? 'Good expense management relative to income growth.' :
                 'Expenses growing faster than income. Review cost optimization.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MedicineAccountLayout>
  );
};

export default Analytics;
