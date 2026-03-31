import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface VisionTest {
    id: number;
    patient_id: number;
    right_eye_vision: string | null;
    left_eye_vision: string | null;
    right_eye_power: number | null;
    left_eye_power: number | null;
    right_eye_pressure: string | null;
    left_eye_pressure: string | null;
    additional_notes: string | null;
    test_date: string;
    created_at: string;
    patient: {
        name: string;
        patient_id: string;
        phone: string | null;
    };
    performed_by: {
        name: string;
    } | null;
}

interface Props {
    visionTests: VisionTest[];
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

const VisionTestsReport: React.FC<Props> = ({ visionTests, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleFilter = () => {
        router.get('/reports/vision-tests', {
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

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Vision Test Report</h2>}>
            <Head title="Vision Test Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">Vision Test Report</h1>
                                <p className="text-gray-600">Total Vision Tests: {visionTests.length}</p>
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
                                            Right Eye Vision
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Left Eye Vision
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Right Eye Power
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Left Eye Power
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Right Eye Pressure
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Left Eye Pressure
                                        </th>
                                        <th className="border-r border-gray-200 px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Performed By
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Test Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {visionTests.map((test, index) => (
                                        <tr key={test.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <div>
                                                    <div className="font-medium">{test.patient.name}</div>
                                                    <div className="text-xs text-gray-500">{test.patient.patient_id}</div>
                                                    <div className="text-xs text-gray-500">{test.patient.phone || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                                    {test.right_eye_vision || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                    {test.left_eye_vision || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {test.right_eye_power ? `${test.right_eye_power}D` : 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {test.left_eye_power ? `${test.left_eye_power}D` : 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {test.right_eye_pressure || 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {test.left_eye_pressure || 'N/A'}
                                            </td>
                                            <td className="border-r border-gray-200 px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                {test.performed_by?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{formatDateTime(test.test_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {visionTests.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">👁️</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No vision tests found</h3>
                                <p className="text-gray-500">No vision tests found according to the selected filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default VisionTestsReport;
