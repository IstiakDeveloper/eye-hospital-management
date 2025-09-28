import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Filter, Archive, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';

interface StockMovement {
    id: number;
    item_type: string;
    item_id: number;
    movement_type: string;
    quantity: number;
    previous_stock: number;
    new_stock: number;
    unit_price: number;
    total_amount: number;
    notes?: string;
    created_at: string;
    user: {
        name: string;
    };
    item_name: string;
}

interface FilterParams {
    type?: string;
    item_type?: string;
}

const Button = ({ children, className = '', variant = 'primary', size = 'md', ...props }: any) => {
    const baseClasses = 'font-medium transition-colors flex items-center space-x-2 rounded-lg';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
    };
    const sizes = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Select = ({ children, className = '', ...props }: any) => (
    <select
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
    >
        {children}
    </select>
);

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                {children}
            </div>
        </div>
    );
};

export default function StockIndex({ movements }: { movements: any }) {
    const [filters, setFilters] = useState<FilterParams>({});
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movement?: StockMovement }>({ isOpen: false });
    const { delete: deleteRequest, processing } = useForm();

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'purchase': return 'bg-green-100 text-green-800';
            case 'sale': return 'bg-blue-100 text-blue-800';
            case 'adjustment': return 'bg-yellow-100 text-yellow-800';
            case 'damage': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getItemTypeLabel = (itemType: string) => {
        switch (itemType) {
            case 'glasses': return 'Frames';
            case 'lens_types': return 'Lens Types';
            case 'complete_glasses': return 'Complete Glasses';
            default: return itemType.replace('_', ' ');
        }
    };

    const handleFilter = () => {
        router.get('/optics/stock', filters, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleDelete = (movement: StockMovement) => {
        setDeleteModal({ isOpen: true, movement });
    };

    const confirmDelete = () => {
        if (deleteModal.movement) {
            deleteRequest(`/optics/stock/${deleteModal.movement.id}`, {
                onSuccess: () => setDeleteModal({ isOpen: false }),
                onError: () => setDeleteModal({ isOpen: false })
            });
        }
    };

    const canEdit = (movement: StockMovement) => {
        return movement.movement_type === 'purchase';
    };

    const canDelete = (movement: StockMovement) => {
        return movement.movement_type === 'purchase';
    };

    return (
        <AdminLayout>
            <Head title="Stock Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
                        <p className="text-gray-600">Track all stock movements and inventory changes</p>
                    </div>
                    <Link href="/optics/stock/add">
                        <Button>
                            <Plus className="w-4 h-4" />
                            <span>Add Stock</span>
                        </Button>
                    </Link>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Movements</p>
                                <p className="text-2xl font-bold text-gray-900">{movements.total}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Archive className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Purchases Today</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {movements.data.filter((m: StockMovement) =>
                                        m.movement_type === 'purchase' &&
                                        new Date(m.created_at).toDateString() === new Date().toDateString()
                                    ).length}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Plus className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sales Today</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {movements.data.filter((m: StockMovement) =>
                                        m.movement_type === 'sale' &&
                                        new Date(m.created_at).toDateString() === new Date().toDateString()
                                    ).length}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Eye className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Today's Value</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(
                                        movements.data
                                            .filter((m: StockMovement) =>
                                                new Date(m.created_at).toDateString() === new Date().toDateString()
                                            )
                                            .reduce((sum: number, m: StockMovement) => sum + m.total_amount, 0)
                                    )}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Archive className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Select
                            value={filters.type || ''}
                            onChange={(e: any) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="">All Movement Types</option>
                            <option value="purchase">Purchase</option>
                            <option value="sale">Sale</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="damage">Damage</option>
                        </Select>
                        <Select
                            value={filters.item_type || ''}
                            onChange={(e: any) => setFilters(prev => ({ ...prev, item_type: e.target.value }))}
                        >
                            <option value="">All Item Types</option>
                            <option value="glasses">Frames</option>
                            <option value="lens_types">Lens Types</option>
                            <option value="complete_glasses">Complete Glasses</option>
                        </Select>
                        <Button variant="secondary" onClick={handleFilter}>
                            <Filter className="w-4 h-4" />
                            <span>Apply Filters</span>
                        </Button>
                        <Button variant="secondary" onClick={() => setFilters({})}>
                            <span>Clear Filters</span>
                        </Button>
                        <Button variant="secondary">
                            <Archive className="w-4 h-4" />
                            <span>Export</span>
                        </Button>
                    </div>
                </div>

                {/* Movements Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movement</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {movements.data.map((movement: StockMovement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{movement.item_name}</p>
                                                <p className="text-sm text-gray-500">{getItemTypeLabel(movement.item_type)}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementColor(movement.movement_type)}`}>
                                                {movement.movement_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {movement.quantity > 0 ? (
                                                    <span className="text-green-600 font-medium">+{movement.quantity}</span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">{movement.quantity}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {movement.previous_stock} → {movement.new_stock}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {formatCurrency(movement.unit_price)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatCurrency(movement.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(movement.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {movement.user.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {canEdit(movement) && (
                                                    <Link href={`/optics/stock/${movement.id}/edit`}>
                                                        <Button variant="secondary" size="sm">
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {canDelete(movement) && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(movement)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                {!canEdit(movement) && !canDelete(movement) && (
                                                    <span className="text-xs text-gray-400">No actions</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {movements.data.length === 0 && (
                        <div className="text-center py-12">
                            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock movements found</h3>
                            <p className="text-gray-500">Start by adding some stock to see movements here.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {movements.links && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {movements.links.map((link: any, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${link.active
                                        ? 'bg-blue-600 text-white'
                                        : link.url
                                            ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false })}
            >
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Stock Movement</h3>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete this stock movement? This will:
                        <br />
                        • Revert the stock quantity
                        <br />
                        • Add refund to account balance
                        <br />
                        • This action cannot be undone
                    </p>
                    {deleteModal.movement && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
                            <p><strong>Item:</strong> {deleteModal.movement.item_name}</p>
                            <p><strong>Quantity:</strong> {deleteModal.movement.quantity}</p>
                            <p><strong>Amount:</strong> {formatCurrency(deleteModal.movement.total_amount)}</p>
                        </div>
                    )}
                    <div className="flex space-x-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteModal({ isOpen: false })}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
