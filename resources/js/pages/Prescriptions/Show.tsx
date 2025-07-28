import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import AdminLayout from '@/layouts/admin-layout';
import {
    Pill,
    User,
    Calendar,
    FileText,
    Activity,
    Heart,
    Eye,
    Clock,
    UserCheck,
    ArrowLeft,
    Printer,
    Edit,
    Stethoscope,
    Phone,
    MapPin,
    Hash,
    CalendarDays
} from 'lucide-react';

interface Medicine {
    id: number;
    medicine: {
        id: number;
        name: string;
        generic_name: string;
        type: string;
        manufacturer: string;
    };
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
}

interface GlassPrescription {
    id: number;
    prescription_type: string;
    right_eye_sphere: number;
    right_eye_cylinder: number;
    right_eye_axis: number;
    right_eye_add: number;
    left_eye_sphere: number;
    left_eye_cylinder: number;
    left_eye_axis: number;
    left_eye_add: number;
    pupillary_distance: number;
    segment_height: number;
    special_instructions: string;
    right_eye_prescription: string;
    left_eye_prescription: string;
}

interface Prescription {
    id: number;
    diagnosis: string;
    advice: string;
    notes: string;
    followup_date: string;
    includes_glasses: boolean;
    glasses_notes: string;
    created_at: string;
    formatted_date: string;
    formatted_time: string;
    patient: {
        id: number;
        patient_id: string;
        name: string;
        phone: string;
        age: number;
        gender: string;
        address: string;
    };
    doctor: {
        id: number;
        name: string;
        specialization: string;
    };
    appointment: {
        id: number;
        appointment_date: string;
        appointment_time: string;
        serial_number: string;
        formatted_date: string;
    } | null;
    medicines: Medicine[];
    glasses: GlassPrescription[];
    can_edit: boolean;
    can_print: boolean;
    created_by: string;
}

interface Props {
    prescription: Prescription;
}

