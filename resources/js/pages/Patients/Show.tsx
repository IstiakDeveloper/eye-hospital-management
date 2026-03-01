import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/admin-layout';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    Eye,
    FileText,
    Printer,
    Edit,
    Plus,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    Activity,
    Stethoscope,
    Receipt,
    ChevronDown,
    ChevronRight,
    Building2,
    Trash2
} from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization?: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface VisionTest {
    id: number;
    visit_id?: number;
    right_eye_vision?: string;
    left_eye_vision?: string;
    right_eye_power?: number;
    left_eye_power?: number;
    right_eye_pressure?: string;
    left_eye_pressure?: string;
    right_eye_sphere?: number;
    left_eye_sphere?: number;
    right_eye_cylinder?: number;
    left_eye_cylinder?: number;
    right_eye_axis?: number;
    left_eye_axis?: number;
    additional_notes?: string;
    performed_by?: User;
    test_date: string;
}

interface Prescription {
    id: number;
    visit_id?: number;
    diagnosis?: string;
    advice?: string;
    notes?: string;
    followup_date?: string;
    doctor: Doctor;
    created_by: User;
    created_at: string;
}

interface Payment {
    id: number;
    visit_id?: number;
    payment_number: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    notes?: string;
    receipt_number?: string;
    received_by: User;
}

interface PatientVisit {
    id: number;
    visit_id: string;
    registration_fee: number;
    doctor_fee: number;
    total_amount: number;
    discount_type?: string;
    discount_value: number;
    discount_amount: number;
    final_amount: number;
    total_paid: number;
    total_due: number;
    payment_status: string;
    vision_test_status: string;
    prescription_status: string;
    overall_status: string;
    payment_completed_at?: string;
    vision_test_completed_at?: string;
    prescription_completed_at?: string;
    visit_notes?: string;
    chief_complaint?: string;
    selected_doctor?: Doctor;
    created_by?: User;
    created_at: string;
    vision_tests?: VisionTest[];
    prescriptions?: Prescription[];
    payments?: Payment[];
}

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    nid_card?: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    medical_history?: string;
    registered_by?: User;
    qr_code?: string;
    created_at: string;
    visits: PatientVisit[];
}

interface Statistics {
    total_visits: number;
    completed_visits: number;
    pending_visits: number;
    total_paid: number;
    total_due: number;
}

interface Props {
    patient: Patient;
    statistics?: Statistics;
    standalone_vision_tests?: VisionTest[];
    standalone_prescriptions?: Prescription[];
    all_vision_tests?: VisionTest[];
    all_prescriptions?: Prescription[];
}

