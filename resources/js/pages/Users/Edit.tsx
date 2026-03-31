// resources/js/Pages/Users/Edit.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Save, Shield, Trash2, User, X } from 'lucide-react';
import React from 'react';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    is_active: boolean;
}

interface UserEditProps {
    user: UserData;
    roles: Role[];
    isCurrentUser: boolean;
    can: {
        delete: boolean;
        manage_permissions: boolean;
    };
}

export default function UserEdit({ user, roles, isCurrentUser, can }: UserEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
        role_id: user.role.id.toString(),
        is_active: user.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    const deleteUser = () => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const wasDoctor = user.role.name === 'Doctor';
    const isDoctor = data.role_id === '2'; // Assuming Doctor role ID is 2

    return (
        <AdminLayout title="Edit User">
            <Head title="Edit User" />

            <Card className="mx-auto max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="mr-2 h-5 w-5 text-blue-500" />
                        Edit User - {user.name}
                    </CardTitle>
                    <CardDescription>Update user account information.</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                    Full Name *
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                    Email Address *
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    error={errors.phone}
                                />
                            </div>

                            <div>
                                <label htmlFor="role_id" className="mb-1 block text-sm font-medium text-gray-700">
                                    User Role *
                                </label>
                                <Select
                                    id="role_id"
                                    name="role_id"
                                    value={data.role_id}
                                    onChange={(e) => setData('role_id', e.target.value)}
                                    error={errors.role_id}
                                    options={[
                                        { value: '', label: 'Select a role' },
                                        ...roles.map((role) => ({
                                            value: role.id.toString(),
                                            label: role.name + (role.description ? ` - ${role.description}` : ''),
                                        })),
                                    ]}
                                    disabled={isCurrentUser} // Can't change own role
                                />
                                {isCurrentUser && <p className="mt-1 text-sm text-amber-600">You cannot change your own role.</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                    Password (leave blank to keep current)
                                </label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="is_active"
                                    name="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isCurrentUser} // Can't disable own account
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Active Account
                                </label>
                                {isCurrentUser && <p className="ml-2 text-sm text-amber-600">You cannot deactivate your own account.</p>}
                            </div>

                            {!wasDoctor && isDoctor && (
                                <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <Shield className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">Role Change Notice</h3>
                                            <div className="mt-2 text-sm text-yellow-700">
                                                <p>
                                                    You are changing this user to a Doctor role. After saving, you will be redirected to create a
                                                    doctor profile.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" asChild>
                                <a href={route('users.index')}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </a>
                            </Button>

                            {can.delete && !isCurrentUser && (
                                <Button type="button" variant="destructive" onClick={deleteUser}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                </Button>
                            )}
                        </div>

                        <Button type="submit" disabled={processing} isLoading={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Update User
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AdminLayout>
    );
}
