import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface Medicine {
    name: string;
    generic_name: string | null;
    type: string;
    usage_count: number;
    dosage: string;
    duration: string | null;
}

interface Props {
    medicines: Medicine[];
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

const MedicinesReport: React.FC<Props> = ({ medicines, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilter = () => {
        router.get('/reports/medicines', {
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleExport = () => {
        console.log('Export to Excel');
    };

    // Group medicines by type
    const medicinesByType = medicines.reduce(
        (acc, medicine) => {
            const type = medicine.type || 'Other';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(medicine);
            return acc;
        },
        {} as Record<string, Medicine[]>,
    );

    // Get top 10 most used medicines
    const topMedicines = medicines.slice(0, 10);

    // Calculate total usage
    const totalUsage = medicines.reduce((sum, medicine) => sum + medicine.usage_count, 0);

    const getTypeColor = (type: string) => {
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

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Medicine Usage Report</h2>}>
            <Head title="Medicine Usage Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">Medicine Usage Report</h1>
                                <p className="text-gray-600">Total Medicine Prescriptions: {totalUsage}</p>
                                <p className="text-gray-600">Unique Medicines: {medicines.length}</p>
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

                    {/* Top Medicines Chart */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-6 text-xl font-bold text-gray-900">Top 10 Most Used Medicines</h3>
                        <div className="space-y-4">
                            {topMedicines.map((medicine, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <span className="w-6 text-sm font-bold text-gray-700">#{index + 1}</span>
                                            <div>
                                                <span className="font-medium text-gray-900">{medicine.name}</span>
                                                {medicine.generic_name && (
                                                    <span className="ml-2 text-sm text-gray-500">({medicine.generic_name})</span>
                                                )}
                                                <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${getTypeColor(medicine.type)}`}>
                                                    {medicine.type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 ml-9">
                                            <div className="h-2 rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max((medicine.usage_count / topMedicines[0].usage_count) * 100, 5)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <div className="text-lg font-bold text-blue-600">{medicine.usage_count}</div>
                                        <div className="text-xs text-gray-500">prescriptions</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medicine Types Summary */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">Medicine Types Summary</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(medicinesByType).map(([type, typeMedicines]) => {
                                const typeUsage = typeMedicines.reduce((sum, med) => sum + med.usage_count, 0);
                                return (
                                    <div key={type} className="rounded-lg bg-gray-50 p-4 text-center">
                                        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${getTypeColor(type)}`}>
                                            <span className="text-lg font-bold">
                                                {type === 'Tablet'
                                                    ? '💊'
                                                    : type === 'Syrup'
                                                      ? '🍯'
                                                      : type === 'Drops'
                                                        ? '💧'
                                                        : type === 'Injection'
                                                          ? '💉'
                                                          : type === 'Capsule'
                                                            ? '💊'
                                                            : type === 'Ointment'
                                                              ? '🧴'
                                                              : type === 'Cream'
                                                                ? '🧴'
                                                                : '🏥'}
                                            </span>
                                        </div>
                                        <h4 className="mb-1 font-semibold text-gray-900">{type}</h4>
                                        <p className="mb-1 text-2xl font-bold text-blue-600">{typeUsage}</p>
                                        <p className="text-sm text-gray-600">{typeMedicines.length} unique medicines</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">All Medicine Usage Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            #
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Medicine Name
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Generic Name
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Type
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Common Dosage
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Common Duration
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Usage Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {medicines.map((medicine, index) => (
                                        <tr key={index} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {medicine.name}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {medicine.generic_name || 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getTypeColor(medicine.type)}`}>
                                                    {medicine.type}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {medicine.dosage}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {medicine.duration || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                                                    {medicine.usage_count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {medicines.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">🏥</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No medicine usage found</h3>
                                <p className="text-gray-500">No medicine usage found according to the selected filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default MedicinesReport;
