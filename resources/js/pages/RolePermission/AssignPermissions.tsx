import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    category: string;
    description: string | null;
}

interface Props extends PageProps {
    role: Role;
    permissions: Permission[];
    permissionsByCategory: Record<string, Permission[]>;
    rolePermissions: number[];
}

export default function AssignPermissions({ role, permissions = [], permissionsByCategory = {}, rolePermissions = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        permissions: rolePermissions,
    });

    const [selectAll, setSelectAll] = useState<Record<string, boolean>>({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('roles.update-permissions', role.id));
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
            setData(
                'permissions',
                data.permissions.filter((id) => !categoryPermissionIds.includes(id)),
            );
            setSelectAll({ ...selectAll, [category]: false });
        } else {
            const newPermissions = [...new Set([...data.permissions, ...categoryPermissionIds])];
            setData('permissions', newPermissions);
            setSelectAll({ ...selectAll, [category]: true });
        }
    };

    const isCategoryFullySelected = (categoryPermissions: Permission[]) => {
        return categoryPermissions.every((p) => data.permissions.includes(p.id));
    };

    const handleSelectAllPermissions = () => {
        if (data.permissions.length === permissions.length) {
            setData('permissions', []);
        } else {
            setData(
                'permissions',
                permissions.map((p) => p.id),
            );
        }
    };

    return (
        <AdminLayout title={`Assign Permissions to Role: ${role.display_name}`}>
            <Head title={`Assign Permissions - ${role.display_name}`} />

            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Assign Permissions</h1>
                        <p className="mt-1 text-gray-600">Manage permissions for {role.display_name}</p>
                    </div>

                    {/* Role Info Card */}
                    <div className="mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="mb-2 text-2xl font-bold text-gray-900">{role.display_name}</h3>
                                {role.description && <p className="mb-2 text-gray-700">{role.description}</p>}
                                <p className="text-sm text-gray-600">
                                    System Name: <span className="rounded bg-white px-2 py-1 font-mono">{role.name}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-blue-600">{data.permissions.length}</div>
                                <div className="text-sm text-gray-600">Permissions Assigned</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        {/* Stats & Select All */}
                        <div className="mb-6 rounded-lg bg-white p-6 shadow">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="text-lg text-gray-700">
                                        <span className="text-2xl font-bold text-blue-600">{data.permissions.length}</span>
                                        <span className="text-gray-500"> / {permissions.length}</span>
                                        <span className="ml-2">permissions selected</span>
                                    </div>
                                    <div className="h-3 w-48 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                            style={{
                                                width: `${(data.permissions.length / permissions.length) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSelectAllPermissions}
                                    className="rounded-lg bg-blue-100 px-6 py-2 font-medium text-blue-700 transition hover:bg-blue-200"
                                >
                                    {data.permissions.length === permissions.length ? '✗ Deselect All' : '✓ Select All'}
                                </button>
                            </div>
                        </div>

                        {/* Permissions by Category */}
                        <div className="space-y-6">
                            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                <div key={category} className="rounded-lg bg-white p-6 shadow">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 capitalize">{category.replace(/_/g, ' ')}</h4>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {categoryPermissions.filter((p) => data.permissions.includes(p.id)).length} of{' '}
                                                {categoryPermissions.length} selected
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllCategory(category, categoryPermissions)}
                                            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                                        >
                                            {isCategoryFullySelected(categoryPermissions) ? '✗ Deselect All' : '✓ Select All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {categoryPermissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className={`flex transform cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition hover:scale-105 ${
                                                    data.permissions.includes(permission.id)
                                                        ? 'border-blue-500 bg-blue-50 shadow-md'
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
                        </div>

                        {errors.permissions && (
                            <div className="mt-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                                <div className="text-sm text-red-600">{errors.permissions}</div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-4">
                            <Link
                                href={route('roles.index')}
                                className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
