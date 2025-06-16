import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

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
            end_date: endDate
        });
    };

    const handleExport = () => {
        console.log('Export to Excel');
    };

    // Group medicines by type
    const medicinesByType = medicines.reduce((acc, medicine) => {
        const type = medicine.type || 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(medicine);
        return acc;
    }, {} as Record<string, Medicine[]>);

    // Get top 10 most used medicines
    const topMedicines = medicines.slice(0, 10);

    // Calculate total usage
    const totalUsage = medicines.reduce((sum, medicine) => sum + medicine.usage_count, 0);

    const getTypeColor = (type: string) => {
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

    return (
        <AdminLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Medicine Usage Report
                </h2>
            }
        >
            <Head title="Medicine Usage Report" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Medicine Usage Report</h1>
                                <p className="text-gray-600">Total Medicine Prescriptions: {totalUsage}</p>
                                <p className="text-gray-600">Unique Medicines: {medicines.length}</p>
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

                    {/* Top Medicines Chart */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Top 10 Most Used Medicines</h3>
                        <div className="space-y-4">
                            {topMedicines.map((medicine, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm font-bold text-gray-700 w-6">
                                                #{index + 1}
                                            </span>
                                            <div>
                                                <span className="font-medium text-gray-900">{medicine.name}</span>
                                                {medicine.generic_name && (
                                                    <span className="text-gray-500 text-sm ml-2">({medicine.generic_name})</span>
                                                )}
                                                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(medicine.type)}`}>
                                                    {medicine.type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 ml-9">
                                            <div className="bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max((medicine.usage_count / topMedicines[0].usage_count) * 100, 5)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-lg font-bold text-blue-600">{medicine.usage_count}</div>
                                        <div className="text-xs text-gray-500">prescriptions</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medicine Types Summary */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Medicine Types Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(medicinesByType).map(([type, typeMedicines]) => {
                                const typeUsage = typeMedicines.reduce((sum, med) => sum + med.usage_count, 0);
                                return (
                                    <div key={type} className="bg-gray-50 rounded-lg p-4 text-center">
                                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${getTypeColor(type)}`}>
                                            <span className="text-lg font-bold">
                                                {type === 'Tablet' ? '💊' :
                                                 type === 'Syrup' ? '🍯' :
                                                 type === 'Drops' ? '💧' :
                                                 type === 'Injection' ? '💉' :
                                                 type === 'Capsule' ? '💊' :
                                                 type === 'Ointment' ? '🧴' :
                                                 type === 'Cream' ? '🧴' : '🏥'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 mb-1">{type}</h4>
                                        <p className="text-2xl font-bold text-blue-600 mb-1">{typeUsage}</p>
                                        <p className="text-sm text-gray-600">{typeMedicines.length} unique medicines</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">All Medicine Usage Details</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Medicine Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Generic Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Common Dosage
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Common Duration
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usage Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {medicines.map((medicine, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                                                {medicine.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {medicine.generic_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(medicine.type)}`}>
                                                    {medicine.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {medicine.dosage}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {medicine.duration || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    {medicine.usage_count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {medicines.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🏥</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No medicine usage found</h3>
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
