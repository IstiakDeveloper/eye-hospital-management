import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, CreditCard, Eye, FileText, Glasses, Package, Plus, Printer, Truck, User, X } from 'lucide-react';
import React, { useState } from 'react';

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
        notes: '',
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
            minute: '2-digit',
        });
    };

    const handleStatusUpdate = (newStatus: string) => {
        if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
            router.post(`/optics-seller/sales/${sale.id}/update-status`, {
                status: newStatus,
            });
        }
    };

    const openPaymentModal = () => {
        // Reset and set amount to current due amount
        setData({
            amount: sale.due_amount.toString(),
            payment_method: 'cash',
            transaction_id: '',
            notes: '',
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
            },
        });
    };

    const getItemTypeIcon = (itemType: string) => {
        switch (itemType) {
            case 'glasses':
                return <Glasses className="h-4 w-4 text-blue-600" />;
            case 'complete_glasses':
                return <Eye className="h-4 w-4 text-green-600" />;
            case 'lens_types':
                return <Package className="h-4 w-4 text-purple-600" />;
            default:
                return <Package className="h-4 w-4 text-gray-600" />;
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
                return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <FileText className="h-4 w-4" /> };
            case 'ready':
                return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="h-4 w-4" /> };
            case 'delivered':
                return { color: 'bg-green-100 text-green-800 border-green-200', icon: <Truck className="h-4 w-4" /> };
            default:
                return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <FileText className="h-4 w-4" /> };
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            cash: 'bg-green-100 text-green-800',
            card: 'bg-blue-100 text-blue-800',
            bkash: 'bg-pink-100 text-pink-800',
            nagad: 'bg-orange-100 text-orange-800',
            rocket: 'bg-purple-100 text-purple-800',
        };
        return colors[method] || 'bg-gray-100 text-gray-800';
    };

    // Calculate totals from items
    const itemsSubtotal = sale.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

    // Calculate total paid - Only sum due payments (exclude advance payment from payments array)
    const duePaymentsTotal = sale.payments
        .filter((payment) => payment.notes !== 'Advance Payment')
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
                            className="inline-flex items-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{sale.invoice_number}</h1>
                            <p className="mt-1 text-gray-600">Optics sale transaction details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${statusBadge.color}`}>
                            {statusBadge.icon}
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                        </span>
                        <button
                            onClick={() => setShowPrintView(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Customer & Sale Info */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Transaction Information</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-gray-500">Customer Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">{sale.customer_name || 'Walk-in Customer'}</span>
                                        </div>
                                        {sale.customer_phone && (
                                            <div className="flex items-center gap-2">
                                                <span className="h-4 w-4 text-gray-400">📞</span>
                                                <span className="text-sm text-gray-900">{sale.customer_phone}</span>
                                            </div>
                                        )}
                                        {sale.customer_email && (
                                            <div className="flex items-center gap-2">
                                                <span className="h-4 w-4 text-gray-400">✉️</span>
                                                <span className="text-sm text-gray-900">{sale.customer_email}</span>
                                            </div>
                                        )}
                                        {sale.patient?.patient_id && (
                                            <div className="flex items-center gap-2">
                                                <span className="h-4 w-4 text-gray-400">🆔</span>
                                                <span className="text-xs font-medium text-blue-600">Patient ID: {sale.patient.patient_id}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-3 text-sm font-medium text-gray-500">Sale Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{formatDate(sale.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">Sold by: {sale.seller.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{sale.items.length} item(s)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {sale.notes && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <h3 className="mb-2 text-sm font-medium text-gray-500">Notes</h3>
                                    <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">{sale.notes}</p>
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
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Unit Price
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {sale.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getItemTypeIcon(item.item_type)}
                                                        <span className="text-sm text-gray-900">{getItemTypeName(item.item_type)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="text-sm text-gray-900">{item.quantity}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</div>
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
                                                <span className="text-base font-bold text-gray-900">{formatCurrency(sale.total_amount)}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                                {sale.due_amount > 0 && (
                                    <button
                                        onClick={openPaymentModal}
                                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Payment
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4 p-6">
                                {/* Advance Payment - Show from sale.advance_payment field */}
                                {sale.advance_payment > 0 && (
                                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2">
                                                <CreditCard className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-blue-900">Advance Payment</p>
                                                <p className="text-xs text-blue-600">
                                                    {formatDate(sale.created_at)} • {sale.seller.name}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-blue-700">{formatCurrency(sale.advance_payment)}</span>
                                    </div>
                                )}

                                {/* Additional/Due Payments - Filter out advance payment */}
                                {sale.payments
                                    .filter((payment) => payment.notes !== 'Advance Payment')
                                    .map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-green-100 p-2">
                                                    <CreditCard className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-green-900">Due Payment</p>
                                                        <span
                                                            className={`rounded px-2 py-0.5 text-xs font-medium ${getPaymentMethodBadge(payment.payment_method)}`}
                                                        >
                                                            {payment.payment_method.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-green-600">
                                                        {formatDate(payment.created_at)} • {payment.received_by.name}
                                                    </p>
                                                    {payment.transaction_id && (
                                                        <p className="mt-0.5 text-xs text-green-600">TxnID: {payment.transaction_id}</p>
                                                    )}
                                                    {payment.notes && <p className="mt-1 text-xs text-gray-700 italic">"{payment.notes}"</p>}
                                                </div>
                                            </div>
                                            <span className="text-base font-bold text-green-700">{formatCurrency(payment.amount)}</span>
                                        </div>
                                    ))}

                                {/* Empty State */}
                                {sale.payments.filter((p) => p.notes !== 'Advance Payment').length === 0 && sale.advance_payment === 0 && (
                                    <div className="py-8 text-center">
                                        <CreditCard className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                        <p className="text-sm text-gray-500">No payments recorded yet</p>
                                    </div>
                                )}

                                {/* Only Due Payments Empty State */}
                                {sale.advance_payment > 0 && sale.payments.filter((p) => p.notes !== 'Advance Payment').length === 0 && (
                                    <div className="rounded-lg border-2 border-dashed border-gray-200 py-4 text-center">
                                        <p className="text-sm text-gray-500">No due payments yet</p>
                                        {sale.due_amount > 0 && (
                                            <p className="mt-1 text-xs font-medium text-orange-600">
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
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Summary</h2>
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
                                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-blue-800">Advance Payment:</span>
                                        <span className="font-semibold text-blue-900">{formatCurrency(sale.advance_payment)}</span>
                                    </div>
                                    {duePaymentsTotal > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-blue-800">Due Payments:</span>
                                            <span className="font-semibold text-blue-900">{formatCurrency(duePaymentsTotal)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t border-blue-300 pt-2 text-sm">
                                        <span className="font-semibold text-blue-900">Total Paid:</span>
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
                                    {sale.due_amount === 0 && <p className="mt-1 text-right text-xs font-medium text-green-600">✓ Fully Paid</p>}
                                </div>
                            </div>
                        </div>

                        {/* Status Management */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Management</h2>
                            <div className="space-y-3">
                                {sale.status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusUpdate('ready')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark as Ready
                                    </button>
                                )}
                                {sale.status === 'ready' && (
                                    <>
                                        {sale.due_amount > 0 ? (
                                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                                                <p className="text-sm text-orange-800">Payment incomplete. Collect due amount before delivery.</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate('delivered')}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                            >
                                                <Truck className="h-4 w-4" />
                                                Mark as Delivered
                                            </button>
                                        )}
                                    </>
                                )}
                                {sale.status === 'delivered' && (
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                        <p className="flex items-center gap-2 text-sm text-green-800">
                                            <CheckCircle className="h-4 w-4" />
                                            Sale completed successfully
                                        </p>
                                    </div>
                                )}
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
                                        <CreditCard className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-gray-600">Payments Made</span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600">
                                        {(sale.advance_payment > 0 ? 1 : 0) + sale.payments.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-purple-600" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
                            <button type="button" onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Payment Amount *</label>
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter amount"
                                    required
                                    min="1"
                                    max={sale.due_amount}
                                />
                                <p className="mt-1 text-xs text-gray-500">Due Amount: {formatCurrency(sale.due_amount)}</p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method *</label>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData('payment_method', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Transaction ID</label>
                                    <input
                                        type="text"
                                        value={data.transaction_id}
                                        onChange={(e) => setData('transaction_id', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter transaction ID"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    placeholder="Optional notes"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-xl">
                        <div className="p-6">
                            <div className="no-print mb-4 flex items-center justify-between">
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
                            <div className="print-area">
                                <div className="mb-6 text-center">
                                    <h1 className="text-2xl font-bold">NICHPC Optics</h1>
                                    <p className="text-sm">Main Road, Naogaon.</p>
                                    <p className="text-sm">Phone: +88 01307-885566</p>
                                </div>
                                <div className="mb-4">
                                    <p>
                                        <strong>Invoice:</strong> {sale.invoice_number}
                                    </p>
                                    <p>
                                        <strong>Date:</strong> {formatDate(sale.created_at)}
                                    </p>
                                    <p>
                                        <strong>Customer:</strong> {sale.customer_name || 'Walk-in Customer'}
                                    </p>
                                    {sale.customer_phone && (
                                        <p>
                                            <strong>Phone:</strong> {sale.customer_phone}
                                        </p>
                                    )}
                                </div>
                                <table className="mb-4 w-full border-collapse border border-gray-300">
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
                                                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right font-medium">
                                                    Fitting Charge:
                                                </td>
                                                <td className="border border-gray-300 px-2 py-1 text-right">
                                                    {formatCurrency(sale.glass_fitting_price)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="font-bold">
                                            <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right">
                                                Total:
                                            </td>
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
