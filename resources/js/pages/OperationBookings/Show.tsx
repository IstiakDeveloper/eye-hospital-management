import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ArrowLeft, FileText, User, Calendar, DollarSign, CheckCircle,
    AlertCircle, Clock, CreditCard, Printer, Receipt, X, Check
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
}

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
    };
    specialization: string;
}

interface Operation {
    id: number;
    operation_code: string;
    operation_name: string;
    operation_type: string;
}

interface UserInfo {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    payment_no: string;
    amount: number;
    payment_method: string;
    payment_type: string;
    payment_reference?: string;
    payment_date: string;
    notes?: string;
    received_by: UserInfo;
    created_at: string;
}

interface OperationBooking {
    id: number;
    booking_no: string;
    patient: Patient;
    doctor: Doctor | null;
    operation: Operation;
    operation_name: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    base_amount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    discount_amount?: number;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    payment_status: string;
    notes?: string;
    cancellation_reason?: string;
    booked_by: UserInfo;
    performed_by?: UserInfo;
    completed_at?: string;
    cancelled_at?: string;
    created_at: string;
    // Eye surgery specific fields
    surgery_type?: string;
    eye_side?: 'left' | 'right';
    lens_type?: string;
    power?: string;
    surgery_remarks?: string;
}

interface Permissions {
    edit: boolean;
    delete: boolean;
    payment: boolean;
    confirm: boolean;
    complete: boolean;
    cancel: boolean;
    reschedule: boolean;
}

interface Props {
    booking: OperationBooking;
    payments: Payment[];
    can: Permissions;
}

