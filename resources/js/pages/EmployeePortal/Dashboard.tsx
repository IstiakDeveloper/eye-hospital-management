import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Activity,
    ArrowUpRight,
    Calendar,
    Clock,
    FileText,
    LogOut,
    MapPin,
    UserCheck,
    UserX,
} from 'lucide-react';

export default function EmployeeDashboard({
    employee,
    recentLeaves,
    recentMovements,
    recentAttendances,
    attendanceSummary,
    todayState,
}: any) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider"><UserCheck className="w-3.5 h-3.5" /> Present</span>;
            case 'late':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Late</span>;
            case 'on_movement':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" /> On Movement</span>;
            case 'absent':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider"><UserX className="w-3.5 h-3.5" /> Absent</span>;
            case 'weekend':
            case 'holiday':
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-bold uppercase tracking-wider"><Calendar className="w-3.5 h-3.5" /> Off Day</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider"><UserX className="w-3.5 h-3.5" /> Absent</span>;
        }
    };

    return (
        <AdminLayout title="Employee Portal">
            <Head title="Employee Portal" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Hero Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Employee Portal • {employee.department || 'General'}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                Welcome back, {employee.name}
                            </h1>
                            <p className="text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-mono bg-white/10 text-white px-2 py-0.5 rounded text-xs">
                                    ID: {employee.employee_code}
                                </span>
                                <span>•</span>
                                <span>{employee.designation || 'Staff Member'}</span>
                                <span>•</span>
                                <span className="text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md shadow-sm">
                                <Link href={route('employee.leaves.create')}>
                                    <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                                    Apply Leave
                                </Link>
                            </Button>
                            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30">
                                <Link href={route('employee.movements.create')}>
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Start Movement
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Personal Today Status Ribbon */}
                    {todayState && (
                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between sm:justify-start gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">My Status Today:</span>
                                {getStatusBadge(todayState.my_status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-slate-300 font-medium">Check In:</span>
                                <span className="font-bold text-white font-mono">{todayState.check_in || 'Not Punched Yet'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <LogOut className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-slate-300 font-medium">Check Out:</span>
                                <span className="font-bold text-white font-mono">{todayState.check_out || 'Not Closed Yet'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* Total Days */}
                    <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Days This Month</span>
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Calendar className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-slate-900">{attendanceSummary.total_days}</span>
                            <span className="text-xs text-slate-400 font-medium">Monthly total</span>
                        </div>
                    </div>

                    {/* Present Days */}
                    <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Present</span>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <UserCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-emerald-600">{attendanceSummary.present}</span>
                            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">On Time / Half-day</span>
                        </div>
                    </div>

                    {/* Absent Days */}
                    <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Absent</span>
                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                <UserX className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-rose-600">{attendanceSummary.absent}</span>
                            <span className="text-xs text-rose-500 font-medium">Days missed</span>
                        </div>
                    </div>

                    {/* Late Days */}
                    <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Late Days</span>
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-3xl font-extrabold text-amber-600">{attendanceSummary.late}</span>
                            <span className="text-xs text-amber-600 font-medium">Check-in delays</span>
                        </div>
                    </div>
                </div>

                {/* 3-Column Content Overview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* 1. Recent Attendance */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px] overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-600" />
                                Recent Attendance
                            </h2>
                            <Link href={route('employee.attendance.index')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto">
                            {recentAttendances?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentAttendances.map((att: any) => (
                                        <div key={att.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-900">{format(new Date(att.work_date), 'MMM d, yyyy')}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    In: {att.first_in_at ? format(new Date(att.first_in_at), 'hh:mm a') : '--'} | Out: {att.last_out_at ? format(new Date(att.last_out_at), 'hh:mm a') : '--'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    att.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                    att.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                                    att.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {att.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">No attendance logs found</div>
                            )}
                        </div>
                    </div>

                    {/* 2. Recent Leave Applications */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px] overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Recent Leave Requests
                            </h2>
                            <Link href={route('employee.leaves.index')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto">
                            {recentLeaves?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentLeaves.map((leave: any) => (
                                        <div key={leave.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-900">{leave.leave_type?.name || 'Leave'}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    {leave.start_date} to {leave.end_date} ({leave.total_days} days)
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {leave.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">No leave requests found</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Recent Movements */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[400px] overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                Recent Movements
                            </h2>
                            <Link href={route('employee.movements.index')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="p-0 flex-1 overflow-y-auto">
                            {recentMovements?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentMovements.map((movement: any) => (
                                        <div key={movement.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-slate-900">{movement.purpose}</div>
                                                <div className="text-[11px] text-slate-500">
                                                    {movement.location || 'Official'} • {movement.start_time} - {movement.end_time || 'Active'}
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    movement.end_time ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700 animate-pulse'
                                                }`}>
                                                    {movement.end_time ? 'Completed' : 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">No movements recorded</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
