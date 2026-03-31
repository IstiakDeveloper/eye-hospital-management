import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, CreditCard, DollarSign, FileText, Save, User } from 'lucide-react';
import { useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
}

interface Operation {
    id: number;
    name: string;
    type: string;
    price: number;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization: string;
}

interface OperationBooking {
    id: number;
    booking_no: string;
    patient: Patient;
    operation_id: number;
    doctor_id: number;
    scheduled_date: string;
    scheduled_time: string;
    base_amount: number;
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    discount_amount?: number;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    notes?: string;
    status: string;
    payment_status: string;
    // Eye surgery specific fields
    surgery_type?: string;
    eye_side?: 'left' | 'right';
    lens_type?: string;
    power?: string;
    surgery_remarks?: string;
}

interface Props {
    booking: OperationBooking;
    operations: Operation[];
    doctors: Doctor[];
}

export default function EditOperationBooking({ booking, operations, doctors }: Props) {
    const [selectedOperationId, setSelectedOperationId] = useState<number>(booking.operation_id);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(booking.doctor_id);
    const [scheduledDate, setScheduledDate] = useState(booking.scheduled_date);
    const [scheduledTime, setScheduledTime] = useState(booking.scheduled_time ? booking.scheduled_time.slice(0, 5) : '');
    const [baseAmount, setBaseAmount] = useState(booking.base_amount?.toString() || booking.total_amount?.toString() || '');
    const [notes, setNotes] = useState(booking.notes || '');
    const [loading, setLoading] = useState(false);

    // Discount fields
    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>(booking.discount_type || 'amount');
    const [discountValue, setDiscountValue] = useState(booking.discount_value?.toString() || '');

    // Payment edit field
    const [advancePaymentInput, setAdvancePaymentInput] = useState(booking.advance_payment?.toString() || '0');

    // Eye surgery specific fields
    const [surgeryType, setSurgeryType] = useState(booking.surgery_type || '');
    const [customSurgeryType, setCustomSurgeryType] = useState('');
    const [eyeSide, setEyeSide] = useState<'left' | 'right' | ''>(booking.eye_side || '');
    const [lensType, setLensType] = useState(booking.lens_type || '');
    const [customLensType, setCustomLensType] = useState('');
    const [power, setPower] = useState(booking.power || '');
    const [surgeryRemarks, setSurgeryRemarks] = useState(booking.surgery_remarks || '');

    const handleOperationChange = (operationId: number) => {
        setSelectedOperationId(operationId);
        const operation = operations.find((op) => op.id === operationId);
        if (operation) {
            setBaseAmount(operation.price.toString());
        }
    };

    // Calculate discount amount and totals
    const baseAmt = parseFloat(baseAmount) || 0;
    const discountVal = parseFloat(discountValue) || 0;
    const discountAmount = discountType === 'percentage' ? (baseAmt * discountVal) / 100 : discountVal;
    const totalAmount = Math.max(0, baseAmt - discountAmount);
    const advancePayment = parseFloat(advancePaymentInput) || 0;
    const dueAmount = Math.max(0, totalAmount - advancePayment);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            operation_id: selectedOperationId,
            doctor_id: selectedDoctorId,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            base_amount: baseAmt,
            discount_type: discountAmount > 0 ? discountType : undefined,
            discount_value: discountAmount > 0 ? discountVal : undefined,
            discount_amount: discountAmount > 0 ? discountAmount : undefined,
            total_amount: totalAmount,
            advance_payment: advancePayment, // Now editable!
            notes,
            // Eye surgery specific data
            surgery_type: surgeryType === 'other' ? customSurgeryType : surgeryType,
            eye_side: eyeSide,
            lens_type: lensType === 'other' ? customLensType : lensType,
            power: power,
            surgery_remarks: surgeryRemarks,
        };

        setLoading(true);
        router.put(`/operation-bookings/${booking.id}`, formData, {
            onFinish: () => setLoading(false),
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Operation Booking</h1>
                            <p className="mt-1 text-gray-600">Booking No: {booking.booking_no}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Details
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6">
                        <span
                            className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                                booking.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'confirmed'
                                      ? 'bg-purple-100 text-purple-800'
                                      : booking.status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span
                            className={`ml-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                                booking.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.payment_status === 'partial'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                            }`}
                        >
                            Payment: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Information - Read Only */}
                        <div className="rounded-lg bg-blue-50 p-6 shadow">
                            <div className="mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <h2 className="text-xl font-semibold">Patient Information (Read Only)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div>
                                    <div className="text-sm text-gray-600">Patient ID</div>
                                    <div className="font-semibold">{booking.patient.patient_id}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Name</div>
                                    <div className="font-semibold">{booking.patient.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Phone</div>
                                    <div className="font-semibold">{booking.patient.phone}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Age / Gender</div>
                                    <div className="font-semibold">
                                        {booking.patient.age || 'N/A'} / {booking.patient.gender || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operation Details */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-xl font-semibold">Operation Details</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Operation Type *</label>
                                    <select
                                        value={selectedOperationId}
                                        onChange={(e) => handleOperationChange(Number(e.target.value))}
                                        required
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Operation</option>
                                        {operations.map((op) => (
                                            <option key={op.id} value={op.id}>
                                                {op.name} - {op.type} (Base: ৳{op.price})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedOperationId && (
                                        <p className="mt-1 text-sm text-blue-600">
                                            💡 Selected operation base price: ৳
                                            {(Number(operations.find((op) => op.id === selectedOperationId)?.price) || 0).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Doctor *</label>
                                    <select
                                        value={selectedDoctorId}
                                        onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                                        required
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Doctor</option>
                                        {doctors.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.user.name} - {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Scheduled Date *</label>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            required
                                            className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Scheduled Time *</label>
                                    <div className="relative">
                                        <Clock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            required
                                            className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eye Surgery Details */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="mb-4 text-xl font-semibold">Eye Surgery Details</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Surgery Type (SICS/Phaco)</label>
                                    <select
                                        value={surgeryType}
                                        onChange={(e) => setSurgeryType(e.target.value)}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Surgery Type</option>
                                        <option value="SICS">SICS</option>
                                        <option value="Phaco">Phaco</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {surgeryType === 'other' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Custom Surgery Type</label>
                                        <input
                                            type="text"
                                            value={customSurgeryType}
                                            onChange={(e) => setCustomSurgeryType(e.target.value)}
                                            placeholder="Enter custom surgery type"
                                            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Eye Side</label>
                                    <select
                                        value={eyeSide}
                                        onChange={(e) => setEyeSide(e.target.value as 'left' | 'right' | '')}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Eye</option>
                                        <option value="left">Left Eye</option>
                                        <option value="right">Right Eye</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Lens Type</label>
                                    <select
                                        value={lensType}
                                        onChange={(e) => setLensType(e.target.value)}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Lens Type</option>
                                        <option value="Monofocal">Monofocal</option>
                                        <option value="Multifocal">Multifocal</option>
                                        <option value="Toric">Toric</option>
                                        <option value="Toric Multifocal">Toric Multifocal</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {lensType === 'other' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Custom Lens Type</label>
                                        <input
                                            type="text"
                                            value={customLensType}
                                            onChange={(e) => setCustomLensType(e.target.value)}
                                            placeholder="Enter custom lens type"
                                            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Power</label>
                                    <input
                                        type="text"
                                        value={power}
                                        onChange={(e) => setPower(e.target.value)}
                                        placeholder="e.g., +2.50, -1.75"
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Surgery Remarks</label>
                                    <textarea
                                        value={surgeryRemarks}
                                        onChange={(e) => setSurgeryRemarks(e.target.value)}
                                        rows={2}
                                        placeholder="Any additional notes about the surgery..."
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <div className="mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                <h2 className="text-xl font-semibold">Payment Information</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Base Amount *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={baseAmount}
                                            onChange={(e) => setBaseAmount(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            required
                                            className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Discount Type</label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="amount">Fixed Amount (৳)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Discount {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'}
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            min="0"
                                            max={discountType === 'percentage' ? '100' : baseAmount}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        <span className="flex items-center gap-2">
                                            Advance Payment (৳) - Editable
                                            <span className="rounded bg-orange-50 px-2 py-1 text-xs text-orange-600">
                                                ⚠️ Hospital Account will adjust
                                            </span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={advancePaymentInput}
                                            onChange={(e) => setAdvancePaymentInput(e.target.value)}
                                            min="0"
                                            max={totalAmount}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full rounded-lg border border-blue-300 bg-blue-50 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-blue-600">
                                        💡 Old: ৳{parseFloat(booking.advance_payment?.toString() || '0').toFixed(2)}
                                        {advancePayment !== parseFloat(booking.advance_payment?.toString() || '0') && (
                                            <span className="ml-2 font-semibold text-orange-600">
                                                → Change: {advancePayment > parseFloat(booking.advance_payment?.toString() || '0') ? '+' : ''}৳
                                                {(advancePayment - parseFloat(booking.advance_payment?.toString() || '0')).toFixed(2)}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
                                            <div>
                                                <div className="text-sm text-gray-600">Base Amount</div>
                                                <div className="text-lg font-bold text-gray-900">৳{baseAmt.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Discount</div>
                                                <div className="text-lg font-bold text-orange-600">-৳{discountAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Total Amount</div>
                                                <div className="text-lg font-bold text-blue-600">৳{totalAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Paid</div>
                                                <div className="text-lg font-bold text-green-600">৳{advancePayment.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Due Amount</div>
                                                <div className="text-lg font-bold text-red-600">৳{dueAmount.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-orange-600">
                                        ⚠️ Editing payment will automatically adjust Hospital Account & Transaction records.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="rounded-lg bg-white p-6 shadow">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                    <span>Notes (Optional)</span>
                                </div>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any special instructions or notes..."
                                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                <Save className="h-5 w-5" />
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
