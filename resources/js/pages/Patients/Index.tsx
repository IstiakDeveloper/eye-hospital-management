import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import { formatDate, calculateAge } from '@/lib/utils';
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Calendar,
  FileText
} from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
}

interface PaginationLinks {
  url: string | null;
  label: string;
  active: boolean;
}

interface PatientsIndexProps {
  patients: {
    data: Patient[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
  };
}

export default function PatientsIndex({ patients }: PatientsIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('patients.index'), { search: searchTerm }, { preserveState: true });
  };

  return (
    <AdminLayout title="Patients">
      <Head title="Patients" />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-r-none focus:z-10"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          <Button type="submit" className="rounded-l-none border border-l-0 border-gray-300">
            Search
          </Button>
        </form>

        <Button href={route('patients.create')} icon={<UserPlus className="h-4 w-4" />}>
          Add New Patient
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Patient List</h3>
          <p className="text-sm text-gray-600">
            Showing {patients.from} to {patients.to} of {patients.total} patients
          </p>
        </div>

        <div className="overflow-x-auto">
          {patients.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.data.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.patient_id}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>
                      {patient.date_of_birth && `${calculateAge(patient.date_of_birth)} years`}
                      {patient.gender && patient.date_of_birth && ', '}
                      {patient.gender && patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{formatDate(patient.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost" href={route('patients.show', patient.id)} icon={<Eye className="h-4 w-4" />}>
                          View
                        </Button>
                        <Button size="sm" variant="ghost" href={route('appointments.create.patient', patient.id)} icon={<Calendar className="h-4 w-4" />}>
                          Appointment
                        </Button>
                        <Button size="sm" variant="ghost" href={route('visiontests.create', patient.id)} icon={<FileText className="h-4 w-4" />}>
                          Vision Test
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No patients found. Please try a different search or add a new patient.
            </div>
          )}
        </div>

        <Pagination links={patients.links} />
      </div>
    </AdminLayout>
  );
}
