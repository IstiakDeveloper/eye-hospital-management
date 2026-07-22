import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, useForm } from '@inertiajs/react';
import { CalendarDays, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function LeaveTypesIndex({ leaveTypes }: any) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingType, setEditingType] = useState<any>(null);

    const addForm = useForm({
        name: '',
        days_allowed: 10,
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        days_allowed: 10,
        is_active: true,
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('admin.leave-types.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
            },
        });
    };

    const handleEditClick = (type: any) => {
        setEditingType(type);
        editForm.setData({
            name: type.name,
            days_allowed: type.days_allowed,
            is_active: type.is_active,
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType) return;
        editForm.put(route('admin.leave-types.update', editingType.id), {
            onSuccess: () => {
                setEditingType(null);
            },
        });
    };

    const handleDelete = (type: any) => {
        if (confirm(`Are you sure you want to delete "${type.name}"?`)) {
            useForm().delete(route('admin.leave-types.destroy', type.id));
        }
    };

    return (
        <AdminLayout title="Leave Types Setup">
            <Head title="Leave Types Setup" />

            <div className="max-w-6xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <CalendarDays className="h-6 w-6 text-blue-600" />
                            Leave Types & Quotas
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Set maximum allowed leave days per year for each leave type.
                        </p>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Leave Type
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Configured Leave Types</CardTitle>
                        <CardDescription>
                            All active leave types available to employees for annual leave applications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/75">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Leave Name
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Max Days / Year
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaveTypes.length > 0 ? (
                                        leaveTypes.map((type: any) => (
                                            <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {type.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        {type.days_allowed} Days
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {type.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            Disabled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditClick(type)}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(type)}
                                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                                No leave types configured yet. Click "Add Leave Type" to set one up.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Leave Type</DialogTitle>
                        <DialogDescription>
                            Configure a leave category and its yearly days limit.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 pt-2">
                        <Input
                            label="Leave Type Name"
                            placeholder="E.g., Casual Leave, Sick Leave..."
                            value={addForm.data.name}
                            onChange={(e) => addForm.setData('name', e.target.value)}
                            error={addForm.errors.name}
                            required
                        />
                        <Input
                            label="Max Days Allowed (Per Year)"
                            type="number"
                            min={1}
                            max={365}
                            value={addForm.data.days_allowed}
                            onChange={(e) => addForm.setData('days_allowed', parseInt(e.target.value) || 0)}
                            error={addForm.errors.days_allowed}
                            required
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addForm.processing} className="bg-blue-600 hover:bg-blue-700">
                                Save Leave Type
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Leave Type</DialogTitle>
                        <DialogDescription>
                            Update the leave name or yearly allowed days limit.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                        <Input
                            label="Leave Type Name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            error={editForm.errors.name}
                            required
                        />
                        <Input
                            label="Max Days Allowed (Per Year)"
                            type="number"
                            min={1}
                            max={365}
                            value={editForm.data.days_allowed}
                            onChange={(e) => editForm.setData('days_allowed', parseInt(e.target.value) || 0)}
                            error={editForm.errors.days_allowed}
                            required
                        />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setEditingType(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing} className="bg-blue-600 hover:bg-blue-700">
                                Update Leave Type
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
