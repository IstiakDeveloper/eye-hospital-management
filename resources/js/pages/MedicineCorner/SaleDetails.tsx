// resources/js/Pages/MedicineCorner/SaleDetails.tsx

import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Edit,
    Mail,
    Package,
    Phone,
    Printer,
    User,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

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
        payment_notes: sale.payment_notes || '',
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
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'pending':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="h-4 w-4" />;
            case 'partial':
                return <Clock className="h-4 w-4" />;
            case 'pending':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const handlePaymentUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/medicine-corner/sales/${sale.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
            },
        });
    };

    // Invoice Print Component
    const InvoicePrint = () => {
        const companyInfo = {
            name: 'Naogaon Islamia Eye Hospital & Phaco Centre',
            address: 'Adjacent Circuit House, Main Road, Naogaon',
            phone: '01307-885566, 01334-925910',
            email: 'niehpc@gmail.com',
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-xl">
                    <div className="p-6">
                        <style>{`
    @page {
        size: 80mm auto;
        margin: 0;
    }

    @media print {
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
        }

        html, body {
            width: 80mm !important;
            height: auto !important;
            overflow: visible !important;
        }

        body * {
            visibility: hidden;
        }

        .print-area {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 3mm !important;
            width: 70mm !important;
            margin: 0 !important;
            margin-left: 5mm !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
        }

        .print-area * {
            visibility: visible !important;
            page-break-inside: avoid !important;
        }

        .no-print {
            display: none !important;
            visibility: hidden !important;
        }
    }
`}</style>

                        <div className="no-print mb-4 flex items-center justify-between border-b pb-4">
                            <h2 className="text-lg font-semibold">Invoice Preview</h2>
                            <div className="flex gap-2">
                                <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                    <Printer className="mr-2 inline h-4 w-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPrintView(false)}
                                    className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                                >
                                    <X className="mr-2 inline h-4 w-4" />
                                    Close
                                </button>
                            </div>
                        </div>

                        <div
                            className="print-area"
                            style={{
                                fontFamily: 'Arial, sans-serif',
                                backgroundColor: 'white',
                                color: 'black',
                                fontSize: '11px',
                                lineHeight: '1.2',
                                width: '70mm',
                                maxWidth: '70mm',
                                margin: '0 auto',
                                padding: '5mm',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    textAlign: 'center',
                                    borderBottom: '1px dashed black',
                                    paddingBottom: '6px',
                                    marginBottom: '6px',
                                }}
                            >
                                <h1
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        margin: '0 0 3px 0',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {companyInfo.name}
                                </h1>
                                <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                                    <div>{companyInfo.address}</div>
                                    <div>Tel: {companyInfo.phone}</div>
                                    <div>Email: {companyInfo.email}</div>
                                </div>
                            </div>

                            {/* Invoice Info */}
                            <div
                                style={{
                                    borderBottom: '1px dashed black',
                                    paddingBottom: '6px',
                                    marginBottom: '6px',
                                    fontSize: '9px',
                                }}
                            >
                                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '3px' }}>INVOICE</div>
                                <div>Invoice: {sale.invoice_number}</div>
                                <div>Date: {formatDate(sale.sale_date)}</div>
                                <div>Cashier: {sale.sold_by.name}</div>
                            </div>

                            {/* Customer Info */}
                            <div
                                style={{
                                    borderBottom: '1px dashed black',
                                    paddingBottom: '6px',
                                    marginBottom: '6px',
                                    fontSize: '9px',
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>Customer:</div>
                                <div>{sale.patient?.name || 'Walk-in Customer'}</div>
                                {sale.patient?.phone && <div>Tel: {sale.patient.phone}</div>}
                            </div>

                            {/* Items */}
                            <div
                                style={{
                                    borderBottom: '1px dashed black',
                                    paddingBottom: '6px',
                                    marginBottom: '6px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontWeight: 'bold',
                                        fontSize: '9px',
                                        marginBottom: '3px',
                                        borderBottom: '1px solid black',
                                        paddingBottom: '2px',
                                    }}
                                >
                                    <span>ITEM</span>
                                    <span>AMOUNT</span>
                                </div>
                                {sale.items.map((item) => (
                                    <div key={item.id} style={{ marginBottom: '4px', fontSize: '9px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.medicine_stock.medicine.name}</div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginTop: '1px',
                                            }}
                                        >
                                            <span>
                                                {item.quantity} {item.medicine_stock.medicine.unit} x {formatCurrency(item.unit_price)}
                                            </span>
                                            <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.quantity * item.unit_price)}</span>
                                        </div>
                                        {item.medicine_stock.medicine.generic_name && (
                                            <div style={{ fontSize: '8px', color: '#666' }}>({item.medicine_stock.medicine.generic_name})</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div style={{ fontSize: '9px', marginBottom: '6px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '2px',
                                    }}
                                >
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(sale.subtotal)}</span>
                                </div>

                                {sale.discount > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(sale.discount)}</span>
                                    </div>
                                )}

                                {sale.tax > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        <span>Tax:</span>
                                        <span>+{formatCurrency(sale.tax)}</span>
                                    </div>
                                )}

                                <div
                                    style={{
                                        borderTop: '1px solid black',
                                        paddingTop: '3px',
                                        marginTop: '3px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                    }}
                                >
                                    <span>TOTAL:</span>
                                    <span>{formatCurrency(sale.total_amount)}</span>
                                </div>

                                {/* Payment Info */}
                                <div
                                    style={{
                                        borderTop: '1px dashed black',
                                        paddingTop: '3px',
                                        marginTop: '3px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '2px',
                                        }}
                                    >
                                        <span>Paid:</span>
                                        <span>{formatCurrency(sale.paid_amount)}</span>
                                    </div>
                                    {sale.due_amount > 0 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            <span>Due:</span>
                                            <span>{formatCurrency(sale.due_amount)}</span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginTop: '2px',
                                        }}
                                    >
                                        <span>Status:</span>
                                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{sale.payment_status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    borderTop: '1px dashed black',
                                    paddingTop: '6px',
                                    textAlign: 'center',
                                    fontSize: '8px',
                                    lineHeight: '1.3',
                                }}
                            >
                                <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>Thank you for your business!</div>
                                <div>Tel: {companyInfo.phone}</div>
                                {sale.notes && <div style={{ marginTop: '3px', fontStyle: 'italic' }}>Note: {sale.notes}</div>}
                                <div style={{ marginTop: '3px' }}>This is a computer generated invoice</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Payment Update Modal
    const PaymentModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Update Payment</h2>
                        <button onClick={() => setShowPaymentModal(false)} className="rounded p-1 hover:bg-gray-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handlePaymentUpdate} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Paid Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                max={sale.total_amount}
                                value={data.paid_amount}
                                onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">Total Amount: {formatCurrency(sale.total_amount)}</p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method</label>
                            <select
                                value={data.payment_method}
                                onChange={(e) => setData('payment_method', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select method</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_banking">Mobile Banking</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Notes</label>
                            <textarea
                                value={data.payment_notes}
                                onChange={(e) => setData('payment_notes', e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                placeholder="Additional payment notes..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
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
                        <Link href="/medicine-corner/sales" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{sale.invoice_number}</h1>
                            <p className="mt-1 text-gray-600">Sale transaction details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(sale.payment_status)}`}
                        >
                            {getStatusIcon(sale.payment_status)}
                            <span className="capitalize">{sale.payment_status}</span>
                        </div>
                        {sale.due_amount > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                            >
                                <CreditCard className="mr-2 inline h-4 w-4" />
                                Update Payment
                            </button>
                        )}
                        <button onClick={() => setShowPrintView(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                            <Printer className="mr-2 inline h-4 w-4" />
                            Print
                        </button>
                        <Link
                            href={`/medicine-corner/sales/${sale.id}/edit`}
                            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                        >
                            <Edit className="mr-2 inline h-4 w-4" />
                            Edit
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Sale Information */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Customer & Sale Info */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Sale Information</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-gray-500">Customer Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{sale.patient?.name || 'Walk-in Customer'}</span>
                                        </div>
                                        {sale.patient?.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{sale.patient.phone}</span>
                                            </div>
                                        )}
                                        {sale.patient?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{sale.patient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-gray-500">Sale Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{formatDate(sale.sale_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">Sold by: {sale.sold_by.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{sale.items.length} items</span>
                                        </div>
                                        {sale.payment_method && (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900 capitalize">{sale.payment_method.replace('_', ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {(sale.notes || sale.payment_notes) && (
                                <div className="mt-6 border-t border-gray-200 pt-4">
                                    {sale.notes && (
                                        <div className="mb-3">
                                            <h4 className="mb-1 text-sm font-medium text-gray-700">Sale Notes:</h4>
                                            <p className="text-sm text-gray-600">{sale.notes}</p>
                                        </div>
                                    )}
                                    {sale.payment_notes && (
                                        <div>
                                            <h4 className="mb-1 text-sm font-medium text-gray-700">Payment Notes:</h4>
                                            <p className="text-sm text-gray-600">{sale.payment_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
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
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {sale.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.medicine_stock.medicine.name}</div>
                                                        {item.medicine_stock.medicine.generic_name && (
                                                            <div className="text-sm text-gray-500">{item.medicine_stock.medicine.generic_name}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                        {item.medicine_stock.batch_number}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {item.quantity} {item.medicine_stock.medicine.unit}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
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
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Summary</h2>
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
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Sale Metrics</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm text-gray-600">Items Sold</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{sale.items.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-gray-600">Profit Margin</span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">
                                        {((sale.total_profit / sale.total_amount) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-purple-600" />
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
