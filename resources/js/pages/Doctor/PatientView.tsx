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
    ExternalLink, RefreshCw, Search, Filter,
    Shield, Target, Camera, BookOpen, Zap,
    Droplets, Monitor, Brain
} from 'lucide-react';

// Updated interfaces based on new schema
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

// Updated VisionTest interface based on new schema
interface VisionTest {
    id: number;
    test_date: string;
    formatted_date: string;
    formatted_time: string;

    // Patient complaints
    complains?: string;

    // Physical examination
    right_eye_diagnosis?: string;
    left_eye_diagnosis?: string;
    right_eye_lids?: string;
    left_eye_lids?: string;
    right_eye_conjunctiva?: string;
    left_eye_conjunctiva?: string;
    right_eye_cornea?: string;
    left_eye_cornea?: string;
    right_eye_anterior_chamber?: string;
    left_eye_anterior_chamber?: string;
    right_eye_iris?: string;
    left_eye_iris?: string;
    right_eye_pupil?: string;
    left_eye_pupil?: string;
    right_eye_lens?: string;
    left_eye_lens?: string;
    right_eye_ocular_movements?: string;
    left_eye_ocular_movements?: string;

    // Vision testing
    right_eye_vision_without_glass?: string;
    left_eye_vision_without_glass?: string;
    right_eye_vision_with_glass?: string;
    left_eye_vision_with_glass?: string;

    // IOP
    right_eye_iop?: string;
    left_eye_iop?: string;

    // Ducts
    right_eye_ducts?: string;
    left_eye_ducts?: string;

    // Vitals
    blood_pressure?: string;
    urine_sugar?: string;
    blood_sugar?: string;

    // Fundus
    right_eye_fundus?: string;
    left_eye_fundus?: string;

    // History
    detailed_history?: string;

    // Medical conditions
    is_one_eyed: boolean;
    is_diabetic: boolean;
    is_cardiac: boolean;
    is_asthmatic: boolean;
    is_hypertensive: boolean;
    is_thyroid: boolean;
    other_conditions?: string;

    // Drugs
    drugs_used?: string;

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
    complains?: string;
    right_eye_vision_without_glass?: string;
    left_eye_vision_without_glass?: string;
    right_eye_vision_with_glass?: string;
    left_eye_vision_with_glass?: string;
    right_eye_iop?: string;
    left_eye_iop?: string;
    blood_pressure?: string;
    blood_sugar?: string;
    is_diabetic: boolean;
    is_cardiac: boolean;
    is_hypertensive: boolean;
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
    const [showOldData, setShowOldData] = useState(false);

    // Helper Functions
    const goBack = () => {
        router.visit(route('doctor.dashboard'));
    };

    const createPrescription = () => {
        if (latestVisit) {
            router.visit(route('prescriptions.create.patient', patient.id));
        }
    };

    const handlePrint = (visionTestId: number) => {
        window.open(route('visiontests.print', visionTestId), '_blank');
    };

