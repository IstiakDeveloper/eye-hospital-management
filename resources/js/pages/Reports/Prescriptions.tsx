import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

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
            Tablet: 'bg-blue-100 text-blue-800',
            Syrup: 'bg-green-100 text-green-800',
            Drops: 'bg-purple-100 text-purple-800',
            Injection: 'bg-red-100 text-red-800',
            Capsule: 'bg-yellow-100 text-yellow-800',
            Ointment: 'bg-pink-100 text-pink-800',
            Cream: 'bg-indigo-100 text-indigo-800',
            Other: 'bg-gray-100 text-gray-800',
        };
        return colors[type] || colors['Other'];
    };

    // Calculate statistics
    const totalPrescriptions = prescriptions.length;
    const totalMedicines = prescriptions.reduce((sum, p) => sum + (p.prescription_medicines?.length || 0), 0);
    const prescriptionsWithFollowup = prescriptions.filter((p) => p.followup_date).length;
    const averageMedicinesPerPrescription = totalPrescriptions > 0 ? Math.round(totalMedicines / totalPrescriptions) : 0;

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Prescription Report</h2>}>
            <Head title="Prescription Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">Prescription Report</h1>
                                <p className="text-gray-600">Total Prescriptions: {totalPrescriptions}</p>
                                <p className="text-gray-600">Total Medicines Prescribed: {totalMedicines}</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:mt-0"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Statistics Cards */}
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{totalPrescriptions}</div>
                                <div className="text-sm text-blue-800">Total Prescriptions</div>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{totalMedicines}</div>
                                <div className="text-sm text-green-800">Medicines Prescribed</div>
                            </div>
                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{averageMedicinesPerPrescription}</div>
                                <div className="text-sm text-purple-800">Avg Medicines/Prescription</div>
                            </div>
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{prescriptionsWithFollowup}</div>
                                <div className="text-sm text-orange-800">With Follow-up</div>
                            </div>
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
                                            Patient
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Doctor
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Diagnosis
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Medicines Count
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Follow-up Date
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Prescribed Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {prescriptions.map((prescription, index) => (
                                        <React.Fragment key={prescription.id}>
                                            <tr className="transition-colors duration-150 hover:bg-gray-50">
                                                <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    <div>
                                                        <div className="font-medium">{prescription.patient.name}</div>
                                                        <div className="text-xs text-gray-500">{prescription.patient.patient_id}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {prescription.patient.phone || prescription.patient.email || 'N/A'}
                                                        </div>
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
                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                                                        {prescription.prescription_medicines?.length || 0} medicines
                                                    </span>
                                                </td>
                                                <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {prescription.followup_date ? (
                                                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                                            {formatDate(prescription.followup_date)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">No follow-up</span>
                                                    )}
                                                </td>
                                                <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {formatDateTime(prescription.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {prescription.prescription_medicines && prescription.prescription_medicines.length > 0 && (
                                                        <button
                                                            onClick={() => toggleRowExpansion(prescription.id)}
                                                            className="font-medium text-blue-600 hover:text-blue-800"
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
                                                        <div className="rounded-lg border bg-white p-4">
                                                            <h4 className="mb-3 font-semibold text-gray-900">Prescribed Medicines:</h4>
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                {prescription.prescription_medicines.map((med, medIndex) => (
                                                                    <div key={medIndex} className="rounded-lg border bg-gray-50 p-3">
                                                                        <div className="mb-2 flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-900">{med.medicine.name}</div>
                                                                                {med.medicine.generic_name && (
                                                                                    <div className="text-sm text-gray-600">
                                                                                        ({med.medicine.generic_name})
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span
                                                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${getMedicineTypeColor(med.medicine.type)}`}
                                                                            >
                                                                                {med.medicine.type}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1 text-sm">
                                                                            <div>
                                                                                <span className="font-medium">Dosage:</span> {med.dosage}
                                                                            </div>
                                                                            {med.duration && (
                                                                                <div>
                                                                                    <span className="font-medium">Duration:</span> {med.duration}
                                                                                </div>
                                                                            )}
                                                                            {med.instructions && (
                                                                                <div>
                                                                                    <span className="font-medium">Instructions:</span>{' '}
                                                                                    {med.instructions}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Additional prescription details */}
                                                            {(prescription.advice || prescription.notes) && (
                                                                <div className="mt-4 border-t pt-4">
                                                                    {prescription.notes && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-900">Notes:</span>
                                                                            <p className="mt-1 text-sm text-gray-700">{prescription.notes}</p>
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
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">💊</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No prescriptions found</h3>
                                <p className="text-gray-500">No prescriptions found according to the selected filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    {prescriptions.length > 0 && (
                        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Prescription Summary</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-lg bg-blue-50 p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{totalPrescriptions}</div>
                                    <div className="mt-1 text-sm text-blue-800">Total Prescriptions</div>
                                </div>
                                <div className="rounded-lg bg-green-50 p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{totalMedicines}</div>
                                    <div className="mt-1 text-sm text-green-800">Total Medicines</div>
                                </div>
                                <div className="rounded-lg bg-purple-50 p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {Math.round((prescriptionsWithFollowup / totalPrescriptions) * 100)}%
                                    </div>
                                    <div className="mt-1 text-sm text-purple-800">Follow-up Rate</div>
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
