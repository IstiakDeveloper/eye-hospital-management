import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Clock,
    Eye,
    History,
    Phone,
    Plus,
    Printer,
    Shield,
    Stethoscope,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

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

const DoctorPatientView: React.FC<Props> = ({ patient, latestVisit, latestVisionTest, todaysAppointment, doctor }) => {
    const [showOldData, setShowOldData] = useState(false);
    const [showVisionModal, setShowVisionModal] = useState(false);

    // Helper Functions
    const goBack = () => {
        router.visit(route('doctor.dashboard'));
    };

    const createPrescription = () => {
        if (latestVisit) {
            router.visit(route('prescriptions.create.patient', patient.id));
        }
    };

    const fillVisionTest = () => {
        router.visit(route('doctor.vision-tests.create', patient.id));
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
            case 'completed':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'paid':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'partial':
                return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'pending':
                return 'text-red-600 bg-red-100 border-red-200';
            case 'prescription':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'vision_test':
                return 'text-purple-600 bg-purple-100 border-purple-200';
            case 'skipped':
                return 'text-amber-700 bg-amber-100 border-amber-200';
            case 'cancelled':
                return 'text-gray-600 bg-gray-100 border-gray-200';
            case 'in_progress':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male':
                return '👨';
            case 'female':
                return '👩';
            default:
                return '👤';
        }
    };

    const getConditionIcon = (condition: boolean) => {
        return condition ? <CheckCircle className="h-4 w-4 text-red-600" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>;
    };

    const hasValue = (value: any): boolean => {
        return value !== null && value !== undefined && value !== '';
    };

    const renderField = (label: string, value: any) => {
        if (!hasValue(value)) {
            return null;
        }

        return (
            <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold text-gray-600">{label}</div>
                <div className="text-right text-sm font-medium text-gray-900">{String(value)}</div>
            </div>
        );
    };

    // Safe stats with fallbacks
    const safeStats = patient.stats || {
        total_visits: patient.visits?.length || 0,
        total_prescriptions: patient.prescriptions?.length || 0,
        total_vision_tests: patient.visionTests?.length || 0,
        total_appointments: patient.appointments?.length || 0,
        my_prescriptions: patient.prescriptions?.filter((p) => p.doctor.id === doctor.id).length || 0,
        total_amount_paid: 0,
        total_amount_due: 0,
        last_visit_date: patient.visits?.[0]?.formatted_date || null,
        last_vision_test_date: patient.visionTests?.[0]?.formatted_date || null,
    };

    const previousVisionTests = (patient.visionTests || []).filter((t) => t.id !== latestVisionTest?.id);

    const canFillVisionTest =
        !!latestVisit &&
        latestVisit.payment_status === 'paid' &&
        latestVisit.vision_test_status !== 'completed' &&
        latestVisit.vision_test_status !== 'skipped';
    const canWritePrescription =
        !!latestVisit &&
        latestVisit.overall_status === 'prescription' &&
        latestVisit.payment_status === 'paid' &&
        (latestVisit.vision_test_status === 'completed' || latestVisit.vision_test_status === 'skipped');

    return (
        <AdminLayout title={`Patient: ${patient.name}`}>
            <Head title={`Patient: ${patient.name}`} />

            <div className="mx-auto max-w-6xl space-y-4">
                {/* Sticky action bar (doctor speed) */}
                <div className="sticky top-2 z-40 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{patient.name}</span>
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                    {patient.patient_id}
                                </span>
                                {latestVisit && (
                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                        Visit: {latestVisit.visit_id}
                                    </span>
                                )}
                                {latestVisit && (
                                    <>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(latestVisit.payment_status)}`}
                                        >
                                            Pay: {latestVisit.payment_status.toUpperCase()}
                                        </span>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(latestVisit.vision_test_status)}`}
                                        >
                                            Vision: {latestVisit.vision_test_status.toUpperCase()}
                                        </span>
                                    </>
                                )}
                            </div>
                            {latestVisit?.chief_complaint && (
                                <div className="mt-1 line-clamp-1 text-xs text-gray-600">
                                    <span className="font-semibold text-gray-700">CC:</span> {latestVisit.chief_complaint}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {canFillVisionTest && (
                                <button
                                    onClick={fillVisionTest}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                    <Eye className="h-4 w-4" />
                                    Fill Vision
                                </button>
                            )}
                            {canWritePrescription && (
                                <button
                                    onClick={createPrescription}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Prescription
                                </button>
                            )}
                            {latestVisionTest && (
                                <button
                                    onClick={() => setShowVisionModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100"
                                >
                                    <Eye className="h-4 w-4" />
                                    Vision Result
                                </button>
                            )}
                            {latestVisionTest && (
                                <button
                                    onClick={() => handlePrint(latestVisionTest.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact patient header */}
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={goBack}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-lg font-bold text-gray-900">
                                    <span className="mr-2 text-base">{getGenderIcon(patient.gender)}</span>
                                    {patient.name}
                                </div>
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                    {patient.patient_id}
                                </span>
                                {patient.age && (
                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                                        {patient.age}y
                                    </span>
                                )}
                                {todaysAppointment && (
                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                        Today SL: {todaysAppointment.serial_number}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {patient.phone}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Activity className="h-3.5 w-3.5 text-gray-400" />
                                    Visits: {safeStats.total_visits}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                                    Dr. {doctor.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {patient.medical_history && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                            <span className="font-semibold">Medical history:</span> {patient.medical_history}
                        </div>
                    )}
                </div>

                {/* 2. Old Data Section - Click to Expand */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="border-b border-gray-200 p-6">
                        <button onClick={() => setShowOldData(!showOldData)} className="flex w-full items-center justify-between text-left">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                <History className="h-6 w-6 text-amber-600" />
                                Previous Records & History
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-sm text-amber-800">
                                    {safeStats.total_visits} visits • {safeStats.total_vision_tests} tests • {safeStats.total_prescriptions}{' '}
                                    prescriptions
                                </span>
                            </h2>
                            {showOldData ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                        </button>
                    </div>

                    {showOldData && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                            <Activity className="h-4 w-4 text-blue-600" />
                                            Visits
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {patient.visits?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                    {patient.visits && patient.visits.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {patient.visits.slice(0, 5).map((visit) => (
                                                <div key={visit.id} className="py-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-gray-900">{visit.visit_id}</div>
                                                            <div className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                                                                {visit.formatted_date}
                                                                {visit.chief_complaint ? ` • CC: ${visit.chief_complaint}` : ''}
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(visit.overall_status)}`}
                                                        >
                                                            {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {patient.visits.length > 5 && (
                                                <div className="pt-2 text-center text-xs text-gray-500">+{patient.visits.length - 5} more</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-sm text-gray-500">No previous visits</div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <Eye className="h-4 w-4 text-purple-600" />
                                        Vision Tests
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                            {previousVisionTests.length}
                                        </span>
                                    </div>
                                    {previousVisionTests.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {previousVisionTests.slice(0, 5).map((test) => (
                                                <div key={test.id} className="flex items-center justify-between gap-3 py-2">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900">{test.formatted_date}</div>
                                                        <div className="mt-0.5 text-xs text-gray-600">
                                                            OD: {test.right_eye_vision_without_glass || 'N/A'} • OS:{' '}
                                                            {test.left_eye_vision_without_glass || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => printVisionTest(test.id)}
                                                        className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                                                        aria-label="Print vision test"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-sm text-gray-500">No previous vision tests</div>
                                    )}

                                    {patient.prescriptions && patient.prescriptions.length > 0 && (
                                        <div className="mt-5">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="text-sm font-bold text-gray-900">Prescriptions</div>
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                    {patient.prescriptions.length}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {patient.prescriptions.slice(0, 5).map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between gap-3 py-2">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900">{p.formatted_date}</div>
                                                            <div className="mt-0.5 text-xs text-gray-600">
                                                                Dr. {p.doctor.name} • {p.medicines_count} meds
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => printPrescription(p.id)}
                                                            className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
                                                            aria-label="Print prescription"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
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
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                <Eye className="h-6 w-6 text-purple-600" />
                                Latest Vision Test Results
                                <span className="rounded-full bg-purple-100 px-2 py-1 text-sm text-purple-800">
                                    {latestVisionTest.formatted_date}
                                </span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowVisionModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                                >
                                    <Eye className="h-4 w-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => handlePrint(latestVisionTest.id)}
                                    className="flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 font-medium text-purple-700 transition-colors hover:bg-purple-50"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-semibold text-gray-600">OD / OS (without glass)</div>
                                <div className="mt-2 flex items-center justify-between text-sm font-bold text-gray-900">
                                    <span>OD: {latestVisionTest.right_eye_vision_without_glass || '—'}</span>
                                    <span>OS: {latestVisionTest.left_eye_vision_without_glass || '—'}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                    IOP: OD {latestVisionTest.right_eye_iop || '—'} • OS {latestVisionTest.left_eye_iop || '—'}
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-semibold text-gray-600">Vitals</div>
                                <div className="mt-2 space-y-2">
                                    {renderField('BP', latestVisionTest.blood_pressure)}
                                    {renderField('Blood sugar', latestVisionTest.blood_sugar)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-semibold text-gray-600">Flags</div>
                                <div className="mt-2 space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Diabetic</span>
                                        {getConditionIcon(latestVisionTest.is_diabetic)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Cardiac</span>
                                        {getConditionIcon(latestVisionTest.is_cardiac)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Hypertensive</span>
                                        {getConditionIcon(latestVisionTest.is_hypertensive)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {latestVisionTest.complains && (
                            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-gray-900">
                                <span className="mr-2 inline-flex items-center gap-2 font-bold text-orange-900">
                                    <ClipboardList className="h-4 w-4" />
                                    Complaints:
                                </span>
                                {latestVisionTest.complains}
                            </div>
                        )}

                        <div className="mt-4 text-xs text-gray-600">
                            Performed by <span className="font-semibold">{latestVisionTest.performed_by.name}</span>
                        </div>
                    </div>
                )}

                {/* 4. Current Visit Status & Write Prescription */}
                {latestVisit && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                <div className="text-sm font-bold text-gray-900">Current Visit</div>
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                    {latestVisit.visit_id}
                                </span>
                                <span className="text-xs text-gray-500">{latestVisit.formatted_date}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(latestVisit.payment_status)}`}
                                >
                                    Payment: {latestVisit.payment_status.toUpperCase()}
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(latestVisit.vision_test_status)}`}
                                >
                                    Vision: {latestVisit.vision_test_status.toUpperCase()}
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(latestVisit.overall_status)}`}
                                >
                                    {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Amount quick view */}
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-gray-600">Total</div>
                                <div className="font-bold text-gray-900">{formatCurrency(latestVisit.final_amount)}</div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-gray-600">Paid</div>
                                <div className="font-bold text-gray-900">{formatCurrency(latestVisit.total_paid)}</div>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-gray-600">Due</div>
                                <div className="font-bold text-gray-900">{formatCurrency(latestVisit.total_due)}</div>
                            </div>
                        </div>

                        {/* Chief Complaint */}
                        {latestVisit.chief_complaint && (
                            <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-xs font-semibold text-yellow-800">Chief Complaint</span>
                                </div>
                                <p className="text-sm text-gray-800">{latestVisit.chief_complaint}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-col items-center justify-center gap-3 md:flex-row">
                            {/* Ready for Prescription */}
                            {latestVisit.overall_status === 'prescription' &&
                                latestVisit.payment_status === 'paid' &&
                                (latestVisit.vision_test_status === 'completed' || latestVisit.vision_test_status === 'skipped') && (
                                    <button
                                        onClick={createPrescription}
                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Write Prescription
                                    </button>
                                )}

                            {/* Status Messages */}
                            {latestVisit.payment_status !== 'paid' && (
                                <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-semibold">Waiting for payment</span>
                                </div>
                            )}

                            {latestVisit.payment_status === 'paid' &&
                                latestVisit.vision_test_status !== 'completed' &&
                                latestVisit.vision_test_status !== 'skipped' && (
                                    <div className="flex flex-col items-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-purple-900">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Clock className="h-5 w-5" />
                                            Vision test pending
                                        </div>
                                        <button
                                            onClick={fillVisionTest}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                                        >
                                            Fill vision test (Doctor)
                                        </button>
                                    </div>
                                )}

                            {latestVisit.payment_status === 'paid' && latestVisit.vision_test_status === 'skipped' && (
                                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-semibold">Vision test skipped (blank)</span>
                                </div>
                            )}

                            {latestVisit.overall_status === 'completed' && (
                                <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Visit completed</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Vision test details modal */}
            {latestVisionTest && showVisionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 p-5">
                            <div>
                                <div className="text-sm font-bold text-gray-900">Vision Test Details</div>
                                <div className="mt-1 text-xs text-gray-600">
                                    {patient.name} • {patient.patient_id} • {latestVisionTest.formatted_date}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowVisionModal(false)}
                                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-5">
                            {hasValue(latestVisionTest.complains) && (
                                <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-900">
                                        <ClipboardList className="h-4 w-4" />
                                        Complaints
                                    </div>
                                    <div className="text-sm text-gray-900">{latestVisionTest.complains}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-3 text-sm font-bold text-gray-900">Visual Acuity</div>
                                    <div className="space-y-2">
                                        {renderField('OD (without)', latestVisionTest.right_eye_vision_without_glass)}
                                        {renderField('OD (with)', latestVisionTest.right_eye_vision_with_glass)}
                                        {renderField('OS (without)', latestVisionTest.left_eye_vision_without_glass)}
                                        {renderField('OS (with)', latestVisionTest.left_eye_vision_with_glass)}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-3 text-sm font-bold text-gray-900">IOP & Vitals</div>
                                    <div className="space-y-2">
                                        {renderField('OD IOP', latestVisionTest.right_eye_iop)}
                                        {renderField('OS IOP', latestVisionTest.left_eye_iop)}
                                        {renderField('BP', latestVisionTest.blood_pressure)}
                                        {renderField('Blood sugar', latestVisionTest.blood_sugar)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-gray-200 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <Shield className="h-4 w-4 text-gray-700" />
                                    Medical Conditions
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_diabetic)}
                                        <span className="text-gray-800">Diabetic</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_cardiac)}
                                        <span className="text-gray-800">Cardiac</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getConditionIcon(latestVisionTest.is_hypertensive)}
                                        <span className="text-gray-800">Hypertensive</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-xs text-gray-600">
                                Performed by <span className="font-semibold">{latestVisionTest.performed_by.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-5">
                            <button
                                onClick={() => setShowVisionModal(false)}
                                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handlePrint(latestVisionTest.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default DoctorPatientView;
