import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Calendar, Clock, Plus } from 'lucide-react';

export default function LeavesIndex({ leaves, leaveSummary }: any) {
    const calculateDays = (startStr: string, endStr: string) => {
        try {
            const start = parseISO(startStr);
            const end = parseISO(endStr);
            const diff = differenceInDays(end, start);
            return diff >= 0 ? diff + 1 : 1;
        } catch {
            return 1;
        }
    };

    return (
        <AdminLayout title="My Leaves">
            <Head title="My Leaves" />

            <div className="max-w-7xl mx-auto space-y-5 pb-12">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-blue-600" />
                            My Leaves & Quotas
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Track your leave balance, quotas, and application status for {new Date().getFullYear()}.
                        </p>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <Link href={route('employee.leaves.create')}>
                            <Plus className="w-4 h-4 mr-2" /> Apply Leave
                        </Link>
                    </Button>
                </div>

                {/* Leave Quotas Summary Cards */}
                {leaveSummary && leaveSummary.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {leaveSummary.map((type: any) => {
                            const percentUsed = type.days_allowed > 0 
                                ? Math.min(100, Math.round((type.used_days / type.days_allowed) * 100)) 
                                : 0;

                            return (
                                <div key={type.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-2.5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{type.name}</h3>
                                        <span className="text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                                            {type.days_allowed} Days/Yr
                                        </span>
                                    </div>

                                    <div className="flex items-baseline justify-between pt-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{type.remaining_days}</span>
                                            <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">Left</span>
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                            {type.used_days} Used
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 h-1.5 sm:h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                percentUsed > 80 ? 'bg-rose-500' : percentUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${percentUsed}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Range</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.data.length > 0 ? leaves.data.map((leave: any) => {
                                    const durationDays = calculateDays(leave.start_date, leave.end_date);

                                    return (
                                        <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {leave.leave_type?.name || 'Leave'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {format(new Date(leave.start_date), 'MMM d, yyyy')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono text-slate-800 border border-slate-200">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {leave.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                    leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                    leave.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No leave applications found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Feed Cards View */}
                <div className="md:hidden space-y-3">
                    {leaves.data.length > 0 ? (
                        leaves.data.map((leave: any) => {
                            const durationDays = calculateDays(leave.start_date, leave.end_date);

                            return (
                                <div key={leave.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-sm">
                                            {leave.leave_type?.name || 'Leave'}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                            leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                            leave.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {leave.status}
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <span>
                                            {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                                        </span>
                                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                            {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                                        "{leave.reason}"
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-sm text-slate-500">
                            No leave applications found.
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
