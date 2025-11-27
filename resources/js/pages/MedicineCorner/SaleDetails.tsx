// resources/js/Pages/MedicineCorner/SaleDetails.tsx

import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ArrowLeft,
    User,
    Calendar,
    Package,
    DollarSign,
    Edit,
    Printer,
    Phone,
    Mail,
    FileText,
    X,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

interface MedicineStock {
    id: number;
    batch_number: string;
    available_quantity: number;
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

interface Patient {
    id: number;
    name: string;
    phone: string;
    email?: string;
}

interface User {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    invoice_number: string;
    sale_date: string;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    total_profit: number;
    payment_status: 'paid' | 'partial' | 'pending';
    payment_method?: string;
    payment_notes?: string;
    notes?: string;
    patient?: Patient;
    sold_by: User;
    items: SaleItem[];
    created_at: string;
    updated_at: string;
}

interface SaleDetailsProps {
    sale: Sale;
}

export function SaleDetails({ sale }: SaleDetailsProps) {
    const [showPrintView, setShowPrintView] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { data, setData, put, processing } = useForm({
        paid_amount: sale.paid_amount,
        payment_method: sale.payment_method || '',
        payment_notes: sale.payment_notes || ''
    });

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount).toLocaleString()}`;
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
            case 'pending': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-4 h-4" />;
            case 'partial': return <Clock className="w-4 h-4" />;
            case 'pending': return <AlertCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handlePaymentUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/medicine-corner/sales/${sale.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
            }
        });
    };

    // Invoice Print Component
    const InvoicePrint = () => {
        const companyInfo = {
            name: "Eye Hospital Pharmacy",
            address: "123 Medical Center, Dhaka-1000, Bangladesh",
            phone: "+880 1234-567890",
            email: "pharmacy@eyehospital.com",
            license: "DL-12345"
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-6">
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .print-area, .print-area * { visibility: visible; }
                                .print-area {
                                    position: absolute;
                                    left: 0; top: 0; width: 100%;
                                    transform: scale(0.95);
                                    transform-origin: top left;
                                }
                                .no-print { display: none !important; }
                            }
                            @page { size: A4 portrait; margin: 12mm; }
                        `}</style>

                        <div className="no-print mb-4 flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-semibold">Invoice Preview</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Printer className="w-4 h-4 inline mr-2" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPrintView(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    <X className="w-4 h-4 inline mr-2" />
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="print-area" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {/* Header */}
                            <div style={{ borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                                        {companyInfo.name}
                                    </h1>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        <p style={{ margin: '2px 0' }}>{companyInfo.address}</p>
                                        <p style={{ margin: '2px 0' }}>Phone: {companyInfo.phone}</p>
                                        <p style={{ margin: '2px 0' }}>Email: {companyInfo.email}</p>
                                        <p style={{ margin: '2px 0' }}>License: {companyInfo.license}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>INVOICE</h2>
                                    <div style={{ fontSize: '12px' }}>
                                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Invoice #: {sale.invoice_number}</p>
                                        <p style={{ margin: '2px 0' }}>Date: {formatDate(sale.sale_date)}</p>
                                        <p style={{ margin: '2px 0' }}>Cashier: {sale.sold_by.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Bill To:</h3>
                                <div style={{ fontSize: '12px' }}>
                                    <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                                        {sale.patient?.name || 'Walk-in Customer'}
                                    </p>
                                    {sale.patient?.phone && <p style={{ margin: '2px 0' }}>Phone: {sale.patient.phone}</p>}
                                    {sale.patient?.email && <p style={{ margin: '2px 0' }}>Email: {sale.patient.email}</p>}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '24px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>#</th>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Medicine</th>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Batch</th>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Qty</th>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Price</th>
                                        <th style={{ border: '1px solid black', padding: '8px', fontSize: '12px', fontWeight: 'bold' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>{index + 1}</td>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{item.medicine_stock.medicine.name}</div>
                                                {item.medicine_stock.medicine.generic_name && (
                                                    <div style={{ fontSize: '10px', color: '#666' }}>
                                                        {item.medicine_stock.medicine.generic_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                                                {item.medicine_stock.batch_number}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'center' }}>
                                                {item.quantity} {item.medicine_stock.medicine.unit}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'right' }}>
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                                <div style={{ width: '250px', borderTop: '1px solid black', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(sale.subtotal)}</span>
                                    </div>
                                    {sale.discount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span>Discount:</span>
                                            <span>-{formatCurrency(sale.discount)}</span>
                                        </div>
                                    )}
                                    {sale.tax > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span>Tax:</span>
                                            <span>+{formatCurrency(sale.tax)}</span>
                                        </div>
                                    )}
                                    <div style={{ borderTop: '2px solid black', paddingTop: '8px', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                                            <span>Total:</span>
                                            <span>{formatCurrency(sale.total_amount)}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span>Paid:</span>
                                            <span>{formatCurrency(sale.paid_amount)}</span>
                                        </div>
                                        {sale.due_amount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: 'red' }}>
                                                <span>Due:</span>
                                                <span>{formatCurrency(sale.due_amount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ borderTop: '1px solid #ccc', paddingTop: '16px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                                <p>Thank you for your business!</p>
                                <p>For queries: {companyInfo.phone} | {companyInfo.email}</p>
                                {sale.notes && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>Note: {sale.notes}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Payment Update Modal
    const PaymentModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Update Payment</h2>
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="p-1 rounded hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handlePaymentUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paid Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                max={sale.total_amount}
                                value={data.paid_amount}
                                onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Total Amount: {formatCurrency(sale.total_amount)}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={data.payment_method}
                                onChange={(e) => setData('payment_method', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select method</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_banking">Mobile Banking</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Notes
                            </label>
                            <textarea
                                value={data.payment_notes}
                                onChange={(e) => setData('payment_notes', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional payment notes..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {processing ? 'Updating...' : 'Update Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout title={`Sale Details - ${sale.invoice_number}`}>
            <Head title={`Sale Details - ${sale.invoice_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/medicine-corner/sales"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{sale.invoice_number}</h1>
                            <p className="text-gray-600 mt-1">Sale transaction details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.payment_status)}`}>
                            {getStatusIcon(sale.payment_status)}
                            <span className="capitalize">{sale.payment_status}</span>
                        </div>
                        {sale.due_amount > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                                <CreditCard className="w-4 h-4 inline mr-2" />
                                Update Payment
                            </button>
                        )}
                        <button
                            onClick={() => setShowPrintView(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4 inline mr-2" />
                            Print
                        </button>
                        <Link
                            href={`/medicine-corner/sales/${sale.id}/edit`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Edit className="w-4 h-4 inline mr-2" />
                            Edit
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sale Information */}
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
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{sale.patient.phone}</span>
                                            </div>
                                        )}
                                        {sale.patient?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
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
                                        {sale.payment_method && (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900 capitalize">{sale.payment_method.replace('_', ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {(sale.notes || sale.payment_notes) && (
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    {sale.notes && (
                                        <div className="mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Sale Notes:</h4>
                                            <p className="text-sm text-gray-600">{sale.notes}</p>
                                        </div>
                                    )}
                                    {sale.payment_notes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Payment Notes:</h4>
                                            <p className="text-sm text-gray-600">{sale.payment_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
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
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
                                                        {formatCurrency(item.quantity * item.unit_price)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-green-600">
                                                        {formatCurrency((item.unit_price - item.buy_price) * item.quantity)}
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

            {/* Print Modal */}
            {showPrintView && <InvoicePrint />}

            {/* Payment Update Modal */}
            {showPaymentModal && <PaymentModal />}
        </AdminLayout>
    );
}

export default SaleDetails;
