import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

interface EmployeeOption {
    id: number;
    employee_code: string;
    name: string;
}

interface SelectedEmployee extends EmployeeOption {
    department: string | null;
    designation: string | null;
}

interface AttendanceDay {
    work_date: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    minutes_late: number | null;
    minutes_worked: number | null;
    minutes_early_leave: number | null;
}

interface LeaveRecord {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    days_in_period: number;
    status: string;
    reason: string | null;
}

interface LeaveBalance {
    id: number;
    name: string;
    allowed_days: number;
    used_days: number;
    available_days: number;
}

interface MovementRecord {
    id: number;
    date: string;
    start_time: string;
    end_time: string | null;
    purpose: string;
    location: string | null;
    status: string;
}

interface Props {
    employees: EmployeeOption[];
    selectedEmployee: SelectedEmployee | null;
    attendance: AttendanceDay[];
    leaves: LeaveRecord[];
    leaveBalances: LeaveBalance[];
    leaveSummary: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        approved_days: number;
    };
    movements: MovementRecord[];
    movementSummary: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    };
    filters: {
        employee_id: string | number;
        start_date: string;
        end_date: string;
    };
    summary: Record<string, number>;
}

type DashboardTab = 'attendance' | 'leave' | 'movements';
type PrintMode = 'all' | 'current' | null;

const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'movements', label: 'Movements' },
];

const statusLabels: Record<string, string> = {
    present: 'Present',
    late: 'Late',
    early_leave: 'Early leave',
    incomplete: 'Incomplete',
    absent: 'Absent',
    holiday: 'Holiday',
    weekend: 'Weekend',
    not_recorded: 'No record',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
};

function minutesLabel(minutes: number | null): string {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return [hours ? `${hours}h` : '', remainder ? `${remainder}m` : ''].filter(Boolean).join(' ') || '0m';
}

function StatusBadge({ status }: { status: string }) {
    const color =
        status === 'present' || status === 'approved'
            ? 'bg-emerald-100 text-emerald-800'
            : status === 'late' || status === 'pending' || status === 'incomplete'
              ? 'bg-amber-100 text-amber-800'
              : status === 'absent' || status === 'rejected'
                ? 'bg-rose-100 text-rose-800'
                : status === 'not_recorded'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-sky-100 text-sky-800';

    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{statusLabels[status] ?? status}</span>;
}

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
    );
}

function EmptyTable({ columns, children }: { columns: number; children: string }) {
    return (
        <tr>
            <td colSpan={columns} className="px-4 py-10 text-center text-slate-500">
                {children}
            </td>
        </tr>
    );
}

