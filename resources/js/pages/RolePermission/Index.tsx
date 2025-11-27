import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';

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

export default function Index({  roles, permissions, permissionsByCategory }: Props) {
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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm font-medium">Total Roles</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">{roles.length}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm font-medium">Total Permissions</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">{permissions.length}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm font-medium">Permission Categories</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">
                                {Object.keys(permissionsByCategory).length}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex">
                                <button
                                    onClick={() => setActiveTab('roles')}
                                    className={`${
                                        activeTab === 'roles'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                >
                                    Roles
                                </button>
                                <button
                                    onClick={() => setActiveTab('permissions')}
                                    className={`${
                                        activeTab === 'permissions'
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                >
                                    Permissions
                                </button>
                            </nav>
                        </div>

                        {/* Roles Tab */}
                        {activeTab === 'roles' && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">All Roles</h3>
                                    <Link
                                        href={route('roles.create')}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Create New Role
                                    </Link>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Permissions
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Users
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
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
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {role.display_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{role.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900">
                                                                {role.description || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {role.permissions_count} permissions
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {role.users_count} users
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">All Permissions</h3>
                                    <Link
                                        href={route('permissions.create')}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Create New Permission
                                    </Link>
                                </div>

                                {Object.keys(permissionsByCategory).length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        No permissions found. Create your first permission to get started.
                                    </div>
                                ) : (
                                    Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                        <div key={category} className="mb-8">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4 capitalize">
                                                {category.replace(/_/g, ' ')} ({categoryPermissions.length})
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Permission Name
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Description
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {categoryPermissions.map((permission) => (
                                                            <tr key={permission.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {permission.display_name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {permission.name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900">
                                                                        {permission.description || '-'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                    <Link
                                                                        href={route('permissions.edit', permission.id)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeletePermission(
                                                                                permission.id,
                                                                                permission.display_name
                                                                            )
                                                                        }
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
