import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MonthlyReportProps {
  report: {
    income: number;
    expense: number;
    profit: number;
    balance: number;
  };
  categoryExpenses: Record<string, number>;
  year: number;
  month: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  report,
  categoryExpenses,
  year,
  month
}) => {
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  const handleFilterChange = () => {
    router.get('/hospital-account/monthly-report', {
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

  return (
    <HospitalAccountLayout title="Monthly Report">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {months[month - 1]} {year} - Financial Report
        </h2>
        <p className="text-gray-600">Hospital Account Monthly Performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">৳{report.income.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expense</p>
              <p className="text-2xl font-bold text-red-600">৳{report.expense.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ৳{report.profit.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-blue-600">৳{report.balance.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Category-wise Expenses */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Category-wise Expenses</h3>
        </div>

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
                          ৳{amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                  ৳{totalCategoryExpenses.toLocaleString()}
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

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow-sm border mt-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Financial Summary</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Opening Balance</span>
            <span className="font-medium">৳{(report.balance - report.profit).toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-green-600">+ Total Income</span>
            <span className="font-medium text-green-600">৳{report.income.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-red-600">- Total Expenses</span>
            <span className="font-medium text-red-600">৳{report.expense.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 font-semibold text-lg">
            <span>Closing Balance</span>
            <span className={report.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
              ৳{report.balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </HospitalAccountLayout>
  );
};

export default MonthlyReport;
