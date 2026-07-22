import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { AlertCircle, AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useMemo } from 'react';

export default function LeavesCreate({ leaveTypes }: any) {
    const { data, setData, post, processing, errors } = useForm({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employee.leaves.store'));
    };

    const leaveOptions = (leaveTypes ?? []).map((type: any) => ({
        value: String(type.id),
        label: `${type.name} (${type.remaining_days} Days Left)`,
    }));

    const selectedLeaveType = useMemo(() => {
        if (!data.leave_type_id) return null;
        return (leaveTypes ?? []).find((t: any) => String(t.id) === String(data.leave_type_id));
    }, [data.leave_type_id, leaveTypes]);

    const requestedDays = useMemo(() => {
        if (!data.start_date || !data.end_date) return 0;
        try {
            const start = parseISO(data.start_date);
            const end = parseISO(data.end_date);
            const diff = differenceInDays(end, start);
            return diff >= 0 ? diff + 1 : 0;
        } catch {
            return 0;
        }
    }, [data.start_date, data.end_date]);

    const isExceedingBalance = useMemo(() => {
        if (!selectedLeaveType || requestedDays === 0) return false;
        return requestedDays > selectedLeaveType.remaining_days;
    }, [selectedLeaveType, requestedDays]);

    return (
        <AdminLayout title="Apply Leave">
            <Head title="Apply Leave" />

            <div className="mx-auto max-w-2xl space-y-4 pb-12">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('employee.leaves.index')} className="inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to My Leaves
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Apply for Leave
                        </CardTitle>
                        <CardDescription>
                            Submit your leave request for admin approval. View live balance and duration calculations below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-3">
                                <Select
                                    label="Leave Type"
                                    required
                                    value={data.leave_type_id}
                                    onChange={(e) => setData('leave_type_id', e.target.value)}
                                    placeholder="Select a leave type"
                                    options={leaveOptions}
                                    error={errors.leave_type_id}
                                />

                                {/* Live Leave Balance Card */}
                                {selectedLeaveType && (
                                    <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-100 pb-2">
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                {selectedLeaveType.name} Quota & Balance
                                            </span>
                                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono">
                                                {selectedLeaveType.remaining_days} Days Remaining
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                            <div className="bg-white p-2 rounded-lg border border-blue-100/80">
                                                <p className="text-[11px] text-gray-500 font-medium">Allocated</p>
                                                <p className="text-sm font-bold text-gray-800">{selectedLeaveType.days_allowed} Days</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-blue-100/80">
                                                <p className="text-[11px] text-gray-500 font-medium">Used</p>
                                                <p className="text-sm font-bold text-amber-600">{selectedLeaveType.used_days} Days</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg border border-blue-100/80">
                                                <p className="text-[11px] text-gray-500 font-medium">Balance</p>
                                                <p className="text-sm font-bold text-emerald-600">{selectedLeaveType.remaining_days} Days</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    required
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    error={errors.start_date}
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    required
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    error={errors.end_date}
                                />
                            </div>

                            {/* Live Requested Days Calculator & Warning */}
                            {requestedDays > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <span>
                                            Requested Duration: <strong className="text-blue-700 text-sm font-extrabold">{requestedDays} Days</strong>
                                        </span>
                                    </div>

                                    {isExceedingBalance && (
                                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Leave Balance Exceeded!</p>
                                                <p className="mt-0.5">
                                                    You requested <strong>{requestedDays} days</strong>, but you only have <strong>{selectedLeaveType.remaining_days} days</strong> remaining in your {selectedLeaveType.name} quota.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="w-full">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={4}
                                    placeholder="Please provide a clear reason for your leave application..."
                                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-colors duration-200 resize-none"
                                    required
                                />
                                {errors.reason && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.reason}</p>
                                )}
                            </div>

                            <div className="flex flex-col-reverse justify-end gap-3 pt-4 border-t border-gray-100 sm:flex-row">
                                <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                                    <Link href={route('employee.leaves.index')}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                    {processing ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
