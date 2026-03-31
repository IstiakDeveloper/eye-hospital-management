// resources/js/Pages/Appointments/Today.tsx
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminLayout from '@/Layouts/admin-layout';
import { formatTime } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    CalendarPlus,
    Check,
    CheckCircle,
    Clock,
    Eye,
    FileText,
    Filter,
    Phone,
    Printer,
    RefreshCw,
    Stethoscope,
    Timer,
    TrendingUp,
    Users,
    X as XIcon,
} from 'lucide-react';
import { useState } from 'react';

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

    const filteredAppointments = appointments.filter((appointment) => {
        const matchesDoctor = selectedDoctor === 'all' || appointment.doctor.id.toString() === selectedDoctor;
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
        return matchesDoctor && matchesStatus;
    });

    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        return a.appointment_time.localeCompare(b.appointment_time);
    });

    const handleStatusChange = (appointmentId: number, newStatus: string) => {
        router.put(
            route('appointments.status', appointmentId),
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
    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
    const pendingAppointments = appointments.filter((a) => a.status === 'pending').length;
    const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled').length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="border-amber-200 bg-amber-50 font-medium text-amber-700">
                        <Timer className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="border-red-200 bg-red-50 font-medium text-red-700">
                        <XIcon className="mr-1 h-3 w-3" />
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
            day: 'numeric',
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
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">Today's Appointments</h1>
                        <p className="flex items-center space-x-2 text-gray-600">
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
                        <Button href={route('appointments.create')} leftIcon={<CalendarPlus className="h-4 w-4" />} size="lg">
                            New Appointment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-blue-600">Total Appointments</p>
                                <p className="text-3xl font-bold text-blue-900">{totalAppointments}</p>
                            </div>
                            <div className="rounded-xl bg-blue-500 p-3">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-amber-600">Pending</p>
                                <p className="text-3xl font-bold text-amber-900">{pendingAppointments}</p>
                            </div>
                            <div className="rounded-xl bg-amber-500 p-3">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-emerald-600">Completed</p>
                                <p className="text-3xl font-bold text-emerald-900">{completedAppointments}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-500 p-3">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-red-600">Cancelled</p>
                                <p className="text-3xl font-bold text-red-900">{cancelledAppointments}</p>
                            </div>
                            <div className="rounded-xl bg-red-500 p-3">
                                <XIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-purple-600">Completion Rate</p>
                                <p className="text-3xl font-bold text-purple-900">{completionRate}%</p>
                            </div>
                            <div className="rounded-xl bg-purple-500 p-3">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <Card className="mb-8 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <span>Filters & Options</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter by:</span>
                        </div>

                        {!userIsDoctor && doctors.length > 0 && (
                            <div className="max-w-xs flex-1">
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                >
                                    <option value="all">All Doctors</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id.toString()}>
                                            Dr. {doctor.user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="max-w-xs flex-1">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
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
            <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span>Appointment Schedule</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                            <p className="rounded-lg border bg-white px-3 py-1 text-sm text-gray-600">
                                Showing <span className="font-semibold">{sortedAppointments.length}</span> of{' '}
                                <span className="font-semibold">{totalAppointments}</span> appointments
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
                                        <TableHead className="py-4 font-bold text-gray-800">
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
                                        <TableRow key={appointment.id} className="group transition-colors duration-200 hover:bg-blue-50">
                                            <TableCell className="py-4 font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                                                        {appointment.serial_number}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Serial #{index + 1}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span className="font-semibold text-gray-900">{formatTime(appointment.appointment_time)}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Link
                                                        href={route('patients.show', appointment.patient.id)}
                                                        className="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-800"
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
                                                    <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
                                                            <Stethoscope className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">Dr. {appointment.doctor?.user.name}</p>
                                                            <p className="text-xs text-gray-500">Physician</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            )}

                                            <TableCell>{getStatusBadge(appointment.status)}</TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('patients.show', appointment.patient.id)}
                                                        className="transition-all duration-300 group-hover:scale-110 hover:bg-blue-100"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {appointment.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            href={route('prescriptions.create.patient', [
                                                                appointment.patient.id,
                                                                { appointment_id: appointment.id },
                                                            ])}
                                                            className="transition-all duration-300 group-hover:scale-110 hover:bg-purple-100"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(appointment.id)}
                                                        className="transition-all duration-300 group-hover:scale-110 hover:bg-gray-100"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>

                                                    {appointment.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-emerald-600 transition-all duration-300 group-hover:scale-110 hover:bg-emerald-100 hover:text-emerald-800"
                                                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-600 transition-all duration-300 group-hover:scale-110 hover:bg-red-100 hover:text-red-800"
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
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                                <Calendar className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-gray-900">No appointments found</h3>
                            <p className="mx-auto mb-6 max-w-md text-gray-500">
                                {statusFilter !== 'all' || selectedDoctor !== 'all'
                                    ? 'No appointments match your current filters for today.'
                                    : 'No appointments are scheduled for today.'}
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
