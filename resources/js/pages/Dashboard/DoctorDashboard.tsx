import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Stethoscope,
    Calendar,
    Users,
    Clock,
    CheckCircle,
    FileText,
    Activity,
    TrendingUp,
    User,
    Phone,
    Eye,
    AlertTriangle,
    Star,
    Timer,
    BarChart3,
    CalendarCheck,
    UserCheck,
    Zap,
    DownloadCloud,
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
    doctorInfo
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
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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

    const completionRate = doctorStats.todayPatients > 0
        ? Math.round((doctorStats.completedToday / doctorStats.todayPatients) * 100)
        : 0;

    return (
        <AdminLayout title="Doctor Dashboard">
            <Head title="Doctor Dashboard" />

            {/* Welcome Header */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">Welcome back, Dr. {userName}! 👨‍⚕️</h1>
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
                            <Button
                                asChild
                                className="bg-white text-emerald-600 hover:bg-emerald-50"
                            >
                                <Link href={route('patients.index')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Patients
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Today's Patients</p>
                                <p className="text-3xl font-bold text-blue-700">{doctorStats.todayPatients}</p>
                                <p className="text-xs text-blue-500 mt-1">
                                    {doctorStats.completedToday} completed, {doctorStats.pendingToday} pending
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Completion Rate</p>
                                <p className="text-3xl font-bold text-green-700">{completionRate}%</p>
                                <p className="text-xs text-green-500 mt-1">Today's progress</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Monthly Patients</p>
                                <p className="text-3xl font-bold text-purple-700">{doctorStats.monthlyPatients}</p>
                                <p className="text-xs text-purple-500 mt-1">This month</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">Avg. Consultation</p>
                                <p className="text-3xl font-bold text-orange-700">{doctorStats.averageConsultationTime}m</p>
                                <p className="text-xs text-orange-500 mt-1">Per patient</p>
                            </div>
                            <Timer className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-8">
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
                                        <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
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
                                                <p className="font-bold text-lg text-gray-900">{formatTime(appointment.appointment_time)}</p>
                                                {getStatusBadge(appointment.status)}
                                                <div className="mt-3 flex space-x-2">
                                                    <Button size="sm" asChild>
                                                        <Link href={route('patients.show', appointment.patient.id)}>
                                                            <User className="h-4 w-4 mr-1" />
                                                            View Patient
                                                        </Link>
                                                    </Button>
                                                    {appointment.status === 'pending' && (
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={route('prescriptions.create.patient', appointment.patient.id)}>
                                                                <DownloadCloud className="h-4 w-4 mr-1" />
                                                                Prescribe
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p>No appointments scheduled for today</p>
                                        <p className="text-sm mt-2">Take a well-deserved break! 😊</p>
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
                                        <div key={prescription.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">{prescription.patient.name}</h4>
                                                <span className="text-xs text-gray-500">{formatDate(prescription.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">ID: {prescription.patient.patient_id}</p>
                                            {prescription.diagnosis && (
                                                <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                                                    <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                                                </p>
                                            )}
                                            <div className="mt-3 flex space-x-2">
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={route('prescriptions.show', prescription.id)}>
                                                        View Prescription
                                                    </Link>
                                                </Button>
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={route('patients.show', prescription.patient.id)}>
                                                        View Patient
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                                        <div key={patient.id} className="p-3 bg-white rounded-lg border border-amber-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-900">{patient.name}</h4>
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                                    Due: {formatDate(patient.followup_date)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">ID: {patient.patient_id}</p>
                                            {patient.last_diagnosis && (
                                                <p className="text-xs text-gray-500 mb-2">
                                                    Last: {patient.last_diagnosis}
                                                </p>
                                            )}
                                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 w-full" asChild>
                                                <Link href={route('appointments.create.patient', patient.id)}>
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Schedule Follow-up
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-amber-600">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
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
                                    <div key={appointment.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-medium text-gray-900">{appointment.patient.name}</h4>
                                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                                #{appointment.serial_number}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">ID: {appointment.patient.patient_id}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-500">
                                                <p>{formatDate(appointment.appointment_date)}</p>
                                                <p>{formatTime(appointment.appointment_time)}</p>
                                            </div>
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={route('patients.show', appointment.patient.id)}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
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
                                    <FileText className="h-4 w-4 mr-2" />
                                    New Prescription
                                    <span className="ml-auto text-xs text-gray-500">(Select Patient)</span>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('patients.index')}>
                                        <Users className="h-4 w-4 mr-2" />
                                        View All Patients
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('appointments.index')}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Manage Appointments
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full justify-start" asChild>
                                    <Link href={route('appointments.today')}>
                                        <CalendarCheck className="h-4 w-4 mr-2" />
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
