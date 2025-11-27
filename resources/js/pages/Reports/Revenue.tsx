import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

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
            end_date: endDate
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
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Calculate doctor-wise revenue
    const doctorRevenue = prescriptions.reduce((acc, prescription) => {
        const doctorName = prescription.doctor.user.name;
        if (!acc[doctorName]) {
            acc[doctorName] = {
                name: doctorName,
                specialization: prescription.doctor.specialization || 'General',
                totalRevenue: 0,
                consultationCount: 0
            };
        }
        acc[doctorName].totalRevenue += prescription.consultation_fee;
        acc[doctorName].consultationCount += 1;
        return acc;
    }, {} as Record<string, any>);

    const doctorRevenueArray = Object.values(doctorRevenue).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return (
        <AdminLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Revenue Report
                </h2>
            }
        >
            <Head title="Revenue Report" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Report</h1>
                                <p className="text-gray-600">Total Consultations: {prescriptions.length}</p>
                                <p className="text-xl font-bold text-green-600 mt-2">
                                    Total Revenue: ৳{totalRevenue.toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 lg:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    🔍 Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Revenue Summary */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Doctor-wise Revenue Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {doctorRevenueArray.map((doctor: any, index: number) => (
                                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                                        <span className="text-sm text-gray-500">{doctor.specialization}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        ৳{doctor.totalRevenue.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {doctor.consultationCount} consultations
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Detailed Revenue Records</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Patient
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Doctor
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Diagnosis
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Consultation Fee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {prescriptions.map((prescription, index) => (
                                        <tr key={prescription.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <div>
                                                    <div className="font-medium">{prescription.patient.name}</div>
                                                    <div className="text-gray-500 text-xs">{prescription.patient.patient_id}</div>
                                                    <div className="text-gray-500 text-xs">{prescription.patient.phone || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <div>
                                                    <div className="font-medium">{prescription.doctor.user.name}</div>
                                                    <div className="text-gray-500 text-xs">{prescription.doctor.specialization || 'General'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200 max-w-xs">
                                                <div className="truncate" title={prescription.diagnosis || 'N/A'}>
                                                    {prescription.diagnosis || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                    ৳{prescription.consultation_fee.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDateTime(prescription.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {prescriptions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">💰</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue records found</h3>
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
