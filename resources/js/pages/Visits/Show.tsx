import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ArrowLeft,
    Calendar,
    User,
    Phone,
    Stethoscope,
    DollarSign,
    Receipt,
    FileText,
    Trash2
} from 'lucide-react';

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
    payment_status: string;
    overall_status: string;
    vision_test_status: string;
    prescription_status: string;
    chief_complaint: string;
    is_followup: boolean;
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

interface Props {
    visit: Visit;
}

export default function Show({ visit }: Props) {
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '৳0';
        }
        return '৳' + amount.toLocaleString('en-BD', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) {
            return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">N/A</span>;
        }

        const statusColors: Record<string, string> = {
            'paid': 'bg-green-100 text-green-700',
            'partial': 'bg-yellow-100 text-yellow-700',
            'unpaid': 'bg-red-100 text-red-700',
            'payment': 'bg-orange-100 text-orange-700',
            'vision_test': 'bg-blue-100 text-blue-700',
            'prescription': 'bg-purple-100 text-purple-700',
            'completed': 'bg-green-100 text-green-700',
            'pending': 'bg-gray-100 text-gray-700',
            'in_progress': 'bg-blue-100 text-blue-700',
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title={`Visit #${visit.visit_id}`} />

            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/visits"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Back
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Visit #{visit.visit_id}</h1>
                            <p className="text-xs text-gray-500">Visit details and information</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={route('visits.edit', visit.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700"
                        >
                            Edit Visit
                        </Link>
                        <Link
                            href={`/visits/${visit.id}/receipt`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                        >
                            <Receipt className="h-3 w-3" />
                            Print Receipt
                        </Link>
                        <button
                            onClick={() => {
                                if (confirm(`Delete Visit ${visit.visit_id}? This will reverse all transactions and cannot be undone.`)) {
                                    router.delete(route('visits.destroy', visit.id), {
                                        onSuccess: () => router.visit(route('visits.index')),
                                        onError: (errors) => {
                                            const msg = Object.values(errors).join('\n');
                                            alert(msg || 'Visit deletion failed. Please try again.');
                                        },
                                    });
                                }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                        >
                            <Trash2 className="h-3 w-3" />
                            Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Patient Information */}
                    <div className="bg-white rounded border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Patient Information
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="text-sm font-medium text-gray-900">{visit.patient.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Patient ID</p>
                                <p className="text-sm font-medium text-gray-900">{visit.patient.patient_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {visit.patient.phone}
                                </p>
                            </div>
                            {visit.patient.address && (
                                <div>
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="text-sm text-gray-900">{visit.patient.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visit Information */}
                    <div className="bg-white rounded border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Visit Information
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500">Visit Date</p>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(visit.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Doctor</p>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    {visit.selected_doctor?.user?.name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Chief Complaint</p>
                                <p className="text-sm text-gray-900">{visit.chief_complaint || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Information */}
                    <div className="bg-white rounded border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3">Status</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                                {getStatusBadge(visit.payment_status)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Overall Status</p>
                                {getStatusBadge(visit.overall_status)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Vision Test</p>
                                {getStatusBadge(visit.vision_test_status)}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Prescription</p>
                                {getStatusBadge(visit.prescription_status)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-4 bg-white rounded border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Summary
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Registration Fee</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(visit.registration_fee)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">
                                Doctor Fee
                                {visit.is_followup && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Follow-up
                                    </span>
                                )}
                            </p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(visit.doctor_fee)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(visit.total_amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Discount</p>
                            <p className="text-sm font-medium text-red-600">-{formatCurrency(visit.discount_amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Final Amount</p>
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(visit.final_amount)}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Total Paid</p>
                            <p className="text-sm font-semibold text-green-600">{formatCurrency(visit.total_paid)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Due</p>
                            <p className="text-sm font-semibold text-red-600">{formatCurrency(visit.total_due)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Payment Status</p>
                            {getStatusBadge(visit.payment_status)}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {visit.payments && visit.payments.length > 0 && (
                    <div className="mt-4 bg-white rounded border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received By</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {visit.payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-3 py-2 text-xs text-gray-900">
                                                {formatDate(payment.payment_date)}
                                            </td>
                                            <td className="px-3 py-2 text-xs font-medium text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-900">
                                                {payment.payment_method?.name || 'N/A'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-900">
                                                {payment.received_by?.name || 'N/A'}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                {payment.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