    const printVisionTest = (visionTestId: number) => {
        window.open(route('visiontests.print', visionTestId), '_blank');
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

    const getConditionIcon = (condition: boolean) => {
        return condition ?
            <CheckCircle className="w-4 h-4 text-red-600" /> :
            <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>;
    };

    const hasValue = (value: any): boolean => {
        return value !== null && value !== undefined && value !== '';
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

                    {/* 1. Patient Information - First Section */}
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
                        <div className="flex items-center gap-6 mb-6">
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

                        {/* Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-900">{patient.phone}</span>
                                    </div>
                                    {patient.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-900">{patient.email}</span>
                                        </div>
                                    )}
                                    {patient.address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                            <span className="text-gray-900">{patient.address}</span>
                                        </div>
                                    )}
                                    {patient.nid_card && (
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-900">NID: {patient.nid_card}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Age:</span>
                                        <span className="ml-2 font-medium">{patient.age || 'N/A'} years</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Gender:</span>
                                        <span className="ml-2 font-medium capitalize">{patient.gender || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total Visits:</span>
                                        <span className="ml-2 font-medium">{safeStats.total_visits}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Registered:</span>
                                        <span className="ml-2 font-medium">{patient.formatted_registration_date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Medical History Alert */}
                        {patient.medical_history && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span className="font-medium text-red-800">Important Medical History</span>
                                </div>
                                <p className="text-sm text-gray-700">{patient.medical_history}</p>
                            </div>
                        )}
                    </div>

                    {/* 2. Old Data Section - Click to Expand */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <button
                                onClick={() => setShowOldData(!showOldData)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <History className="h-6 w-6 text-amber-600" />
                                    Previous Records & History
                                    <span className="bg-amber-100 text-amber-800 text-sm px-2 py-1 rounded-full">
                                        {safeStats.total_visits} visits • {safeStats.total_vision_tests} tests • {safeStats.total_prescriptions} prescriptions
                                    </span>
                                </h2>
                                {showOldData ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                        </div>

                        {showOldData && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Previous Visits */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-blue-600" />
                                            Previous Visits ({patient.visits?.length || 0})
                                        </h3>

                                        {patient.visits && patient.visits.length > 0 ? (
                                            <div className="space-y-3">
                                                {patient.visits.slice(0, 3).map((visit, index) => (
                                                    <div key={visit.id} className="border border-gray-200 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-medium text-gray-900">{visit.visit_id}</h4>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(visit.overall_status)}`}>
                                                                {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{visit.formatted_date}</p>
                                                        {visit.chief_complaint && (
                                                            <p className="text-sm text-gray-700 mt-1">
                                                                <span className="font-medium">Complaint:</span> {visit.chief_complaint}
                                                            </p>
                                                        )}
                                                        <div className="flex justify-between text-sm mt-2">
                                                            <span>Dr. {visit.selected_doctor?.name || 'N/A'}</span>
                                                            <span className="font-medium">{formatCurrency(visit.final_amount)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {patient.visits.length > 3 && (
                                                    <p className="text-center text-sm text-gray-500">
                                                        +{patient.visits.length - 3} more visits
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">No previous visits</p>
                                        )}
                                    </div>

                                    {/* Previous Vision Tests & Prescriptions */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Eye className="h-5 w-5 text-purple-600" />
                                            Previous Vision Tests & Prescriptions
                                        </h3>

                                        {/* Vision Tests */}
                                        {patient.visionTests && patient.visionTests.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="font-medium text-purple-800 mb-2">Vision Tests ({patient.visionTests.length})</h4>
                                                <div className="space-y-2">
                                                    {patient.visionTests.slice(0, 2).map((test) => (
                                                        <div key={test.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium text-purple-900">{test.formatted_date}</span>
                                                                <button
                                                                    onClick={() => printVisionTest(test.id)}
                                                                    className="text-purple-600 hover:text-purple-800"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>R: {test.right_eye_vision_without_glass || 'N/A'}</div>
                                                                <div>L: {test.left_eye_vision_without_glass || 'N/A'}</div>
                                                            </div>
                                                            <p className="text-xs text-purple-600 mt-1">By: {test.performed_by.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Prescriptions */}
                                        {patient.prescriptions && patient.prescriptions.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-green-800 mb-2">Prescriptions ({patient.prescriptions.length})</h4>
                                                <div className="space-y-2">
                                                    {patient.prescriptions.slice(0, 2).map((prescription) => (
                                                        <div key={prescription.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium text-green-900">{prescription.formatted_date}</span>
                                                                <button
                                                                    onClick={() => printPrescription(prescription.id)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-green-700">
                                                                Dr. {prescription.doctor.name} • {prescription.medicines_count} medicines
                                                            </p>
                                                            {prescription.can_edit && (
                                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mt-1 inline-block">
                                                                    Can Edit
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Latest Vision Test Results - Current Data */}
                    {latestVisionTest && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Eye className="h-6 w-6 text-purple-600" />
                                    Latest Vision Test Results
                                    <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                                        {latestVisionTest.formatted_date}
                                    </span>
                                </h2>
                                <button
                                    onClick={() => handlePrint(latestVisionTest.id)}
                                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Report
                                </button>
                            </div>

                            {/* Chief Complaints */}
                            {latestVisionTest.complains && (
                                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClipboardList className="h-4 w-4 text-orange-600" />
                                        <span className="font-medium text-orange-800">Patient Complaints</span>
                                    </div>
                                    <p className="text-gray-700">{latestVisionTest.complains}</p>
                                </div>
                            )}

                            {/* Visual Acuity Assessment */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    Visual Acuity Assessment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Right Eye */}
                                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                        <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Right Eye (OD)
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {hasValue(latestVisionTest.right_eye_vision_without_glass) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Without Glass:</span>
                                                    <span className="font-medium">{latestVisionTest.right_eye_vision_without_glass}</span>
                                                </div>
                                            )}
                                            {hasValue(latestVisionTest.right_eye_vision_with_glass) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">With Glass:</span>
                                                    <span className="font-medium">{latestVisionTest.right_eye_vision_with_glass}</span>
                                                </div>
                                            )}
                                            {hasValue(latestVisionTest.right_eye_iop) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">IOP:</span>
                                                    <span className="font-medium">{latestVisionTest.right_eye_iop} mmHg</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Left Eye */}
                                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Left Eye (OS)
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {hasValue(latestVisionTest.left_eye_vision_without_glass) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Without Glass:</span>
                                                    <span className="font-medium">{latestVisionTest.left_eye_vision_without_glass}</span>
                                                </div>
                                            )}
                                            {hasValue(latestVisionTest.left_eye_vision_with_glass) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">With Glass:</span>
                                                    <span className="font-medium">{latestVisionTest.left_eye_vision_with_glass}</span>
                                                </div>
                                            )}
                                            {hasValue(latestVisionTest.left_eye_iop) && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">IOP:</span>
                                                    <span className="font-medium">{latestVisionTest.left_eye_iop} mmHg</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vital Signs */}
                            {(hasValue(latestVisionTest.blood_pressure) || hasValue(latestVisionTest.blood_sugar)) && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-red-600" />
                                        Vital Signs
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {hasValue(latestVisionTest.blood_pressure) && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <Heart className="h-4 w-4 text-red-600" />
                                                    <span className="font-medium text-red-800">Blood Pressure</span>
                                                </div>
                                                <p className="text-lg font-bold text-red-900">{latestVisionTest.blood_pressure}</p>
                                            </div>
                                        )}

                                        {hasValue(latestVisionTest.blood_sugar) && (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <Droplets className="h-4 w-4 text-orange-600" />
                                                    <span className="font-medium text-orange-800">Blood Sugar</span>
                                                </div>
                                                <p className="text-lg font-bold text-orange-900">{latestVisionTest.blood_sugar}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Medical Conditions */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    Medical Conditions
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_diabetic)}
                                        <span className="text-sm text-gray-700">Diabetic</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_cardiac)}
                                        <span className="text-sm text-gray-700">Cardiac</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_hypertensive)}
                                        <span className="text-sm text-gray-700">Hypertensive</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 text-center">
                                Performed by: {latestVisionTest.performed_by.name} on {latestVisionTest.formatted_date}
                            </div>
                        </div>
                    )}

                    {/* 4. Current Visit Status & Write Prescription */}
                    {latestVisit && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                    Current Visit Status - {latestVisit.visit_id}
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${latestVisit.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                                            }`}>
                                            {latestVisit.payment_status === 'paid' ? (
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            ) : (
                                                <DollarSign className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${latestVisit.payment_status === 'paid' ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            Payment
                                        </span>
                                    </div>

                                    <div className={`flex-1 h-0.5 mx-4 ${latestVisit.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>

                                    {/* Vision Test Step */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${latestVisit.vision_test_status === 'completed' ? 'bg-green-500' :
                                            latestVisit.payment_status === 'paid' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}>
                                            <Eye className="h-4 w-4 text-white" />
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${latestVisit.vision_test_status === 'completed' ? 'text-green-600' :
                                            latestVisit.payment_status === 'paid' ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                            Vision Test
                                        </span>
                                    </div>

                                    <div className={`flex-1 h-0.5 mx-4 ${latestVisit.vision_test_status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>

                                    {/* Prescription Step */}
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${latestVisit.overall_status === 'completed' ? 'bg-green-500' :
                                            latestVisit.overall_status === 'prescription' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}>
                                            <Stethoscope className="h-4 w-4 text-white" />
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${latestVisit.overall_status === 'completed' ? 'text-green-600' :
                                            latestVisit.overall_status === 'prescription' ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                            Prescription
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chief Complaint */}
                            {latestVisit.chief_complaint && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <span className="font-medium text-yellow-800">Chief Complaint</span>
                                    </div>
                                    <p className="text-gray-700">{latestVisit.chief_complaint}</p>
                                </div>
                            )}

                            {/* Payment Summary */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <h4 className="font-semibold text-green-900 mb-2">Total Amount</h4>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(latestVisit.final_amount)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                    <h4 className="font-semibold text-blue-900 mb-2">Paid</h4>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(latestVisit.total_paid)}</p>
                                </div>
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                    <h4 className="font-semibold text-red-900 mb-2">Due</h4>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(latestVisit.total_due)}</p>
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
                                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-3 shadow-xl"
                                        >
                                            <Plus className="h-6 w-6" />
                                            Write Prescription
                                        </button>
                                    )}

                                {/* Status Messages */}
                                {latestVisit.payment_status !== 'paid' && (
                                    <div className="flex items-center gap-3 px-8 py-4 bg-red-100 text-red-700 rounded-xl">
                                        <AlertCircle className="h-6 w-6" />
                                        <span className="font-medium">Waiting for payment completion</span>
                                    </div>
                                )}

                                {latestVisit.payment_status === 'paid' && latestVisit.vision_test_status !== 'completed' && (
                                    <div className="flex items-center gap-3 px-8 py-4 bg-purple-100 text-purple-700 rounded-xl">
                                        <Clock className="h-6 w-6" />
                                        <span className="font-medium">Waiting for vision test completion</span>
                                    </div>
                                )}

                                {latestVisit.overall_status === 'completed' && (
                                    <div className="flex items-center gap-3 px-8 py-4 bg-green-100 text-green-700 rounded-xl">
                                        <CheckCircle className="h-6 w-6" />
                                        <span className="font-medium">Visit completed successfully</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