const Show: React.FC<Props> = ({ prescription }) => {
    const { url } = usePage();

    const handlePrint = () => {
        window.open(`/prescriptions/${prescription.id}/print`, '_blank');
    };

    return (
        <AdminLayout>
            <Head title={`Prescription - ${prescription.patient.name}`} />

            {/* Header Actions */}
            <div className="bg-white shadow-sm border-b mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/prescriptions"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Prescriptions
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print Prescription
                            </button>

                            {prescription.can_edit && (
                                <Link
                                    href={`/prescriptions/${prescription.id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto pb-8">
                {/* Prescription Header */}
                <div className="bg-white shadow-lg rounded-lg border mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                    <Pill className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Medical Prescription</h1>
                                    <p className="text-blue-100">Prescription ID: #{prescription.id.toString().padStart(6, '0')}</p>
                                    <p className="text-blue-100">
                                        {prescription.formatted_date} at {prescription.formatted_time}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                    <p className="text-sm text-gray-900">Created by</p>
                                    <p className="font-semibold text-gray-900">{prescription.created_by}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Doctor Info Grid */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Patient Information */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <User className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Full Name</span>
                                        <span className="text-sm font-semibold text-gray-900">{prescription.patient.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Patient ID</span>
                                        <span className="text-sm font-semibold text-gray-900">{prescription.patient.patient_id}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Age</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {prescription.patient.age ? `${prescription.patient.age} years` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Gender</span>
                                        <span className="text-sm font-semibold text-gray-900 capitalize">
                                            {prescription.patient.gender || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-900">{prescription.patient.phone}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                        <span className="text-sm text-gray-900">{prescription.patient.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Doctor & Appointment Info */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Stethoscope className="w-6 h-6 text-green-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Doctor & Appointment</h2>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Doctor</span>
                                        <span className="text-sm font-semibold text-gray-900">Dr. {prescription.doctor.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-600">Specialization</span>
                                        <span className="text-sm font-semibold text-gray-900">{prescription.doctor.specialization}</span>
                                    </div>

                                    {prescription.appointment && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Appointment Date</span>
                                                <span className="text-sm font-semibold text-gray-900">{prescription.appointment.formatted_date}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Time</span>
                                                <span className="text-sm font-semibold text-gray-900">{prescription.appointment.appointment_time}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Serial Number</span>
                                                <span className="text-sm font-semibold text-gray-900">#{prescription.appointment.serial_number}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Diagnosis */}
                {prescription.diagnosis && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Medical Diagnosis</h3>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-gray-900 leading-relaxed">{prescription.diagnosis}</p>
                        </div>
                    </div>
                )}

                {/* Prescribed Medicines */}
                {prescription.medicines.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Pill className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Prescribed Medicines</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {prescription.medicines.length} Medicine{prescription.medicines.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Medicine
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dosage
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Frequency
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Instructions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {prescription.medicines.map((medicine, index) => (
                                        <tr key={medicine.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {medicine.medicine.name}
                                                    </div>
                                                    {medicine.medicine.generic_name && (
                                                        <div className="text-sm text-gray-500">
                                                            ({medicine.medicine.generic_name})
                                                        </div>
                                                    )}
                                                    {medicine.medicine.manufacturer && (
                                                        <div className="text-xs text-gray-400">
                                                            {medicine.medicine.manufacturer}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {medicine.dosage}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {medicine.frequency || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {medicine.duration || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {medicine.instructions || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Optical Prescription */}
                {prescription.glasses.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Optical Prescription</h3>
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {prescription.glasses.length} Prescription{prescription.glasses.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Optical Shop Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-blue-900 font-medium text-center">
                                📝 This prescription can be used at any optical shop
                            </p>
                        </div>

                        {prescription.glasses.map((glass, index) => (
                            <div key={glass.id} className="border border-purple-200 rounded-lg p-4 mb-4">
                                <h4 className="font-semibold text-purple-900 mb-3 capitalize">
                                    {glass.prescription_type.replace('_', ' ')} Prescription
                                </h4>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Eye</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SPH</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">CYL</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">AXIS</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">ADD</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr className="bg-red-50">
                                                <td className="px-4 py-2 font-medium text-red-800">Right Eye (OD)</td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.right_eye_sphere ? (glass.right_eye_sphere > 0 ? '+' : '') + glass.right_eye_sphere : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.right_eye_cylinder ? (glass.right_eye_cylinder > 0 ? '+' : '') + glass.right_eye_cylinder : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.right_eye_axis ? glass.right_eye_axis + '°' : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.right_eye_add ? '+' + glass.right_eye_add : '-'}
                                                </td>
                                            </tr>
                                            <tr className="bg-blue-50">
                                                <td className="px-4 py-2 font-medium text-blue-800">Left Eye (OS)</td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.left_eye_sphere ? (glass.left_eye_sphere > 0 ? '+' : '') + glass.left_eye_sphere : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.left_eye_cylinder ? (glass.left_eye_cylinder > 0 ? '+' : '') + glass.left_eye_cylinder : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.left_eye_axis ? glass.left_eye_axis + '°' : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-center text-sm">
                                                    {glass.left_eye_add ? '+' + glass.left_eye_add : '-'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Additional Measurements */}
                                {(glass.pupillary_distance || glass.segment_height) && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <h5 className="font-medium text-gray-900 mb-2">Additional Measurements:</h5>
                                        <div className="flex gap-4">
                                            {glass.pupillary_distance && (
                                                <span className="text-sm text-gray-700">
                                                    <strong>PD:</strong> {glass.pupillary_distance}mm
                                                </span>
                                            )}
                                            {glass.segment_height && (
                                                <span className="text-sm text-gray-700">
                                                    <strong>Segment Height:</strong> {glass.segment_height}mm
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Special Instructions */}
                                {glass.special_instructions && (
                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h5 className="font-medium text-yellow-900 mb-1">Special Instructions:</h5>
                                        <p className="text-sm text-yellow-800">{glass.special_instructions}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* General Glasses Notes */}
                        {prescription.glasses_notes && (
                            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h5 className="font-medium text-purple-900 mb-2">Doctor's Optical Notes:</h5>
                                <p className="text-purple-800">{prescription.glasses_notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Medical Advice */}
                {prescription.advice && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Heart className="w-6 h-6 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Medical Advice & Recommendations</h3>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{prescription.advice}</p>
                        </div>
                    </div>
                )}

                {/* Follow-up */}
                {prescription.followup_date && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CalendarDays className="w-6 h-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Follow-up Appointment</h3>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <span className="text-lg font-semibold text-green-900">
                                    {format(new Date(prescription.followup_date), 'PPP')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clinical Notes */}
                {prescription.notes && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Clinical Notes</h3>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{prescription.notes}</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Show;
