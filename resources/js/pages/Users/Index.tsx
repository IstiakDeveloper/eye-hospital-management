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
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    Shield,
    Filter,
    Users,
    Eye,
    MoreHorizontal
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    filters?: {
        search?: string;
        role_id?: string;
        is_active?: string;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        view: boolean;
        manage_permissions: boolean;
    };
}

export default function UsersIndex({ users, roles, filters, can }: UsersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role_id || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.is_active || 'all');
    const { auth } = usePage().props as any;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('users.index'), {
            search: searchTerm,
            role: roleFilter,
            status: statusFilter
        }, { preserveState: true });
    };

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        router.get(route('users.index'), {
            search: searchTerm,
            role: value,
            status: statusFilter
        }, { preserveState: true });
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        router.get(route('users.index'), {
            search: searchTerm,
            role: roleFilter,
            status: value
        }, { preserveState: true });
    };

    const toggleUserStatus = (userId: number) => {
        if (confirm('Are you sure you want to change this user status?')) {
            router.patch(route('users.toggle-status', userId), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Status will be updated automatically
                }
            });
        }
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

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'super admin':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'admin':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'doctor':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'nurse':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'staff':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-teal-500'
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

    return (
        <AdminLayout title="Users Management">
            <Head title="Users" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage system users, roles, and permissions
                        </p>
                    </div>
                    {can.create && (
                        <Button
                            href={route('users.create')}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add New User
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{users?.total || 0}</p>
                                </div>
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {users?.data?.filter(user => user.is_active).length || 0}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {users?.data?.filter(user => !user.is_active).length || 0}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <XIcon className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Roles</p>
                                    <p className="text-2xl font-bold text-purple-600">{roles?.length || 0}</p>
                                </div>
                                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Shield className="h-4 w-4 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search & Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-10 bg-blue-600 hover:bg-blue-700"
                            >
                                Search
                            </Button>
                        </form>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Filter by Role
                                </label>
                                <Select
                                    value={roleFilter}
                                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                                    options={[
                                        { value: 'all', label: 'All Roles' },
                                        ...(roles?.map(role => ({
                                            value: role.id.toString(),
                                            label: role.name
                                        })) || [])
                                    ]}
                                    placeholder="Select role"
                                    selectSize="default"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Filter by Status
                                </label>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                                    options={[
                                        { value: 'all', label: 'All Status' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' }
                                    ]}
                                    placeholder="Select status"
                                    selectSize="default"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Users List</CardTitle>
                            <p className="text-sm text-gray-600">
                                Showing {users?.from || 0} to {users?.to || 0} of {users?.total || 0} users
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {users?.data?.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-semibold">User</TableHead>
                                            <TableHead className="font-semibold">Contact Information</TableHead>
                                            <TableHead className="font-semibold">Role</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data?.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-sm`}>
                                                            {getInitials(user.name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{user.name}</p>
                                                            <p className="text-sm text-gray-500">ID: #{user.id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <Mail className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-900">{user.email}</span>
                                                        </div>
                                                        {user.phone && (
                                                            <div className="flex items-center space-x-2">
                                                                <Phone className="h-4 w-4 text-gray-400" />
                                                                <span className="text-sm text-gray-600">{user.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${getRoleBadgeColor(user.role.name)} border`}
                                                    >
                                                        {user.role.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={user.is_active ? "default" : "secondary"}
                                                        className={user.is_active
                                                            ? 'bg-green-100 text-green-800 border-green-200 border'
                                                            : 'bg-gray-100 text-gray-800 border-gray-200 border'
                                                        }
                                                    >
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {can.view && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('users.show', user.id)} className="flex items-center cursor-pointer">
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        View Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can.edit && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('users.edit', user.id)} className="flex items-center cursor-pointer">
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit User
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can.edit && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => toggleUserStatus(user.id)}
                                                                        className={`flex items-center cursor-pointer ${user.is_active ? 'text-red-600' : 'text-green-600'}`}
                                                                    >
                                                                        {user.is_active ? (
                                                                            <>
                                                                                <XIcon className="h-4 w-4 mr-2" />
                                                                                Deactivate User
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Check className="h-4 w-4 mr-2" />
                                                                                Activate User
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            {can.delete && auth.user.id !== user.id && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => deleteUser(user.id)}
                                                                        className="text-red-600 flex items-center cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete User
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        No users match your current search criteria. Try adjusting your filters or search terms.
                                    </p>
                                    {can.create && (
                                        <Button
                                            href={route('users.create')}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Add First User
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {users?.data?.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <Pagination links={users.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
