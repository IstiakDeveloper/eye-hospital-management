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
  FileSpreadsheet,
  Printer,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  patient: {
    name: string;
  } | null;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  total_profit: number;
  payment_status: string;
  items: any[];
  sold_by?: {
    name: string;
  };
}

interface SalesHistoryProps {
  sales: {
    data: Sale[];
    links: any[];
    meta: any;
  };
  totalSales: number;
  totalProfit: number;
  salesCount: number;
  filters: {
    date_from?: string;
    date_to?: string;
    payment_status?: string;
    search?: string;
    due?: string;
  };
}

export default function SalesHistory({ sales, totalSales, salesCount, filters }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
  const [dueFilter, setDueFilter] = useState(filters.due || '');
  const [showFilters, setShowFilters] = useState(false);

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
    router.get('/medicine-seller/sales', {
      date_from: dateFrom,
      date_to: dateTo,
      payment_status: paymentStatus,
      search: searchTerm,
      due: dueFilter
    }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const handlePrint = () => {
    const printParams = new URLSearchParams({
      date_from: dateFrom || '',
      date_to: dateTo || '',
      payment_status: paymentStatus || '',
      search: searchTerm || '',
      due: dueFilter || '',
      export: 'print'
    });
    window.open(`/medicine-seller/sales/export?${printParams.toString()}`, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPaymentStatus('');
    setDueFilter('');
    router.get('/medicine-seller/sales');
  };

  const handleExport = (type: 'pdf' | 'excel' | 'print') => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      payment_status: paymentStatus,
      search: searchTerm,
      export: type
    });

    window.open(`/medicine-seller/sales/export?${params.toString()}`, '_blank');
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
      <Head title="Sales History" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
            <p className="text-gray-600 mt-1">Track your sales performance and transactions</p>
          </div>
          <Link
            href="/medicine-seller/pos"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
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
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {salesCount}
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
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salesCount > 0 ? totalSales / salesCount : 0)}
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
                  placeholder="Search invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
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
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Cash Receive</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sold By</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.data.map((sale) => {
                  const dueAmount = sale.total_amount - sale.paid_amount;
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {sale.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sale.customer_name || sale.patient?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sale.customer_phone || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {formatCurrency(sale.paid_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        <span className={dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(dueAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sale.sold_by?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/medicine-seller/sales/${sale.id}`}
                          className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sales.data.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || dateFrom || dateTo || paymentStatus || dueFilter
                  ? 'Try adjusting your filters'
                  : 'Start making sales to see them here'}
              </p>
              {(searchTerm || dateFrom || dateTo || paymentStatus || dueFilter) ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/medicine-seller/pos"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Make First Sale
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {sales.data.length > 0 && (sales.links || sales.meta) && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing <span className="font-medium text-gray-900">{sales.meta?.from || 1}</span> to{' '}
                  <span className="font-medium text-gray-900">{sales.meta?.to || sales.data.length}</span> of{' '}
                  <span className="font-medium text-gray-900">{sales.meta?.total || sales.data.length}</span> results
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sales.links && sales.links.map((link: any, index: number) => {
                  if (link.url === null) return null;

                  const isActive = link.active;
                  const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                  const isNext = link.label.includes('Next') || link.label.includes('&raquo;');

                  return (
                    <Link
                      key={index}
                      href={link.url}
                      preserveState
                      preserveScroll
                      className={`inline-flex items-center justify-center min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {isPrev && <ChevronLeft className="w-4 h-4" />}
                      {!isPrev && !isNext && <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                      {isNext && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
