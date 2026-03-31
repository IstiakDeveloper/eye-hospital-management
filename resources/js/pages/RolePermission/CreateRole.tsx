import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    category: string;
    description: string | null;
}

interface Props extends PageProps {
    permissions: Permission[];
    permissionsByCategory: Record<string, Permission[]>;
}

export default function CreateRole({ permissions = [], permissionsByCategory = {} }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        display_name: '',
        description: '',
        permissions: [] as number[],
    });

    const [selectAll, setSelectAll] = useState<Record<string, boolean>>({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    const handlePermissionToggle = (permissionId: number) => {
        if (data.permissions.includes(permissionId)) {
            setData(
                'permissions',
                data.permissions.filter((id) => id !== permissionId),
            );
        } else {
            setData('permissions', [...data.permissions, permissionId]);
        }
    };

    const handleSelectAllCategory = (category: string, categoryPermissions: Permission[]) => {
        const categoryPermissionIds = categoryPermissions.map((p) => p.id);
        const allSelected = categoryPermissionIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            // Deselect all in category
            setData(
                'permissions',
                data.permissions.filter((id) => !categoryPermissionIds.includes(id)),
            );
            setSelectAll({ ...selectAll, [category]: false });
        } else {
            // Select all in category
            const newPermissions = [...new Set([...data.permissions, ...categoryPermissionIds])];
            setData('permissions', newPermissions);
            setSelectAll({ ...selectAll, [category]: true });
        }
    };

    const isCategoryFullySelected = (categoryPermissions: Permission[]) => {
        return categoryPermissions.every((p) => data.permissions.includes(p.id));
    };

    return (
        <AdminLayout title="Create New Role">
            <Head title="Create Role" />

            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
                        <p className="mt-1 text-gray-600">Create a new role and assign permissions</p>
                    </div>

                    <form onSubmit={submit}>
                        {/* Basic Info */}
                        <div className="mb-6 rounded-lg bg-white p-6 shadow">
                            <h3 className="mb-6 text-xl font-semibold text-gray-900">Role Information</h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                        Role Name (System) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., super_admin, doctor, receptionist"
                                        required
                                    />
                                    {errors.name && <div className="mt-2 text-sm text-red-600">{errors.name}</div>}
                                    <p className="mt-1 text-xs text-gray-500">Use lowercase with underscores (e.g., super_admin)</p>
                                </div>

                                <div>
                                    <label htmlFor="display_name" className="mb-2 block text-sm font-medium text-gray-700">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="display_name"
                                        type="text"
                                        name="display_name"
                                        value={data.display_name}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="e.g., Super Administrator, Doctor, Receptionist"
                                        required
                                    />
                                    {errors.display_name && <div className="mt-2 text-sm text-red-600">{errors.display_name}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Optional description of this role..."
                                    />
                                    {errors.description && <div className="mt-2 text-sm text-red-600">{errors.description}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Permissions Selection */}
                        <div className="mb-6 rounded-lg bg-white p-6 shadow">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">Assign Permissions</h3>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                    {data.permissions.length} selected
                                </span>
                            </div>

                            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                <div key={category} className="mb-6 rounded-lg border-2 border-gray-200 p-4 transition hover:border-blue-300">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                                            {category.replace(/_/g, ' ')}
                                            <span className="ml-2 text-sm text-gray-500">({categoryPermissions.length})</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllCategory(category, categoryPermissions)}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                                        >
                                            {isCategoryFullySelected(categoryPermissions) ? '✓ Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {categoryPermissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className={`flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition ${
                                                    data.permissions.includes(permission.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-gray-900">{permission.display_name}</div>
                                                    <div className="mt-1 text-xs text-gray-500">{permission.name}</div>
                                                    {permission.description && (
                                                        <div className="mt-1 text-xs text-gray-600">{permission.description}</div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {errors.permissions && <div className="mt-2 text-sm text-red-600">{errors.permissions}</div>}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href={route('roles.index')}
                                className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Role'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
