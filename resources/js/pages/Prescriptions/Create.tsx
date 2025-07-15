import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Calendar, FileText, PlusCircle, X, Save,
    AlertCircle, Eye, Stethoscope, Clock, Phone,
    Activity, Target, Pill, Heart, CheckCircle,
    AlertTriangle, MapPin, Filter, ArrowLeft,
    UserCheck, Clipboard, Thermometer, Droplets
} from 'lucide-react';

// Complete Type definitions
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    medical_history?: string;
    age?: number;
    recent_visits: Visit[];
    recent_prescriptions: RecentPrescription[];
}

interface Visit {
    id: number;
    visit_id: string;
    chief_complaint?: string;
    visit_notes?: string;
    overall_status: string;
    created_at: string;
    doctor_name: string;
}

interface RecentPrescription {
    id: number;
    diagnosis?: string;
    created_at: string;
    doctor_name: string;
    medicines_count: number;
}

interface VisionTest {
    id: number;
    test_date: string;
    formatted_date: string;
    right_eye_vision?: string;
    left_eye_vision?: string;
    right_eye_sphere?: number;
    left_eye_sphere?: number;
    right_eye_cylinder?: number;
    left_eye_cylinder?: number;
    right_eye_axis?: number;
    left_eye_axis?: number;
    pupillary_distance?: number;
    additional_notes?: string;
    performed_by: string;
}

interface Medicine {
    id: number;
    name: string;
    generic_name?: string;
    type: string;
    strength?: string;
    unit?: string;
    manufacturer?: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
    formatted_date: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee?: number;
}

interface LatestVisit {
    id: number;
    visit_id: string;
    chief_complaint?: string;
    visit_notes?: string;
    overall_status: string;
    formatted_date: string;
}

interface PrescriptionCreateProps {
    patient: Patient;
    medicines: Medicine[];
    latestVisionTest?: VisionTest;
    latestVisit?: LatestVisit;
    appointment?: Appointment;
    doctor: Doctor;
}

interface MedicineItem {
    id: string;
    medicine_id: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: string;
}

