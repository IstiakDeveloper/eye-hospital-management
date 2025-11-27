// resources/js/Pages/Doctors/Edit.tsx
import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  X,
  Edit3,
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Stethoscope,
  BadgeDollarSign,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Calendar,
  Shield
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface Doctor {
  id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  bio: string | null;
  consultation_fee: number;
  follow_up_fee: number;
  is_available: boolean;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
  user: User;
}

interface DoctorEditProps {
  doctor: Doctor;
}

export default function DoctorEdit({ doctor }: DoctorEditProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const { data, setData, put, processing, errors, reset, isDirty } = useForm({
    // User data
    name: doctor.user.name,
    email: doctor.user.email,
    phone: doctor.user.phone || '',

    // Doctor profile data
    specialization: doctor.specialization,
    qualification: doctor.qualification,
    bio: doctor.bio || '',
    consultation_fee: doctor.consultation_fee.toString(),
    follow_up_fee: doctor.follow_up_fee.toString(),
    is_available: doctor.is_available,
    registration_number: doctor.registration_number || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('doctors.update', doctor.id));
  };

  const handleReset = () => {
    reset();
    setHasChanges(false);
  };

  const handleDataChange = (key: string, value: string | boolean) => {
    setData(key as any, value);
    setHasChanges(true);
  };

  const getChangeIndicator = (currentValue: string | boolean, originalValue: string | boolean | null) => {
    if (currentValue !== (originalValue || '')) {
      return (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
      );
    }
    return null;
  };

  return (
    <AdminLayout title={`Edit Doctor - ${doctor.user.name}`}>
      <Head title={`Edit Doctor - ${doctor.user.name}`} />

      {/* Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild className="hover:bg-gray-50">
              <Link href={route('doctors.index')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Doctors
              </Link>
            </Button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href={route('doctors.index')} className="hover:text-blue-600">Doctors</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">Edit {doctor.user.name}</span>
            </div>
          </div>

          {/* Save Indicator */}
          {isDirty && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-amber-700">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Edit3 className="h-6 w-6 mr-3 text-blue-500" />
                Edit Doctor Profile
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Update doctor information and profile settings
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="outline" className="bg-white">
                Doctor ID: #{doctor.id}
              </Badge>
              <Badge className={doctor.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {doctor.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Doctor Summary Card */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{doctor.user.name}</h3>
                <Badge className="bg-blue-100 text-blue-800">{doctor.specialization}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{doctor.user.email}</span>
                </div>
                {doctor.user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{doctor.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <BadgeDollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">৳{doctor.consultation_fee}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Since {new Date(doctor.created_at).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 space-y-8">
            {/* User Account Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900">User Account Information</h3>
                {(data.name !== doctor.user.name || data.email !== doctor.user.email || data.phone !== (doctor.user.phone || '')) && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Modified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => handleDataChange('name', e.target.value)}
                    error={errors.name}
                    icon={<UserIcon className="h-4 w-4 text-gray-400" />}
                  />
                  {getChangeIndicator(data.name, doctor.user.name)}
                  {data.name !== doctor.user.name && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.user.name}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => handleDataChange('email', e.target.value)}
                    error={errors.email}
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                  />
                  {getChangeIndicator(data.email, doctor.user.email)}
                  {data.email !== doctor.user.email && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.user.email}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => handleDataChange('phone', e.target.value)}
                    error={errors.phone}
                    icon={<Phone className="h-4 w-4 text-gray-400" />}
                  />
                  {getChangeIndicator(data.phone, doctor.user.phone)}
                  {data.phone !== (doctor.user.phone || '') && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.user.phone || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number (BMDC)
                  </label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={data.registration_number}
                    onChange={(e) => handleDataChange('registration_number', e.target.value)}
                    error={errors.registration_number}
                    icon={<Shield className="h-4 w-4 text-gray-400" />}
                    placeholder="e.g., A-12345"
                  />
                  {getChangeIndicator(data.registration_number, doctor.registration_number)}
                  {data.registration_number !== (doctor.registration_number || '') && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.registration_number || 'Not set'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Profile Information */}
            <div className="pt-8 border-t border-gray-200 space-y-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900">Professional Information</h3>
                {(data.specialization !== doctor.specialization ||
                  data.qualification !== doctor.qualification ||
                  data.bio !== (doctor.bio || '') ||
                  data.consultation_fee !== doctor.consultation_fee.toString()) && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Modified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={data.specialization}
                    onChange={(e) => handleDataChange('specialization', e.target.value)}
                    error={errors.specialization}
                    icon={<Stethoscope className="h-4 w-4 text-gray-400" />}
                    placeholder="e.g., Ophthalmologist"
                  />
                  {getChangeIndicator(data.specialization, doctor.specialization)}
                  {data.specialization !== doctor.specialization && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.specialization}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification *
                  </label>
                  <Input
                    id="qualification"
                    name="qualification"
                    value={data.qualification}
                    onChange={(e) => handleDataChange('qualification', e.target.value)}
                    error={errors.qualification}
                    icon={<GraduationCap className="h-4 w-4 text-gray-400" />}
                    placeholder="e.g., MBBS, MS (Ophthalmology)"
                  />
                  {getChangeIndicator(data.qualification, doctor.qualification)}
                  {data.qualification !== doctor.qualification && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: {doctor.qualification}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee (BDT) *
                  </label>
                  <Input
                    id="consultation_fee"
                    name="consultation_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.consultation_fee}
                    onChange={(e) => handleDataChange('consultation_fee', e.target.value)}
                    error={errors.consultation_fee}
                    icon={<BadgeDollarSign className="h-4 w-4 text-gray-400" />}
                  />
                  {getChangeIndicator(data.consultation_fee, doctor.consultation_fee.toString())}
                  {data.consultation_fee !== doctor.consultation_fee.toString() && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: ৳{doctor.consultation_fee}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="follow_up_fee" className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Fee (BDT)
                  </label>
                  <Input
                    id="follow_up_fee"
                    name="follow_up_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.follow_up_fee}
                    onChange={(e) => handleDataChange('follow_up_fee', e.target.value)}
                    error={errors.follow_up_fee}
                    icon={<BadgeDollarSign className="h-4 w-4 text-gray-400" />}
                  />
                  {getChangeIndicator(data.follow_up_fee, doctor.follow_up_fee.toString())}
                  {data.follow_up_fee !== doctor.follow_up_fee.toString() && (
                    <div className="mt-1 text-xs text-amber-600">
                      Original: ৳{doctor.follow_up_fee}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    id="is_available"
                    name="is_available"
                    type="checkbox"
                    checked={data.is_available}
                    onChange={(e) => handleDataChange('is_available', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_available" className="block text-sm font-medium text-gray-900">
                    Available for appointments
                  </label>
                  {data.is_available !== doctor.is_available && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                      Changed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="relative">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Biography
                </label>
                <div className="relative">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={data.bio}
                    onChange={(e) => handleDataChange('bio', e.target.value)}
                    className={`block w-full rounded-lg border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none ${
                      errors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description about the doctor's experience and expertise"
                  />
                  {data.bio !== (doctor.bio || '') && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {getChangeIndicator(data.bio, doctor.bio)}
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
                {data.bio !== (doctor.bio || '') && (
                  <div className="mt-1 text-xs text-amber-600">
                    Biography has been modified
                  </div>
                )}
              </div>
            </div>

            {/* Changes Summary */}
            {isDirty && (
              <div className="pt-8 border-t border-gray-200">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">Pending Changes Summary</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {data.name !== doctor.user.name && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-amber-700">Name:</span>
                        <span className="text-gray-600">{doctor.user.name}</span>
                        <span>→</span>
                        <span className="font-semibold text-amber-800">{data.name}</span>
                      </div>
                    )}
                    {data.email !== doctor.user.email && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-amber-700">Email:</span>
                        <span className="text-gray-600">{doctor.user.email}</span>
                        <span>→</span>
                        <span className="font-semibold text-amber-800">{data.email}</span>
                      </div>
                    )}
                    {data.specialization !== doctor.specialization && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-amber-700">Specialization:</span>
                        <span className="text-gray-600">{doctor.specialization}</span>
                        <span>→</span>
                        <span className="font-semibold text-amber-800">{data.specialization}</span>
                      </div>
                    )}
                    {data.consultation_fee !== doctor.consultation_fee.toString() && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-amber-700">Fee:</span>
                        <span className="text-gray-600">৳{doctor.consultation_fee}</span>
                        <span>→</span>
                        <span className="font-semibold text-amber-800">৳{data.consultation_fee}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-gray-50 border-t px-8 py-6">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center space-x-2"
                  asChild
                >
                  <Link href={route('doctors.index')}>
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Link>
                </Button>

                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center space-x-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset Changes</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Change Counter */}
                {isDirty && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <Edit3 className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                      {Object.keys(data).filter(key =>
                        data[key as keyof typeof data] !== (doctor as any)[key] &&
                        data[key as keyof typeof data] !== (doctor.user as any)[key]
                      ).length} changes
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={processing || !isDirty}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Update Doctor</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
}
