// resources/js/Pages/MedicineCorner/Sales.tsx

import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    User,
    Package,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    RefreshCw
} from 'lucide-react';

interface Patient {
    id: number;
    name: string;
    phone: string;
    email?: string;
}

interface SoldBy {
    id: number;
    name: string;
}

interface MedicineStock {
    id: number;
    batch_number: string;
    medicine: {
        id: number;
        name: string;
        generic_name: string;
        unit: string;
    };
}

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    buy_price: number;
    medicine_stock: MedicineStock;
}

interface Sale {
    id: number;
    invoice_number: string;
    patient: Patient | null;
    sold_by: SoldBy;
    sale_date: string;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    total_profit: number;
    payment_status: 'paid' | 'partial' | 'pending';
    items: SaleItem[];
    created_at: string;
}

interface SalesProps {
    sales: {
        data: Sale[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        date_from: string;
        date_to: string;
        status: string;
        search: string;
    };
    statistics: {
        total_sales: number;
        total_profit: number;
        pending_dues: number;
        today_sales: number;
    };
}

export default function Sales({ sales, filters, statistics }: SalesProps) {
    const [selectedSales, setSelectedSales] = useState<number[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const { data, setData, get, processing } = useForm({
        date_from: filters.date_from,
        date_to: filters.date_to,
        status: filters.status,
        search: filters.search,
    });

    const { data: paymentData, setData: setPaymentData, put: updatePayment, processing: paymentProcessing } = useForm({
        paid_amount: 0,
        payment_method: '',
        payment_notes: '',
    });

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount).toLocaleString()}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'pending': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-4 h-4" />;
            case 'partial': return <Clock className="w-4 h-4" />;
            case 'pending': return <AlertCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handleFilter = () => {
        get('/medicine-corner/sales', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const toggleSaleSelection = (saleId: number) => {
        setSelectedSales(prev =>
            prev.includes(saleId)
                ? prev.filter(id => id !== saleId)
                : [...prev, saleId]
        );
    };

    const toggleAllSales = () => {
        setSelectedSales(
            selectedSales.length === sales.data.length
                ? []
                : sales.data.map(sale => sale.id)
        );
    };

    const handleBulkAction = (action: string) => {
        if (selectedSales.length === 0) {
            alert('Please select sales first');
            return;
        }

        router.post('/medicine-corner/sales/bulk-action', {
            action,
            sale_ids: selectedSales
        }, {
            onSuccess: () => {
                setSelectedSales([]);
                router.reload();
            }
        });
    };

    const openPaymentModal = (sale: Sale) => {
        setSelectedSale(sale);
        setPaymentData({
            paid_amount: sale.paid_amount,
            payment_method: '',
            payment_notes: '',
        });
        setShowPaymentModal(true);
    };

    const handlePaymentUpdate = () => {
        if (!selectedSale) return;

        updatePayment(`/medicine-corner/sales/${selectedSale.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedSale(null);
                router.reload();
            }
        });
    };

    const deleteSale = (saleId: number) => {
        if (confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
            router.delete(`/medicine-corner/sales/${saleId}`, {
                onSuccess: () => {
                    router.reload();
                }
            });
        }
    };

    return (
        <AdminLayout title="Sales Management">
            <Head title="Sales Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
                        <p className="text-gray-600 mt-1">Manage all medicine sales and transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.reload()}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.total_sales)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Profit</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.total_profit)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending Dues</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(statistics.pending_dues)}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Sales</p>
                                <p className="text-2xl font-bold text-purple-600">{statistics.today_sales}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={data.date_from}
                                onChange={(e) => setData('date_from', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={data.date_to}
                                onChange={(e) => setData('date_to', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Invoice, customer..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedSales.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-blue-800 font-medium">
                                {selectedSales.length} sale(s) selected
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkAction('mark_paid')}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => handleBulkAction('export')}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedSales.length === sales.data.length && sales.data.length > 0}
                                            onChange={toggleAllSales}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales.data.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedSales.includes(sale.id)}
                                                onChange={() => toggleSaleSelection(sale.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sale.invoice_number}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {sale.sold_by.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sale.patient?.name || 'Walk-in Customer'}
                                                </div>
                                                {sale.patient?.phone && (
                                                    <div className="text-sm text-gray-500">
                                                        {sale.patient.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(sale.sale_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Package className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{sale.items.length}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(sale.total_amount)}
                                                </div>
                                                {sale.due_amount > 0 && (
                                                    <div className="text-sm text-red-600">
                                                        Due: {formatCurrency(sale.due_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-green-600">
                                                {formatCurrency(sale.total_profit)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.payment_status)}`}>
                                                {getStatusIcon(sale.payment_status)}
                                                {sale.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/medicine-corner/sales/${sale.id}`}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/medicine-corner/sales/${sale.id}/edit`}
                                                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                    title="Edit Sale"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                {sale.payment_status !== 'paid' && (
                                                    <button
                                                        onClick={() => openPaymentModal(sale)}
                                                        className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                                                        title="Update Payment"
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteSale(sale.id)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Delete Sale"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.last_page > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        disabled={sales.current_page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={sales.current_page === sales.last_page}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{((sales.current_page - 1) * sales.per_page) + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(sales.current_page * sales.per_page, sales.total)}
                                            </span>{' '}
                                            of <span className="font-medium">{sales.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {/* Pagination buttons would go here */}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Update Modal */}
                {showPaymentModal && selectedSale && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Update Payment - {selectedSale.invoice_number}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Amount: {formatCurrency(selectedSale.total_amount)}
                                        </label>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Paid Amount
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={paymentData.paid_amount}
                                            onChange={(e) => setPaymentData('paid_amount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentData.payment_method}
                                            onChange={(e) => setPaymentData('payment_method', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select method</option>
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="mobile_banking">Mobile Banking</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Notes
                                        </label>
                                        <textarea
                                            value={paymentData.payment_notes}
                                            onChange={(e) => setPaymentData('payment_notes', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Additional notes..."
                                        />
                                    </div>

                                    {paymentData.paid_amount > 0 && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex justify-between text-sm">
                                                <span>Due Amount:</span>
                                                <span className={selectedSale.total_amount - paymentData.paid_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                                    {formatCurrency(Math.max(0, selectedSale.total_amount - paymentData.paid_amount))}
                                                </span>
                                            </div>
                                            {paymentData.paid_amount > selectedSale.total_amount && (
                                                <div className="flex justify-between text-sm">
                                                    <span>Change:</span>
                                                    <span className="text-green-600">
                                                        {formatCurrency(paymentData.paid_amount - selectedSale.total_amount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={handlePaymentUpdate}
                                        disabled={paymentProcessing}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        {paymentProcessing ? 'Updating...' : 'Update Payment'}
                                    </button>
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
