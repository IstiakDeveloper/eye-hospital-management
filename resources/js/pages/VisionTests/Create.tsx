// resources/js/Pages/VisionTests/Create.tsx
import React from 'react';
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
import { calculateAge } from '@/lib/utils';
import { Save, X, FileText, Eye, AlertCircle } from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
}

interface LatestTest {
  id: number;
  right_eye_vision: string | null;
  left_eye_vision: string | null;
  right_eye_power: number | null;
  left_eye_power: number | null;
  right_eye_pressure: string | null;
  left_eye_pressure: string | null;
  additional_notes: string | null;
}

interface VisionTestCreateProps {
  patient: Patient;
  latestTest: LatestTest | null;
}

export default function VisionTestCreate({ patient, latestTest }: VisionTestCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    right_eye_vision: latestTest?.right_eye_vision || '',
    left_eye_vision: latestTest?.left_eye_vision || '',
    right_eye_power: latestTest?.right_eye_power?.toString() || '',
    left_eye_power: latestTest?.left_eye_power?.toString() || '',
    right_eye_pressure: latestTest?.right_eye_pressure || '',
    left_eye_pressure: latestTest?.left_eye_pressure || '',
    additional_notes: latestTest?.additional_notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('visiontests.store', patient.id));
  };

  return (
    <AdminLayout title="Record Vision Test">
      <Head title="Record Vision Test" />

      <div className="mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
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
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Record Vision Test</CardTitle>
          <CardDescription>
            Enter the vision test results for this patient.
            {latestTest && " Previous test results are pre-filled for reference."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Vision */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Eye className="mr-2 h-5 w-5 text-gray-500" />
                Vision
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="right_eye_vision" className="block text-sm font-medium text-gray-700 mb-1">
                    Right Eye Vision
                  </label>
                  <Input
                    id="right_eye_vision"
                    name="right_eye_vision"
                    value={data.right_eye_vision}
                    onChange={(e) => setData('right_eye_vision', e.target.value)}
                    error={errors.right_eye_vision}
                    placeholder="e.g., 6/6, 6/9, 6/12"
                  />
                </div>

                <div>
                  <label htmlFor="left_eye_vision" className="block text-sm font-medium text-gray-700 mb-1">
                    Left Eye Vision
                  </label>
                  <Input
                    id="left_eye_vision"
                    name="left_eye_vision"
                    value={data.left_eye_vision}
                    onChange={(e) => setData('left_eye_vision', e.target.value)}
                    error={errors.left_eye_vision}
                    placeholder="e.g., 6/6, 6/9, 6/12"
                  />
                </div>
              </div>
            </div>

            {/* Power */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Power</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="right_eye_power" className="block text-sm font-medium text-gray-700 mb-1">
                    Right Eye Power
                  </label>
                  <Input
                    id="right_eye_power"
                    name="right_eye_power"
                    type="number"
                    step="0.25"
                    value={data.right_eye_power}
                    onChange={(e) => setData('right_eye_power', e.target.value)}
                    error={errors.right_eye_power}
                    placeholder="e.g., -1.25, +2.00"
                  />
                </div>

                <div>
                  <label htmlFor="left_eye_power" className="block text-sm font-medium text-gray-700 mb-1">
                    Left Eye Power
                  </label>
                  <Input
                    id="left_eye_power"
                    name="left_eye_power"
                    type="number"
                    step="0.25"
                    value={data.left_eye_power}
                    onChange={(e) => setData('left_eye_power', e.target.value)}
                    error={errors.left_eye_power}
                    placeholder="e.g., -1.25, +2.00"
                  />
                </div>
              </div>
            </div>

            {/* Pressure */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Eye Pressure</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="right_eye_pressure" className="block text-sm font-medium text-gray-700 mb-1">
                    Right Eye Pressure
                  </label>
                  <Input
                    id="right_eye_pressure"
                    name="right_eye_pressure"
                    value={data.right_eye_pressure}
                    onChange={(e) => setData('right_eye_pressure', e.target.value)}
                    error={errors.right_eye_pressure}
                    placeholder="e.g., 14 mmHg"
                  />
                </div>

                <div>
                  <label htmlFor="left_eye_pressure" className="block text-sm font-medium text-gray-700 mb-1">
                    Left Eye Pressure
                  </label>
                  <Input
                    id="left_eye_pressure"
                    name="left_eye_pressure"
                    value={data.left_eye_pressure}
                    onChange={(e) => setData('left_eye_pressure', e.target.value)}
                    error={errors.left_eye_pressure}
                    placeholder="e.g., 15 mmHg"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-gray-500" />
                Additional Notes
              </h3>

              <div>
                <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes and Observations
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={4}
                  value={data.additional_notes}
                  onChange={(e) => setData('additional_notes', e.target.value)}
                  className={`
                    block w-full rounded-md border border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                    ${errors.additional_notes ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder="Enter any additional observations or notes"
                />
                {errors.additional_notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.additional_notes}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
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
              Save Vision Test
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
}
