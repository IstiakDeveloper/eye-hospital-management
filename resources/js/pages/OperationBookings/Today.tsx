import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { Calendar, Check, CheckCircle, Clock, CreditCard, Eye } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization?: string;
}

interface Operation {
    operation_name: string;
    operation_type: string;
}

interface UserInfo {
    name: string;
}

interface OperationBooking {
    id: number;
    booking_no: string;
    patient: Patient;
    doctor: Doctor;
    operation: Operation;
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
    booked_by: UserInfo;
    // Eye surgery specific fields (not displayed in list view)
    surgery_type?: string;
    eye_side?: 'left' | 'right';
    lens_type?: string;
    power?: string;
    surgery_remarks?: string;
}

interface Statistics {
    total: number;
    confirmed: number;
    completed: number;
    pending_confirmation: number;
}

interface Permissions {
    payment: boolean;
    confirm: boolean;
    complete: boolean;
}

interface Props {
    bookings: OperationBooking[];
    statistics: Statistics;
    can: Permissions;
}

export default function TodayOperations({ bookings, statistics, can }: Props) {
    const formatCurrency = (amount: number) => `৳${Number(amount).toFixed(2)}`;
    const formatTime = (time: string) => time.slice(0, 5);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; icon: React.ReactElement }> = {
            scheduled: { bg: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3" /> },
            confirmed: { bg: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="h-3 w-3" /> },
            completed: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
        };
        const badge = badges[status] || badges.scheduled;
        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg}`}>
                {badge.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Today's Operations</h1>
                        <p className="mt-1 text-gray-600">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Statistics */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-100">Total Operations</p>
                                    <p className="mt-1 text-3xl font-bold">{statistics.total}</p>
                                </div>
                                <Calendar className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-100">Confirmed</p>
                                    <p className="mt-1 text-3xl font-bold">{statistics.confirmed}</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-purple-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-100">Completed</p>
                                    <p className="mt-1 text-3xl font-bold">{statistics.completed}</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-green-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-yellow-100">Pending</p>
                                    <p className="mt-1 text-3xl font-bold">{statistics.pending_confirmation}</p>
                                </div>
                                <Clock className="h-12 w-12 text-yellow-200" />
                            </div>
                        </div>
                    </div>

                    {/* Operations List */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Time</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Operation</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                                <p className="text-lg font-medium">No operations scheduled today</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span className="text-lg font-medium">{formatTime(booking.scheduled_time)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{booking.patient.name}</div>
                                                    <div className="text-sm text-gray-500">{booking.patient.patient_id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{booking.operation.operation_name}</div>
                                                    <div className="text-sm text-gray-500">{booking.operation.operation_type}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{booking.doctor.user.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">{getStatusBadge(booking.status)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-semibold">{formatCurrency(booking.total_amount)}</div>
                                                    {booking.due_amount > 0 && (
                                                        <div className="text-xs text-red-600">Due: {formatCurrency(booking.due_amount)}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        {can.confirm && booking.status === 'scheduled' && (
                                                            <button
                                                                onClick={() => router.patch(`/operation-bookings/${booking.id}/confirm`)}
                                                                className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                                                                title="Confirm"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.complete && ['scheduled', 'confirmed'].includes(booking.status) && (
                                                            <button
                                                                onClick={() => router.patch(`/operation-bookings/${booking.id}/complete`, {})}
                                                                className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                                title="Mark Complete"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {can.payment && booking.payment_status !== 'paid' && (
                                                            <button
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                                className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                                title="Add Payment"
                                                            >
                                                                <CreditCard className="h-4 w-4" />
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
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
