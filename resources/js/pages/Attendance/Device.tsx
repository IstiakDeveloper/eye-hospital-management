import { FieldError, FormErrorSummary } from '@/components/employees/FormErrorSummary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CloudDownload, RefreshCw, Trash2, Upload, UserMinus, UserPlus, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface DeviceRow {
    id: number;
    external_device_id: number;
    name: string;
    ip_address: string | null;
    last_synced_at: string | null;
}

interface EmployeeRow {
    id: number;
    employee_code: string;
    name: string;
    zkteco_user_id: number | null;
    ready_for_device: boolean;
}

interface CommandRow {
    id: number;
    type: string;
    type_label: string;
    status: string;
    employee_label: string | null;
    requested_by: string | null;
    error_message: string | null;
    created_at: string | null;
    completed_at: string | null;
}

interface AgentConfigHint {
    api_endpoint: string;
    commands_endpoint: string;
    employees_endpoint: string;
}

interface Props {
    devices: DeviceRow[];
    employees: EmployeeRow[];
    recentCommands: CommandRow[];
    agentConfigHint: AgentConfigHint;
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        pending: 'bg-amber-500 hover:bg-amber-500',
        processing: 'bg-blue-600 hover:bg-blue-600',
        completed: 'bg-emerald-600 hover:bg-emerald-600',
        failed: 'bg-red-600 hover:bg-red-600',
    };
    return <Badge className={map[status] ?? ''}>{status}</Badge>;
}

export default function AttendanceDevice({ devices, employees, recentCommands, agentConfigHint }: Props) {
    const page = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(String(employees.find((e) => e.ready_for_device)?.id ?? ''));
    const [removeEmployeeId, setRemoveEmployeeId] = useState(String(employees[0]?.id ?? ''));

    const pushOneForm = useForm({});
    const removeOneForm = useForm({});

    const employeeOptions = employees.map((e) => ({
        value: String(e.id),
        label: `${e.employee_code} — ${e.name}${e.zkteco_user_id ? ` (ZK ${e.zkteco_user_id})` : ' — no ZK id'}`,
    }));

    const flashSuccess = page.props.flash?.success;
    const pageErrors = page.props.errors ?? {};
    const allErrors = useMemo(() => pageErrors, [pageErrors]);

    const queue = (routeName: string, employeeId?: number) => {
        if (employeeId) {
            router.post(route(routeName, employeeId), {}, { preserveScroll: true });
            return;
        }
        router.post(route(routeName), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="ZKTeco device">
            <Head title="ZKTeco device" />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('attendance.day.index')} className="inline-flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Daily attendance
                        </Link>
                    </Button>
                </div>

                {flashSuccess ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                        {flashSuccess}
                    </div>
                ) : null}

                <FormErrorSummary errors={allErrors} title="Could not queue command" />

                <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-purple-600" />
                            How it works
                        </CardTitle>
                        <CardDescription>
                            Commands are queued here. The <strong>ZKTeco Agent</strong> on the device PC must run{' '}
                            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">bin/run_commands.php</code> (or scheduled
                            task) to connect to the device and Laravel API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            <span className="font-medium text-gray-800 dark:text-gray-200">Sync endpoint:</span>{' '}
                            <code className="text-xs">{agentConfigHint.api_endpoint}</code>
                        </p>
                        <p>
                            <span className="font-medium text-gray-800 dark:text-gray-200">Commands:</span>{' '}
                            <code className="text-xs">{agentConfigHint.commands_endpoint}?claim=1</code>
                        </p>
                        <p>
                            <span className="font-medium text-gray-800 dark:text-gray-200">Employees:</span>{' '}
                            <code className="text-xs">{agentConfigHint.employees_endpoint}</code>
                        </p>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Registered devices</CardTitle>
                            <CardDescription>Updated when the agent syncs attendance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {devices.length === 0 ? (
                                <p className="text-sm text-gray-500">No device synced yet. Queue a sync after the agent is running.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {devices.map((d) => (
                                        <li key={d.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{d.name}</p>
                                            <p className="text-xs text-gray-500">
                                                ID {d.external_device_id}
                                                {d.ip_address ? ` · ${d.ip_address}` : ''}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Last sync: {d.last_synced_at ?? '—'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-lg">Device actions</CardTitle>
                            <CardDescription>Queues work for the Windows agent — not instant from the browser.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button type="button" className="justify-start gap-2" onClick={() => queue('attendance.device.sync')}>
                                <CloudDownload className="h-4 w-4" />
                                Sync attendance from device
                            </Button>
                            <Button type="button" variant="secondary" className="justify-start gap-2" onClick={() => queue('attendance.device.push-all')}>
                                <Users className="h-4 w-4" />
                                Push all employees to device
                            </Button>
                            <Button type="button" variant="destructive" className="justify-start gap-2" onClick={() => queue('attendance.device.remove-all')}>
                                <Trash2 className="h-4 w-4" />
                                Remove all employees from device
                            </Button>

                            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Push one employee</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        options={employeeOptions}
                                        placeholder="Select employee"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!selectedEmployeeId || pushOneForm.processing}
                                        className="shrink-0 gap-2"
                                        onClick={() => {
                                            pushOneForm.clearErrors();
                                            queue('attendance.device.push-employee', Number(selectedEmployeeId));
                                        }}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Push
                                    </Button>
                                </div>
                                <FieldError message={allErrors.employee} />
                            </div>

                            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Remove one employee</p>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Select
                                        value={removeEmployeeId}
                                        onChange={(e) => setRemoveEmployeeId(e.target.value)}
                                        options={employeeOptions}
                                        placeholder="Select employee"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!removeEmployeeId || removeOneForm.processing}
                                        className="shrink-0 gap-2"
                                        onClick={() => {
                                            removeOneForm.clearErrors();
                                            queue('attendance.device.remove-employee', Number(removeEmployeeId));
                                        }}
                                    >
                                        <UserMinus className="h-4 w-4" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="h-5 w-5" />
                            Recent commands
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>By</TableHead>
                                    <TableHead>Queued</TableHead>
                                    <TableHead>Done</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentCommands.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                                            No commands yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recentCommands.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-mono text-sm">{c.id}</TableCell>
                                            <TableCell className="text-sm">{c.type_label}</TableCell>
                                            <TableCell className="text-sm">{c.employee_label ?? '—'}</TableCell>
                                            <TableCell>{statusBadge(c.status)}</TableCell>
                                            <TableCell className="text-sm">{c.requested_by ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{c.created_at ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {c.completed_at ?? '—'}
                                                {c.error_message ? (
                                                    <p className="mt-1 text-red-600 dark:text-red-400">{c.error_message}</p>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
