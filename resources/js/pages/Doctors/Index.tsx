// resources/js/Pages/Doctors/Index.tsx
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
    UserPlus,
    User,
    Phone,
    Check,
    X as XIcon,
    Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        is_active: boolean;
    };
    specialization: string;
    qualification: string;
    consultation_fee: string;
    is_available: boolean;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface DoctorsIndexProps {
    doctors: {
        data: Doctor[];
        links: PaginationLinks[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
}

export default function DoctorsIndex({ doctors }: DoctorsIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('doctors.index'), {
            search: searchTerm,
            availability: availabilityFilter
        }, { preserveState: true });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setAvailabilityFilter(value);
        router.get(route('doctors.index'), {
            search: searchTerm,
            availability: value
        }, { preserveState: true });
    };

    const toggleDoctorAvailability = (id: number, currentStatus: boolean) => {
        router.put(route('doctors.availability', id), {
            is_available: !currentStatus
        }, {
            onSuccess: () => {
                // Status will be updated automatically
            },
            preserveState: true
        });
    };

    return (
        <AdminLayout title="Doctors">
            <Head title="Doctors" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
                    <Input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-r-none focus:z-10"
                        icon={<Search className="h-4 w-4 text-gray-400" />}
                    />
                    <Button type="submit" className="rounded-l-none border border-l-0 border-gray-300">
                        Search
                    </Button>
                </form>

                <Button href={route('doctors.create')} icon={<UserPlus className="h-4 w-4" />}>
                    Add New Doctor
                </Button>
            </div>

            <div className="mb-6 flex items-center">
                <span className="text-sm text-gray-700 mr-2">Filter by availability:</span>
                <select
                    value={availabilityFilter}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Doctor List</h3>
                    <p className="text-sm text-gray-600">
                        Showing {doctors.from} to {doctors.to} of {doctors.total} doctors
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {doctors.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Specialization</TableHead>
                                    <TableHead>Qualification</TableHead>
                                    <TableHead>Fee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {doctors.data.map((doctor) => (
                                    <TableRow key={doctor.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold mr-2">
                                                    {doctor.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">Dr. {doctor.user.name}</p>
                                                    <p className="text-xs text-gray-500">{doctor.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {doctor.user.phone ? (
                                                <div className="flex items-center">
                                                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                    {doctor.user.phone}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Not provided</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{doctor.specialization}</TableCell>
                                        <TableCell>{doctor.qualification}</TableCell>
                                        <TableCell>{formatCurrency(Number(doctor.consultation_fee))}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${doctor.is_available
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {doctor.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                                <span className={`ml-2 w-2 h-2 rounded-full ${doctor.user.is_active ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    href={route('doctors.show', doctor.id)}
                                                    icon={<User className="h-4 w-4" />}
                                                >
                                                    View
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    href={route('doctors.edit', doctor.id)}
                                                    icon={<Calendar className="h-4 w-4" />}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleDoctorAvailability(doctor.id, doctor.is_available)}
                                                    className={doctor.is_available ? 'text-red-600' : 'text-green-600'}
                                                >
                                                    {doctor.is_available ? (
                                                        <>
                                                            <XIcon className="h-4 w-4 mr-1" />
                                                            Set Unavailable
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Set Available
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
                            No doctors found. Please try a different search or add a new doctor.
                        </div>
                    )}
                </div>

                <Pagination links={doctors.links} />
            </div>
        </AdminLayout>
    );
}
