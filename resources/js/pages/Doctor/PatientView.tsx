import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Phone, Mail, MapPin, Calendar, FileText,
    Eye, Stethoscope, Clock, CheckCircle, ArrowLeft,
    Activity, Heart, Pill, History, Edit, Plus,
    AlertCircle, Star, Download, Printer, Save,
    ChevronRight, ChevronDown, Info, DollarSign,
    CreditCard, Users, TrendingUp, ClipboardList,
    ExternalLink, RefreshCw, Search, Filter
} from 'lucide-react';

// Complete Type definitions
interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee?: number;
}

interface PatientStats {
    total_visits: number;
    total_prescriptions: number;
    total_vision_tests: number;
    total_appointments: number;
    my_prescriptions: number;
    total_amount_paid: number;
    total_amount_due: number;
    last_visit_date?: string;
    last_vision_test_date?: string;
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
    age?: number;
    created_at: string;
    formatted_registration_date: string;
    visits: Visit[];
    visionTests: VisionTest[];
    prescriptions: Prescription[];
    appointments: Appointment[];
    stats: PatientStats;
}

interface Visit {
    id: number;
    visit_id: string;
    selected_doctor_id?: number;
    final_amount: number;
    total_paid: number;
    total_due: number;
    payment_status: string;
    vision_test_status: string;
    overall_status: string;
    chief_complaint?: string;
    visit_notes?: string;
    created_at: string;
    formatted_date: string;
    formatted_time: string;
    selected_doctor?: {
        id: number;
        name: string;
        specialization: string;
    };
    payments: Payment[];
}

interface VisionTest {
    id: number;
    test_date: string;
    formatted_date: string;
    formatted_time: string;
    right_eye_vision?: string;
    left_eye_vision?: string;
    right_eye_sphere?: number;
    left_eye_sphere?: number;
    right_eye_cylinder?: number;
    left_eye_cylinder?: number;
    right_eye_axis?: number;
    left_eye_axis?: number;
    pupillary_distance?: number;
    additional_notes?: string;
    performed_by: {
        id?: number;
        name: string;
    };
    can_print: boolean;
}

interface Prescription {
    id: number;
    created_at: string;
    formatted_date: string;
    formatted_time: string;
    doctor: {
        id: number;
        name: string;
        specialization: string;
    };
    prescription_medicines: PrescriptionMedicine[];
    medicines_count: number;
    can_print: boolean;
    can_edit: boolean;
}

interface PrescriptionMedicine {
    id: number;
    medicine: {
        id?: number;
        name: string;
        strength?: string;
        type?: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
}

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes?: string;
    formatted_date: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
    formatted_date: string;
    doctor: {
        id: number;
        name: string;
        specialization: string;
    };
    is_today: boolean;
    is_past: boolean;
}

interface LatestVisit {
    id: number;
    visit_id: string;
    chief_complaint?: string;
    visit_notes?: string;
    overall_status: string;
    payment_status: string;
    vision_test_status: string;
    final_amount: number;
    total_paid: number;
    total_due: number;
    formatted_date: string;
}

interface LatestVisionTest {
    id: number;
    test_date: string;
    formatted_date: string;
    right_eye_vision?: string;
    left_eye_vision?: string;
    right_eye_sphere?: number;
    left_eye_sphere?: number;
    right_eye_cylinder?: number;
    left_eye_cylinder?: number;
    right_eye_axis?: number;
    left_eye_axis?: number;
    pupillary_distance?: number;
    additional_notes?: string;
    performed_by: {
        name: string;
    };
}

interface TodaysAppointment {
    id: number;
    serial_number: string;
    appointment_time: string;
    status: string;
}

interface Props {
    patient: Patient;
    latestVisit: LatestVisit | null;
    latestVisionTest: LatestVisionTest | null;
    todaysAppointment: TodaysAppointment | null;
    doctor: Doctor;
}

