// resources/js/Pages/Users/Index.tsx
import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import Pagination from '@/components/ui/pagination';
import {
    Search,
    UserPlus,
    User as UserIcon,
    Mail,
    Phone,
    Edit,
    Trash2,
    Check,
    X as XIcon,
    Shield
} from 'lucide-react';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    is_active: boolean;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersIndexProps {
    users: {
        data: User[];
        links: PaginationLinks[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    roles: Role[];
}

export default function UsersIndex({ users, roles }: UsersIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const { auth } = usePage().props as any;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('users.index'), {
            search: searchTerm,
            role: roleFilter,
            status: statusFilter
        }, { preserveState: true });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'role') {
            setRoleFilter(value);
        } else if (name === 'status') {
            setStatusFilter(value);
        }
        router.get(route('users.index'), {
            search: searchTerm,
            role: name === 'role' ? value : roleFilter,
            status: name === 'status' ? value : statusFilter
        }, { preserveState: true });
    };

    const toggleUserStatus = (id: number, currentStatus: boolean) => {
        router.put(route('users.update', id), {
            is_active: !currentStatus,
            _method: 'PUT'
        }, {
            onSuccess: () => {
                // Status will be updated automatically
            },
            preserveState: true
        });
    };

    const deleteUser = (id: number) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            router.delete(route('users.destroy', id), {
                onSuccess: () => {
                    // User will be removed from list
                }
            });
        }
    };

    return (
        <AdminLayout title="Users">
            <Head title="Users" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
                    <Input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-r-none focus:z-10"
                        icon={<Search className="h-4 w-4 text-gray-400" />}
                    />
                    <Button type="submit" className="rounded-l-none border border-l-0 border-gray-300">
                        Search
                    </Button>
                </form>

                <Button href={route('users.create')} icon={<UserPlus className="h-4 w-4" />}>
                    Add New User
                </Button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:max-w-md">
                    <div>
                        <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Role
                        </label>
                        <select
                            id="role-filter"
                            name="role"
                            value={roleFilter}
                            onChange={handleFilterChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full"
                        >
                            <option value="all">All Roles</option>
                            {roles?.map((role) => (
                                <option key={role.id} value={role.id.toString()}>{role.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                        </label>
                        <select
                            id="status-filter"
                            name="status"
                            value={statusFilter}
                            onChange={handleFilterChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">User List</h3>
                    <p className="text-sm text-gray-600">
                        Showing {users.from} to {users.to} of {users.total} users
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {users.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold mr-2">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center">
                                                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                                                    <span className="text-sm">{user.email}</span>
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center">
                                                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                                        <span className="text-sm">{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.role.name === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role.name === 'Doctor' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {user.role.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    href={route('users.edit', user.id)}
                                                    icon={<Edit className="h-4 w-4" />}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                    className={user.is_active ? 'text-red-600' : 'text-green-600'}
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <XIcon className="h-4 w-4 mr-1" />
                                                            Disable
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Enable
                                                        </>
                                                    )}
                                                </Button>

                                                {auth.user.id !== user.id && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteUser(user.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="px-6 py-8 text-center text-gray-500">
                            No users found. Please try a different search or add a new user.
                        </div>
                    )}
                </div>

                <Pagination links={users.links} />
            </div>
        </AdminLayout>
    );
}