export default function OperationBookingShow({ booking, payments, can }: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(booking.due_amount.toString());
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Cancel modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    // Reschedule modal states
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    const formatCurrency = (amount: number) => `৳${Number(amount).toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');
    const formatDateTime = (date: string) => new Date(date).toLocaleString('en-GB');
    const formatTime = (time: string) => time.slice(0, 5);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: React.ReactElement }> = {
            scheduled: { bg: 'bg-blue-100 text-blue-800', text: 'Scheduled', icon: <Calendar className="w-3 h-3" /> },
            confirmed: { bg: 'bg-purple-100 text-purple-800', text: 'Confirmed', icon: <CheckCircle className="w-3 h-3" /> },
            completed: { bg: 'bg-green-100 text-green-800', text: 'Completed', icon: <CheckCircle className="w-3 h-3" /> },
            cancelled: { bg: 'bg-red-100 text-red-800', text: 'Cancelled', icon: <X className="w-3 h-3" /> },
            rescheduled: { bg: 'bg-yellow-100 text-yellow-800', text: 'Rescheduled', icon: <Clock className="w-3 h-3" /> }
        };
        const badge = badges[status] || badges.scheduled;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            unpaid: { bg: 'bg-red-100 text-red-800', text: 'Unpaid' },
            partial: { bg: 'bg-yellow-100 text-yellow-800', text: 'Partial' },
            paid: { bg: 'bg-green-100 text-green-800', text: 'Paid' }
        };
        const badge = badges[status] || badges.unpaid;
        return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>{badge.text}</span>;
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (amount <= 0 || amount > booking.due_amount) {
            alert('Invalid payment amount');
            return;
        }

        setLoading(true);
        router.post(`/operation-bookings/${booking.id}/payment`, {
            amount,
            payment_method: paymentMethod,
            payment_reference: paymentReference || undefined,
            notes: paymentNotes || undefined
        }, {
            onFinish: () => {
                setLoading(false);
                setShowPaymentModal(false);
                setPaymentAmount(booking.due_amount.toString());
                setPaymentReference('');
                setPaymentNotes('');
            }
        });
    };

    const handleConfirm = () => {
        if (confirm('Confirm this operation booking?')) {
            router.patch(`/operation-bookings/${booking.id}/confirm`);
        }
    };

    const handleComplete = () => {
        if (confirm('Mark this operation as completed?')) {
            router.patch(`/operation-bookings/${booking.id}/complete`, {});
        }
    };

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellationReason) {
            alert('Please provide a cancellation reason');
            return;
        }
        setLoading(true);
        router.patch(`/operation-bookings/${booking.id}/cancel`, {
            cancellation_reason: cancellationReason
        }, {
            onFinish: () => {
                setLoading(false);
                setShowCancelModal(false);
            }
        });
    };

    const handleReschedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate || !newTime) {
            alert('Please provide new date and time');
            return;
        }
        setLoading(true);
        router.patch(`/operation-bookings/${booking.id}/reschedule`, {
            scheduled_date: newDate,
            scheduled_time: newTime
        }, {
            onFinish: () => {
                setLoading(false);
                setShowRescheduleModal(false);
            }
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.visit('/operation-bookings')}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Booking #{booking.booking_no}</h1>
                                <p className="text-gray-600 mt-1">View and manage operation booking details</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit(`/operation-bookings/${booking.id}/receipt`)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Receipt className="w-4 h-4" />
                                Receipt
                            </button>
                            {can.payment && booking.payment_status !== 'paid' && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Add Payment
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Patient & Operation Info */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Details</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <div className="font-medium">{booking.patient.name}</div>
                                                    <div className="text-sm text-gray-500">{booking.patient.patient_id}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">{booking.patient.phone}</div>
                                            {booking.patient.age && (
                                                <div className="text-sm text-gray-600">{booking.patient.age}y • {booking.patient.gender}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Operation Details</h3>
                                        <div className="space-y-2">
                                            <div className="font-medium">{booking.operation_name}</div>
                                            <div className="text-sm text-gray-600">{booking.operation.operation_type}</div>
                                            <div className="text-sm text-gray-500">Code: {booking.operation.operation_code}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Doctor</h3>
                                        <div className="font-medium">{booking.doctor?.user?.name || 'N/A'}</div>
                                        <div className="text-sm text-gray-600">{booking.doctor?.specialization || ''}</div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Schedule</h3>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{formatDate(booking.scheduled_date)}</div>
                                                <div className="text-sm text-gray-600">{formatTime(booking.scheduled_time)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Eye Surgery Details */}
                                {(booking.surgery_type || booking.eye_side || booking.lens_type || booking.power || booking.surgery_remarks) && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">Eye Surgery Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {booking.surgery_type && (
                                                <div>
                                                    <div className="text-xs text-gray-500">Surgery Type</div>
                                                    <div className="text-sm font-medium text-gray-900">{booking.surgery_type}</div>
                                                </div>
                                            )}
                                            {booking.eye_side && (
                                                <div>
                                                    <div className="text-xs text-gray-500">Eye Side</div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {booking.eye_side === 'left' ? 'Left Eye' : 'Right Eye'}
                                                    </div>
                                                </div>
                                            )}
                                            {booking.lens_type && (
                                                <div>
                                                    <div className="text-xs text-gray-500">Lens Type</div>
                                                    <div className="text-sm font-medium text-gray-900">{booking.lens_type}</div>
                                                </div>
                                            )}
                                            {booking.power && (
                                                <div>
                                                    <div className="text-xs text-gray-500">Power</div>
                                                    <div className="text-sm font-medium text-gray-900">{booking.power}</div>
                                                </div>
                                            )}
                                        </div>
                                        {booking.surgery_remarks && (
                                            <div className="mt-3">
                                                <div className="text-xs text-gray-500">Surgery Remarks</div>
                                                <div className="text-sm text-gray-700">{booking.surgery_remarks}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {booking.notes && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                                        <p className="text-sm text-gray-700">{booking.notes}</p>
                                    </div>
                                )}

                                {booking.cancellation_reason && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h3 className="text-sm font-medium text-red-600 mb-2">Cancellation Reason</h3>
                                        <p className="text-sm text-gray-700">{booking.cancellation_reason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment History */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                                {payments.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No payments recorded</p>
                                ) : (
                                    <div className="space-y-3">
                                        {payments.map((payment) => (
                                            <div key={payment.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {payment.payment_method.replace('_', ' ')} • {payment.payment_type}
                                                        </div>
                                                        {payment.payment_reference && (
                                                            <div className="text-xs text-gray-500">Ref: {payment.payment_reference}</div>
                                                        )}
                                                        {payment.notes && (
                                                            <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">{formatDate(payment.payment_date)}</div>
                                                        <div className="text-xs text-gray-500">By: {payment.received_by.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-4">Status</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Booking Status</div>
                                        {getStatusBadge(booking.status)}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                                        {getPaymentStatusBadge(booking.payment_status)}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-4">Payment Summary</h3>
                                <div className="space-y-3">
                                    {booking.base_amount && booking.discount_amount ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base Amount</span>
                                                <span className="font-semibold">{formatCurrency(booking.base_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    Discount
                                                    {booking.discount_type === 'percentage' && booking.discount_value
                                                        ? ` (${booking.discount_value}%)`
                                                        : ''
                                                    }
                                                </span>
                                                <span className="font-semibold text-orange-600">-{formatCurrency(booking.discount_amount)}</span>
                                            </div>
                                            <div className="flex justify-between pb-3 border-b">
                                                <span className="font-medium">Total Amount</span>
                                                <span className="font-semibold text-blue-600">{formatCurrency(booking.total_amount)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between pb-3 border-b">
                                            <span className="text-gray-600">Total Amount</span>
                                            <span className="font-semibold">{formatCurrency(booking.total_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paid Amount</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(booking.advance_payment)}</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t">
                                        <span className="font-medium">Due Amount</span>
                                        <span className="font-bold text-red-600">{formatCurrency(booking.due_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-4">Actions</h3>
                                <div className="space-y-2">
                                    {can.confirm && booking.status === 'scheduled' && (
                                        <button
                                            onClick={handleConfirm}
                                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                        >
                                            Confirm Booking
                                        </button>
                                    )}
                                    {can.complete && ['scheduled', 'confirmed'].includes(booking.status) && (
                                        <button
                                            onClick={handleComplete}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Mark as Completed
                                        </button>
                                    )}
                                    {can.reschedule && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => setShowRescheduleModal(true)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Reschedule
                                        </button>
                                    )}
                                    {can.cancel && booking.status !== 'completed' && (
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-4">Booking Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Booked By:</span>
                                        <div className="font-medium">{booking.booked_by.name}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Booked On:</span>
                                        <div>{formatDateTime(booking.created_at)}</div>
                                    </div>
                                    {booking.performed_by && (
                                        <div>
                                            <span className="text-gray-500">Performed By:</span>
                                            <div className="font-medium">{booking.performed_by.name}</div>
                                        </div>
                                    )}
                                    {booking.completed_at && (
                                        <div>
                                            <span className="text-gray-500">Completed On:</span>
                                            <div>{formatDateTime(booking.completed_at)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Modal */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                <h2 className="text-xl font-semibold mb-4">Add Payment</h2>
                                <form onSubmit={handleAddPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Amount</label>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            max={booking.due_amount}
                                            min="0.01"
                                            step="0.01"
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Due: {formatCurrency(booking.due_amount)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="mobile_banking">Mobile Banking</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Reference (Optional)</label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                        <textarea
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            {loading ? 'Processing...' : 'Add Payment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Cancel Modal */}
                    {showCancelModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                <h2 className="text-xl font-semibold mb-4">Cancel Booking</h2>
                                <form onSubmit={handleCancel} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Cancellation Reason *</label>
                                        <textarea
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            rows={3}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowCancelModal(false)}
                                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            {loading ? 'Cancelling...' : 'Confirm Cancel'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Reschedule Modal */}
                    {showRescheduleModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                <h2 className="text-xl font-semibold mb-4">Reschedule Operation</h2>
                                <form onSubmit={handleReschedule} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">New Date *</label>
                                        <input
                                            type="date"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">New Time *</label>
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowRescheduleModal(false)}
                                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
