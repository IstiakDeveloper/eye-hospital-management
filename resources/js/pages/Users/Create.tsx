// resources/js/Pages/Users/Create.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, useForm } from '@inertiajs/react';
import { Key, Mail, Phone, Save, Shield, User, UserPlus, X } from 'lucide-react';
import React from 'react';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface UserCreateProps {
    roles: Role[];
}

export default function UserCreate({ roles }: UserCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role_id: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AdminLayout title="Add New User">
            <Head title="Add New User" />

            <Card className="mx-auto max-w-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <UserPlus className="mr-2 h-5 w-5 text-blue-500" />
                        Add New User
                    </CardTitle>
                    <CardDescription>Create a new user account for the system.</CardDescription>
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
                                    icon={<User className="h-4 w-4 text-gray-400" />}
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
                                    icon={<Mail className="h-4 w-4 text-gray-400" />}
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
                                    icon={<Phone className="h-4 w-4 text-gray-400" />}
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
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                    Password *
                                </label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    icon={<Key className="h-4 w-4 text-gray-400" />}
                                />
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">
                                    Confirm Password *
                                </label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                    icon={<Key className="h-4 w-4 text-gray-400" />}
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
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Active Account
                                </label>
                            </div>

                            <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <Shield className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>
                                                If you select the "Doctor" role, you will be redirected to create a doctor profile after saving this
                                                user.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" icon={<X className="h-4 w-4" />} href={route('users.index')}>
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing} icon={<Save className="h-4 w-4" />} isLoading={processing}>
                            Create User
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AdminLayout>
    );
}
