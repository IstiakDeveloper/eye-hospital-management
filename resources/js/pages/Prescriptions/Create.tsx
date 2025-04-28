import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  User,
  Calendar,
  FileText,
  PlusCircle,
  X,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { formatDate, calculateAge } from '@/lib/utils';

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

interface VisionTest {
  id: number;
  right_eye_vision: string | null;
  left_eye_vision: string | null;
  right_eye_power: number | null;
  left_eye_power: number | null;
  test_date: string;
}

interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  type: string;
}

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  serial_number: string;
}

interface Doctor {
  id: number;
  user: {
    id: number;
    name: string;
  };
}

interface PrescriptionCreateProps {
  patient: Patient;
  medicines: Medicine[];
  latestVisionTest?: VisionTest;
  appointment?: Appointment;
  doctor: Doctor;
}

// Medicine form item type
interface MedicineItem {
  id: string; // Client-side ID for UI management
  medicine_id: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export default function PrescriptionCreate({
  patient,
  medicines,
  latestVisionTest,
  appointment,
  doctor
}: PrescriptionCreateProps) {
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
    {
      id: `med-${Date.now()}`,
      medicine_id: '',
      dosage: '',
      duration: '',
      instructions: ''
    }
  ]);

  // Group medicines by type for easier selection
  const medicinesByType = medicines.reduce((acc, medicine) => {
    if (!acc[medicine.type]) {
      acc[medicine.type] = [];
    }
    acc[medicine.type].push(medicine);
    return acc;
  }, {} as Record<string, Medicine[]>);

  const medicineTypes = Object.keys(medicinesByType).sort();

  const { data, setData, post, processing, errors } = useForm({
    patient_id: patient.id,
    doctor_id: doctor.id,
    appointment_id: appointment?.id || '',
    diagnosis: '',
    advice: '',
    notes: '',
    followup_date: '',
    medicines: [] as any[], // Will be populated before submission
  });

  const addMedicineItem = () => {
    setMedicineItems([
      ...medicineItems,
      {
        id: `med-${Date.now()}`,
        medicine_id: '',
        dosage: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const removeMedicineItem = (id: string) => {
    if (medicineItems.length === 1) {
      return; // Keep at least one medicine item
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

    // Validate medicines
    const isValid = medicineItems.every(item => item.medicine_id && item.dosage);

    if (!isValid) {
      alert('Please select medicine and specify dosage for all medications');
      return;
    }

    // Format medicines for submission
    const formattedMedicines = medicineItems.map(item => ({
      medicine_id: item.medicine_id,
      dosage: item.dosage,
      duration: item.duration,
      instructions: item.instructions
    }));

    // Update the data form with medicines
    setData({ ...data, medicines: formattedMedicines });

    // Submit the form
    post(route('prescriptions.store', patient.id), {
      onSuccess: () => {
        // Will redirect to prescription show page
      }
    });
  };

  return (
    <AdminLayout title="Create Prescription">
      <Head title="Create Prescription" />

      <div className="mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Patient Information</h3>
              <div className="mt-2 text-sm text-blue-700 flex flex-wrap gap-x-6">
                <p>
                  <span className="font-semibold">ID:</span> {patient.patient_id}
                </p>
                <p>
                  <span className="font-semibold">Name:</span> {patient.name}
                </p>
                {patient.date_of_birth && (
                  <p>
                    <span className="font-semibold">Age:</span> {calculateAge(patient.date_of_birth)} years
                  </p>
                )}
                {patient.gender && (
                  <p>
                    <span className="font-semibold">Gender:</span> {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {appointment && (
          <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Appointment Details</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    <span className="font-semibold">Date:</span> {formatDate(appointment.appointment_date)}
                    <span className="font-semibold ml-4">Time:</span> {appointment.appointment_time}
                    <span className="font-semibold ml-4">Serial:</span> {appointment.serial_number}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prescription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Vision Test */}
            {latestVisionTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-500" /> Latest Vision Test
                  </CardTitle>
                  <CardDescription>
                    Test date: {formatDate(latestVisionTest.test_date)}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">Vision</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Right Eye</p>
                          <p className="text-gray-900">{latestVisionTest.right_eye_vision || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Left Eye</p>
                          <p className="text-gray-900">{latestVisionTest.left_eye_vision || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">Power</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Right Eye</p>
                          <p className="text-gray-900">{latestVisionTest.right_eye_power !== null ? latestVisionTest.right_eye_power : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Left Eye</p>
                          <p className="text-gray-900">{latestVisionTest.left_eye_power !== null ? latestVisionTest.left_eye_power : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Diagnosis and Treatment */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis and Treatment</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis
                  </label>
                  <textarea
                    id="diagnosis"
                    value={data.diagnosis}
                    onChange={(e) => setData('diagnosis', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter diagnosis details..."
                  ></textarea>
                  {errors.diagnosis && (
                    <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="advice" className="block text-sm font-medium text-gray-700 mb-1">
                    Advice / Recommendations
                  </label>
                  <textarea
                    id="advice"
                    value={data.advice}
                    onChange={(e) => setData('advice', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter advice or recommendations..."
                  ></textarea>
                  {errors.advice && (
                    <p className="mt-1 text-sm text-red-600">{errors.advice}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                    placeholder="Any additional notes..."
                  ></textarea>
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="followup_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date (if needed)
                  </label>
                  <Input
                    id="followup_date"
                    type="date"
                    value={data.followup_date}
                    onChange={(e) => setData('followup_date', e.target.value)}
                    error={errors.followup_date}
                    min={formatDate(new Date(), 'yyyy-MM-dd')}
                    icon={<Calendar className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Medicines */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" /> Medicines
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addMedicineItem}
                    className="ml-2"
                    icon={<PlusCircle className="h-4 w-4" />}
                  >
                    Add Medicine
                  </Button>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {medicineItems.map((item, index) => (
                  <div key={item.id} className="border rounded-md p-4 relative">
                    {medicineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineItem(item.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medicine Type
                        </label>
                        <Select
                          value=""
                          onChange={(e) => {}}
                          options={[
                            { value: '', label: 'Select medicine type' },
                            ...medicineTypes.map(type => ({ value: type, label: type }))
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medicine Name *
                        </label>
                        <Select
                          value={item.medicine_id}
                          onChange={(e) => updateMedicineItem(item.id, 'medicine_id', e.target.value)}
                          options={[
                            { value: '', label: 'Select medicine' },
                            ...medicines.map(medicine => ({
                              value: medicine.id.toString(),
                              label: `${medicine.name} ${medicine.generic_name ? `(${medicine.generic_name})` : ''}`
                            }))
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage *
                        </label>
                        <Input
                          value={item.dosage}
                          onChange={(e) => updateMedicineItem(item.id, 'dosage', e.target.value)}
                          placeholder="e.g., 1-0-1, 0-0-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <Input
                            value={item.duration}
                            onChange={(e) => updateMedicineItem(item.id, 'duration', e.target.value)}
                            placeholder="e.g., 7 days, 2 weeks"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <Input
                            value={item.instructions}
                            onChange={(e) => updateMedicineItem(item.id, 'instructions', e.target.value)}
                            placeholder="e.g., After meal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {medicineItems.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No medicines added yet</p>
                    <Button
                      type="button"
                      onClick={addMedicineItem}
                      className="mt-2"
                      size="sm"
                    >
                      Add Medicine
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button
            type="button"
            variant="outline"
            icon={<X className="h-4 w-4" />}
            href={route('patients.show', patient.id)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={processing}
            icon={<Save className="h-4 w-4" />}
            isLoading={processing}
          >
            Save Prescription
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
