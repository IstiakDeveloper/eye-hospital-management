import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Calendar, FileText, Edit, Download, ArrowLeft,
    Phone, MapPin, Clock, Stethoscope, Eye, Pill,
    CheckCircle, AlertCircle, Calendar as CalendarIcon,
    UserCheck, Activity, Target, Building, Hash,
    Copy, Trash2, MoreVertical, Share2, RefreshCw
} from 'lucide-react';

// Type definitions
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    address?: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    formatted_date: string;
}

interface Medicine {
    id: number;
    name: string;
    generic_name?: string;
    strength?: string;
    type: string;
    manufacturer?: string;
}

interface PrescriptionMedicine {
    id: number;
    medicine: Medicine;
    dosage: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    quantity?: number;
}

interface Prescription {
    id: number;
    diagnosis: string;
    advice?: string;
    notes?: string;
    followup_date?: string;
    created_at: string;
    formatted_date: string;
    formatted_time: string;
    patient: Patient;
    doctor: Doctor;
    appointment?: Appointment;
    medicines: PrescriptionMedicine[];
    can_edit: boolean;
    can_print: boolean;
    created_by: string;
}

interface PrescriptionShowProps {
    prescription: Prescription;
}

export default function PrescriptionShow({ prescription }: PrescriptionShowProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const handlePrint = () => {
        window.open(route('prescriptions.print', prescription.id), '_blank');
    };

    const handleEdit = () => {
        router.visit(route('prescriptions.edit', prescription.id));
    };

    const handleDuplicate = () => {
        router.post(route('prescriptions.duplicate', prescription.id));
    };

    const handleCompleteFollowup = () => {
        if (confirm('Are you sure you want to mark this follow-up as completed?')) {
            setIsCompleting(true);
            router.post(route('prescriptions.complete-followup', prescription.id), {}, {
                onSuccess: () => {
                    setIsCompleting(false);
                },
                onError: () => {
                    setIsCompleting(false);
                }
            });
        }
    };

    const goBack = () => {
        router.visit(route('doctor.view-patient', prescription.patient.id));
    };

    const getGenderIcon = (gender?: string) => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const isFollowupOverdue = () => {
        if (!prescription.followup_date) return false;
        return new Date(prescription.followup_date) < new Date();
    };

    const getFollowupStatus = () => {
        if (!prescription.followup_date) return null;

        const followupDate = new Date(prescription.followup_date);
        const today = new Date();
        const diffTime = followupDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: 'overdue', text: `Overdue by ${Math.abs(diffDays)} days`, color: 'red' };
        } else if (diffDays === 0) {
            return { status: 'today', text: 'Due today', color: 'yellow' };
        } else if (diffDays <= 3) {
            return { status: 'upcoming', text: `Due in ${diffDays} days`, color: 'blue' };
        } else {
            return { status: 'scheduled', text: `Due in ${diffDays} days`, color: 'green' };
        }
    };

    const followupStatus = getFollowupStatus();

    return (
        <AdminLayout title="Prescription Details">
            <Head title={`Prescription #${prescription.id}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={goBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Prescription #{prescription.id}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Created on {prescription.formatted_date} at {prescription.formatted_time}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                            {prescription.can_print && (
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Print PDF
                                </button>
                            )}

                            {prescription.can_edit && (
                                <button
                                    onClick={handleEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </button>
                            )}

                            {/* More Actions Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="h-5 w-5 text-gray-600" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <button
                                                onClick={handleDuplicate}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Copy className="mr-3 h-4 w-4" />
                                                Duplicate Prescription
                                            </button>
                                            <button
                                                onClick={() => {/* Implement share functionality */}}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Share2 className="mr-3 h-4 w-4" />
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Patient & Doctor Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        {/* Patient Information */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Patient Information
                            </h3>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {getGenderIcon(prescription.patient.gender)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{prescription.patient.name}</h4>
                                    <p className="text-sm text-gray-500">ID: {prescription.patient.patient_id}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Age:</span>
                                    <span className="font-medium">{prescription.patient.age || 'N/A'} years</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="font-medium capitalize">{prescription.patient.gender || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium">{prescription.patient.phone}</span>
                                </div>
                                {prescription.patient.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <span className="text-gray-600">Address:</span>
                                            <p className="font-medium text-xs">{prescription.patient.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Doctor Information */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-green-600" />
                                Doctor Information
                            </h3>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    👨‍⚕️
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Dr. {prescription.doctor.name}</h4>
                                    <p className="text-sm text-gray-500">{prescription.doctor.specialization}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Specialization:</span>
                                    <span className="font-medium">{prescription.doctor.specialization}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Created by:</span>
                                    <span className="font-medium">{prescription.created_by}</span>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Information */}
                        {prescription.appointment && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                    Appointment Details
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{prescription.appointment.formatted_date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">{prescription.appointment.appointment_time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Serial:</span>
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                                            #{prescription.appointment.serial_number}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Follow-up Alert */}
                    {prescription.followup_date && (
                        <div className={`rounded-2xl border p-6 ${
                            followupStatus?.status === 'overdue' ? 'bg-red-50 border-red-200' :
                            followupStatus?.status === 'today' ? 'bg-yellow-50 border-yellow-200' :
                            followupStatus?.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                            'bg-green-50 border-green-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className={`h-6 w-6 ${
                                        followupStatus?.status === 'overdue' ? 'text-red-600' :
                                        followupStatus?.status === 'today' ? 'text-yellow-600' :
                                        followupStatus?.status === 'upcoming' ? 'text-blue-600' :
                                        'text-green-600'
                                    }`} />
                                    <div>
                                        <h3 className={`font-semibold ${
                                            followupStatus?.status === 'overdue' ? 'text-red-800' :
                                            followupStatus?.status === 'today' ? 'text-yellow-800' :
                                            followupStatus?.status === 'upcoming' ? 'text-blue-800' :
                                            'text-green-800'
                                        }`}>
                                            Follow-up Scheduled
                                        </h3>
                                        <p className={`text-sm ${
                                            followupStatus?.status === 'overdue' ? 'text-red-700' :
                                            followupStatus?.status === 'today' ? 'text-yellow-700' :
                                            followupStatus?.status === 'upcoming' ? 'text-blue-700' :
                                            'text-green-700'
                                        }`}>
                                            {new Date(prescription.followup_date).toLocaleDateString('en-BD', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })} - {followupStatus?.text}
                                        </p>
                                    </div>
                                </div>
                                {prescription.can_edit && (
                                    <button
                                        onClick={handleCompleteFollowup}
                                        disabled={isCompleting}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isCompleting ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                        {isCompleting ? 'Completing...' : 'Mark Complete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                        {/* Prescription Details */}
                        <div className="space-y-6">

                            {/* Diagnosis */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    Diagnosis
                                </h3>
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-indigo-900 font-medium">{prescription.diagnosis}</p>
                                </div>
                            </div>

                            {/* Advice */}
                            {prescription.advice && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-600" />
                                        Advice & Recommendations
                                    </h3>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-blue-900">{prescription.advice}</p>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {prescription.notes && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-gray-600" />
                                        Additional Notes
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-gray-700">{prescription.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prescribed Medicines */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Pill className="h-5 w-5 text-amber-600" />
                                Prescribed Medicines ({prescription.medicines.length})
                            </h3>

                            <div className="space-y-4">
                                {prescription.medicines.map((prescriptionMedicine, index) => (
                                    <div key={prescriptionMedicine.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-all duration-200">

                                        {/* Medicine Header */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-lg">
                                                    {prescriptionMedicine.medicine.name}
                                                </h4>
                                                {prescriptionMedicine.medicine.generic_name && (
                                                    <p className="text-gray-600 text-sm">
                                                        Generic: {prescriptionMedicine.medicine.generic_name}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                                                        {prescriptionMedicine.medicine.type}
                                                    </span>
                                                    {prescriptionMedicine.medicine.strength && (
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                                            {prescriptionMedicine.medicine.strength}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medicine Details */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <span className="text-blue-600 font-medium">Dosage:</span>
                                                <p className="text-blue-900 font-bold text-lg">{prescriptionMedicine.dosage}</p>
                                            </div>

                                            {prescriptionMedicine.frequency && (
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <span className="text-green-600 font-medium">Frequency:</span>
                                                    <p className="text-green-900 font-semibold">{prescriptionMedicine.frequency}</p>
                                                </div>
                                            )}

                                            {prescriptionMedicine.duration && (
                                                <div className="bg-purple-50 rounded-lg p-3">
                                                    <span className="text-purple-600 font-medium">Duration:</span>
                                                    <p className="text-purple-900 font-semibold">{prescriptionMedicine.duration}</p>
                                                </div>
                                            )}

                                            {prescriptionMedicine.quantity && (
                                                <div className="bg-orange-50 rounded-lg p-3">
                                                    <span className="text-orange-600 font-medium">Quantity:</span>
                                                    <p className="text-orange-900 font-semibold">{prescriptionMedicine.quantity}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instructions */}
                                        {prescriptionMedicine.instructions && (
                                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <span className="text-yellow-600 font-medium text-sm">Instructions:</span>
                                                <p className="text-yellow-800 text-sm mt-1">{prescriptionMedicine.instructions}</p>
                                            </div>
                                        )}

                                        {/* Manufacturer */}
                                        {prescriptionMedicine.medicine.manufacturer && (
                                            <div className="mt-3 text-xs text-gray-500">
                                                Manufacturer: {prescriptionMedicine.medicine.manufacturer}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {prescription.medicines.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Pill className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No medicines prescribed</h3>
                                        <p className="text-gray-500">This prescription does not contain any medications.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('doctor.view-patient', prescription.patient.id)}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                View Patient Profile
                            </Link>

                            <Link
                                href={route('prescriptions.create.patient', prescription.patient.id)}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                New Prescription
                            </Link>

                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
