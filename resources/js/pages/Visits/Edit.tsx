import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign, FileText, Percent, Save, Stethoscope, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    address?: string;
}

interface User {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    user?: User;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Payment {
    id: number;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    received_by?: User;
    notes?: string;
}

interface Visit {
    id: number;
    visit_id: string;
    patient: Patient;
    selected_doctor: Doctor | null;
    selected_doctor_id: number | null;
    payment_status: string;
    overall_status: string;
    vision_test_status: string;
    prescription_status: string;
    chief_complaint: string;
    is_followup: boolean;
    visit_notes?: string;
    discount_type: 'percentage' | 'amount' | null;
    discount_value: number | null;
    registration_fee: number | null;
    doctor_fee: number | null;
    total_amount: number | null;
    discount_amount: number | null;
    final_amount: number | null;
    total_paid: number | null;
    total_due: number | null;
    created_at: string;
    payments: Payment[];
}

interface DoctorOption {
    id: number;
    name: string;
    consultation_fee: number;
    follow_up_fee: number;
}

interface FirstPayment {
    id: number;
    amount: number;
    payment_method: PaymentMethod;
}

interface Props {
    visit: Visit;
    doctors: DoctorOption[];
    firstPayment: FirstPayment | null;
}

export default function Edit({ visit, doctors, firstPayment }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        selected_doctor_id: visit.selected_doctor_id?.toString() || '',
        is_followup: visit.is_followup || false,
        discount_type: visit.discount_type || 'amount',
        discount_value: visit.discount_value?.toString() || '0',
        payment_amount: firstPayment?.amount?.toString() || '0',
        chief_complaint: visit.chief_complaint || '',
        notes: visit.visit_notes || '',
    });

    // Calculate fees dynamically
    const [calculatedFees, setCalculatedFees] = useState({
        registration_fee: 0,
        doctor_fee: 0,
        total_amount: 0,
        discount_amount: 0,
        final_amount: 0,
        total_paid: 0,
        total_due: 0,
    });

    useEffect(() => {
        const registrationFee = 0; // No registration fee
        const selectedDoctor = doctors.find((d) => d.id === Number(data.selected_doctor_id));
        const doctorFee = selectedDoctor
            ? data.is_followup
                ? Number(selectedDoctor.follow_up_fee || 0)
                : Number(selectedDoctor.consultation_fee)
            : 0;
        const totalAmount = doctorFee; // Only doctor fee

        let discountAmount = 0;
        const discountValue = parseFloat(data.discount_value) || 0;
        if (discountValue > 0) {
            if (data.discount_type === 'percentage') {
                discountAmount = (totalAmount * discountValue) / 100;
            } else {
                discountAmount = Math.min(discountValue, totalAmount);
            }
        }

        const finalAmount = totalAmount - discountAmount;
        const paidAmount = parseFloat(data.payment_amount) || 0;
        const dueAmount = Math.max(0, finalAmount - paidAmount);

        setCalculatedFees({
            registration_fee: registrationFee,
            doctor_fee: doctorFee,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            total_paid: paidAmount,
            total_due: dueAmount,
        });
    }, [data.selected_doctor_id, data.is_followup, data.discount_type, data.discount_value, data.payment_amount, doctors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('visits.update', visit.id), {
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '৳0';
        }
        return (
            '৳' +
            amount.toLocaleString('en-BD', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            })
        );
    };

    return (
        <AdminLayout>
            <Head title={`Edit Visit #${visit.visit_id}`} />

            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('visits.show', visit.id)}
                            className="inline-flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Visit #{visit.visit_id}</h1>
                            <p className="text-sm text-gray-500">Update visit details and payment information</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Information (Read-only) */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <User className="h-5 w-5" />
                            Patient Information
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="text-base font-medium text-gray-900">{visit.patient.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Patient ID</p>
                                <p className="text-base font-medium text-gray-900">{visit.patient.patient_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-base font-medium text-gray-900">{visit.patient.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Visit Details */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <FileText className="h-5 w-5" />
                            Visit Details
                        </h2>
                        <div className="space-y-4">
                            {/* Doctor Selection */}
                            <div>
                                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Stethoscope className="h-4 w-4" />
                                    Select Doctor
                                </label>
                                <select
                                    value={data.selected_doctor_id}
                                    onChange={(e) => setData('selected_doctor_id', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">No Doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.name} - {data.is_followup ? `Follow-up: ৳${doctor.follow_up_fee}` : `৳${doctor.consultation_fee}`}
                                        </option>
                                    ))}
                                </select>
                                {errors.selected_doctor_id && <p className="mt-1 text-sm text-red-600">{errors.selected_doctor_id}</p>}
                            </div>

                            {/* Follow-up Visit Checkbox */}
                            <div className="flex items-start space-x-3 rounded-lg border border-blue-200 bg-blue-50 p-4 transition-colors duration-200 hover:bg-blue-100">
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

                            {/* Chief Complaint */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Chief Complaint</label>
                                <textarea
                                    value={data.chief_complaint}
                                    onChange={(e) => setData('chief_complaint', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter chief complaint..."
                                />
                                {errors.chief_complaint && <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>}
                            </div>

                            {/* Visit Notes */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Visit Notes (Optional)</label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter visit notes..."
                                />
                                {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Discount Settings */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Percent className="h-5 w-5" />
                            Discount
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Discount Type</label>
                                <select
                                    value={data.discount_type}
                                    onChange={(e) => setData('discount_type', e.target.value as 'percentage' | 'amount')}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="amount">Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Discount Value</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.discount_value}
                                    onChange={(e) => setData('discount_value', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                                {errors.discount_value && <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <DollarSign className="h-5 w-5" />
                            Payment Information
                        </h2>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.payment_amount}
                                onChange={(e) => setData('payment_amount', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                            {errors.payment_amount && <p className="mt-1 text-sm text-red-600">{errors.payment_amount}</p>}
                            <p className="mt-2 text-sm text-gray-500">This will update the registration payment amount for this visit.</p>
                        </div>
                    </div>

                    {/* Calculated Fee Summary */}
                    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Calculated Fee Summary</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {/* Registration Fee - Hidden since it's 0 */}
                            {calculatedFees.registration_fee > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600">Registration Fee</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(calculatedFees.registration_fee)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">
                                    Doctor Fee
                                    {data.is_followup && (
                                        <span className="ml-2 inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                            Follow-up
                                        </span>
                                    )}
                                </p>
                                <p className="text-lg font-semibold text-gray-900">{formatCurrency(calculatedFees.doctor_fee)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-lg font-semibold text-gray-900">{formatCurrency(calculatedFees.total_amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Discount</p>
                                <p className="text-lg font-semibold text-red-600">-{formatCurrency(calculatedFees.discount_amount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Final Amount</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(calculatedFees.final_amount)}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-blue-300 pt-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(calculatedFees.total_paid)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Due</p>
                                <p className="text-xl font-bold text-red-600">{formatCurrency(calculatedFees.total_due)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-base font-semibold">
                                    {calculatedFees.total_due <= 0 ? (
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Fully Paid</span>
                                    ) : calculatedFees.total_paid > 0 ? (
                                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">Partial</span>
                                    ) : (
                                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Unpaid</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href={route('visits.show', visit.id)}
                            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Visit'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
