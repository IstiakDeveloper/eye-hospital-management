import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ChevronLeft, ChevronRight, Printer, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Row {
    employee_id: number;
    employee_code: string;
    name: string;
    work_date: string;
    check_in: string | null;
    check_out: string | null;
    status: string | null;
    minutes_late: number | null;
    minutes_worked: number | null;
    minutes_early_leave: number | null;
    expected_check_in: string;
    expected_check_out: string;
}

interface Summary {
    total: number;
    present: number;
    late: number;
    early_leave: number;
    absent: number;
    incomplete: number;
    holiday: number;
    weekend: number;
}

interface Props {
    selectedDate: string;
    selectedDateLabel: string;
    rows: Row[];
    summary: Summary;
    holidayCountThisMonth: number;
}

function formatStatusLabel(status: string): string {
    return status
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function statusBadge(status: string | null) {
    if (!status) {
        return <span className="text-sm text-gray-400">—</span>;
    }
    const variants: Record<string, string> = {
        present: 'bg-emerald-600 hover:bg-emerald-600',
        late: 'bg-amber-600 hover:bg-amber-600',
        early_leave: 'bg-orange-600 hover:bg-orange-600',
        incomplete: 'bg-yellow-600 hover:bg-yellow-600',
        absent: 'bg-red-600 hover:bg-red-600',
        holiday: 'bg-sky-600 hover:bg-sky-600',
        weekend: 'bg-slate-500 hover:bg-slate-500',
    };
    return (
        <Badge className={variants[status] ?? 'bg-gray-600 hover:bg-gray-600'} variant="default">
            {formatStatusLabel(status)}
        </Badge>
    );
}

function formatMinutesAsHours(minutes: number | null): string {
    if (minutes == null || minutes <= 0) {
        return '—';
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) {
        return `${m}m`;
    }

    return `${h}h ${m}m`;
}

function statusDetail(row: Row): string | null {
    if (!row.status) {
        return null;
    }
    const parts: string[] = [];
    if (row.minutes_late != null && row.minutes_late > 0) {
        parts.push(`Late ${row.minutes_late}m`);
    }
    if (row.minutes_worked != null && row.minutes_worked > 0 && ['present', 'late', 'early_leave'].includes(row.status)) {
        parts.push(`Worked ${formatMinutesAsHours(row.minutes_worked)}`);
    }
    if (row.minutes_early_leave != null && row.minutes_early_leave > 0) {
        parts.push(`Left ${row.minutes_early_leave}m early`);
    }

    return parts.length > 0 ? parts.join(' · ') : null;
}

function parseYmd(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function addDaysYmd(s: string, delta: number): string {
    const dt = parseYmd(s);
    dt.setDate(dt.getDate() + delta);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function SummaryChip({ label, count, className }: { label: string; count: number; className: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
            <span className="font-bold tabular-nums">{count}</span>
            {label}
        </span>
    );
}

export default function AttendanceIndex({ selectedDate, selectedDateLabel, rows, summary, holidayCountThisMonth }: Props) {
    const [date, setDate] = useState(selectedDate);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        setDate(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (!printing) {
            return;
        }
        const t = window.setTimeout(() => window.print(), 0);
        return () => window.clearTimeout(t);
    }, [printing]);

    useEffect(() => {
        const clear = () => setPrinting(false);
        window.addEventListener('afterprint', clear);
        return () => window.removeEventListener('afterprint', clear);
    }, []);

    const loadDate = (next: string) => {
        router.get(route('attendance.day.index'), { date: next }, { preserveState: true });
    };

    const goPrev = () => loadDate(addDaysYmd(date, -1));
    const goNext = () => loadDate(addDaysYmd(date, 1));
    const goToday = () => {
        const t = new Date();
        loadDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
    };

    return (
        <AdminLayout title="Attendance">
            <Head title={`Attendance — ${selectedDate}`} />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-root { max-width: none !important; padding: 0 !important; }
                    .print-title { display: block !important; }
                }
                .print-title { display: none; }
            `}</style>

            <div className="print-root mx-auto max-w-6xl space-y-6 pb-10">
                <div className="print-title mb-4 border-b border-gray-300 pb-3">
                    <h1 className="text-xl font-bold text-gray-900">Daily attendance report</h1>
                    <p className="text-sm text-gray-600">{selectedDateLabel}</p>
                    <p className="mt-1 text-xs text-gray-500">
                        First device punch = check-in · Last punch = check-out · Status from office schedule
                    </p>
                </div>

                <Card className="border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <CardHeader className="border-b border-gray-100 pb-4 dark:border-gray-800">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Daily attendance
                                </CardTitle>
                                <CardDescription className="mt-1 max-w-2xl text-gray-600 dark:text-gray-400">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{selectedDateLabel}</span>
                                    {' · '}
                                    First punch = check-in, last punch = check-out. Present / Late / Early leave / Absent from each
                                    employee&apos;s schedule. Holidays this month: {holidayCountThisMonth}.
                                </CardDescription>
                            </div>
                            <div className="no-print flex shrink-0 flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setPrinting(true)}>
                                    <Printer className="mr-1 h-4 w-4" />
                                    Print
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('attendance.device.index')}>ZKTeco device</Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="no-print flex flex-wrap gap-2">
                            <SummaryChip label="Present" count={summary.present} className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100" />
                            <SummaryChip label="Late" count={summary.late} className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100" />
                            <SummaryChip label="Early leave" count={summary.early_leave} className="border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-100" />
                            <SummaryChip label="Absent" count={summary.absent} className="border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100" />
                            <SummaryChip label="Incomplete" count={summary.incomplete} className="border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-100" />
                            <SummaryChip label="Weekend" count={summary.weekend} className="border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100" />
                            <SummaryChip label="Holiday" count={summary.holiday} className="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100" />
                        </div>

                        <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="flex flex-wrap items-end gap-2">
                                <Button type="button" variant="outline" size="icon" onClick={goPrev} aria-label="Previous day">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <label htmlFor="attendance-date" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Date
                                    </label>
                                    <Input
                                        id="attendance-date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-44 bg-white dark:border-gray-600 dark:bg-gray-900"
                                    />
                                </div>
                                <Button type="button" variant="outline" size="icon" onClick={goNext} aria-label="Next day">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:ml-auto">
                                <Button type="button" variant="secondary" onClick={goToday}>
                                    Today
                                </Button>
                                <Button type="button" onClick={() => loadDate(date)}>
                                    Load
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-800/50">
                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Date</TableHead>
                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Employee</TableHead>
                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Check in</TableHead>
                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Check out</TableHead>
                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-16 text-center text-gray-500 dark:text-gray-400">
                                                <UserCircle className="mx-auto mb-3 h-12 w-12 opacity-40" />
                                                <p className="text-sm font-medium">No active employees</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((r) => {
                                            const detail = statusDetail(r);

                                            return (
                                                <TableRow key={r.employee_id} className="dark:border-gray-700">
                                                    <TableCell className="whitespace-nowrap font-mono text-sm text-gray-700 dark:text-gray-300">
                                                        {r.work_date}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
                                                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{r.employee_code}</div>
                                                    </TableCell>
                                                    <TableCell className="tabular-nums text-sm">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.check_in ?? '—'}</div>
                                                        <div className="text-xs text-gray-400">Exp. {r.expected_check_in}</div>
                                                    </TableCell>
                                                    <TableCell className="tabular-nums text-sm">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.check_out ?? '—'}</div>
                                                        <div className="text-xs text-gray-400">Exp. {r.expected_check_out}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{statusBadge(r.status)}</div>
                                                        {detail ? (
                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</div>
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="no-print text-xs text-gray-500 dark:text-gray-400">
                            Data from ZKTeco device sync. Schedule per employee: Employee Management → Edit employee.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
