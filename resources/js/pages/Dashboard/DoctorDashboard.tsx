import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CalendarCheck,
    CheckCircle,
    Clock,
    DownloadCloud,
    FileText,
    Star,
    Stethoscope,
    Timer,
    TrendingUp,
    User,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: 'pending' | 'completed' | 'cancelled';
    patient: {
        id: number;
        name: string;
        patient_id: string;
        phone: string | null;
        date_of_birth: string | null;
        gender: string | null;
    };
}

interface Prescription {
    id: number;
    created_at: string;
    diagnosis: string | null;
    patient: {
        id: number;
        name: string;
        patient_id: string;
    };
    appointment: {
        id: number;
        appointment_date: string;
    } | null;
}

interface FollowUpPatient {
    id: number;
    name: string;
    patient_id: string;
    followup_date: string;
    last_diagnosis: string | null;
}

interface DoctorDashboardProps {
    userRole: string;
    userName: string;
    todayAppointments: Appointment[];
    upcomingAppointments: Appointment[];
    recentAppointments: Appointment[];
    doctorStats: {
        todayPatients: number;
        totalPatients: number;
        completedToday: number;
        pendingToday: number;
        monthlyPatients: number;
        averageConsultationTime: number;
    };
    recentPrescriptions: Prescription[];
    followUpPatients: FollowUpPatient[];
    doctorInfo: {
        specialization: string | null;
        qualification: string | null;
        consultationFee: number;
    };
}

