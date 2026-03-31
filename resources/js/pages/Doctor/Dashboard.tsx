import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Eye, FileText, PenTool, Phone, RefreshCw, Search, Stethoscope, User, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

const DoctorDashboard: React.FC<Props> = ({ doctor, todaysActiveVisits, todayStats, recentPrescriptions }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [visionDecisionVisit, setVisionDecisionVisit] = useState<ActiveVisit | null>(null);
    const [visionDecisionBusy, setVisionDecisionBusy] = useState(false);

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
            onFinish: () => setRefreshing(false),
        });
    };

    const viewPatient = (visit: ActiveVisit): void => {
        if (visit.payment_status === 'paid' && visit.vision_test_status !== 'completed' && visit.vision_test_status !== 'skipped') {
            setVisionDecisionVisit(visit);
            return;
        }
        router.visit(route('doctor.view-patient', visit.patient_database_id));
    };

    const writePrescription = (visit: ActiveVisit): void => {
        router.visit(route('doctor.view-patient', visit.patient_database_id));
    };

    const skipVisionTest = (visit: ActiveVisit): void => {
        setVisionDecisionBusy(true);
        router.post(
            route('doctor.visits.vision-test.skip', visit.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setVisionDecisionBusy(false);
                    setVisionDecisionVisit(null);
                    refreshDashboard();
                },
                onError: (errors) => {
                    console.error('Failed to skip vision test:', errors);
                },
            },
        );
    };

    const fillVisionTestNow = (visit: ActiveVisit): void => {
        setVisionDecisionVisit(null);
        router.visit(route('doctor.vision-tests.create', visit.patient_database_id));
    };

    const completeVisit = (visit: ActiveVisit): void => {
        router.post(
            route('doctor.complete-visit', visit.id),
            {},
            {
                onSuccess: () => {
                    refreshDashboard();
                },
                onError: (errors) => {
                    console.error('Failed to complete visit:', errors);
                },
            },
        );
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'prescription':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'vision_test':
                return 'text-purple-600 bg-purple-100 border-purple-200';
            case 'payment':
                return 'text-red-600 bg-red-100 border-red-200';
            case 'paid':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'partial':
                return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'pending':
                return 'text-red-600 bg-red-100 border-red-200';
            case 'skipped':
                return 'text-amber-700 bg-amber-100 border-amber-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getSerialColor = (index: number, status: string): string => {
        if (status === 'completed') return 'bg-green-500';
        if (status === 'prescription') return 'bg-blue-500';
        if (index === 0) return 'bg-red-500 animate-pulse'; // Current patient
        if (index === 1) return 'bg-orange-500'; // Next patient
        return 'bg-gray-500';
    };

    const badge = (label: string, status: string) => (
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>{label}</span>
    );

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString()}`;
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

    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case 'payment':
                return 'Payment Pending';
            case 'vision_test':
                return 'Vision Test';
            case 'prescription':
                return 'Ready for Prescription';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    // Filter visits - only show active visits (not completed)
    const filteredVisits = todaysActiveVisits.filter(
        (visit) =>
            (visit.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.visit_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
            visit.overall_status !== 'completed', // Only show active visits
    );

    return (
        <AdminLayout title="Doctor Dashboard">
            <Head title="Doctor Dashboard" />

            <div className="mx-auto max-w-7xl space-y-4">
                {/* Compact header */}
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div className="leading-tight">
                            <div className="text-sm font-semibold text-gray-900">Dr. {doctor.name}</div>
                            <div className="text-xs text-gray-600">
                                {doctor.specialization} • Fee: ৳{doctor.consultation_fee}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">{filteredVisits.length}</span>
                            <span>active</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold">{todayStats.pending_prescriptions}</span>
                            <span>ready</span>
                        </div>
                        <button
                            onClick={refreshDashboard}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name / patient ID / visit ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {badge(`Completed: ${todayStats.completed_visits}`, 'completed')}
                        {badge(`Prescribed: ${todayStats.prescriptions_written}`, 'prescription')}
                    </div>
                </div>

                {/* Queue table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                        <div className="col-span-1">SL</div>
                        <div className="col-span-5">Patient</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-3 text-right">Action</div>
                    </div>
                    {filteredVisits.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredVisits.map((visit, index) => {
                                const canPrescribe =
                                    visit.overall_status === 'prescription' &&
                                    visit.payment_status === 'paid' &&
                                    (visit.vision_test_status === 'completed' || visit.vision_test_status === 'skipped') &&
                                    !visit.has_prescription;
                                const canComplete = visit.overall_status === 'prescription' && visit.has_prescription;

                                return (
                                    <div key={visit.id} className="grid grid-cols-12 gap-2 px-3 py-3 text-sm">
                                        <div className="col-span-1">
                                            <div
                                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${getSerialColor(index, visit.overall_status)}`}
                                            >
                                                {visit.serial_number}
                                            </div>
                                        </div>

                                        <div className="col-span-5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate font-semibold text-gray-900">{visit.patient_name}</div>
                                                <div className="text-base">{getGenderIcon(visit.patient_gender)}</div>
                                            </div>
                                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                    {visit.patient_id}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                    {visit.patient_phone}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    {formatTime(visit.visit_date)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                                                    {visit.visit_id}
                                                </span>
                                            </div>
                                            {visit.chief_complaint && (
                                                <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                                                    <span className="font-semibold text-gray-600">CC:</span> {visit.chief_complaint}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-3 flex flex-col gap-1">
                                            <div className="flex flex-wrap gap-1">
                                                {badge(visit.payment_status.toUpperCase(), visit.payment_status)}
                                                {badge(visit.vision_test_status.toUpperCase(), visit.vision_test_status)}
                                                {badge(getStatusDisplay(visit.overall_status), visit.overall_status)}
                                            </div>
                                            {visit.has_prescription && (
                                                <div className="text-xs font-semibold text-green-700">✓ Prescription written</div>
                                            )}
                                        </div>

                                        <div className="col-span-3 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => viewPatient(visit)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View
                                            </button>
                                            {canPrescribe && (
                                                <button
                                                    onClick={() => writePrescription(visit)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                                >
                                                    <PenTool className="h-4 w-4" />
                                                    Prescribe
                                                </button>
                                            )}
                                            {canComplete && (
                                                <button
                                                    onClick={() => completeVisit(visit)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Done
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-sm text-gray-600">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                <Users className="h-5 w-5 text-gray-500" />
                            </div>
                            {searchTerm ? 'No match found.' : 'No active visits in queue.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Vision decision modal */}
            {visionDecisionVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Vision test not done
                            </h3>
                            <button
                                onClick={() => setVisionDecisionVisit(null)}
                                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                                disabled={visionDecisionBusy}
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm text-gray-800">
                                    Patient <span className="font-semibold">{visionDecisionVisit.patient_name}</span> (Visit:{' '}
                                    <span className="font-medium">{visionDecisionVisit.visit_id}</span>) এখনও vision test করে নাই। আপনি এখন কী করবেন?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => skipVisionTest(visionDecisionVisit)}
                                    disabled={visionDecisionBusy}
                                    className="w-full rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
                                >
                                    Skip vision test (blank)
                                </button>
                                <button
                                    onClick={() => fillVisionTestNow(visionDecisionVisit)}
                                    disabled={visionDecisionBusy}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    Fill vision test (Doctor)
                                </button>
                                <button
                                    onClick={() => setVisionDecisionVisit(null)}
                                    disabled={visionDecisionBusy}
                                    className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default DoctorDashboard;
