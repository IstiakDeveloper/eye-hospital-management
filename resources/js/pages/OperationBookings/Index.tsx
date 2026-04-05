import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CalendarClock,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Edit,
    Eye,
    FileText,
    Filter,
    Plus,
    Printer,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

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
        router.get(
            '/operation-bookings',
            {
                search: searchQuery,
                status: statusFilter,
                payment_status: paymentStatusFilter,
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
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
                icon: <Calendar className="h-3 w-3" />,
            },
            confirmed: {
                bg: 'bg-purple-100',
                text: 'text-purple-800',
                border: 'border-purple-200',
                icon: <CheckCircle className="h-3 w-3" />,
            },
            completed: {
                bg: 'bg-green-100',
                text: 'text-green-800',
                border: 'border-green-200',
                icon: <CheckCircle className="h-3 w-3" />,
            },
            cancelled: {
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-200',
                icon: <XCircle className="h-3 w-3" />,
            },
            rescheduled: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                border: 'border-yellow-200',
                icon: <CalendarClock className="h-3 w-3" />,
            },
        };

        const badge = badges[status] || badges.scheduled;

        return (
            <span
                className={`operation-bookings-status-badge inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight ${badge.bg} ${badge.text} ${badge.border}`}
            >
                {badge.icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        let bgColor = 'bg-red-100';
        let textColor = 'text-red-800';
        let borderColor = 'border-red-200';
        let icon = <AlertCircle className="h-3 w-3" />;

        if (status === 'paid') {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            borderColor = 'border-green-200';
            icon = <CheckCircle className="h-3 w-3" />;
        } else if (status === 'partial') {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            borderColor = 'border-yellow-200';
            icon = <Clock className="h-3 w-3" />;
        }

        return (
            <span
                className={`operation-bookings-status-badge inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight ${bgColor} ${textColor} ${borderColor}`}
            >
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout>
            <div className="operation-bookings-index min-w-0 text-sm text-gray-900">
                <div className="mx-auto max-w-[1800px] min-w-0 p-4 sm:p-5">
                    {/* Header */}
                    <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Operation Bookings</h1>
                            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">Manage and track all operation bookings</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 sm:text-sm"
                            >
                                <Printer className="h-4 w-4 shrink-0" />
                                Print
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/operation-bookings/today')}
                                className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white shadow transition hover:bg-purple-700 sm:px-4 sm:text-sm"
                            >
                                <Calendar className="h-4 w-4 shrink-0" />
                                Today's Operations
                            </button>
                            {can.create && (
                                <button
                                    type="button"
                                    onClick={() => router.visit('/operation-bookings/create')}
                                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow transition hover:bg-blue-700 sm:px-4 sm:text-sm"
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    New Booking
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="no-print mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-blue-100">Total Bookings</p>
                                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{statistics.total}</p>
                                </div>
                                <Calendar className="h-9 w-9 shrink-0 text-blue-200/90" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-purple-100">Scheduled</p>
                                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{statistics.scheduled}</p>
                                </div>
                                <Clock className="h-9 w-9 shrink-0 text-purple-200/90" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-indigo-100">Confirmed</p>
                                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{statistics.confirmed}</p>
                                </div>
                                <CheckCircle className="h-9 w-9 shrink-0 text-indigo-200/90" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-green-100">Completed</p>
                                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{statistics.completed}</p>
                                </div>
                                <CheckCircle className="h-9 w-9 shrink-0 text-green-200/90" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-orange-100">Today</p>
                                    <p className="mt-0.5 text-2xl font-bold tabular-nums">{statistics.today}</p>
                                </div>
                                <Calendar className="h-9 w-9 shrink-0 text-orange-200/90" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="no-print mb-5 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 sm:text-sm"
                            >
                                <Filter className="h-4 w-4" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by booking number, patient name..."
                                    className="w-full rounded-md border border-gray-200 py-1.5 pr-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
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
                                        className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Payment Status</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>

                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            placeholder="Start Date"
                                            className="w-full rounded-md border border-gray-200 py-1.5 pr-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            placeholder="End Date"
                                            className="w-full rounded-md border border-gray-200 py-1.5 pr-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium transition hover:bg-gray-50"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Printable list title (only when printing) */}
                    <div className="operation-bookings-print-header mb-3 hidden print:block">
                        <h2 className="text-base font-semibold text-black">Operation Bookings</h2>
                        {(safeFilters.search ||
                            safeFilters.status ||
                            safeFilters.payment_status ||
                            safeFilters.start_date ||
                            safeFilters.end_date) && (
                            <p className="mt-1 text-xs leading-snug text-gray-700">
                                Filters applied
                                {safeFilters.search ? ` · Search: ${safeFilters.search}` : ''}
                                {safeFilters.status ? ` · Status: ${safeFilters.status}` : ''}
                                {safeFilters.payment_status ? ` · Payment: ${safeFilters.payment_status}` : ''}
                                {safeFilters.start_date ? ` · From: ${safeFilters.start_date}` : ''}
                                {safeFilters.end_date ? ` · To: ${safeFilters.end_date}` : ''}
                            </p>
                        )}
                    </div>

                    {/* Table — table-fixed + min-w-0 so no horizontal scroll; Actions column wide enough for icon row */}
                    <div className="operation-bookings-print-sheet overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm print:border print:border-gray-300 print:shadow-none">
                        <div className="w-full min-w-0 overflow-hidden print:overflow-visible">
                            <table className="operation-bookings-print-table w-full min-w-0 table-fixed text-xs sm:text-sm">
                                <colgroup>
                                    <col className="w-[8%]" />
                                    <col className="w-[13%]" />
                                    <col className="w-[13%]" />
                                    <col className="w-[11%]" />
                                    <col className="w-[9%]" />
                                    <col className="w-[9%]" />
                                    <col className="w-[7%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                    <col className="no-print w-[14%]" />
                                </colgroup>
                                <thead className="border-b border-gray-200 bg-gray-50 print:bg-gray-100">
                                    <tr>
                                        <th className="min-w-0 px-1.5 py-2 text-left text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Booking #
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-left text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Patient
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-left text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Operation
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-left text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Doctor
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-left text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Schedule
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-right text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Amount
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-right text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Due
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-center text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Status
                                        </th>
                                        <th className="min-w-0 px-1.5 py-2 text-center text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Payment
                                        </th>
                                        <th className="no-print min-w-0 px-1.5 py-2 text-center text-[10px] font-semibold tracking-wide text-gray-600 uppercase sm:px-2 sm:text-xs">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                                                <Calendar className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                                                <p className="text-sm font-medium">No bookings found</p>
                                                <p className="mt-0.5 text-xs">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.data.map((booking) => (
                                            <tr key={booking.id} className="transition hover:bg-gray-50/80">
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 align-top sm:px-2">
                                                    <div className="break-words font-medium text-blue-600">{booking.booking_no}</div>
                                                    <div className="text-[10px] text-gray-500 sm:text-[11px]">{formatDate(booking.created_at)}</div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 align-top sm:px-2">
                                                    <div className="min-w-0">
                                                        <div className="line-clamp-2 break-words font-medium leading-snug text-gray-900">
                                                            {booking.patient?.name || 'N/A'}
                                                        </div>
                                                        <div className="truncate text-[10px] text-gray-500 sm:text-[11px]">{booking.patient?.patient_id || 'N/A'}</div>
                                                        <div className="truncate text-[10px] text-gray-500 sm:text-[11px]">{booking.patient?.phone || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 align-top sm:px-2">
                                                    <div className="min-w-0">
                                                        <div className="line-clamp-2 break-words font-medium leading-snug text-gray-900">{booking.operation_name}</div>
                                                        <div className="truncate text-[10px] text-gray-500 sm:text-[11px]">{booking.operation?.operation_type || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 align-top sm:px-2">
                                                    <div className="min-w-0">
                                                        <div className="line-clamp-2 break-words font-medium leading-snug text-gray-900">
                                                            {booking.doctor?.user?.name || 'N/A'}
                                                        </div>
                                                        <div className="truncate text-[10px] text-gray-500 sm:text-[11px]">{booking.doctor?.specialization || ''}</div>
                                                    </div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 align-top sm:px-2">
                                                    <div>
                                                        <div className="whitespace-nowrap font-medium text-gray-900">{formatDate(booking.scheduled_date)}</div>
                                                        <div className="text-[10px] text-gray-600 sm:text-[11px]">{formatTime(booking.scheduled_time)}</div>
                                                    </div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 text-right align-top sm:px-2">
                                                    {booking.discount_amount && booking.discount_amount > 0 ? (
                                                        <>
                                                            <div className="text-[11px] text-gray-500 line-through">
                                                                ৳{Number(booking.base_amount || booking.total_amount).toFixed(2)}
                                                            </div>
                                                            <div className="font-semibold tabular-nums text-blue-600">{formatCurrency(booking.total_amount)}</div>
                                                            <div className="text-[11px] text-green-600">Paid: {formatCurrency(booking.advance_payment)}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="font-semibold tabular-nums text-gray-900">{formatCurrency(booking.total_amount)}</div>
                                                            <div className="text-[11px] text-green-600">Paid: {formatCurrency(booking.advance_payment)}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1.5 py-2 text-right align-top sm:px-2">
                                                    <div className="font-semibold tabular-nums text-red-600">{formatCurrency(booking.due_amount)}</div>
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1 py-2 text-center align-middle sm:px-1.5">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                                <td className="min-w-0 overflow-hidden px-1 py-2 text-center align-middle sm:px-1.5">
                                                    {getPaymentStatusBadge(booking.payment_status)}
                                                </td>
                                                <td className="no-print min-w-0 overflow-hidden px-1 py-2 sm:px-1.5">
                                                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                            className="rounded p-1 text-blue-600 transition hover:bg-blue-50"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => router.visit(`/operation-bookings/${booking.id}/receipt`)}
                                                            className="rounded p-1 text-green-600 transition hover:bg-green-50"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </button>
                                                        {can.payment && booking.payment_status !== 'paid' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                                className="rounded p-1 text-purple-600 transition hover:bg-purple-50"
                                                                title="Add Payment"
                                                            >
                                                                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </button>
                                                        )}
                                                        {can.edit && (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}/edit`)}
                                                                className="rounded p-1 text-orange-600 transition hover:bg-orange-50"
                                                                title="Edit Booking"
                                                            >
                                                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                            <div className="no-print border-t border-gray-100 bg-gray-50/80 px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-xs text-gray-600 sm:text-sm">
                                        Showing {bookings.data.length} of {bookings.total} results
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {bookings.links.map((link, idx) => {
                                            if (!link.url) return null;

                                            const isActive = link.active;
                                            const isPrev = link.label.includes('Previous');
                                            const isNext = link.label.includes('Next');

                                            return (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    disabled={isActive}
                                                    className={`rounded-md px-2.5 py-1.5 text-xs transition sm:text-sm ${
                                                        isActive ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {isPrev && <ChevronLeft className="h-4 w-4" />}
                                                    {!isPrev && !isNext && link.label}
                                                    {isNext && <ChevronRight className="h-4 w-4" />}
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

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 6mm 8mm;
                    }

                    html {
                        font-size: 9pt;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .no-print {
                        display: none !important;
                    }

                    /* AdminLayout main inner padding — remove for dense A4 */
                    main > div:has(.operation-bookings-index) {
                        padding: 0 !important;
                        max-width: none !important;
                    }

                    main {
                        background: white !important;
                    }

                    .operation-bookings-index {
                        padding: 0 !important;
                        font-size: 8pt !important;
                        line-height: 1.25 !important;
                        color: #111 !important;
                    }

                    .operation-bookings-print-header {
                        margin-bottom: 6px !important;
                        padding-bottom: 4px !important;
                        border-bottom: 1px solid #e5e7eb !important;
                    }

                    .operation-bookings-print-header h2 {
                        font-size: 11pt !important;
                        font-weight: 600 !important;
                    }

                    .operation-bookings-print-header p {
                        font-size: 7.5pt !important;
                        line-height: 1.3 !important;
                    }

                    .operation-bookings-print-sheet {
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    .operation-bookings-print-table {
                        width: 100% !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 7.25pt !important;
                    }

                    .operation-bookings-print-table thead th {
                        padding: 3px 4px !important;
                        font-size: 6.75pt !important;
                        font-weight: 600 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.02em !important;
                        background: #f3f4f6 !important;
                        border-bottom: 1px solid #d1d5db !important;
                        vertical-align: bottom !important;
                    }

                    .operation-bookings-print-table tbody td {
                        padding: 2px 4px !important;
                        border-bottom: 1px solid #eee !important;
                        vertical-align: top !important;
                        word-wrap: break-word !important;
                        overflow-wrap: anywhere !important;
                    }

                    .operation-bookings-print-table tbody tr {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    .operation-bookings-print-table thead {
                        display: table-header-group;
                    }

                    .operation-bookings-print-table tfoot {
                        display: table-footer-group;
                    }

                    .operation-bookings-status-badge {
                        font-size: 6.5pt !important;
                        padding: 1px 4px !important;
                        gap: 2px !important;
                        line-height: 1.2 !important;
                    }

                    .operation-bookings-status-badge svg {
                        width: 8px !important;
                        height: 8px !important;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
