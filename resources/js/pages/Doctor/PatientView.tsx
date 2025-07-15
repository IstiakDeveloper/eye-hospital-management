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
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        'medical-history': true,
        'chief-complaint': true,
        'vision-test': true,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Helper Functions
    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const goBack = () => {
        router.visit(route('doctor.dashboard'));
    };

    const createPrescription = () => {
        router.visit(route('prescriptions.create.patient', patient.id));
    };

    const printVisionTest = (visionTestId: number) => {
        window.open(route('visiontests.print', visionTestId), '_blank');
    };

    const printPrescription = (prescriptionId: number) => {
        window.open(route('prescriptions.print', prescriptionId), '_blank');
    };

    const viewPrescription = (prescriptionId: number) => {
        router.visit(route('prescriptions.show', prescriptionId));
    };

    const editPrescription = (prescriptionId: number) => {
        router.visit(route('prescriptions.edit', prescriptionId));
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString('en-BD')}`;
    };

    const getStatusColor = (status: string): string => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'paid': return 'text-green-600 bg-green-100';
            case 'partial': return 'text-yellow-600 bg-yellow-100';
            case 'pending': return 'text-red-600 bg-red-100';
            case 'cancelled': return 'text-gray-600 bg-gray-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    // Safe stats object with fallbacks
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

    // Filter functions
    const filteredVisits = patient.visits?.filter(visit =>
        searchTerm === '' ||
        visit.visit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(visit =>
        filterStatus === 'all' || visit.overall_status === filterStatus
    ) || [];

    const filteredPrescriptions = patient.prescriptions?.filter(prescription =>
        searchTerm === '' ||
        prescription.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescription_medicines.some(med =>
            med.medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) || [];

    return (
        <AdminLayout title={`Patient: ${patient.name}`}>
            <Head title={`Patient: ${patient.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header Section */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <span className="text-2xl">{getGenderIcon(patient.gender)}</span>
                                {patient.name}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Patient ID: {patient.patient_id} • Dr. {doctor.name} • Registered: {patient.formatted_registration_date}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {todaysAppointment && (
                                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
                                    Serial: {todaysAppointment.serial_number} • {todaysAppointment.appointment_time}
                                </div>
                            )}
                            <button
                                onClick={createPrescription}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                Write Prescription
                            </button>
                        </div>
                    </div>

                    {/* Patient Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                        {/* Basic Info Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Basic Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Age:</span>
                                    <span className="font-medium">{patient.age || 'N/A'} years</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="font-medium capitalize">{patient.gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium text-xs">{patient.phone}</span>
                                </div>
                                {patient.email && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium text-xs">{patient.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visit Statistics Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-green-600" />
                                Visit Stats
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Visits:</span>
                                    <span className="font-medium">{safeStats.total_visits}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Visit:</span>
                                    <span className="font-medium text-xs">{safeStats.last_visit_date || 'None'}</span>
                                </div>
                                {latestVisit && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(latestVisit.overall_status)}`}>
                                                {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-medium text-xs">{formatCurrency(latestVisit.final_amount)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Vision Test Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Eye className="h-5 w-5 text-purple-600" />
                                Vision Tests
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Tests:</span>
                                    <span className="font-medium">{safeStats.total_vision_tests}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Test:</span>
                                    <span className="font-medium text-xs">{safeStats.last_vision_test_date || 'None'}</span>
                                </div>
                                {latestVisionTest && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Right Eye:</span>
                                            <span className="font-medium text-xs">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Left Eye:</span>
                                            <span className="font-medium text-xs">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">By:</span>
                                            <span className="font-medium text-xs">{latestVisionTest.performed_by.name}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Prescription Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Pill className="h-5 w-5 text-orange-600" />
                                Prescriptions
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-medium">{safeStats.total_prescriptions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">By Me:</span>
                                    <span className="font-medium">{safeStats.my_prescriptions}</span>
                                </div>
                                {patient.prescriptions && patient.prescriptions.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Latest:</span>
                                        <span className="font-medium text-xs">
                                            {patient.prescriptions[0].formatted_date}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={createPrescription}
                                    className="w-full mt-3 py-2 px-3 bg-orange-100 text-orange-800 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                                >
                                    + New Prescription
                                </button>
                            </div>
                        </div>

                        {/* Financial Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                                Financial
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Paid:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(patient.stats.total_amount_paid)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Due:</span>
                                    <span className="font-medium text-red-600">{formatCurrency(patient.stats.total_amount_due)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Appointments:</span>
                                    <span className="font-medium">{patient.stats.total_appointments}</span>
                                </div>
                                {latestVisit && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment:</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(latestVisit.payment_status)}`}>
                                            {latestVisit.payment_status.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Tabs Section */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                {[
                                    { id: 'overview', name: 'Overview', icon: Info, count: null },
                                    { id: 'history', name: 'Visit History', icon: History, count: safeStats.total_visits },
                                    { id: 'vision', name: 'Vision Tests', icon: Eye, count: safeStats.total_vision_tests },
                                    { id: 'prescriptions', name: 'Prescriptions', icon: Pill, count: safeStats.total_prescriptions },
                                    { id: 'appointments', name: 'Appointments', icon: Calendar, count: safeStats.total_appointments },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`${activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {tab.name}
                                            {tab.count !== null && tab.count > 0 && (
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full ml-1">
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">

                                    {/* Chief Complaint Section */}
                                    {latestVisit?.chief_complaint && (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('chief-complaint')}
                                                className="w-full px-6 py-4 bg-yellow-50 flex items-center justify-between text-left hover:bg-yellow-100 transition-colors"
                                            >
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                    Chief Complaint - Latest Visit ({latestVisit.formatted_date})
                                                </h3>
                                                {expandedSections['chief-complaint'] ?
                                                    <ChevronDown className="h-5 w-5 text-gray-400" /> :
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                }
                                            </button>
                                            {expandedSections['chief-complaint'] && (
                                                <div className="px-6 py-4 bg-white">
                                                    <p className="text-gray-700 leading-relaxed">{latestVisit.chief_complaint}</p>
                                                    {latestVisit.visit_notes && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <h5 className="font-medium text-gray-900 mb-2">Visit Notes:</h5>
                                                            <p className="text-gray-700 text-sm">{latestVisit.visit_notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Medical History Section */}
                                    {patient.medical_history && (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('medical-history')}
                                                className="w-full px-6 py-4 bg-blue-50 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
                                            >
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Heart className="h-5 w-5 text-red-600" />
                                                    Medical History
                                                </h3>
                                                {expandedSections['medical-history'] ?
                                                    <ChevronDown className="h-5 w-5 text-gray-400" /> :
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                }
                                            </button>
                                            {expandedSections['medical-history'] && (
                                                <div className="px-6 py-4 bg-white">
                                                    <p className="text-gray-700 leading-relaxed">{patient.medical_history}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Latest Vision Test Section */}
                                    {latestVisionTest && (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('vision-test')}
                                                className="w-full px-6 py-4 bg-purple-50 flex items-center justify-between text-left hover:bg-purple-100 transition-colors"
                                            >
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Eye className="h-5 w-5 text-purple-600" />
                                                    Latest Vision Test Results ({latestVisionTest.formatted_date})
                                                </h3>
                                                {expandedSections['vision-test'] ?
                                                    <ChevronDown className="h-5 w-5 text-gray-400" /> :
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                }
                                            </button>
                                            {expandedSections['vision-test'] && (
                                                <div className="px-6 py-4 bg-white">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Right Eye */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-3">Right Eye</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Vision:</span>
                                                                    <span className="font-medium">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Sphere:</span>
                                                                    <span className="font-medium">{latestVisionTest.right_eye_sphere || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cylinder:</span>
                                                                    <span className="font-medium">{latestVisionTest.right_eye_cylinder || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Axis:</span>
                                                                    <span className="font-medium">{latestVisionTest.right_eye_axis || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Left Eye */}
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-3">Left Eye</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Vision:</span>
                                                                    <span className="font-medium">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Sphere:</span>
                                                                    <span className="font-medium">{latestVisionTest.left_eye_sphere || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cylinder:</span>
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
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600">Pupillary Distance:</span>
                                                                <span className="font-medium">{latestVisionTest.pupillary_distance}mm</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {latestVisionTest.additional_notes && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <h5 className="font-medium text-gray-900 mb-2">Additional Notes:</h5>
                                                            <p className="text-gray-700 text-sm">{latestVisionTest.additional_notes}</p>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                                        <div className="text-sm text-gray-600">
                                                            Performed by: {latestVisionTest.performed_by.name}
                                                        </div>
                                                        <button
                                                            onClick={() => printVisionTest(latestVisionTest.id)}
                                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                            Print Report
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Contact Information */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Phone className="h-5 w-5 text-blue-600" />
                                            Contact Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Phone:</span>
                                                <p className="font-medium">{patient.phone}</p>
                                            </div>
                                            {patient.email && (
                                                <div>
                                                    <span className="text-gray-600">Email:</span>
                                                    <p className="font-medium">{patient.email}</p>
                                                </div>
                                            )}
                                            {patient.address && (
                                                <div className="md:col-span-2">
                                                    <span className="text-gray-600">Address:</span>
                                                    <p className="font-medium">{patient.address}</p>
                                                </div>
                                            )}
                                            {patient.nid_card && (
                                                <div>
                                                    <span className="text-gray-600">NID Card:</span>
                                                    <p className="font-medium">{patient.nid_card}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VISIT HISTORY TAB */}
                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {/* Search and Filter */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex-1 relative">
                                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search visits by ID or complaint..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="completed">Completed</option>
                                                <option value="pending">Pending</option>
                                                <option value="prescription">Prescription</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {filteredVisits.length > 0 ? (
                                        filteredVisits.map((visit) => (
                                            <div key={visit.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                            {visit.visit_id}
                                                            <span className="text-sm text-gray-500">• {visit.formatted_time}</span>
                                                        </h4>
                                                        <p className="text-sm text-gray-600">{visit.formatted_date}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(visit.payment_status)}`}>
                                                            {visit.payment_status.toUpperCase()}
                                                        </span>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(visit.overall_status)}`}>
                                                            {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                                                    <div>
                                                        <span className="text-gray-600">Doctor:</span>
                                                        <p className="font-medium">
                                                            {visit.selected_doctor?.name || 'No Doctor Selected'}
                                                        </p>
                                                        {visit.selected_doctor?.specialization && (
                                                            <p className="text-xs text-gray-500">{visit.selected_doctor.specialization}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Amount:</span>
                                                        <p className="font-medium">{formatCurrency(visit.final_amount)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Paid:</span>
                                                        <p className="font-medium text-green-600">{formatCurrency(visit.total_paid)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Due:</span>
                                                        <p className="font-medium text-red-600">{formatCurrency(visit.total_due)}</p>
                                                    </div>
                                                </div>

                                                {visit.chief_complaint && (
                                                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                                                        <span className="text-gray-600 text-sm font-medium">Chief Complaint:</span>
                                                        <p className="font-medium text-sm mt-1">{visit.chief_complaint}</p>
                                                    </div>
                                                )}

                                                {visit.visit_notes && (
                                                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                                        <span className="text-gray-600 text-sm font-medium">Visit Notes:</span>
                                                        <p className="font-medium text-sm mt-1">{visit.visit_notes}</p>
                                                    </div>
                                                )}

                                                {visit.payments.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <h6 className="font-medium text-gray-900 mb-2">Payment History:</h6>
                                                        <div className="space-y-2">
                                                            {visit.payments.map((payment) => (
                                                                <div key={payment.id} className="flex justify-between items-center text-sm bg-green-50 p-2 rounded">
                                                                    <div>
                                                                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                                                        <span className="text-gray-600 ml-2">• {payment.payment_method}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {payment.formatted_date}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">
                                                {searchTerm || filterStatus !== 'all' ? 'No visits found matching your search criteria' : 'No visit history found'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISION TESTS TAB */}
                            {activeTab === 'vision' && (
                                <div className="space-y-4">
                                    {patient.visionTests && patient.visionTests.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Vision Test History ({patient.visionTests.length} tests)
                                                </h3>
                                                <div className="text-sm text-gray-600">
                                                    Latest: {patient.stats.last_vision_test_date || 'None'}
                                                </div>
                                            </div>

                                            {patient.visionTests.map((test, index) => (
                                                <div key={test.id || index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                Vision Test #{test.id}
                                                                {index === 0 && (
                                                                    <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">Latest</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{test.formatted_date} • {test.formatted_time}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm text-gray-600">
                                                                by {test.performed_by?.name || 'Unknown'}
                                                            </div>
                                                            {test.can_print && (
                                                                <button
                                                                    onClick={() => printVisionTest(test.id)}
                                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    title="Print Vision Test Report"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h5 className="font-medium text-gray-900 mb-3">Right Eye</h5>
                                                            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Vision:</span>
                                                                    <span className="font-medium">{test.right_eye_vision || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Sphere:</span>
                                                                    <span className="font-medium">{test.right_eye_sphere || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cylinder:</span>
                                                                    <span className="font-medium">{test.right_eye_cylinder || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Axis:</span>
                                                                    <span className="font-medium">{test.right_eye_axis || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="font-medium text-gray-900 mb-3">Left Eye</h5>
                                                            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Vision:</span>
                                                                    <span className="font-medium">{test.left_eye_vision || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Sphere:</span>
                                                                    <span className="font-medium">{test.left_eye_sphere || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cylinder:</span>
                                                                    <span className="font-medium">{test.left_eye_cylinder || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Axis:</span>
                                                                    <span className="font-medium">{test.left_eye_axis || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {test.pupillary_distance && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="flex justify-between text-sm bg-blue-50 p-3 rounded-lg">
                                                                <span className="text-gray-600 font-medium">Pupillary Distance:</span>
                                                                <span className="font-medium">{test.pupillary_distance}mm</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {test.additional_notes && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <h6 className="font-medium text-gray-900 mb-2">Additional Notes:</h6>
                                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                                <p className="text-gray-700 text-sm">{test.additional_notes}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">No vision tests found</p>
                                            <p className="text-sm text-gray-500">
                                                Vision tests are performed by refractionist staff. Once completed, they will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PRESCRIPTIONS TAB */}
                            {activeTab === 'prescriptions' && (
                                <div className="space-y-4">
                                    {/* Search */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex-1 relative">
                                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search prescriptions by doctor or medicine..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            onClick={createPrescription}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            New Prescription
                                        </button>
                                    </div>

                                    {filteredPrescriptions.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Prescription History ({filteredPrescriptions.length} prescriptions)
                                                </h3>
                                                <div className="text-sm text-gray-600">
                                                    My Prescriptions: {patient.stats.my_prescriptions}
                                                </div>
                                            </div>

                                            {filteredPrescriptions.map((prescription, index) => (
                                                <div key={prescription.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                Prescription #{prescription.id}
                                                                {index === 0 && (
                                                                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Latest</span>
                                                                )}
                                                                {prescription.can_edit && (
                                                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Can Edit</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{prescription.formatted_date} • {prescription.formatted_time}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => viewPrescription(prescription.id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="View Prescription Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            {prescription.can_print && (
                                                                <button
                                                                    onClick={() => printPrescription(prescription.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Print Prescription"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {prescription.can_edit && (
                                                                <button
                                                                    onClick={() => editPrescription(prescription.id)}
                                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="Edit Prescription"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-gray-600 text-sm">Prescribed by:</span>
                                                                <p className="font-medium">{prescription.doctor.name}</p>
                                                                <p className="text-xs text-gray-500">{prescription.doctor.specialization}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-gray-600 text-sm">Medicines:</span>
                                                                <p className="font-medium">{prescription.medicines_count} items</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h6 className="font-medium text-gray-900">Medicines:</h6>
                                                        {prescription.prescription_medicines && prescription.prescription_medicines.map((medicine, medIndex) => (
                                                            <div key={medIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <h5 className="font-medium text-gray-900">
                                                                            {medicine.medicine?.name || 'Unknown Medicine'}
                                                                            {medicine.medicine?.strength && (
                                                                                <span className="text-gray-600 ml-2">({medicine.medicine.strength})</span>
                                                                            )}
                                                                            {medicine.medicine?.type && (
                                                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded ml-2">
                                                                                    {medicine.medicine.type}
                                                                                </span>
                                                                            )}
                                                                        </h5>
                                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 text-sm">
                                                                            <div className="bg-blue-50 p-2 rounded">
                                                                                <span className="font-medium text-blue-800">Dosage:</span>
                                                                                <p className="text-blue-700">{medicine.dosage || 'N/A'}</p>
                                                                            </div>
                                                                            <div className="bg-green-50 p-2 rounded">
                                                                                <span className="font-medium text-green-800">Frequency:</span>
                                                                                <p className="text-green-700">{medicine.frequency || 'N/A'}</p>
                                                                            </div>
                                                                            <div className="bg-yellow-50 p-2 rounded">
                                                                                <span className="font-medium text-yellow-800">Duration:</span>
                                                                                <p className="text-yellow-700">{medicine.duration || 'N/A'}</p>
                                                                            </div>
                                                                            {medicine.quantity && (
                                                                                <div className="bg-purple-50 p-2 rounded">
                                                                                    <span className="font-medium text-purple-800">Quantity:</span>
                                                                                    <p className="text-purple-700">{medicine.quantity}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {medicine.instructions && (
                                                                            <div className="mt-3 p-3 bg-orange-50 rounded">
                                                                                <span className="font-medium text-orange-800 text-sm">Special Instructions:</span>
                                                                                <p className="text-orange-700 text-sm mt-1">{medicine.instructions}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">
                                                {searchTerm ? 'No prescriptions found matching your search' : 'No prescriptions found'}
                                            </p>
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

                            {/* APPOINTMENTS TAB */}
                            {activeTab === 'appointments' && (
                                <div className="space-y-4">
                                    {patient.appointments && patient.appointments.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Appointment History ({patient.appointments.length} appointments)
                                                </h3>
                                                {todaysAppointment && (
                                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                                                        Today: Serial {todaysAppointment.serial_number}
                                                    </div>
                                                )}
                                            </div>

                                            {patient.appointments.map((appointment, index) => (
                                                <div key={appointment.id} className={`border rounded-xl p-6 hover:shadow-md transition-shadow ${appointment.is_today ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                Appointment #{appointment.id}
                                                                {appointment.is_today && (
                                                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Today</span>
                                                                )}
                                                                {appointment.is_past && !appointment.is_today && (
                                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Past</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {appointment.formatted_date} • {appointment.appointment_time}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-gray-600">
                                                                Serial: {appointment.serial_number}
                                                            </span>
                                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                                                                {appointment.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Doctor:</span>
                                                            <p className="font-medium">{appointment.doctor.name}</p>
                                                            <p className="text-xs text-gray-500">{appointment.doctor.specialization}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Date & Time:</span>
                                                            <p className="font-medium">{appointment.formatted_date}</p>
                                                            <p className="text-xs text-gray-500">{appointment.appointment_time}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Status:</span>
                                                            <p className={`font-medium text-sm ${appointment.status === 'completed' ? 'text-green-600' :
                                                                    appointment.status === 'pending' ? 'text-red-600' :
                                                                        appointment.status === 'in_progress' ? 'text-blue-600' :
                                                                            'text-gray-600'
                                                                }`}>
                                                                {appointment.status.replace('_', ' ').toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No appointments found</p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Appointments are created by reception staff.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="text-sm text-gray-600">
                                    <strong>Patient registered:</strong> {patient.formatted_registration_date}
                                </div>
                                {todaysAppointment && (
                                    <div className="text-sm text-gray-600">
                                        <strong>Today's appointment:</strong> {todaysAppointment.appointment_time} (Serial: {todaysAppointment.serial_number})
                                    </div>
                                )}
                                <div className="text-sm text-gray-600">
                                    <strong>Total visits:</strong> {patient.stats.total_visits}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {latestVisionTest && (
                                    <button
                                        onClick={() => printVisionTest(latestVisionTest.id)}
                                        className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Latest Vision Report
                                    </button>
                                )}

                                {patient.prescriptions.length > 0 && (
                                    <button
                                        onClick={() => printPrescription(patient.prescriptions[0].id)}
                                        className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                        <Pill className="h-4 w-4" />
                                        Latest Prescription
                                    </button>
                                )}

                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Patient Info
                                </button>

                                <button
                                    onClick={createPrescription}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Write Prescription
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default DoctorPatientView;
