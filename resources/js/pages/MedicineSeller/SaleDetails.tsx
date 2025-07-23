import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Printer
} from 'lucide-react';

interface SaleItem {
  id: number;
  quantity: number;
  unit_price: number;
  buy_price: number;
  total_price: number;
  profit: number;
  medicine_stock: {
    batch_number: string;
    medicine: {
      name: string;
      generic_name: string;
      unit: string;
    };
  };
}

interface Sale {
  id: number;
  invoice_number: string;
  patient: {
    name: string;
    phone: string;
    email: string;
  } | null;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  total_profit: number;
  payment_status: string;
  sold_by: {
    name: string;
  };
  items: SaleItem[];
  created_at: string;
}

interface SaleDetailsProps {
  sale: Sale;
}

export default function SaleDetails({ sale }: SaleDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <AdminLayout>
      <Head title={`Sale Details - ${sale.invoice_number}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/medicine-seller/sales"
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sale.invoice_number}</h1>
              <p className="text-gray-600 mt-1">Sale transaction details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.payment_status)}`}>
              {sale.payment_status}
            </span>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Sale Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {sale.patient?.name || 'Walk-in Customer'}
                      </span>
                    </div>
                    {sale.patient?.phone && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-gray-400">📞</span>
                        <span className="text-sm text-gray-900">{sale.patient.phone}</span>
                      </div>
                    )}
                    {sale.patient?.email && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-gray-400">✉️</span>
                        <span className="text-sm text-gray-900">{sale.patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Sale Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(sale.sale_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">Sold by: {sale.sold_by.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{sale.items.length} items</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Items Sold</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.medicine_stock.medicine.name}
                            </div>
                            {item.medicine_stock.medicine.generic_name && (
                              <div className="text-sm text-gray-500">
                                {item.medicine_stock.medicine.generic_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.medicine_stock.batch_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item.quantity} {item.medicine_stock.medicine.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(item.unit_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.total_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(item.profit)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            {/* Payment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(sale.subtotal)}</span>
                </div>

                {sale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(sale.discount)}</span>
                  </div>
                )}

                {sale.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium text-gray-900">+{formatCurrency(sale.tax)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(sale.paid_amount)}</span>
                </div>

                {sale.due_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Amount:</span>
                    <span className="font-medium text-red-600">{formatCurrency(sale.due_amount)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Profit:</span>
                    <span className="text-base font-bold text-green-600">{formatCurrency(sale.total_profit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Items Sold</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{sale.items.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Profit Margin</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {((sale.total_profit / sale.total_amount) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Sale Date</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(sale.sale_date).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
