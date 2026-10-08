import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface EmployeeOption {
    id: number;
    employee_code: string;
    name: string;
}

interface AttendanceRecord {
    id: number;
    work_date: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    minutes_late: number | null;
    minutes_worked: number | null;
    minutes_early_leave: number | null;
    employee: EmployeeOption | null;
}

interface Paginator<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    employees: EmployeeOption[];
    records: Paginator<AttendanceRecord>;
    filters: {
        start_date: string;
        end_date: string;
        employee_id: string;
        status: string;
    };
    summary: Record<string, number>;
}

const statusLabels: Record<string, string> = {
    present: 'Present',
    late: 'Late',
    early_leave: 'Early leave',
    incomplete: 'Incomplete',
    absent: 'Absent',
    holiday: 'Holiday',
    weekend: 'Weekend',
};

function minutesLabel(minutes: number | null): string {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return [hours ? `${hours}h` : '', remainder ? `${remainder}m` : ''].filter(Boolean).join(' ') || '0m';
}

export default function AttendanceReport({ employees, records, filters, summary }: Props) {
    const metrics = [
        ['Total records', summary.total],
        ['Present', summary.present],
        ['Late', summary.late],
        ['Absent', summary.absent],
        ['Incomplete', summary.incomplete],
    ];

    return (
        <AdminLayout title="Attendance report">
            <Head title="Attendance report" />
            <style>{'@media print { .no-print { display: none !important; } }'}</style>

            <main className="mx-auto max-w-7xl space-y-6 pb-10">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance report</h1>
                        <p className="mt-1 text-sm text-slate-500">Filter attendance records by period, employee, and status.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="no-print inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                </header>

                <form method="get" action={route('attendance.report')} className="no-print grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5 dark:bg-slate-900">
                    <label className="grid gap-1 text-sm">
                        From
                        <input name="start_date" type="date" defaultValue={filters.start_date} className="rounded-md border px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        To
                        <input name="end_date" type="date" defaultValue={filters.end_date} className="rounded-md border px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        Employee
                        <select name="employee_id" defaultValue={filters.employee_id} className="rounded-md border bg-transparent px-3 py-2">
                            <option value="">All active employees</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.employee_code} — {employee.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        Status
                        <select name="status" defaultValue={filters.status} className="rounded-md border bg-transparent px-3 py-2">
                            <option value="">All statuses</option>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className="self-end rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
                        Apply filters
                    </button>
                </form>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {metrics.map(([label, count]) => (
                        <div key={label} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
                            <p className="text-sm text-slate-500">{label}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                        </div>
                    ))}
                </section>

                <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Check in</th>
                                <th className="px-4 py-3">Check out</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Worked</th>
                                <th className="px-4 py-3">Late / early leave</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {records.data.map((record) => (
                                <tr key={record.id}>
                                    <td className="whitespace-nowrap px-4 py-3">{record.work_date}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium">{record.employee?.name ?? 'Employee unavailable'}</span>
                                        <span className="block text-xs text-slate-500">{record.employee?.employee_code}</span>
                                    </td>
                                    <td className="px-4 py-3">{record.check_in ?? '—'}</td>
                                    <td className="px-4 py-3">{record.check_out ?? '—'}</td>
                                    <td className="px-4 py-3">{statusLabels[record.status] ?? record.status}</td>
                                    <td className="px-4 py-3">{minutesLabel(record.minutes_worked)}</td>
                                    <td className="px-4 py-3">
                                        {record.minutes_late ? `${record.minutes_late}m late` : '—'}
                                        {record.minutes_early_leave ? ` · ${record.minutes_early_leave}m early` : ''}
                                    </td>
                                </tr>
                            ))}
                            {records.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No attendance records found for these filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <nav className="no-print flex flex-wrap gap-2" aria-label="Attendance report pages">
                    {records.links.map((link, index) => (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                        >
                            {link.label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')}
                        </Link>
                    ))}
                </nav>
            </main>
        </AdminLayout>
    );
}
