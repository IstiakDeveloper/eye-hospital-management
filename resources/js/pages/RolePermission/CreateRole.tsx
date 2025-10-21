import { FormEventHandler, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';

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
            setData('permissions', data.permissions.filter((id) => id !== permissionId));
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
                data.permissions.filter((id) => !categoryPermissionIds.includes(id))
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
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
                        <p className="text-gray-600 mt-1">Create a new role and assign permissions</p>
                    </div>

                    <form onSubmit={submit}>
                        {/* Basic Info */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Role Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Role Name (System) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., super_admin, doctor, receptionist"
                                        required
                                    />
                                    {errors.name && (
                                        <div className="text-sm text-red-600 mt-2">{errors.name}</div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use lowercase with underscores (e.g., super_admin)
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="display_name"
                                        type="text"
                                        name="display_name"
                                        value={data.display_name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="e.g., Super Administrator, Doctor, Receptionist"
                                        required
                                    />
                                    {errors.display_name && (
                                        <div className="text-sm text-red-600 mt-2">{errors.display_name}</div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Optional description of this role..."
                                    />
                                    {errors.description && (
                                        <div className="text-sm text-red-600 mt-2">{errors.description}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Permissions Selection */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Assign Permissions
                                </h3>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {data.permissions.length} selected
                                </span>
                            </div>

                            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                <div key={category} className="mb-6 border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                                            {category.replace(/_/g, ' ')}
                                            <span className="ml-2 text-sm text-gray-500">({categoryPermissions.length})</span>
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllCategory(category, categoryPermissions)}
                                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            {isCategoryFullySelected(categoryPermissions)
                                                ? '✓ Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categoryPermissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                                                    data.permissions.includes(permission.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {permission.display_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {permission.name}
                                                    </div>
                                                    {permission.description && (
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            {permission.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {errors.permissions && (
                                <div className="text-sm text-red-600 mt-2">{errors.permissions}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href={route('roles.index')}
                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg"
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
