import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import {
  Save,
  X,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  FileText,
  Eye,
  Edit3,
  Clock,
  Hash
} from 'lucide-react';

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
      day: 'numeric'
    });
  };

  return (
    <AdminLayout title={`Edit Patient - ${patient.name}`}>
      <Head title={`Edit Patient - ${patient.name}`} />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Patient Info Header */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-50">{patient.name}</CardTitle>
                  <div className="flex items-center gap-4 text-indigo-100 mt-1">
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
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <Card className="shadow-xl border-0">
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
            <CardContent className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <User className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="address"
                        type="text"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter address"
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="date_of_birth"
                        type="date"
                        value={data.date_of_birth}
                        onChange={(e) => setData('date_of_birth', e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={data.gender}
                      onChange={(e) => setData('gender', e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
                </div>

                <div>
                  <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Medical Conditions or Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      id="medical_history"
                      rows={4}
                      value={data.medical_history}
                      onChange={(e) => setData('medical_history', e.target.value)}
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                        errors.medical_history ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter medical conditions, allergies, or notes..."
                    />
                  </div>
                  {errors.medical_history && <p className="mt-1 text-sm text-red-600">{errors.medical_history}</p>}
                </div>
              </div>

              {/* Record Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Record Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

            <CardFooter className="bg-gray-50 p-6 flex justify-between">
              <button
                type="button"
                onClick={cancelForm}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors font-medium disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.visit(route('patients.show', patient.id))}
                  disabled={processing}
                  className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 transition-colors font-medium disabled:opacity-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>

                <button
                  type="submit"
                  disabled={processing}
                  className={`inline-flex items-center px-6 py-2 rounded-lg text-white font-medium transition-all ${
                    processing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500'
                  }`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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
