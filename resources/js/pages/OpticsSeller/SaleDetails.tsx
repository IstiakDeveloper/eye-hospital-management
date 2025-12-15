import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    Glasses,
    CheckCircle,
    Truck,
    CreditCard,
    Plus
} from 'lucide-react';

interface OpticsSaleItem {
    id: number;
    item_name: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface OpticsSalePayment {
    id: number;
    amount: number;
    payment_method: string;
    transaction_id?: string;
    notes?: string;
    received_by: {
        name: string;
    };
    created_at: string;
}

interface OpticsSale {
    id: number;
    invoice_number: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    patient?: {
        name: string;
        phone?: string;
        email?: string;
        patient_id?: string;
    } | null;
    seller: {
        name: string;
    };
    items: OpticsSaleItem[];
    payments: OpticsSalePayment[];
    glass_fitting_price: number;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    status: 'pending' | 'ready' | 'delivered';
    notes?: string;
    created_at: string;
}

interface SaleDetailsProps {
    sale: OpticsSale;
}

export default function SaleDetails({ sale }: SaleDetailsProps) {
    const [showPrintView, setShowPrintView] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        amount: sale.due_amount.toString(),
        payment_method: 'cash',
        transaction_id: '',
        notes: ''
    });

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
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleStatusUpdate = (newStatus: string) => {
        if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
            router.post(`/optics-seller/sales/${sale.id}/update-status`, {
                status: newStatus
            });
        }
    };

    const openPaymentModal = () => {
        // Reset and set amount to current due amount
        setData({
            amount: sale.due_amount.toString(),
            payment_method: 'cash',
            transaction_id: '',
            notes: ''
        });
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        reset();
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/optics-seller/sales/${sale.id}/payment`, {
            onSuccess: () => {
                closePaymentModal();
            },
            onError: (errors) => {
                console.error('Payment error:', errors);
            }
        });
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <FileText className="w-4 h-4" /> };
            case 'ready':
                return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="w-4 h-4" /> };
            case 'delivered':
                return { color: 'bg-green-100 text-green-800 border-green-200', icon: <Truck className="w-4 h-4" /> };
            default:
                return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <FileText className="w-4 h-4" /> };
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            cash: 'bg-green-100 text-green-800',
            card: 'bg-blue-100 text-blue-800',
            bkash: 'bg-pink-100 text-pink-800',
            nagad: 'bg-orange-100 text-orange-800',
            rocket: 'bg-purple-100 text-purple-800'
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    // Calculate totals from items
    const itemsSubtotal = sale.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

    // Calculate total paid - Only sum due payments (exclude advance payment from payments array)
    const duePaymentsTotal = sale.payments
        .filter(payment => payment.notes !== 'Advance Payment')
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const totalPaid = (Number(sale.advance_payment) || 0) + duePaymentsTotal;

    const statusBadge = getStatusBadge(sale.status);

    return (
        <AdminLayout title={`Sale Details - ${sale.invoice_number}`}>
            <Head title={`Sale Details - ${sale.invoice_number}`} />

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
                            <h1 className="text-3xl font-bold text-gray-900">{sale.invoice_number}</h1>
                            <p className="text-gray-600 mt-1">Optics sale transaction details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.color}`}>
                            {statusBadge.icon}
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
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
                    {/* Main Content */}
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
                                            <span className="text-sm font-medium text-gray-900">
                                                {sale.customer_name || 'Walk-in Customer'}
                                            </span>
                                        </div>
                                        {sale.customer_phone && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 text-gray-400">📞</span>
                                                <span className="text-sm text-gray-900">
                                                    {sale.customer_phone}
                                                </span>
                                            </div>
                                        )}
                                        {sale.customer_email && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 text-gray-400">✉️</span>
                                                <span className="text-sm text-gray-900">
                                                    {sale.customer_email}
                                                </span>
                                            </div>
                                        )}
                                        {sale.patient?.patient_id && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 text-gray-400">🆔</span>
                                                <span className="text-xs text-blue-600 font-medium">
                                                    Patient ID: {sale.patient.patient_id}
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
                                            <span className="text-sm text-gray-900">{formatDate(sale.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">Sold by: {sale.seller.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{sale.items.length} item(s)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {sale.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {sale.notes}
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
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Price
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sale.items.map((item) => (
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
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm text-gray-900">
                                                        {item.quantity}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {formatCurrency(item.unit_price)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(item.total_price)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Fitting Charge Row */}
                                        {sale.glass_fitting_price > 0 && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={4} className="px-6 py-3 text-right">
                                                    <span className="text-sm font-medium text-gray-700">Fitting Charge:</span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(sale.glass_fitting_price)}
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {/* Total Row */}
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={4} className="px-6 py-3 text-right">
                                                <span className="text-sm font-bold text-gray-900">Total Amount:</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-base font-bold text-gray-900">
                                                    {formatCurrency(sale.total_amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                                {sale.due_amount > 0 && (
                                    <button
                                        onClick={openPaymentModal}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Payment
                                    </button>
                                )}
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Advance Payment - Show from sale.advance_payment field */}
                                {sale.advance_payment > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-blue-900">Advance Payment</p>
                                                <p className="text-xs text-blue-600">
                                                    {formatDate(sale.created_at)} • {sale.seller.name}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-blue-700">
                                            {formatCurrency(sale.advance_payment)}
                                        </span>
                                    </div>
                                )}

                                {/* Additional/Due Payments - Filter out advance payment */}
                                {sale.payments
                                    .filter(payment => payment.notes !== 'Advance Payment')
                                    .map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 p-2 rounded-lg">
                                                    <CreditCard className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-green-900">Due Payment</p>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentMethodBadge(payment.payment_method)}`}>
                                                            {payment.payment_method.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-green-600">
                                                        {formatDate(payment.created_at)} • {payment.received_by.name}
                                                    </p>
                                                    {payment.transaction_id && (
                                                        <p className="text-xs text-green-600 mt-0.5">
                                                            TxnID: {payment.transaction_id}
                                                        </p>
                                                    )}
                                                    {payment.notes && (
                                                        <p className="text-xs text-gray-700 mt-1 italic">
                                                            "{payment.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-base font-bold text-green-700">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    ))}

                                {/* Empty State */}
                                {sale.payments.filter(p => p.notes !== 'Advance Payment').length === 0 && sale.advance_payment === 0 && (
                                    <div className="text-center py-8">
                                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No payments recorded yet</p>
                                    </div>
                                )}

                                {/* Only Due Payments Empty State */}
                                {sale.advance_payment > 0 && sale.payments.filter(p => p.notes !== 'Advance Payment').length === 0 && (
                                    <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                                        <p className="text-gray-500 text-sm">No due payments yet</p>
                                        {sale.due_amount > 0 && (
                                            <p className="text-orange-600 text-xs mt-1 font-medium">
                                                Remaining due: {formatCurrency(sale.due_amount)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
                            <div className="space-y-3">
                                {/* Items */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items Subtotal:</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(itemsSubtotal)}</span>
                                </div>

                                {/* Fitting Charge */}
                                {sale.glass_fitting_price > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Fitting Charge:</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(sale.glass_fitting_price)}</span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                                        <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</span>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-800 font-medium">Advance Payment:</span>
                                        <span className="font-semibold text-blue-900">{formatCurrency(sale.advance_payment)}</span>
                                    </div>
                                    {duePaymentsTotal > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-800 font-medium">Due Payments:</span>
                                            <span className="font-semibold text-blue-900">{formatCurrency(duePaymentsTotal)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-blue-300 pt-2 flex justify-between text-sm">
                                        <span className="text-blue-900 font-semibold">Total Paid:</span>
                                        <span className="font-bold text-green-700">{formatCurrency(totalPaid)}</span>
                                    </div>
                                </div>

                                {/* Due Amount */}
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-base font-semibold text-gray-900">Remaining Due:</span>
                                        <span className={`text-lg font-bold ${sale.due_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {formatCurrency(sale.due_amount)}
                                        </span>
                                    </div>
                                    {sale.due_amount === 0 && (
                                        <p className="text-xs text-green-600 text-right mt-1 font-medium">✓ Fully Paid</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Management */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h2>
                            <div className="space-y-3">
                                {sale.status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusUpdate('ready')}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Ready
                                    </button>
                                )}
                                {sale.status === 'ready' && (
                                    <>
                                        {sale.due_amount > 0 ? (
                                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                <p className="text-sm text-orange-800">
                                                    Payment incomplete. Collect due amount before delivery.
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate('delivered')}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Truck className="w-4 h-4" />
                                                Mark as Delivered
                                            </button>
                                        )}
                                    </>
                                )}
                                {sale.status === 'delivered' && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-800 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Sale completed successfully
                                        </p>
                                    </div>
                                )}
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
                                        <CreditCard className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-gray-600">Payments Made</span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">
                                        {(sale.advance_payment > 0 ? 1 : 0) + sale.payments.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-600">Sale Date</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {new Date(sale.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
                            <button
                                type="button"
                                onClick={closePaymentModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Amount *
                                </label>
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    max={sale.due_amount}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Due Amount: {formatCurrency(sale.due_amount)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method *
                                </label>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                </select>
                            </div>

                            {data.payment_method !== 'cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.transaction_id}
                                        onChange={(e) => setData('transaction_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter transaction ID"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Optional notes"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                >
                                    {processing ? 'Processing...' : 'Add Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print View - Simplified for now, can be enhanced later */}
            {showPrintView && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 no-print">
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
                            <div className="print-area">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold">NICHPC Optics</h1>
                                    <p className="text-sm">Main Road, Naogaon.</p>
                                    <p className="text-sm">Phone: +88 01307-885566</p>
                                </div>
                                <div className="mb-4">
                                    <p><strong>Invoice:</strong> {sale.invoice_number}</p>
                                    <p><strong>Date:</strong> {formatDate(sale.created_at)}</p>
                                    <p><strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}</p>
                                    {sale.customer_phone && <p><strong>Phone:</strong> {sale.customer_phone}</p>}
                                </div>
                                <table className="w-full border-collapse border border-gray-300 mb-4">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                                            <th className="border border-gray-300 px-2 py-1 text-center">Qty</th>
                                            <th className="border border-gray-300 px-2 py-1 text-right">Price</th>
                                            <th className="border border-gray-300 px-2 py-1 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="border border-gray-300 px-2 py-1">{item.item_name}</td>
                                                <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
                                                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.total_price)}</td>
                                            </tr>
                                        ))}
                                        {sale.glass_fitting_price > 0 && (
                                            <tr>
                                                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right font-medium">Fitting Charge:</td>
                                                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(sale.glass_fitting_price)}</td>
                                            </tr>
                                        )}
                                        <tr className="font-bold">
                                            <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right">Total:</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(sale.total_amount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="text-center text-xs text-gray-600">
                                    <p>Thank you for your business!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
