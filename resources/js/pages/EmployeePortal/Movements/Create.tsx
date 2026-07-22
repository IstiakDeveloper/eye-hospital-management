import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, MapPin, Zap } from 'lucide-react';

export default function MovementsCreate({ activeMovement }: any) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const nowTimeStr = format(new Date(), 'HH:mm');

    const { data, setData, post, processing, errors } = useForm({
        date: todayStr,
        start_time: nowTimeStr,
        purpose: '',
        location: '',
    });

    const templates = [
        { label: 'Lunch Break 🍽️', purpose: 'Lunch Break', location: 'Office / Cafeteria' },
        { label: 'Bank Visit 🏦', purpose: 'Official Bank Visit', location: 'Bank Branch' },
        { label: 'Eye Camp ⛺', purpose: 'Eye Camp Duty', location: 'Camp Site' },
        { label: 'Hospital Duty 🏥', purpose: 'Hospital Duty / Task', location: 'Hospital Wing' },
        { label: 'Supplies / Purchase 📦', purpose: 'Purchase & Supplies Procure', location: 'Market / Vendor Store' },
        { label: 'Official Field Work 💼', purpose: 'Official Field Assignment', location: '' },
    ];

    const applyTemplate = (t: { purpose: string; location: string }) => {
        setData((prev) => ({
            ...prev,
            purpose: t.purpose,
            location: t.location || prev.location,
        }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employee.movements.store'));
    };

    return (
        <AdminLayout title="Start Movement">
            <Head title="Start Movement" />

            <div className="mx-auto max-w-2xl space-y-4 pb-12">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('employee.dashboard')} className="inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>

                {activeMovement ? (
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-900">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                Active Movement In Progress
                            </CardTitle>
                            <CardDescription className="text-amber-800">
                                You currently have an active movement open. You cannot start a new movement until your current one is completed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-white p-4 border border-amber-200 text-sm space-y-2">
                                <p><strong>Purpose:</strong> {activeMovement.purpose}</p>
                                {activeMovement.location && <p><strong>Location:</strong> {activeMovement.location}</p>}
                                <p><strong>Started:</strong> {activeMovement.start_time ? String(activeMovement.start_time).substring(0, 5) : ''}</p>
                            </div>
                            <Button 
                                onClick={() => router.patch(route('employee.movements.close', activeMovement.id))}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                End Current Movement Now
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                Start Movement
                            </CardTitle>
                            <CardDescription>
                                Enter your movement details or pick a quick template below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {/* Quick Templates Section */}
                                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        Quick Purpose Templates
                                    </label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {templates.map((t, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => applyTemplate(t)}
                                                className="text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <Input
                                        label="Date"
                                        type="date"
                                        required
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        error={errors.date}
                                    />
                                    <Input
                                        label="Start Time"
                                        type="time"
                                        required
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        error={errors.start_time}
                                        helperText="Cannot be earlier than 5 minutes ago."
                                    />
                                </div>

                                <Input
                                    label="Purpose"
                                    type="text"
                                    required
                                    placeholder="E.g., Meeting with client, Bank visit..."
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    error={errors.purpose}
                                />

                                <Input
                                    label="Location (Optional)"
                                    type="text"
                                    placeholder="E.g., Dhanmondi Branch..."
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    error={errors.location}
                                />

                                <div className="flex flex-col-reverse justify-end gap-3 pt-4 border-t border-gray-100 sm:flex-row">
                                    <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                                        <Link href={route('employee.dashboard')}>Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                                        {processing ? 'Starting...' : 'Start Movement'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
