import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarDays, ClipboardPen, Download, Eye, FileUp, Pencil, Plus, Search, Trash2, UserCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ImportRowError {
    row: number;
    message: string;
}

interface PageFlash {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    import_errors?: ImportRowError[];
}

interface LinkedUser {
    id: number;
    name: string;
    role: string | { id: number; name: string } | null;
}

function linkedUserRoleLabel(role: LinkedUser['role']): string | null {
    if (role == null) {
        return null;
    }
    if (typeof role === 'string') {
        return role;
    }

    return role.name;
}

interface AttendanceSettingRow {
    expected_check_in: string;
    expected_check_out: string;
    grace_minutes: number;
    weekend_days: number[];
}

interface EmployeeRow {
    id: number;
    employee_code: string;
    name: string;
    phone: string | null;
    email: string | null;
    department: string | null;
    designation: string | null;
    is_active: boolean;
    zkteco_user_id: number | null;
    user: LinkedUser | null;
    employee_attendance_setting: AttendanceSettingRow | null;
}

const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTimeHm(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return value.slice(0, 5);
}

function weekendLabel(days: number[] | null | undefined): string {
    if (!days?.length) {
        return '—';
    }

    return days.map((d) => dayShort[d] ?? String(d)).join(', ');
}

interface Paginated {
    data: EmployeeRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface EmployeeOption {
    value: number;
    label: string;
}

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    employees: Paginated;
    filters: { search?: string; is_active?: string };
    can: { create: boolean; edit: boolean; delete: boolean };
    canSetManualAttendance?: boolean;
    employeeOptions?: EmployeeOption[];
    statusOptions?: StatusOption[];
}

