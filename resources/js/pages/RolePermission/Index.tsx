import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
    permissions_count: number;
    users_count: number;
    created_at: string;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    category: string;
    description: string | null;
}

interface Props extends PageProps {
    roles: Role[];
    permissions: Permission[];
    permissionsByCategory: Record<string, Permission[]>;
}

export default function Index({ roles, permissions, permissionsByCategory }: Props) {
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

    const handleDeleteRole = (roleId: number, roleName: string) => {
        if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
            router.delete(route('roles.destroy', roleId), {
                preserveScroll: true,
            });
        }
    };

    const handleDeletePermission = (permissionId: number, permissionName: string) => {
        if (confirm(`Are you sure you want to delete the permission "${permissionName}"?`)) {
            router.delete(route('permissions.destroy', permissionId), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout title="Roles & Permissions Management">
            <Head title="Roles & Permissions" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <div className="text-sm font-medium text-gray-500">Total Roles</div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">{roles.length}</div>
                        </div>
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <div className="text-sm font-medium text-gray-500">Total Permissions</div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">{permissions.length}</div>
                        </div>
                        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                            <div className="text-sm font-medium text-gray-500">Permission Categories</div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">{Object.keys(permissionsByCategory).length}</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex">
                                <button
                                    onClick={() => setActiveTab('roles')}
                                    className={`${
                                        activeTab === 'roles'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } border-b-2 px-6 py-4 text-sm font-medium whitespace-nowrap`}
                                >
                                    Roles
                                </button>
                                <button
                                    onClick={() => setActiveTab('permissions')}
                                    className={`${
                                        activeTab === 'permissions'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    } border-b-2 px-6 py-4 text-sm font-medium whitespace-nowrap`}
                                >
                                    Permissions
                                </button>
                            </nav>
                        </div>

                        {/* Roles Tab */}
                        {activeTab === 'roles' && (
                            <div className="p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">All Roles</h3>
                                    <Link
                                        href={route('roles.create')}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase ring-indigo-300 transition duration-150 ease-in-out hover:bg-indigo-700 focus:border-indigo-900 focus:ring focus:outline-none active:bg-indigo-900 disabled:opacity-25"
                                    >
                                        Create New Role
                                    </Link>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Role Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Permissions
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Users
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {roles.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                        No roles found. Create your first role to get started.
                                                    </td>
                                                </tr>
                                            ) : (
                                                roles.map((role) => (
                                                    <tr key={role.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{role.display_name}</div>
                                                            <div className="text-sm text-gray-500">{role.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900">{role.description || '-'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs leading-5 font-semibold text-blue-800">
                                                                {role.permissions_count} permissions
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                                {role.users_count} users
                                                            </span>
                                                        </td>
                                                        <td className="space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                            <Link
                                                                href={route('roles.assign-permissions', role.id)}
                                                                className="text-purple-600 hover:text-purple-900"
                                                            >
                                                                Assign
                                                            </Link>
                                                            <Link
                                                                href={route('roles.edit', role.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteRole(role.id, role.display_name)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Permissions Tab */}
                        {activeTab === 'permissions' && (
                            <div className="p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">All Permissions</h3>
                                    <Link
                                        href={route('permissions.create')}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase ring-indigo-300 transition duration-150 ease-in-out hover:bg-indigo-700 focus:border-indigo-900 focus:ring focus:outline-none active:bg-indigo-900 disabled:opacity-25"
                                    >
                                        Create New Permission
                                    </Link>
                                </div>

                                {Object.keys(permissionsByCategory).length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        No permissions found. Create your first permission to get started.
                                    </div>
                                ) : (
                                    Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                        <div key={category} className="mb-8">
                                            <h4 className="text-md mb-4 font-semibold text-gray-900 capitalize">
                                                {category.replace(/_/g, ' ')} ({categoryPermissions.length})
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                Permission Name
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                Description
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                        {categoryPermissions.map((permission) => (
                                                            <tr key={permission.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{permission.display_name}</div>
                                                                    <div className="text-sm text-gray-500">{permission.name}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900">{permission.description || '-'}</div>
                                                                </td>
                                                                <td className="space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                                    <Link
                                                                        href={route('permissions.edit', permission.id)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDeletePermission(permission.id, permission.display_name)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
