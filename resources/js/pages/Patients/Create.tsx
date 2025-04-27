// resources/js/Pages/Patients/Create.tsx
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
  FileText
} from 'lucide-react';

export default function PatientCreate() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: '',
    gender: '',
    medical_history: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('patients.store'), {
      onSuccess: () => {
        // Form will redirect to patient show page on success
      },
    });
  };

  const cancelForm = () => {
    reset();
    router.visit(route('patients.index'));
  };

  return (
    <AdminLayout title="Register New Patient">
      <Head title="Register New Patient" />

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Patient Registration Form</CardTitle>
          <CardDescription>
            Register a new patient in the system. Fields marked with an asterisk (*) are required.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    icon={<User className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
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
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    error={errors.address}
                    icon={<Home className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={data.date_of_birth}
                    onChange={(e) => setData('date_of_birth', e.target.value)}
                    error={errors.date_of_birth}
                    icon={<Calendar className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <Select
                    id="gender"
                    name="gender"
                    value={data.gender}
                    onChange={(e) => setData('gender', e.target.value)}
                    error={errors.gender}
                    options={[
                      { value: '', label: 'Select gender' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Medical History</h3>

              <div>
                <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Medical Conditions or Notes
                </label>
                <div className="relative">
                  <div className="absolute top-2 left-3 text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <textarea
                    id="medical_history"
                    name="medical_history"
                    rows={4}
                    value={data.medical_history}
                    onChange={(e) => setData('medical_history', e.target.value)}
                    className={`
                      pl-10 block w-full rounded-md border border-gray-300 shadow-sm
                      focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                      ${errors.medical_history ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                  />
                </div>
                {errors.medical_history && (
                  <p className="mt-1 text-sm text-red-600">{errors.medical_history}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={cancelForm}
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={processing}
              icon={<Save className="h-4 w-4" />}
              isLoading={processing}
            >
              Register Patient
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
}
