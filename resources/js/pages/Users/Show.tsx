// resources/js/Pages/Users/Show.tsx
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  Key,
  Stethoscope,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';

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
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    const category = permission.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <AdminLayout title={`User: ${user.name}`}>
      <Head title={`User: ${user.name}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link
              href={route('users.index')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Users
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 mt-1">View user details and permissions</p>
          </div>

          <div className="flex gap-2">
            {can.edit && (
              <Button
                variant="outline"
                asChild
              >
                <Link href={route('users.edit', user.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Link>
              </Button>
            )}
            {can.manage_permissions && (
              <Button
                variant="outline"
                asChild
              >
                <Link href={route('users.permissions', user.id)}>
                  <Key className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Link>
              </Button>
            )}
            {can.delete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-500" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 mt-1">{user.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <div className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <div className="flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <p className="text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="flex items-center mt-1">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                        {user.role.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <div className="flex items-center mt-1">
                      {user.is_active ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                            Active
                          </span>
                          {can.edit && (
                            <button
                              onClick={handleToggleStatus}
                              className="ml-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Deactivate
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                            Inactive
                          </span>
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
                    <div className="flex items-center mt-1">
                      {user.email_verified_at ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-gray-900 text-sm">
                            Verified on {format(new Date(user.email_verified_at), 'MMM dd, yyyy')}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          <span className="text-gray-900 text-sm">Not verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {user.doctor && (
                  <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Stethoscope className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Doctor Profile</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p><strong>Name:</strong> {user.doctor.name}</p>
                          <p><strong>Specialization:</strong> {user.doctor.specialization}</p>
                          <Link
                            href={route('doctors.edit', user.doctor.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                          >
                            View Doctor Profile →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Created At
                    </label>
                    <p className="text-gray-900 text-sm mt-1">
                      {format(new Date(user.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Last Updated
                    </label>
                    <p className="text-gray-900 text-sm mt-1">
                      {format(new Date(user.updated_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-purple-500" />
                  User Permissions
                </CardTitle>
                <CardDescription>
                  Permissions assigned to this user ({userPermissions.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userPermissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No permissions assigned</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                      const categoryPermissions = permissions.filter(p =>
                        userPermissions.includes(p.name)
                      );

                      if (categoryPermissions.length === 0) return null;

                      return (
                        <div key={category}>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
                          <div className="flex flex-wrap gap-2">
                            {categoryPermissions.map((permission) => (
                              <span
                                key={permission.id}
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  rolePermissions.includes(permission.name)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {permission.display_name}
                                {!rolePermissions.includes(permission.name) && (
                                  <span className="ml-1" title="User-specific permission">+</span>
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
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      asChild
                    >
                      <Link href={route('users.permissions', user.id)}>
                        <UserCog className="h-4 w-4 mr-2" />
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Permissions</span>
                  <span className="text-lg font-semibold text-gray-900">{userPermissions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Role Permissions</span>
                  <span className="text-lg font-semibold text-blue-600">{rolePermissions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custom Permissions</span>
                  <span className="text-lg font-semibold text-purple-600">
                    {userPermissions.length - rolePermissions.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Role Permission
                  </span>
                  <span className="text-xs text-gray-600">From role</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Custom +
                  </span>
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
