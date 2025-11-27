import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Calendar, User, CheckCircle, Clock, AlertCircle, Eye, CreditCard, Check, X } from 'lucide-react';

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
            scheduled: { bg: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-3 h-3" /> },
            confirmed: { bg: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="w-3 h-3" /> },
            completed: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> }
        };
        const badge = badges[status] || badges.scheduled;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}>
                {badge.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Today's Operations</h1>
                        <p className="text-gray-600 mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Operations</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.total}</p>
                                </div>
                                <Calendar className="w-12 h-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Confirmed</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.confirmed}</p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-purple-200" />
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

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm">Pending</p>
                                    <p className="text-3xl font-bold mt-1">{statistics.pending_confirmation}</p>
                                </div>
                                <Clock className="w-12 h-12 text-yellow-200" />
                            </div>
                        </div>
                    </div>

                    {/* Operations List */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
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
                                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p className="text-lg font-medium">No operations scheduled today</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-lg">{formatTime(booking.scheduled_time)}</span>
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
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(booking.status)}
                                                </td>
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
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {can.confirm && booking.status === 'scheduled' && (
                                                            <button
                                                                onClick={() => router.patch(`/operation-bookings/${booking.id}/confirm`)}
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                                                title="Confirm"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {can.complete && ['scheduled', 'confirmed'].includes(booking.status) && (
                                                            <button
                                                                onClick={() => router.patch(`/operation-bookings/${booking.id}/complete`, {})}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Mark Complete"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {can.payment && booking.payment_status !== 'paid' && (
                                                            <button
                                                                onClick={() => router.visit(`/operation-bookings/${booking.id}`)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Add Payment"
                                                            >
                                                                <CreditCard className="w-4 h-4" />
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
