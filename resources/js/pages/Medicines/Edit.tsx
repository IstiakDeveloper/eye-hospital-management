import React from 'react';
import { Head, useForm } from '@inertiajs/react';
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
import { Save, X, Pill, Trash2 } from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  type: string;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
}

interface MedicineEditProps {
  medicine: Medicine;
  types: string[];
}

export default function MedicineEdit({ medicine, types }: MedicineEditProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: medicine.name,
    generic_name: medicine.generic_name || '',
    type: medicine.type,
    manufacturer: medicine.manufacturer || '',
    description: medicine.description || '',
    is_active: medicine.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('medicines.update', medicine.id));
  };

  // Add medicine's current type to types array if it's not already there
  if (!types.includes(medicine.type)) {
    types = [...types, medicine.type];
  }

  return (
    <AdminLayout title="Edit Medicine">
      <Head title="Edit Medicine" />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Pill className="h-5 w-5 mr-2 text-blue-500" />
            Edit Medicine
          </CardTitle>
          <CardDescription>
            Update the details of {medicine.name}.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  error={errors.name}
                />
              </div>

              <div>
                <label htmlFor="generic_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Generic Name
                </label>
                <Input
                  id="generic_name"
                  name="generic_name"
                  value={data.generic_name}
                  onChange={(e) => setData('generic_name', e.target.value)}
                  error={errors.generic_name}
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Type *
                </label>
                <Select
                  id="type"
                  name="type"
                  value={data.type}
                  onChange={(e) => setData('type', e.target.value)}
                  error={errors.type}
                  options={[
                    { value: '', label: 'Select medicine type' },
                    ...types.map(type => ({ value: type, label: type })),
                    { value: 'other', label: 'Other' }
                  ]}
                />
                {data.type === 'other' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom type"
                    value={data.type === 'other' ? '' : data.type}
                    onChange={(e) => setData('type', e.target.value)}
                  />
                )}
              </div>

              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={data.manufacturer}
                  onChange={(e) => setData('manufacturer', e.target.value)}
                  error={errors.manufacturer}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className={`block w-full rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active (Available for prescription)
                </label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                icon={<X className="h-4 w-4" />}
                href={route('medicines.index')}
              >
                Cancel
              </Button>

              {/* <Button
                type="button"
                variant="destructive"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this medicine?')) {
                    router.delete(route('medicines.destroy', medicine.id));
                  }
                }}
              >
                Delete
              </Button> */}
            </div>

            <Button
              type="submit"
              disabled={processing}
              icon={<Save className="h-4 w-4" />}
              isLoading={processing}
            >
              Update Medicine
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
}
