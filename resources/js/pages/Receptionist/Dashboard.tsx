import NewVisitModal from '@/components/NewVisitModal';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Eye,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Stethoscope,
    User,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Type definitions
interface Patient {
    patient_id: number;
    visit_id?: number;
    patient_unique_id: string;
    visit_unique_id?: string;
    name: string;
    phone: string;
    email?: string;
    nid_card?: string;
    payment_status: string;
    vision_test_status?: string;
    overall_status?: string;
    total_paid?: number;
    final_amount?: number;
    total_due?: number;
    created_at: string;
    latest_visit_date?: string;
    doctor_name?: string;
    has_active_visit?: boolean;
}

interface Visit {
    id: number;
    visit_id: string;
    patient_id: string;
    patient_name: string;
    phone: string;
    email?: string;
    payment_status: string;
    vision_test_status: string;
    overall_status: string;
    total_paid: number;
    final_amount: number;
    total_due: number;
    created_at: string;
    doctor_name?: string;
}

interface PaymentSummary {
    id: number;
    amount: number;
    patient_name: string;
    patient_id: string;
    visit_id: string;
    payment_method: string;
    payment_date: string;
    created_at: string;
}

interface DashboardStats {
    today_registrations: number;
    today_revenue: number;
    today_pending_payments: number;
    month_registrations: number;
    month_revenue: number;
    total_patients: number;
    total_visits: number;
    pending_payments_count: number;
    pending_payments_amount: number;
    visits_ready_for_vision_test: number;
    visits_in_vision_test: number;
    visits_ready_for_prescription: number;
    last_registration_time?: string;
    last_payment_time?: string;
}

interface Props {
    stats: DashboardStats;
    recentVisits: Visit[];
    todayPayments: {
        total_amount: number;
        total_count: number;
        average_payment: number;
        payments: PaymentSummary[];
    };
    pendingVisits: Visit[];
    doctors: Doctor[];
}

interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee: number;
}

