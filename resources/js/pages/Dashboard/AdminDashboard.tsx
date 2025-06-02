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
  DollarSign,
  TrendingUp,
  Eye,
  FileText,
  Stethoscope,
  UserPlus,
  CalendarPlus,
  BarChart3,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crown,
  Settings,
  Database,
  Shield,
  Zap
} from 'lucide-react';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  monthlyPatients: number;
  monthlyRevenue: number;
}

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

interface VisionTest {
  id: number;
  test_date: string;
  patient: {
    id: number;
    name: string;
    patient_id: string;
  };
  performed_by: {
    name: string;
  } | null;
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
  };
  doctor: {
    id: number;
    user: {
      name: string;
    };
  };
}

interface DoctorStat {
  doctor_name: string;
  total_patients: number;
  monthly_patients: number;
  completion_rate: number;
  average_consultation_time: number;
  specialization: string | null;
}

interface AdminDashboardProps {
  userRole: string;
  userName: string;
  stats: Stats;
  recentPatients: Patient[];
  recentVisionTests: VisionTest[];
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  doctorStats: DoctorStat[];
  quickStats: {
    patientsToday: number;
    visionTestsToday: number;
    prescriptionsToday: number;
  };
}

export default function AdminDashboard({
  userName,
  stats,
  recentPatients,
  recentVisionTests,
  todayAppointments,
  upcomingAppointments,
  doctorStats,
  quickStats
}: AdminDashboardProps) {

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  return (
    <AdminLayout title="Admin Dashboard">
      <Head title="Admin Dashboard" />

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center">
                <Crown className="h-6 w-6 mr-2" />
                Admin Dashboard - {userName} 👑
              </h1>
              <p className="text-purple-100">Complete overview of your eye care management system</p>
            </div>
            <div className="flex space-x-3">
              <Button
                asChild
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                <Link href={route('users.create')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600"
              >
                <Link href={route('profile.edit')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Patients</p>
                <p className="text-3xl font-bold text-blue-700">{stats.totalPatients}</p>
                <p className="text-xs text-blue-500 mt-1">+{quickStats.patientsToday} today</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Doctors</p>
                <p className="text-3xl font-bold text-emerald-700">{stats.totalDoctors}</p>
                <p className="text-xs text-emerald-500 mt-1">Active specialists</p>
              </div>
              <Stethoscope className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Today's Appointments</p>
                <p className="text-3xl font-bold text-orange-700">{stats.todayAppointments}</p>
                <p className="text-xs text-orange-500 mt-1">{stats.pendingAppointments} pending</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-purple-700">৳{stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-purple-500 mt-1">This month</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-600 text-sm font-medium">Vision Tests Today</p>
                <p className="text-2xl font-bold text-pink-700">{quickStats.visionTestsToday}</p>
              </div>
              <Eye className="h-6 w-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Prescriptions Today</p>
                <p className="text-2xl font-bold text-indigo-700">{quickStats.prescriptionsToday}</p>
              </div>
              <FileText className="h-6 w-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-teal-700">
                  {stats.todayAppointments > 0 ? Math.round((stats.completedAppointments / stats.todayAppointments) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Appointments Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span>Today's Appointments Overview</span>
                <Badge variant="outline">{todayAppointments.length}</Badge>
              </CardTitle>
              <CardDescription>Real-time appointment status across all doctors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.slice(0, 8).map((appointment) => (
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
              {todayAppointments.length > 8 && (
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

          {/* Doctor Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Doctor Performance</span>
              </CardTitle>
              <CardDescription>Monthly performance metrics for all doctors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorStats.map((doctor, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Dr. {doctor.doctor_name}</h4>
                        {doctor.specialization && (
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {doctor.completion_rate}% completion
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Patients</p>
                        <p className="font-bold text-gray-900">{doctor.total_patients}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">This Month</p>
                        <p className="font-bold text-gray-900">{doctor.monthly_patients}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Time</p>
                        <p className="font-bold text-gray-900">{doctor.average_consultation_time}m</p>
                      </div>
                    </div>
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${doctor.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
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
                <UserPlus className="h-5 w-5 text-blue-500" />
                <span>Recent Patients</span>
              </CardTitle>
              <CardDescription>Latest patient registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients.slice(0, 6).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.name}</h4>
                        <p className="text-xs text-gray-600">ID: {patient.patient_id}</p>
                        <p className="text-xs text-gray-500">{formatDate(patient.created_at)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={route('patients.show', patient.id)}>
                        View
                      </Link>
                    </Button>
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
                <Eye className="h-5 w-5 text-purple-500" />
                <span>Recent Vision Tests</span>
              </CardTitle>
              <CardDescription>Latest vision test activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentVisionTests.slice(0, 5).map((test) => (
                  <div key={test.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{test.patient.name}</h4>
                      <span className="text-xs text-gray-500">{formatDate(test.test_date)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">ID: {test.patient.patient_id}</p>
                    {test.performed_by && (
                      <p className="text-xs text-gray-500">By: {test.performed_by.name}</p>
                    )}
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

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-gray-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start" asChild>
                  <Link href={route('patients.create')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Patient
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={route('users.create')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Add New User
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={route('appointments.create')}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-green-500" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backup</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Updated</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Security</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Secure</span>
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
              <Clock className="h-5 w-5 text-indigo-500" />
              <span>Upcoming Appointments</span>
              <Badge variant="outline">{upcomingAppointments.length}</Badge>
            </CardTitle>
            <CardDescription>Appointments scheduled for the next few days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments.slice(0, 9).map((appointment) => (
                <div key={appointment.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{appointment.patient.name}</h4>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
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
