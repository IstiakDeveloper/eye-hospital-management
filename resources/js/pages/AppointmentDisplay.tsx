// resources/js/pages/AppointmentDisplay.tsx
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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
            hour12: true
        });
    };

    const formatLastUpdated = () => {
        return lastUpdated.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Get queue position for pending patients
    const getQueuePosition = (appointments, currentAppointment) => {
        const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
        const index = pendingAppointments.findIndex(apt => apt.id === currentAppointment.id);
        return index + 1;
    };

    const getCurrentlyServing = (appointments) => {
        return appointments.find(apt => apt.status === 'processing');
    };

    const getPendingCount = (appointments) => {
        return appointments.filter(apt => apt.status === 'pending').length;
    };

    const getActiveAppointments = (appointments) => {
        return appointments.filter(apt => apt.status !== 'completed');
    };

    return (
        <>
            <Head title="Patient Queue Display" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                    🏥 Patient Queue Display
                                </h1>
                                <p className="text-gray-600">Auto-refreshing appointment status</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatTime()}
                                </div>
                                <div className="flex items-center justify-end mt-2">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                                    <span className="text-green-600 font-medium text-sm">
                                        {isLoading ? 'Updating...' : 'Auto Updates (1s)'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Last updated: {formatLastUpdated()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Refresh Button */}
                <div className="max-w-7xl mx-auto mb-4">
                    <div className="flex justify-end">
                        <button
                            onClick={fetchAppointments}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                isLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Refreshing...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    🔄 Refresh Now
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Doctors Grid */}
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {doctors.map((doctor) => {
                            const currentlyServing = getCurrentlyServing(doctor.recent_appointments);
                            const pendingCount = getPendingCount(doctor.recent_appointments);
                            const activeAppointments = getActiveAppointments(doctor.recent_appointments);

                            return (
                                <div key={doctor.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transform transition-all hover:scale-105">
                                    {/* Doctor Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold">Dr. {doctor.user.name}</h2>
                                                <p className="text-blue-100 text-sm">
                                                    {doctor.specialization || 'General Practice'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                    doctor.is_available
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                }`}>
                                                    {doctor.is_available ? '🟢 Available' : '🔴 Unavailable'}
                                                </div>
                                                <div className="text-blue-100 text-sm mt-1">
                                                    {pendingCount} in queue
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Currently Serving */}
                                    {currentlyServing ? (
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-blue-800 font-bold text-lg flex items-center">
                                                        🔄 NOW SERVING
                                                    </div>
                                                    <div className="text-xl font-bold text-gray-900 mt-1">
                                                        {currentlyServing.patient?.name || 'Patient'}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Serial: #{currentlyServing.serial_number}
                                                    </div>
                                                </div>
                                                <div className="text-blue-600">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                            <div className="text-green-800 font-bold text-lg">
                                                ✨ Doctor Available
                                            </div>
                                            <div className="text-green-600 text-sm">
                                                Ready for next patient
                                            </div>
                                        </div>
                                    )}

                                    {/* Queue List */}
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            📋 Queue Status
                                            {pendingCount > 0 && (
                                                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                                                    {pendingCount} waiting
                                                </span>
                                            )}
                                        </h3>

                                        {activeAppointments?.length > 0 ? (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {activeAppointments.map((appointment, index) => {
                                                    const queuePosition = appointment.status === 'pending'
                                                        ? getQueuePosition(doctor.recent_appointments, appointment)
                                                        : null;

                                                    return (
                                                        <div
                                                            key={appointment.id}
                                                            className={`rounded-lg p-4 border-2 transition-all duration-300 ${
                                                                appointment.status === 'processing'
                                                                    ? 'bg-blue-100 border-blue-300 shadow-lg'
                                                                    : appointment.status === 'pending'
                                                                    ? 'bg-yellow-50 border-yellow-200'
                                                                    : 'bg-red-50 border-red-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    {/* Queue Number */}
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                                                        appointment.status === 'processing'
                                                                            ? 'bg-blue-600 text-white'
                                                                            : appointment.status === 'pending'
                                                                            ? 'bg-yellow-500 text-white'
                                                                            : 'bg-red-500 text-white'
                                                                    }`}>
                                                                        {appointment.status === 'pending' && queuePosition
                                                                            ? queuePosition
                                                                            : appointment.status === 'processing'
                                                                            ? '🔄'
                                                                            : '✕'
                                                                        }
                                                                    </div>

                                                                    {/* Patient Info */}
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900">
                                                                            {appointment.patient?.name || 'Unknown Patient'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">
                                                                            Serial: #{appointment.serial_number}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {appointment.appointment_time}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Status Badge */}
                                                                <div className="text-right">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                        appointment.status === 'processing'
                                                                            ? 'bg-blue-600 text-white'
                                                                            : appointment.status === 'pending'
                                                                            ? 'bg-yellow-500 text-white'
                                                                            : 'bg-red-500 text-white'
                                                                    }`}>
                                                                        {appointment.status === 'processing' && '🔄 IN PROGRESS'}
                                                                        {appointment.status === 'pending' && `⏳ POSITION ${queuePosition}`}
                                                                        {appointment.status === 'cancelled' && '❌ CANCELLED'}
                                                                    </span>

                                                                    {appointment.status === 'pending' && queuePosition && (
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {queuePosition === 1 ? 'Next in line' :
                                                                             queuePosition === 2 ? 'Second in line' :
                                                                             `${queuePosition} in queue`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="text-6xl mb-4">🎉</div>
                                                <p className="text-lg font-medium">No Queue!</p>
                                                <p className="text-sm">Doctor is ready for walk-ins</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="bg-gray-50 p-4 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-yellow-600">
                                                {doctor.recent_appointments?.filter(apt => apt.status === 'pending').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Waiting</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {doctor.recent_appointments?.filter(apt => apt.status === 'processing').length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Current</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-red-600">
                                                {doctor.recent_appointments?.filter(apt => apt.status === 'cancelled').length || 0}
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
                    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-700 font-medium">Updating appointments...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
