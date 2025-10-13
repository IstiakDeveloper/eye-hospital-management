import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Search, Filter, X, FileSpreadsheet, Printer, Eye, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import SalesPrintModal from './SalesPrintModal';

interface Sale {
    id: number;
    transaction_no: string;
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    created_by: {
        name: string;
    };
}

const Button = ({ children, className = '', variant = 'primary', disabled = false, ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200',
        success: 'bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
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

export default function SalesIndex({ sales }: { sales: any }) {
    const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') || '');
    const [fromDate, setFromDate] = useState(new URLSearchParams(window.location.search).get('from_date') || '');
    const [toDate, setToDate] = useState(new URLSearchParams(window.location.search).get('to_date') || '');
    const [showFilters, setShowFilters] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [allSalesForPrint, setAllSalesForPrint] = useState<Sale[]>([]);
    const [loadingAllSales, setLoadingAllSales] = useState(false);

    // Safely get sales data
    const salesData = Array.isArray(sales) ? sales : (sales?.data || []);
    const salesTotal = Array.isArray(sales) ? sales.length : (sales?.total || 0);
    const salesFrom = Array.isArray(sales) ? (sales.length > 0 ? 1 : 0) : (sales?.from || 0);
    const salesTo = Array.isArray(sales) ? sales.length : (sales?.to || 0);
    const salesLinks = Array.isArray(sales) ? null : sales?.links;

    // Debug: Log sales data
    console.log('Sales Data:', salesData);
    console.log('First sale amount:', salesData[0]?.amount);

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
        router.get(route('optics.sales'), {}, { preserveState: true });
    };

    const hasActiveFilters = search || fromDate || toDate;

    const fetchAllSalesForPrint = () => {
        setLoadingAllSales(true);

        const params: any = { all: 'true' };
        if (search) params.search = search;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;

        router.get(route('optics.sales'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['sales'],
            onSuccess: (page: any) => {
                const allSales = Array.isArray(page.props.sales)
                    ? page.props.sales
                    : (page.props.sales?.data || []);
                setAllSalesForPrint(allSales);
                setLoadingAllSales(false);
                setPrintModalOpen(true);
            },
            onError: () => {
                setLoadingAllSales(false);
                alert('Failed to load all sales. Please try again.');
            }
        });
    };

    const exportToExcel = () => {
        setExportingExcel(true);

        const params: any = { all: 'true' };
        if (search) params.search = search;
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;

        router.get(route('optics.sales'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['sales'],
            onSuccess: (page: any) => {
                const allSales = Array.isArray(page.props.sales)
                    ? page.props.sales
                    : (page.props.sales?.data || []);

                if (allSales.length === 0) {
                    alert('No sales to export!');
                    setExportingExcel(false);
                    return;
                }

                try {
                    const excelData = allSales.map((sale: Sale, index: number) => ({
                        'SL': index + 1,
                        'Transaction No': sale.transaction_no,
                        'Customer': extractCustomerName(sale.description),
                        'Category': sale.category,
                        'Amount': sale.amount,
                        'Date': new Date(sale.transaction_date).toLocaleDateString(),
                        'Created By': sale.created_by.name
                    }));

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(excelData);

                    const colWidths = [
                        { wch: 5 },  // SL
                        { wch: 20 }, // Transaction No
                        { wch: 25 }, // Customer
                        { wch: 15 }, // Category
                        { wch: 15 }, // Amount
                        { wch: 15 }, // Date
                        { wch: 20 }  // Created By
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

    const extractCustomerName = (description: string) => {
        const parts = description.split(' - ');
        if (parts.length > 1) {
            const customerPart = parts[1].split(' | ')[0];
            return customerPart || 'N/A';
        }
        return 'N/A';
    };

    const formatCurrency = (amount: number) => {
        // Handle NaN, undefined, null cases
        const numAmount = Number(amount) || 0;
        return `৳${numAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    // Calculate total - ensure it's a valid number
    const totalAmount = salesData.reduce((sum: number, sale: Sale) => {
        const amount = Number(sale.amount) || 0;
        return sum + amount;
    }, 0);

    // Calculate average
    const averageSale = salesTotal > 0 ? totalAmount / salesTotal : 0;

    return (
        <AdminLayout>
            <Head title="Sales Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
                        <p className="text-gray-600">Track all your sales transactions ({salesTotal} total sales)</p>
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
                        <Button
                            variant="print"
                            onClick={fetchAllSalesForPrint}
                            disabled={loadingAllSales}
                        >
                            <Printer className="w-4 h-4" />
                            <span>{loadingAllSales ? 'Loading...' : 'Print Report'}</span>
                        </Button>
                        <Link href={route('optics.sales.create')}>
                            <Button>
                                <Plus className="w-4 h-4" />
                                <span>New Sale</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{salesTotal}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    {formatCurrency(averageSale)}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Printer className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
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
                                        placeholder="Search by customer, transaction no..."
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {salesData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
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
                                                    <p className="font-medium text-gray-900">{sale.transaction_no}</p>
                                                    <p className="text-sm text-gray-500">{sale.category}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{extractCustomerName(sale.description)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-semibold text-green-600">
                                                    {formatCurrency(sale.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(sale.transaction_date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {sale.created_by.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="secondary" className="text-xs">
                                                    <Eye className="w-3 h-3" />
                                                    <span>View</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {salesData.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
                                            Total:
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xl font-bold text-green-600">
                                                {formatCurrency(totalAmount)}
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

                {/* Print Modal */}
                <SalesPrintModal
                    isOpen={printModalOpen}
                    onClose={() => {
                        setPrintModalOpen(false);
                        setAllSalesForPrint([]);
                    }}
                    sales={allSalesForPrint}
                />
            </div>
        </AdminLayout>
    );
}
