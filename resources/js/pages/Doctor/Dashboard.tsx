import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Phone, Clock, CheckCircle, Eye, FileText,
    Calendar, Activity, Users, Stethoscope, Timer,
    Search, RefreshCw, ArrowRight, AlertCircle,
    TrendingUp, BarChart3, UserCheck, FileCheck,
    Play, Pause, X, Star, PenTool
} from 'lucide-react';

// Type definitions
interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee: number;
}

interface ActiveVisit {
    id: number;
    visit_id: string;
    patient_database_id: number;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_age?: number;
    patient_gender?: string;
    chief_complaint?: string;
    medical_history?: string;
    visit_date: string;
    overall_status: string;
    payment_status: string;
    vision_test_status: string;
    has_vision_test: boolean;
    has_prescription: boolean;
    waiting_time: string;
    serial_number: number;
    final_amount: number;
    total_paid: number;
    total_due: number;
}

interface TodayStats {
    total_visits: number;
    completed_visits: number;
    pending_prescriptions: number;
    prescriptions_written: number;
    total_revenue: number;
}

interface RecentPrescription {
    id: number;
    patient_name: string;
    patient_id: string;
    visit_id: string;
    created_at: string;
    medicines_count: number;
}

interface Props {
    doctor: Doctor;
    todaysActiveVisits: ActiveVisit[];
    todayStats: TodayStats;
    recentPrescriptions: RecentPrescription[];
}

