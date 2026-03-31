import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Clock, Edit3, Eye, FileText, Hash, Home, Mail, Phone, Save, User, X } from 'lucide-react';
import React from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
    medical_history: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    patient: Patient;
    userRole: number;
}

export default function PatientEdit({ patient, userRole }: Props) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: patient.name || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        medical_history: patient.medical_history || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('patients.update', patient.id), {
            onSuccess: () => {
                // Form will redirect to patient show page on success
            },
        });
    };

    const cancelForm = () => {
        reset();
        router.visit(route('patients.show', patient.id));
    };

    const formatPatientId = (id: string) => {
        return id ? `#${id}` : 'N/A';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AdminLayout title={`Edit Patient - ${patient.name}`}>
            <Head title={`Edit Patient - ${patient.name}`} />

            <div className="mx-auto max-w-4xl space-y-6 p-6">
                {/* Patient Info Header */}
                <Card className="border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-white/20 p-3">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-50">{patient.name}</CardTitle>
                                    <div className="mt-1 flex items-center gap-4 text-indigo-100">
                                        <span className="flex items-center gap-1">
                                            <Hash className="h-4 w-4" />
                                            {formatPatientId(patient.patient_id)}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            Registered: {formatDate(patient.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => router.visit(route('patients.show', patient.id))}
                                className="inline-flex items-center rounded-lg bg-white/20 px-4 py-2 transition-colors hover:bg-white/30"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                            </button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Edit Form */}
                <Card className="border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div className="flex items-center gap-3">
                            <Edit3 className="h-6 w-6" />
                            <div>
                                <CardTitle className="text-xl font-semibold text-slate-50">Edit Patient Information</CardTitle>
                                <CardDescription className="text-indigo-100">
                                    Update patient details. Required fields are marked with (*)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 p-6">
                            {/* Personal Information */}
                            <div>
                                <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <User className="h-5 w-5 text-indigo-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                            Full Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className={`w-full rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </div>
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className={`w-full rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className={`w-full rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">
                                            Address
                                        </label>
                                        <div className="relative">
                                            <Home className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="address"
                                                type="text"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                className={`w-full rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.address ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Enter address"
                                            />
                                        </div>
                                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label htmlFor="date_of_birth" className="mb-2 block text-sm font-medium text-gray-700">
                                            Date of Birth
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="date_of_birth"
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                                className={`w-full rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                        </div>
                                        {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label htmlFor="gender" className="mb-2 block text-sm font-medium text-gray-700">
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            value={data.gender}
                                            onChange={(e) => setData('gender', e.target.value)}
                                            className={`w-full rounded-lg border px-3 py-3 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                errors.gender ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Medical History */}
                            <div>
                                <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <FileText className="h-5 w-5 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
                                </div>

                                <div>
                                    <label htmlFor="medical_history" className="mb-2 block text-sm font-medium text-gray-700">
                                        Previous Medical Conditions or Notes
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                                        <textarea
                                            id="medical_history"
                                            rows={4}
                                            value={data.medical_history}
                                            onChange={(e) => setData('medical_history', e.target.value)}
                                            className={`w-full resize-none rounded-lg border py-3 pr-3 pl-10 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                                                errors.medical_history ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter medical conditions, allergies, or notes..."
                                        />
                                    </div>
                                    {errors.medical_history && <p className="mt-1 text-sm text-red-600">{errors.medical_history}</p>}
                                </div>
                            </div>

                            {/* Record Info */}
                            <div className="rounded-lg bg-gray-50 p-4">
                                <h4 className="mb-3 flex items-center font-medium text-gray-800">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Record Information
                                </h4>
                                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                    <div>
                                        <span className="font-medium text-gray-600">Patient ID:</span>
                                        <span className="ml-2 text-gray-800">{formatPatientId(patient.patient_id)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Registration:</span>
                                        <span className="ml-2 text-gray-800">{formatDate(patient.created_at)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Last Update:</span>
                                        <span className="ml-2 text-gray-800">{formatDate(patient.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between bg-gray-50 p-6">
                            <button
                                type="button"
                                onClick={cancelForm}
                                disabled={processing}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </button>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('patients.show', patient.id))}
                                    disabled={processing}
                                    className="inline-flex items-center rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`inline-flex items-center rounded-lg px-6 py-2 font-medium text-white transition-all ${
                                        processing
                                            ? 'cursor-not-allowed bg-gray-400'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500'
                                    }`}
                                >
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Update Patient
                                        </>
                                    )}
                                </button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
}
