import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface HolidayRow {
    id: number;
    observed_on: string;
    name: string;
    note: string | null;
}

interface Paginated {
    data: HolidayRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    holidays: Paginated;
}

export default function AttendanceHolidays({ holidays }: Props) {
    const createForm = useForm({
        observed_on: '',
        name: '',
        note: '',
    });

    const editForm = useForm({
        observed_on: '',
        name: '',
        note: '',
    });

    const [editing, setEditing] = useState<HolidayRow | null>(null);

    useEffect(() => {
        if (!editing) {
            return;
        }
        const d = typeof editing.observed_on === 'string' ? editing.observed_on.slice(0, 10) : '';
        editForm.setData({
            observed_on: d,
            name: editing.name,
            note: editing.note ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync dialog fields when opening a different row
    }, [editing?.id]);

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('attendance.holidays.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset('name', 'note', 'observed_on'),
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.put(route('attendance.holidays.update', editing.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const remove = (id: number) => {
        if (confirm('Remove this holiday?')) {
            router.delete(route('attendance.holidays.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Holidays">
            <Head title="Holidays" />

            <div className="mx-auto max-w-4xl space-y-6">
                <Card className="border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Office holidays
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Listed dates are treated as <strong className="text-gray-800 dark:text-gray-200">holiday</strong> for
                            attendance (no absent penalty). They also count toward the monthly holiday total on the daily sheet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        <form
                            onSubmit={submitCreate}
                            className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30 md:grid-cols-2"
                        >
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add holiday</h3>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">One entry per calendar date.</p>
                            </div>
                            <div>
                                <label htmlFor="h-observed" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Date
                                </label>
                                <Input
                                    id="h-observed"
                                    type="date"
                                    value={createForm.data.observed_on}
                                    onChange={(e) => createForm.setData('observed_on', e.target.value)}
                                    className="bg-white dark:border-gray-600 dark:bg-gray-900"
                                />
                                {createForm.errors.observed_on && (
                                    <p className="mt-1 text-xs text-red-600">{createForm.errors.observed_on}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="h-name" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Name
                                </label>
                                <Input
                                    id="h-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g. Independence Day"
                                    className="bg-white dark:border-gray-600 dark:bg-gray-900"
                                />
                                {createForm.errors.name && <p className="mt-1 text-xs text-red-600">{createForm.errors.name}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="h-note" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Note (optional)
                                </label>
                                <Input
                                    id="h-note"
                                    value={createForm.data.note}
                                    onChange={(e) => createForm.setData('note', e.target.value)}
                                    className="bg-white dark:border-gray-600 dark:bg-gray-900"
                                />
                            </div>
                            <div>
                                <Button type="submit" disabled={createForm.processing}>
                                    {createForm.processing ? 'Saving…' : 'Add holiday'}
                                </Button>
                            </div>
                        </form>

                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">All holidays</h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-800/50 dark:hover:bg-gray-800/50">
                                            <TableHead className="text-gray-700 dark:text-gray-200">Date</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200">Name</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200">Note</TableHead>
                                            <TableHead className="w-28 text-right text-gray-700 dark:text-gray-200">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {holidays.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-14 text-center text-gray-500 dark:text-gray-400">
                                                    <CalendarDays className="mx-auto mb-2 h-10 w-10 opacity-30" />
                                                    <p className="text-sm font-medium">No holidays yet</p>
                                                    <p className="mt-1 text-xs">Use the form above to add the first date.</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            holidays.data.map((h) => (
                                                <TableRow key={h.id} className="dark:border-gray-700">
                                                    <TableCell className="whitespace-nowrap tabular-nums text-gray-900 dark:text-gray-100">
                                                        {typeof h.observed_on === 'string' ? h.observed_on.slice(0, 10) : h.observed_on}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{h.name}</TableCell>
                                                    <TableCell className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                                                        {h.note ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditing(h)}
                                                                aria-label={`Edit ${h.name}`}
                                                            >
                                                                <Pencil className="h-4 w-4 text-purple-600" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => remove(h.id)}
                                                                aria-label={`Delete ${h.name}`}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <Pagination links={holidays.links} className="mt-4" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="dark:border-gray-700">
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit holiday</DialogTitle>
                            <DialogDescription>Update the name or date; duplicate dates are not allowed.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium">Date</label>
                                <Input
                                    type="date"
                                    value={editForm.data.observed_on}
                                    onChange={(e) => editForm.setData('observed_on', e.target.value)}
                                />
                                {editForm.errors.observed_on && <p className="mt-1 text-xs text-red-600">{editForm.errors.observed_on}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium">Name</label>
                                <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <p className="mt-1 text-xs text-red-600">{editForm.errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium">Note</label>
                                <Input value={editForm.data.note} onChange={(e) => editForm.setData('note', e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
