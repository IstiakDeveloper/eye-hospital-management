// resources/js/Pages/Appointments/Today.tsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/admin-layout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/Components/ui/table';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/Components/ui/card';
import { formatTime } from '@/lib/utils';
import {
    Calendar,
    Clock,
    User,
    FileText,
    Check,
    X as XIcon,
    Filter,
    RefreshCw,
    Printer,
    Stethoscope,
    Phone,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Timer,
    Users,
    Plus,
    Eye,
    CalendarPlus,
    BarChart3
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
}

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
    };
}

interface Appointment {
    id: number;
    patient: Patient;
    doctor: Doctor;
    appointment_time: string;
    serial_number: string;
    status: 'pending' | 'completed' | 'cancelled';
}

interface AppointmentsTodayProps {
    appointments: Appointment[];
    doctors?: Doctor[];
    userIsDoctor?: boolean;
}

export default function AppointmentsToday({ appointments, doctors = [], userIsDoctor = false }: AppointmentsTodayProps) {
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredAppointments = appointments.filter(appointment => {
        const matchesDoctor = selectedDoctor === 'all' || appointment.doctor.id.toString() === selectedDoctor;
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
        return matchesDoctor && matchesStatus;
    });

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        return a.appointment_time.localeCompare(b.appointment_time);
    });

    const handleStatusChange = (appointmentId: number, newStatus: string) => {
        router.put(route('appointments.status', appointmentId), {
            status: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Status updated successfully
            }
        });
    };

    const refreshAppointments = async () => {
        setIsRefreshing(true);
        try {
            await router.reload();
        } finally {
            setIsRefreshing(false);
        }
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setSelectedDoctor('all');
    };

    // Stats for the day
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
                        <Timer className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-red-50 text-red-700 border-red-200 font-medium">
                        <XIcon className="h-3 w-3 mr-1" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCurrentTime = () => {
        return new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };


    const handleDownload = (appointmentId) => {
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


    return (
        <AdminLayout title="Today's Appointments">
            <Head title="Today's Appointments" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Appointments</h1>
                        <p className="text-gray-600 flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{getCurrentTime()}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                            onClick={refreshAppointments}
                            isLoading={isRefreshing}
                            loadingText="Refreshing..."
                        >
                            Refresh
                        </Button>
                        <Button
                            href={route('appointments.create')}
                            leftIcon={<CalendarPlus className="h-4 w-4" />}
                            size="lg"
                        >
                            New Appointment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 mb-1">Total Appointments</p>
                                <p className="text-3xl font-bold text-blue-900">{totalAppointments}</p>
                            </div>
                            <div className="p-3 bg-blue-500 rounded-xl">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                                <p className="text-3xl font-bold text-amber-900">{pendingAppointments}</p>
                            </div>
                            <div className="p-3 bg-amber-500 rounded-xl">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 mb-1">Completed</p>
                                <p className="text-3xl font-bold text-emerald-900">{completedAppointments}</p>
                            </div>
                            <div className="p-3 bg-emerald-500 rounded-xl">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 mb-1">Cancelled</p>
                                <p className="text-3xl font-bold text-red-900">{cancelledAppointments}</p>
                            </div>
                            <div className="p-3 bg-red-500 rounded-xl">
                                <XIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 mb-1">Completion Rate</p>
                                <p className="text-3xl font-bold text-purple-900">{completionRate}%</p>
                            </div>
                            <div className="p-3 bg-purple-500 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <Card className="mb-8 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <span>Filters & Options</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter by:</span>
                        </div>

                        {!userIsDoctor && doctors.length > 0 && (
                            <div className="flex-1 max-w-xs">
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                >
                                    <option value="all">All Doctors</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id.toString()}>
                                            Dr. {doctor.user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex-1 max-w-xs">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {(statusFilter !== 'all' || selectedDoctor !== 'all') && (
                            <Button variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span>Appointment Schedule</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                            <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                                Showing <span className="font-semibold">{sortedAppointments.length}</span> of <span className="font-semibold">{totalAppointments}</span> appointments
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {sortedAppointments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="font-bold text-gray-800 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Activity className="h-4 w-4" />
                                                <span>Serial No.</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4" />
                                                <span>Time</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">Patient Information</TableHead>
                                        {!userIsDoctor && <TableHead className="font-bold text-gray-800">Doctor</TableHead>}
                                        <TableHead className="font-bold text-gray-800">Status</TableHead>
                                        <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAppointments.map((appointment, index) => (
                                        <TableRow
                                            key={appointment.id}
                                            className="hover:bg-blue-50 transition-colors duration-200 group"
                                        >
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {appointment.serial_number}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Serial #{index + 1}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span className="font-semibold text-gray-900">{formatTime(appointment.appointment_time)}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Link
                                                        href={route('patients.show', appointment.patient.id)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                                                    >
                                                        {appointment.patient.name}
                                                    </Link>
                                                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                                                        <span>ID: {appointment.patient.patient_id}</span>
                                                        <div className="flex items-center space-x-1">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{appointment.patient.phone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {!userIsDoctor && (
                                                <TableCell>
                                                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                                            <Stethoscope className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">Dr. {appointment.doctor?.user.name}</p>
                                                            <p className="text-xs text-gray-500">Physician</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            )}

                                            <TableCell>
                                                {getStatusBadge(appointment.status)}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('patients.show', appointment.patient.id)}
                                                        className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {appointment.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            href={route('prescriptions.create.patient', [appointment.patient.id, { appointment_id: appointment.id }])}
                                                            className="hover:bg-purple-100 transition-all duration-300 group-hover:scale-110"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(appointment.id)}
                                                        className="hover:bg-gray-100 transition-all duration-300 group-hover:scale-110"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>

                                                    {appointment.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 transition-all duration-300 group-hover:scale-110"
                                                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-100 transition-all duration-300 group-hover:scale-110"
                                                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                                            >
                                                                <XIcon className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                {statusFilter !== 'all' || selectedDoctor !== 'all'
                                    ? "No appointments match your current filters for today."
                                    : "No appointments are scheduled for today."
                                }
                            </p>
                            <div className="flex justify-center space-x-3">
                                {(statusFilter !== 'all' || selectedDoctor !== 'all') && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                                <Button href={route('appointments.create')} leftIcon={<CalendarPlus className="h-4 w-4" />}>
                                    Schedule Appointment
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
