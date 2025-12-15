import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  Glasses
} from 'lucide-react';

interface Sale {
  id: number;
  invoice_number: string;
  patient_name: string;
  patient_phone: string;
  total_amount: number;
  due_amount: number;
  status: 'pending' | 'ready' | 'delivered';
  created_at: string;
}

interface DashboardProps {
  todaySales: number;
  todayDue: number;
  todaySalesCount: number;
  monthSales: number;
  monthDue: number;
  accountBalance: number;
  salesGrowth: number;
  pendingCount: number;
  pendingReadyCount: number;
  recentSales: Sale[];
  lowStockFrames: any[];
  lowStockCompleteGlasses: any[];
  lowStockLenses: any[];
  topSellingItems: any[];
}

export default function Dashboard({
  todaySales,
  todayDue,
  todaySalesCount,
  monthSales,
  monthDue,
  accountBalance,
  salesGrowth,
  pendingCount,
  pendingReadyCount,
  recentSales,
  lowStockFrames,
  lowStockCompleteGlasses,
  lowStockLenses,
  topSellingItems
}: DashboardProps) {
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const lowStockCount = lowStockFrames.length + lowStockCompleteGlasses.length + lowStockLenses.length;

  return (
    <AdminLayout>
      <Head title="Optics Seller Dashboard" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optics Sales Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your optics sales performance and manage transactions</p>
          </div>
          <Link
            href="/optics-seller/pos"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            New Sale
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(todaySales)}
                </p>
                <div className="flex items-center mt-2">
                  {salesGrowth >= 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(salesGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Due</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(todayDue)}
                </p>
                <p className="text-sm text-gray-500 mt-2">{todaySalesCount} transactions</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(monthSales)}
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  Due: {formatCurrency(monthDue)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {pendingCount + pendingReadyCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {pendingCount} Pending • {pendingReadyCount} Ready
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
              <Link href="/optics-seller/sales" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSales.slice(0, 5).map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/optics-seller/sales/${sale.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sale.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {sale.patient_name} • {sale.patient_phone} • {formatDate(sale.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        sale.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            {/* Top Selling Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Top Selling</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {topSellingItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.total_quantity} {item.unit}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(item.total_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {lowStockCount > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <p className="text-sm font-medium text-red-800">
                          {lowStockCount} Low Stock Items
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-red-700">
                        {lowStockFrames.length > 0 && <p>• {lowStockFrames.length} Frames</p>}
                        {lowStockCompleteGlasses.length > 0 && <p>• {lowStockCompleteGlasses.length} Complete Glasses</p>}
                        {lowStockLenses.length > 0 && <p>• {lowStockLenses.length} Lenses</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No inventory alerts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
