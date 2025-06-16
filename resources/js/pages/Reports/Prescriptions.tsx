import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface PrescriptionMedicine {
    medicine: {
        name: string;
        generic_name: string | null;
        type: string;
    };
    dosage: string;
    duration: string | null;
    instructions: string | null;
}

interface Prescription {
    id: number;
    patient_id: number;
    doctor_id: number;
    diagnosis: string | null;
    advice: string | null;
    notes: string | null;
    followup_date: string | null;
    created_at: string;
    patient: {
        name: string;
        patient_id: string;
        phone: string | null;
        email: string | null;
    };
    doctor: {
        user: {
            name: string;
        };
        specialization: string | null;
    };
    prescription_medicines: PrescriptionMedicine[];
}

interface Props {
    prescriptions: Prescription[];
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

const PrescriptionsReport: React.FC<Props> = ({ prescriptions, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const handleFilter = () => {
        router.get('/reports/prescriptions', {
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

    const toggleRowExpansion = (prescriptionId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(prescriptionId)) {
            newExpanded.delete(prescriptionId);
        } else {
            newExpanded.add(prescriptionId);
        }
        setExpandedRows(newExpanded);
    };

    const getMedicineTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'Tablet': 'bg-blue-100 text-blue-800',
            'Syrup': 'bg-green-100 text-green-800',
            'Drops': 'bg-purple-100 text-purple-800',
            'Injection': 'bg-red-100 text-red-800',
            'Capsule': 'bg-yellow-100 text-yellow-800',
            'Ointment': 'bg-pink-100 text-pink-800',
            'Cream': 'bg-indigo-100 text-indigo-800',
            'Other': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors['Other'];
    };

    // Calculate statistics
    const totalPrescriptions = prescriptions.length;
    const totalMedicines = prescriptions.reduce((sum, p) => sum + (p.prescription_medicines?.length || 0), 0);
    const prescriptionsWithFollowup = prescriptions.filter(p => p.followup_date).length;
    const averageMedicinesPerPrescription = totalPrescriptions > 0 ? Math.round(totalMedicines / totalPrescriptions) : 0;

    return (
        <AdminLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Prescription Report
                </h2>
            }
        >
            <Head title="Prescription Report" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Prescription Report</h1>
                                <p className="text-gray-600">Total Prescriptions: {totalPrescriptions}</p>
                                <p className="text-gray-600">Total Medicines Prescribed: {totalMedicines}</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 lg:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{totalPrescriptions}</div>
                                <div className="text-sm text-blue-800">Total Prescriptions</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{totalMedicines}</div>
                                <div className="text-sm text-green-800">Medicines Prescribed</div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{averageMedicinesPerPrescription}</div>
                                <div className="text-sm text-purple-800">Avg Medicines/Prescription</div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{prescriptionsWithFollowup}</div>
                                <div className="text-sm text-orange-800">With Follow-up</div>
                            </div>
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

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
                                            Medicines Count
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Follow-up Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Prescribed Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {prescriptions.map((prescription, index) => (
                                        <React.Fragment key={prescription.id}>
                                            <tr className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    <div>
                                                        <div className="font-medium">{prescription.patient.name}</div>
                                                        <div className="text-gray-500 text-xs">{prescription.patient.patient_id}</div>
                                                        <div className="text-gray-500 text-xs">{prescription.patient.phone || prescription.patient.email || 'N/A'}</div>
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
                                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                        {prescription.prescription_medicines?.length || 0} medicines
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {prescription.followup_date ? (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            {formatDate(prescription.followup_date)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">No follow-up</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {formatDateTime(prescription.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {prescription.prescription_medicines && prescription.prescription_medicines.length > 0 && (
                                                        <button
                                                            onClick={() => toggleRowExpansion(prescription.id)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            {expandedRows.has(prescription.id) ? '▼ Hide' : '▶ View'} Medicines
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expanded Row for Medicines */}
                                            {expandedRows.has(prescription.id) && prescription.prescription_medicines && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={8} className="px-6 py-4">
                                                        <div className="bg-white rounded-lg p-4 border">
                                                            <h4 className="font-semibold text-gray-900 mb-3">Prescribed Medicines:</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {prescription.prescription_medicines.map((med, medIndex) => (
                                                                    <div key={medIndex} className="border rounded-lg p-3 bg-gray-50">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-900">{med.medicine.name}</div>
                                                                                {med.medicine.generic_name && (
                                                                                    <div className="text-sm text-gray-600">({med.medicine.generic_name})</div>
                                                                                )}
                                                                            </div>
                                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMedicineTypeColor(med.medicine.type)}`}>
                                                                                {med.medicine.type}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm space-y-1">
                                                                            <div><span className="font-medium">Dosage:</span> {med.dosage}</div>
                                                                            {med.duration && (
                                                                                <div><span className="font-medium">Duration:</span> {med.duration}</div>
                                                                            )}
                                                                            {med.instructions && (
                                                                                <div><span className="font-medium">Instructions:</span> {med.instructions}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Additional prescription details */}
                                                            {(prescription.advice || prescription.notes) && (
                                                                <div className="mt-4 pt-4 border-t">
                                                                    {prescription.notes && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-900">Notes:</span>
                                                                            <p className="text-sm text-gray-700 mt-1">{prescription.notes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {prescriptions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">💊</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                                <p className="text-gray-500">No prescriptions found according to the selected filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    {prescriptions.length > 0 && (
                        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{totalPrescriptions}</div>
                                    <div className="text-sm text-blue-800 mt-1">Total Prescriptions</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{totalMedicines}</div>
                                    <div className="text-sm text-green-800 mt-1">Total Medicines</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {Math.round((prescriptionsWithFollowup / totalPrescriptions) * 100)}%
                                    </div>
                                    <div className="text-sm text-purple-800 mt-1">Follow-up Rate</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default PrescriptionsReport;