const DoctorPatientView: React.FC<Props> = ({
    patient,
    latestVisit,
    latestVisionTest,
    todaysAppointment,
    doctor
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Helper Functions
    const goBack = () => {
        router.visit(route('doctor.dashboard'));
    };

    const createPrescription = () => {
        if (latestVisit) {
            router.visit(route('prescriptions.create.patient', patient.id));
        }
    };

    const printVisionTest = (visionTestId: number) => {
        window.open(route('vision-test.print', visionTestId), '_blank');
    };

    const printPrescription = (prescriptionId: number) => {
        window.open(route('prescriptions.print', prescriptionId), '_blank');
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString('en-BD')}`;
    };

    const getStatusColor = (status: string): string => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-100 border-green-200';
            case 'paid': return 'text-green-600 bg-green-100 border-green-200';
            case 'partial': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'pending': return 'text-red-600 bg-red-100 border-red-200';
            case 'prescription': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'vision_test': return 'text-purple-600 bg-purple-100 border-purple-200';
            case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200';
            case 'in_progress': return 'text-blue-600 bg-blue-100 border-blue-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    // Safe stats with fallbacks
    const safeStats = patient.stats || {
        total_visits: patient.visits?.length || 0,
        total_prescriptions: patient.prescriptions?.length || 0,
        total_vision_tests: patient.visionTests?.length || 0,
        total_appointments: patient.appointments?.length || 0,
        my_prescriptions: patient.prescriptions?.filter(p => p.doctor.id === doctor.id).length || 0,
        total_amount_paid: 0,
        total_amount_due: 0,
        last_visit_date: patient.visits?.[0]?.formatted_date || null,
        last_vision_test_date: patient.visionTests?.[0]?.formatted_date || null,
    };

    return (
        <AdminLayout title={`Patient: ${patient.name}`}>
            <Head title={`Patient: ${patient.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </button>
                            <div className="text-sm text-gray-500">
                                Dr. {doctor.name} • {doctor.specialization}
                            </div>
                        </div>

                        {/* Patient Basic Info */}
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                                <User className="h-10 w-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <span className="text-2xl">{getGenderIcon(patient.gender)}</span>
                                    {patient.name}
                                </h1>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>ID: {patient.patient_id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{patient.phone}</span>
                                    </div>
                                    {patient.age && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>Age: {patient.age} years</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        <span>Visits: {safeStats.total_visits}</span>
                                    </div>
                                </div>
                            </div>
                            {todaysAppointment && (
                                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
                                    Today's Serial: {todaysAppointment.serial_number}
                                </div>
                            )}
                        </div>

                        {/* Medical History Alert */}
                        {patient.medical_history && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span className="font-medium text-red-800">Medical History</span>
                                </div>
                                <p className="text-sm text-gray-700">{patient.medical_history}</p>
                            </div>
                        )}
                    </div>

                    {/* Current Visit Status */}
                    {latestVisit && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                    Current Visit - {latestVisit.visit_id}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(latestVisit.overall_status)}`}>
                                        {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-500">{latestVisit.formatted_date}</span>
                                </div>
                            </div>

                            {/* Visit Progress Steps */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Visit Progress</h3>
                                </div>
                                <div className="flex items-center">
                                    {/* Payment Step */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            latestVisit.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}>
                                            {latestVisit.payment_status === 'paid' ? (
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            ) : (
                                                <DollarSign className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${
                                            latestVisit.payment_status === 'paid' ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            Payment
                                        </span>
                                    </div>

                                    <div className={`flex-1 h-0.5 mx-4 ${
                                        latestVisit.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>

                                    {/* Vision Test Step */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            latestVisit.vision_test_status === 'completed' ? 'bg-green-500' :
                                            latestVisit.payment_status === 'paid' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}>
                                            <Eye className="h-4 w-4 text-white" />
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${
                                            latestVisit.vision_test_status === 'completed' ? 'text-green-600' :
                                            latestVisit.payment_status === 'paid' ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                            Vision Test
                                        </span>
                                    </div>

                                    <div className={`flex-1 h-0.5 mx-4 ${
                                        latestVisit.vision_test_status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>

                                    {/* Prescription Step */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            latestVisit.overall_status === 'completed' ? 'bg-green-500' :
                                            latestVisit.overall_status === 'prescription' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}>
                                            <Stethoscope className="h-4 w-4 text-white" />
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${
                                            latestVisit.overall_status === 'completed' ? 'text-green-600' :
                                            latestVisit.overall_status === 'prescription' ? 'text-blue-600' : 'text-gray-500'
                                        }`}>
                                            Prescription
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Visit Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Chief Complaint */}
                                {latestVisit.chief_complaint && (
                                    <div className="md:col-span-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                                            <span className="font-medium text-yellow-800">Chief Complaint</span>
                                        </div>
                                        <p className="text-gray-700">{latestVisit.chief_complaint}</p>
                                    </div>
                                )}

                                {/* Payment Status */}
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Payment Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Total:</span>
                                            <span className="font-medium">{formatCurrency(latestVisit.final_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-700">Paid:</span>
                                            <span className="font-medium text-green-600">{formatCurrency(latestVisit.total_paid)}</span>
                                        </div>
                                        {latestVisit.total_due > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-green-700">Due:</span>
                                                <span className="font-medium text-red-600">{formatCurrency(latestVisit.total_due)}</span>
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(latestVisit.payment_status)}`}>
                                                {latestVisit.payment_status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vision Test Status */}
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Vision Test
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-purple-700">Status:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${getStatusColor(latestVisit.vision_test_status)}`}>
                                                {latestVisit.vision_test_status.toUpperCase()}
                                            </span>
                                        </div>
                                        {latestVisionTest && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700">Right Eye:</span>
                                                    <span className="font-medium">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-700">Left Eye:</span>
                                                    <span className="font-medium">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <span className="text-xs text-purple-600">
                                                        By: {latestVisionTest.performed_by.name}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Prescription Status */}
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <Pill className="h-4 w-4" />
                                        Prescription
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-blue-700">My Prescriptions:</span>
                                            <span className="font-medium ml-2">{safeStats.my_prescriptions}</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-700">Total Prescriptions:</span>
                                            <span className="font-medium ml-2">{safeStats.total_prescriptions}</span>
                                        </div>
                                        {safeStats.my_prescriptions > 0 && (
                                            <div className="pt-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                                                    Has Previous Prescriptions
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center gap-4">
                                {/* Ready for Prescription */}
                                {latestVisit.overall_status === 'prescription' &&
                                 latestVisit.payment_status === 'paid' &&
                                 latestVisit.vision_test_status === 'completed' && (
                                    <button
                                        onClick={createPrescription}
                                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 shadow-lg"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Write Prescription
                                    </button>
                                )}

                                {/* Status Messages */}
                                {latestVisit.payment_status !== 'paid' && (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-lg">
                                        <AlertCircle className="h-5 w-5" />
                                        <span>Waiting for payment completion</span>
                                    </div>
                                )}

                                {latestVisit.payment_status === 'paid' && latestVisit.vision_test_status !== 'completed' && (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-lg">
                                        <Clock className="h-5 w-5" />
                                        <span>Waiting for vision test</span>
                                    </div>
                                )}

                                {latestVisit.overall_status === 'completed' && (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Visit completed successfully</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vision Test Results - Detailed */}
                    {latestVisionTest && latestVisit?.vision_test_status === 'completed' && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Eye className="h-6 w-6 text-purple-600" />
                                    Latest Vision Test Results
                                </h2>
                                <button
                                    onClick={() => printVisionTest(latestVisionTest.id)}
                                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Report
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 border border-purple-200 rounded-lg">
                                    <h3 className="font-semibold text-purple-900 mb-4">Right Eye (OD)</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Vision:</span>
                                            <span className="font-medium">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sphere (SPH):</span>
                                            <span className="font-medium">{latestVisionTest.right_eye_sphere || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Cylinder (CYL):</span>
                                            <span className="font-medium">{latestVisionTest.right_eye_cylinder || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Axis:</span>
                                            <span className="font-medium">{latestVisionTest.right_eye_axis || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-purple-200 rounded-lg">
                                    <h3 className="font-semibold text-purple-900 mb-4">Left Eye (OS)</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Vision:</span>
                                            <span className="font-medium">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sphere (SPH):</span>
                                            <span className="font-medium">{latestVisionTest.left_eye_sphere || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Cylinder (CYL):</span>
                                            <span className="font-medium">{latestVisionTest.left_eye_cylinder || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Axis:</span>
                                            <span className="font-medium">{latestVisionTest.left_eye_axis || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {latestVisionTest.pupillary_distance && (
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-purple-800">Pupillary Distance (PD):</span>
                                        <span className="font-bold text-purple-900">{latestVisionTest.pupillary_distance}mm</span>
                                    </div>
                                </div>
                            )}

                            {latestVisionTest.additional_notes && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h4 className="font-medium text-yellow-800 mb-2">Additional Notes:</h4>
                                    <p className="text-gray-700 text-sm">{latestVisionTest.additional_notes}</p>
                                </div>
                            )}

                            <div className="mt-4 text-sm text-gray-600 text-center">
                                Performed by: {latestVisionTest.performed_by.name} on {latestVisionTest.formatted_date}
                            </div>
                        </div>
                    )}

                    {/* Patient Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Total Visits</h3>
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{safeStats.total_visits}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Last: {safeStats.last_visit_date || 'None'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Vision Tests</h3>
                                <Eye className="h-5 w-5 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{safeStats.total_vision_tests}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Last: {safeStats.last_vision_test_date || 'None'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Prescriptions</h3>
                                <Pill className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{safeStats.total_prescriptions}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                By me: {safeStats.my_prescriptions}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Financial</h3>
                                <DollarSign className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(safeStats.total_amount_paid)}</p>
                            <p className="text-sm text-red-500">
                                Due: {formatCurrency(safeStats.total_amount_due)}
                            </p>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6">
                                {[
                                    { id: 'overview', name: 'Quick Overview', icon: Info },
                                    { id: 'history', name: 'Visit History', icon: History, count: safeStats.total_visits },
                                    { id: 'vision', name: 'Vision Tests', icon: Eye, count: safeStats.total_vision_tests },
                                    { id: 'prescriptions', name: 'Prescriptions', icon: Pill, count: safeStats.total_prescriptions },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                                activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {tab.name}
                                            {tab.count !== undefined && tab.count > 0 && (
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Patient Quick Overview</h3>

                                    {/* Contact Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-semibold text-gray-900 mb-3">Contact Details</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-500" />
                                                    <span>{patient.phone}</span>
                                                </div>
                                                {patient.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-gray-500" />
                                                        <span>{patient.email}</span>
                                                    </div>
                                                )}
                                                {patient.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-500" />
                                                        <span>{patient.address}</span>
                                                    </div>
                                                )}
                                                {patient.nid_card && (
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                        <span>NID: {patient.nid_card}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Age:</span>
                                                    <span className="ml-2 font-medium">{patient.age || 'N/A'} years</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Gender:</span>
                                                    <span className="ml-2 font-medium capitalize">{patient.gender || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Registered:</span>
                                                    <span className="ml-2 font-medium">{patient.formatted_registration_date}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Total Visits:</span>
                                                    <span className="ml-2 font-medium">{safeStats.total_visits}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visit History Tab */}
                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Visit History ({safeStats.total_visits})</h3>

                                    {patient.visits && patient.visits.length > 0 ? (
                                        <div className="space-y-4">
                                            {patient.visits.slice(0, 5).map((visit, index) => (
                                                <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {visit.visit_id}
                                                                {index === 0 && (
                                                                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Latest</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{visit.formatted_date}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.overall_status)}`}>
                                                            {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {visit.chief_complaint && (
                                                        <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                                                            <span className="font-medium text-yellow-800 text-sm">Chief Complaint:</span>
                                                            <p className="text-sm text-gray-700 mt-1">{visit.chief_complaint}</p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Amount:</span>
                                                            <p className="font-medium">{formatCurrency(visit.final_amount)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Payment:</span>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ml-1 ${getStatusColor(visit.payment_status)}`}>
                                                                {visit.payment_status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Doctor:</span>
                                                            <p className="font-medium text-xs">
                                                                {visit.selected_doctor?.name || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {patient.visits.length > 5 && (
                                                <div className="text-center py-4">
                                                    <p className="text-gray-500 text-sm">
                                                        Showing 5 of {patient.visits.length} visits
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No visit history found</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Vision Tests Tab */}
                            {activeTab === 'vision' && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Vision Test History ({safeStats.total_vision_tests})</h3>

                                    {patient.visionTests && patient.visionTests.length > 0 ? (
                                        <div className="space-y-4">
                                            {patient.visionTests.slice(0, 3).map((test, index) => (
                                                <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                Vision Test #{test.id}
                                                                {index === 0 && (
                                                                    <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">Latest</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{test.formatted_date}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => printVisionTest(test.id)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="p-3 bg-purple-50 rounded-lg">
                                                            <h5 className="font-medium text-purple-800 mb-2">Right Eye</h5>
                                                            <div className="space-y-1 text-sm">
                                                                <div>Vision: {test.right_eye_vision || 'N/A'}</div>
                                                                <div>SPH: {test.right_eye_sphere || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-purple-50 rounded-lg">
                                                            <h5 className="font-medium text-purple-800 mb-2">Left Eye</h5>
                                                            <div className="space-y-1 text-sm">
                                                                <div>Vision: {test.left_eye_vision || 'N/A'}</div>
                                                                <div>SPH: {test.left_eye_sphere || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 text-sm text-gray-600">
                                                        Performed by: {test.performed_by?.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No vision tests found</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Prescriptions Tab */}
                            {activeTab === 'prescriptions' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Prescription History ({safeStats.total_prescriptions})
                                        </h3>
                                        <button
                                            onClick={createPrescription}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            New Prescription
                                        </button>
                                    </div>

                                    {patient.prescriptions && patient.prescriptions.length > 0 ? (
                                        <div className="space-y-4">
                                            {patient.prescriptions.slice(0, 3).map((prescription, index) => (
                                                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                Prescription #{prescription.id}
                                                                {index === 0 && (
                                                                    <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Latest</span>
                                                                )}
                                                                {prescription.can_edit && (
                                                                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Can Edit</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{prescription.formatted_date}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => printPrescription(prescription.id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <span className="text-gray-600 text-sm">Prescribed by:</span>
                                                                <p className="font-medium">{prescription.doctor.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-gray-600 text-sm">Medicines:</span>
                                                                <p className="font-medium">{prescription.medicines_count} items</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {prescription.prescription_medicines && prescription.prescription_medicines.length > 0 && (
                                                        <div className="space-y-2">
                                                            <h6 className="font-medium text-gray-900">Medicines:</h6>
                                                            {prescription.prescription_medicines.slice(0, 2).map((medicine, medIndex) => (
                                                                <div key={medIndex} className="p-3 bg-white border border-gray-200 rounded-lg">
                                                                    <h5 className="font-medium text-gray-900">
                                                                        {medicine.medicine?.name || 'Unknown Medicine'}
                                                                        {medicine.medicine?.strength && (
                                                                            <span className="text-gray-600 ml-2">({medicine.medicine.strength})</span>
                                                                        )}
                                                                    </h5>
                                                                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                                                        <div>
                                                                            <span className="text-gray-600">Dosage:</span>
                                                                            <p className="font-medium">{medicine.dosage}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Frequency:</span>
                                                                            <p className="font-medium">{medicine.frequency}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-600">Duration:</span>
                                                                            <p className="font-medium">{medicine.duration}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {prescription.prescription_medicines.length > 2 && (
                                                                <p className="text-sm text-gray-500 text-center">
                                                                    +{prescription.prescription_medicines.length - 2} more medicines
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No prescriptions found</p>
                                            <button
                                                onClick={createPrescription}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Write First Prescription
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <strong>Consultation with:</strong> Dr. {doctor.name} ({doctor.specialization})
                                {todaysAppointment && (
                                    <span className="ml-4">
                                        <strong>Today's Serial:</strong> {todaysAppointment.serial_number} at {todaysAppointment.appointment_time}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {latestVisionTest && (
                                    <button
                                        onClick={() => printVisionTest(latestVisionTest.id)}
                                        className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Print Vision Test
                                    </button>
                                )}
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Summary
                                </button>
                                {latestVisit && latestVisit.overall_status === 'prescription' && (
                                    <button
                                        onClick={createPrescription}
                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Write Prescription
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default DoctorPatientView;
