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
    CardFooter
} from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
    User,
    Calendar,
    Clock,
    FileText,
    Printer,
    ArrowLeft,
    Edit
} from 'lucide-react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string | null;
    type: string;
}

interface PrescriptionMedicine {
    id: number;
    medicine: Medicine;
    dosage: string;
    duration: string | null;
    instructions: string | null;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization: string | null;
    qualification: string | null;
}

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
}

interface Prescription {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_id: number | null;
    diagnosis: string | null;
    advice: string | null;
    notes: string | null;
    followup_date: string | null;
    created_at: string;
    patient: Patient;
    doctor: Doctor;
    prescription_medicines: PrescriptionMedicine[];
}

interface PrescriptionShowProps {
    prescription: Prescription;
}

export default function PrescriptionShow({ prescription }: PrescriptionShowProps) {
    return (
        <AdminLayout title="Prescription Details">
            <Head title="Prescription Details" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescription</h1>
                    <p className="text-sm text-gray-600">Created on {formatDate(prescription.created_at)}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        href={route('patients.show', prescription.patient_id)}
                        variant="outline"
                        icon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back to Patient
                    </Button>

                    <Button
                        href={route('prescriptions.edit', prescription.id)}
                        variant="outline"
                        icon={<Edit className="h-4 w-4" />}
                    >
                        Edit Prescription
                    </Button>

                    <Button
                        href={route('prescriptions.print', prescription.id)}
                        variant="default"
                        icon={<Printer className="h-4 w-4" />}
                    >
                        Print Prescription
                    </Button>
                </div>
            </div>

            {/* Patient Info Card */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle>Patient Information</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 font-medium">Patient Name</p>
                            <p className="text-gray-900">{prescription.patient.name}</p>
                        </div>

                        <div>
                            <p className="text-gray-500 font-medium">Patient ID</p>
                            <p className="text-gray-900">{prescription.patient.patient_id}</p>
                        </div>

                        <div>
                            <p className="text-gray-500 font-medium">Phone</p>
                            <p className="text-gray-900">{prescription.patient.phone}</p>
                        </div>

                        <div>
                            <p className="text-gray-500 font-medium">Gender</p>
                            <p className="text-gray-900">
                                {prescription.patient.gender
                                    ? prescription.patient.gender.charAt(0).toUpperCase() + prescription.patient.gender.slice(1)
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Doctor and Prescription Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Prescription Details</CardTitle>
                        <CardDescription>
                            Prescribed by Dr. {prescription.doctor.user.name}
                            {prescription.doctor.specialization && ` • ${prescription.doctor.specialization}`}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {prescription.diagnosis && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h3>
                                <p className="text-gray-900 whitespace-pre-line border-l-2 border-blue-500 pl-3 py-1">
                                    {prescription.diagnosis}
                                </p>
                            </div>
                        )}

                        {prescription.advice && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Advice / Recommendations</h3>
                                <p className="text-gray-900 whitespace-pre-line border-l-2 border-green-500 pl-3 py-1">
                                    {prescription.advice}
                                </p>
                            </div>
                        )}

                        {prescription.notes && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Notes</h3>
                                <p className="text-gray-900 whitespace-pre-line border-l-2 border-gray-300 pl-3 py-1">
                                    {prescription.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Follow-up Information</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {prescription.followup_date ? (
                            <div className="bg-blue-50 p-4 rounded-md">
                                <div className="flex items-start">
                                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Follow-up Date</p>
                                        <p className="text-blue-900 font-medium text-lg">{formatDate(prescription.followup_date)}</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Please schedule a follow-up appointment on this date.
                                        </p>
                                        <Button
                                            href={route('appointments.create.patient', prescription.patient_id)}
                                            className="mt-2"
                                            size="sm"
                                        >
                                            Schedule Follow-up
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No follow-up date specified
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Medicines */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        Prescribed Medicines
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {prescription.prescription_medicines.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Medicine
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dosage
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Instructions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {prescription.prescription_medicines.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.medicine.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {item.medicine.generic_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {item.medicine.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.dosage}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.duration || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.instructions || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No medicines have been prescribed</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center border-t">
                    <Button
                        href={route('prescriptions.print', prescription.id)}
                        className="w-full max-w-xs"
                        icon={<Printer className="h-4 w-4" />}
                    >
                        Print Prescription
                    </Button>
                </CardFooter>
            </Card>
        </AdminLayout>
    );
}
