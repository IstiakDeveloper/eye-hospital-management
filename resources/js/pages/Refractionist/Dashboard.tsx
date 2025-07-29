import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Eye, Clock, Users, Activity, Play, CheckCircle,
    AlertTriangle, RefreshCw, Timer, User, Phone,
    Stethoscope, Calendar, TrendingUp, BarChart3,
    FileText, IdCard
} from 'lucide-react';

// Type definitions (same as before)
interface Visit {
    id: number;
    visit_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    age?: number;
    gender?: string;
    medical_history?: string;
    chief_complaint?: string;
    doctor_name: string;
    payment_completed_at: string;
    waiting_time: string;
    total_amount: number;
    total_paid: number;
    visit_notes?: string;
}

interface TodayStats {
    total_waiting: number;
    tests_completed_today: number;
    in_progress_tests: number;
    avg_waiting_time: number;
}

interface CompletedTest {
    id: number;
    visit_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    doctor_name: string;
    vision_test_completed_at: string;
    test_duration?: string;
    vision_test_results?: {
        right_eye_sphere?: number;
        left_eye_sphere?: number;
        right_eye_cylinder?: number;
        left_eye_cylinder?: number;
    };
}

interface Props {
    visitsForVisionTest: Visit[];
    todayStats: TodayStats;
    recentCompletedTests: CompletedTest[];
}

