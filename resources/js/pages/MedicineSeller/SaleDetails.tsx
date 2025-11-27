import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ArrowLeft,
    User,
    Calendar,
    FileText,
    DollarSign,
    Package,
    Printer,
    Eye,
    X,
    CreditCard
} from 'lucide-react';

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
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
    const [showPrintView, setShowPrintView] = useState(false);
    const [printWithoutDiscount, setPrintWithoutDiscount] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        paid_amount: 0, // Start with 0, will be set to due amount when modal opens
    });

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

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(route('medicine-seller.update-payment', sale.id), {
            onSuccess: () => {
                setShowPaymentModal(false);
                reset();
            },
        });
    };

    // Payment Modal Component
    const PaymentModal = () => {
        if (!showPaymentModal) return null;

        const remainingDue = sale.due_amount || (sale.total_amount - sale.paid_amount);
        const maxPayment = sale.total_amount;
        const currentPaidAmount = Number(data.paid_amount) || 0;
        const collectingAmount = Math.max(0, currentPaidAmount - sale.paid_amount);
        const remainingAfterPayment = Math.max(0, sale.total_amount - currentPaidAmount);

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Collect Payment</h2>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setData('paid_amount', sale.paid_amount);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            {/* Invoice Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Invoice:</span>
                                        <span className="font-medium text-gray-900">{sale.invoice_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Amount:</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(sale.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Already Paid:</span>
                                        <span className="font-medium text-green-600">{formatCurrency(sale.paid_amount)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-900 font-semibold">Due Amount:</span>
                                        <span className="font-bold text-red-600">{formatCurrency(remainingDue)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Paid Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={sale.paid_amount}
                                        max={maxPayment}
                                        value={currentPaidAmount || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                setData('paid_amount', sale.paid_amount);
                                            } else {
                                                const numValue = parseFloat(value);
                                                if (!isNaN(numValue)) {
                                                    setData('paid_amount', numValue);
                                                }
                                            }
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                        placeholder={`Enter amount (min: ${formatCurrency(sale.paid_amount)})`}
                                        required
                                    />
                                </div>
                                {errors.paid_amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>
                                )}
                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Collecting Now:</span>
                                        <span className="font-semibold text-blue-900">{formatCurrency(collectingAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Will Remain Due:</span>
                                        <span className="font-semibold text-blue-900">{formatCurrency(remainingAfterPayment)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('paid_amount', Math.round((sale.paid_amount + remainingDue / 2) * 100) / 100)}
                                        className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Half Due
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            +{formatCurrency(remainingDue / 2)}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('paid_amount', sale.total_amount)}
                                        className="px-3 py-2 text-xs font-medium border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        Full Payment
                                        <div className="text-[10px] text-green-600 mt-0.5">
                                            +{formatCurrency(remainingDue)}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('paid_amount', sale.paid_amount)}
                                        className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Reset
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            No change
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setData('paid_amount', sale.paid_amount);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || currentPaidAmount <= sale.paid_amount || currentPaidAmount > sale.total_amount}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {processing ? 'Processing...' : 'Collect Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };    // Printable Invoice Component
    const PrintableInvoice = () => {
        const companyInfo = {
            name: "Eye Hospital Pharmacy",
            address: "123 Medical Center, Dhaka-1000, Bangladesh",
            phone: "+880 1234-567890",
            email: "pharmacy@eyehospital.com",
            license: "DL-12345"
        };

        const handlePrint = () => {
            window.print();
        };

        // Calculate discount to show based on checkbox
        const discountToShow = printWithoutDiscount ? 0 : (Number(sale.discount) || 0);
        // If hiding discount, recalculate total without discount
        const totalToShow = printWithoutDiscount
            ? (Number(sale.subtotal) || 0) + (Number(sale.tax) || 0)
            : (Number(sale.total_amount) || 0);

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-6">
                        {/* Print Styles */}
                        <style>{`
    @media print {
        body * {
            visibility: hidden;
        }
        .print-area, .print-area * {
            visibility: visible;
        }
        .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            transform: scale(0.95);
            transform-origin: top left;
            background: white !important;
            color: black !important;
            box-sizing: border-box;
            margin-top: 20px;
            margin-left: 15px;
            margin-right: 15px;
            padding: 10px;
        }
        .no-print {
            display: none !important;
        }
        table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            text-align: left !important;
            font-size: 12px !important;
            word-wrap: break-word;
        }
    }

    @page {
        size: A4 portrait;
        margin: 12mm;
    }
`}</style>


                        {/* Print/Close Buttons - Hidden in print */}
                        <div className="no-print mb-4 flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-semibold">Invoice Preview</h2>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={printWithoutDiscount}
                                        onChange={(e) => setPrintWithoutDiscount(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    Print without discount
                                </label>

                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowPrintView(false)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Printable Invoice */}
                        <div className="print-area" style={{
                            fontFamily: 'Arial, sans-serif',
                            backgroundColor: 'white',
                            color: 'black',
                            fontSize: '14px',
                            lineHeight: '1.4'
                        }}>
                            {/* Header */}
                            <div style={{
                                borderBottom: '2px solid black',
                                paddingBottom: '16px',
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}>
                                <div>
                                    <h1 style={{
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: 'black',
                                        margin: '0 0 8px 0'
                                    }}>
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
                                    <h2 style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: 'black',
                                        margin: '0 0 8px 0'
                                    }}>
                                        INVOICE
                                    </h2>
                                    <div style={{ fontSize: '12px' }}>
                                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                                            Invoice #: {sale.invoice_number}
                                        </p>
                                        <p style={{ margin: '2px 0' }}>Date: {formatDate(sale.sale_date)}</p>
                                        <p style={{ margin: '2px 0' }}>Cashier: {sale.sold_by.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: 'black',
                                    margin: '0 0 8px 0'
                                }}>
                                    Bill To:
                                </h3>
                                <div style={{ fontSize: '12px', color: 'black' }}>
                                    <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                                        {sale.patient?.name || 'Walk-in Customer'}
                                    </p>
                                    {sale.patient?.phone && (
                                        <p style={{ margin: '2px 0' }}>Phone: {sale.patient.phone}</p>
                                    )}
                                    {sale.patient?.email && (
                                        <p style={{ margin: '2px 0' }}>Email: {sale.patient.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <div style={{ marginBottom: '24px' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    border: '1px solid black'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                #
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Medicine
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Batch
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Qty
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Unit Price
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>
                                                            {item.medicine_stock.medicine.name}
                                                        </div>
                                                        {item.medicine_stock.medicine.generic_name && (
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#666',
                                                                marginTop: '2px'
                                                            }}>
                                                                {item.medicine_stock.medicine.generic_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    {item.medicine_stock.batch_number}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'center'
                                                }}>
                                                    {item.quantity} {item.medicine_stock.medicine.unit}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'right'
                                                }}>
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'right',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {formatCurrency(item.total_price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginBottom: '24px'
                            }}>
                                <div style={{ width: '250px' }}>
                                    <div style={{
                                        borderTop: '1px solid black',
                                        paddingTop: '16px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '12px',
                                            marginBottom: '4px'
                                        }}>
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(sale.subtotal)}</span>
                                        </div>

                                        {discountToShow > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '12px',
                                                marginBottom: '4px'
                                            }}>
                                                <span>Discount:</span>
                                                <span>-{formatCurrency(discountToShow)}</span>
                                            </div>
                                        )}

                                        {sale.tax > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '12px',
                                                marginBottom: '4px'
                                            }}>
                                                <span>Tax:</span>
                                                <span>+{formatCurrency(sale.tax)}</span>
                                            </div>
                                        )}

                                        <div style={{
                                            borderTop: '2px solid black',
                                            paddingTop: '8px',
                                            marginTop: '8px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '16px',
                                                fontWeight: 'bold'
                                            }}>
                                                <span>Total Amount:</span>
                                                <span>{formatCurrency(totalToShow)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px' }}>
                                    <span style={{ fontWeight: 'bold' }}>Payment Status: </span>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: sale.payment_status === 'paid' ? 'green' :
                                            sale.payment_status === 'partial' ? 'orange' : 'red'
                                    }}>
                                        {sale.payment_status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                borderTop: '1px solid #ccc',
                                paddingTop: '16px',
                                marginTop: '32px'
                            }}>
                                <div style={{
                                    textAlign: 'center',
                                    fontSize: '10px',
                                    color: '#666'
                                }}>
                                    <p style={{ margin: '2px 0' }}>Thank you for your business!</p>
                                    <p style={{ margin: '2px 0' }}>This is a computer generated invoice.</p>
                                    <p style={{ margin: '8px 0 2px 0' }}>
                                        For any queries, please contact us at {companyInfo.phone} or {companyInfo.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title={`Sale Details - ${sale.invoice_number}`}>
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

                        {/* Collect Payment Button - Show only if there's due amount */}
                        {sale.due_amount > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                Collect Payment
                            </button>
                        )}

                        <button
                            onClick={() => setShowPrintView(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
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
                            </div>
                        </div>

                        {/* Due Amount Alert - Show if there's due */}
                        {sale.due_amount > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-red-900 mb-1">
                                            Payment Pending
                                        </h3>
                                        <p className="text-sm text-red-700 mb-3">
                                            Due amount: <span className="font-bold">{formatCurrency(sale.due_amount)}</span>
                                        </p>
                                        <button
                                            onClick={() => setShowPaymentModal(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Collect Payment Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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

            {/* Payment Modal */}
            {showPaymentModal && <PaymentModal />}

            {/* Print Modal */}
            {showPrintView && <PrintableInvoice />}
        </AdminLayout>
    );
}
