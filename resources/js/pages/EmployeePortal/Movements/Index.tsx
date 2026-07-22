import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, MapPin, Plus, Square } from 'lucide-react';

export default function MovementsIndex({ movements }: any) {
    const calculateDuration = (movement: any) => {
        try {
            if (movement.start_timestamp_ms) {
                const endMs = movement.end_time
                    ? (movement.updated_at ? new Date(movement.updated_at).getTime() : Date.now())
                    : Date.now();
                const diffMs = Math.max(0, endMs - movement.start_timestamp_ms);
                const totalMins = Math.floor(diffMs / (1000 * 60));
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;

                if (hrs > 0) {
                    return `${hrs}h ${mins}m`;
                }
                return `${mins}m`;
            }
            return '--';
        } catch {
            return '--';
        }
    };

    return (
        <AdminLayout title="My Movements">
            <Head title="My Movements" />

            <div className="max-w-7xl mx-auto space-y-5 pb-12">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <MapPin className="h-6 w-6 text-blue-600" />
                            My Movements Log
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">View your movement logs and active status.</p>
                    </div>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <Link href={route('employee.movements.create')}>
                            <Plus className="w-4 h-4 mr-2" /> Start Movement
                        </Link>
                    </Button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Range (AM/PM)</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose / Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {movements.data.length > 0 ? movements.data.map((movement: any) => {
                                    const isOngoing = !movement.end_time;
                                    const startStr = movement.start_time_formatted || movement.start_time;
                                    const endStr = isOngoing ? 'Ongoing' : (movement.end_time_formatted || movement.end_time);
                                    const timeString = `${startStr} - ${endStr}`;
                                    const durationText = calculateDuration(movement);

                                    return (
                                        <tr key={movement.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {format(new Date(movement.date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {timeString}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="font-semibold text-gray-900">{movement.purpose}</div>
                                                {movement.location && <div className="text-xs text-gray-500 mt-0.5">{movement.location}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono text-slate-700 border border-slate-200">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    {durationText} {isOngoing ? '(running)' : ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isOngoing ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        Completed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {isOngoing && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.patch(route('employee.movements.close', movement.id))}
                                                        className="h-8 text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100"
                                                    >
                                                        <Square className="h-3 w-3 mr-1 fill-amber-700 text-amber-700" />
                                                        End Movement
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No movements recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Feed Cards View */}
                <div className="md:hidden space-y-3">
                    {movements.data.length > 0 ? (
                        movements.data.map((movement: any) => {
                            const isOngoing = !movement.end_time;
                            const startStr = movement.start_time_formatted || movement.start_time;
                            const endStr = isOngoing ? 'Ongoing' : (movement.end_time_formatted || movement.end_time);
                            const timeString = `${startStr} - ${endStr}`;
                            const durationText = calculateDuration(movement);

                            return (
                                <div key={movement.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm leading-tight">{movement.purpose}</p>
                                            {movement.location && (
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    {movement.location}
                                                </p>
                                            )}
                                        </div>
                                        {isOngoing ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 animate-pulse shrink-0">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 shrink-0">
                                                Completed
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-slate-400 mr-1">{format(new Date(movement.date), 'MMM d')}:</span>
                                            <span>{timeString}</span>
                                        </div>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {durationText}
                                        </span>
                                    </div>

                                    {isOngoing && (
                                        <Button
                                            size="sm"
                                            onClick={() => router.patch(route('employee.movements.close', movement.id))}
                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9"
                                        >
                                            <Square className="h-3.5 w-3.5 mr-1.5 fill-white text-white" />
                                            End Movement Now
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-sm text-slate-500">
                            No movements recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
