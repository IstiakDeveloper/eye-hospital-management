import { FieldError, FormErrorSummary } from '@/components/employees/FormErrorSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { buildEmployeeSubmitPayload, validateEmployeeFormClient, type EmployeeFormData } from '@/lib/employee-form';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface UserOpt {
    id: number;
    name: string;
    email: string;
}

interface SuggestedIds {
    employee_code: string;
    zkteco_user_id: number;
}

interface Props {
    usersForLink: UserOpt[];
    suggested: SuggestedIds;
}

const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EmployeesCreate({ usersForLink, suggested }: Props) {
    const form = useForm<EmployeeFormData>({
        employee_code: suggested.employee_code,
        name: '',
        phone: '',
        email: '',
        department: '',
        designation: '',
        date_of_join: '',
        is_active: true,
        zkteco_user_id: String(suggested.zkteco_user_id),
        user_id: '',
        expected_check_in: '09:00',
        expected_check_out: '18:00',
        grace_minutes: 10,
        weekend_days: [5, 6],
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

    const applySuggestedIds = () => {
        form.setData({
            ...form.data,
            employee_code: suggested.employee_code,
            zkteco_user_id: String(suggested.zkteco_user_id),
        });
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
        form.post(route('employees.store'));
    };

    return (
        <AdminLayout title="Add employee">
            <Head title="Add employee" />

            <div className="mx-auto max-w-2xl space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('employees.index')} className="inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to list
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>New employee</CardTitle>
                        <CardDescription>
                            Employee code and ZKTeco user id are suggested automatically — you can edit them before saving. Both must stay
                            unique in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <FormErrorSummary errors={allErrors} />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Employee code *</label>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={applySuggestedIds}>
                                            <RefreshCw className="mr-1 h-3 w-3" />
                                            Suggest
                                        </Button>
                                    </div>
                                    <Input
                                        value={form.data.employee_code}
                                        onChange={(e) => form.setData('employee_code', e.target.value)}
                                        placeholder="Auto-suggested"
                                        className="font-mono"
                                    />
                                    <FieldError message={allErrors.employee_code} />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">ZKTeco user id</label>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={applySuggestedIds}>
                                            <RefreshCw className="mr-1 h-3 w-3" />
                                            Suggest
                                        </Button>
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.zkteco_user_id}
                                        onChange={(e) => form.setData('zkteco_user_id', e.target.value)}
                                        placeholder="Device uid"
                                        className="font-mono"
                                    />
                                    <FieldError message={allErrors.zkteco_user_id} />
                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Must match the uid on the attendance device.</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Full name *</label>
                                    <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                                    <FieldError message={allErrors.name} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                    <Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                    <FieldError message={allErrors.phone} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                    <FieldError message={allErrors.email} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Department</label>
                                    <Input value={form.data.department} onChange={(e) => form.setData('department', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Designation</label>
                                    <Input value={form.data.designation} onChange={(e) => form.setData('designation', e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Date of join</label>
                                    <Input type="date" value={form.data.date_of_join} onChange={(e) => form.setData('date_of_join', e.target.value)} />
                                    <FieldError message={allErrors.date_of_join} />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Checkbox
                                        id="active"
                                        checked={form.data.is_active}
                                        onCheckedChange={(c) => form.setData('is_active', c === true)}
                                    />
                                    <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                                        Active
                                    </label>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Link user account (optional)</label>
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

                            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Default attendance schedule</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Check-in *</label>
                                        <Input type="time" value={form.data.expected_check_in} onChange={(e) => form.setData('expected_check_in', e.target.value)} />
                                        <FieldError message={allErrors.expected_check_in} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Check-out *</label>
                                        <Input type="time" value={form.data.expected_check_out} onChange={(e) => form.setData('expected_check_out', e.target.value)} />
                                        <FieldError message={allErrors.expected_check_out} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Grace (minutes) *</label>
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
                                <p className="mb-2 mt-4 text-xs text-gray-500 dark:text-gray-400">Weekend days *</p>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                        <Button
                                            key={d}
                                            type="button"
                                            size="sm"
                                            variant={form.data.weekend_days.includes(d) ? 'default' : 'outline'}
                                            onClick={() => toggleDay(d)}
                                        >
                                            {dayShort[d]}
                                        </Button>
                                    ))}
                                </div>
                                <FieldError message={allErrors.weekend_days} />
                            </div>

                            <Button type="submit" disabled={form.processing} className="w-full sm:w-auto">
                                {form.processing ? 'Saving…' : 'Create employee'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
