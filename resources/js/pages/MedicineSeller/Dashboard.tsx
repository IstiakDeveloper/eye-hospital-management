// resources/js/Pages/MedicineSeller/Dashboard.tsx

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
  ArrowDown
} from 'lucide-react';

interface DashboardProps {
  todaySales: number;
  todaySalesCount: number;
  monthSales: number;
  pendingPayments: number;
  salesGrowth: number;
  recentSales: any[];
  lowStockMedicines: any[];
  expiringMedicines: any[];
  topSellingMedicines: any[];
}

export default function Dashboard({
  todaySales,
  todaySalesCount,
  monthSales,
  pendingPayments,
  salesGrowth,
  recentSales,
  lowStockMedicines,
  expiringMedicines,
  topSellingMedicines
}: DashboardProps) {
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
    }).format(amount);
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

  return (
    <AdminLayout>
      <Head title="Medicine Seller Dashboard" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your sales performance and manage transactions</p>
          </div>
          <Link
            href="/medicine-seller/pos"
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
                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {todaySalesCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">Total transactions</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
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
                <p className="text-sm text-gray-500 mt-2">
                  This month total
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
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {formatCurrency(pendingPayments)}
                </p>
                <Link href="/medicine-seller/sales?payment_status=partial" className="text-sm text-amber-600 hover:underline mt-2 inline-block">
                  View Details
                </Link>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
              <Link href="/medicine-seller/sales" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sale.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {sale.patient?.name || 'Walk-in Customer'} • {formatDate(sale.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sale.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sale.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            {/* Top Selling Medicines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Top Selling</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {topSellingMedicines.slice(0, 5).map((medicine, index) => (
                    <div key={medicine.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{medicine.name}</p>
                          <p className="text-xs text-gray-500">{medicine.total_quantity} {medicine.unit}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(medicine.total_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {lowStockMedicines.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <p className="text-sm font-medium text-red-800">
                          {lowStockMedicines.length} Low Stock Items
                        </p>
                      </div>
                    </div>
                  )}
                  {expiringMedicines.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800">
                          {expiringMedicines.length} Expiring Soon
                        </p>
                      </div>
                    </div>
                  )}
                  {lowStockMedicines.length === 0 && expiringMedicines.length === 0 && (
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
