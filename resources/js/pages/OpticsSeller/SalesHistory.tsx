import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Glasses
} from 'lucide-react';

interface OpticsSale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  patient?: {
    name: string;
    phone?: string;
    patient_id?: string;
  } | null;
  seller: {
    name: string;
  };
  total_amount: number;
  advance_payment: number;
  due_amount: number;
  status: 'pending' | 'ready' | 'delivered';
  created_at: string;
  items_count?: number;
}

interface SalesHistoryProps {
  sales: {
    data: OpticsSale[];
    links?: any[];
    meta?: {
      from?: number;
      to?: number;
      total?: number;
    };
  };
  totalSales: number;
  totalDue: number;
  salesCount: number;
  filters: {
    date_from?: string;
    date_to?: string;
    search?: string;
    status?: string;
    due?: string;
  };
}

export default function SalesHistory({ sales, totalSales, totalDue, salesCount, filters }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [dueFilter, setDueFilter] = useState(filters.due || '');

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
      year: 'numeric'
    });
  };

  const handleFilter = () => {
    router.get('/optics-seller/sales', {
      date_from: dateFrom,
      date_to: dateTo,
      search: searchTerm,
      status: statusFilter,
      due: dueFilter
    });
  };

  const handlePrint = () => {
    const printParams = new URLSearchParams({
      date_from: dateFrom || '',
      date_to: dateTo || '',
      search: searchTerm || '',
      status: statusFilter || '',
      due: dueFilter || '',
      export: 'print'
    });
    window.open(`/optics-seller/sales/export?${printParams.toString()}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout>
      <Head title="Optics Sales History" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optics Sales History</h1>
            <p className="text-gray-600 mt-1">Track your optics sales performance and transactions</p>
          </div>
          <Link
            href="/optics-seller/pos"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Glasses className="w-4 h-4" />
            New Sale
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalSales)}
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
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(totalDue)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {salesCount}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search invoice or patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Dues</option>
              <option value="with_due">With Due</option>
              <option value="no_due">No Due</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleFilter}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Patient Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Cash Receive</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sold By</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.data.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {sale.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.customer_phone || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      {formatCurrency(sale.advance_payment)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={sale.due_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(sale.due_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.seller.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/optics-seller/sales/${sale.id}`}
                        className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sales.data.length === 0 && (
            <div className="text-center py-12">
              <Glasses className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-600 mb-6">Start making sales to see them here.</p>
              <Link
                href="/optics-seller/pos"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Glasses className="w-4 h-4" />
                Make First Sale
              </Link>
            </div>
          )}

          {/* Pagination */}
          {sales.data.length > 0 && sales.links && sales.meta && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {sales.meta.from || 1} to {sales.meta.to || sales.data.length} of {sales.meta.total || sales.data.length} results
                </div>
                <div className="flex items-center space-x-2">
                  {sales.links.map((link: any, index: number) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-3 py-1 text-sm rounded ${
                        link.active
                          ? 'bg-blue-600 text-white'
                          : link.url
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
