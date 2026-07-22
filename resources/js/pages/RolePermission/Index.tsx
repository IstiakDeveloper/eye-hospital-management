import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { RefreshCw, Shield, Plus } from 'lucide-react';
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
    const [isSyncing, setIsSyncing] = useState(false);

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

    const handleSyncPermissions = () => {
        setIsSyncing(true);
        router.post(route('permissions.sync'), {}, {
            preserveScroll: true,
            onFinish: () => setIsSyncing(false),
        });
    };

    return (
        <AdminLayout title="Roles & Permissions Management">
            <Head title="Roles & Permissions" />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            Roles & Permissions Management
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Safely update new system permissions without losing existing user or role assignments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSyncPermissions}
                        disabled={isSyncing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync System Permissions'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="overflow-hidden bg-white p-6 shadow-xs border border-slate-200 rounded-2xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Roles</div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">{roles.length}</div>
                    </div>
                    <div className="overflow-hidden bg-white p-6 shadow-xs border border-slate-200 rounded-2xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Permissions</div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">{permissions.length}</div>
                    </div>
                    <div className="overflow-hidden bg-white p-6 shadow-xs border border-slate-200 rounded-2xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Permission Categories</div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">{Object.keys(permissionsByCategory).length}</div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="overflow-hidden bg-white shadow-xs border border-slate-200 rounded-2xl">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('roles')}
                                className={`${
                                    activeTab === 'roles'
                                        ? 'border-blue-600 text-blue-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 font-medium'
                                } border-b-2 px-6 py-4 text-sm whitespace-nowrap transition-colors`}
                            >
                                Roles ({roles.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`${
                                    activeTab === 'permissions'
                                        ? 'border-blue-600 text-blue-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 font-medium'
                                } border-b-2 px-6 py-4 text-sm whitespace-nowrap transition-colors`}
                            >
                                Permissions ({permissions.length})
                            </button>
                        </nav>
                    </div>

                    {/* Roles Tab */}
                    {activeTab === 'roles' && (
                        <div className="p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">All Roles</h3>
                                <Link
                                    href={route('roles.create')}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition hover:bg-blue-700 active:scale-95 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Create New Role
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/75">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Role Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Permissions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Users
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {roles.map((role) => (
                                            <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {role.display_name || role.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {role.description || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                                                        {role.permissions_count} permissions
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                                                        {role.users_count} users
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('roles.assign-permissions', role.id)}
                                                            className="text-xs text-blue-600 hover:text-blue-900 font-semibold"
                                                        >
                                                            Manage Permissions
                                                        </Link>
                                                        {role.name !== 'Super Admin' && (
                                                            <>
                                                                <Link
                                                                    href={route('roles.edit', role.id)}
                                                                    className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold"
                                                                >
                                                                    Edit
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDeleteRole(role.id, role.name)}
                                                                    className="text-xs text-red-600 hover:text-red-900 font-semibold"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Permissions Tab */}
                    {activeTab === 'permissions' && (
                        <div className="p-6">
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h3 className="text-lg font-bold text-gray-900">All System Permissions ({permissions.length})</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSyncPermissions}
                                        disabled={isSyncing}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                        Sync Permissions
                                    </button>
                                    <Link
                                        href={route('permissions.create')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition hover:bg-blue-700 active:scale-95 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Create Permission
                                    </Link>
                                </div>
                            </div>

                            {Object.keys(permissionsByCategory).length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                    No permissions found. Click "Sync Permissions" above to load all system permissions.
                                </div>
                            ) : (
                                Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                                    <div key={category} className="mb-8">
                                        <h4 className="text-sm mb-3 font-extrabold text-slate-800 uppercase tracking-wider bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                            Category: {category.replace(/_/g, ' ')} ({categoryPermissions.length})
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Permission Name
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                    {categoryPermissions.map((permission) => (
                                                        <tr key={permission.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900">
                                                                <div>{permission.display_name}</div>
                                                                <span className="font-mono text-xs text-gray-500">{permission.name}</span>
                                                            </td>
                                                            <td className="px-6 py-3.5 text-sm text-gray-500">
                                                                {permission.description || '—'}
                                                            </td>
                                                            <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Link
                                                                        href={route('permissions.edit', permission.id)}
                                                                        className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handleDeletePermission(permission.id, permission.name)}
                                                                        className="text-xs text-red-600 hover:text-red-900 font-semibold"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
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
        </AdminLayout>
    );
}