export default function EmployeeDashboard({
    employees,
    selectedEmployee,
    attendance,
    leaves,
    leaveBalances,
    leaveSummary,
    movements,
    movementSummary,
    filters,
    summary,
}: Props) {
    const [activeTab, setActiveTab] = useState<DashboardTab>('attendance');
    const [printMode, setPrintMode] = useState<PrintMode>(null);

    useEffect(() => {
        if (printMode) {
            window.print();
        }
    }, [printMode]);

    useEffect(() => {
        const resetPrintMode = () => {
            setPrintMode(null);
        };

        window.addEventListener('afterprint', resetPrintMode);
        return () => window.removeEventListener('afterprint', resetPrintMode);
    }, []);

    const attendanceMetrics = [
        ['Calendar days', summary.total ?? 0],
        ['Present', summary.present ?? 0],
        ['Late', summary.late ?? 0],
        ['Absent', summary.absent ?? 0],
        ['Incomplete', summary.incomplete ?? 0],
        ['Holiday / weekend', (summary.holiday ?? 0) + (summary.weekend ?? 0)],
        ['No record', summary.not_recorded ?? 0],
    ];

    return (
        <AdminLayout title="Employee dashboard">
            <Head title="Employee dashboard" />
            <style>{`
                .dashboard-print-section:not(.is-active) { display: none; }
                .print-all .dashboard-print-section { display: block; }
                .print-report-header { display: none; }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 5mm;
                    }

                    html, body {
                        background: #fff !important;
                        color: #111827 !important;
                        font-family: Arial, "Calibri", sans-serif !important;
                        width: auto !important;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    body * { visibility: hidden !important; }
                    .employee-dashboard-print, .employee-dashboard-print * { visibility: visible !important; }
                    .admin-layout-root,
                    .admin-layout-root > div,
                    .admin-main-scroll,
                    .admin-main-scroll > div {
                        display: block !important;
                        width: auto !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                        transform: none !important;
                    }
                    .employee-dashboard-print {
                        position: relative !important;
                        top: auto !important;
                        left: auto !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        color: #111827 !important;
                        overflow: visible !important;
                        font-size: 9pt !important;
                        line-height: 1.3 !important;
                    }
                    .employee-dashboard-print.space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 4mm !important; }
                    .no-print { display: none !important; }
                    .print-report-header {
                        display: block !important;
                        margin: 0 0 3mm !important;
                        padding: 0 0 2mm !important;
                        border-bottom: 2px solid #334155 !important;
                    }
                    .print-report-header h1 {
                        margin: 0 0 1mm !important;
                        font-size: 12pt !important;
                        font-weight: 700 !important;
                        letter-spacing: -0.3pt;
                    }
                    .print-report-header p {
                        margin: 0 !important;
                        color: #475569 !important;
                        font-size: 7pt !important;
                        line-height: 1.2 !important;
                    }
                    .print-employee-card {
                        margin: 0 0 2mm !important;
                        padding: 1.5mm 2mm !important;
                        border: 1px solid #cbd5e1 !important;
                        border-left: 3px solid #334155 !important;
                        border-radius: 0 !important;
                        background: #f8fafc !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }
                    .print-employee-card h2 {
                        margin: 0 0 1mm !important;
                        color: #0f172a !important;
                        font-size: 9pt !important;
                    }
                    .print-employee-card p {
                        margin: 0 !important;
                        color: #475569 !important;
                        font-size: 6.5pt !important;
                    }
                    .dashboard-print-section {
                        display: none !important;
                        margin: 0 !important;
                        color: #111827 !important;
                        break-inside: auto;
                    }
                    .dashboard-print-section.is-active { display: block !important; }
                    .print-all .dashboard-print-section { display: block !important; }
                    .dashboard-print-section + .dashboard-print-section { break-before: auto !important; }
                    .dashboard-print-section > div:first-child {
                        margin: 0 0 1.5mm !important;
                        break-after: auto;
                    }
                    .dashboard-print-section h2 {
                        margin: 0 !important;
                        color: #0f172a !important;
                        font-size: 9pt !important;
                        font-weight: 700 !important;
                    }
                    .dashboard-print-section p {
                        color: #475569 !important;
                        font-size: 8pt !important;
                        line-height: 1.35 !important;
                    }
                    .dashboard-print-section .grid {
                        display: grid !important;
                        gap: 1mm !important;
                        margin-bottom: 1.5mm !important;
                    }
                    #panel-attendance .grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                    #panel-leave .grid { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
                    #panel-movements .grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                    .dashboard-print-section .grid > div {
                        min-width: 0 !important;
                        padding: 1mm !important;
                        border: 1px solid #cbd5e1 !important;
                        border-radius: 0 !important;
                        background: #fff !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }
                    .dashboard-print-section .grid > div p:first-child {
                        margin: 0 !important;
                        color: #475569 !important;
                        font-size: 8pt !important;
                    }
                    .dashboard-print-section .grid > div p:nth-child(2) {
                        margin: 1mm 0 0 !important;
                        color: #0f172a !important;
                        font-size: 12pt !important;
                        line-height: 1.2 !important;
                    }
                    .dashboard-print-section > .overflow-x-auto {
                        width: 100% !important;
                        margin: 0 0 4mm !important;
                        overflow: visible !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        background: #fff !important;
                        box-shadow: none !important;
                        break-inside: auto;
                    }
                    table {
                        width: 100% !important;
                        min-width: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        color: #111827 !important;
                        font-size: 8pt !important;
                        line-height: 1.3 !important;
                    }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    tr { break-inside: avoid; }
                    th, td {
                        border: 1px solid #cbd5e1 !important;
                        padding: 2mm 1.5mm !important;
                        vertical-align: top !important;
                        overflow-wrap: break-word;
                    }
                    th {
                        background: #e2e8f0 !important;
                        color: #0f172a !important;
                        font-size: 7pt !important;
                        font-weight: 700 !important;
                        text-transform: uppercase;
                    }
                    td { background: #fff !important; }
                    #panel-attendance table th:nth-child(1),
                    #panel-attendance table td:nth-child(1) { width: 14%; }
                    #panel-attendance table th:nth-child(2),
                    #panel-attendance table td:nth-child(2) { width: 15%; }
                    #panel-attendance table th:nth-child(3),
                    #panel-attendance table td:nth-child(3),
                    #panel-attendance table th:nth-child(4),
                    #panel-attendance table td:nth-child(4) { width: 10%; }
                    #panel-attendance table th:nth-child(5),
                    #panel-attendance table td:nth-child(5) { width: 15%; }
                    #panel-attendance table th:nth-child(6),
                    #panel-attendance table td:nth-child(6) { width: 13%; }
                    #panel-attendance table th:nth-child(7),
                    #panel-attendance table td:nth-child(7) { width: 23%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(1) th:nth-child(1),
                    #panel-leave > .overflow-x-auto:nth-of-type(1) td:nth-child(1) { width: 40%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(1) th:nth-child(n + 2),
                    #panel-leave > .overflow-x-auto:nth-of-type(1) td:nth-child(n + 2) { width: 20%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(1),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(1) { width: 17%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(2),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(2),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(3),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(3) { width: 13%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(4),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(4) { width: 15%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(5),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(5) { width: 14%; }
                    #panel-leave > .overflow-x-auto:nth-of-type(2) th:nth-child(6),
                    #panel-leave > .overflow-x-auto:nth-of-type(2) td:nth-child(6) { width: 28%; }
                    #panel-movements table th:nth-child(1),
                    #panel-movements table td:nth-child(1) { width: 15%; }
                    #panel-movements table th:nth-child(2),
                    #panel-movements table td:nth-child(2),
                    #panel-movements table th:nth-child(3),
                    #panel-movements table td:nth-child(3) { width: 12%; }
                    #panel-movements table th:nth-child(4),
                    #panel-movements table td:nth-child(4) { width: 25%; }
                    #panel-movements table th:nth-child(5),
                    #panel-movements table td:nth-child(5) { width: 21%; }
                    #panel-movements table th:nth-child(6),
                    #panel-movements table td:nth-child(6) { width: 15%; }
                    .dashboard-print-section tr:nth-child(even) td { background: #f8fafc !important; }
                    .dashboard-print-section [class*="rounded-full"] {
                        border: 1px solid #94a3b8 !important;
                        border-radius: 999px !important;
                        background: #f1f5f9 !important;
                        color: #0f172a !important;
                        padding: 1mm 2mm !important;
                        font-size: 7pt !important;
                    }
                }
            `}</style>

            <main className={`employee-dashboard-print mx-auto max-w-7xl space-y-6 pb-10 ${printMode === 'all' ? 'print-all' : ''}`}>
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="no-print">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employee dashboard</h1>
                        <p className="mt-1 text-sm text-slate-500">Attendance, leave balance and movement history for a selected period.</p>
                    </div>
                    {selectedEmployee && (
                        <div className="no-print flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setPrintMode('current')}
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                            >
                                <Printer className="h-4 w-4" />
                                Print current tab
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrintMode('all')}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Printer className="h-4 w-4" />
                                Print all reports
                            </button>
                        </div>
                    )}
                </header>

                <form
                    method="get"
                    action={route('employees.dashboard')}
                    className="no-print grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:bg-slate-900"
                >
                    <label className="grid gap-1 text-sm">
                        Employee
                        <select name="employee_id" required defaultValue={filters.employee_id} className="rounded-md border bg-transparent px-3 py-2">
                            <option value="">Select an employee</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.employee_code} — {employee.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                        Period from
                        <input name="start_date" type="date" required defaultValue={filters.start_date} className="rounded-md border px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        Period to
                        <input name="end_date" type="date" required defaultValue={filters.end_date} className="rounded-md border px-3 py-2" />
                    </label>
                    <button type="submit" className="self-end rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
                        View dashboard
                    </button>
                </form>

                {selectedEmployee ? (
                    <>
                        <header className="print-report-header">
                            <h1>Employee Period Report</h1>
                            <p>Attendance, leave balance and movement history</p>
                        </header>
                        <section className="print-employee-card rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedEmployee.name}</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {selectedEmployee.employee_code}
                                {selectedEmployee.department ? ` · ${selectedEmployee.department}` : ''}
                                {selectedEmployee.designation ? ` · ${selectedEmployee.designation}` : ''}
                                {' · '}
                                Period: {filters.start_date} to {filters.end_date}
                            </p>
                        </section>

                        <div className="no-print flex flex-wrap gap-2 border-b" role="tablist" aria-label="Employee report sections">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    id={`tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`panel-${tab.id}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-700'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <section
                            id="panel-attendance"
                            role="tabpanel"
                            aria-labelledby="tab-attendance"
                            className={`dashboard-print-section space-y-5 ${activeTab === 'attendance' ? 'is-active' : ''}`}
                        >
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance</h2>
                                <p className="mt-1 text-sm text-slate-500">Every calendar date in the selected period is listed.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
                                {attendanceMetrics.map(([label, value]) => (
                                    <MetricCard key={label} label={label} value={value} />
                                ))}
                            </div>
                            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900">
                                <table className="w-full min-w-[780px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Day</th>
                                            <th className="px-4 py-3">Check in</th>
                                            <th className="px-4 py-3">Check out</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Worked</th>
                                            <th className="px-4 py-3">Late / early leave</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {attendance.map((day) => (
                                            <tr key={day.work_date}>
                                                <td className="whitespace-nowrap px-4 py-3">{day.work_date}</td>
                                                <td className="px-4 py-3">
                                                    {new Date(`${day.work_date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' })}
                                                </td>
                                                <td className="px-4 py-3">{day.check_in ?? '—'}</td>
                                                <td className="px-4 py-3">{day.check_out ?? '—'}</td>
                                                <td className="px-4 py-3"><StatusBadge status={day.status} /></td>
                                                <td className="px-4 py-3">{minutesLabel(day.minutes_worked)}</td>
                                                <td className="px-4 py-3">
                                                    {day.minutes_late ? `${day.minutes_late}m late` : '—'}
                                                    {day.minutes_early_leave ? ` · ${day.minutes_early_leave}m early` : ''}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendance.length === 0 && <EmptyTable columns={7}>No dates found for this period.</EmptyTable>}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section
                            id="panel-leave"
                            role="tabpanel"
                            aria-labelledby="tab-leave"
                            className={`dashboard-print-section space-y-5 ${activeTab === 'leave' ? 'is-active' : ''}`}
                        >
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leave</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Leave days are counted by the dates overlapping this period. Available balance uses the yearly allowance for each calendar year included.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                                <MetricCard label="Applications" value={leaveSummary.total} />
                                <MetricCard label="Approved applications" value={leaveSummary.approved} />
                                <MetricCard label="Approved days used" value={leaveSummary.approved_days} />
                                <MetricCard label="Pending" value={leaveSummary.pending} />
                                <MetricCard label="Rejected" value={leaveSummary.rejected} />
                            </div>
                            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900">
                                <table className="w-full min-w-[600px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Leave type</th>
                                            <th className="px-4 py-3">Allowed</th>
                                            <th className="px-4 py-3">Used</th>
                                            <th className="px-4 py-3">Available</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {leaveBalances.map((balance) => (
                                            <tr key={balance.id}>
                                                <td className="px-4 py-3 font-medium">{balance.name}</td>
                                                <td className="px-4 py-3">{balance.allowed_days} days</td>
                                                <td className="px-4 py-3">{balance.used_days} days</td>
                                                <td className="px-4 py-3 font-semibold">{balance.available_days} days</td>
                                            </tr>
                                        ))}
                                        {leaveBalances.length === 0 && <EmptyTable columns={4}>No active leave types configured.</EmptyTable>}
                                    </tbody>
                                </table>
                            </div>
                            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Leave type</th>
                                            <th className="px-4 py-3">From</th>
                                            <th className="px-4 py-3">To</th>
                                            <th className="px-4 py-3">Days in period</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {leaves.map((leave) => (
                                            <tr key={leave.id}>
                                                <td className="px-4 py-3">{leave.leave_type}</td>
                                                <td className="whitespace-nowrap px-4 py-3">{leave.start_date}</td>
                                                <td className="whitespace-nowrap px-4 py-3">{leave.end_date}</td>
                                                <td className="px-4 py-3">{leave.days_in_period}</td>
                                                <td className="px-4 py-3"><StatusBadge status={leave.status} /></td>
                                                <td className="px-4 py-3">{leave.reason ?? '—'}</td>
                                            </tr>
                                        ))}
                                        {leaves.length === 0 && <EmptyTable columns={6}>No leave applications in this period.</EmptyTable>}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section
                            id="panel-movements"
                            role="tabpanel"
                            aria-labelledby="tab-movements"
                            className={`dashboard-print-section space-y-5 ${activeTab === 'movements' ? 'is-active' : ''}`}
                        >
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Movements</h2>
                                <p className="mt-1 text-sm text-slate-500">Employee movements recorded during the selected period.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <MetricCard label="Total movements" value={movementSummary.total} />
                                <MetricCard label="Approved" value={movementSummary.approved} />
                                <MetricCard label="Pending" value={movementSummary.pending} />
                                <MetricCard label="Rejected" value={movementSummary.rejected} />
                            </div>
                            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Start</th>
                                            <th className="px-4 py-3">End</th>
                                            <th className="px-4 py-3">Purpose</th>
                                            <th className="px-4 py-3">Location</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {movements.map((movement) => (
                                            <tr key={movement.id}>
                                                <td className="whitespace-nowrap px-4 py-3">{movement.date}</td>
                                                <td className="px-4 py-3">{movement.start_time || '—'}</td>
                                                <td className="px-4 py-3">{movement.end_time ?? 'In progress'}</td>
                                                <td className="px-4 py-3">{movement.purpose}</td>
                                                <td className="px-4 py-3">{movement.location ?? '—'}</td>
                                                <td className="px-4 py-3"><StatusBadge status={movement.status} /></td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && <EmptyTable columns={6}>No movements in this period.</EmptyTable>}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                    </>
                ) : (
                    <div className="rounded-xl border border-dashed bg-white px-5 py-12 text-center dark:bg-slate-900">
                        <p className="font-medium text-slate-800 dark:text-white">Select an employee to view their dashboard.</p>
                        <p className="mt-1 text-sm text-slate-500">The report includes attendance, leave balance and movements for the selected period.</p>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