export default function Show({
    patient,
    statistics,
    standalone_vision_tests,
    standalone_prescriptions,
    all_vision_tests,
    all_prescriptions
}: Props) {
    const [expandedVisit, setExpandedVisit] = useState<number | null>(null);

    // Safe statistics with default values
    const safeStats = {
        total_visits: statistics?.total_visits ?? 0,
        completed_visits: statistics?.completed_visits ?? 0,
        pending_visits: statistics?.pending_visits ?? 0,
        total_paid: statistics?.total_paid ?? 0,
        total_due: statistics?.total_due ?? 0,
    };

    // Print handler functions
    const handleVisionTestPrint = (testId: number) => {
        window.open(route('visiontests.print', testId), '_blank');
    };

    const handlePrescriptionPrint = (prescriptionId: number) => {
        window.open(route('prescriptions.print', prescriptionId), '_blank');
    };

    const handleVisitReceiptPrint = (visitId: number) => {
        window.open(route('visits.receipt', visitId), '_blank');
    };

    const handleReceiptPrint = (visitId: number) => {
        window.open(route('visits.receipt', visitId), '_blank');
    };

    // Visit edit and delete handlers
    const handleVisitEdit = (visitId: number) => {
        router.get(route('visits.edit', visitId));
    };

    const handleVisitDelete = (visitId: number, visitNumber: string) => {
        if (confirm(`Are you sure you want to delete Visit ${visitNumber}? This will reverse all transactions and cannot be undone.`)) {
            router.delete(route('visits.destroy', visitId), {
                onError: (errors) => {
                    const msg = Object.values(errors).join('\n');
                    alert(msg || 'Visit deletion failed. Please try again.');
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateAge = (dateOfBirth?: string) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age}y`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'pending': return 'bg-gray-100 text-gray-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partial': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return <CheckCircle className="h-3 w-3" />;
            case 'in_progress':
            case 'partial':
                return <Clock className="h-3 w-3" />;
            default:
                return <AlertCircle className="h-3 w-3" />;
        }
    };

    const toggleVisitExpand = (visitId: number) => {
        setExpandedVisit(expandedVisit === visitId ? null : visitId);
    };

    return (
        <AdminLayout>
            <Head title={`Patient - ${patient.name}`} />

            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('patients.index')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{patient.name}</h1>
                            <p className="text-sm text-gray-500">Patient ID: {patient.patient_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('patients.edit', patient.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            onClick={() => {
                                if (confirm(`Delete patient "${patient.name}"? This will permanently delete all visits, payments, and records. This cannot be undone.`)) {
                                    router.delete(route('patients.destroy', patient.id));
                                }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Patient
                        </button>
                        <Link
                            href={route('visits.store')}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            New Visit
                        </Link>
                    </div>
                </div>

                {/* Patient Information Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Basic Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                                    <p className="text-sm text-gray-500 mb-3">ID: {patient.patient_id}</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-900">{patient.phone}</span>
                                        </div>

                                        {patient.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{patient.email}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-900">Age: {calculateAge(patient.date_of_birth)}</span>
                                        </div>

                                        {patient.gender && (
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${patient.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                                                    patient.gender === 'female' ? 'bg-pink-100 text-pink-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {patient.gender?.charAt(0).toUpperCase()}{patient.gender?.slice(1)}
                                                </span>
                                            </div>
                                        )}

                                        {patient.nid_card && (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{patient.nid_card}</span>
                                            </div>
                                        )}

                                        {patient.address && (
                                            <div className="flex items-start gap-2 sm:col-span-2">
                                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                                <span className="text-gray-900">{patient.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <Activity className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                    <p className="text-lg font-semibold text-blue-700">{safeStats.total_visits}</p>
                                    <p className="text-xs text-blue-600">Total Visits</p>
                                </div>

                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                    <p className="text-lg font-semibold text-green-700">{safeStats.completed_visits}</p>
                                    <p className="text-xs text-green-600">Completed</p>
                                </div>

                                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                    <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                                    <p className="text-lg font-semibold text-yellow-700">{safeStats.pending_visits}</p>
                                    <p className="text-xs text-yellow-600">Pending</p>
                                </div>

                                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                    <DollarSign className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                    <p className="text-lg font-semibold text-emerald-700">৳{safeStats.total_paid.toLocaleString()}</p>
                                    <p className="text-xs text-emerald-600">Total Paid</p>
                                </div>
                            </div>

                            {safeStats.total_due > 0 && (
                                <div className="mt-4 bg-red-50 rounded-lg p-3 text-center">
                                    <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                                    <p className="text-lg font-semibold text-red-700">৳{safeStats.total_due.toLocaleString()}</p>
                                    <p className="text-xs text-red-600">Outstanding Due</p>
                                </div>
                            )}

                            {patient.registered_by?.name && (
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-gray-500">
                                        Registered on {formatDate(patient.created_at)} by {patient.registered_by.name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Medical History */}
                {patient.medical_history && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Medical History
                        </h3>
                        <p className="text-sm text-gray-700">{patient.medical_history}</p>
                    </div>
                )}

                {/* Standalone Vision Tests & Prescriptions */}
                {((standalone_vision_tests && standalone_vision_tests.length > 0) ||
                    (standalone_prescriptions && standalone_prescriptions.length > 0)) && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                            <div className="p-4 border-b border-gray-200 bg-yellow-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    Standalone Records (Not Linked to Visits)
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    These records are not associated with any specific visit
                                </p>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Standalone Vision Tests */}
                                    {standalone_vision_tests && standalone_vision_tests.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-blue-600" />
                                                Vision Tests ({standalone_vision_tests.length})
                                            </h4>
                                            <div className="space-y-3">
                                                {standalone_vision_tests.map((test) => (
                                                    <div key={test.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{formatDateTime(test.test_date)}</p>
                                                                {test.performed_by?.name && (
                                                                    <p className="text-xs text-gray-500">by {test.performed_by.name}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Link
                                                                    href={route('visiontests.show', test.id)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                >
                                                                    <Eye className="h-3 w-3" />
                                                                    View
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleVisionTestPrint(test.id)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                                                >
                                                                    <Printer className="h-3 w-3" />
                                                                    Print
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-500">Right Eye:</span>
                                                                <span className="ml-1 text-gray-900">{test.right_eye_vision || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Left Eye:</span>
                                                                <span className="ml-1 text-gray-900">{test.left_eye_vision || 'N/A'}</span>
                                                            </div>
                                                            {test.right_eye_pressure && (
                                                                <div>
                                                                    <span className="text-gray-500">R. Pressure:</span>
                                                                    <span className="ml-1 text-gray-900">{test.right_eye_pressure}</span>
                                                                </div>
                                                            )}
                                                            {test.left_eye_pressure && (
                                                                <div>
                                                                    <span className="text-gray-500">L. Pressure:</span>
                                                                    <span className="ml-1 text-gray-900">{test.left_eye_pressure}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Standalone Prescriptions */}
                                    {standalone_prescriptions && standalone_prescriptions.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                                <Stethoscope className="h-4 w-4 text-green-600" />
                                                Prescriptions ({standalone_prescriptions.length})
                                            </h4>
                                            <div className="space-y-3">
                                                {standalone_prescriptions.map((prescription) => (
                                                    <div key={prescription.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{formatDateTime(prescription.created_at)}</p>
                                                                {prescription.doctor?.name && (
                                                                    <p className="text-xs text-gray-500">Dr. {prescription.doctor.name}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Link
                                                                    href={route('prescriptions.show', prescription.id)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                >
                                                                    <FileText className="h-3 w-3" />
                                                                    View
                                                                </Link>
                                                                <button
                                                                    onClick={() => handlePrescriptionPrint(prescription.id)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                                                >
                                                                    <Printer className="h-3 w-3" />
                                                                    Print
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1 text-xs">
                                                            {prescription.diagnosis && (
                                                                <div>
                                                                    <span className="text-gray-500">Diagnosis:</span>
                                                                    <span className="ml-1 text-gray-900">{prescription.diagnosis}</span>
                                                                </div>
                                                            )}
                                                            {prescription.advice && (
                                                                <div>
                                                                    <span className="text-gray-500">Advice:</span>
                                                                    <span className="ml-1 text-gray-900">{prescription.advice}</span>
                                                                </div>
                                                            )}
                                                            {prescription.followup_date && (
                                                                <div>
                                                                    <span className="text-gray-500">Follow-up:</span>
                                                                    <span className="ml-1 text-gray-900">{formatDate(prescription.followup_date)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                {/* Visits Grid */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Patient Visits ({patient.visits.length})
                        </h3>
                    </div>

                    <div className="p-4">
                        {patient.visits.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No visits yet</h3>
                                <p className="mt-1 text-xs text-gray-500">This patient hasn't visited yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {patient.visits.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Visit Summary - Always Visible */}
                                        <div
                                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleVisitExpand(visit.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        {expandedVisit === visit.id ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-500" />
                                                        )}
                                                        <h4 className="font-medium text-gray-900">Visit {visit.visit_id}</h4>
                                                    </div>

                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.overall_status)}`}>
                                                        {getStatusIcon(visit.overall_status)}
                                                        {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatDateTime(visit.created_at)}</p>
                                                        {visit.selected_doctor?.name && (
                                                            <p className="text-xs">Dr. {visit.selected_doctor.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900">৳{visit.final_amount.toLocaleString()}</p>
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(visit.payment_status)}`}>
                                                            {getStatusIcon(visit.payment_status)}
                                                            {visit.payment_status.toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Edit and Delete buttons */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVisitEdit(visit.id);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                            title="Edit Visit"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVisitDelete(visit.id, visit.visit_id);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Visit"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {visit.chief_complaint && (
                                                <p className="mt-2 text-sm text-gray-600">{visit.chief_complaint}</p>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedVisit === visit.id && (
                                            <div className="border-t border-gray-200 bg-gray-50">
                                                <div className="p-4">
                                                    {/* Services Grid */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                                        {/* Vision Tests */}
                                                        <div className="bg-white rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                                    <h5 className="font-medium text-gray-900">Vision Tests</h5>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.vision_test_status)}`}>
                                                                    {getStatusIcon(visit.vision_test_status)}
                                                                    {visit.vision_test_status.replace('_', ' ')}
                                                                </span>
                                                            </div>

                                                            {visit.vision_tests && visit.vision_tests.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {visit.vision_tests.map((test) => (
                                                                        <div key={test.id} className="bg-gray-50 rounded p-2">
                                                                            <p className="text-xs text-gray-600">{formatDateTime(test.test_date)}</p>
                                                                            {test.performed_by?.name && (
                                                                                <p className="text-xs text-gray-500">by {test.performed_by.name}</p>
                                                                            )}
                                                                            <div className="flex gap-1 mt-2">
                                                                                <Link
                                                                                    href={route('visiontests.show', test.id)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                                >
                                                                                    <Eye className="h-3 w-3" />
                                                                                    View
                                                                                </Link>
                                                                                <button
                                                                                    onClick={() => handleVisionTestPrint(test.id)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                                                                >
                                                                                    <Printer className="h-3 w-3" />
                                                                                    Print
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">No vision tests yet</p>
                                                            )}
                                                        </div>

                                                        {/* Prescriptions */}
                                                        <div className="bg-white rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Stethoscope className="h-4 w-4 text-green-600" />
                                                                    <h5 className="font-medium text-gray-900">Prescriptions</h5>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.prescription_status)}`}>
                                                                    {getStatusIcon(visit.prescription_status)}
                                                                    {visit.prescription_status}
                                                                </span>
                                                            </div>

                                                            {visit.prescriptions && visit.prescriptions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {visit.prescriptions.map((prescription) => (
                                                                        <div key={prescription.id} className="bg-gray-50 rounded p-2">
                                                                            <p className="text-xs text-gray-600">{formatDateTime(prescription.created_at)}</p>
                                                                            {prescription.doctor?.name && (
                                                                                <p className="text-xs text-gray-500">Dr. {prescription.doctor.name}</p>
                                                                            )}
                                                                            <div className="flex gap-1 mt-2">
                                                                                <Link
                                                                                    href={route('prescriptions.show', prescription.id)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                                                >
                                                                                    <FileText className="h-3 w-3" />
                                                                                    View
                                                                                </Link>
                                                                                <button
                                                                                    onClick={() => handlePrescriptionPrint(prescription.id)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                                                                >
                                                                                    <Printer className="h-3 w-3" />
                                                                                    Print
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">No prescriptions yet</p>
                                                            )}
                                                        </div>

                                                        {/* Payments */}
                                                        <div className="bg-white rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Receipt className="h-4 w-4 text-purple-600" />
                                                                    <h5 className="font-medium text-gray-900">Payments</h5>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.payment_status)}`}>
                                                                    {getStatusIcon(visit.payment_status)}
                                                                    {visit.payment_status}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="bg-gray-50 rounded p-2">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-gray-500">Total Amount:</span>
                                                                        <span className="font-medium">৳{visit.final_amount.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-gray-500">Paid:</span>
                                                                        <span className="font-medium text-green-600">৳{visit.total_paid.toLocaleString()}</span>
                                                                    </div>
                                                                    {visit.total_due > 0 && (
                                                                        <div className="flex justify-between text-xs">
                                                                            <span className="text-gray-500">Due:</span>
                                                                            <span className="font-medium text-red-600">৳{visit.total_due.toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {visit.payments && visit.payments.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {visit.payments.map((payment) => (
                                                                            <div key={payment.id} className="bg-gray-50 rounded p-2">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="text-gray-600">#{payment.payment_number}</span>
                                                                                    <span className="font-medium">৳{payment.amount.toLocaleString()}</span>
                                                                                </div>
                                                                                {payment.payment_method?.name && (
                                                                                    <p className="text-xs text-gray-500">{payment.payment_method.name}</p>
                                                                                )}
                                                                                <div className="flex gap-1 mt-1">
                                                                                    <button
                                                                                        onClick={() => handleVisitReceiptPrint(visit.id)}
                                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                                                                    >
                                                                                        <Printer className="h-3 w-3" />
                                                                                        Print
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Visit Notes */}
                                                    {visit.visit_notes && (
                                                        <div className="bg-white rounded-lg p-4">
                                                            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-gray-600" />
                                                                Visit Notes
                                                            </h5>
                                                            <p className="text-sm text-gray-700">{visit.visit_notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
