import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Edit, Trash2, Power, PowerOff, Scissors, DollarSign, Calendar, FileText } from 'lucide-react';

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
            minute: '2-digit'
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
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Scissors className="w-8 h-8 text-purple-600" />
                                Operation Details
                            </h1>
                            <p className="text-gray-600 mt-1">View operation information</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit('/operations')}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
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
                                        className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Operation
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg ${operation.is_active
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {operation.is_active ? (
                                            <>
                                                <PowerOff className="w-4 h-4" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <Power className="w-4 h-4" />
                                                Activate
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                            {can.delete && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}

                    {/* Main Info Card */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                            <h2 className="text-xl font-bold text-white">{operation.operation_name}</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Operation Type */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                                        <FileText className="w-4 h-4" />
                                        Operation Type
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-800">
                                            {operation.operation_type}
                                        </span>
                                    </p>
                                </div>

                                {/* Base Price */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                                        <DollarSign className="w-4 h-4" />
                                        Base Price
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(operation.base_price)}
                                    </p>
                                </div>

                                {/* Status */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                                        {operation.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                        Status
                                    </div>
                                    <p className="text-lg">
                                        {operation.is_active ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
                                                <Power className="w-4 h-4" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold">
                                                <PowerOff className="w-4 h-4" />
                                                Inactive
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Created At */}
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        Created On
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">{formatDate(operation.created_at)}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {operation.description && (
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">
                                        Description
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-gray-700 whitespace-pre-wrap">{operation.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-gray-50 rounded-lg border p-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Metadata</h3>
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
