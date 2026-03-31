import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import React from 'react';

interface Stats {
    total_patients: number;
    total_doctors: number;
    today_appointments: number;
    pending_appointments: number;
    completed_appointments_today: number;
    vision_tests_today: number;
    prescriptions_today: number;
    monthly_patients: number;
    monthly_appointments: number;
    yearly_patients: number;
}

interface MonthlyData {
    month: number;
    count: number;
}

interface WeeklyData {
    date: string;
    count: number;
}

interface Props {
    stats: Stats;
    monthlyPatients: MonthlyData[];
    weeklyAppointments: WeeklyData[];
}

const Dashboard: React.FC<Props> = ({ stats, monthlyPatients, weeklyAppointments }) => {
    const statCards = [
        {
            title: 'Total Patients',
            value: stats.total_patients,
            icon: '👥',
            color: 'bg-blue-50 border-blue-200 text-blue-800',
            iconBg: 'bg-blue-100',
        },
        {
            title: 'Total Doctors',
            value: stats.total_doctors,
            icon: '👨‍⚕️',
            color: 'bg-purple-50 border-purple-200 text-purple-800',
            iconBg: 'bg-purple-100',
        },
        {
            title: "Today's Appointments",
            value: stats.today_appointments,
            icon: '📅',
            color: 'bg-green-50 border-green-200 text-green-800',
            iconBg: 'bg-green-100',
        },
        {
            title: 'Pending Appointments',
            value: stats.pending_appointments,
            icon: '⏳',
            color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconBg: 'bg-yellow-100',
        },
        {
            title: 'Completed Today',
            value: stats.completed_appointments_today,
            icon: '✅',
            color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            iconBg: 'bg-emerald-100',
        },
        {
            title: 'Vision Tests Today',
            value: stats.vision_tests_today,
            icon: '👁️',
            color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
            iconBg: 'bg-indigo-100',
        },
        {
            title: 'Prescriptions Today',
            value: stats.prescriptions_today,
            icon: '💊',
            color: 'bg-pink-50 border-pink-200 text-pink-800',
            iconBg: 'bg-pink-100',
        },
        {
            title: 'Monthly Patients',
            value: stats.monthly_patients,
            icon: '📈',
            color: 'bg-teal-50 border-teal-200 text-teal-800',
            iconBg: 'bg-teal-100',
        },
    ];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <AdminLayout header={<h2 className="text-xl leading-tight font-semibold text-gray-800">Dashboard Report</h2>}>
            <Head title="Dashboard Report" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-600">Hospital Management System Statistics</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((card, index) => (
                            <div key={index} className={`${card.color} rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium opacity-80">{card.title}</p>
                                        <p className="mt-2 text-3xl font-bold">{card.value.toLocaleString()}</p>
                                    </div>
                                    <div className={`${card.iconBg} rounded-full p-3`}>
                                        <span className="text-2xl">{card.icon}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Monthly Patients Chart */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-6 text-xl font-bold text-gray-900">Monthly Patient Registration</h3>
                            <div className="space-y-4">
                                {monthlyPatients.map((data, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="w-12 text-sm font-medium text-gray-700">{monthNames[data.month - 1]}</span>
                                        <div className="mx-4 flex-1">
                                            <div className="h-3 rounded-full bg-gray-200">
                                                <div
                                                    className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max((data.count / Math.max(...monthlyPatients.map((d) => d.count))) * 100, 5)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="w-8 text-right text-sm font-semibold text-gray-900">{data.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weekly Appointments Chart */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-6 text-xl font-bold text-gray-900">Weekly Appointments</h3>
                            <div className="space-y-4">
                                {weeklyAppointments.map((data, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="w-20 text-sm font-medium text-gray-700">
                                            {new Date(data.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                        <div className="mx-4 flex-1">
                                            <div className="h-3 rounded-full bg-gray-200">
                                                <div
                                                    className="h-3 rounded-full bg-green-600 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max((data.count / Math.max(...weeklyAppointments.map((d) => d.count))) * 100, 5)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="w-8 text-right text-sm font-semibold text-gray-900">{data.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-6 text-xl font-bold text-gray-900">Quick Summary</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.yearly_patients}</div>
                                <div className="mt-1 text-sm text-gray-600">Patients This Year</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.monthly_appointments}</div>
                                <div className="mt-1 text-sm text-gray-600">Appointments This Month</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {stats.pending_appointments > 0
                                        ? Math.round((stats.completed_appointments_today / stats.today_appointments) * 100) || 0
                                        : 0}
                                    %
                                </div>
                                <div className="mt-1 text-sm text-gray-600">Today's Completion Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