export default function PrescriptionCreate({
    patient,
    medicines,
    latestVisionTest,
    latestVisit,
    appointment,
    doctor
}: PrescriptionCreateProps) {
    const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
        {
            id: `med-${Date.now()}`,
            medicine_id: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: ''
        }
    ]);

    const [selectedMedicineType, setSelectedMedicineType] = useState<string>('');

    // Group medicines by type for easier selection
    const medicinesByType = medicines.reduce((acc, medicine) => {
        const type = medicine.type || 'General';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(medicine);
        return acc;
    }, {} as Record<string, Medicine[]>);

    const medicineTypes = Object.keys(medicinesByType).sort();

    const { data, setData, post, processing, errors } = useForm({
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_id: appointment?.id || '',
        visit_id: latestVisit?.id || '',
        diagnosis: '',
        advice: '',
        notes: '',
        followup_date: '',
        medicines: [] as any[],
    });

    const addMedicineItem = () => {
        setMedicineItems([
            ...medicineItems,
            {
                id: `med-${Date.now()}`,
                medicine_id: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: '',
                quantity: ''
            }
        ]);
    };

    const removeMedicineItem = (id: string) => {
        if (medicineItems.length === 1) {
            return;
        }
        setMedicineItems(medicineItems.filter(item => item.id !== id));
    };

    const updateMedicineItem = (id: string, field: keyof MedicineItem, value: string) => {
        setMedicineItems(
            medicineItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = medicineItems.every(item => item.medicine_id && item.dosage);

        if (!isValid) {
            alert('Please select medicine and specify dosage for all medications');
            return;
        }

        const formattedMedicines = medicineItems.map(item => ({
            medicine_id: item.medicine_id,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            quantity: item.quantity ? parseInt(item.quantity) : null,
        }));

        const submitData = {
            ...data,
            medicines: formattedMedicines
        };

        post(route('prescriptions.store', patient.id), {
            data: submitData,
            onSuccess: () => {
                // Will redirect to prescription show page
            },
            onError: (errors) => {
                console.error('Prescription creation failed:', errors);
            }
        });
    };

    const goBack = () => {
        router.visit(route('doctor.view-patient', patient.id));
    };

    const getVisionScore = (vision: string | null) => {
        if (!vision) return 'N/A';
        const score = vision.split('/');
        if (score.length === 2) {
            const percentage = (parseInt(score[0]) / parseInt(score[1])) * 100;
            if (percentage >= 100) return 'Excellent';
            if (percentage >= 80) return 'Good';
            if (percentage >= 60) return 'Fair';
            return 'Poor';
        }
        return vision;
    };

    const getGenderIcon = (gender?: string) => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (dateOfBirth: string): number => {
        return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    };

    return (
        <AdminLayout title="Create Prescription">
            <Head title="Create Prescription" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header Section */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">Create New Prescription</h1>
                            <p className="text-gray-600 mt-1">Write a detailed prescription for {patient.name}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    Dr. {doctor.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Patient & Context Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        {/* Patient Information Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {getGenderIcon(patient.gender)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                    <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Age:</span>
                                    <span className="font-medium">
                                        {patient.age || (patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'N/A')} years
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="font-medium capitalize">{patient.gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium">{patient.phone}</span>
                                </div>
                                {patient.medical_history && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                        <span className="text-red-600 text-xs font-medium">Medical History:</span>
                                        <p className="text-red-700 text-xs mt-1">{patient.medical_history}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Visit Card */}
                        {latestVisit && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    Current Visit
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Visit ID:</span>
                                        <span className="font-medium">{latestVisit.visit_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{latestVisit.formatted_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                            {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    {latestVisit.chief_complaint && (
                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                            <span className="text-yellow-600 text-xs font-medium">Chief Complaint:</span>
                                            <p className="text-yellow-700 text-xs mt-1">{latestVisit.chief_complaint}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Appointment Card */}
                        {appointment && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                    Today's Appointment
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{appointment.formatted_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">{appointment.appointment_time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Serial:</span>
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">
                                            #{appointment.serial_number}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Latest Vision Test */}
                    {latestVisionTest && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Eye className="h-5 w-5 text-purple-600" />
                                Latest Vision Test Results ({latestVisionTest.formatted_date})
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Right Eye */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
                                    <h4 className="font-bold text-red-700 mb-4 flex items-center">
                                        <Target className="h-4 w-4 mr-2" />
                                        Right Eye (OD)
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                            <span className="text-sm text-gray-600">Vision:</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-900">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                    {getVisionScore(latestVisionTest.right_eye_vision)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">SPH</span>
                                                <p className="font-medium">{latestVisionTest.right_eye_sphere || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">CYL</span>
                                                <p className="font-medium">{latestVisionTest.right_eye_cylinder || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">AXIS</span>
                                                <p className="font-medium">{latestVisionTest.right_eye_axis || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Left Eye */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                    <h4 className="font-bold text-blue-700 mb-4 flex items-center">
                                        <Target className="h-4 w-4 mr-2" />
                                        Left Eye (OS)
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                            <span className="text-sm text-gray-600">Vision:</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-900">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                    {getVisionScore(latestVisionTest.left_eye_vision)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">SPH</span>
                                                <p className="font-medium">{latestVisionTest.left_eye_sphere || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">CYL</span>
                                                <p className="font-medium">{latestVisionTest.left_eye_cylinder || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-2 rounded text-center">
                                                <span className="text-gray-500">AXIS</span>
                                                <p className="font-medium">{latestVisionTest.left_eye_axis || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {latestVisionTest.pupillary_distance && (
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                    <span className="text-purple-600 text-sm font-medium">
                                        PD: {latestVisionTest.pupillary_distance}mm
                                    </span>
                                </div>
                            )}

                            {latestVisionTest.additional_notes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 text-sm font-medium">Notes:</span>
                                    <p className="text-gray-700 text-sm mt-1">{latestVisionTest.additional_notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                            {/* Left Column - Prescription Details */}
                            <div className="xl:col-span-2 space-y-6">

                                {/* Diagnosis and Treatment */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                        Diagnosis and Treatment
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Diagnosis *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.diagnosis}
                                                onChange={(e) => setData('diagnosis', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                placeholder="Enter detailed diagnosis..."
                                                required
                                            />
                                            {errors.diagnosis && (
                                                <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Advice / Recommendations
                                            </label>
                                            <textarea
                                                value={data.advice}
                                                onChange={(e) => setData('advice', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                rows={4}
                                                placeholder="Enter advice, lifestyle recommendations, or precautions..."
                                            />
                                            {errors.advice && (
                                                <p className="mt-1 text-sm text-red-600">{errors.advice}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Additional Notes
                                            </label>
                                            <textarea
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                rows={3}
                                                placeholder="Any additional notes or observations..."
                                            />
                                            {errors.notes && (
                                                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Follow-up Date
                                            </label>
                                            <input
                                                type="date"
                                                value={data.followup_date}
                                                onChange={(e) => setData('followup_date', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.followup_date && (
                                                <p className="mt-1 text-sm text-red-600">{errors.followup_date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent History */}
                                {(patient.recent_visits.length > 0 || patient.recent_prescriptions.length > 0) && (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <History className="h-5 w-5 text-gray-600" />
                                            Recent History
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Recent Visits */}
                                            {patient.recent_visits.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-gray-800 mb-3">Recent Visits</h4>
                                                    <div className="space-y-2">
                                                        {patient.recent_visits.slice(0, 3).map((visit) => (
                                                            <div key={visit.id} className="p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{visit.visit_id}</p>
                                                                        <p className="text-xs text-gray-500">{visit.created_at} • {visit.doctor_name}</p>
                                                                    </div>
                                                                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                                                                        {visit.overall_status}
                                                                    </span>
                                                                </div>
                                                                {visit.chief_complaint && (
                                                                    <p className="text-xs text-gray-600 mt-1">{visit.chief_complaint}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Prescriptions */}
                                            {patient.recent_prescriptions.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-gray-800 mb-3">Recent Prescriptions</h4>
                                                    <div className="space-y-2">
                                                        {patient.recent_prescriptions.slice(0, 3).map((prescription) => (
                                                            <div key={prescription.id} className="p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">#{prescription.id}</p>
                                                                        <p className="text-xs text-gray-500">{prescription.created_at} • {prescription.doctor_name}</p>
                                                                    </div>
                                                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                                                        {prescription.medicines_count} meds
                                                                    </span>
                                                                </div>
                                                                {prescription.diagnosis && (
                                                                    <p className="text-xs text-gray-600 mt-1">{prescription.diagnosis}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Medicines */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Pill className="h-5 w-5 text-amber-600" />
                                            Prescribed Medicines
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addMedicineItem}
                                            className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Add Medicine
                                        </button>
                                    </div>

                                    {/* Medicine Type Filter */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Medicine Type
                                        </label>
                                        <select
                                            value={selectedMedicineType}
                                            onChange={(e) => setSelectedMedicineType(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="">All medicine types</option>
                                            {medicineTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-6">
                                        {medicineItems.map((item, index) => (
                                            <div key={item.id} className="group p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-300 relative">
                                                {medicineItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicineItem(item.id)}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}

                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900">Medicine #{index + 1}</h4>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Medicine Name *
                                                        </label>
                                                        <select
                                                            value={item.medicine_id}
                                                            onChange={(e) => updateMedicineItem(item.id, 'medicine_id', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                            required
                                                        >
                                                            <option value="">Select medicine</option>
                                                            {medicines
                                                                .filter(medicine => !selectedMedicineType || medicine.type === selectedMedicineType)
                                                                .map(medicine => (
                                                                    <option key={medicine.id} value={medicine.id}>
                                                                        {medicine.name} {medicine.generic_name ? `(${medicine.generic_name})` : ''}
                                                                        {medicine.strength ? ` - ${medicine.strength}` : ''}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Dosage *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.dosage}
                                                            onChange={(e) => updateMedicineItem(item.id, 'dosage', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                            placeholder="e.g., 1-0-1, 0-0-1"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Frequency
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.frequency}
                                                                onChange={(e) => updateMedicineItem(item.id, 'frequency', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                placeholder="Daily, Twice daily"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Duration
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.duration}
                                                                onChange={(e) => updateMedicineItem(item.id, 'duration', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                placeholder="7 days, 2 weeks"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Instructions
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.instructions}
                                                                onChange={(e) => updateMedicineItem(item.id, 'instructions', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                placeholder="After meal, Before sleep"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Quantity
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateMedicineItem(item.id, 'quantity', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                placeholder="10, 30"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {medicineItems.length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Pill className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No medicines added yet</h3>
                                                <p className="text-gray-500 mb-4">Add medicines to complete the prescription</p>
                                                <button
                                                    type="button"
                                                    onClick={addMedicineItem}
                                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 mx-auto"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    Add First Medicine
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Please review all information before saving the prescription</span>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving Prescription...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Prescription
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Error Messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field}>{message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
