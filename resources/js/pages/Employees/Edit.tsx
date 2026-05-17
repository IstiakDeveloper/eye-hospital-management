import { FieldError, FormErrorSummary } from '@/components/employees/FormErrorSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { buildEmployeeSubmitPayload, validateEmployeeFormClient, type EmployeeFormData } from '@/lib/employee-form';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface UserOpt {
    id: number;
    name: string;
    email: string;
}

interface EmployeePayload {
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
    user_id: number | null;
}

interface SettingPayload {
    expected_check_in: string;
    expected_check_out: string;
    grace_minutes: number;
    weekend_days: number[];
}

interface Props {
    employee: EmployeePayload;
    setting: SettingPayload;
    usersForLink: UserOpt[];
}

export default function EmployeesEdit({ employee, setting, usersForLink }: Props) {
    const form = useForm<EmployeeFormData>({
        employee_code: employee.employee_code,
        name: employee.name,
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        department: employee.department ?? '',
        designation: employee.designation ?? '',
        date_of_join: employee.date_of_join ?? '',
        is_active: employee.is_active,
        zkteco_user_id: employee.zkteco_user_id != null ? String(employee.zkteco_user_id) : '',
        user_id: employee.user_id != null ? String(employee.user_id) : '',
        expected_check_in: setting.expected_check_in,
        expected_check_out: setting.expected_check_out,
        grace_minutes: setting.grace_minutes,
        weekend_days: setting.weekend_days,
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const allErrors = useMemo(() => ({ ...clientErrors, ...form.errors }), [clientErrors, form.errors]);

    const toggleDay = (d: number) => {
        const s = new Set(form.data.weekend_days);
        if (s.has(d)) {
            s.delete(d);
        } else {
            s.add(d);
        }
        form.setData('weekend_days', Array.from(s).sort((a, b) => a - b));
        if (clientErrors.weekend_days) {
            setClientErrors((prev) => {
                const next = { ...prev };
                delete next.weekend_days;
                return next;
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateEmployeeFormClient(form.data);
        if (Object.keys(validation).length > 0) {
            setClientErrors(validation);
            return;
        }

        setClientErrors({});
        form.clearErrors();
        form.transform((data) => buildEmployeeSubmitPayload(data));
        form.put(route('employees.update', employee.id));
    };

    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <AdminLayout title="Edit employee">
            <Head title={`Edit — ${employee.name}`} />

            <div className="mx-auto max-w-2xl space-y-4">
                <div className="no-print flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('employees.index')} className="inline-flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back to list
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('employees.show', employee.id)} className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Attendance & print
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit employee</CardTitle>
                        <CardDescription>
                            You can change employee code and ZKTeco user id when needed (must remain unique). Use Attendance & print for date reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <FormErrorSummary errors={allErrors} />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Employee code *</label>
                                    <Input
                                        value={form.data.employee_code}
                                        onChange={(e) => form.setData('employee_code', e.target.value)}
                                        className="font-mono"
                                    />
                                    <FieldError message={allErrors.employee_code} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">ZKTeco user id</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.zkteco_user_id}
                                        onChange={(e) => form.setData('zkteco_user_id', e.target.value)}
                                        placeholder="Optional"
                                    />
                                    <FieldError message={allErrors.zkteco_user_id} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-medium">Full name *</label>
                                    <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                                    <FieldError message={allErrors.name} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Phone</label>
                                    <Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Email</label>
                                    <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Department</label>
                                    <Input value={form.data.department} onChange={(e) => form.setData('department', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Designation</label>
                                    <Input value={form.data.designation} onChange={(e) => form.setData('designation', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium">Date of join</label>
                                    <Input type="date" value={form.data.date_of_join} onChange={(e) => form.setData('date_of_join', e.target.value)} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Checkbox
                                        id="active"
                                        checked={form.data.is_active}
                                        onCheckedChange={(c) => form.setData('is_active', c === true)}
                                    />
                                    <label htmlFor="active" className="text-sm">
                                        Active
                                    </label>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-medium">Link user account (optional)</label>
                                    <Select
                                        value={form.data.user_id === '' ? '' : String(form.data.user_id)}
                                        onChange={(e) => form.setData('user_id', e.target.value)}
                                        placeholder=""
                                        options={[
                                            { value: '', label: '— None —' },
                                            ...(usersForLink ?? []).map((u) => ({
                                                value: String(u.id),
                                                label: `${u.name} (${u.email})`,
                                            })),
                                        ]}
                                    />
                                    <FieldError message={allErrors.user_id} />
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="mb-3 text-sm font-semibold">Attendance schedule</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium">Check-in *</label>
                                        <Input type="time" value={form.data.expected_check_in} onChange={(e) => form.setData('expected_check_in', e.target.value)} />
                                        <FieldError message={allErrors.expected_check_in} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium">Check-out *</label>
                                        <Input type="time" value={form.data.expected_check_out} onChange={(e) => form.setData('expected_check_out', e.target.value)} />
                                        <FieldError message={allErrors.expected_check_out} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium">Grace (minutes) *</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={180}
                                            value={form.data.grace_minutes}
                                            onChange={(e) => form.setData('grace_minutes', Number(e.target.value))}
                                        />
                                        <FieldError message={allErrors.grace_minutes} />
                                    </div>
                                </div>
                                <p className="mb-2 mt-4 text-xs text-gray-500">Weekend days *</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                        <Button key={d} type="button" size="sm" variant={form.data.weekend_days.includes(d) ? 'default' : 'outline'} onClick={() => toggleDay(d)}>
                                            {dayShort[d]}
                                        </Button>
                                    ))}
                                </div>
                                <FieldError message={allErrors.weekend_days} />
                            </div>

                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
