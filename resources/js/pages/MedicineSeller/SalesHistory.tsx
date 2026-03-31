import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, DollarSign, Download, Eye, FileText, Filter, Search, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';

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
            year: 'numeric',
        });
    };

    const handleFilter = () => {
        router.get(
            '/medicine-seller/sales',
            {
                date_from: dateFrom,
                date_to: dateTo,
                payment_status: paymentStatus,
                search: searchTerm,
                due: dueFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePrint = () => {
        const printParams = new URLSearchParams({
            date_from: dateFrom || '',
            date_to: dateTo || '',
            payment_status: paymentStatus || '',
            search: searchTerm || '',
            due: dueFilter || '',
            export: 'print',
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
            export: type,
        });

        window.open(`/medicine-seller/sales/export?${params.toString()}`, '_blank');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            default:
                return 'bg-red-100 text-red-800 border-red-200';
        }
    };

    return (
        <AdminLayout>
            <Head title="Sales History" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
                        <p className="mt-1 text-gray-600">Track your sales performance and transactions</p>
                    </div>
                    <Link
                        href="/medicine-seller/pos"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        <FileText className="h-4 w-4" />
                        New Sale
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{salesCount}</p>
                            </div>
                            <div className="rounded-lg bg-green-100 p-3">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {formatCurrency(salesCount > 0 ? totalSales / salesCount : 0)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        <div className="min-w-[200px] flex-1">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search invoice or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <select
                            value={dueFilter}
                            onChange={(e) => setDueFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Dues</option>
                            <option value="with_due">With Due</option>
                            <option value="no_due">No Due</option>
                        </select>

                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="To Date"
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleFilter}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-800"
                        >
                            <Download className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>

                {/* Sales Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
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
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sales.data.map((sale) => {
                                    const dueAmount = sale.total_amount - sale.paid_amount;
                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-blue-600">{sale.invoice_number}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {sale.customer_name || sale.patient?.name || 'Walk-in Customer'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_phone || 'N/A'}</td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                                {formatCurrency(sale.total_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                                                {formatCurrency(sale.paid_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold">
                                                <span className={dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(dueAmount)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{sale.sold_by?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={`/medicine-seller/sales/${sale.id}`}
                                                    className="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
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
                        <div className="py-12 text-center">
                            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No sales found</h3>
                            <p className="mb-6 text-gray-600">
                                {searchTerm || dateFrom || dateTo || paymentStatus || dueFilter
                                    ? 'Try adjusting your filters'
                                    : 'Start making sales to see them here'}
                            </p>
                            {searchTerm || dateFrom || dateTo || paymentStatus || dueFilter ? (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    <X className="h-4 w-4" />
                                    Clear Filters
                                </button>
                            ) : (
                                <Link
                                    href="/medicine-seller/pos"
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    <FileText className="h-4 w-4" />
                                    Make First Sale
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {sales.data.length > 0 && (sales.links || sales.meta) && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                    Showing <span className="font-medium text-gray-900">{sales.meta?.from || 1}</span> to{' '}
                                    <span className="font-medium text-gray-900">{sales.meta?.to || sales.data.length}</span> of{' '}
                                    <span className="font-medium text-gray-900">{sales.meta?.total || sales.data.length}</span> results
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {sales.links &&
                                    sales.links.map((link: any, index: number) => {
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
                                                className={`inline-flex min-w-[40px] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isPrev && <ChevronLeft className="h-4 w-4" />}
                                                {!isPrev && !isNext && <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                                                {isNext && <ChevronRight className="h-4 w-4" />}
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
