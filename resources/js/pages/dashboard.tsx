// resources/js/Pages/Dashboard.tsx
import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import {
  Users,
  User,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  CalendarCheck
} from 'lucide-react';

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
      hour12: true
    });
  };

  return (
    <AdminLayout title="Dashboard">
      <Head title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900">{stats.patientsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-2">
                <div className="text-sm">
                  <a href={route('patients.index')} className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                    View all patients
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md bg-emerald-100 p-3">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Doctors</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900">{stats.doctorsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-2">
                <div className="text-sm">
                  <a href={route('doctors.index')} className="font-medium text-emerald-600 hover:text-emerald-500 flex items-center">
                    View all doctors
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md bg-amber-100 p-3">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                      <dd>
                        <div className="text-lg font-semibold text-gray-900">{stats.appointmentsToday}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-2">
                <div className="text-sm">
                  <a href={route('appointments.today')} className="font-medium text-amber-600 hover:text-amber-500 flex items-center">
                    View today's appointments
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CalendarCheck className="h-5 w-5 mr-2 text-blue-600" />
                Today's Appointments
              </h3>
              <a href={route('appointments.today')} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
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
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Serial
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {todayAppointments.slice(0, 5).map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {appointment.serial_number}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{appointment.patient.name}</div>
                            <div className="text-xs text-gray-500">{appointment.patient.patient_id}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.doctor?.user.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              {formatTime(appointment.appointment_time)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No appointments scheduled for today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        {recentPatients && (
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Recent Patients
                </h3>
                <a href={route('patients.index')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
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
                          className="block hover:bg-gray-50 -mx-4 px-4 py-2 rounded-md transition duration-150 ease-in-out"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-700 font-semibold text-sm">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                              <div className="text-xs text-gray-500 flex">
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
                  <div className="text-center py-6 text-gray-500">
                    No recent patients
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
