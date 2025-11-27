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
    CardContent,
    CardDescription
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { formatTime, formatDate } from '@/lib/utils';
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
    Search,
    Eye,
    Edit,
    Trash2,
    CalendarPlus,
    AlertCircle,
    CheckCircle,
    Timer,
    Users
} from 'lucide-react';

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
    specialization?: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    doctor: Doctor;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: 'pending' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
}

interface PageProps {
    appointments: {
        data: Appointment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function AppointmentsIndex({ appointments }: PageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    // Extract unique doctors from appointments
    const doctors = Array.from(
        new Map(
            appointments.data.map(apt => [
                apt.doctor.id,
                apt.doctor
            ])
        ).values()
    );

    const filteredAppointments = appointments.data.filter(appointment => {
        const matchesSearch = searchQuery === '' ||
            appointment.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appointment.patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appointment.patient.phone.includes(searchQuery) ||
            appointment.serial_number.includes(searchQuery);

        const matchesDoctor = selectedDoctor === 'all' || appointment.doctor.id.toString() === selectedDoctor;
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

        let matchesDate = true;
        if (dateFilter === 'today') {
            matchesDate = appointment.appointment_date === new Date().toISOString().split('T')[0];
        } else if (dateFilter === 'upcoming') {
            matchesDate = new Date(appointment.appointment_date) >= new Date();
        } else if (dateFilter === 'past') {
            matchesDate = new Date(appointment.appointment_date) < new Date();
        }

        return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', icon: Timer },
            completed: { label: 'Completed', className: 'bg-green-100 text-green-800 hover:bg-green-200', icon: CheckCircle },
            cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 hover:bg-red-200', icon: XIcon }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge className={config.className}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const handleStatusChange = (appointmentId: number, newStatus: string) => {
        if (confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
            router.put(route('appointments.status', appointmentId), {
                status: newStatus
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    // Status updated successfully
                }
            });
        }
    };

    const handleDelete = (appointmentId: number) => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            router.delete(route('appointments.destroy', appointmentId), {
                preserveScroll: true
            });
        }
    };

    const handlePrint = (appointmentId: number) => {
        window.open(route('appointments.print', appointmentId), '_blank');
    };

    // Statistics
    const stats = {
        total: appointments.data.length,
        pending: appointments.data.filter(a => a.status === 'pending').length,
        completed: appointments.data.filter(a => a.status === 'completed').length,
        cancelled: appointments.data.filter(a => a.status === 'cancelled').length
    };

    return (
        <AdminLayout>
            <Head title="All Appointments" />

            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            All Appointments
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage and track all patient appointments
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={route('appointments.today')}>
                            <Button variant="outline" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Today's Appointments
                            </Button>
                        </Link>
                        <Link href={route('appointments.create')}>
                            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                <CalendarPlus className="h-4 w-4" />
                                New Appointment
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Timer className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                                </div>
                                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <XIcon className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Search
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, ID, phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Doctor Filter */}
                            <select
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>
                                        Dr. {doctor.user.name}
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Date Filter */}
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Appointments List ({filteredAppointments.length})
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.reload()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredAppointments.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No appointments found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or create a new appointment</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Serial</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAppointments.map((appointment) => (
                                            <TableRow key={appointment.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="font-mono text-sm font-semibold text-blue-600">
                                                        #{appointment.serial_number}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {appointment.patient.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {appointment.patient.patient_id}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {appointment.patient.phone}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className="h-4 w-4 text-blue-600" />
                                                        <span className="font-medium">
                                                            Dr. {appointment.doctor.user.name}
                                                        </span>
                                                    </div>
                                                    {appointment.doctor.specialization && (
                                                        <div className="text-sm text-gray-500 ml-6">
                                                            {appointment.doctor.specialization}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-gray-400" />
                                                            <span>{formatDate(appointment.appointment_date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                            <span>{formatTime(appointment.appointment_time)}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(appointment.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('appointments.show', appointment.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        {appointment.status === 'pending' && (
                                                            <>
                                                                <Link href={route('appointments.edit', appointment.id)}>
                                                                    <Button variant="ghost" size="sm" className="gap-1">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                                                >
                                                                    <XIcon className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1"
                                                            onClick={() => handlePrint(appointment.id)}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>

                                                        {appointment.status === 'cancelled' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDelete(appointment.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {appointments.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: appointments.last_page }, (_, i) => i + 1).map(page => (
                            <Link
                                key={page}
                                href={route('appointments.index', { page })}
                                className={`px-4 py-2 rounded-md ${
                                    page === appointments.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
