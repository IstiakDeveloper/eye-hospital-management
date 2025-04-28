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
import {
  Search,
  Pill,
  Plus,
  Edit,
  Check,
  X as XIcon,
  Filter
} from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  type: string;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
}

interface PaginationLinks {
  url: string | null;
  label: string;
  active: boolean;
}

interface MedicinesIndexProps {
  medicines: {
    data: Medicine[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
  };
  types: string[];
}

export default function MedicinesIndex({ medicines, types }: MedicinesIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('medicines.index'), { search: searchTerm, type: typeFilter, status: statusFilter }, { preserveState: true });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setTypeFilter(value);
    } else if (name === 'status') {
      setStatusFilter(value);
    }
    router.get(route('medicines.index'), {
      search: searchTerm,
      type: name === 'type' ? value : typeFilter,
      status: name === 'status' ? value : statusFilter
    }, { preserveState: true });
  };

  const toggleMedicineStatus = (id: number, currentStatus: boolean) => {
    router.put(route('medicines.toggle', id), {}, {
      onSuccess: () => {
        // Status will be updated automatically
      },
      preserveState: true
    });
  };

  return (
    <AdminLayout title="Medicines">
      <Head title="Medicines" />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-r-none focus:z-10"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          <Button type="submit" className="rounded-l-none border border-l-0 border-gray-300">
            Search
          </Button>
        </form>

        <Button href={route('medicines.create')} icon={<Plus className="h-4 w-4" />}>
          Add New Medicine
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm text-gray-700 mr-2">Filter by:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
          <select
            name="type"
            value={typeFilter}
            onChange={handleFilterChange}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {types?.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            name="status"
            value={statusFilter}
            onChange={handleFilterChange}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Medicine List</h3>
          <p className="text-sm text-gray-600">
            Showing {medicines.from} to {medicines.to} of {medicines.total} medicines
          </p>
        </div>

        <div className="overflow-x-auto">
          {medicines.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.data.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.generic_name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {medicine.type}
                      </span>
                    </TableCell>
                    <TableCell>{medicine.manufacturer || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        medicine.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {medicine.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          href={route('medicines.edit', medicine.id)}
                          icon={<Edit className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMedicineStatus(medicine.id, medicine.is_active)}
                          className={medicine.is_active ? 'text-red-600' : 'text-green-600'}
                        >
                          {medicine.is_active ? (
                            <>
                              <XIcon className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No medicines found. Please try a different search or add a new medicine.
            </div>
          )}
        </div>

        <Pagination links={medicines.links} />
      </div>
    </AdminLayout>
  );
}
