// resources/js/pages/AppointmentDisplay.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function AppointmentDisplay({ doctors: initialDoctors }) {
    const [doctors, setDoctors] = useState(initialDoctors);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Fetch fresh data from API
    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointment-display-data');
            if (response.ok) {
                const data = await response.json();
                setDoctors(data.doctors);
                setLastUpdated(new Date());
                console.log('🔄 Data refreshed from API at:', new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('❌ Failed to fetch appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh data every 30 seconds using API fetch
    useEffect(() => {
        const dataTimer = setInterval(() => {
            fetchAppointments();
        }, 1000); // 30 seconds

        return () => clearInterval(dataTimer);
    }, []);

    // Date format helper
    const formatTime = (time) => {
        return currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatLastUpdated = () => {
        return lastUpdated.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    // Get queue position for pending patients
    const getQueuePosition = (appointments, currentAppointment) => {
        const pendingAppointments = appointments.filter((apt) => apt.status === 'pending');
        const index = pendingAppointments.findIndex((apt) => apt.id === currentAppointment.id);
        return index + 1;
    };

    const getCurrentlyServing = (appointments) => {
        return appointments.find((apt) => apt.status === 'processing');
    };

    const getPendingCount = (appointments) => {
        return appointments.filter((apt) => apt.status === 'pending').length;
    };

    const getActiveAppointments = (appointments) => {
        return appointments.filter((apt) => apt.status !== 'completed');
    };

    return (
        <>
            <Head title="Patient Queue Display" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                {/* Header */}
                <div className="mx-auto mb-6 max-w-7xl">
                    <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="mb-2 text-4xl font-bold text-gray-900">🏥 Patient Queue Display</h1>
                                <p className="text-gray-600">Auto-refreshing appointment status</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{formatTime()}</div>
                                <div className="mt-2 flex items-center justify-end">
                                    <div
                                        className={`mr-2 h-3 w-3 rounded-full ${isLoading ? 'animate-pulse bg-yellow-500' : 'animate-pulse bg-green-500'}`}
                                    ></div>
                                    <span className="text-sm font-medium text-green-600">{isLoading ? 'Updating...' : 'Auto Updates (1s)'}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">Last updated: {formatLastUpdated()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Refresh Button */}
                <div className="mx-auto mb-4 max-w-7xl">
                    <div className="flex justify-end">
                        <button
                            onClick={fetchAppointments}
                            disabled={isLoading}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                isLoading
                                    ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Refreshing...
                                </span>
                            ) : (
                                <span className="flex items-center">🔄 Refresh Now</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Doctors Grid */}
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
                        {doctors.map((doctor) => {
                            const currentlyServing = getCurrentlyServing(doctor.recent_appointments);
                            const pendingCount = getPendingCount(doctor.recent_appointments);
                            const activeAppointments = getActiveAppointments(doctor.recent_appointments);

                            return (
                                <div
                                    key={doctor.id}
                                    className="transform overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-all hover:scale-105"
                                >
                                    {/* Doctor Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold">Dr. {doctor.user.name}</h2>
                                                <p className="text-sm text-blue-100">{doctor.specialization || 'General Practice'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                                        doctor.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                    }`}
                                                >
                                                    {doctor.is_available ? '🟢 Available' : '🔴 Unavailable'}
                                                </div>
                                                <div className="mt-1 text-sm text-blue-100">{pendingCount} in queue</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Currently Serving */}
                                    {currentlyServing ? (
                                        <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center text-lg font-bold text-blue-800">🔄 NOW SERVING</div>
                                                    <div className="mt-1 text-xl font-bold text-gray-900">
                                                        {currentlyServing.patient?.name || 'Patient'}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Serial: #{currentlyServing.serial_number}</div>
                                                </div>
                                                <div className="text-blue-600">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-l-4 border-green-500 bg-green-50 p-4">
                                            <div className="text-lg font-bold text-green-800">✨ Doctor Available</div>
                                            <div className="text-sm text-green-600">Ready for next patient</div>
                                        </div>
                                    )}

                                    {/* Queue List */}
                                    <div className="p-6">
                                        <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900">
                                            📋 Queue Status
                                            {pendingCount > 0 && (
                                                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-sm text-yellow-800">
                                                    {pendingCount} waiting
                                                </span>
                                            )}
                                        </h3>

                                        {activeAppointments?.length > 0 ? (
                                            <div className="max-h-96 space-y-3 overflow-y-auto">
                                                {activeAppointments.map((appointment, index) => {
                                                    const queuePosition =
                                                        appointment.status === 'pending'
                                                            ? getQueuePosition(doctor.recent_appointments, appointment)
                                                            : null;

                                                    return (
                                                        <div
                                                            key={appointment.id}
                                                            className={`rounded-lg border-2 p-4 transition-all duration-300 ${
                                                                appointment.status === 'processing'
                                                                    ? 'border-blue-300 bg-blue-100 shadow-lg'
                                                                    : appointment.status === 'pending'
                                                                      ? 'border-yellow-200 bg-yellow-50'
                                                                      : 'border-red-200 bg-red-50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    {/* Queue Number */}
                                                                    <div
                                                                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                                                            appointment.status === 'processing'
                                                                                ? 'bg-blue-600 text-white'
                                                                                : appointment.status === 'pending'
                                                                                  ? 'bg-yellow-500 text-white'
                                                                                  : 'bg-red-500 text-white'
                                                                        }`}
                                                                    >
                                                                        {appointment.status === 'pending' && queuePosition
                                                                            ? queuePosition
                                                                            : appointment.status === 'processing'
                                                                              ? '🔄'
                                                                              : '✕'}
                                                                    </div>

                                                                    {/* Patient Info */}
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900">
                                                                            {appointment.patient?.name || 'Unknown Patient'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">
                                                                            Serial: #{appointment.serial_number}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{appointment.appointment_time}</div>
                                                                    </div>
                                                                </div>

                                                                {/* Status Badge */}
                                                                <div className="text-right">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                                            appointment.status === 'processing'
                                                                                ? 'bg-blue-600 text-white'
                                                                                : appointment.status === 'pending'
                                                                                  ? 'bg-yellow-500 text-white'
                                                                                  : 'bg-red-500 text-white'
                                                                        }`}
                                                                    >
                                                                        {appointment.status === 'processing' && '🔄 IN PROGRESS'}
                                                                        {appointment.status === 'pending' && `⏳ POSITION ${queuePosition}`}
                                                                        {appointment.status === 'cancelled' && '❌ CANCELLED'}
                                                                    </span>

                                                                    {appointment.status === 'pending' && queuePosition && (
                                                                        <div className="mt-1 text-xs text-gray-500">
                                                                            {queuePosition === 1
                                                                                ? 'Next in line'
                                                                                : queuePosition === 2
                                                                                  ? 'Second in line'
                                                                                  : `${queuePosition} in queue`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-gray-500">
                                                <div className="mb-4 text-6xl">🎉</div>
                                                <p className="text-lg font-medium">No Queue!</p>
                                                <p className="text-sm">Doctor is ready for walk-ins</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-yellow-600">
                                                {doctor.recent_appointments?.filter((apt) => apt.status === 'pending').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Waiting</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {doctor.recent_appointments?.filter((apt) => apt.status === 'processing').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Current</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-red-600">
                                                {doctor.recent_appointments?.filter((apt) => apt.status === 'cancelled').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Cancelled</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="bg-opacity-10 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="rounded-lg bg-white p-6 shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                <span className="font-medium text-gray-700">Updating appointments...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
