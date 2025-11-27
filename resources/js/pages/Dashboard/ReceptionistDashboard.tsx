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
  Users,
  Calendar,
  Eye,
  Clock,
  UserPlus,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Phone,
  MapPin,
  User,
  Stethoscope,
  Plus,
  MoreHorizontal,
  CalendarCheck,
  Timer,
  UserCheck
} from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  latest_vision_test: {
    id: number;
    test_date: string;
  } | null;
  vision_tests_count: number;
}

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
  };
  doctor: {
    id: number;
    user: {
      name: string;
    };
    specialization: string | null;
  };
}

interface VisionTest {
  id: number;
  test_date: string;
  right_eye_vision: string | null;
  left_eye_vision: string | null;
  patient: {
    id: number;
    name: string;
    patient_id: string;
  };
  performed_by: {
    name: string;
  } | null;
}

interface ReceptionistDashboardProps {
  userRole: string;
  userName: string;
  recentPatients: Patient[];
  patientsNeedingVisionTest: Patient[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  recentVisionTests: VisionTest[];
  receptionStats: {
    todayRegistrations: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedVisionTests: number;
    waitingPatients: number;
  };
  quickActions: {
    totalPatients: number;
    activeDoctors: number;
  };
  appointmentsByDoctor: Array<{
    doctor_name: string;
    appointments_count: number;
    completed_count: number;
  }>;
}

export default function ReceptionistDashboard({
  userName,
  recentPatients,
  patientsNeedingVisionTest,
  todayAppointments,
  upcomingAppointments,
  recentVisionTests,
  receptionStats,
  quickActions,
  appointmentsByDoctor
}: ReceptionistDashboardProps) {

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

  return (
    <AdminLayout title="Reception Dashboard">
      <Head title="Reception Dashboard" />

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Good morning, {userName}! 👋</h1>
              <p className="text-blue-100">Ready to help patients today? Here's your overview.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                asChild
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Link href={route('patients.create')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Patient
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                 className="bg-white text-blue-600 hover:text-blue-500"
              >
                <Link href={route('appointments.create')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Today's Registrations</p>
                <p className="text-3xl font-bold text-green-700">{receptionStats.todayRegistrations}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Today's Appointments</p>
                <p className="text-3xl font-bold text-blue-700">{receptionStats.todayAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Vision Tests Done</p>
                <p className="text-3xl font-bold text-purple-700">{receptionStats.completedVisionTests}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Pending Appointments</p>
                <p className="text-3xl font-bold text-orange-700">{receptionStats.pendingAppointments}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Waiting Patients</p>
                <p className="text-3xl font-bold text-red-700">{receptionStats.waitingPatients}</p>
              </div>
              <Timer className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarCheck className="h-5 w-5 text-blue-500" />
                <span>Today's Appointments</span>
                <Badge variant="outline">{todayAppointments.length}</Badge>
              </CardTitle>
              <CardDescription>Manage today's patient appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.slice(0, 6).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {appointment.serial_number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patient.name}</h4>
                          <p className="text-sm text-gray-600">ID: {appointment.patient.patient_id}</p>
                          <p className="text-sm text-gray-500">Dr. {appointment.doctor.user.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatTime(appointment.appointment_time)}</p>
                        {getStatusBadge(appointment.status)}
                        <div className="mt-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={route('patients.show', appointment.patient.id)}>
                              View Patient
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </div>
              {todayAppointments.length > 6 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link href={route('appointments.index')}>
                      View All Appointments
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patients Needing Vision Test */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span>Patients Need Vision Test</span>
                <Badge className="bg-amber-100 text-amber-800">{patientsNeedingVisionTest.length}</Badge>
              </CardTitle>
              <CardDescription>Patients who haven't had a recent vision test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patientsNeedingVisionTest.length > 0 ? (
                  patientsNeedingVisionTest.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{patient.name}</h4>
                          <p className="text-sm text-gray-600">ID: {patient.patient_id}</p>
                          {patient.phone && (
                            <p className="text-sm text-gray-500">📞 {patient.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild>
                          <Link href={route('visiontests.create', patient.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Test
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={route('patients.show', patient.id)}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-amber-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
                    <p>All patients have recent vision tests! 🎉</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span>Recent Patients</span>
              </CardTitle>
              <CardDescription>Recently registered patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.slice(0, 8).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.name}</h4>
                        <p className="text-xs text-gray-600">ID: {patient.patient_id}</p>
                        <p className="text-xs text-gray-500">{formatDate(patient.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {patient.latest_vision_test ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Tested
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Need Test
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 text-xs" asChild>
                        <Link href={route('patients.show', patient.id)}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={route('patients.index')}>
                    View All Patients
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Vision Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span>Recent Vision Tests</span>
              </CardTitle>
              <CardDescription>Latest vision test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentVisionTests.slice(0, 5).map((test) => (
                  <div key={test.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{test.patient.name}</h4>
                      <span className="text-xs text-gray-500">{formatDate(test.test_date)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Right Eye: </span>
                        <span className="font-medium">{test.right_eye_vision || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Left Eye: </span>
                        <span className="font-medium">{test.left_eye_vision || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button size="sm" variant="ghost" className="h-6 text-xs" asChild>
                        <Link href={route('visiontests.show', test.id)}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Doctor Performance Today */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-indigo-500" />
                <span>Doctor Performance</span>
              </CardTitle>
              <CardDescription>Today's appointments by doctor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointmentsByDoctor.map((doctor, index) => (
                  <div key={index} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Dr. {doctor.doctor_name}</h4>
                      <Badge className="bg-indigo-100 text-indigo-800">
                        {doctor.appointments_count} patients
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Completed: {doctor.completed_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">Pending: {doctor.appointments_count - doctor.completed_count}</span>
                      </div>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(doctor.completed_count / doctor.appointments_count) * 100}%`
                        }}
                      ></div>
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
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Patients</span>
                  <span className="font-bold text-gray-900">{quickActions.totalPatients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Doctors</span>
                  <span className="font-bold text-gray-900">{quickActions.activeDoctors}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={route('patients.index')}>
                        <Users className="h-4 w-4 mr-1" />
                        Patients
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={route('appointments.index')}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Appointments
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Upcoming Appointments</span>
              <Badge variant="outline">{upcomingAppointments.length}</Badge>
            </CardTitle>
            <CardDescription>Next few days appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
                <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{appointment.patient.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      #{appointment.serial_number}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">ID: {appointment.patient.patient_id}</p>
                  <p className="text-sm text-gray-600 mb-2">Dr. {appointment.doctor.user.name}</p>
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
      )}
    </AdminLayout>
  );
}
