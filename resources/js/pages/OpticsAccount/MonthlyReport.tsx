import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Glasses, Eye } from 'lucide-react';

interface MonthlyReportProps {
  report: {
    income: number;
    expense: number;
    profit: number;
    balance: number;
  };
  categoryExpenses: Record<string, number>;
  glassesPurchases: number;
  glassesSales: number;
  lensPurchases: number;
  lensSales: number;
  year: number;
  month: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  report,
  categoryExpenses,
  glassesPurchases,
  glassesSales,
  lensPurchases,
  lensSales,
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
    router.get('/optics-account/monthly-report', {
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

  const categoryExpenseEntries = Object.entries(categoryExpenses);
  const totalCategoryExpenses = categoryExpenseEntries.reduce((sum, [, amount]) => sum + amount, 0);

  // Calculate metrics
  const glassesProfit = glassesSales - glassesPurchases;
  const lensProfit = lensSales - lensPurchases;
  const totalProductSales = glassesSales + lensSales;
  const totalProductPurchases = glassesPurchases + lensPurchases;
  const productProfitMargin = totalProductSales > 0 ? ((totalProductSales - totalProductPurchases) / totalProductSales) * 100 : 0;

  return (
    <OpticsAccountLayout title="Monthly Report">
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {months[month - 1]} {year} - Optics Financial Report
        </h2>
        <p className="text-gray-600">Optics Account Monthly Performance & Optical Business Analytics</p>
      </div>

      {/* Product Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Glasses Sales</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(glassesSales)}</p>
            </div>
            <Glasses className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lens Sales</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(lensSales)}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Glasses Purchase</p>
              <p className="text-2xl font-bold text-orange-600">{formatAmount(glassesPurchases)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lens Purchase</p>
              <p className="text-2xl font-bold text-purple-600">{formatAmount(lensPurchases)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(report.profit)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(report.balance)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Product Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Product Performance Analysis</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Glasses Performance */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Glasses className="w-4 h-4 mr-2 text-green-600" />
                Glasses Business
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Sales Revenue</span>
                  <span className="text-green-600 font-medium">{formatAmount(glassesSales)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Purchase Cost</span>
                  <span className="text-orange-600 font-medium">{formatAmount(glassesPurchases)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-semibold">
                  <span>Glasses Profit</span>
                  <span className={glassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(glassesProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className={`font-medium ${glassesSales > 0 && glassesProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {glassesSales > 0 ? ((glassesProfit / glassesSales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Lens Performance */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-blue-600" />
                Lens Business
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Sales Revenue</span>
                  <span className="text-blue-600 font-medium">{formatAmount(lensSales)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Purchase Cost</span>
                  <span className="text-purple-600 font-medium">{formatAmount(lensPurchases)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-semibold">
                  <span>Lens Profit</span>
                  <span className={lensProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(lensProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className={`font-medium ${lensSales > 0 && lensProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {lensSales > 0 ? ((lensProfit / lensSales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category-wise Expenses */}
        <div className="bg-white rounded-lg shadow-sm border">

          {categoryExpenseEntries.length > 0 ? (
            <div className="p-6">
              <div className="space-y-4">
                {categoryExpenseEntries.map(([category, amount]) => {
                  const percentage = totalCategoryExpenses > 0 ? (amount / totalCategoryExpenses) * 100 : 0;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {category || 'Uncategorized'}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(amount)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total Expenses</span>
                  <span className="text-base font-semibold text-red-600">
                    {formatAmount(totalCategoryExpenses)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No expenses recorded for this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Optics Account Financial Summary</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Opening Balance</span>
            <span className="font-medium">{formatAmount(report.balance - report.profit)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-green-600">+ Glasses Sales Revenue</span>
            <span className="font-medium text-green-600">{formatAmount(glassesSales)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-blue-600">+ Lens Sales Revenue</span>
            <span className="font-medium text-blue-600">{formatAmount(lensSales)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-orange-600">- Glasses Purchases</span>
            <span className="font-medium text-orange-600">{formatAmount(glassesPurchases)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-purple-600">- Lens Purchases</span>
            <span className="font-medium text-purple-600">{formatAmount(lensPurchases)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-red-600">- Other Expenses</span>
            <span className="font-medium text-red-600">{formatAmount(report.expense - totalProductPurchases)}</span>
          </div>

          <div className="flex justify-between py-2 font-semibold text-lg">
            <span>Closing Balance</span>
            <span className={report.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatAmount(report.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-white rounded-lg shadow-sm border mt-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Business Insights</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Product Performance</h4>
              <p className="text-sm text-purple-700">
                {glassesSales > lensSales ?
                  `Glasses are your top performer this month, generating ${formatAmount(glassesSales)} vs ${formatAmount(lensSales)} from lenses.` :
                  lensSales > glassesSales ?
                  `Lenses are outperforming glasses this month, generating ${formatAmount(lensSales)} vs ${formatAmount(glassesSales)} from glasses.` :
                  'Glasses and lens sales are balanced this month.'
                }
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Profit Analysis</h4>
              <p className="text-sm text-blue-700">
                {productProfitMargin > 25 ? 'Excellent profit margins! Your optics business is highly profitable.' :
                 productProfitMargin > 15 ? 'Good profit margins. Consider optimizing costs for better returns.' :
                 productProfitMargin > 5 ? 'Fair profit margins. Focus on premium products or cost reduction.' :
                 'Low profit margins. Review pricing strategy and supplier costs.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </OpticsAccountLayout>
  );
};

export default MonthlyReport;
