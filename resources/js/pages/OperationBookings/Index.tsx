import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search, Calendar, Filter, Eye, CreditCard, FileText, Plus,
    CheckCircle, Clock, AlertCircle, XCircle, RefreshCw,
    ChevronLeft, ChevronRight, Edit, Trash2, CalendarClock
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
}

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
    };
    specialization: string;
}

interface Operation {
    id: number;
    operation_code: string;
    operation_name: string;
    operation_type: string;
}

interface User {
    id: number;
    name: string;
}

interface OperationBooking {
    id: number;
    booking_no: string;
    patient: Patient;
    doctor: Doctor;
    operation: Operation;
    operation_name: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    base_amount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    discount_amount?: number;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    payment_status: string;
    notes?: string;
    booked_by: User;
    created_at: string;
    // Eye surgery specific fields (not displayed in list view)
    surgery_type?: string;
    eye_side?: 'left' | 'right';
    lens_type?: string;
    power?: string;
    surgery_remarks?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: OperationBooking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Statistics {
    total: number;
    scheduled: number;
    confirmed: number;
    completed: number;
    today: number;
}

interface Filters {
    search?: string;
    status?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
}

interface Permissions {
    create: boolean;
    edit: boolean;
    delete: boolean;
    payment: boolean;
    confirm: boolean;
    complete: boolean;
    cancel: boolean;
}

interface Props {
    bookings: PaginatedData;
    filters?: Filters;
    statistics: Statistics;
    can: Permissions;
}

export default function OperationBookingsIndex({ bookings, filters, statistics, can }: Props) {
    const safeFilters = filters || {};

    const [searchQuery, setSearchQuery] = useState(safeFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(safeFilters.status || '');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(safeFilters.payment_status || '');
    const [startDate, setStartDate] = useState(safeFilters.start_date || '');
    const [endDate, setEndDate] = useState(safeFilters.end_date || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get('/operation-bookings', {
            search: searchQuery,
            status: statusFilter,
            payment_status: paymentStatusFilter,
            start_date: startDate,
            end_date: endDate
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPaymentStatusFilter('');
        setStartDate('');
        setEndDate('');
        router.get('/operation-bookings');
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; border: string; icon: React.ReactElement }> = {
            scheduled: {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                border: 'border-blue-200',
                icon: <Calendar className="w-3 h-3" />
            },
            confirmed: {
                bg: 'bg-purple-100',
                text: 'text-purple-800',
                border: 'border-purple-200',
                icon: <CheckCircle className="w-3 h-3" />
            },
            completed: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                border: 'border-green-200',
                icon: <CheckCircle className="w-3 h-3" />
            },
            cancelled: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-200',
                icon: <XCircle className="w-3 h-3" />
            },
            rescheduled: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                border: 'border-yellow-200',
                icon: <CalendarClock className="w-3 h-3" />
            }
        };

        const badge = badges[status] || badges.scheduled;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        let bgColor = 'bg-red-100';
        let textColor = 'text-red-800';
        let borderColor = 'border-red-200';
        let icon = <AlertCircle className="w-3 h-3" />;

        if (status === 'paid') {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            borderColor = 'border-green-200';
            icon = <CheckCircle className="w-3 h-3" />;
        } else if (status === 'partial') {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            borderColor = 'border-yellow-200';
            icon = <Clock className="w-3 h-3" />;
        }

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>
                {icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return `৳${Number(amount).toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    const formatTime = (timeStr: string) => {
        return timeStr.slice(0, 5);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Operation Bookings</h1>
                            <p className="text-gray-600 mt-1">Manage and track all operation bookings</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit('/operation-bookings/today')}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-lg"
                            >
                                <Calendar className="w-5 h-5" />
                                Today's Operations
                            </button>
                            {can.create && (
                                <button
                                    onClick={() => router.visit('/operation-bookings/create')}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                                >
                                    <Plus className="w-5 h-5" />
                                    New Booking
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Bookings</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.total}</p>
                                </div>
                                <Calendar className="w-12 h-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Scheduled</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.scheduled}</p>
                                </div>
                                <Clock className="w-12 h-12 text-purple-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-sm">Confirmed</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.confirmed}</p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-indigo-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Completed</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.completed}</p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-green-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Today</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.today}</p>
                                </div>
                                <Calendar className="w-12 h-12 text-orange-200" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Filters</h3>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by booking number, patient name..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="rescheduled">Rescheduled</option>
                                    </select>

                                    <select
                                        value={paymentStatusFilter}
                                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Payment Status</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>

                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            placeholder="Start Date"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            placeholder="End Date"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Search className="w-4 h-4" />
                                    Search
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Booking #</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Operation</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Schedule</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Due</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Payment</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bookings.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p className="text-lg font-medium">No bookings found</p>
                                                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.data.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-blue-600">{booking.booking_no}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(booking.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{booking.patient?.name || 'N/A'}</div>
                                                        <div className="text-sm text-gray-500">{booking.patient?.patient_id || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{booking.patient?.phone || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{booking.operation_name}</div>
                                                        <div className="text-xs text-gray-500">{booking.operation?.operation_type || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{booking.doctor?.user?.name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{booking.doctor?.specialization || ''}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{formatDate(booking.scheduled_date)}</div>
                                                        <div className="text-sm text-gray-600">{formatTime(booking.scheduled_time)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {booking.discount_amount && booking.discount_amount > 0 ? (
                                                        <>
                                                            <div className="text-xs text-gray-500 line-through">৳{Number(booking.base_amount || booking.total_amount).toFixed(2)}</div>
                                                            <div className="font-semibold text-blue-600">{formatCurrency(booking.total_amount)}</div>
                                                            <div className="text-xs text-green-600">Paid: {formatCurrency(booking.advance_payment)}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</div>
                                                            <div className="text-xs text-green-600">Paid: {formatCurrency(booking.advance_payment)}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-semibold text-red-600">{formatCurrency(booking.due_amount)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {getPaymentStatusBadge(booking.payment_status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => router.visit(`/operation-bookings/${booking.id}/receipt`)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        {can.payment && booking.payment_status !== 'paid' && (
                                                            <button
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                                title="Add Payment"
                                                            >
                                                                <CreditCard className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {can.edit && (
                                                            <button
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}/edit`)}
                                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                                                title="Edit Booking"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {bookings.last_page > 1 && (
                            <div className="px-6 py-4 border-t bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {bookings.data.length} of {bookings.total} results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {bookings.links.map((link, idx) => {
                                            if (!link.url) return null;

                                            const isActive = link.active;
                                            const isPrev = link.label.includes('Previous');
                                            const isNext = link.label.includes('Next');

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    disabled={isActive}
                                                    className={`px-3 py-2 rounded-lg transition ${isActive
                                                            ? 'bg-blue-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {isPrev && <ChevronLeft className="w-4 h-4" />}
                                                    {!isPrev && !isNext && link.label}
                                                    {isNext && <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
