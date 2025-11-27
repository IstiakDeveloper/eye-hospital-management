import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, User, Stethoscope, FileText, DollarSign,
    Calculator, Percent, Save, CheckCircle,
    AlertCircle, Clock, Calendar
} from 'lucide-react';

// Type definitions
interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee: number;
    follow_up_fee: number;
}

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
}

interface CostBreakdown {
    registration_fee: number;
    doctor_fee: number;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
}

interface NewVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient;
    doctors: Doctor[];
}

interface VisitFormData {
    patient_id: number;
    chief_complaint: string;
    selected_doctor_id: string;
    is_followup: boolean;
    discount_type: 'percentage' | 'amount' | '';
    discount_value: number;
    payment_amount: number;
}

const NewVisitModal: React.FC<NewVisitModalProps> = ({
    isOpen,
    onClose,
    patient,
    doctors = []
}) => {
    const { data, setData, post, processing, errors, reset } = useForm<VisitFormData>({
        patient_id: 0, // Will be set when modal opens
        chief_complaint: '',
        selected_doctor_id: '',
        is_followup: false,
        discount_type: '',
        discount_value: 0,
        payment_amount: 0,
    });

    const [costs, setCosts] = useState<CostBreakdown>({
        registration_fee: 0,
        doctor_fee: 0,
        total_amount: 0,
        discount_amount: 0,
        final_amount: 0,
    });

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Calculate costs whenever doctor or discount changes
    useEffect(() => {
        if (isOpen) {
            calculateCosts();
        }
    }, [data.selected_doctor_id, data.is_followup, data.discount_type, data.discount_value, isOpen]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && patient) {
            reset();
            setData({
                patient_id: patient.id,
                chief_complaint: '',
                selected_doctor_id: '',
                is_followup: false,
                discount_type: '',
                discount_value: 0,
                payment_amount: 200,
            });
            setSelectedDoctor(null);
            setCosts({
                registration_fee: 0,
                doctor_fee: 0,
                total_amount: 0,
                discount_amount: 0,
                final_amount: 0,
            });
        }
    }, [isOpen, patient]);

    const calculateCosts = (): void => {
        setIsCalculating(true);

        const registrationFee = 0;
        let doctorFee = 0;

        if (data.selected_doctor_id) {
            const doctor = doctors.find(d => d.id === parseInt(data.selected_doctor_id));
            if (doctor) {
                // Use follow_up_fee if this is a follow-up visit, otherwise use consultation_fee
                doctorFee = data.is_followup ? (doctor.follow_up_fee || 0) : doctor.consultation_fee;
                setSelectedDoctor(doctor);
            }
        } else {
            setSelectedDoctor(null);
        }

        const totalAmount = Number(registrationFee) + Number(doctorFee);
        let discountAmount = 0;

        if (data.discount_value > 0 && data.discount_type) {
            if (data.discount_type === 'percentage') {
                discountAmount = (totalAmount * data.discount_value) / 100;
            } else {
                discountAmount = Math.min(data.discount_value, totalAmount);
            }
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        setCosts({
            registration_fee: registrationFee,
            doctor_fee: doctorFee,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
        });

        setData('payment_amount', finalAmount);
        setIsCalculating(false);
    };

    const handleDoctorChange = (doctorId: string): void => {
        setData('selected_doctor_id', doctorId);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        console.log('Submitting visit data:', data);

        post(route('visits.store'), {
            preserveState: false,
            onSuccess: (page) => {
                console.log('Visit created successfully');
                onClose();
            },
            onError: (errors) => {
                console.error('Visit creation failed:', errors);
            },
        });
    };

    const handleCancel = (): void => {
        reset();
        onClose();
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <Calendar className="h-7 w-7" />
                                Start New Visit
                            </h2>
                            <p className="text-blue-100 mt-1">
                                Patient: {patient.name} ({patient.patient_id})
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Visit Information */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Patient Summary */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                                        <User className="h-5 w-5" />
                                        Patient Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-blue-700 font-medium">Name:</span>
                                            <span className="ml-2 text-blue-900">{patient.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-700 font-medium">Patient ID:</span>
                                            <span className="ml-2 text-blue-900">{patient.patient_id}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-700 font-medium">Phone:</span>
                                            <span className="ml-2 text-blue-900">{patient.phone}</span>
                                        </div>
                                        {patient.email && (
                                            <div>
                                                <span className="text-blue-700 font-medium">Email:</span>
                                                <span className="ml-2 text-blue-900">{patient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chief Complaint */}
                                <div>
                                    <label htmlFor="chief_complaint" className="block text-sm font-medium text-gray-700 mb-2">
                                        Chief Complaint / Reason for Visit *
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <textarea
                                            id="chief_complaint"
                                            rows={4}
                                            value={data.chief_complaint}
                                            onChange={(e) => setData('chief_complaint', e.target.value)}
                                            className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                                                errors.chief_complaint ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            placeholder="Describe the main reason for today's visit..."
                                            maxLength={500}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <div className="text-xs text-gray-500">
                                            {data.chief_complaint.length}/500 characters
                                        </div>
                                        {errors.chief_complaint && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-4 w-4" />
                                                {errors.chief_complaint}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Follow-up Visit Checkbox */}
                                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors duration-200">
                                    <input
                                        type="checkbox"
                                        id="is_followup"
                                        checked={data.is_followup}
                                        onChange={(e) => setData('is_followup', e.target.checked)}
                                        className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                                    />
                                    <label htmlFor="is_followup" className="flex-1 cursor-pointer">
                                        <span className="block text-sm font-medium text-blue-900">
                                            This is a follow-up visit
                                        </span>
                                        <span className="block text-xs text-blue-700 mt-1">
                                            Check this if the patient is returning for a follow-up consultation
                                        </span>
                                    </label>
                                </div>

                                {/* Doctor Selection */}
                                <div>
                                    <label htmlFor="selected_doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Doctor (Optional)
                                    </label>
                                    <div className="relative">
                                        <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <select
                                            id="selected_doctor_id"
                                            value={data.selected_doctor_id}
                                            onChange={(e) => handleDoctorChange(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200"
                                        >
                                            <option value="">No doctor selected</option>
                                            {doctors.map((doctor) => (
                                                <option key={doctor.id} value={doctor.id}>
                                                    Dr. {doctor.name} - {doctor.specialization}
                                                    {data.is_followup
                                                        ? ` (Follow-up: ${formatCurrency(doctor.follow_up_fee || 0)})`
                                                        : ` (${formatCurrency(doctor.consultation_fee)})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedDoctor && (
                                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <strong>Dr. {selectedDoctor.name}</strong> - {selectedDoctor.specialization}
                                                <br />
                                                {data.is_followup ? (
                                                    <>
                                                        <span className="text-emerald-700 font-semibold">Follow-up Fee:</span> {formatCurrency(selectedDoctor.follow_up_fee || 0)}
                                                        {selectedDoctor.follow_up_fee > 0 && (
                                                            <span className="ml-2 text-xs text-gray-600">
                                                                (Regular: {formatCurrency(selectedDoctor.consultation_fee)})
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-blue-700 font-semibold">Consultation Fee:</span> {formatCurrency(selectedDoctor.consultation_fee)}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Calculator className="h-5 w-5" />
                                            Payment Summary
                                            {isCalculating && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                                            )}
                                        </h3>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {/* Cost Breakdown */}
                                        <div className="space-y-2">
                                            {costs.registration_fee > 0 && (
                                                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                                    <span className="text-gray-600 text-sm">Registration Fee</span>
                                                    <span className="font-semibold text-sm">{formatCurrency(costs.registration_fee)}</span>
                                                </div>
                                            )}

                                            {costs.doctor_fee > 0 && (
                                                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                                    <span className="text-gray-600 text-sm">Doctor Fee</span>
                                                    <span className="font-semibold text-sm">{formatCurrency(costs.doctor_fee)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                                <span className="text-gray-800 font-medium text-sm">Subtotal</span>
                                                <span className="font-semibold text-sm">{formatCurrency(costs.total_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Discount Section */}
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                            <h4 className="font-medium text-gray-800 flex items-center gap-2 text-sm">
                                                <Percent className="h-4 w-4" />
                                                Apply Discount
                                            </h4>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'percentage')}
                                                    className={`flex-1 py-1 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                                        data.discount_type === 'percentage'
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'amount')}
                                                    className={`flex-1 py-1 px-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                                        data.discount_type === 'amount'
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    ৳
                                                </button>
                                            </div>

                                            <input
                                                type="number"
                                                value={data.discount_value}
                                                onChange={(e) => setData('discount_value', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder={data.discount_type === 'percentage' ? 'Enter %' : 'Enter amount'}
                                                min="0"
                                                max={data.discount_type === 'percentage' ? 100 : costs.total_amount}
                                                step="0.01"
                                                disabled={!data.discount_type}
                                            />

                                            {costs.discount_amount > 0 && (
                                                <div className="flex justify-between items-center text-green-600">
                                                    <span className="text-sm">Discount</span>
                                                    <span className="font-semibold text-sm">-{formatCurrency(costs.discount_amount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Amount */}
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 text-white">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-100 text-sm">Total Payable</span>
                                                <span className="text-xl font-bold">{formatCurrency(costs.final_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Payment Amount */}
                                        <div>
                                            <label htmlFor="payment_amount" className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Amount *
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    id="payment_amount"
                                                    type="number"
                                                    value={data.payment_amount}
                                                    onChange={(e) => setData('payment_amount', parseFloat(e.target.value) || 0)}
                                                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 text-sm ${
                                                        errors.payment_amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter amount"
                                                    min="0"
                                                    max={costs.final_amount}
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-1 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', costs.final_amount)}
                                                    className="flex-1 py-1 px-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    Full
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', Math.round(costs.final_amount / 2))}
                                                    className="flex-1 py-1 px-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    50%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', 0)}
                                                    className="flex-1 py-1 px-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    None
                                                </button>
                                            </div>
                                            {errors.payment_amount && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {errors.payment_amount}
                                                </p>
                                            )}
                                        </div>

                                        {/* Payment Status Info */}
                                        {data.payment_amount < costs.final_amount && data.payment_amount > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                                <div className="flex items-center gap-2 text-yellow-800">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Partial Payment</span>
                                                </div>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Remaining: {formatCurrency(costs.final_amount - data.payment_amount)}
                                                </p>
                                            </div>
                                        )}

                                        {data.payment_amount >= costs.final_amount && data.payment_amount > 0 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                                <div className="flex items-center gap-2 text-green-800">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Full Payment</span>
                                                </div>
                                                <p className="text-xs text-green-700 mt-1">
                                                    Ready for vision test
                                                </p>
                                            </div>
                                        )}

                                        {data.payment_amount === 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                                <div className="flex items-center gap-2 text-red-800">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">No Payment</span>
                                                </div>
                                                <p className="text-xs text-red-700 mt-1">
                                                    Payment required before vision test
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end items-center gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                disabled={processing}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !data.chief_complaint.trim()}
                                className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                                    processing || !data.chief_complaint.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Creating Visit...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        Start Visit
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewVisitModal;
