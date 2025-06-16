import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface Doctor {
    id: number;
    user_id: number;
    specialization: string | null;
    qualification: string | null;
    consultation_fee: number;
    is_available: boolean;
    created_at: string;
    user: {
        name: string;
        email: string;
        phone: string | null;
        is_active: boolean;
    };
}

interface Props {
    doctors: Doctor[];
}

const DoctorsReport: React.FC<Props> = ({ doctors }) => {
    const handleExport = () => {
        console.log('Export to Excel');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatCurrency = (amount: number) => {
        return `৳${amount.toLocaleString()}`;
    };

    // Calculate statistics
    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter(doctor => doctor.is_available).length;
    const averageFee = totalDoctors > 0 ? doctors.reduce((sum, doctor) => sum + doctor.consultation_fee, 0) / totalDoctors : 0;
    const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))];

    // Group doctors by specialization
    const doctorsBySpecialization = doctors.reduce((acc, doctor) => {
        const spec = doctor.specialization || 'General';
        if (!acc[spec]) {
            acc[spec] = [];
        }
        acc[spec].push(doctor);
        return acc;
    }, {} as Record<string, Doctor[]>);

    const getStatusBadge = (isAvailable: boolean) => {
        return isAvailable
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    const getSpecializationColor = (specialization: string) => {
        const colors: Record<string, string> = {
            'Ophthalmology': 'bg-blue-100 text-blue-800',
            'Cardiology': 'bg-red-100 text-red-800',
            'Neurology': 'bg-purple-100 text-purple-800',
            'Dermatology': 'bg-green-100 text-green-800',
            'Orthopedics': 'bg-yellow-100 text-yellow-800',
            'General': 'bg-gray-100 text-gray-800'
        };
        return colors[specialization] || colors['General'];
    };

    return (
        <AdminLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Doctor Report
                </h2>
            }
        >
            <Head title="Doctor Report" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Report</h1>
                                <p className="text-gray-600">Total Doctors: {totalDoctors}</p>
                                <p className="text-gray-600">Available: {availableDoctors} | Unavailable: {totalDoctors - availableDoctors}</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="mt-4 lg:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                📊 Export to Excel
                            </button>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{totalDoctors}</div>
                                <div className="text-sm text-blue-800">Total Doctors</div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{availableDoctors}</div>
                                <div className="text-sm text-green-800">Available</div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{specializations.length}</div>
                                <div className="text-sm text-purple-800">Specializations</div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{formatCurrency(Math.round(averageFee))}</div>
                                <div className="text-sm text-orange-800">Avg. Fee</div>
                            </div>
                        </div>
                    </div>

                    {/* Specialization Summary */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Doctors by Specialization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(doctorsBySpecialization).map(([specialization, specDoctors]) => (
                                <div key={specialization} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSpecializationColor(specialization)}`}>
                                            {specialization}
                                        </span>
                                        <span className="text-lg font-bold text-gray-900">{specDoctors.length}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Available: {specDoctors.filter(d => d.is_available).length}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Avg Fee: {formatCurrency(Math.round(specDoctors.reduce((sum, d) => sum + d.consultation_fee, 0) / specDoctors.length))}
                                    </div>
                                </div>
                            ))}
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
                                            Doctor Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Phone
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Specialization
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Qualification
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Consultation Fee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {doctors.map((doctor, index) => (
                                        <tr key={doctor.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <div>
                                                    <div className="font-medium">{doctor.user.name}</div>
                                                    {!doctor.user.is_active && (
                                                        <div className="text-xs text-red-500">Inactive User</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {doctor.user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {doctor.user.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSpecializationColor(doctor.specialization || 'General')}`}>
                                                    {doctor.specialization || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200 max-w-xs">
                                                <div className="truncate" title={doctor.qualification || 'N/A'}>
                                                    {doctor.qualification || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                    {formatCurrency(doctor.consultation_fee)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(doctor.is_available)}`}>
                                                    {doctor.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(doctor.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {doctors.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">👨‍⚕️</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                                <p className="text-gray-500">No doctors are registered in the system.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DoctorsReport;
