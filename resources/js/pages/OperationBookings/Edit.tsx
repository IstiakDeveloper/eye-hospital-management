import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Save, Calendar, Clock, DollarSign, User, FileText, CreditCard } from 'lucide-react';

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
        const operation = operations.find(op => op.id === operationId);
        if (operation) {
            setBaseAmount(operation.price.toString());
        }
    };

    // Calculate discount amount and totals
    const baseAmt = parseFloat(baseAmount) || 0;
    const discountVal = parseFloat(discountValue) || 0;
    const discountAmount = discountType === 'percentage'
        ? (baseAmt * discountVal) / 100
        : discountVal;
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
            surgery_remarks: surgeryRemarks
        };

        setLoading(true);
        router.put(`/operation-bookings/${booking.id}`, formData, {
            onFinish: () => setLoading(false)
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Operation Booking</h1>
                            <p className="text-gray-600 mt-1">Booking No: {booking.booking_no}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Details
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6">
                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                            booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className={`inline-flex ml-3 px-4 py-2 rounded-full text-sm font-semibold ${
                            booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            Payment: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Information - Read Only */}
                        <div className="bg-blue-50 rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-semibold">Patient Information (Read Only)</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                    <div className="font-semibold">{booking.patient.age || 'N/A'} / {booking.patient.gender || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Operation Details */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Operation Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Operation Type *
                                    </label>
                                    <select
                                        value={selectedOperationId}
                                        onChange={(e) => handleOperationChange(Number(e.target.value))}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Operation</option>
                                        {operations.map(op => (
                                            <option key={op.id} value={op.id}>
                                                {op.name} - {op.type} (Base: ৳{op.price})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedOperationId && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            💡 Selected operation base price: ৳{(Number(operations.find(op => op.id === selectedOperationId)?.price) || 0).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Doctor *
                                    </label>
                                    <select
                                        value={selectedDoctorId}
                                        onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Doctor</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.user.name} - {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Date *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Time *
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eye Surgery Details */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Eye Surgery Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Surgery Type (SICS/Phaco)
                                    </label>
                                    <select
                                        value={surgeryType}
                                        onChange={(e) => setSurgeryType(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Surgery Type</option>
                                        <option value="SICS">SICS</option>
                                        <option value="Phaco">Phaco</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {surgeryType === 'other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Custom Surgery Type
                                        </label>
                                        <input
                                            type="text"
                                            value={customSurgeryType}
                                            onChange={(e) => setCustomSurgeryType(e.target.value)}
                                            placeholder="Enter custom surgery type"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Eye Side
                                    </label>
                                    <select
                                        value={eyeSide}
                                        onChange={(e) => setEyeSide(e.target.value as 'left' | 'right' | '')}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Eye</option>
                                        <option value="left">Left Eye</option>
                                        <option value="right">Right Eye</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lens Type
                                    </label>
                                    <select
                                        value={lensType}
                                        onChange={(e) => setLensType(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Custom Lens Type
                                        </label>
                                        <input
                                            type="text"
                                            value={customLensType}
                                            onChange={(e) => setCustomLensType(e.target.value)}
                                            placeholder="Enter custom lens type"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Power
                                    </label>
                                    <input
                                        type="text"
                                        value={power}
                                        onChange={(e) => setPower(e.target.value)}
                                        placeholder="e.g., +2.50, -1.75"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Surgery Remarks
                                    </label>
                                    <textarea
                                        value={surgeryRemarks}
                                        onChange={(e) => setSurgeryRemarks(e.target.value)}
                                        rows={2}
                                        placeholder="Any additional notes about the surgery..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                <h2 className="text-xl font-semibold">Payment Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Base Amount *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={baseAmount}
                                            onChange={(e) => setBaseAmount(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="amount">Fixed Amount (৳)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'}
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            min="0"
                                            max={discountType === 'percentage' ? '100' : baseAmount}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            Advance Payment (৳) - Editable
                                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">⚠️ Hospital Account will adjust</span>
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={advancePaymentInput}
                                            onChange={(e) => setAdvancePaymentInput(e.target.value)}
                                            min="0"
                                            max={totalAmount}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        💡 Old: ৳{parseFloat(booking.advance_payment?.toString() || '0').toFixed(2)}
                                        {advancePayment !== parseFloat(booking.advance_payment?.toString() || '0') && (
                                            <span className="ml-2 font-semibold text-orange-600">
                                                → Change: {advancePayment > parseFloat(booking.advance_payment?.toString() || '0') ? '+' : ''}৳{(advancePayment - parseFloat(booking.advance_payment?.toString() || '0')).toFixed(2)}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
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
                                    <p className="text-sm text-orange-600 mt-2 font-medium">
                                        ⚠️ Editing payment will automatically adjust Hospital Account & Transaction records.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                    <span>Notes (Optional)</span>
                                </div>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any special instructions or notes..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
