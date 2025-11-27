// resources/js/Pages/Appointments/Create.tsx
import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
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
  Calendar,
  Clock,
  User,
  UserPlus,
  Search,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string;
}

interface Doctor {
  id: number;
  user: {
    id: number;
    name: string;
  };
  specialization: string;
  consultation_fee: string;
  is_available: boolean;
}

interface AppointmentCreateProps {
  patient?: Patient;
  doctors: Doctor[];
}

export default function AppointmentCreate({ patient, doctors }: AppointmentCreateProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  const { data, setData, post, processing, errors, reset } = useForm({
    patient_id: patient ? patient.id : '',
    doctor_id: '',
    appointment_date: formatDate(new Date(), 'yyyy-MM-dd'),
    appointment_time: '',
  });

  const handleSelectPatient = (selectedPatient: Patient) => {
    setData('patient_id', selectedPatient.id);
    setIsSearching(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTerm.length < 2) return;

    try {
      const response = await fetch(route('patients.search', { term: searchTerm }));
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('appointments.store'), {
      onSuccess: () => {
        // Will redirect to appointment show page
      },
    });
  };

  const availableDoctors = doctors.filter(doctor => doctor.is_available);

  return (
    <AdminLayout title="Create Appointment">
      <Head title="Create Appointment" />

      <div className="max-w-4xl mx-auto">
        {!patient && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
                <CardDescription>
                  Search for an existing patient or create a new one.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {data.patient_id ? (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Selected Patient:</span> {searchResults.find(p => p.id === Number(data.patient_id))?.name || 'Patient'}
                        </p>
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setData('patient_id', '');
                              setIsSearching(false);
                            }}
                          >
                            Change Patient
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-grow">
                        <form onSubmit={handleSearch} className="flex w-full">
                          <Input
                            type="text"
                            placeholder="Search patients by name, phone, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="rounded-r-none focus:z-10"
                            icon={<Search className="h-4 w-4 text-gray-400" />}
                          />
                          <Button type="submit" className="rounded-l-none">
                            Search
                          </Button>
                        </form>
                      </div>

                      <div>
                        <Button
                          href={route('patients.create')}
                          icon={<UserPlus className="h-4 w-4" />}
                        >
                          New Patient
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b">
                          <h3 className="text-sm font-medium text-gray-700">
                            Search Results ({searchResults.length})
                          </h3>
                        </div>
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                          {searchResults.map((result) => (
                            <li key={result.id} className="px-4 py-3 hover:bg-gray-50">
                              <button
                                type="button"
                                className="w-full text-left"
                                onClick={() => handleSelectPatient(result)}
                              >
                                <div className="flex justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{result.name}</p>
                                    <p className="text-xs text-gray-500">ID: {result.patient_id}</p>
                                  </div>
                                  <p className="text-sm text-gray-600">{result.phone}</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {errors.patient_id && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <p className="text-sm">{errors.patient_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
              <CardDescription>
                Select a doctor, date, and time for the appointment.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {patient && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Patient:</span> {patient.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">ID:</span> {patient.patient_id} |
                        <span className="font-medium ml-2">Phone:</span> {patient.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Doctor *
                  </label>
                  <Select
                    id="doctor_id"
                    name="doctor_id"
                    value={data.doctor_id}
                    onChange={(e) => setData('doctor_id', e.target.value)}
                    error={errors.doctor_id}
                    options={[
                      { value: '', label: 'Select a doctor' },
                      ...availableDoctors.map(doctor => ({
                        value: doctor.id.toString(),
                        label: `Dr. ${doctor.user.name} (${doctor.specialization})`
                      }))
                    ]}
                  />
                  {availableDoctors.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No doctors are currently available. Please contact the administrator.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date *
                    </label>
                    <Input
                      id="appointment_date"
                      name="appointment_date"
                      type="date"
                      value={data.appointment_date}
                      onChange={(e) => setData('appointment_date', e.target.value)}
                      error={errors.appointment_date}
                      min={formatDate(new Date(), 'yyyy-MM-dd')}
                      icon={<Calendar className="h-4 w-4 text-gray-400" />}
                    />
                  </div>

                  <div>
                    <label htmlFor="appointment_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Time *
                    </label>
                    <Input
                      id="appointment_time"
                      name="appointment_time"
                      type="time"
                      value={data.appointment_time}
                      onChange={(e) => setData('appointment_time', e.target.value)}
                      error={errors.appointment_time}
                      icon={<Clock className="h-4 w-4 text-gray-400" />}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                icon={<X className="h-4 w-4" />}
                href={patient ? route('patients.show', patient.id) : route('appointments.index')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={processing || !data.doctor_id || !data.patient_id}
                icon={<Save className="h-4 w-4" />}
                isLoading={processing}
              >
                Create Appointment
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
