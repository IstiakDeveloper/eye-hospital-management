import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, Edit, FileText, Power, PowerOff, Scissors, Trash2 } from 'lucide-react';

interface Operation {
    id: number;
    operation_name: string;
    operation_type: string;
    base_price: number;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    operation: Operation;
    can: {
        edit: boolean;
        delete: boolean;
    };
}

export default function ShowOperation({ operation, can }: Props) {
    const formatCurrency = (amount: number) => `৳${Number(amount).toFixed(2)}`;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${operation.operation_name}"? This action cannot be undone.`)) {
            router.delete(`/operations/${operation.id}`);
        }
    };

    const handleToggleStatus = () => {
        router.patch(`/operations/${operation.id}/toggle-status`);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                                <Scissors className="h-8 w-8 text-purple-600" />
                                Operation Details
                            </h1>
                            <p className="mt-1 text-gray-600">View operation information</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit('/operations')}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {(can.edit || can.delete) && (
                        <div className="mb-6 flex gap-3">
                            {can.edit && (
                                <>
                                    <button
                                        onClick={() => router.visit(`/operations/${operation.id}/edit`)}
                                        className="flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-2 text-white hover:bg-yellow-700"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit Operation
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`flex items-center gap-2 rounded-lg px-6 py-2 ${
                                            operation.is_active
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        {operation.is_active ? (
                                            <>
                                                <PowerOff className="h-4 w-4" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <Power className="h-4 w-4" />
                                                Activate
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {can.delete && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}

                    {/* Main Info Card */}
                    <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                            <h2 className="text-xl font-bold text-white">{operation.operation_name}</h2>
                        </div>

                        <div className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Operation Type */}
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <FileText className="h-4 w-4" />
                                        Operation Type
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        <span className="inline-flex items-center rounded-lg bg-blue-100 px-4 py-2 text-blue-800">
                                            {operation.operation_type}
                                        </span>
                                    </p>
                                </div>

                                {/* Base Price */}
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <DollarSign className="h-4 w-4" />
                                        Base Price
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(operation.base_price)}</p>
                                </div>

                                {/* Status */}
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                                        {operation.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                                        Status
                                    </div>
                                    <p className="text-lg">
                                        {operation.is_active ? (
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 font-semibold text-green-800">
                                                <Power className="h-4 w-4" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-800">
                                                <PowerOff className="h-4 w-4" />
                                                Inactive
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Created At */}
                                <div>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        Created On
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">{formatDate(operation.created_at)}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {operation.description && (
                                <div>
                                    <div className="mb-2 text-sm font-medium text-gray-500">Description</div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <p className="whitespace-pre-wrap text-gray-700">{operation.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="rounded-lg border bg-gray-50 p-4">
                        <h3 className="mb-3 font-semibold text-gray-700">Metadata</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Created:</span>
                                <span className="ml-2 font-medium text-gray-900">{formatDate(operation.created_at)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Last Updated:</span>
                                <span className="ml-2 font-medium text-gray-900">{formatDate(operation.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
