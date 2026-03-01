import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search,
    Plus,
    Eye,
    Phone,
    Filter,
    Users,
    Edit,
    MapPin,
    Calendar,
    X,
    DollarSign,
    Stethoscope,
    Trash2
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
    total_paid?: number;
    last_doctor?: string;
    all_doctors?: string[];
    total_visits?: number;
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
        date_filter_type?: string;
        date_field?: string;
        specific_date?: string;
        start_date?: string;
        end_date?: string;
        date_preset?: string;
    };
}

export default function Index({ patients, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [genderFilter, setGenderFilter] = useState(filters.gender || '');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateFilterType, setDateFilterType] = useState(filters.date_filter_type || 'preset');
    const [dateField, setDateField] = useState(filters.date_field || 'created_at');
    const [specificDate, setSpecificDate] = useState(filters.specific_date || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [datePreset, setDatePreset] = useState(filters.date_preset || '');

    const ensureValidDateInput = (dateString: string): string => {
        if (!dateString) return '';
        let cleanDate = dateString.replace(/[^\d-]/g, '');
        const parts = cleanDate.split('-');
        if (parts.length === 3 && parts[0].length > 4) {
            parts[0] = parts[0].slice(-4);
            cleanDate = parts.join('-');
        }
        return cleanDate;
    };

    const isDateFilterActive = filters.date_filter_type && (
        filters.specific_date ||
        filters.start_date ||
        filters.end_date ||
        filters.date_preset
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentPath = window.location.pathname;
            router.get(currentPath, {
                search: searchTerm,
                gender: genderFilter,
                date_filter_type: dateFilterType,
                date_field: dateField,
                specific_date: specificDate,
                start_date: startDate,
                end_date: endDate,
                date_preset: datePreset,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, genderFilter, dateFilterType, dateField, specificDate, startDate, endDate, datePreset]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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

    const clearAllFilters = () => {
        setSearchTerm('');
        setGenderFilter('');
        setDateFilterType('preset');
        setDateField('created_at');
        setSpecificDate('');
        setStartDate('');
        setEndDate('');
        setDatePreset('');
        setShowDateFilter(false);
    };

    const clearDateFilter = () => {
        setDateFilterType('preset');
        setSpecificDate('');
        setStartDate('');
        setEndDate('');
        setDatePreset('');
        setShowDateFilter(false);
    };

    const getDateFilterLabel = () => {
        if (!isDateFilterActive) return '';
        const fieldLabel = dateField === 'created_at' ? 'Registration' : 'Birth Date';
        if (filters.date_filter_type === 'specific' && filters.specific_date) {
            return `${fieldLabel}: ${formatDate(filters.specific_date)}`;
        }
        if (filters.date_filter_type === 'range') {
            const start = filters.start_date ? formatDate(filters.start_date) : 'Start';
            const end = filters.end_date ? formatDate(filters.end_date) : 'End';
            return `${fieldLabel}: ${start} - ${end}`;
        }
        if (filters.date_filter_type === 'preset' && filters.date_preset) {
            const presetLabels = {
                'today': 'Today',
                'yesterday': 'Yesterday',
                'this_week': 'This Week',
                'last_week': 'Last Week',
                'this_month': 'This Month',
                'last_month': 'Last Month',
                'this_year': 'This Year',
                'last_7_days': 'Last 7 Days',
                'last_30_days': 'Last 30 Days',
                'last_90_days': 'Last 90 Days'
            };
            return `${fieldLabel}: ${presetLabels[filters.date_preset] || filters.date_preset}`;
        }
        return '';
    };

    const handlePaginationClick = (url: string) => {
        const urlObj = new URL(url);
        if (searchTerm) urlObj.searchParams.set('search', searchTerm);
        if (genderFilter) urlObj.searchParams.set('gender', genderFilter);
        if (dateFilterType) urlObj.searchParams.set('date_filter_type', dateFilterType);
        if (dateField) urlObj.searchParams.set('date_field', dateField);
        if (specificDate) urlObj.searchParams.set('specific_date', specificDate);
        if (startDate) urlObj.searchParams.set('start_date', startDate);
        if (endDate) urlObj.searchParams.set('end_date', endDate);
        if (datePreset) urlObj.searchParams.set('date_preset', datePreset);

        router.get(urlObj.pathname + urlObj.search, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Patients" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Patients</h1>
                        <p className="text-xs text-gray-500">Manage patient records and information</p>
                    </div>
                    <Link
                        href="/patients/create"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                    >
                        <Plus className="h-3 w-3" />
                        Add Patient
                    </Link>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex items-center gap-2">
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
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 ${
                                isDateFilterActive || showDateFilter
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Calendar className="h-3 w-3" />
                            Date Filter
                        </button>

                        <button
                            type="button"
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200"
                            onClick={clearAllFilters}
                        >
                            Clear All
                        </button>
                    </form>
                </div>

                {isDateFilterActive && (
                    <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Active filter:</span>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            <Calendar className="h-3 w-3" />
                            {getDateFilterLabel()}
                            <button onClick={clearDateFilter} className="ml-1 hover:text-blue-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}

                {showDateFilter && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by</label>
                                <select
                                    value={dateField}
                                    onChange={(e) => setDateField(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="created_at">Registration Date</option>
                                    <option value="date_of_birth">Birth Date</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={dateFilterType}
                                    onChange={(e) => setDateFilterType(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="preset">Quick Select</option>
                                    <option value="specific">Specific Date</option>
                                    <option value="range">Date Range</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                {dateFilterType === 'preset' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Quick Select</label>
                                        <select
                                            value={datePreset}
                                            onChange={(e) => setDatePreset(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Select period...</option>
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="this_week">This Week</option>
                                            <option value="last_week">Last Week</option>
                                            <option value="this_month">This Month</option>
                                            <option value="last_month">Last Month</option>
                                            <option value="this_year">This Year</option>
                                            <option value="last_7_days">Last 7 Days</option>
                                            <option value="last_30_days">Last 30 Days</option>
                                            <option value="last_90_days">Last 90 Days</option>
                                        </select>
                                    </div>
                                )}

                                {dateFilterType === 'specific' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Specific Date</label>
                                        <input
                                            type="date"
                                            value={ensureValidDateInput(specificDate)}
                                            onChange={(e) => setSpecificDate(ensureValidDateInput(e.target.value))}
                                            max="9999-12-31"
                                            min="1900-01-01"
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {dateFilterType === 'range' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                                            <input
                                                type="date"
                                                value={ensureValidDateInput(startDate)}
                                                onChange={(e) => setStartDate(ensureValidDateInput(e.target.value))}
                                                max="9999-12-31"
                                                min="1900-01-01"
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                                            <input
                                                type="date"
                                                value={ensureValidDateInput(endDate)}
                                                onChange={(e) => setEndDate(ensureValidDateInput(e.target.value))}
                                                max="9999-12-31"
                                                min="1900-01-01"
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor & Payment</th>
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
                                                <p className="text-xs text-gray-500 truncate max-w-32">{patient.email}</p>
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
                                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                                    <span className="truncate max-w-24">{patient.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="space-y-1">
                                            {patient.last_doctor ? (
                                                <div className="flex items-center gap-1 text-xs text-gray-700">
                                                    <Stethoscope className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                                                    <span className="truncate max-w-28" title={patient.last_doctor}>
                                                         {patient.last_doctor}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Stethoscope className="h-2.5 w-2.5" />
                                                    <span>No doctor yet</span>
                                                </div>
                                            )}

                                            {patient.total_paid !== undefined && patient.total_paid > 0 ? (
                                                <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                                    <DollarSign className="h-2.5 w-2.5 flex-shrink-0" />
                                                    <span>{formatCurrency(patient.total_paid)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <DollarSign className="h-2.5 w-2.5" />
                                                    <span>৳0</span>
                                                </div>
                                            )}

                                            {patient.total_visits !== undefined && patient.total_visits > 0 && (
                                                <p className="text-xs text-gray-500">
                                                    {patient.total_visits} visit{patient.total_visits !== 1 ? 's' : ''}
                                                </p>
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
                                                href={`/patients/${patient.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                            >
                                                <Eye className="h-3 w-3" />
                                                View
                                            </Link>
                                            <Link
                                                href={`/patients/${patient.id}/edit`}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                                            >
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete patient "${patient.name}"? This will permanently delete all visits, payments, and records. This cannot be undone.`)) {
                                                        router.delete(route('patients.destroy', patient.id), {
                                                            onError: (errors) => {
                                                                const msg = Object.values(errors).join('\n');
                                                                alert(msg || 'Patient deletion failed. Please try again.');
                                                            },
                                                        });
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                Delete
                                            </button>
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
                                    href="/patients/create"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Patient
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

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
                                    <button
                                        key={index}
                                        onClick={() => handlePaginationClick(link.url!)}
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
