// resources/js/Pages/Patients/Show.tsx
import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
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
import { formatDate, formatTime, calculateAge } from '@/lib/utils';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Clock,
    FileText,
    Edit,
    Printer,
    Eye,
    Plus,
    ChevronRight
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
    medical_history: string | null;
    created_at: string;
}

interface VisionTest {
    id: number;
    right_eye_vision: string | null;
    left_eye_vision: string | null;
    right_eye_power: number | null;
    left_eye_power: number | null;
    right_eye_pressure: string | null;
    left_eye_pressure: string | null;
    additional_notes: string | null;
    test_date: string;
    performed_by: {
        name: string;
    };
}

interface Appointment {
    id: number;
    doctor: {
        id: number;
        user: {
            name: string;
        };
    };
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
}

interface Prescription {
    id: number;
    doctor: {
        id: number;
        user: {
            name: string;
        };
    };
    diagnosis: string | null;
    created_at: string;
    followup_date: string | null;
    prescription_medicines: {
        id: number;
        medicine: {
            id: number;
            name: string;
        };
        dosage: string;
        duration: string | null;
        instructions: string | null;
    }[];
}

interface PatientShowProps {
    patient: Patient;
    visionTests: VisionTest[];
    appointments: Appointment[];
    prescriptions: Prescription[];
}

