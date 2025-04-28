// resources/js/Pages/Appointments/Today.tsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/admin-layout';
import { Button } from '@/Components/ui/button';
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
  Printer
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

  const refreshAppointments = () => {
    router.reload();
  };

  // Stats for the day
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <AdminLayout title="Today's Appointments">
      <Head title="Today's Appointments" />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <XIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle>Today's Appointment List</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={refreshAppointments}
            >
              Refresh
            </Button>

            <Button
              href={route('appointments.create')}
              size="sm"
              icon={<Calendar className="h-4 w-4" />}
            >
              New Appointment
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Filter by:</span>
            </div>

            {!userIsDoctor && doctors.length > 0 && (
              <div>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {sortedAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial No.</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    {!userIsDoctor && <TableHead>Doctor</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.serial_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          {formatTime(appointment.appointment_time)}
                        </div>
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
                      {!userIsDoctor && (
                        <TableCell>Dr. {appointment.doctor?.user.name}</TableCell>
                      )}
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
                            href={route('patients.show', appointment.patient.id)}
                            icon={<User className="h-4 w-4" />}
                          >
                            Patient
                          </Button>

                          {appointment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              href={route('prescriptions.create.patient', [appointment.patient.id, {appointment_id: appointment.id}])}
                              icon={<FileText className="h-4 w-4" />}
                            >
                              Prescribe
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('appointments.print', appointment.id)}
                            icon={<Printer className="h-4 w-4" />}
                          >
                            Print
                          </Button>

                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-800"
                                onClick={() => handleStatusChange(appointment.id, 'completed')}
                                icon={<Check className="h-4 w-4" />}
                              >
                                Complete
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                icon={<XIcon className="h-4 w-4" />}
                              >
                                Cancel
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
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
              <p className="text-gray-500 mb-4">There are no appointments scheduled for today with the current filters.</p>
              {statusFilter !== 'all' || selectedDoctor !== 'all' ? (
                <Button
                  onClick={() => {
                    setStatusFilter('all');
                    setSelectedDoctor('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  href={route('appointments.create')}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  Create Appointment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
