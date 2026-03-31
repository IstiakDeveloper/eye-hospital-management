import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Check,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    Filter,
    GraduationCap,
    Mail,
    Phone,
    Search,
    Stethoscope,
    TrendingUp,
    User,
    UserPlus,
    Users,
    X as XIcon,
} from 'lucide-react';
import React, { useState } from 'react';

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
    follow_up_fee: string;
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
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            await router.get(
                route('doctors.index'),
                {
                    search: searchTerm,
                    availability: availabilityFilter,
                },
                { preserveState: true },
            );
        } finally {
            setIsSearching(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setAvailabilityFilter(value);
        router.get(
            route('doctors.index'),
            {
                search: searchTerm,
                availability: value,
            },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setAvailabilityFilter('all');
        router.get(route('doctors.index'), {}, { preserveState: true });
    };

    const toggleDoctorAvailability = (id: number, currentStatus: boolean) => {
        router.put(
            route('doctors.availability', id),
            {
                is_available: !currentStatus,
            },
            {
                onSuccess: () => {
                    // Status will be updated automatically
                },
                preserveState: true,
            },
        );
    };

    // Calculate stats
    const totalDoctors = doctors.total;
    const currentPageCount = doctors.data.length;
    const availableDoctors = doctors.data.filter((d) => d.is_available).length;
    const unavailableDoctors = doctors.data.filter((d) => !d.is_available).length;
    const activeDoctors = doctors.data.filter((d) => d.user.is_active).length;
    const avgFee =
        doctors.data.length > 0 ? Math.round(doctors.data.reduce((sum, d) => sum + Number(d.consultation_fee), 0) / doctors.data.length) : 0;

    const getStatusBadge = (isAvailable: boolean, isActive: boolean) => {
        if (!isActive) {
            return (
                <Badge className="border-red-200 bg-red-50 font-medium text-red-700">
                    <XIcon className="mr-1 h-3 w-3" />
                    Inactive
                </Badge>
            );
        }

        return isAvailable ? (
            <Badge className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Available
            </Badge>
        ) : (
            <Badge className="border-amber-200 bg-amber-50 font-medium text-amber-700">
                <Clock className="mr-1 h-3 w-3" />
                Unavailable
            </Badge>
        );
    };

    const getSpecializationBadge = (specialization: string) => {
        const colors = [
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-purple-50 text-purple-700 border-purple-200',
            'bg-green-50 text-green-700 border-green-200',
            'bg-orange-50 text-orange-700 border-orange-200',
            'bg-pink-50 text-pink-700 border-pink-200',
            'bg-indigo-50 text-indigo-700 border-indigo-200',
        ];

        const colorIndex = specialization.length % colors.length;
        return (
            <Badge className={`${colors[colorIndex]} font-medium`}>
                <Stethoscope className="mr-1 h-3 w-3" />
                {specialization}
            </Badge>
        );
    };

    return (
        <AdminLayout title="Doctors Management">
            <Head title="Doctors Management" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">Doctors Management</h1>
                        <p className="text-gray-600">Manage your medical team and doctor profiles</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                            Export Data
                        </Button>
                        <Button href={route('doctors.create')} leftIcon={<UserPlus className="h-4 w-4" />} size="lg">
                            Add New Doctor
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-6">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-blue-600">Total Doctors</p>
                                <p className="text-3xl font-bold text-blue-900">{totalDoctors}</p>
                            </div>
                            <div className="rounded-xl bg-blue-500 p-3">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-emerald-600">Available</p>
                                <p className="text-3xl font-bold text-emerald-900">{availableDoctors}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-500 p-3">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-amber-600">Unavailable</p>
                                <p className="text-3xl font-bold text-amber-900">{unavailableDoctors}</p>
                            </div>
                            <div className="rounded-xl bg-amber-500 p-3">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-purple-600">Active</p>
                                <p className="text-3xl font-bold text-purple-900">{activeDoctors}</p>
                            </div>
                            <div className="rounded-xl bg-purple-500 p-3">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-green-600">Avg. Fee</p>
                                <p className="text-3xl font-bold text-green-900">{formatCurrency(avgFee)}</p>
                            </div>
                            <div className="rounded-xl bg-green-500 p-3">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-indigo-600">This Page</p>
                                <p className="text-3xl font-bold text-indigo-900">{currentPageCount}</p>
                            </div>
                            <div className="rounded-xl bg-indigo-500 p-3">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-8 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="flex items-center space-x-2">
                        <Search className="h-5 w-5 text-gray-600" />
                        <span>Search & Filters</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-4 lg:flex-row">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by name, email, phone, or specialization..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<Search className="h-4 w-4" />}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit" isLoading={isSearching} loadingText="Searching..." className="min-w-[120px]">
                                Search
                            </Button>
                            {(searchTerm || availabilityFilter !== 'all') && (
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </form>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter by availability:</span>
                        </div>

                        <div className="max-w-xs flex-1">
                            <select
                                value={availabilityFilter}
                                onChange={handleFilterChange}
                                className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                            >
                                <option value="all">All Doctors</option>
                                <option value="available">Available Only</option>
                                <option value="unavailable">Unavailable Only</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Stethoscope className="h-5 w-5 text-gray-600" />
                            <span>Medical Team Directory</span>
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                            <p className="rounded-lg border bg-white px-3 py-1 text-sm text-gray-600">
                                Showing <span className="font-semibold">{doctors.from}</span> to <span className="font-semibold">{doctors.to}</span>{' '}
                                of <span className="font-semibold">{doctors.total}</span> doctors
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {doctors.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="py-4 font-bold text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4" />
                                                <span>Doctor Profile</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">Contact Information</TableHead>
                                        <TableHead className="font-bold text-gray-800">Specialization</TableHead>
                                        <TableHead className="font-bold text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <GraduationCap className="h-4 w-4" />
                                                <span>Qualification</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-4 w-4" />
                                                <span>Consultation Fee</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-4 w-4" />
                                                <span>Follow-up Fee</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-bold text-gray-800">Status</TableHead>
                                        <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doctors.data.map((doctor, index) => (
                                        <TableRow key={doctor.id} className="group transition-colors duration-200 hover:bg-blue-50">
                                            <TableCell className="py-4 font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white">
                                                        {doctor.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">Dr. {doctor.user.name}</p>
                                                        <p className="flex items-center space-x-1 text-xs text-gray-500">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{doctor.user.email}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {doctor.user.phone ? (
                                                    <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-gray-900">{doctor.user.phone}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-500">Not provided</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell>{getSpecializationBadge(doctor.specialization)}</TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{doctor.qualification}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2 rounded-lg bg-green-50 p-2">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                    <span className="font-bold text-green-900">
                                                        {formatCurrency(Number(doctor.consultation_fee))}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2 rounded-lg bg-blue-50 p-2">
                                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                                    <span className="font-bold text-blue-900">
                                                        {formatCurrency(Number(doctor.follow_up_fee || 0))}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(doctor.is_available, doctor.user.is_active)}
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${doctor.user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    ></div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('doctors.show', doctor.id)}
                                                        className="transition-all duration-300 group-hover:scale-110 hover:bg-blue-100"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        href={route('doctors.edit', doctor.id)}
                                                        className="transition-all duration-300 group-hover:scale-110 hover:bg-gray-100"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => toggleDoctorAvailability(doctor.id, doctor.is_available)}
                                                        className={`transition-all duration-300 group-hover:scale-110 ${
                                                            doctor.is_available
                                                                ? 'text-red-600 hover:bg-red-100 hover:text-red-800'
                                                                : 'text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800'
                                                        }`}
                                                    >
                                                        {doctor.is_available ? <XIcon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                                <Stethoscope className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-gray-900">No doctors found</h3>
                            <p className="mx-auto mb-6 max-w-md text-gray-500">
                                {searchTerm || availabilityFilter !== 'all'
                                    ? 'No doctors match your current search and filter criteria. Try adjusting your filters.'
                                    : 'Get started by adding your first doctor to the team.'}
                            </p>
                            <div className="flex justify-center space-x-3">
                                {(searchTerm || availabilityFilter !== 'all') && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                                <Button href={route('doctors.create')} leftIcon={<UserPlus className="h-4 w-4" />}>
                                    Add First Doctor
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>

                {doctors.data.length > 0 && (
                    <div className="border-t bg-gray-50 px-6 py-4">
                        <Pagination links={doctors.links} />
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}
