import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Phone, Clock, CheckCircle, Eye, FileText,
    Calendar, Activity, Users, Stethoscope, Timer,
    Search, RefreshCw, ArrowRight, AlertCircle,
    TrendingUp, BarChart3, UserCheck, FileCheck,
    Play, Pause, X, Star
} from 'lucide-react';

// Type definitions
interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee: number;
}

interface Appointment {
    id: number;
    serial_number: string;
    appointment_time: string;
    status: string;
    patient_id: string;
    patient_database_id: number;
    patient_name: string;
    patient_phone: string;
    patient_age?: number;
    patient_gender?: string;
    chief_complaint?: string;
    medical_history?: string;
    has_vision_test: boolean;
    vision_test_date?: string;
    visit_id?: string;
    visit_database_id?: number;
    waiting_time: string;
    is_completed: boolean;
    is_current: boolean;
}

interface TodayStats {
    total_appointments: number;
    completed_appointments: number;
    pending_appointments: number;
    cancelled_appointments: number;
    prescriptions_written: number;
}

interface RecentPrescription {
    id: number;
    patient_name: string;
    patient_id: string;
    created_at: string;
    medicines_count: number;
}

interface Props {
    doctor: Doctor;
    todaysAppointments: Appointment[];
    todayStats: TodayStats;
    recentPrescriptions: RecentPrescription[];
}

