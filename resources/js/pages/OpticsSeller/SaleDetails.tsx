import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
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
    Glasses
} from 'lucide-react';

interface StockMovement {
    id: number;
    item_name: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Transaction {
    id: number;
    transaction_no: string;
    description: string;
    amount: number;
    transaction_date: string;
    created_at: string;
    created_by: {
        name: string;
    };
}

interface SaleDetailsProps {
    transaction: Transaction;
    stockMovements: StockMovement[];
}

export default function SaleDetails({ transaction, stockMovements }: SaleDetailsProps) {
    const [showPrintView, setShowPrintView] = useState(false);

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

    const extractCustomerName = (description: string) => {
        const match = description.match(/POS Sale to (.+?) (?:\(|-)/) || description.match(/Sale to (.+?) -/);
        return match ? match[1] : 'Walk-in Customer';
    };

    const extractCustomerPhone = (description: string) => {
        const match = description.match(/\((\d+)\)/);
        return match ? match[1] : null;
    };

    const extractNotes = (description: string) => {
        const match = description.match(/Notes: (.+?)(?:\s*$|\s*\|)/);
        return match ? match[1] : null;
    };

    const getItemTypeIcon = (itemType: string) => {
        switch (itemType) {
            case 'glasses':
                return <Glasses className="w-4 h-4 text-blue-600" />;
            case 'complete_glasses':
                return <Eye className="w-4 h-4 text-green-600" />;
            case 'lens_types':
                return <Package className="w-4 h-4 text-purple-600" />;
            default:
                return <Package className="w-4 h-4 text-gray-600" />;
        }
    };

    const getItemTypeName = (itemType: string) => {
        switch (itemType) {
            case 'glasses':
                return 'Frame';
            case 'complete_glasses':
                return 'Complete Glasses';
            case 'lens_types':
                return 'Lens';
            default:
                return 'Item';
        }
    };

    // Calculate totals from stock movements
    const subtotal = stockMovements.reduce((sum, item) => sum + item.total_price, 0);
    const estimatedProfit = subtotal * 0.3; // Assuming 30% profit margin

    // Printable Invoice Component
    const PrintableInvoice = () => {
        const companyInfo = {
            name: "NICHPC Optics",
            address: "Main Road, Naogaon.",
            phone: "+88 01307-885566",
            email: "niehpc@gamil.com",
            license: "OL-12345"
        };

        const customerName = extractCustomerName(transaction.description);
        const customerPhone = extractCustomerPhone(transaction.description);
        const notes = extractNotes(transaction.description);

        const handlePrint = () => {
            window.print();
        };

        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
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

                        {/* Print/Close Buttons */}
                        <div className="no-print mb-4 flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-semibold">Invoice Preview</h2>
                            <div className="flex gap-2">
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
                                            Transaction #: {transaction.transaction_no}
                                        </p>
                                        <p style={{ margin: '2px 0' }}>Date: {formatDate(transaction.transaction_date)}</p>
                                        <p style={{ margin: '2px 0' }}>Seller: {transaction.created_by.name}</p>
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
                                        {customerName}
                                    </p>
                                    {customerPhone && (
                                        <p style={{ margin: '2px 0' }}>Phone: {customerPhone}</p>
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
                                                Item
                                            </th>
                                            <th style={{
                                                border: '1px solid black',
                                                padding: '8px',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Type
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
                                        {stockMovements && stockMovements.length > 0 ? stockMovements.map((item, index) => (
                                            <tr key={item.id || index}>
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
                                                    {item.item_name}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    {getItemTypeName(item.item_type)}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'center'
                                                }}>
                                                    {item.quantity}
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
                                        )) : (
                                            <tr>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    1
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    Optics Item
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px'
                                                }}>
                                                    Item
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'center'
                                                }}>
                                                    1
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'right'
                                                }}>
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    textAlign: 'right',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                            </tr>
                                        )}
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
                                            <span>{formatCurrency(transaction.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {notes && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: 'black',
                                        margin: '0 0 8px 0'
                                    }}>
                                        Notes:
                                    </h3>
                                    <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>
                                        {notes}
                                    </p>
                                </div>
                            )}

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
        <AdminLayout title={`Sale Details - ${transaction.transaction_no}`}>
            <Head title={`Sale Details - ${transaction.transaction_no}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/optics-seller/sales"
                            className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{transaction.transaction_no}</h1>
                            <p className="text-gray-600 mt-1">Optics sale transaction details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                            completed
                        </span>
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
                    {/* Transaction Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer & Sale Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">
                                                {extractCustomerName(transaction.description)}
                                            </span>
                                        </div>
                                        {extractCustomerPhone(transaction.description) && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 text-gray-400">📞</span>
                                                <span className="text-sm text-gray-900">
                                                    {extractCustomerPhone(transaction.description)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Sale Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{formatDate(transaction.transaction_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">Sold by: {transaction.created_by.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{stockMovements?.length || 1} items</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {extractNotes(transaction.description) && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {extractNotes(transaction.description)}
                                    </p>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Item
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
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
                                        {stockMovements && stockMovements.length > 0 ? stockMovements.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.item_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getItemTypeIcon(item.item_type)}
                                                        <span className="text-sm text-gray-900">
                                                            {getItemTypeName(item.item_type)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {item.quantity}
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
                                        )) : (
                                            <tr>
                                                <td className="px-6 py-4 text-center" colSpan={5}>
                                                    <div className="text-sm text-gray-500">
                                                        No detailed items available. Total sale amount: {formatCurrency(transaction.amount)}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
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
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-base font-medium text-gray-900">Total Amount:</span>
                                        <span className="text-lg font-bold text-gray-900">{formatCurrency(transaction.amount)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-gray-600">Estimated Profit:</span>
                                        <span className="text-base font-bold text-green-600">{formatCurrency(estimatedProfit)}</span>
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
                                    <span className="text-sm font-semibold text-gray-900">{stockMovements?.length || 1}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-600">Profit Margin</span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">
                                        ~30%
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-600">Sale Date</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {new Date(transaction.transaction_date).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Modal */}
            {showPrintView && <PrintableInvoice />}
        </AdminLayout>
    );
}