const DoctorDashboard: React.FC<Props> = ({
    doctor,
    todaysActiveVisits,
    todayStats,
    recentPrescriptions
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<ActiveVisit | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // এইখানে add করুন ⬇️
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['todaysActiveVisits', 'todayStats', 'recentPrescriptions'],
                preserveState: true,
                preserveScroll: true,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const refreshDashboard = (): void => {
        setRefreshing(true);
        router.reload({
            only: ['todaysActiveVisits', 'todayStats', 'recentPrescriptions'],
            onFinish: () => setRefreshing(false)
        });
    };

    const viewPatient = (visit: ActiveVisit): void => {
        router.visit(route('doctor.view-patient', visit.patient_database_id));
    };

    const writePrescription = (visit: ActiveVisit): void => {
        router.visit(route('doctor.view-patient', visit.patient_database_id));
    };

    const completeVisit = (visit: ActiveVisit): void => {
        router.post(route('doctor.complete-visit', visit.id), {}, {
            onSuccess: () => {
                refreshDashboard();
            },
            onError: (errors) => {
                console.error('Failed to complete visit:', errors);
            },
        });
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100 border-green-200';
            case 'prescription': return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'vision_test': return 'text-purple-600 bg-purple-100 border-purple-200';
            case 'payment': return 'text-red-600 bg-red-100 border-red-200';
            case 'paid': return 'text-green-600 bg-green-100 border-green-200';
            case 'partial': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'pending': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getSerialColor = (index: number, status: string): string => {
        if (status === 'completed') return 'bg-green-500';
        if (status === 'prescription') return 'bg-blue-500';
        if (index === 0) return 'bg-red-500 animate-pulse'; // Current patient
        if (index === 1) return 'bg-orange-500'; // Next patient
        return 'bg-gray-500';
    };

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString()}`;
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case 'payment': return 'Payment Pending';
            case 'vision_test': return 'Vision Test';
            case 'prescription': return 'Ready for Prescription';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    // Filter visits - only show active visits (not completed)
    const filteredVisits = todaysActiveVisits.filter(visit =>
        (visit.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.visit_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
        visit.overall_status !== 'completed' // Only show active visits
    );

    return (
        <AdminLayout title="Doctor Dashboard">
            <Head title="Doctor Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                                    <Stethoscope className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.name}</h1>
                                    <p className="text-gray-600">{doctor.specialization} • Fee: ৳{doctor.consultation_fee}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Today</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {new Date().toLocaleDateString('en-BD', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={refreshDashboard}
                                    disabled={refreshing}
                                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Active Visits</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredVisits.length}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Completed Today</p>
                                    <p className="text-2xl font-bold text-gray-900">{todayStats.completed_visits}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Ready for Prescription</p>
                                    <p className="text-2xl font-bold text-gray-900">{todayStats.pending_prescriptions}</p>
                                </div>
                                <PenTool className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Prescriptions Written</p>
                                    <p className="text-2xl font-bold text-gray-900">{todayStats.prescriptions_written}</p>
                                </div>
                                <FileText className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Today's Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayStats.total_revenue)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Active Visits Queue */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Active Patient Queue</h2>
                                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {filteredVisits.length} Active
                                    </span>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patient, visit ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="p-6">
                                {filteredVisits.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {filteredVisits.map((visit, index) => (
                                            <div
                                                key={visit.id}
                                                className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${selectedVisit?.id === visit.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                onClick={() => setSelectedVisit(visit)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {/* Serial Number */}
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${getSerialColor(index, visit.overall_status)}`}>
                                                                {visit.serial_number}
                                                            </div>
                                                        </div>

                                                        {/* Patient Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-bold text-gray-900">{visit.patient_name}</h3>
                                                                <span className="text-xl">{getGenderIcon(visit.patient_gender)}</span>
                                                                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusColor(visit.overall_status)}`}>
                                                                    {getStatusDisplay(visit.overall_status)}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    <span>{visit.patient_id}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="h-4 w-4" />
                                                                    <span>{visit.patient_phone}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>{formatTime(visit.visit_date)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <FileText className="h-4 w-4" />
                                                                    <span>{visit.visit_id}</span>
                                                                </div>
                                                            </div>

                                                            {/* Payment Status */}
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(visit.payment_status)}`}>
                                                                    Payment: {visit.payment_status.toUpperCase()}
                                                                </span>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(visit.vision_test_status)}`}>
                                                                    Vision: {visit.vision_test_status.toUpperCase()}
                                                                </span>
                                                                {visit.has_prescription && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
                                                                        ✓ Prescription Written
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Chief Complaint */}
                                                            {visit.chief_complaint && (
                                                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                    <p className="text-sm text-gray-700">
                                                                        <span className="font-medium text-yellow-800">Chief Complaint:</span> {visit.chief_complaint}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="mt-2 text-xs text-gray-500">
                                                                Waiting: {visit.waiting_time}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                viewPatient(visit);
                                                            }}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </button>

                                                        {/* Write Prescription Button */}
                                                        {visit.overall_status === 'prescription' &&
                                                            visit.payment_status === 'paid' &&
                                                            visit.vision_test_status === 'completed' &&
                                                            !visit.has_prescription && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        writePrescription(visit);
                                                                    }}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <PenTool className="h-4 w-4" />
                                                                    Prescribe
                                                                </button>
                                                            )}

                                                        {/* Complete Visit Button */}
                                                        {visit.overall_status === 'prescription' &&
                                                            visit.has_prescription && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        completeVisit(visit);
                                                                    }}
                                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Complete
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg">No active visits</p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {searchTerm ? 'Try adjusting your search' : 'No patients in queue for prescription'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Selected Visit Card */}
                            {selectedVisit && (
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-blue-600" />
                                        Current Patient
                                    </h3>

                                    <div className="text-center mb-4">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-3 ${getSerialColor(0, selectedVisit.overall_status)}`}>
                                            {selectedVisit.serial_number}
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900">{selectedVisit.patient_name}</h4>
                                        <p className="text-sm text-gray-600">{selectedVisit.patient_id}</p>
                                        <p className="text-xs text-gray-500 mt-1">Visit: {selectedVisit.visit_id}</p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedVisit.overall_status)}`}>
                                                {getStatusDisplay(selectedVisit.overall_status)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Payment:</span>
                                            <span className={`text-xs font-medium ${selectedVisit.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                {selectedVisit.payment_status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Vision Test:</span>
                                            <span className={`text-xs font-medium ${selectedVisit.vision_test_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {selectedVisit.vision_test_status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Amount:</span>
                                            <span className="font-medium">{formatCurrency(selectedVisit.final_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => viewPatient(selectedVisit)}
                                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View
                                        </button>
                                        {selectedVisit.overall_status === 'prescription' && !selectedVisit.has_prescription && (
                                            <button
                                                onClick={() => writePrescription(selectedVisit)}
                                                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <PenTool className="h-4 w-4" />
                                                Prescribe
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recent Prescriptions */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-green-600" />
                                        Recent Prescriptions
                                    </h3>
                                </div>

                                <div className="p-6">
                                    {recentPrescriptions.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentPrescriptions.map((prescription) => (
                                                <div key={prescription.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-gray-900">{prescription.patient_name}</h4>
                                                        <span className="text-xs text-gray-500">{prescription.created_at}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-gray-600">{prescription.visit_id}</p>
                                                        <p className="text-xs text-green-600 font-medium">
                                                            {prescription.medicines_count} medicines
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600">No recent prescriptions</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.visit(route('doctor.search-patients'))}
                                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Search className="h-5 w-5" />
                                        Search Patients
                                    </button>
                                    <button
                                        onClick={() => router.visit(route('doctor.performance'))}
                                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BarChart3 className="h-5 w-5" />
                                        Performance Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DoctorDashboard;