export default function DoctorDashboard({
    userName,
    todayAppointments,
    upcomingAppointments,
    recentAppointments,
    doctorStats,
    recentPrescriptions,
    followUpPatients,
    doctorInfo,
}: DoctorDashboardProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const completionRate = doctorStats.todayPatients > 0 ? Math.round((doctorStats.completedToday / doctorStats.todayPatients) * 100) : 0;

    return (
        <AdminLayout title="Doctor Dashboard">
            <Head title="Doctor Dashboard" />

            {/* Welcome Header */}
            <div className="mb-8">
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="mb-2 text-2xl font-bold">Welcome back, Dr. {userName}! 👨‍⚕️</h1>
                            <p className="text-emerald-100">Ready to see your patients today? Here's your schedule overview.</p>
                            <div className="mt-4 flex items-center space-x-6 text-sm">
                                {doctorInfo.specialization && (
                                    <div className="flex items-center space-x-2">
                                        <Stethoscope className="h-4 w-4" />
                                        <span>{doctorInfo.specialization}</span>
                                    </div>
                                )}
                                {doctorInfo.qualification && (
                                    <div className="flex items-center space-x-2">
                                        <Star className="h-4 w-4" />
                                        <span>{doctorInfo.qualification}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <span>Fee: ৳{doctorInfo.consultationFee}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <Button asChild className="bg-white text-emerald-600 hover:bg-emerald-50">
                                <Link href={route('patients.index')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Patients
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Today's Patients</p>
                                <p className="text-3xl font-bold text-blue-700">{doctorStats.todayPatients}</p>
                                <p className="mt-1 text-xs text-blue-500">
                                    {doctorStats.completedToday} completed, {doctorStats.pendingToday} pending
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Completion Rate</p>
                                <p className="text-3xl font-bold text-green-700">{completionRate}%</p>
                                <p className="mt-1 text-xs text-green-500">Today's progress</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Monthly Patients</p>
                                <p className="text-3xl font-bold text-purple-700">{doctorStats.monthlyPatients}</p>
                                <p className="mt-1 text-xs text-purple-500">This month</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Avg. Consultation</p>
                                <p className="text-3xl font-bold text-orange-700">{doctorStats.averageConsultationTime}m</p>
                                <p className="mt-1 text-xs text-orange-500">Per patient</p>
                            </div>
                            <Timer className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Today's Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CalendarCheck className="h-5 w-5 text-blue-500" />
                                <span>Today's Appointments</span>
                                <Badge variant="outline">{todayAppointments.length}</Badge>
                            </CardTitle>
                            <CardDescription>Your scheduled patients for today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {todayAppointments.length > 0 ? (
                                    todayAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                                                    {appointment.serial_number}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{appointment.patient.name}</h4>
                                                    <p className="text-sm text-gray-600">ID: {appointment.patient.patient_id}</p>
                                                    {appointment.patient.date_of_birth && (
                                                        <p className="text-sm text-gray-500">
                                                            Age: {calculateAge(appointment.patient.date_of_birth)} years
                                                            {appointment.patient.gender && ` • ${appointment.patient.gender}`}
                                                        </p>
                                                    )}
                                                    {appointment.patient.phone && (
                                                        <p className="text-xs text-gray-500">📞 {appointment.patient.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{formatTime(appointment.appointment_time)}</p>
                                                {getStatusBadge(appointment.status)}
                                                <div className="mt-3 flex space-x-2">
                                                    <Button size="sm" asChild>
                                                        <Link href={route('patients.show', appointment.patient.id)}>
                                                            <User className="mr-1 h-4 w-4" />
                                                            View Patient
                                                        </Link>
                                                    </Button>
                                                    {appointment.status === 'pending' && (
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={route('prescriptions.create.patient', appointment.patient.id)}>
                                                                <DownloadCloud className="mr-1 h-4 w-4" />
                                                                Prescribe
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                        <p>No appointments scheduled for today</p>
                                        <p className="mt-2 text-sm">Take a well-deserved break! 😊</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Prescriptions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-purple-500" />
                                <span>Recent Prescriptions</span>
                                <Badge variant="outline">{recentPrescriptions.length}</Badge>
                            </CardTitle>
                            <CardDescription>Your latest prescriptions and diagnoses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentPrescriptions.length > 0 ? (
                                    recentPrescriptions.map((prescription) => (
                                        <div key={prescription.id} className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-900">{prescription.patient.name}</h4>
                                                <span className="text-xs text-gray-500">{formatDate(prescription.created_at)}</span>
                                            </div>
                                            <p className="mb-1 text-sm text-gray-600">ID: {prescription.patient.patient_id}</p>
                                            {prescription.diagnosis && (
                                                <p className="rounded border bg-white p-2 text-sm text-gray-800">
                                                    <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                                                </p>
                                            )}
                                            <div className="mt-3 flex space-x-2">
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={route('prescriptions.show', prescription.id)}>View Prescription</Link>
                                                </Button>
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={route('patients.show', prescription.patient.id)}>View Patient</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-gray-500">
                                        <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                        <p>No recent prescriptions</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-8">
                    {/* Follow-up Patients */}
                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span>Follow-up Due</span>
                                <Badge className="bg-amber-100 text-amber-800">{followUpPatients.length}</Badge>
                            </CardTitle>
                            <CardDescription>Patients requiring follow-up visits</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {followUpPatients.length > 0 ? (
                                    followUpPatients.slice(0, 5).map((patient) => (
                                        <div key={patient.id} className="rounded-lg border border-amber-200 bg-white p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="font-medium text-gray-900">{patient.name}</h4>
                                                <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                                    Due: {formatDate(patient.followup_date)}
                                                </span>
                                            </div>
                                            <p className="mb-1 text-sm text-gray-600">ID: {patient.patient_id}</p>
                                            {patient.last_diagnosis && <p className="mb-2 text-xs text-gray-500">Last: {patient.last_diagnosis}</p>}
                                            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600" asChild>
                                                <Link href={route('appointments.create.patient', patient.id)}>
                                                    <UserCheck className="mr-1 h-4 w-4" />
                                                    Schedule Follow-up
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-amber-600">
                                        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-amber-400" />
                                        <p>All patients up to date! 🎉</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-indigo-500" />
                                <span>Upcoming Appointments</span>
                            </CardTitle>
                            <CardDescription>Next few days schedule</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingAppointments.slice(0, 6).map((appointment) => (
                                    <div key={appointment.id} className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                                        <div className="mb-1 flex items-center justify-between">
                                            <h4 className="font-medium text-gray-900">{appointment.patient.name}</h4>
                                            <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800">
                                                #{appointment.serial_number}
                                            </span>
                                        </div>
                                        <p className="mb-1 text-sm text-gray-600">ID: {appointment.patient.patient_id}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-500">
                                                <p>{formatDate(appointment.appointment_date)}</p>
                                                <p>{formatTime(appointment.appointment_time)}</p>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={route('patients.show', appointment.patient.id)}>View</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 text-gray-600" />
                                <span>Quick Actions</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Dynamic prescription link - will need a patient selection */}
                                <Button className="w-full justify-start" disabled>
                                    <FileText className="mr-2 h-4 w-4" />
                                    New Prescription
                                    <span className="ml-auto text-xs text-gray-500">(Select Patient)</span>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('patients.index')}>
                                        <Users className="mr-2 h-4 w-4" />
                                        View All Patients
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('appointments.index')}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Manage Appointments
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('appointments.today')}>
                                        <CalendarCheck className="mr-2 h-4 w-4" />
                                        Today's Schedule
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
