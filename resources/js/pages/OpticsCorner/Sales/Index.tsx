import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Search, Filter, X, FileSpreadsheet, Printer, Calendar, Edit, Trash2, CheckCircle, Clock, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Sale {
    id: number;
    invoice_number: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    status: 'pending' | 'ready' | 'delivered';
    items_count: number;
    created_at: string;
    seller?: {
        name: string;
    };
    patient?: {
        name: string;
        phone: string;
    };
}

interface PageProps {
    sales: {
        data: Sale[];
        total: number;
        from: number;
        to: number;
        links: any[];
    };
    totalSales: number;
    totalDue: number;
    salesCount: number;
    filters: {
        search?: string;
        from_date?: string;
        to_date?: string;
        status?: string;
        due_status?: string;
    };
}

const Button = ({ children, className = '', variant = 'primary', disabled = false, ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200',
        success: 'bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:hover:bg-yellow-600',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:hover:bg-transparent',
        print: 'bg-purple-600 text-white hover:bg-purple-700 disabled:hover:bg-purple-600'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant as keyof typeof variants]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

const Input = ({ label, error, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

const Select = ({ label, error, className = '', children, ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <select
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        >
            {children}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

export default function SalesIndex({ sales, totalSales, totalDue, salesCount, filters }: PageProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [fromDate, setFromDate] = useState(filters?.from_date || '');
    const [toDate, setToDate] = useState(filters?.to_date || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [dueStatusFilter, setDueStatusFilter] = useState(filters?.due_status || '');
    const [showFilters, setShowFilters] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);

    // Safely get sales data
    const salesData = sales?.data || [];
    const salesTotal = sales?.total || 0;
    const salesFrom = sales?.from || 0;
    const salesTo = sales?.to || 0;
    const salesLinks = sales?.links || [];

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSearch = () => {
        const params: any = {};
        if (search) params.search = search;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (statusFilter) params.status = statusFilter;
        if (dueStatusFilter) params.due_status = dueStatusFilter;

        router.get(route('optics.sales'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setStatusFilter('');
        setDueStatusFilter('');
        router.get(route('optics.sales'), {}, { preserveState: true });
    };

    const hasActiveFilters = search || fromDate || toDate || statusFilter || dueStatusFilter;

    const exportToExcel = () => {
        setExportingExcel(true);

        const params: any = { all: 'true' };
        if (search) params.search = search;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;
        if (statusFilter) params.status = statusFilter;
        if (dueStatusFilter) params.due_status = dueStatusFilter;

        router.get(route('optics.sales'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['sales'],
            onSuccess: (page: any) => {
                const allSales = page.props.sales?.data || [];

                if (allSales.length === 0) {
                    alert('No sales to export!');
                    setExportingExcel(false);
                    return;
                }

                try {
                    const excelData = allSales.map((sale: Sale, index: number) => ({
                        'SL': index + 1,
                        'Invoice No': sale.invoice_number,
                        'Customer Name': sale.customer_name,
                        'Phone': sale.customer_phone || 'N/A',
                        'Items': sale.items_count,
                        'Total Amount': sale.total_amount,
                        'Advance': sale.advance_payment,
                        'Due': sale.due_amount,
                        'Status': sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
                        'Date': new Date(sale.created_at).toLocaleDateString(),
                        'Seller': sale.seller?.name || 'N/A'
                    }));

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(excelData);

                    const colWidths = [
                        { wch: 5 },  // SL
                        { wch: 20 }, // Invoice No
                        { wch: 25 }, // Customer Name
                        { wch: 15 }, // Phone
                        { wch: 8 },  // Items
                        { wch: 15 }, // Total Amount
                        { wch: 12 }, // Advance
                        { wch: 12 }, // Due
                        { wch: 12 }, // Status
                        { wch: 15 }, // Date
                        { wch: 20 }  // Seller
                    ];
                    ws['!cols'] = colWidths;

                    XLSX.utils.book_append_sheet(wb, ws, 'Optics Sales');

                    const date = new Date().toISOString().split('T')[0];
                    const filename = `optics-sales-${date}.xlsx`;

                    XLSX.writeFile(wb, filename);

                    setExportingExcel(false);
                } catch (error) {
                    console.error('Excel export error:', error);
                    alert('Failed to export Excel. Please try again.');
                    setExportingExcel(false);
                }
            },
            onError: () => {
                setExportingExcel(false);
                alert('Failed to load sales data. Please try again.');
            }
        });
    };

    const handleDelete = (saleId: number) => {
        if (!confirm('Are you sure you want to delete this sale? Stock will be restored and payments will be refunded.')) {
            return;
        }

        setDeletingSaleId(saleId);

        router.delete(route('optics.sales.delete', saleId), {
            onSuccess: () => {
                setDeletingSaleId(null);
            },
            onError: () => {
                setDeletingSaleId(null);
            }
        });
    };

    const formatCurrency = (amount: number) => {
        const numAmount = Number(amount) || 0;
        return `৳${numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            ready: 'bg-blue-100 text-blue-800',
            delivered: 'bg-green-100 text-green-800'
        };
        const icons = {
            pending: Clock,
            ready: Package,
            delivered: CheckCircle
        };
        const Icon = icons[status as keyof typeof icons];
        const badge = badges[status as keyof typeof badges];

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Sales Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Optics Sales</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Total: <span className="font-semibold text-gray-900">{salesCount}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>Revenue: <span className="font-semibold text-green-600">{formatCurrency(totalSales || 0)}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>Due: <span className="font-semibold text-red-600">{formatCurrency(totalDue || 0)}</span></span>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            variant="success"
                            onClick={exportToExcel}
                            disabled={exportingExcel}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
                        </Button>
                        <Link href={route('optics.sales.create')}>
                            <Button>
                                <Plus className="w-4 h-4" />
                                <span>New Sale</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6">
                        <div className="flex flex-col space-y-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        placeholder="Search by invoice, customer name, phone..."
                                        value={search}
                                        onChange={(e: any) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>Filters</span>
                                </Button>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        <X className="w-4 h-4" />
                                        <span>Clear</span>
                                    </Button>
                                )}
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
                                    <Input
                                        type="date"
                                        label="From Date"
                                        value={fromDate}
                                        onChange={(e: any) => setFromDate(e.target.value)}
                                    />
                                    <Input
                                        type="date"
                                        label="To Date"
                                        value={toDate}
                                        onChange={(e: any) => setToDate(e.target.value)}
                                    />
                                    <Select
                                        label="Status"
                                        value={statusFilter}
                                        onChange={(e: any) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="ready">Ready</option>
                                        <option value="delivered">Delivered</option>
                                    </Select>
                                    <Select
                                        label="Due Status"
                                        value={dueStatusFilter}
                                        onChange={(e: any) => setDueStatusFilter(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="paid">Paid</option>
                                        <option value="due">Has Due</option>
                                    </Select>
                                    <div className="flex items-end">
                                        <Button onClick={handleSearch} className="w-full">
                                            <Search className="w-4 h-4" />
                                            <span>Apply Filters</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {search && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                Search: "{search}"
                            </span>
                        )}
                        {fromDate && (
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                From: {new Date(fromDate).toLocaleDateString()}
                            </span>
                        )}
                        {toDate && (
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                To: {new Date(toDate).toLocaleDateString()}
                            </span>
                        )}
                        {statusFilter && (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                            </span>
                        )}
                        {dueStatusFilter && (
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                                Due: {dueStatusFilter === 'paid' ? 'Paid' : 'Has Due'}
                            </span>
                        )}
                    </div>
                )}

                {/* Results count */}
                <div className="text-sm text-gray-600">
                    Showing {salesFrom} to {salesTo} of {salesTotal} sales
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice & Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {salesData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
                                                <p className="text-gray-600">
                                                    {hasActiveFilters ? 'Try adjusting your filters' : 'Start by creating your first sale'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    salesData.map((sale: Sale, index: number) => (
                                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {salesFrom + index}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{sale.invoice_number}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(sale.created_at)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{sale.customer_name}</p>
                                                    {sale.customer_phone && (
                                                        <p className="text-xs text-gray-500">{sale.customer_phone}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {sale.items_count} item{sale.items_count !== 1 ? 's' : ''}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(sale.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-semibold ${sale.due_amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {formatCurrency(sale.due_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(sale.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link href={route('optics.sales.edit', sale.id)}>
                                                        <Button variant="warning" className="text-xs">
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        className="text-xs"
                                                        onClick={() => handleDelete(sale.id)}
                                                        disabled={deletingSaleId === sale.id}
                                                    >
                                                        {deletingSaleId === sale.id ? (
                                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {salesData.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-900">
                                            Total:
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(totalSales || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-bold text-red-600">
                                                {formatCurrency(totalDue || 0)}
                                            </span>
                                        </td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {salesLinks && salesData.length > 0 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {salesLinks.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveState: true,
                                                preserveScroll: false
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                            ? 'bg-blue-600 text-white'
                                            : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