const RefractionistDashboard: React.FC<Props> = ({
    visitsForVisionTest,
    todayStats,
    recentCompletedTests
}) => {
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

    // Simple auto-refresh every 30 seconds - শুধু data load করবে
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['visitsForVisionTest', 'todayStats', 'recentCompletedTests'],
                preserveState: true,
                preserveScroll: true,
            });
        }, 10000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const startVisionTest = (visit: Visit): void => {
        router.post(route('refractionist.start-vision-test', visit.id), {}, {
            onSuccess: () => {
                console.log('Vision test started for', visit.patient_name);
            },
            onError: (errors) => {
                console.error('Failed to start vision test:', errors);
            },
        });
    };

    const markAsPriority = (visit: Visit): void => {
        router.post(route('refractionist.mark-priority', visit.id));
    };

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString('en-BD')}`;
    };

    const getGenderIcon = (gender?: string): string => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const getPriorityColor = (index: number): string => {
        if (index === 0) return 'bg-red-500'; // Urgent - First in queue
        if (index === 1) return 'bg-orange-500'; // High priority
        if (index === 2) return 'bg-yellow-500'; // Medium priority
        return 'bg-blue-500'; // Normal
    };

    const getWaitingTimeColor = (waitingTime: string): string => {
        if (waitingTime.includes('hour') || waitingTime.includes('hours')) return 'text-red-600';
        if (waitingTime.includes('30') || waitingTime.includes('40') || waitingTime.includes('50')) return 'text-orange-600';
        return 'text-gray-600';
    };

    return (
        <AdminLayout title="Refractionist Dashboard">
            <Head title="Refractionist Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Vision Test Dashboard</h1>
                            <p className="text-gray-600 mt-1">Manage patient visit vision tests and queue</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Visits Waiting</p>
                                    <p className="text-3xl font-bold">{todayStats.total_waiting}</p>
                                    <p className="text-blue-200 text-xs mt-1">In queue for vision test</p>
                                </div>
                                <Users className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Tests Completed Today</p>
                                    <p className="text-3xl font-bold">{todayStats.tests_completed_today}</p>
                                    <p className="text-green-200 text-xs mt-1">Vision tests done</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-green-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm">Tests In Progress</p>
                                    <p className="text-3xl font-bold">{todayStats.in_progress_tests}</p>
                                    <p className="text-yellow-200 text-xs mt-1">Currently testing</p>
                                </div>
                                <Activity className="h-12 w-12 text-yellow-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Avg. Waiting Time</p>
                                    <p className="text-3xl font-bold">{todayStats.avg_waiting_time}m</p>
                                    <p className="text-purple-200 text-xs mt-1">Minutes average</p>
                                </div>
                                <Timer className="h-12 w-12 text-purple-200" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Visit Queue */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                        <Eye className="h-6 w-6 text-blue-600" />
                                        Vision Test Queue
                                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                                            {visitsForVisionTest.length}
                                        </span>
                                    </h2>
                                </div>
                            </div>

                            <div className="p-6">
                                {visitsForVisionTest.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {visitsForVisionTest.map((visit, index) => (
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
                                                        {/* Queue Position */}
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getPriorityColor(index)}`}>
                                                                {index + 1}
                                                            </div>
                                                        </div>

                                                        {/* Visit & Patient Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-gray-900">{visit.patient_name}</h3>
                                                                <span className="text-lg">{getGenderIcon(visit.gender)}</span>
                                                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                                                    {formatCurrency(visit.total_paid)} Paid
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                                                <span className="flex items-center gap-1">
                                                                    <IdCard className="h-3 w-3" />
                                                                    Visit: {visit.visit_id}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    Patient: {visit.patient_id}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {visit.patient_phone}
                                                                </span>
                                                                {visit.age && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Age: {visit.age}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className={`flex items-center gap-1 ${getWaitingTimeColor(visit.waiting_time)}`}>
                                                                    <Clock className="h-3 w-3" />
                                                                    Waiting: {visit.waiting_time}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Stethoscope className="h-3 w-3" />
                                                                    {visit.doctor_name}
                                                                </span>
                                                            </div>

                                                            {/* Chief Complaint */}
                                                            {visit.chief_complaint && (
                                                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                                                    <p className="text-xs text-gray-700">
                                                                        <strong>Chief Complaint:</strong> {visit.chief_complaint}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        {index > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsPriority(visit);
                                                                }}
                                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Mark as Priority"
                                                            >
                                                                <AlertTriangle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startVisionTest(visit);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                            Start Test
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Medical History */}
                                                {visit.medical_history && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-600">
                                                            <strong>Medical History:</strong> {visit.medical_history}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Visit Notes */}
                                                {visit.visit_notes && (
                                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                                        <p className="text-xs text-blue-700">
                                                            <strong>Visit Notes:</strong> {visit.visit_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No visits waiting for vision test</p>
                                        <p className="text-gray-500 text-sm mt-1">Queue is empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Today's Completed Tests */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                    Today's Completed
                                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full">
                                        {recentCompletedTests.length}
                                    </span>
                                </h2>
                            </div>

                            <div className="p-6">
                                {recentCompletedTests.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {recentCompletedTests.map((test) => (
                                            <div key={test.id} className="p-3 border border-gray-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-gray-900">{test.patient_name}</h3>
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>

                                                <div className="space-y-1 text-sm text-gray-600 mb-2">
                                                    <p>Visit: {test.visit_id}</p>
                                                    <p>Patient: {test.patient_id}</p>
                                                    <p>Phone: {test.patient_phone}</p>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                    <span>Dr. {test.doctor_name}</span>
                                                    <span>{formatTime(test.vision_test_completed_at)}</span>
                                                </div>

                                                {test.test_duration && (
                                                    <p className="text-xs text-green-600 mb-2">
                                                        Duration: {test.test_duration}
                                                    </p>
                                                )}

                                                {/* Vision Test Results Preview */}
                                                {test.vision_test_results && (
                                                    <div className="text-xs bg-white p-2 rounded border">
                                                        <p className="font-medium text-gray-700 mb-1">Quick Results:</p>
                                                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                                                            <span>R: {test.vision_test_results.right_eye_sphere || 'N/A'}</span>
                                                            <span>L: {test.vision_test_results.left_eye_sphere || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">No tests completed today</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selected Visit Details */}
                    {selectedVisit && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Selected Visit Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><strong>Name:</strong> {selectedVisit.patient_name}</p>
                                        <p><strong>Patient ID:</strong> {selectedVisit.patient_id}</p>
                                        <p><strong>Phone:</strong> {selectedVisit.patient_phone}</p>
                                        {selectedVisit.age && <p><strong>Age:</strong> {selectedVisit.age}</p>}
                                        {selectedVisit.gender && <p><strong>Gender:</strong> {selectedVisit.gender}</p>}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Visit Information</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><strong>Visit ID:</strong> {selectedVisit.visit_id}</p>
                                        <p><strong>Doctor:</strong> {selectedVisit.doctor_name}</p>
                                        <p><strong>Total Amount:</strong> {formatCurrency(selectedVisit.total_amount)}</p>
                                        <p><strong>Total Paid:</strong> {formatCurrency(selectedVisit.total_paid)}</p>
                                        <p><strong>Waiting Time:</strong> {selectedVisit.waiting_time}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Medical Information</h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        {selectedVisit.chief_complaint && (
                                            <div>
                                                <strong>Chief Complaint:</strong>
                                                <p className="mt-1 p-2 bg-yellow-50 rounded">{selectedVisit.chief_complaint}</p>
                                            </div>
                                        )}
                                        {selectedVisit.medical_history && (
                                            <div>
                                                <strong>Medical History:</strong>
                                                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedVisit.medical_history}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => startVisionTest(selectedVisit)}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Play className="h-5 w-5" />
                                    Start Vision Test for This Visit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <button
                            onClick={() => router.visit(route('patients.index'))}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <Users className="h-6 w-6" />
                            All Patients
                        </button>

                        <button
                            onClick={() => router.visit(route('refractionist.performance'))}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                            <BarChart3 className="h-6 w-6" />
                            Performance Report
                        </button>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default RefractionistDashboard;
