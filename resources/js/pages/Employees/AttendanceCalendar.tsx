import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarRange, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MatrixRow {
    employee_id: number;
    employee_code: string;
    name: string;
    statuses: (string | null)[];
}

interface MatrixPayload {
    day_dates: string[];
    rows: MatrixRow[];
}

interface Props {
    calendarMonth: string;
    calendarMonthLabel: string;
    matrix: MatrixPayload;
}

function statusAbbrev(status: string | null): string {
    if (!status) {
        return '';
    }
    const m: Record<string, string> = {
        present: 'P',
        late: 'L',
        early_leave: 'EL',
        incomplete: 'I',
        absent: 'A',
        holiday: 'H',
        weekend: 'W',
    };
    return m[status] ?? status.slice(0, 2).toUpperCase();
}

function weekdayFromYmd(ymd: string): number {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
}

function isLikelyWeekendColumn(ymd: string): boolean {
    const w = weekdayFromYmd(ymd);
    return w === 5 || w === 6;
}

function statusCellClass(status: string | null): string {
    if (!status) {
        return 'bg-slate-50 text-slate-400 dark:bg-slate-900/50 dark:text-slate-500';
    }
    const map: Record<string, string> = {
        present: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100',
        late: 'bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100',
        early_leave: 'bg-orange-100 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100',
        incomplete: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/30 dark:text-yellow-900',
        absent: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100',
        holiday: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100',
        weekend: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
}

function addMonthsYmd(ym: string, delta: number): string {
    const [y, mo] = ym.split('-').map(Number);
    const d = new Date(y, mo - 1 + delta, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}-${mm}`;
}

function legendRow() {
    const items = [
        { abbr: 'P', label: 'Present', cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100' },
        { abbr: 'L', label: 'Late', cls: 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100' },
        { abbr: 'A', label: 'Absent', cls: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-100' },
        { abbr: 'H', label: 'Holiday', cls: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100' },
        { abbr: 'W', label: 'Weekend', cls: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100' },
        { abbr: 'I', label: 'Incomplete', cls: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/30 dark:text-yellow-900' },
        { abbr: 'EL', label: 'Early leave', cls: 'bg-orange-100 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100' },
    ];
    return (
        <div className="no-print flex flex-wrap gap-2 pt-1">
            {items.map((it) => (
                <span
                    key={it.abbr}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${it.cls}`}
                >
                    <span className="font-mono text-[10px] font-bold">{it.abbr}</span>
                    {it.label}
                </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                Fri/Sat columns lightly shaded
            </span>
        </div>
    );
}

export default function EmployeesAttendanceCalendar({ calendarMonth, calendarMonthLabel, matrix }: Props) {
    const [month, setMonth] = useState(calendarMonth);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        setMonth(calendarMonth);
    }, [calendarMonth]);

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

    const reload = (nextMonth: string) => {
        router.get(route('employees.attendance-calendar'), { month: nextMonth }, { preserveScroll: true });
    };

    return (
        <AdminLayout title="All employees — attendance calendar">
            <Head title="Employee attendance calendar" />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-root { max-width: none !important; padding: 0 !important; }
                }
            `}</style>

            <div className="print-root mx-auto max-w-[96rem] space-y-6 pb-10">
                <div className="no-print flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('employees.index')} className="inline-flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Employees
                        </Link>
                    </Button>
                </div>

                <Card className="overflow-hidden border-slate-200 shadow-md dark:border-slate-700 dark:shadow-none">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900/80">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:flex dark:bg-slate-800 dark:ring-slate-600">
                                    <CalendarRange className="h-6 w-6 text-slate-500 dark:text-slate-300" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-xl text-slate-900 dark:text-slate-50">All employees — attendance</CardTitle>
                                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
                                        Active employees (max <strong>400</strong>). One column per day in <strong>{calendarMonthLabel}</strong>.
                                    </CardDescription>
                                    {legendRow()}
                                </div>
                            </div>

                            <div
                                className="no-print -mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0"
                                role="toolbar"
                                aria-label="Month navigation"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => reload(addMonthsYmd(month, -1))}
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="h-10 w-[10.5rem] min-w-[10.5rem] shrink-0 cursor-pointer"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => reload(addMonthsYmd(month, 1))}
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => reload(month)}>
                                    Load month
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setPrinting(true)}>
                                    <Printer className="mr-1 h-4 w-4" />
                                    Print
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="bg-slate-50/30 p-4 pt-6 dark:bg-slate-950/30">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <table className="w-max min-w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800/90">
                                        <th className="sticky left-0 z-20 min-w-[200px] border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            Code / Name
                                        </th>
                                        {matrix.day_dates.map((d) => {
                                            const weekendCol = isLikelyWeekendColumn(d);
                                            return (
                                                <th
                                                    key={d}
                                                    className={`min-w-[32px] border-b border-slate-200 px-0.5 py-2 text-center font-mono text-[10px] font-semibold dark:border-slate-700 ${
                                                        weekendCol ? 'bg-slate-200/80 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200' : 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                                                    }`}
                                                    title={d}
                                                >
                                                    {d.slice(8)}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {matrix.rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={Math.max(1, matrix.day_dates.length + 1)}
                                                className="border-t border-slate-100 px-6 py-14 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
                                            >
                                                No active employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        matrix.rows.map((row, ri) => (
                                            <tr
                                                key={row.employee_id}
                                                className={
                                                    ri % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/80 dark:bg-slate-900/50'
                                                }
                                            >
                                                <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-2 text-left align-middle shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] dark:border-slate-700">
                                                    <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                                        {row.employee_code}
                                                    </span>
                                                    <span className="mt-0.5 block max-w-[200px] truncate text-[11px] text-slate-600 dark:text-slate-400">
                                                        {row.name}
                                                    </span>
                                                </td>
                                                {row.statuses.map((st, i) => {
                                                    const d = matrix.day_dates[i];
                                                    const weekendCol = isLikelyWeekendColumn(d);
                                                    return (
                                                        <td
                                                            key={d}
                                                            className={`border-b border-slate-200 px-0.5 py-1 text-center align-middle dark:border-slate-700 ${
                                                                weekendCol ? 'bg-slate-100/90 dark:bg-slate-800/40' : ''
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-flex min-h-[26px] min-w-[26px] items-center justify-center rounded-md px-0.5 font-mono text-[10px] font-bold leading-none ${statusCellClass(st)}`}
                                                            >
                                                                {statusAbbrev(st)}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
