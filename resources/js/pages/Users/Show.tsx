// resources/js/Pages/Users/Show.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Clock, Edit, Key, Mail, Phone, Shield, Stethoscope, Trash2, User, UserCog, XCircle } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface Doctor {
    id: number;
    name: string;
    specialization: string;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    category: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role: Role;
    doctor: Doctor | null;
}

interface UserShowProps {
    user: UserData;
    userPermissions: string[];
    rolePermissions: string[];
    allPermissions: Permission[];
    can: {
        edit: boolean;
        delete: boolean;
        manage_permissions: boolean;
    };
}

export default function UserShow({ user, userPermissions, rolePermissions, allPermissions, can }: UserShowProps) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const handleToggleStatus = () => {
        const action = user.is_active ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            router.patch(route('users.toggle-status', user.id));
        }
    };

    // Group permissions by category
    const permissionsByCategory = allPermissions.reduce(
        (acc, permission) => {
            const category = permission.category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
        },
        {} as Record<string, Permission[]>,
    );

    return (
        <AdminLayout title={`User: ${user.name}`}>
            <Head title={`User: ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href={route('users.index')} className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Users
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                        <p className="mt-1 text-gray-500">View user details and permissions</p>
                    </div>

                    <div className="flex gap-2">
                        {can.edit && (
                            <Button variant="outline" asChild>
                                <Link href={route('users.edit', user.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                </Link>
                            </Button>
                        )}
                        {can.manage_permissions && (
                            <Button variant="outline" asChild>
                                <Link href={route('users.permissions', user.id)}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Manage Permissions
                                </Link>
                            </Button>
                        )}
                        {can.delete && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* User Information */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="mr-2 h-5 w-5 text-blue-500" />
                                    User Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                                        <p className="mt-1 text-gray-900">{user.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                                        <div className="mt-1 flex items-center">
                                            <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                            <p className="text-gray-900">{user.email}</p>
                                        </div>
                                    </div>

                                    {user.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                            <div className="mt-1 flex items-center">
                                                <Phone className="mr-2 h-4 w-4 text-gray-400" />
                                                <p className="text-gray-900">{user.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Role</label>
                                        <div className="mt-1 flex items-center">
                                            <Shield className="mr-2 h-4 w-4 text-gray-400" />
                                            <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800">{user.role.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Account Status</label>
                                        <div className="mt-1 flex items-center">
                                            {user.is_active ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                    <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800">Active</span>
                                                    {can.edit && (
                                                        <button onClick={handleToggleStatus} className="ml-2 text-xs text-red-600 hover:text-red-800">
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                                    <span className="rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800">Inactive</span>
                                                    {can.edit && (
                                                        <button
                                                            onClick={handleToggleStatus}
                                                            className="ml-2 text-xs text-green-600 hover:text-green-800"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email Verified</label>
                                        <div className="mt-1 flex items-center">
                                            {user.email_verified_at ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                    <span className="text-sm text-gray-900">
                                                        Verified on {format(new Date(user.email_verified_at), 'MMM dd, yyyy')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                                    <span className="text-sm text-gray-900">Not verified</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {user.doctor && (
                                    <div className="mt-6 rounded border-l-4 border-blue-400 bg-blue-50 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <Stethoscope className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">Doctor Profile</h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>
                                                        <strong>Name:</strong> {user.doctor.name}
                                                    </p>
                                                    <p>
                                                        <strong>Specialization:</strong> {user.doctor.specialization}
                                                    </p>
                                                    <Link
                                                        href={route('doctors.edit', user.doctor.id)}
                                                        className="mt-2 inline-block font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        View Doctor Profile →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-500">
                                            <Clock className="mr-1 h-4 w-4" />
                                            Created At
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">{format(new Date(user.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>

                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-500">
                                            <Clock className="mr-1 h-4 w-4" />
                                            Last Updated
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">{format(new Date(user.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permissions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Key className="mr-2 h-5 w-5 text-purple-500" />
                                    User Permissions
                                </CardTitle>
                                <CardDescription>Permissions assigned to this user ({userPermissions.length} total)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {userPermissions.length === 0 ? (
                                    <p className="text-sm text-gray-500">No permissions assigned</p>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                                            const categoryPermissions = permissions.filter((p) => userPermissions.includes(p.name));

                                            if (categoryPermissions.length === 0) return null;

                                            return (
                                                <div key={category}>
                                                    <h4 className="mb-2 text-sm font-semibold text-gray-700">{category}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {categoryPermissions.map((permission) => (
                                                            <span
                                                                key={permission.id}
                                                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                                    rolePermissions.includes(permission.name)
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-purple-100 text-purple-800'
                                                                }`}
                                                            >
                                                                {permission.display_name}
                                                                {!rolePermissions.includes(permission.name) && (
                                                                    <span className="ml-1" title="User-specific permission">
                                                                        +
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {can.manage_permissions && (
                                    <div className="mt-4 border-t pt-4">
                                        <Button variant="outline" asChild>
                                            <Link href={route('users.permissions', user.id)}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Manage Permissions
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Quick Stats */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Total Permissions</span>
                                    <span className="text-lg font-semibold text-gray-900">{userPermissions.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Role Permissions</span>
                                    <span className="text-lg font-semibold text-blue-600">{rolePermissions.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Custom Permissions</span>
                                    <span className="text-lg font-semibold text-purple-600">{userPermissions.length - rolePermissions.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Legend</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">Role Permission</span>
                                    <span className="text-xs text-gray-600">From role</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">Custom +</span>
                                    <span className="text-xs text-gray-600">User-specific</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
