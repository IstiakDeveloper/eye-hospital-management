import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  Calendar,
  Award
} from 'lucide-react';

interface MonthlyReport {
  income: number;
  expense: number;
  profit: number;
  balance: number;
}

interface TopSellingFrame {
  item_id: number;
  total_sold: number;
  item?: {
    brand: string;
    model: string;
    full_name: string;
    selling_price: number;
  };
}

interface LowStockItem {
  id: number;
  brand?: string;
  model?: string;
  name?: string;
  stock_quantity: number;
  minimum_stock_level: number;
  full_name?: string;
}

interface ReportsProps {
  currentMonth: MonthlyReport;
  lastMonth: MonthlyReport;
  topSellingFrames: TopSellingFrame[];
  lowStockAlert: LowStockItem[];
}

const StatCard = ({ title, value, change, icon: Icon, color, isPositive }: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: string;
  isPositive?: boolean;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function Reports({ currentMonth, lastMonth, topSellingFrames, lowStockAlert }: ReportsProps) {
  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = calculateChange(currentMonth.income, lastMonth.income);
  const expenseChange = calculateChange(currentMonth.expense, lastMonth.expense);
  const profitChange = calculateChange(currentMonth.profit, lastMonth.profit);

  return (
    <AdminLayout>
      <Head title="Reports & Analytics" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary">
              <Calendar className="w-4 h-4" />
              <span>Custom Date</span>
            </Button>
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Monthly Performance */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Monthly Income"
              value={formatCurrency(currentMonth.income)}
              change={incomeChange}
              icon={TrendingUp}
              color="bg-green-500"
              isPositive={incomeChange >= 0}
            />
            <StatCard
              title="Monthly Expenses"
              value={formatCurrency(currentMonth.expense)}
              change={expenseChange}
              icon={TrendingDown}
              color="bg-red-500"
              isPositive={expenseChange < 0}
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(currentMonth.profit)}
              change={profitChange}
              icon={DollarSign}
              color={currentMonth.profit >= 0 ? 'bg-blue-500' : 'bg-red-500'}
              isPositive={profitChange >= 0}
            />
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Month-over-Month Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Current Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Last Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">Total Income</td>
                  <td className="py-3 px-4 text-right text-green-600 font-semibold">
                    {formatCurrency(currentMonth.income)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(lastMonth.income)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">Total Expenses</td>
                  <td className="py-3 px-4 text-right text-red-600 font-semibold">
                    {formatCurrency(currentMonth.expense)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(lastMonth.expense)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">Net Profit</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    <span className={currentMonth.profit >= 0 ? 'text-blue-600' : 'text-red-600'}>
                      {formatCurrency(currentMonth.profit)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(lastMonth.profit)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Frames */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Frames</h3>
              </div>
            </div>
            <div className="p-6">
              {topSellingFrames.length > 0 ? (
                <div className="space-y-4">
                  {topSellingFrames.map((frame, index) => (
                    <div key={frame.item_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {frame.item?.full_name || 'Unknown Frame'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {frame.item?.selling_price && formatCurrency(frame.item.selling_price)} per unit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{frame.total_sold} sold</p>
                        <p className="text-sm text-gray-500">
                          {frame.item?.selling_price && formatCurrency(frame.total_sold * frame.item.selling_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No sales data available</p>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {lowStockAlert.length} items
                </span>
              </div>
            </div>
            <div className="p-6">
              {lowStockAlert.length > 0 ? (
                <div className="space-y-3">
                  {lowStockAlert.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.full_name || item.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Current: {item.stock_quantity} | Min: {item.minimum_stock_level}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 font-medium text-sm">
                          {item.stock_quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {lowStockAlert.length > 8 && (
                    <Link
                      href="/optics/stock"
                      className="block text-center text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      View all {lowStockAlert.length} items
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-green-600 font-medium">All items are in good stock!</p>
                  <p className="text-sm text-gray-500">No immediate restocking needed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions & Reports</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/optics/frames/create" className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg p-4 text-center">
              <Package className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Add Frame</p>
            </Link>
            <Link href="/optics/stock/add" className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Add Stock</p>
            </Link>
            <Link href="/optics/sales/create" className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">New Sale</p>
            </Link>
            <Link href={route('optics.reports.daily-statement')} className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Bank Report</p>
            </Link>
            <Link href={route('optics.reports.account-statement')} className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Account Statement</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