export default function PatientShow({ patient, visionTests, appointments, prescriptions }: PatientShowProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <AdminLayout title={`Patient: ${patient.name}`}>
            <Head title={`Patient: ${patient.name}`} />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                    <p className="text-sm text-gray-600">Patient ID: {patient.patient_id}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        href={route('patients.edit', patient.id)}
                        variant="outline"
                        icon={<Edit className="h-4 w-4" />}
                    >
                        Edit Patient
                    </Button>

                    <Button
                        href={route('appointments.create.patient', patient.id)}
                        variant="outline"
                        icon={<Calendar className="h-4 w-4" />}
                    >
                        New Appointment
                    </Button>

                    <Button
                        href={route('visiontests.create', patient.id)}
                        variant="outline"
                        icon={<Eye className="h-4 w-4" />}
                    >
                        New Vision Test
                    </Button>

                    <Button
                        href={route('prescriptions.create.patient', patient.id)}
                        variant="default"
                        icon={<FileText className="h-4 w-4" />}
                    >
                        New Prescription
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Overview
                    </button>

                    <button
                        onClick={() => setActiveTab('vision_tests')}
                        className={`${activeTab === 'vision_tests'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Vision Tests ({visionTests?.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`${activeTab === 'appointments'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Appointments ({appointments?.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('prescriptions')}
                        className={`${activeTab === 'prescriptions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Prescriptions ({prescriptions?.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patient Information */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Patient Information</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <User className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Full Name</p>
                                            <p className="text-gray-900">{patient.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                            <p className="text-gray-900">{patient.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Email Address</p>
                                            <p className="text-gray-900">{patient.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                            <p className="text-gray-900">
                                                {patient.date_of_birth
                                                    ? `${formatDate(patient.date_of_birth)} (${calculateAge(patient.date_of_birth)} years)`
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <User className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Gender</p>
                                            <p className="text-gray-900">
                                                {patient.gender
                                                    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Registration Date</p>
                                            <p className="text-gray-900">{formatDate(patient.created_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Address</p>
                                            <p className="text-gray-900">{patient.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {patient.medical_history && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-start">
                                            <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Medical History</p>
                                                <p className="text-gray-900 whitespace-pre-line">{patient.medical_history}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Latest Vision Test */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Latest Vision Test</CardTitle>
                            </CardHeader>

                            <CardContent>
                                {visionTests?.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">
                                            Test Date: {formatDate(visionTests[0].test_date)}
                                        </p>

                                        <div className="border rounded-md p-4 bg-gray-50">
                                            <h4 className="font-medium text-gray-900 mb-2">Vision</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Right Eye</p>
                                                    <p className="text-gray-900">{visionTests[0].right_eye_vision || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Left Eye</p>
                                                    <p className="text-gray-900">{visionTests[0].left_eye_vision || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border rounded-md p-4 bg-gray-50">
                                            <h4 className="font-medium text-gray-900 mb-2">Power</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Right Eye</p>
                                                    <p className="text-gray-900">
                                                        {visionTests[0].right_eye_power !== null ? visionTests[0].right_eye_power : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Left Eye</p>
                                                    <p className="text-gray-900">
                                                        {visionTests[0].left_eye_power !== null ? visionTests[0].left_eye_power : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No vision tests recorded yet</p>
                                        <Button
                                            href={route('visiontests.create', patient.id)}
                                            className="mt-4"
                                            size="sm"
                                        >
                                            Record First Vision Test
                                        </Button>
                                    </div>
                                )}
                            </CardContent>

                            {visionTests?.length > 0 && (
                                <CardFooter>
                                    <Button
                                        href={route('visiontests.show', visionTests[0].id)}
                                        variant="outline"
                                        className="w-full"
                                        size="sm"
                                    >
                                        View Full Details
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Recent Activity */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <div className="flow-root">
                                    <ul className="divide-y divide-gray-200">
                                        {[...(appointments || []), ...(visionTests || []), ...(prescriptions || [])]
                                            .sort((a, b) => new Date(b.created_at || b.test_date || b.appointment_date).getTime() -
                                                new Date(a.created_at || a.test_date || a.appointment_date).getTime())
                                            .slice(0, 5)
                                            .map((item) => {
                                                // Check item type and render accordingly
                                                if ('test_date' in item) {
                                                    // It's a vision test
                                                    return (
                                                        <li key={`vision-${item.id}`} className="py-4">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                                                                    <Eye className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                                <div className="ml-3 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Vision Test Recorded
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {formatDate(item.test_date)}
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">
                                                                        Performed by {item.performed_by.name}
                                                                    </p>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            href={route('visiontests.show', item.id)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            View Test Results <ChevronRight className="ml-1 h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                } else if ('appointment_date' in item) {
                                                    // It's an appointment
                                                    return (
                                                        <li key={`apt-${item.id}`} className="py-4">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                                                                    <Calendar className="h-5 w-5 text-green-600" />
                                                                </div>
                                                                <div className="ml-3 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Appointment with Dr. {item.doctor.user.name}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {formatDate(item.appointment_date)}
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">
                                                                        Time: {formatTime(item.appointment_time)} •
                                                                        Serial: {item.serial_number} •
                                                                        Status: <span className="capitalize">{item.status}</span>
                                                                    </p>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            href={route('appointments.show', item.id)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-green-600 hover:text-green-800"
                                                                        >
                                                                            View Appointment <ChevronRight className="ml-1 h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                } else {
                                                    // It's a prescription
                                                    return (
                                                        <li key={`presc-${item.id}`} className="py-4">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                                                                    <FileText className="h-5 w-5 text-purple-600" />
                                                                </div>
                                                                <div className="ml-3 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Prescription by Dr. {item.doctor.user.name}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {formatDate(item.created_at)}
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500">
                                                                        {item.diagnosis ? `Diagnosis: ${item.diagnosis}` : 'No diagnosis recorded'}
                                                                        {item.followup_date && ` • Follow-up: ${formatDate(item.followup_date)}`}
                                                                    </p>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            href={route('prescriptions.show', item.id)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-purple-600 hover:text-purple-800"
                                                                        >
                                                                            View Prescription <ChevronRight className="ml-1 h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                }
                                            })}
                                        {[...(appointments || []), ...(visionTests || []), ...(prescriptions || [])].length === 0 && (
                                            <li className="py-8 text-center">
                                                <p className="text-gray-500">No activity recorded yet for this patient.</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Vision Tests Tab */}
                {activeTab === 'vision_tests' && (
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <CardTitle>Vision Test History</CardTitle>
                            <Button
                                href={route('visiontests.create', patient.id)}
                                size="sm"
                                icon={<Plus className="h-4 w-4" />}
                            >
                                New Vision Test
                            </Button>
                        </CardHeader>

                        <CardContent>
                            {visionTests?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Test Date</TableHead>
                                                <TableHead>Right Eye Vision</TableHead>
                                                <TableHead>Left Eye Vision</TableHead>
                                                <TableHead>Right Eye Power</TableHead>
                                                <TableHead>Left Eye Power</TableHead>
                                                <TableHead>Performed By</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visionTests.map((test) => (
                                                <TableRow key={test.id}>
                                                    <TableCell className="font-medium">{formatDate(test.test_date)}</TableCell>
                                                    <TableCell>{test.right_eye_vision || 'N/A'}</TableCell>
                                                    <TableCell>{test.left_eye_vision || 'N/A'}</TableCell>
                                                    <TableCell>{test.right_eye_power !== null ? test.right_eye_power : 'N/A'}</TableCell>
                                                    <TableCell>{test.left_eye_power !== null ? test.left_eye_power : 'N/A'}</TableCell>
                                                    <TableCell>{test.performed_by.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                href={route('visiontests.show', test.id)}
                                                                icon={<Eye className="h-4 w-4" />}
                                                            >
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                href={route('visiontests.print', test.id)}
                                                                icon={<Printer className="h-4 w-4" />}
                                                            >
                                                                Print
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No vision tests recorded</h3>
                                    <p className="text-gray-500 mb-4">Record the patient's first vision test to track their eye health.</p>
                                    <Button
                                        href={route('visiontests.create', patient.id)}
                                        icon={<Plus className="h-4 w-4" />}
                                    >
                                        Record Vision Test
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <CardTitle>Appointment History</CardTitle>
                            <Button
                                href={route('appointments.create.patient', patient.id)}
                                size="sm"
                                icon={<Plus className="h-4 w-4" />}
                            >
                                New Appointment
                            </Button>
                        </CardHeader>

                        <CardContent>
                            {appointments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Serial No.</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appointments.map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell className="font-medium">{formatDate(appointment.appointment_date)}</TableCell>
                                                    <TableCell>{formatTime(appointment.appointment_time)}</TableCell>
                                                    <TableCell>Dr. {appointment.doctor.user.name}</TableCell>
                                                    <TableCell>{appointment.serial_number}</TableCell>
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
                                                                icon={<Eye className="h-4 w-4" />}
                                                            >
                                                                View
                                                            </Button>
                                                            {appointment.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    href={route('prescriptions.create.patient', [patient.id, { appointment_id: appointment.id }])}
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
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments scheduled</h3>
                                    <p className="text-gray-500 mb-4">Schedule the patient's first appointment with a doctor.</p>
                                    <Button
                                        href={route('appointments.create.patient', patient.id)}
                                        icon={<Plus className="h-4 w-4" />}
                                    >
                                        Schedule Appointment
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <CardTitle>Prescription History</CardTitle>
                            <Button
                                href={route('prescriptions.create.patient', patient.id)}
                                size="sm"
                                icon={<Plus className="h-4 w-4" />}
                            >
                                New Prescription
                            </Button>
                        </CardHeader>

                        <CardContent>
                            {prescriptions.length > 0 ? (
                                <div className="space-y-6">
                                    {prescriptions.map((prescription) => (
                                        <div key={prescription.id} className="border rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">Dr. {prescription.doctor.user.name}</p>
                                                    <p className="text-sm text-gray-500">{formatDate(prescription.created_at)}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('prescriptions.show', prescription.id)}
                                                        icon={<Eye className="h-4 w-4" />}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('prescriptions.print', prescription.id)}
                                                        icon={<Printer className="h-4 w-4" />}
                                                    >
                                                        Print
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                {prescription.diagnosis && (
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-500">Diagnosis</h4>
                                                        <p className="text-gray-900">{prescription.diagnosis}</p>
                                                    </div>
                                                )}

                                                <h4 className="text-sm font-medium text-gray-500 mb-2">Medicines</h4>
                                                <ul className="space-y-2">
                                                    {prescription.prescription_medicines.map((pm) => (
                                                        <li key={pm.id} className="flex items-start">
                                                            <div className="bg-blue-100 rounded-full p-1 mt-0.5 mr-2">
                                                                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{pm.medicine.name}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    {pm.dosage}
                                                                    {pm.duration && ` • ${pm.duration}`}
                                                                    {pm.instructions && ` • ${pm.instructions}`}
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {prescription.followup_date && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                            <p className="text-sm">
                                                                <span className="font-medium text-gray-700">Follow-up: </span>
                                                                {formatDate(prescription.followup_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No prescriptions yet</h3>
                                    <p className="text-gray-500 mb-4">Create a new prescription for this patient.</p>
                                    <Button
                                        href={route('prescriptions.create.patient', patient.id)}
                                        icon={<Plus className="h-4 w-4" />}
                                    >
                                        Create Prescription
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
