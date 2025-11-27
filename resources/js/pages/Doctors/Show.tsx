import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    User as UserIcon,
    Mail,
    Phone,
    Calendar,
    Clock,
    Edit,
    CheckCircle,
    XCircle,
    ArrowLeft
} from 'lucide-react';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
}

interface Patient {
    id: number;
    patient_id: string;
    name: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
}

interface Doctor {
    id: number;
    user: User;
    specialization: string;
    qualification: string | null;
    bio: string | null;
    consultation_fee: string;
    follow_up_fee: string;
    is_available: boolean;
}

interface DoctorShowProps {
    doctor: Doctor;
    todayAppointments?: Appointment[];
    upcomingAppointments?: Appointment[];
    stats?: {
        totalAppointments: number;
        completedAppointments: number;
        todayAppointments: number;
    };
}

export default function DoctorShow({
    doctor,
    todayAppointments = [],
    upcomingAppointments = [],
    stats
}: DoctorShowProps) {
    // Default stats if not provided
    const defaultStats = {
        totalAppointments: 0,
        completedAppointments: 0,
        todayAppointments: 0
    };

    const appointmentStats = stats || defaultStats;

    const toggleAvailability = () => {
        router.put(route('doctors.availability', doctor.id), {
            is_available: !doctor.is_available
        }, {
            onSuccess: () => {
                // Doctor availability updated
            }
        });
    };

    return (
        <AdminLayout title={`Dr. ${doctor.user.name}`}>
            <Head title={`Dr. ${doctor.user.name}`} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.user.name}</h1>
                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        href={route('doctors.index')}
                        variant="outline"
                        icon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Doctors
                    </Button>

                    <Button
                        href={route('doctors.edit', doctor.id)}
                        variant="outline"
                        icon={<Edit className="h-4 w-4" />}
                    >
                        Edit Doctor
                    </Button>

                    <Button
                        onClick={toggleAvailability}
                        variant={doctor.is_available ? "destructive" : "default"}
                        icon={doctor.is_available ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    >
                        {doctor.is_available ? 'Set Unavailable' : 'Set Available'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Doctor Information */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Doctor Information</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="text-gray-900">Dr. {doctor.user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                                    <p className="text-gray-900">{doctor.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                    <p className="text-gray-900">{doctor.user.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="h-5 w-5 flex items-center justify-center text-gray-400 mt-0.5 mr-2">
                                    <span className="text-lg font-semibold">৳</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Consultation Fee</p>
                                    <p className="text-gray-900">{formatCurrency(Number(doctor.consultation_fee))}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="h-5 w-5 flex items-center justify-center text-gray-400 mt-0.5 mr-2">
                                    <span className="text-lg font-semibold">৳</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Follow-up Fee</p>
                                    <p className="text-gray-900">{formatCurrency(Number(doctor.follow_up_fee || 0))}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-start">
                                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Qualification</p>
                                    <p className="text-gray-900">{doctor.qualification || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {doctor.bio && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Biography</p>
                                <p className="text-gray-900 mt-1">{doctor.bio}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-sm ${doctor.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {doctor.is_available ? 'Available for Appointments' : 'Currently Unavailable'}
                            </div>

                            <div className={`px-3 py-1 rounded-full text-sm ${doctor.user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {doctor.user.is_active ? 'Active Account' : 'Inactive Account'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-blue-700 font-medium">Total Appointments</p>
                            <p className="text-3xl font-bold text-blue-900">{appointmentStats.totalAppointments}</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-md">
                            <p className="text-green-700 font-medium">Completed Appointments</p>
                            <p className="text-3xl font-bold text-green-900">{appointmentStats.completedAppointments}</p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-md">
                            <p className="text-purple-700 font-medium">Today's Appointments</p>
                            <p className="text-3xl font-bold text-purple-900">{appointmentStats.todayAppointments}</p>
                        </div>

                        <div className="mt-4">
                            <Button
                                href={route('appointments.create')}
                                className="w-full"
                                icon={<Calendar className="h-4 w-4" />}
                            >
                                Create Appointment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Appointments */}
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                            Today's Appointments
                        </CardTitle>
                        <CardDescription>
                            {todayAppointments?.length || 0} appointments scheduled for today.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {todayAppointments && todayAppointments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Serial No.</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {todayAppointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                                        {formatTime(appointment.appointment_time)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{appointment.serial_number}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <Link
                                                            href={route('patients.show', appointment.patient.id)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {appointment.patient.name}
                                                        </Link>
                                                        <p className="text-xs text-gray-500">
                                                            ID: {appointment.patient.patient_id}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            href={route('appointments.show', appointment.id)}
                                                        >
                                                            View
                                                        </Button>

                                                        {appointment.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                href={route('prescriptions.create.patient', [appointment.patient.id, { appointment_id: appointment.id }])}
                                                            >
                                                                Prescribe
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No appointments scheduled for today.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Appointments */}
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                            Upcoming Appointments
                        </CardTitle>
                        <CardDescription>
                            Next {upcomingAppointments?.length || 0} upcoming appointments.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {upcomingAppointments && upcomingAppointments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Serial No.</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {upcomingAppointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    {formatDate(appointment.appointment_date)}
                                                </TableCell>
                                                <TableCell>{formatTime(appointment.appointment_time)}</TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={route('patients.show', appointment.patient.id)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {appointment.patient.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{appointment.serial_number}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('appointments.show', appointment.id)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                No upcoming appointments.
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Button
                            href={route('appointments.index')}
                            variant="outline"
                            className="w-full"
                        >
                            View All Appointments
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AdminLayout>
    );
}
