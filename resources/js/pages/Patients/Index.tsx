import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/admin-layout';
import {
    Search,
    Plus,
    Eye,
    Phone,
    Filter,
    Users,
    Edit,
    MapPin
} from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    nid_card?: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    registered_by?: User;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: Patient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    patients: PaginatedData;
    filters: {
        search?: string;
        gender?: string;
    };
}

export default function Index({ patients, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [genderFilter, setGenderFilter] = useState(filters.gender || '');

    // Realtime search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route('patients.index'), {
                search: searchTerm,
                gender: genderFilter,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [searchTerm, genderFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Form submit will be handled by useEffect
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const calculateAge = (dateOfBirth?: string) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <AdminLayout>
            <Head title="Patients" />

            <div className="p-6">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Patients</h1>
                        <p className="text-xs text-gray-500">Manage patient records and information</p>
                    </div>
                    <Link
                        href={route('patients.create')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                    >
                        <Plus className="h-3 w-3" />
                        Add Patient
                    </Link>
                </div>

                {/* Compact Search Bar */}
                <div className="flex items-center gap-3 mb-4">
                    <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, NID or patient ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        <button
                            type="button"
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200"
                            onClick={() => {
                                setSearchTerm('');
                                setGenderFilter('');
                            }}
                        >
                            Clear
                        </button>
                    </form>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Total Patients</p>
                                <p className="text-sm font-semibold text-blue-700">{patients.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3 w-3 text-green-600" />
                            <div>
                                <p className="text-xs text-green-600 font-medium">This Page</p>
                                <p className="text-sm font-semibold text-green-700">{patients.data.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <Search className="h-3 w-3 text-purple-600" />
                            <div>
                                <p className="text-xs text-purple-600 font-medium">Page {patients.current_page} of {patients.last_page}</p>
                                <p className="text-sm font-semibold text-purple-700">{patients.per_page}/page</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Table */}
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {patients.data.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-blue-600">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{patient.name}</p>
                                                <p className="text-xs text-gray-500">ID: {patient.patient_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <Phone className="h-2.5 w-2.5" />
                                                {patient.phone}
                                            </div>
                                            {patient.nid_card && (
                                                <p className="text-xs text-gray-500">NID: {patient.nid_card}</p>
                                            )}
                                            {patient.email && (
                                                <p className="text-xs text-gray-500">{patient.email}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                {patient.gender && (
                                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                                        patient.gender === 'male'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : patient.gender === 'female'
                                                            ? 'bg-pink-100 text-pink-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'O'}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-600">Age: {calculateAge(patient.date_of_birth)}</span>
                                            </div>
                                            {patient.address && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    <span className="truncate max-w-24">{patient.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div>
                                            <p className="text-xs text-gray-600">{formatDate(patient.created_at)}</p>
                                            {patient.registered_by && (
                                                <p className="text-xs text-gray-500">by {patient.registered_by.name}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link
                                                href={route('patients.show', patient.id)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                            >
                                                <Eye className="h-3 w-3" />
                                                View
                                            </Link>
                                            <Link
                                                href={route('patients.edit', patient.id)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {patients.data.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-8 w-8 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                            <p className="mt-1 text-xs text-gray-500">Get started by creating a new patient record.</p>
                            <div className="mt-4">
                                <Link
                                    href={route('patients.create')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Patient
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compact Pagination */}
                {patients.total > patients.per_page && (
                    <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-700">
                            Showing {((patients.current_page - 1) * patients.per_page) + 1} to{' '}
                            {Math.min(patients.current_page * patients.per_page, patients.total)} of{' '}
                            {patients.total} results
                        </div>
                        <div className="flex gap-1">
                            {patients.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span
                                            key={index}
                                            className="px-2 py-1 text-xs text-gray-400 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-2 py-1 text-xs font-medium rounded ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
