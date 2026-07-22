import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Clock, Filter, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function AttendanceIndex({ attendances, currentMonth, currentYear }: any) {
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('employee.attendance.index'), { month, year }, { preserveState: true });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'present':
                return 'bg-emerald-100 text-emerald-800';
            case 'late':
                return 'bg-amber-100 text-amber-800';
            case 'absent':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const m = (i + 1).toString().padStart(2, '0');
        return {
            value: m,
            label: format(new Date(2000, i, 1), 'MMMM'),
        };
    });

    const yearOptions = Array.from({ length: 5 }, (_, i) => {
        const y = String(new Date().getFullYear() - i);
        return { value: y, label: y };
    });

    return (
        <AdminLayout title="My Attendance">
            <Head title="My Attendance" />

            <div className="max-w-7xl mx-auto space-y-5 pb-12">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Clock className="h-6 w-6 text-blue-600" />
                            My Attendance Log
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Monthly check-in/out records and shift durations.
                        </p>
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 sm:w-36">
                            <Select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                options={monthOptions}
                                placeholder="Month"
                            />
                        </div>
                        <div className="w-24 sm:w-28">
                            <Select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                options={yearOptions}
                                placeholder="Year"
                            />
                        </div>
                        <Button type="submit" size="default" className="bg-blue-600 hover:bg-blue-700">
                            <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                            Filter
                        </Button>
                    </form>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendances.length > 0 ? (
                                    attendances.map((record: any) => (
                                        <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {format(new Date(record.work_date), 'MMM d, yyyy (EEEE)')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {record.first_in_at ? format(new Date(record.first_in_at), 'hh:mm a') : '--:--'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {record.last_out_at ? format(new Date(record.last_out_at), 'hh:mm a') : '--:--'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 font-semibold">
                                                {record.minutes_worked
                                                    ? `${Math.floor(record.minutes_worked / 60)}h ${record.minutes_worked % 60}m`
                                                    : '--'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${getStatusStyle(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No attendance records found for this month.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Feed Cards View */}
                <div className="md:hidden space-y-3">
                    {attendances.length > 0 ? (
                        attendances.map((record: any) => (
                            <div key={record.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-bold text-slate-900 text-sm">
                                            {format(new Date(record.work_date), 'MMM d, yyyy (EEE)')}
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getStatusStyle(record.status)}`}>
                                        {record.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>In: <strong>{record.first_in_at ? format(new Date(record.first_in_at), 'hh:mm a') : '--:--'}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                        <span>Out: <strong>{record.last_out_at ? format(new Date(record.last_out_at), 'hh:mm a') : '--:--'}</strong></span>
                                    </div>
                                </div>

                                {record.minutes_worked && (
                                    <div className="text-right text-[11px] text-slate-500 font-mono font-semibold">
                                        Worked: <span className="text-blue-700">{Math.floor(record.minutes_worked / 60)}h {record.minutes_worked % 60}m</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-sm text-slate-500">
                            No attendance records found for this month.
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
