import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

const ReportsIndex: React.FC = () => {
    const reportCards = [
        {
            title: 'Dashboard',
            description: 'Overall statistics and charts',
            icon: '📊',
            href: '/reports/dashboard',
            color: 'bg-blue-50 border-blue-200'
        },
        {
            title: 'Patient Report',
            description: 'List of all patients and details',
            icon: '👥',
            href: '/reports/patients',
            color: 'bg-green-50 border-green-200'
        },
        {
            title: 'Doctor Report',
            description: 'Doctor information and statistics',
            icon: '👨‍⚕️',
            href: '/reports/doctors',
            color: 'bg-purple-50 border-purple-200'
        },
        {
            title: 'Appointment Report',
            description: 'List of all appointments',
            icon: '📅',
            href: '/reports/appointments',
            color: 'bg-yellow-50 border-yellow-200'
        },
        {
            title: 'Vision Test Report',
            description: 'All eye examination records',
            icon: '👁️',
            href: '/reports/vision-tests',
            color: 'bg-indigo-50 border-indigo-200'
        },
        {
            title: 'Prescription Report',
            description: 'List of all prescriptions',
            icon: '💊',
            href: '/reports/prescriptions',
            color: 'bg-pink-50 border-pink-200'
        },
        {
            title: 'Revenue Report',
            description: 'Income calculation and statistics',
            icon: '💰',
            href: '/reports/revenue',
            color: 'bg-orange-50 border-orange-200'
        },
        {
            title: 'Medicine Usage Report',
            description: 'Medicine usage statistics',
            icon: '🏥',
            href: '/reports/medicines',
            color: 'bg-teal-50 border-teal-200'
        }
    ];

    return (
        <AdminLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Reports
                </h2>
            }
        >
            <Head title="Reports" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Reports</h1>
                        <p className="text-xl text-gray-600">Hospital Management System Reports</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reportCards.map((card, index) => (
                            <Link
                                key={index}
                                href={card.href}
                                className={`${card.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
                            >
                                <div className="text-center">
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                        {card.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        {card.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {card.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ReportsIndex;
