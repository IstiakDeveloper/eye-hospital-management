import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface Prescription {
    id: number;
    patient_id: number;
    doctor_id: number;
    diagnosis: string | null;
    followup_date: string | null;
    created_at: string;
    consultation_fee: number;
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
    prescriptions: Prescription[];
    totalRevenue: number;
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

const RevenueReport: React.FC<Props> = ({ prescriptions, totalRevenue, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilter = () => {
        router.get('/reports/revenue', {
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleExport = () => {
        console.log('Export to Excel');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate doctor-wise revenue
    const doctorRevenue = prescriptions.reduce(
        (acc, prescription) => {
            const doctorName = prescription.doctor.user.name;
            if (!acc[doctorName]) {
                acc[doctorName] = {
                    name: doctorName,
                    specialization: prescription.doctor.specialization || 'General',
                    totalRevenue: 0,
                    consultationCount: 0,
                };
            }
            acc[doctorName].totalRevenue += prescription.consultation_fee;
            acc[doctorName].consultationCount += 1;
            return acc;
        },
        {} as Record<string, any>,
    );

    const doctorRevenueArray = Object.values(doctorRevenue).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Revenue Report</h2>}>
            <Head title="Revenue Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">Revenue Report</h1>
                                <p className="text-gray-600">Total Consultations: {prescriptions.length}</p>
                                <p className="mt-2 text-xl font-bold text-green-600">Total Revenue: ৳{totalRevenue.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:mt-0"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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

                    {/* Doctor Revenue Summary */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">Doctor-wise Revenue Summary</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {doctorRevenueArray.map((doctor: any, index: number) => (
                                <div key={index} className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                                        <span className="text-sm text-gray-500">{doctor.specialization}</span>
                                    </div>
                                    <div className="mb-1 text-2xl font-bold text-green-600">৳{doctor.totalRevenue.toLocaleString()}</div>
                                    <div className="text-sm text-gray-600">{doctor.consultationCount} consultations</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Detailed Revenue Records</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            #
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Patient
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Doctor
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Diagnosis
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Consultation Fee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {prescriptions.map((prescription, index) => (
                                        <tr key={prescription.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div>
                                                    <div className="font-medium">{prescription.patient.name}</div>
                                                    <div className="text-xs text-gray-500">{prescription.patient.patient_id}</div>
                                                    <div className="text-xs text-gray-500">{prescription.patient.phone || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div>
                                                    <div className="font-medium">{prescription.doctor.user.name}</div>
                                                    <div className="text-xs text-gray-500">{prescription.doctor.specialization || 'General'}</div>
                                                </div>
                                            </td>
                                            <td className="max-w-xs border-r border-gray-200 px-6 py-4 text-sm text-gray-900">
                                                <div className="truncate" title={prescription.diagnosis || 'N/A'}>
                                                    {prescription.diagnosis || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                                                    ৳{prescription.consultation_fee.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {formatDateTime(prescription.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {prescriptions.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">💰</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No revenue records found</h3>
                                <p className="text-gray-500">No revenue records found according to the selected filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default RevenueReport;
