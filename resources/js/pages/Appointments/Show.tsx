import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '@/Layouts/admin-layout';
import { formatTime } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Badge,
    Calendar,
    Check,
    Clock,
    Edit,
    Eye,
    FileText,
    Mail,
    Phone,
    Printer,
    Settings,
    Stethoscope,
    User,
    UserCheck,
    X as XIcon,
} from 'lucide-react';

// Date formatting function
const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (error) {
        return dateString;
    }
};

// Short date format
const formatDateShort = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (error) {
        return dateString;
    }
};

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
}

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        id: number;
        name: string;
    };
}

interface Appointment {
    id: number;
    patient: Patient;
    doctor: Doctor;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    created_by?: number;
}

interface AppointmentShowProps {
    appointment: Appointment;
    auth: {
        user: User;
    };
}

export default function AppointmentShow({ appointment, auth }: AppointmentShowProps) {
    // Role checking functions
    const hasRole = (roleName: string) => {
        return auth.user?.role?.name?.toLowerCase() === roleName.toLowerCase();
    };

    const isDoctor = () => hasRole('Doctor');
    const isSuperAdmin = () => hasRole('Super Admin');
    const isReceptionist = () => hasRole('Receptionist');

    // Permission checking
    const canCreatePrescription = () => isDoctor() || isSuperAdmin();
    const canEditAppointment = () => isSuperAdmin() || isReceptionist();
    const canChangeStatus = () => isDoctor() || isSuperAdmin() || isReceptionist();

    const handleStatusChange = (newStatus: string) => {
        if (!canChangeStatus()) return;

        router.put(
            route('appointments.status', appointment.id),
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Status updated successfully
                },
            },
        );
    };

    const handleApntDownload = (appointmentId) => {
        // Create download link
        const downloadUrl = route('appointments.print', appointmentId);

        // Create temporary anchor element for download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `appointment-slip-${appointmentId}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <Check className="h-4 w-4" />;
            case 'cancelled':
                return <XIcon className="h-4 w-4" />;
            case 'pending':
                return <Clock className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <AdminLayout title="Appointment Details">
            <Head title={`Appointment #${appointment.serial_number}`} />

            {/* Header Section */}
            <div className="mb-8">
                <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Appointment #{appointment.serial_number}</h1>
                                <p className="text-gray-600">
                                    {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className={`flex items-center space-x-2 rounded-lg border px-4 py-2 ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                <span className="font-semibold">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Patient Information */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardTitle className="flex items-center space-x-3 text-green-800">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <span>Patient Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-500">Patient Name</label>
                                        <Link
                                            href={route('patients.show', appointment.patient.id)}
                                            className="flex items-center space-x-2 text-lg font-semibold text-blue-600 transition-colors hover:text-blue-800"
                                        >
                                            <UserCheck className="h-5 w-5" />
                                            <span>{appointment.patient.name}</span>
                                        </Link>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-500">Patient ID</label>
                                        <div className="flex items-center space-x-2">
                                            <Badge className="h-4 w-4 text-gray-600" />
                                            <span className="font-semibold text-gray-900">{appointment.patient.patient_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-500">Phone Number</label>
                                        <div className="flex items-center space-x-2">
                                            <Phone className="h-4 w-4 text-gray-600" />
                                            <span className="font-semibold text-gray-900">{appointment.patient.phone}</span>
                                        </div>
                                    </div>
                                    {appointment.patient.email && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-500">Email Address</label>
                                            <div className="flex items-center space-x-2">
                                                <Mail className="h-4 w-4 text-gray-600" />
                                                <span className="font-semibold text-gray-900">{appointment.patient.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Information */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
                            <CardTitle className="flex items-center space-x-3 text-purple-800">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500">
                                    <Stethoscope className="h-5 w-5 text-white" />
                                </div>
                                <span>Doctor Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-500">Assigned Doctor</label>
                                <div className="flex items-center space-x-2">
                                    <UserCheck className="h-5 w-5 text-gray-600" />
                                    <span className="text-lg font-semibold text-gray-900">Dr. {appointment.doctor.user.name}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointment Details */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                            <CardTitle className="flex items-center space-x-3 text-blue-800">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <span>Appointment Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-6 md:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-500">Date</label>
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-5 w-5 text-gray-600" />
                                        <span className="font-semibold text-gray-900">{formatDate(appointment.appointment_date)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-500">Time</label>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5 text-gray-600" />
                                        <span className="font-semibold text-gray-900">{formatTime(appointment.appointment_time)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-500">Serial Number</label>
                                    <div className="flex items-center space-x-2">
                                        <Badge className="h-5 w-5 text-gray-600" />
                                        <span className="font-semibold text-gray-900">{appointment.serial_number}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                            <CardTitle className="flex items-center space-x-3">
                                <Settings className="h-5 w-5 text-gray-600" />
                                <span>Quick Actions</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {/* Print Slip - Available to all */}
                                <Button onClick={() => handleApntDownload(appointment.id)} variant="outline" className="w-full justify-start">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Appointment Slip
                                </Button>

                                {/* Edit Appointment - Super Admin & Receptionist */}
                                {canEditAppointment() && (
                                    <Button href={route('appointments.edit', appointment.id)} variant="outline" className="w-full justify-start">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Appointment
                                    </Button>
                                )}

                                {/* Vision Test - Receptionist & Super Admin */}
                                {(isReceptionist() || isSuperAdmin()) && (
                                    <Button
                                        href={route('visiontests.create', appointment.patient.id)}
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Record Vision Test
                                    </Button>
                                )}

                                {/* Create Prescription - Only Doctor & Super Admin */}
                                {canCreatePrescription() && appointment.status === 'pending' && (
                                    <Button
                                        href={route('prescriptions.create.patient', [appointment.patient.id, { appointment_id: appointment.id }])}
                                        className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Create Prescription
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Management */}
                    {appointment.status === 'pending' && canChangeStatus() && (
                        <Card className="shadow-lg">
                            <CardHeader className="border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                                <CardTitle className="flex items-center space-x-3 text-orange-800">
                                    <Activity className="h-5 w-5" />
                                    <span>Status Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => handleStatusChange('completed')}
                                        className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark as Completed
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusChange('cancelled')}
                                        variant="outline"
                                        className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <XIcon className="mr-2 h-4 w-4" />
                                        Cancel Appointment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* User Role Info (for debugging - remove in production) */}
                    {isSuperAdmin() && (
                        <Card className="border-amber-200 shadow-lg">
                            <CardHeader className="border-b border-amber-200 bg-amber-50">
                                <CardTitle className="text-sm text-amber-800">Your Role</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <span className="inline-block rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                    {auth.user?.role?.name || 'No Role'}
                                </span>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