function todayYmd(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export default function EmployeesIndex({
    employees,
    filters,
    can,
    canSetManualAttendance = false,
    employeeOptions = [],
    statusOptions = [],
}: Props) {
    const { flash } = usePage<{ flash: PageFlash }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.is_active ?? 'all');
    const [manualOpen, setManualOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importErrors, setImportErrors] = useState<ImportRowError[]>(flash.import_errors ?? []);

    useEffect(() => {
        if (flash.import_errors?.length) {
            setImportErrors(flash.import_errors);
        }
    }, [flash.import_errors]);

    const importForm = useForm<{ file: File | null }>({ file: null });

    const manualForm = useForm({
        employee_id: employeeOptions[0]?.value ?? 0,
        work_date: todayYmd(),
        status: statusOptions[0]?.value ?? 'present',
        first_in: '',
        last_out: '',
        minutes_late: '' as string | number,
    });

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('employees.index'),
            {
                search: search || undefined,
                is_active: status === 'all' ? undefined : status,
            },
            { preserveState: true },
        );
    };

    const remove = (id: number, name: string) => {
        if (confirm(`Delete employee “${name}”? This removes attendance history for this person.`)) {
            router.delete(route('employees.destroy', id), { preserveScroll: true });
        }
    };

    const openManualDialog = () => {
        const firstId = employeeOptions[0]?.value ?? 0;
        manualForm.setData({
            employee_id: firstId,
            work_date: todayYmd(),
            status: statusOptions[0]?.value ?? 'present',
            first_in: '',
            last_out: '',
            minutes_late: '',
        });
        manualForm.clearErrors();
        setManualOpen(true);
    };

    const submitManual = (e: React.FormEvent) => {
        e.preventDefault();
        manualForm.transform((data) => ({
            ...data,
            employee_id: Number(data.employee_id),
            minutes_late:
                data.minutes_late === '' || data.minutes_late === null || data.minutes_late === undefined
                    ? null
                    : Number(data.minutes_late),
            first_in: data.first_in === '' ? null : data.first_in,
            last_out: data.last_out === '' ? null : data.last_out,
        }));
        manualForm.post(route('employees.manual-attendance.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setManualOpen(false);
                manualForm.reset('first_in', 'last_out', 'minutes_late');
            },
        });
    };

    const employeeSelectOptions = employeeOptions.map((o) => ({
        value: String(o.value),
        label: o.label,
    }));

    const canOpenManual = canSetManualAttendance && employeeOptions.length > 0;

    const openImportDialog = () => {
        importForm.reset();
        importForm.clearErrors();
        setImportOpen(true);
    };

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) {
            return;
        }

        importForm.post(route('employees.import'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setImportOpen(false);
                importForm.reset();
            },
        });
    };

    return (
        <AdminLayout title="Employees">
            <Head title="Employees" />

            <div className="mx-auto max-w-6xl space-y-6">
                <Dialog open={importOpen} onOpenChange={setImportOpen}>
                    <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Import employees from CSV</DialogTitle>
                            <DialogDescription>
                                Upload a CSV with columns matching the example file. Required: <strong>employee_code</strong> and{' '}
                                <strong>name</strong>. For <strong>weekend_days</strong>, use day names (e.g. &quot;Fri,Sat&quot; or Fri;Sat) or numbers
                                0–6 (Sun=0). Up to 500 rows per file.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitImport} className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" asChild>
                                    <a href={route('employees.import.template')} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download example CSV
                                    </a>
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employee-csv-file">CSV file</Label>
                                <Input
                                    id="employee-csv-file"
                                    type="file"
                                    accept=".csv,.txt,text/csv"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        importForm.setData('file', file);
                                    }}
                                />
                                {importForm.errors.file ? (
                                    <p className="text-sm text-red-600 dark:text-red-400">{importForm.errors.file}</p>
                                ) : null}
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={importForm.processing || !importForm.data.file}>
                                    {importForm.processing ? 'Importing…' : 'Import'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                    <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Record attendance</DialogTitle>
                            <DialogDescription>
                                Super Admin only. Creates or updates one day per employee. If the device later syncs punches for that date, it may
                                recalculate this row.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitManual} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Employee</Label>
                                    <Select
                                        options={employeeSelectOptions}
                                        value={String(manualForm.data.employee_id)}
                                        onChange={(e) => manualForm.setData('employee_id', Number(e.target.value))}
                                        selectSize="sm"
                                    />
                                    {manualForm.errors.employee_id ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.employee_id}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idx-manual-date">Work date</Label>
                                    <Input
                                        id="idx-manual-date"
                                        type="date"
                                        value={manualForm.data.work_date}
                                        onChange={(e) => manualForm.setData('work_date', e.target.value)}
                                    />
                                    {manualForm.errors.work_date ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.work_date}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
                                        value={manualForm.data.status}
                                        onChange={(e) => manualForm.setData('status', e.target.value)}
                                        selectSize="sm"
                                    />
                                    {manualForm.errors.status ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.status}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idx-first-in">First in (optional)</Label>
                                    <Input
                                        id="idx-first-in"
                                        type="time"
                                        value={manualForm.data.first_in}
                                        onChange={(e) => manualForm.setData('first_in', e.target.value)}
                                    />
                                    {manualForm.errors.first_in ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.first_in}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idx-last-out">Last out (optional)</Label>
                                    <Input
                                        id="idx-last-out"
                                        type="time"
                                        value={manualForm.data.last_out}
                                        onChange={(e) => manualForm.setData('last_out', e.target.value)}
                                    />
                                    {manualForm.errors.last_out ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.last_out}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="idx-minutes-late">Minutes late (optional)</Label>
                                    <Input
                                        id="idx-minutes-late"
                                        type="number"
                                        min={0}
                                        max={1440}
                                        placeholder="e.g. 12"
                                        value={
                                            manualForm.data.minutes_late === '' || manualForm.data.minutes_late == null
                                                ? ''
                                                : String(manualForm.data.minutes_late)
                                        }
                                        onChange={(e) => manualForm.setData('minutes_late', e.target.value)}
                                    />
                                    {manualForm.errors.minutes_late ? (
                                        <p className="text-sm text-red-600 dark:text-red-400">{manualForm.errors.minutes_late}</p>
                                    ) : null}
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={manualForm.processing}>
                                    {manualForm.processing ? 'Saving…' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Card className="border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <CardHeader className="flex flex-col gap-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                        <div>
                            <CardTitle className="text-gray-900 dark:text-gray-100">Employees</CardTitle>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Staff records for HR and attendance. Linking a <strong>user account</strong> is optional (for system login).
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('employees.attendance-calendar')} className="inline-flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    All staff calendar
                                </Link>
                            </Button>
                            {canSetManualAttendance ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="inline-flex items-center gap-2 border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100 dark:hover:bg-indigo-950/70"
                                    disabled={!canOpenManual}
                                    title={!canOpenManual ? 'No active employees to record attendance for.' : undefined}
                                    onClick={() => openManualDialog()}
                                >
                                    <ClipboardPen className="h-4 w-4" />
                                    Record attendance
                                </Button>
                            ) : null}
                            {can.create ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="inline-flex items-center gap-2"
                                        onClick={() => openImportDialog()}
                                    >
                                        <FileUp className="h-4 w-4" />
                                        Import CSV
                                    </Button>
                                    <Button asChild>
                                        <Link href={route('employees.create')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add employee
                                        </Link>
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {importErrors.length > 0 ? (
                            <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                                <AlertTitle>Import issues</AlertTitle>
                                <AlertDescription>
                                    <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-sm">
                                        {importErrors.map((err, idx) => (
                                            <li key={`${err.row}-${idx}`}>
                                                {err.message}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 h-8 px-2 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/50"
                                        onClick={() => setImportErrors([])}
                                    >
                                        Dismiss
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                                    <Input
                                        className="bg-white pl-8 dark:border-gray-600 dark:bg-gray-900"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Name, code, phone…"
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-40">
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    placeholder=""
                                    options={[
                                        { value: 'all', label: 'All' },
                                        { value: '1', label: 'Active' },
                                        { value: '0', label: 'Inactive' },
                                    ]}
                                />
                            </div>
                            <Button type="submit" variant="secondary">
                                Filter
                            </Button>
                        </form>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 dark:bg-gray-800/50">
                                        <TableHead className="text-gray-700 dark:text-gray-200">Code</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Name</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Dept / Role</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Schedule</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">ZK uid</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Linked user</TableHead>
                                        <TableHead className="text-gray-700 dark:text-gray-200">Status</TableHead>
                                        <TableHead className="w-28 text-right text-gray-700 dark:text-gray-200">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-14 text-center text-gray-500 dark:text-gray-400">
                                                <UserCircle className="mx-auto mb-2 h-10 w-10 opacity-30" />
                                                <p className="text-sm">No employees match your filters.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.data.map((e) => {
                                            const linkedRole = e.user ? linkedUserRoleLabel(e.user.role) : null;

                                            return (
                                            <TableRow key={e.id} className="dark:border-gray-700">
                                                <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{e.employee_code}</TableCell>
                                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                                    <Link className="text-purple-700 hover:underline dark:text-purple-300" href={route('employees.show', e.id)}>
                                                        {e.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                    {[e.department, e.designation].filter(Boolean).join(' · ') || '—'}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                                                    {e.employee_attendance_setting ? (
                                                        <span className="block leading-relaxed">
                                                            <span className="tabular-nums">
                                                                {formatTimeHm(e.employee_attendance_setting.expected_check_in)} –{' '}
                                                                {formatTimeHm(e.employee_attendance_setting.expected_check_out)}
                                                            </span>
                                                            <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-500">
                                                                Off: {weekendLabel(e.employee_attendance_setting.weekend_days)}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-sm">{e.zkteco_user_id ?? '—'}</TableCell>
                                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                    {e.user ? (
                                                        <span>
                                                            {e.user.name}
                                                            {linkedRole ? (
                                                                <span className="text-gray-400"> ({linkedRole})</span>
                                                            ) : null}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={e.is_active ? 'default' : 'secondary'}>
                                                        {e.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={route('employees.show', e.id)} title="View & print attendance">
                                                                <Eye className="h-4 w-4 text-sky-600" />
                                                            </Link>
                                                        </Button>
                                                        {can.edit ? (
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={route('employees.edit', e.id)}>
                                                                    <Pencil className="h-4 w-4 text-purple-600" />
                                                                </Link>
                                                            </Button>
                                                        ) : null}
                                                        {can.delete ? (
                                                            <Button variant="ghost" size="sm" type="button" onClick={() => remove(e.id, e.name)}>
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <Pagination links={employees.links} />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
