import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
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
import { Save, X, UserPlus, User as UserIcon, Mail, Phone, GraduationCap, Stethoscope, BadgeDollarSign } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface DoctorCreateProps {
  user?: User;
}

export default function DoctorCreate({ user }: DoctorCreateProps) {
  const [creatingNewUser, setCreatingNewUser] = useState(!user);

  const { data, setData, post, processing, errors } = useForm({
    // User data
    user_id: user ? user.id : '',
    name: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone || '' : '',
    password: '',
    password_confirmation: '',

    // Doctor profile data
    specialization: '',
    qualification: '',
    bio: '',
    consultation_fee: '',
    follow_up_fee: '',
    is_available: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('doctors.store'));
  };

  const toggleUserCreation = () => {
    setCreatingNewUser(!creatingNewUser);

    if (!creatingNewUser && user) {
      // Reset form to selected user data
      setData({
        ...data,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
      });
    } else {
      // Clear user data for new user creation
      setData({
        ...data,
        user_id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
      });
    }
  };

  return (
    <AdminLayout title="Add New Doctor">
      <Head title="Add New Doctor" />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-500" />
            Add New Doctor
          </CardTitle>
          <CardDescription>
            {user
              ? 'Create a doctor profile for the selected user.'
              : 'Create a new user account and doctor profile.'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* User Account Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">User Account</h3>

                {user && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleUserCreation}
                  >
                    {creatingNewUser ? 'Use Selected User' : 'Create New User'}
                  </Button>
                )}
              </div>

              {!creatingNewUser && user ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Selected User</h3>
                      <div className="mt-2 text-sm text-blue-700 space-y-1">
                        <p><span className="font-semibold">Name:</span> {user.name}</p>
                        <p><span className="font-semibold">Email:</span> {user.email}</p>
                        <p><span className="font-semibold">Phone:</span> {user.phone || 'N/A'}</p>
                      </div>
                      <input type="hidden" name="user_id" value={user.id} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      error={errors.name}
                      icon={<UserIcon className="h-4 w-4 text-gray-400" />}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      error={errors.email}
                      icon={<Mail className="h-4 w-4 text-gray-400" />}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      error={errors.phone}
                      icon={<Phone className="h-4 w-4 text-gray-400" />}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      error={errors.password}
                    />
                  </div>

                  <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Profile Information */}
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Doctor Profile</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={data.specialization}
                    onChange={(e) => setData('specialization', e.target.value)}
                    error={errors.specialization}
                    icon={<Stethoscope className="h-4 w-4 text-gray-400" />}
                    placeholder="e.g., Ophthalmologist"
                  />
                </div>

                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification *
                  </label>
                  <Input
                    id="qualification"
                    name="qualification"
                    value={data.qualification}
                    onChange={(e) => setData('qualification', e.target.value)}
                    error={errors.qualification}
                    icon={<GraduationCap className="h-4 w-4 text-gray-400" />}
                    placeholder="e.g., MBBS, MS (Ophthalmology)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Biography
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    className={`block w-full rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description about the doctor's experience and expertise"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee *
                  </label>
                  <Input
                    id="consultation_fee"
                    name="consultation_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.consultation_fee}
                    onChange={(e) => setData('consultation_fee', e.target.value)}
                    error={errors.consultation_fee}
                    icon={<BadgeDollarSign className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <div>
                  <label htmlFor="follow_up_fee" className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Fee
                  </label>
                  <Input
                    id="follow_up_fee"
                    name="follow_up_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.follow_up_fee}
                    onChange={(e) => setData('follow_up_fee', e.target.value)}
                    error={errors.follow_up_fee}
                    icon={<BadgeDollarSign className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="is_available"
                    name="is_available"
                    type="checkbox"
                    checked={data.is_available}
                    onChange={(e) => setData('is_available', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                    Available for appointments
                  </label>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              icon={<X className="h-4 w-4" />}
              href={route('doctors.index')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={processing}
              icon={<Save className="h-4 w-4" />}
              isLoading={processing}
            >
              Save Doctor
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
}
