import { useForm } from '@inertiajs/react';
import { AlertCircle, Calculator, Calendar, CheckCircle, Clock, DollarSign, FileText, Percent, Save, Stethoscope, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

const NewVisitModal: React.FC<NewVisitModalProps> = ({ isOpen, onClose, patient, doctors = [] }) => {
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
            const doctor = doctors.find((d) => d.id === parseInt(data.selected_doctor_id));
            if (doctor) {
                // Use follow_up_fee if this is a follow-up visit, otherwise use consultation_fee
                doctorFee = data.is_followup ? doctor.follow_up_fee || 0 : doctor.consultation_fee;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="flex items-center gap-3 text-2xl font-semibold text-white">
                                <Calendar className="h-7 w-7" />
                                Start New Visit
                            </h2>
                            <p className="mt-1 text-blue-100">
                                Patient: {patient.name} ({patient.patient_id})
                            </p>
                        </div>
                        <button onClick={onClose} className="rounded-lg p-2 text-white transition-colors hover:bg-white/20">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Visit Information */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Patient Summary */}
                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                                        <User className="h-5 w-5" />
                                        Patient Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                        <div>
                                            <span className="font-medium text-blue-700">Name:</span>
                                            <span className="ml-2 text-blue-900">{patient.name}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-blue-700">Patient ID:</span>
                                            <span className="ml-2 text-blue-900">{patient.patient_id}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-blue-700">Phone:</span>
                                            <span className="ml-2 text-blue-900">{patient.phone}</span>
                                        </div>
                                        {patient.email && (
                                            <div>
                                                <span className="font-medium text-blue-700">Email:</span>
                                                <span className="ml-2 text-blue-900">{patient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chief Complaint */}
                                <div>
                                    <label htmlFor="chief_complaint" className="mb-2 block text-sm font-medium text-gray-700">
                                        Chief Complaint / Reason for Visit *
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                        <textarea
                                            id="chief_complaint"
                                            rows={4}
                                            value={data.chief_complaint}
                                            onChange={(e) => setData('chief_complaint', e.target.value)}
                                            className={`w-full resize-none rounded-xl border py-3 pr-4 pl-11 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                                errors.chief_complaint ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            placeholder="Describe the main reason for today's visit..."
                                            maxLength={500}
                                            required
                                        />
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <div className="text-xs text-gray-500">{data.chief_complaint.length}/500 characters</div>
                                        {errors.chief_complaint && (
                                            <p className="flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {errors.chief_complaint}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Follow-up Visit Checkbox */}
                                <div className="flex items-start space-x-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors duration-200 hover:bg-blue-100">
                                    <input
                                        type="checkbox"
                                        id="is_followup"
                                        checked={data.is_followup}
                                        onChange={(e) => setData('is_followup', e.target.checked)}
                                        className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    />
                                    <label htmlFor="is_followup" className="flex-1 cursor-pointer">
                                        <span className="block text-sm font-medium text-blue-900">This is a follow-up visit</span>
                                        <span className="mt-1 block text-xs text-blue-700">
                                            Check this if the patient is returning for a follow-up consultation
                                        </span>
                                    </label>
                                </div>

                                {/* Doctor Selection */}
                                <div>
                                    <label htmlFor="selected_doctor_id" className="mb-2 block text-sm font-medium text-gray-700">
                                        Select Doctor (Optional)
                                    </label>
                                    <div className="relative">
                                        <Stethoscope className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                        <select
                                            id="selected_doctor_id"
                                            value={data.selected_doctor_id}
                                            onChange={(e) => handleDoctorChange(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 py-3 pr-4 pl-11 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Dr. {selectedDoctor.name}</strong> - {selectedDoctor.specialization}
                                                <br />
                                                {data.is_followup ? (
                                                    <>
                                                        <span className="font-semibold text-emerald-700">Follow-up Fee:</span>{' '}
                                                        {formatCurrency(selectedDoctor.follow_up_fee || 0)}
                                                        {selectedDoctor.follow_up_fee > 0 && (
                                                            <span className="ml-2 text-xs text-gray-600">
                                                                (Regular: {formatCurrency(selectedDoctor.consultation_fee)})
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold text-blue-700">Consultation Fee:</span>{' '}
                                                        {formatCurrency(selectedDoctor.consultation_fee)}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                            <Calculator className="h-5 w-5" />
                                            Payment Summary
                                            {isCalculating && (
                                                <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            )}
                                        </h3>
                                    </div>

                                    <div className="space-y-4 p-4">
                                        {/* Cost Breakdown */}
                                        <div className="space-y-2">
                                            {costs.registration_fee > 0 && (
                                                <div className="flex items-center justify-between border-b border-gray-100 py-1">
                                                    <span className="text-sm text-gray-600">Registration Fee</span>
                                                    <span className="text-sm font-semibold">{formatCurrency(costs.registration_fee)}</span>
                                                </div>
                                            )}

                                            {costs.doctor_fee > 0 && (
                                                <div className="flex items-center justify-between border-b border-gray-100 py-1">
                                                    <span className="text-sm text-gray-600">Doctor Fee</span>
                                                    <span className="text-sm font-semibold">{formatCurrency(costs.doctor_fee)}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-b border-gray-200 py-1">
                                                <span className="text-sm font-medium text-gray-800">Subtotal</span>
                                                <span className="text-sm font-semibold">{formatCurrency(costs.total_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Discount Section */}
                                        <div className="space-y-3 rounded-lg bg-gray-50 p-3">
                                            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                                <Percent className="h-4 w-4" />
                                                Apply Discount
                                            </h4>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'percentage')}
                                                    className={`flex-1 rounded-md px-2 py-1 text-sm font-medium transition-all duration-200 ${
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
                                                    className={`flex-1 rounded-md px-2 py-1 text-sm font-medium transition-all duration-200 ${
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
                                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                placeholder={data.discount_type === 'percentage' ? 'Enter %' : 'Enter amount'}
                                                min="0"
                                                max={data.discount_type === 'percentage' ? 100 : costs.total_amount}
                                                step="0.01"
                                                disabled={!data.discount_type}
                                            />

                                            {costs.discount_amount > 0 && (
                                                <div className="flex items-center justify-between text-green-600">
                                                    <span className="text-sm">Discount</span>
                                                    <span className="text-sm font-semibold">-{formatCurrency(costs.discount_amount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Amount */}
                                        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-blue-100">Total Payable</span>
                                                <span className="text-xl font-bold">{formatCurrency(costs.final_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Payment Amount */}
                                        <div>
                                            <label htmlFor="payment_amount" className="mb-2 block text-sm font-medium text-gray-700">
                                                Payment Amount *
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    id="payment_amount"
                                                    type="number"
                                                    value={data.payment_amount}
                                                    onChange={(e) => setData('payment_amount', parseFloat(e.target.value) || 0)}
                                                    className={`w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                                        errors.payment_amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter amount"
                                                    min="0"
                                                    max={costs.final_amount}
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            <div className="mt-2 flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', costs.final_amount)}
                                                    className="flex-1 rounded bg-gray-100 px-1 py-1 text-xs transition-colors hover:bg-gray-200"
                                                >
                                                    Full
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', Math.round(costs.final_amount / 2))}
                                                    className="flex-1 rounded bg-gray-100 px-1 py-1 text-xs transition-colors hover:bg-gray-200"
                                                >
                                                    50%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', 0)}
                                                    className="flex-1 rounded bg-gray-100 px-1 py-1 text-xs transition-colors hover:bg-gray-200"
                                                >
                                                    None
                                                </button>
                                            </div>
                                            {errors.payment_amount && (
                                                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {errors.payment_amount}
                                                </p>
                                            )}
                                        </div>

                                        {/* Payment Status Info */}
                                        {data.payment_amount < costs.final_amount && data.payment_amount > 0 && (
                                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2">
                                                <div className="flex items-center gap-2 text-yellow-800">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Partial Payment</span>
                                                </div>
                                                <p className="mt-1 text-xs text-yellow-700">
                                                    Remaining: {formatCurrency(costs.final_amount - data.payment_amount)}
                                                </p>
                                            </div>
                                        )}

                                        {data.payment_amount >= costs.final_amount && data.payment_amount > 0 && (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                                                <div className="flex items-center gap-2 text-green-800">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Full Payment</span>
                                                </div>
                                                <p className="mt-1 text-xs text-green-700">Ready for vision test</p>
                                            </div>
                                        )}

                                        {data.payment_amount === 0 && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-2">
                                                <div className="flex items-center gap-2 text-red-800">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">No Payment</span>
                                                </div>
                                                <p className="mt-1 text-xs text-red-700">Payment required before vision test</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                                disabled={processing}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !data.chief_complaint.trim()}
                                className={`rounded-lg px-6 py-2 font-medium text-white transition-all duration-200 ${
                                    processing || !data.chief_complaint.trim()
                                        ? 'cursor-not-allowed bg-gray-400'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-xl focus:ring-2 focus:ring-blue-500'
                                }`}
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
