import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface Appointment {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    patient: {
        name: string;
        patient_id: string;
        phone: string | null;
    };
    doctor: {
        user: {
            name: string;
        };
        specialization: string | null;
    };
}

interface Props {
    appointments: Appointment[];
    filters: {
        start_date?: string;
        end_date?: string;
        status?: string;
    };
}

const AppointmentsReport: React.FC<Props> = ({ appointments, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get('/reports/appointments', {
            start_date: startDate,
            end_date: endDate,
            status: status,
        });
    };

    const handleExport = () => {
        console.log('Export to Excel');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Appointment Report</h2>}>
            <Head title="Appointment Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">Appointment Report</h1>
                                <p className="text-gray-600">Total Appointments: {appointments.length}</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:mt-0"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                                >
                                    🔍 Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            #
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Serial No
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Patient
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Phone
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Doctor
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Specialization
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Date
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Time
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {appointments.map((appointment, index) => (
                                        <tr key={appointment.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm font-medium whitespace-nowrap text-blue-600">
                                                {appointment.serial_number}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div>
                                                    <div className="font-medium">{appointment.patient.name}</div>
                                                    <div className="text-xs text-gray-500">{appointment.patient.patient_id}</div>
                                                </div>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {appointment.patient.phone || 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {appointment.doctor.user.name}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {appointment.doctor.specialization || 'General'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {formatDate(appointment.appointment_date)}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {formatTime(appointment.appointment_time)}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(appointment.status)}`}
                                                >
                                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {appointments.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">📅</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No appointments found</h3>
                                <p className="text-gray-500">No appointments found according to the selected filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AppointmentsReport;
