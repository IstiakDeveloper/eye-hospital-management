import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/admin-layout';
import { Button } from '@/Components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/Components/ui/card';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Check,
  X as XIcon,
  Edit,
  Printer
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

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
  userIsDoctor?: boolean;
}

export default function AppointmentShow({
  appointment,
  userIsDoctor = false
}: AppointmentShowProps) {
  const handleStatusChange = (newStatus: string) => {
    router.put(route('appointments.status', appointment.id), {
      status: newStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        // Status updated successfully
      }
    });
  };

  return (
    <AdminLayout title="Appointment Details">
      <Head title={`Appointment #${appointment.serial_number}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Appointment Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>Appointment #{appointment.serial_number}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  href={route('appointments.print', appointment.id)}
                  size="sm"
                  variant="outline"
                  icon={<Printer className="h-4 w-4" />}
                >
                  Print Slip
                </Button>
                <Button
                  href={route('appointments.edit', appointment.id)}
                  size="sm"
                  variant="outline"
                  icon={<Edit className="h-4 w-4" />}
                >
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="font-semibold">{appointment.appointment_date}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="font-semibold">{formatTime(appointment.appointment_time)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <Link
                  href={route('patients.show', appointment.patient.id)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {appointment.patient.name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Patient ID</p>
                <p className="font-semibold">{appointment.patient.patient_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="font-semibold">{appointment.patient.phone}</p>
              </div>
              {appointment.patient.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold">{appointment.patient.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctor Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Doctor Name</p>
                <p className="font-semibold">Dr. {appointment.doctor.user.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        {appointment.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button
                  fullWidth
                  variant="outline"
                  className="text-green-600 hover:text-green-800"
                  onClick={() => handleStatusChange('completed')}
                  icon={<Check className="h-4 w-4" />}
                >
                  Mark as Completed
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleStatusChange('cancelled')}
                  icon={<XIcon className="h-4 w-4" />}
                >
                  Cancel Appointment
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  href={route('prescriptions.create.patient', [appointment.patient.id, {appointment_id: appointment.id}])}
                  icon={<FileText className="h-4 w-4" />}
                >
                  Create Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
