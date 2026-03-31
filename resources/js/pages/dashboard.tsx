// resources/js/Pages/Dashboard.tsx
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Calendar, CalendarCheck, Clock, User, Users } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    created_at: string;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization: string;
}

interface Appointment {
    id: number;
    patient: {
        id: number;
        name: string;
        patient_id: string;
    };
    doctor: {
        id: number;
        user: {
            name: string;
        };
    };
    appointment_time: string;
    serial_number: string;
    status: string;
}

interface DashboardProps {
    stats?: {
        patientsCount: number;
        doctorsCount: number;
        appointmentsToday: number;
    };
    todayAppointments: Appointment[];
    recentPatients?: Patient[];
}

export default function Dashboard({ stats, todayAppointments, recentPatients }: DashboardProps) {
    const formatTime = (time: string) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats && (
                    <>
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3">
                                        <Users className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500">Total Patients</dt>
                                            <dd>
                                                <div className="text-lg font-semibold text-gray-900">{stats.patientsCount}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-2">
                                <div className="text-sm">
                                    <a href={route('patients.index')} className="flex items-center font-medium text-indigo-600 hover:text-indigo-500">
                                        View all patients
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-emerald-100 p-3">
                                        <User className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500">Total Doctors</dt>
                                            <dd>
                                                <div className="text-lg font-semibold text-gray-900">{stats.doctorsCount}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-2">
                                <div className="text-sm">
                                    <a
                                        href={route('doctors.index')}
                                        className="flex items-center font-medium text-emerald-600 hover:text-emerald-500"
                                    >
                                        View all doctors
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-amber-100 p-3">
                                        <Calendar className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500">Today's Appointments</dt>
                                            <dd>
                                                <div className="text-lg font-semibold text-gray-900">{stats.appointmentsToday}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-2">
                                <div className="text-sm">
                                    <a
                                        href={route('appointments.today')}
                                        className="flex items-center font-medium text-amber-600 hover:text-amber-500"
                                    >
                                        View today's appointments
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Today's Appointments */}
                <div className="lg:col-span-2">
                    <div className="rounded-lg bg-white shadow">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="flex items-center text-lg font-semibold text-gray-800">
                                <CalendarCheck className="mr-2 h-5 w-5 text-blue-600" />
                                Today's Appointments
                            </h3>
                            <a href={route('appointments.today')} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                                View all
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                            </a>
                        </div>
                        <div className="px-6 py-4">
                            {todayAppointments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Serial
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Patient
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Doctor
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Time
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                                >
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {todayAppointments.slice(0, 5).map((appointment) => (
                                                <tr key={appointment.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">{appointment.serial_number}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{appointment.patient.name}</div>
                                                        <div className="text-xs text-gray-500">{appointment.patient.patient_id}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{appointment.doctor?.user.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Clock className="mr-1 h-4 w-4 text-gray-400" />
                                                            {formatTime(appointment.appointment_time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                                                                appointment.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : appointment.status === 'cancelled'
                                                                      ? 'bg-red-100 text-red-800'
                                                                      : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                        >
                                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-gray-500">No appointments scheduled for today</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Patients */}
                {recentPatients && (
                    <div className="lg:col-span-1">
                        <div className="rounded-lg bg-white shadow">
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <h3 className="flex items-center text-lg font-semibold text-gray-800">
                                    <Users className="mr-2 h-5 w-5 text-indigo-600" />
                                    Recent Patients
                                </h3>
                                <a href={route('patients.index')} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800">
                                    View all
                                    <ArrowUpRight className="ml-1 h-4 w-4" />
                                </a>
                            </div>
                            <div className="px-6 py-4">
                                {recentPatients.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {recentPatients.map((patient) => (
                                            <li key={patient.id} className="py-3">
                                                <a
                                                    href={route('patients.show', patient.id)}
                                                    className="-mx-4 block rounded-md px-4 py-2 transition duration-150 ease-in-out hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center">
                                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                                                            <span className="text-sm font-semibold text-indigo-700">
                                                                {patient.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                                            <div className="flex text-xs text-gray-500">
                                                                <span className="mr-3">{patient.patient_id}</span>
                                                                <span>{patient.phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="py-6 text-center text-gray-500">No recent patients</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