const DoctorDashboard: React.FC<Props> = ({
    doctor,
    todaysAppointments,
    todayStats,
    recentPrescriptions
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const refreshDashboard = (): void => {
        setRefreshing(true);
        router.reload({
            only: ['todaysAppointments', 'todayStats', 'recentPrescriptions'],
            onFinish: () => setRefreshing(false)
        });
    };

    const viewPatient = (appointment: Appointment): void => {
        router.visit(route('doctor.view-patient', appointment.patient_database_id));
    };

    const completeAppointment = (appointment: Appointment): void => {
        router.post(route('doctor.complete-appointment', appointment.id), {}, {
            onSuccess: () => {
                refreshDashboard();
            },
            onError: (errors) => {
                console.error('Failed to complete appointment:', errors);
            },
        });
    };

    const updateAppointmentStatus = (appointmentId: number, status: string): void => {
        router.put(route('doctor.update-appointment-status', appointmentId), {
            status: status
        }, {
            onSuccess: () => {
                refreshDashboard();
            },
        });
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    const getSerialColor = (index: number, status: string): string => {
        if (status === 'completed') return 'bg-green-500';
        if (status === 'in_progress') return 'bg-blue-500 animate-pulse';
        if (index === 0) return 'bg-red-500'; // Next patient
        if (index === 1) return 'bg-orange-500'; // Second in line
        return 'bg-gray-500';
    };

    const formatTime = (timeString: string): string => {
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const filteredAppointments = todaysAppointments.filter(appointment =>
        appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.serial_number.includes(searchTerm)
    );

    return (
        <AdminLayout title="Doctor Dashboard">
            <Head title="Doctor Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Welcome, Dr. {doctor.name} • {doctor.specialization}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={refreshDashboard}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Appointments</p>
                                    <p className="text-3xl font-bold">{todayStats.total_appointments}</p>
                                    <p className="text-blue-200 text-xs mt-1">Today's schedule</p>
                                </div>
                                <Calendar className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Completed</p>
                                    <p className="text-3xl font-bold">{todayStats.completed_appointments}</p>
                                    <p className="text-green-200 text-xs mt-1">Patients seen</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-green-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm">Pending</p>
                                    <p className="text-3xl font-bold">{todayStats.pending_appointments}</p>
                                    <p className="text-yellow-200 text-xs mt-1">Waiting patients</p>
                                </div>
                                <Clock className="h-12 w-12 text-yellow-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Prescriptions</p>
                                    <p className="text-3xl font-bold">{todayStats.prescriptions_written}</p>
                                    <p className="text-purple-200 text-xs mt-1">Written today</p>
                                </div>
                                <FileText className="h-12 w-12 text-purple-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-sm">Consultation Fee</p>
                                    <p className="text-3xl font-bold">৳{doctor.consultation_fee}</p>
                                    <p className="text-indigo-200 text-xs mt-1">Per patient</p>
                                </div>
                                <Stethoscope className="h-12 w-12 text-indigo-200" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Today's Appointments Queue */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                        <Users className="h-6 w-6 text-blue-600" />
                                        Today's Patient Queue
                                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                                            {filteredAppointments.length}
                                        </span>
                                    </h2>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, patient ID, or serial..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="p-6">
                                {filteredAppointments.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {filteredAppointments.map((appointment, index) => (
                                            <div
                                                key={appointment.id}
                                                className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${selectedAppointment?.id === appointment.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : appointment.is_completed
                                                            ? 'border-green-200 bg-green-50'
                                                            : appointment.status === 'in_progress'
                                                                ? 'border-blue-300 bg-blue-50'
                                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                onClick={() => setSelectedAppointment(appointment)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {/* Serial Number */}
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${getSerialColor(index, appointment.status)}`}>
                                                                {appointment.serial_number}
                                                            </div>
                                                        </div>

                                                        {/* Patient Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-bold text-gray-900">{appointment.patient_name}</h3>
                                                                <span className="text-lg">{getGenderIcon(appointment.patient_gender)}</span>
                                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                                                                    {appointment.status.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                                {appointment.has_vision_test && (
                                                                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                                                                        ✓ Vision Test Done
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {appointment.patient_id}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {appointment.patient_phone}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatTime(appointment.appointment_time)}
                                                                </span>
                                                                {appointment.patient_age && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Age: {appointment.patient_age}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="text-xs text-gray-500">
                                                                Waiting: {appointment.waiting_time}
                                                            </div>

                                                            {/* Chief Complaint */}
                                                            {appointment.chief_complaint && (
                                                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                                                    <p className="text-xs text-gray-700">
                                                                        <strong>Chief Complaint:</strong> {appointment.chief_complaint}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        {appointment.status === 'pending' && index === 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateAppointmentStatus(appointment.id, 'in_progress');
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Start Consultation"
                                                            >
                                                                <Play className="h-4 w-4" />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                viewPatient(appointment);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View Patient
                                                        </button>

                                                        {appointment.status === 'in_progress' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    completeAppointment(appointment);
                                                                }}
                                                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                                Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Medical History Preview */}
                                                {appointment.medical_history && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Medical History:</strong> {
                                                                appointment.medical_history.length > 100
                                                                    ? appointment.medical_history.substring(0, 100) + '...'
                                                                    : appointment.medical_history
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No appointments found</p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {searchTerm ? 'Try adjusting your search' : 'No patients scheduled for today'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">

                            {/* Current Patient Card */}
                            {selectedAppointment && (
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-blue-600" />
                                        Selected Patient
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl mx-auto mb-2 ${getSerialColor(0, selectedAppointment.status)}`}>
                                                {selectedAppointment.serial_number}
                                            </div>
                                            <h4 className="font-bold text-gray-900">{selectedAppointment.patient_name}</h4>
                                            <p className="text-sm text-gray-600">{selectedAppointment.patient_id}</p>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`font-medium ${getStatusColor(selectedAppointment.status).split(' ')[0]}`}>
                                                    {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Time:</span>
                                                <span className="font-medium">{formatTime(selectedAppointment.appointment_time)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Vision Test:</span>
                                                <span className={`font-medium ${selectedAppointment.has_vision_test ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedAppointment.has_vision_test ? 'Completed' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => viewPatient(selectedAppointment)}
                                                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </button>
                                            {selectedAppointment.status === 'in_progress' && (
                                                <button
                                                    onClick={() => completeAppointment(selectedAppointment)}
                                                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Prescriptions */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <FileCheck className="h-5 w-5 text-green-600" />
                                        Recent Prescriptions
                                    </h3>
                                </div>

                                <div className="p-6">
                                    {recentPrescriptions.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentPrescriptions.map((prescription) => (
                                                <div key={prescription.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-gray-900">{prescription.patient_name}</h4>
                                                        <span className="text-xs text-gray-500">{prescription.created_at}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">{prescription.patient_id}</p>
                                                    <p className="text-xs text-green-600">
                                                        {prescription.medicines_count} medicine(s) prescribed
                                                    </p>
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.visit(route('doctor.search-patients'))}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Search className="h-5 w-5" />
                                        Search Patients
                                    </button>

                                    <button
                                        onClick={() => router.visit(route('doctor.performance-stats'))}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center justify-center gap-2"
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
