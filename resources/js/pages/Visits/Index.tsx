import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search,
    Eye,
    Filter,
    Calendar,
    X,
    DollarSign,
    Stethoscope,
    Users,
    FileText,
    Receipt,
    Edit as EditIcon,
    Trash2
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
}

interface User {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    name: string;
    user?: User;
}

interface Visit {
    id: number;
    patient: Patient;
    selected_doctor: Doctor | null;
    payment_status: string;
    overall_status: string;
    vision_test_status: string;
    prescription_status: string;
    chief_complaint: string;
    is_followup: boolean;
    final_amount: number | null;
    total_paid: number | null;
    total_due: number | null;
    created_at: string;
    payment_completed_at: string | null;
    vision_test_completed_at: string | null;
    prescription_completed_at: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: Visit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    visits: PaginatedData;
    doctors: Doctor[];
    filters: {
        search?: string;
        payment_status?: string;
        overall_status?: string;
        doctor_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ visits, doctors, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [overallStatus, setOverallStatus] = useState(filters.overall_status || '');
    const [doctorId, setDoctorId] = useState(filters.doctor_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);

    const isFilterActive = filters.payment_status || filters.overall_status || filters.doctor_id || filters.date_from || filters.date_to;

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentPath = window.location.pathname;
            router.get(currentPath, {
                search: searchTerm,
                payment_status: paymentStatus,
                overall_status: overallStatus,
                doctor_id: doctorId,
                date_from: dateFrom,
                date_to: dateTo,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, paymentStatus, overallStatus, doctorId, dateFrom, dateTo]);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '৳0';
        }
        return '৳' + amount.toLocaleString('en-BD', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setPaymentStatus('');
        setOverallStatus('');
        setDoctorId('');
        setDateFrom('');
        setDateTo('');
        setShowFilters(false);
    };

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) {
            return (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                    N/A
                </span>
            );
        }

        const statusColors: Record<string, string> = {
            // Payment status
            'paid': 'bg-green-100 text-green-700',
            'partial': 'bg-yellow-100 text-yellow-700',
            'unpaid': 'bg-red-100 text-red-700',
            // Overall status
            'payment': 'bg-orange-100 text-orange-700',
            'vision_test': 'bg-blue-100 text-blue-700',
            'prescription': 'bg-purple-100 text-purple-700',
            'completed': 'bg-green-100 text-green-700',
            // Test status
            'pending': 'bg-gray-100 text-gray-700',
            'in_progress': 'bg-blue-100 text-blue-700',
        };

        return (
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const handlePaginationClick = (url: string) => {
        const urlObj = new URL(url);
        if (searchTerm) urlObj.searchParams.set('search', searchTerm);
        if (paymentStatus) urlObj.searchParams.set('payment_status', paymentStatus);
        if (overallStatus) urlObj.searchParams.set('overall_status', overallStatus);
        if (doctorId) urlObj.searchParams.set('doctor_id', doctorId);
        if (dateFrom) urlObj.searchParams.set('date_from', dateFrom);
        if (dateTo) urlObj.searchParams.set('date_to', dateTo);

        router.get(urlObj.pathname + urlObj.search, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Patient Visits" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Patient Visits</h1>
                        <p className="text-xs text-gray-500">View and manage all patient visits</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by patient name, ID, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1 ${
                                isFilterActive || showFilters
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="h-3 w-3" />
                            Filters
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

                {showFilters && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Overall Status</label>
                                <select
                                    value={overallStatus}
                                    onChange={(e) => setOverallStatus(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="payment">Payment</option>
                                    <option value="vision_test">Vision Test</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Doctor</label>
                                <select
                                    value={doctorId}
                                    onChange={(e) => setDoctorId(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All Doctors</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id.toString()}>
                                            {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Total Visits</p>
                                <p className="text-sm font-semibold text-blue-700">{visits.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3 w-3 text-green-600" />
                            <div>
                                <p className="text-xs text-green-600 font-medium">This Page</p>
                                <p className="text-sm font-semibold text-green-700">{visits.data.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                        <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-purple-600" />
                            <div>
                                <p className="text-xs text-purple-600 font-medium">Page {visits.current_page} of {visits.last_page}</p>
                                <p className="text-sm font-semibold text-purple-700">{visits.per_page}/page</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {visits.data.map((visit) => (
                                <tr key={visit.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-700">
                                            <Calendar className="h-2.5 w-2.5 text-gray-400" />
                                            {formatDate(visit.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div>
                                            <p className="text-xs font-medium text-gray-900">{visit.patient.name}</p>
                                            <p className="text-xs text-gray-500">ID: {visit.patient.patient_id}</p>
                                            <p className="text-xs text-gray-500">{visit.patient.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {visit.selected_doctor ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-700">
                                                    <Stethoscope className="h-2.5 w-2.5 text-blue-600" />
                                                    <span className="truncate max-w-32">
                                                        {visit.selected_doctor.user?.name || visit.selected_doctor.name || 'N/A'}
                                                    </span>
                                                </div>
                                                {visit.is_followup && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        Follow-up
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No doctor</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">Overall:</span>
                                                {getStatusBadge(visit.overall_status)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">V.Test:</span>
                                                {getStatusBadge(visit.vision_test_status)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">Presc:</span>
                                                {getStatusBadge(visit.prescription_status)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                {getStatusBadge(visit.payment_status)}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                                <DollarSign className="h-2.5 w-2.5" />
                                                <span>Total: {formatCurrency(visit.final_amount)}</span>
                                            </div>
                                            <p className="text-xs text-green-600">
                                                Paid: {formatCurrency(visit.total_paid)}
                                            </p>
                                            {visit.total_due && visit.total_due > 0 && (
                                                <p className="text-xs text-red-600">
                                                    Due: {formatCurrency(visit.total_due)}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link
                                                href={`/visits/${visit.id}`}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                            >
                                                <Eye className="h-3 w-3" />
                                                View
                                            </Link>
                                            <Link
                                                href={`/visits/${visit.id}/edit`}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
                                            >
                                                <EditIcon className="h-3 w-3" />
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/visits/${visit.id}/receipt`}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                            >
                                                <Receipt className="h-3 w-3" />
                                                Receipt
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete Visit ${visit.visit_id}? This will reverse all transactions and cannot be undone.`)) {
                                                        router.delete(route('visits.destroy', visit.id), {
                                                            onError: (errors) => {
                                                                const msg = Object.values(errors).join('\n');
                                                                alert(msg || 'Visit deletion failed. Please try again.');
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

                    {visits.data.length === 0 && (
                        <div className="text-center py-8">
                            <FileText className="mx-auto h-8 w-8 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No visits found</h3>
                            <p className="mt-1 text-xs text-gray-500">No patient visits match your current filters.</p>
                        </div>
                    )}
                </div>

                {visits.total > visits.per_page && (
                    <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-700">
                            Showing {((visits.current_page - 1) * visits.per_page) + 1} to{' '}
                            {Math.min(visits.current_page * visits.per_page, visits.total)} of{' '}
                            {visits.total} results
                        </div>
                        <div className="flex gap-1">
                            {visits.links.map((link, index) => {
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
