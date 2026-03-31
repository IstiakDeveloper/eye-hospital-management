import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { Edit, Eye, Plus, Power, PowerOff, Scissors, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Operation {
    id: number;
    name: string; // Changed from operation_name
    type: string; // Changed from operation_type
    price: number; // Changed from base_price
    status: string; // Changed from is_active (database uses 'active'/'inactive')
    description?: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedOperations {
    data: Operation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    operations: PaginatedOperations;
    filters: {
        search?: string;
        status?: string;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function OperationsIndex({ operations, filters, can }: Props): React.ReactElement {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleSearch = () => {
        router.get(
            '/operations',
            { search, status: status !== 'all' ? status : undefined },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        router.get('/operations');
    };

    const formatCurrency = (amount: number) => `৳${Number(amount).toFixed(2)}`;

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            router.delete(`/operations/${id}`);
        }
    };

    const handleToggleStatus = (id: number, currentStatus: boolean) => {
        router.patch(`/operations/${id}/toggle-status`);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                                <Scissors className="h-8 w-8 text-purple-600" />
                                Operations Management
                            </h1>
                            <p className="mt-1 text-gray-600">Manage operation types and pricing</p>
                        </div>
                        {can.create && (
                            <button
                                onClick={() => router.visit('/operations/create')}
                                className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white shadow-lg hover:bg-purple-700"
                            >
                                <Plus className="h-5 w-5" />
                                Add Operation
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by operation name or type..."
                                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button onClick={handleSearch} className="rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700">
                                Search
                            </button>
                            <button onClick={handleReset} className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300">
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Operations Table */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Operation Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Base Price</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {operations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <Scissors className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                                <p className="text-lg font-medium">No operations found</p>
                                                {can.create && (
                                                    <button
                                                        onClick={() => router.visit('/operations/create')}
                                                        className="mt-4 font-medium text-purple-600 hover:text-purple-700"
                                                    >
                                                        Add your first operation
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        operations.data.map((operation) => (
                                            <tr key={operation.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{operation.name}</div>
                                                    {operation.description && (
                                                        <div className="mt-1 line-clamp-1 text-sm text-gray-500">{operation.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                                        {operation.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-semibold text-gray-900">{formatCurrency(operation.price)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {operation.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                                            <Power className="h-3 w-3" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                                            <PowerOff className="h-3 w-3" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.visit(`/operations/${operation.id}`)}
                                                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        {can.edit && (
                                                            <>
                                                                <button
                                                                    onClick={() => router.visit(`/operations/${operation.id}/edit`)}
                                                                    className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleStatus(operation.id, operation.status === 'active')}
                                                                    className={`rounded-lg p-2 transition ${
                                                                        operation.status === 'active'
                                                                            ? 'text-red-600 hover:bg-red-50'
                                                                            : 'text-green-600 hover:bg-green-50'
                                                                    }`}
                                                                    title={operation.status === 'active' ? 'Deactivate' : 'Activate'}
                                                                >
                                                                    {operation.status === 'active' ? (
                                                                        <PowerOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Power className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() => handleDelete(operation.id, operation.name)}
                                                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {operations.last_page > 1 && (
                            <div className="border-t bg-gray-50 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {operations.data.length} of {operations.total} operations
                                    </div>
                                    <div className="flex gap-2">
                                        {operations.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.visit(link.url)}
                                                disabled={!link.url || link.active}
                                                className={`rounded px-3 py-1 ${
                                                    link.active
                                                        ? 'bg-purple-600 text-white'
                                                        : link.url
                                                          ? 'border bg-white hover:bg-gray-100'
                                                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
