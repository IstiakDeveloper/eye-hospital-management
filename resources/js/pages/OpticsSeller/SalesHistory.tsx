import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Download, Eye, FileText, Filter, Glasses, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';

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
            year: 'numeric',
        });
    };

    const handleFilter = () => {
        router.get('/optics-seller/sales', {
            date_from: dateFrom,
            date_to: dateTo,
            search: searchTerm,
            status: statusFilter,
            due: dueFilter,
        });
    };

    const handlePrint = () => {
        const printParams = new URLSearchParams({
            date_from: dateFrom || '',
            date_to: dateTo || '',
            search: searchTerm || '',
            status: statusFilter || '',
            due: dueFilter || '',
            export: 'print',
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
                        <p className="mt-1 text-gray-600">Track your optics sales performance and transactions</p>
                    </div>
                    <Link
                        href="/optics-seller/pos"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        <Glasses className="h-4 w-4" />
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
                                <p className="text-sm font-medium text-gray-600">Total Due</p>
                                <p className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(totalDue)}</p>
                            </div>
                            <div className="rounded-lg bg-orange-100 p-3">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transactions</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{salesCount}</p>
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
                                    placeholder="Search invoice or patient..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Patient Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Mobile</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Cash Receive</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Due</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sold By</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sales.data.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{sale.invoice_number}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{sale.customer_name || 'Walk-in Customer'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{sale.customer_phone || 'N/A'}</td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                            {formatCurrency(sale.total_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                                            {formatCurrency(sale.advance_payment)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold">
                                            <span className={sale.due_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                                {formatCurrency(sale.due_amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{sale.seller.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Link
                                                href={`/optics-seller/sales/${sale.id}`}
                                                className="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {sales.data.length === 0 && (
                        <div className="py-12 text-center">
                            <Glasses className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No sales found</h3>
                            <p className="mb-6 text-gray-600">Start making sales to see them here.</p>
                            <Link
                                href="/optics-seller/pos"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <Glasses className="h-4 w-4" />
                                Make First Sale
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {sales.data.length > 0 && sales.links && sales.meta && (
                        <div className="border-t border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {sales.meta.from || 1} to {sales.meta.to || sales.data.length} of {sales.meta.total || sales.data.length}{' '}
                                    results
                                </div>
                                <div className="flex items-center space-x-2">
                                    {sales.links.map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                      ? 'text-gray-600 hover:bg-gray-100'
                                                      : 'cursor-not-allowed text-gray-400'
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