const ReceptionistDashboard: React.FC<Props> = ({ stats, recentVisits, todayPayments, pendingVisits, doctors = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showNewVisitModal, setShowNewVisitModal] = useState(false);
    const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);

    // Auto-search when typing
    useEffect(() => {
        if (searchTerm.length >= 2) {
            const timeoutId = setTimeout(() => {
                performSearch();
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const performSearch = async (): Promise<void> => {
        if (searchTerm.length < 2) return;

        setIsSearching(true);
        try {
            const response = await axios.post(route('receptionist.quick-search'), {
                term: searchTerm,
            });

            if (response.data) {
                console.log('Search Results:', response.data); // Debug log

                // Debug each patient
                response.data.forEach((patient: Patient) => {
                    console.log(`Patient: ${patient.name}`);
                    console.log(`- Has Active Visit: ${patient.has_active_visit}`);
                    console.log(`- Overall Status: ${patient.overall_status}`);
                    console.log(`- Payment Status: ${patient.payment_status}`);
                    console.log(`- Visit ID: ${patient.visit_id}`);
                    if (patient.debug_info) {
                        console.log(`- Debug Info:`, patient.debug_info);
                    }
                    console.log('---');
                });

                setSearchResults(response.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleQuickRegister = (): void => {
        router.visit(route('patients.create'));
    };

    const handlePrintReceipt = (patientId: number): void => {
        router.visit(route('patients.receipt', patientId));
    };

    const handleViewPatient = (patientId: number): void => {
        router.visit(route('patients.show', patientId));
    };

    const handleViewVisit = (patientId: number): void => {
        router.visit(route('patients.show', patientId));
    };

    const handleViewVisitDetails = (visitId: number): void => {
        router.visit(route('visits.show', visitId));
    };

    const handlePrintVisitReceipt = (visitId: number): void => {
        router.visit(route('visits.receipt', visitId));
    };

    const handleNewVisit = (patient: Patient): void => {
        setSelectedPatientForVisit({
            id: patient.patient_id,
            patient_id: patient.patient_unique_id,
            name: patient.name,
            phone: patient.phone,
            email: patient.email,
        });
        setShowNewVisitModal(true);
    };

    const handleCloseNewVisitModal = (): void => {
        setShowNewVisitModal(false);
        setSelectedPatientForVisit(null);
        // Refresh dashboard data after creating new visit
        refreshDashboard();
    };

    const refreshDashboard = (): void => {
        setRefreshing(true);
        router.reload({
            only: ['stats', 'recentVisits', 'todayPayments', 'pendingVisits'],
            onFinish: () => setRefreshing(false),
        });
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString()}`;
    };

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-BD');
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'paid':
                return 'text-green-600 bg-green-100';
            case 'partial':
                return 'text-yellow-600 bg-yellow-100';
            case 'pending':
                return 'text-red-600 bg-red-100';
            case 'completed':
                return 'text-blue-600 bg-blue-100';
            case 'in_progress':
                return 'text-purple-600 bg-purple-100';
            case 'no_visit':
                return 'text-gray-600 bg-gray-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getOverallStatusDisplay = (status: string): string => {
        switch (status) {
            case 'payment':
                return 'Payment';
            case 'vision_test':
                return 'Vision Test';
            case 'prescription':
                return 'Prescription';
            case 'completed':
                return 'Completed';
            case 'no_visit':
                return 'No Active Visit';
            default:
                return status;
        }
    };

    return (
        <AdminLayout title="Receptionist Dashboard">
            <Head title="Receptionist Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
                            <p className="mt-1 text-gray-600">Patient registration and visit management</p>
                        </div>
                        <button
                            onClick={refreshDashboard}
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors hover:bg-gray-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-100">Today's Visits</p>
                                    <p className="text-3xl font-bold">{stats.today_registrations}</p>
                                    <p className="mt-1 text-xs text-blue-200">Total this month: {stats.month_registrations}</p>
                                </div>
                                <Users className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-green-700 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-100">Today's Revenue</p>
                                    <p className="text-3xl font-bold">{formatCurrency(stats.today_revenue)}</p>
                                    <p className="mt-1 text-xs text-green-200">Monthly: {formatCurrency(stats.month_revenue)}</p>
                                </div>
                                <DollarSign className="h-12 w-12 text-green-200" />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-yellow-100">Pending Payments</p>
                                    <p className="text-3xl font-bold">{stats.pending_payments_count}</p>
                                    <p className="mt-1 text-xs text-yellow-200">Amount: {formatCurrency(stats.pending_payments_amount)}</p>
                                </div>
                                <AlertCircle className="h-12 w-12 text-yellow-200" />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-100">Ready for Vision Test</p>
                                    <p className="text-3xl font-bold">{stats.visits_ready_for_vision_test}</p>
                                    <p className="mt-1 text-xs text-purple-200">In progress: {stats.visits_in_vision_test}</p>
                                </div>
                                <Eye className="h-12 w-12 text-purple-200" />
                            </div>
                        </div>
                    </div>

                    {/* Workflow Stats */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                            <Activity className="h-6 w-6 text-blue-600" />
                            Visit Workflow Status
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                                <DollarSign className="mx-auto mb-2 h-8 w-8 text-red-600" />
                                <p className="text-2xl font-bold text-red-600">{stats.today_pending_payments}</p>
                                <p className="text-sm text-red-700">Payment Pending</p>
                            </div>
                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center">
                                <Eye className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                                <p className="text-2xl font-bold text-purple-600">{stats.visits_ready_for_vision_test}</p>
                                <p className="text-sm text-purple-700">Vision Test Queue</p>
                            </div>
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                                <Stethoscope className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                                <p className="text-2xl font-bold text-blue-600">{stats.visits_ready_for_prescription}</p>
                                <p className="text-sm text-blue-700">Prescription Queue</p>
                            </div>
                            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                                <p className="text-2xl font-bold text-green-600">{stats.visits_in_vision_test}</p>
                                <p className="text-sm text-green-700">In Progress</p>
                            </div>
                        </div>
                    </div>

                    {/* Search & Quick Actions */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Enhanced Patient Search */}
                        <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-2xl">
                            <div className="mb-6 text-center">
                                <div className="mb-4 inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                                    <Search className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-gray-900">Patient Search</h2>
                                <p className="text-gray-600">Search by name, phone, ID, NID or scan QR code</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute top-4 left-4 h-6 w-6 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Type patient name, phone, ID, NID or scan QR..."
                                        className="w-full rounded-2xl border-2 border-blue-300 bg-white py-4 pr-4 pl-12 text-lg shadow-lg transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                                    />
                                    {isSearching && (
                                        <div className="absolute top-4 right-4">
                                            <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3">
                                    <div className="rounded-lg bg-blue-100 p-2">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 12h.01M16 16h.01M12 16h.01"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">QR Code Scanning Enabled</span>
                                </div>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-6 max-h-80 space-y-3 overflow-y-auto">
                                    {searchResults.map((patient) => (
                                        <div
                                            key={patient.patient_id}
                                            className="cursor-pointer rounded-xl border-2 border-blue-200 bg-white p-4 shadow-md transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="text-lg font-bold text-gray-900">{patient.name}</p>
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(patient.payment_status)}`}
                                                        >
                                                            {patient.payment_status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-gray-600">
                                                        {patient.patient_unique_id} • {patient.phone}
                                                    </p>
                                                    {patient.nid_card && <p className="text-sm text-gray-500">NID: {patient.nid_card}</p>}
                                                    <div className="mt-2 flex items-center gap-3">
                                                        {patient.has_active_visit ? (
                                                            <>
                                                                <span
                                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(patient.overall_status || 'pending')}`}
                                                                >
                                                                    {getOverallStatusDisplay(patient.overall_status || 'pending')}
                                                                </span>
                                                                {patient.visit_unique_id && (
                                                                    <span className="text-xs font-medium text-blue-600">
                                                                        Visit: {patient.visit_unique_id}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                                No Active Visit
                                                            </span>
                                                        )}
                                                        {patient.doctor_name && (
                                                            <span className="text-sm font-medium text-indigo-600">Dr. {patient.doctor_name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewPatient(patient.patient_id)}
                                                        className="rounded-xl p-3 text-blue-600 shadow-md transition-colors hover:bg-blue-100 hover:shadow-lg"
                                                        title="View Patient Details"
                                                    >
                                                        <User className="h-5 w-5" />
                                                    </button>
                                                    {patient.has_active_visit && patient.visit_id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleViewVisit(patient.patient_id)}
                                                                className="rounded-xl p-3 text-purple-600 shadow-md transition-colors hover:bg-purple-100 hover:shadow-lg"
                                                                title="View Current Visit"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrintReceipt(patient.patient_id)}
                                                                className="rounded-xl p-3 text-green-600 shadow-md transition-colors hover:bg-green-100 hover:shadow-lg"
                                                                title="Print Receipt"
                                                            >
                                                                <Printer className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleNewVisit(patient)}
                                                            className="rounded-xl p-3 text-green-600 shadow-md transition-colors hover:bg-green-100 hover:shadow-lg"
                                                            title="Start New Visit"
                                                        >
                                                            <Plus className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions & Today's Activity */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
                                <Activity className="h-6 w-6 text-purple-600" />
                                Quick Actions & Today's Activity
                            </h2>

                            <div className="mb-6 space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-blue-600" />
                                        <span className="font-medium text-gray-700">Today's Visits</span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600">{stats.today_registrations}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                        <span className="font-medium text-gray-700">Today's Payments</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{todayPayments.total_count}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                                        <span className="font-medium text-gray-700">Pending Payments</span>
                                    </div>
                                    <span className="text-2xl font-bold text-yellow-600">{stats.today_pending_payments}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.visit(route('patients.create'))}
                                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                                >
                                    <Plus className="h-6 w-6" />
                                    Add New Patient
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Visits & Today's Payments */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Recent Visits */}
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                            <div className="border-b border-gray-200 p-6">
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                    Recent Visits
                                </h2>
                            </div>

                            <div className="p-6">
                                {recentVisits.length > 0 ? (
                                    <div className="max-h-96 space-y-4 overflow-y-auto">
                                        {recentVisits.map((visit) => (
                                            <div
                                                key={visit.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                                            >
                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">{visit.patient_name}</h3>
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(visit.payment_status)}`}
                                                        >
                                                            {visit.payment_status}
                                                        </span>
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(visit.overall_status)}`}
                                                        >
                                                            {getOverallStatusDisplay(visit.overall_status)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {visit.patient_id} • {visit.visit_id} • {visit.phone}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{formatTime(visit.created_at)}</span>
                                                        <span>
                                                            {formatCurrency(visit.total_paid)} / {formatCurrency(visit.final_amount)}
                                                        </span>
                                                        {visit.doctor_name && <span>Dr. {visit.doctor_name}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewVisitDetails(visit.id)}
                                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                        title="View Visit Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintVisitReceipt(visit.id)}
                                                        className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                                                        title="Print Receipt"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Users className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                                        <p className="text-gray-600">No recent visits</p>
                                    </div>
                                )}

                                {/* <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => router.visit(route('visits.index'))}
                                        className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        View All Visits
                                        <FileText className="h-4 w-4" />
                                    </button>
                                </div> */}
                            </div>
                        </div>

                        {/* Today's Payments */}
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                        <CreditCard className="h-6 w-6 text-green-600" />
                                        Today's Payments
                                    </h2>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Total: {formatCurrency(todayPayments.total_amount)}</p>
                                        <p className="text-xs text-gray-500">Count: {todayPayments.total_count}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {todayPayments.payments.length > 0 ? (
                                    <div className="max-h-96 space-y-4 overflow-y-auto">
                                        {todayPayments.payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{payment.patient_name}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {payment.patient_id} • {payment.visit_id} • {payment.payment_method}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">{formatTime(payment.created_at)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                                        <p className="text-gray-600">No payments today</p>
                                    </div>
                                )}

                                {todayPayments.total_count > 0 && (
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="rounded-lg bg-green-50 p-3 text-center">
                                                <p className="font-semibold text-green-600">Average Payment</p>
                                                <p className="text-lg font-bold text-green-700">{formatCurrency(todayPayments.average_payment)}</p>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 p-3 text-center">
                                                <p className="font-semibold text-blue-600">Total Count</p>
                                                <p className="text-lg font-bold text-blue-700">{todayPayments.total_count}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending Visits */}
                    {pendingVisits.length > 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
                            <div className="border-b border-gray-200 p-6">
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                                    Pending Payment Visits
                                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800">
                                        {pendingVisits.length}
                                    </span>
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {pendingVisits.map((visit) => (
                                        <div key={visit.id} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">{visit.patient_name}</h3>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(visit.payment_status)}`}
                                                >
                                                    {visit.payment_status}
                                                </span>
                                            </div>
                                            <p className="mb-2 text-sm text-gray-600">
                                                {visit.patient_id} • {visit.visit_id} • {visit.phone}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-red-600">Due: {formatCurrency(visit.total_due)}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewVisitDetails(visit.id)}
                                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100"
                                                        title="View & Process Payment"
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">Visit Date: {formatDate(visit.created_at)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Action Buttons */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => router.visit(route('patients.create'))}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="h-6 w-6" />
                            New Patient
                        </button>

                        <button
                            onClick={() => router.visit(route('visits.index'))}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Eye className="h-6 w-6" />
                            All Visits
                        </button>

                        <button
                            onClick={() => router.visit(route('visits.ready-for-vision-test'))}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Eye className="h-6 w-6" />
                            Vision Test Queue
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-2xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Printer className="h-6 w-6" />
                            Print Reports
                        </button>
                    </div> */}
                </div>
            </div>

            {/* New Visit Modal */}
            {showNewVisitModal && selectedPatientForVisit && (
                <NewVisitModal isOpen={showNewVisitModal} onClose={handleCloseNewVisitModal} patient={selectedPatientForVisit} doctors={doctors} />
            )}
        </AdminLayout>
    );
};

export default ReceptionistDashboard;
