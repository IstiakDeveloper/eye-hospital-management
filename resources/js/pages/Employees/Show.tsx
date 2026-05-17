import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, Pencil, Phone, Printer, UserCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LinkedUserSummary {
    id: number;
    name: string;
    email: string;
}

interface EmployeeSummary {
    id: number;
    employee_code: string;
    name: string;
    phone: string | null;
    email: string | null;
    department: string | null;
    designation: string | null;
    date_of_join: string | null;
    is_active: boolean;
    zkteco_user_id: number | null;
    linked_user: LinkedUserSummary | null;
}

interface SchedulePayload {
    expected_check_in: string;
    expected_check_out: string;
    grace_minutes: number;
    weekend_days: number[];
}

interface SheetRow {
    work_date: string;
    status: string | null;
    first_in_at: string | null;
    last_out_at: string | null;
    minutes_late: number | null;
}

interface SheetPayload {
    from: string;
    to: string;
    rows: SheetRow[];
}

interface Props {
    employee: EmployeeSummary;
    schedule: SchedulePayload;
    canEdit: boolean;
    sheet: SheetPayload;
}

const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function statusBadge(status: string | null) {
    if (!status) {
        return <span className="text-muted-foreground text-xs">—</span>;
    }
    const map: Record<string, string> = {
        present: 'bg-emerald-600 hover:bg-emerald-600',
        late: 'bg-amber-600 hover:bg-amber-600',
        early_leave: 'bg-orange-600 hover:bg-orange-600',
        incomplete: 'bg-yellow-600 hover:bg-yellow-600',
        absent: 'bg-red-600 hover:bg-red-600',
        holiday: 'bg-sky-600 hover:bg-sky-600',
        weekend: 'bg-slate-500 hover:bg-slate-500',
    };
    return (
        <Badge className={`${map[status] ?? 'bg-gray-600 hover:bg-gray-600'} text-[10px] font-medium leading-tight`} variant="default">
            {status.replace(/_/g, ' ')}
        </Badge>
    );
}

function legendChips() {
    const items: { k: string; abbr: string; label: string; cls: string }[] = [
        { k: 'p', abbr: 'P', label: 'Present', cls: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100' },
        { k: 'l', abbr: 'L', label: 'Late', cls: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100' },
        { k: 'a', abbr: 'A', label: 'Absent', cls: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100' },
        { k: 'h', abbr: 'H', label: 'Holiday', cls: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100' },
        { k: 'w', abbr: 'W', label: 'Weekend', cls: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100' },
        { k: 'i', abbr: 'I', label: 'Incomplete', cls: 'border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-100' },
        { k: 'el', abbr: 'EL', label: 'Early leave', cls: 'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100' },
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((it) => (
                <span key={it.k} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${it.cls}`}>
                    <span className="font-mono text-[10px] font-bold">{it.abbr}</span>
                    {it.label}
                </span>
            ))}
        </div>
    );
}

export default function EmployeesShow({ employee, schedule, canEdit, sheet }: Props) {
    const [from, setFrom] = useState(sheet.from);
    const [to, setTo] = useState(sheet.to);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        setFrom(sheet.from);
        setTo(sheet.to);
    }, [sheet.from, sheet.to]);

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

    const reload = () => {
        router.get(
            route('employees.show', employee.id),
            { from, to },
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout title={`Employee — ${employee.name}`}>
            <Head title={`${employee.name} — attendance`} />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-root { max-width: none !important; padding: 0 !important; }
                }
            `}</style>

            <div className="print-root mx-auto max-w-6xl space-y-6 pb-10">
                <div className="no-print flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('employees.index')} className="inline-flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Employees
                        </Link>
                    </Button>
                    {canEdit ? (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('employees.edit', employee.id)} className="inline-flex items-center gap-1">
                                <Pencil className="h-4 w-4" />
                                Edit profile
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-700 dark:shadow-none">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/20">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600">
                                    <UserCircle className="h-8 w-8 text-slate-500 dark:text-slate-300" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{employee.name}</h1>
                                        <Badge variant={employee.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                            {employee.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-400">{employee.employee_code}</p>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {[employee.department, employee.designation].filter(Boolean).join(' · ') || 'No department / designation'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        {employee.phone ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" />
                                                {employee.phone}
                                            </span>
                                        ) : null}
                                        {employee.email ? (
                                            <span className="inline-flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" />
                                                {employee.email}
                                            </span>
                                        ) : null}
                                        <span>ZKTeco ID: {employee.zkteco_user_id ?? '—'}</span>
                                        {employee.date_of_join ? <span>Joined: {employee.date_of_join}</span> : null}
                                        {employee.linked_user ? (
                                            <span>
                                                User: {employee.linked_user.name} ({employee.linked_user.email})
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-50">Attendance schedule</CardTitle>
                        <CardDescription>Used to calculate present, late, and absent from device punches.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Check-in</p>
                            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">{schedule.expected_check_in}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Check-out</p>
                            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">{schedule.expected_check_out}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Grace</p>
                            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{schedule.grace_minutes} min</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Weekend</p>
                            <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                                {schedule.weekend_days.map((d) => dayShort[d] ?? d).join(', ')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:shadow-none">
                    <CardHeader className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <CardTitle className="text-lg text-slate-900 dark:text-slate-50">Attendance sheet</CardTitle>
                            <CardDescription className="mt-1 max-w-xl">
                                Daily records for this employee only. Adjust the range, load, then print for records.
                            </CardDescription>
                            <div className="no-print mt-4">{legendChips()}</div>
                        </div>
                        <div className="no-print flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPrinting(true)}>
                                <Printer className="mr-1 h-4 w-4" />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <form
                            className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                            onSubmit={(e) => {
                                e.preventDefault();
                                reload();
                            }}
                        >
                            <div>
                                <Label htmlFor="sheet-from" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                    From
                                </Label>
                                <Input id="sheet-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
                            </div>
                            <div>
                                <Label htmlFor="sheet-to" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                                    To
                                </Label>
                                <Input id="sheet-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
                            </div>
                            <Button type="submit" variant="secondary">
                                Load range
                            </Button>
                        </form>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-mono">{sheet.from}</span> → <span className="font-mono">{sheet.to}</span> —{' '}
                            <strong>{sheet.rows.length}</strong> row{sheet.rows.length === 1 ? '' : 's'}
                        </p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 bg-slate-100/90 hover:bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/80">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Date</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">First in</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Last out</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Late (min)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sheet.rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                                                No attendance rows in this range.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sheet.rows.map((r, idx) => (
                                            <TableRow
                                                key={r.work_date}
                                                className={
                                                    idx % 2 === 0
                                                        ? 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950'
                                                        : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
                                                }
                                            >
                                                <TableCell className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {r.work_date}
                                                </TableCell>
                                                <TableCell>{statusBadge(r.status)}</TableCell>
                                                <TableCell className="text-sm text-slate-700 dark:text-slate-300">{r.first_in_at ?? '—'}</TableCell>
                                                <TableCell className="text-sm text-slate-700 dark:text-slate-300">{r.last_out_at ?? '—'}</TableCell>
                                                <TableCell className="tabular-nums text-sm text-slate-700 dark:text-slate-300">
                                                    {r.minutes_late ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
