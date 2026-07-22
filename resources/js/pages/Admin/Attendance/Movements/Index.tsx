import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, Filter, MapPin, Printer, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminMovementsIndex({ movements, employees, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [employeeId, setEmployeeId] = useState(filters.employee_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.movements.index'),
            {
                search,
                employee_id: employeeId,
                start_date: startDate,
                end_date: endDate,
                status,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setEmployeeId('');
        setStartDate('');
        setEndDate('');
        setStatus('');
        router.get(route('admin.movements.index'), {}, { preserveState: true });
    };

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

    const employeeOptions = [
        { value: '', label: 'All Employees' },
        ...(employees ?? []).map((emp: any) => ({
            value: String(emp.id),
            label: `${emp.name} (${emp.employee_code})`,
        })),
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active (Ongoing)' },
        { value: 'completed', label: 'Completed' },
    ];

    return (
        <AdminLayout title="Movement Monitoring">
            <Head title="Employee Movements" />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-root { max-width: none !important; padding: 0 !important; }
                    .print-title { display: block !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
                }
                .print-title { display: none; }
            `}</style>

            <div className="print-root max-w-7xl mx-auto space-y-6 pb-12">
                {/* Printable Header */}
                <div className="print-title border-b border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Eye Hospital Management</h1>
                    <h2 className="text-lg font-semibold text-gray-700 mt-1">Employee Movement Records Report</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Printed Date: {format(new Date(), 'MMM d, yyyy h:mm a')} | Total Filtered Records: {movements.total || movements.data.length}
                    </p>
                </div>

                {/* Header Title */}
                <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <MapPin className="h-6 w-6 text-blue-600" />
                            Employee Movement Records
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Monitor live field movements, duration, and historical logs across all staff.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => window.print()} className="bg-white shadow-sm border-gray-200">
                        <Printer className="w-4 h-4 mr-2 text-gray-600" />
                        Print A4 Report
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <Card className="no-print">
                    <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleFilter} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                <div>
                                    <Input
                                        placeholder="Search purpose/location..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                                    />
                                </div>
                                <div>
                                    <Select
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                        options={employeeOptions}
                                        placeholder="Select Employee"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="Start Date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="End Date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        options={statusOptions}
                                        placeholder="Select Status"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                                </Button>
                                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Filter className="h-3.5 w-3.5 mr-1" /> Filter Records
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Movements Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time (AM/PM)</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose / Location</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {movements.data.length > 0 ? (
                                    movements.data.map((movement: any) => {
                                        const isOngoing = !movement.end_time;
                                        const startStr = movement.start_time_formatted || movement.start_time;
                                        const endStr = isOngoing ? 'Ongoing' : (movement.end_time_formatted || movement.end_time);
                                        const timeString = `${startStr} - ${endStr}`;
                                        const durationText = calculateDuration(movement);

                                        return (
                                            <tr key={movement.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className="no-print h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                            {movement.employee?.name?.charAt(0) || 'E'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{movement.employee?.name || 'Unknown'}</p>
                                                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                {movement.employee?.employee_code || '--'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                                                    <div className="font-semibold text-gray-900 font-sans">
                                                        {format(new Date(movement.date), 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{timeString}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div className="font-semibold text-gray-900">{movement.purpose}</div>
                                                    {movement.location && (
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <MapPin className="no-print h-3 w-3 text-gray-400" />
                                                            {movement.location}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono text-slate-700 border border-slate-200">
                                                        <Clock className="no-print w-3 h-3 text-slate-500" />
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
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No movement records match the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {movements.links && movements.data.length > 0 && (
                        <div className="no-print px-6 py-3.5 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Showing {movements.from} to {movements.to} of {movements.total} entries
                            </span>
                            <div className="flex items-center gap-1">
                                {movements.links.map((link: any, idx: number) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
