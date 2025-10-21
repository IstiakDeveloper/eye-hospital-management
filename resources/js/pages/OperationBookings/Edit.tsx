import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Save, Calendar, DollarSign, User, Scissors, AlertCircle, CheckCircle } from 'lucide-react';

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
    operation_name: string;
    operation_type: string;
    base_price: number;
    is_active: boolean;
}

interface Doctor {
    id: number;
    name?: string;
    specialization?: string;
    user: {
        id: number;
        name: string;
    };
}

interface OperationBooking {
    id: number;
    booking_no: string;
    patient_id: number;
    patient: Patient;
    operation_id: number;
    operation: Operation;
    doctor_id: number;
    doctor: Doctor;
    scheduled_date: string;
    scheduled_time: string;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    payment_status: string;
    notes?: string;
    status: string;
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
    const [formData, setFormData] = useState({
        operation_id: booking.operation_id?.toString() || '',
        doctor_id: booking.doctor_id?.toString() || '',
        scheduled_date: booking.scheduled_date || '',
        scheduled_time: booking.scheduled_time ? booking.scheduled_time.slice(0, 5) : '',
        total_amount: booking.total_amount?.toString() || '',
        notes: booking.notes || '',
        // Eye surgery specific fields
        surgery_type: booking.surgery_type || '',
        eye_side: booking.eye_side || '',
        lens_type: booking.lens_type || '',
        power: booking.power || '',
        surgery_remarks: booking.surgery_remarks || ''
    });

    const [customSurgeryType, setCustomSurgeryType] = useState('');
    const [customLensType, setCustomLensType] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const operation = operations.find(op => op.id === parseInt(formData.operation_id));
        setSelectedOperation(operation || null);
    }, [formData.operation_id, operations]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleOperationChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const operationId = e.target.value;
        const operation = operations.find(op => op.id === parseInt(operationId));
        setFormData(prev => ({
            ...prev,
            operation_id: operationId,
            total_amount: operation ? operation.base_price.toString() : ''
        }));
        if (errors.operation_id) {
            setErrors(prev => ({ ...prev, operation_id: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(`/operation-bookings/${booking.id}`, formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleComplete = () => {
        if (confirm('Mark this operation as completed? This action cannot be undone.')) {
            router.patch(`/operation-bookings/${booking.id}/complete`, {});
        }
    };

    const formatCurrency = (amount: number) => `৳${Number(amount).toFixed(2)}`;

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Operation Booking</h1>
                            <p className="text-gray-600 mt-1">Booking No: {booking.booking_no}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <button
                                type="button"
                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Patient Info Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Patient Information</h2>
                                <p className="text-sm text-gray-600">Cannot be changed</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Patient ID</p>
                                <p className="font-semibold text-gray-900">{booking.patient.patient_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold text-gray-900">{booking.patient.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-semibold text-gray-900">{booking.patient.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Age / Gender</p>
                                <p className="font-semibold text-gray-900">{booking.patient.age || 'N/A'} / {booking.patient.gender || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Completed Status Alert */}
                    {booking.status === 'completed' && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-green-800">Operation Completed</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        This operation has been marked as completed. Editing is restricted for record keeping purposes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Warning */}
                    {booking.status !== 'scheduled' && booking.status !== 'completed' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-yellow-800">Warning: Booking Status is {booking.status}</h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Be careful when editing a booking that has been {booking.status}. Consider creating a new booking instead.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        {/* Operation Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Scissors className="w-4 h-4" />
                                Operation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="operation_id"
                                value={formData.operation_id}
                                onChange={handleOperationChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.operation_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="">Select Operation</option>
                                {operations.map(operation => (
                                    <option key={operation.id} value={operation.id} disabled={!operation.is_active}>
                                        {operation.operation_name} - {operation.operation_type} (৳{operation.base_price})
                                        {!operation.is_active && ' - Inactive'}
                                    </option>
                                ))}
                            </select>
                            {errors.operation_id && <p className="text-sm text-red-600 mt-1">{errors.operation_id}</p>}
                            {selectedOperation && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Base Price:</span> ৳{selectedOperation.base_price}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Doctor Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                Performing Doctor <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="doctor_id"
                                value={formData.doctor_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.doctor_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="">Select Doctor</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.user.name} {doctor.specialization && `- ${doctor.specialization}`}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && <p className="text-sm text-red-600 mt-1">{errors.doctor_id}</p>}
                        </div>

                        {/* Eye Surgery Details */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Eye Surgery Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Surgery Type (SICS/Phaco)
                                    </label>
                                    <select
                                        name="surgery_type"
                                        value={formData.surgery_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Surgery Type</option>
                                        <option value="SICS">SICS</option>
                                        <option value="Phaco">Phaco</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {formData.surgery_type === 'other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Custom Surgery Type
                                        </label>
                                        <input
                                            type="text"
                                            value={customSurgeryType}
                                            onChange={(e) => setCustomSurgeryType(e.target.value)}
                                            placeholder="Enter custom surgery type"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Eye Side
                                    </label>
                                    <select
                                        name="eye_side"
                                        value={formData.eye_side}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        name="lens_type"
                                        value={formData.lens_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Lens Type</option>
                                        <option value="Monofocal">Monofocal</option>
                                        <option value="Multifocal">Multifocal</option>
                                        <option value="Toric">Toric</option>
                                        <option value="Toric Multifocal">Toric Multifocal</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {formData.lens_type === 'other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Custom Lens Type
                                        </label>
                                        <input
                                            type="text"
                                            value={customLensType}
                                            onChange={(e) => setCustomLensType(e.target.value)}
                                            placeholder="Enter custom lens type"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Power
                                    </label>
                                    <input
                                        type="text"
                                        name="power"
                                        value={formData.power}
                                        onChange={handleChange}
                                        placeholder="e.g., +2.50, -1.75"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Surgery Remarks
                                    </label>
                                    <textarea
                                        name="surgery_remarks"
                                        value={formData.surgery_remarks}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Any additional notes about the surgery..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Scheduled Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="scheduled_date"
                                    value={formData.scheduled_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    required
                                />
                                {errors.scheduled_date && <p className="text-sm text-red-600 mt-1">{errors.scheduled_date}</p>}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Scheduled Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="scheduled_time"
                                    value={formData.scheduled_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.scheduled_time ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    required
                                />
                                {errors.scheduled_time && <p className="text-sm text-red-600 mt-1">{errors.scheduled_time}</p>}
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Total Amount (৳) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="total_amount"
                                value={formData.total_amount}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.total_amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {errors.total_amount && <p className="text-sm text-red-600 mt-1">{errors.total_amount}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                This can be different from the base price based on specific case requirements.
                            </p>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Additional Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Any special instructions or notes about this operation..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                                {['scheduled', 'confirmed'].includes(booking.status) && (
                                    <button
                                        type="button"
                                        onClick={handleComplete}
                                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Completed
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
