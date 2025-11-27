import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Plus,
    Filter,
    Archive,
    Edit,
    Trash2,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingCart,
    Settings,
    FileText,
    Calendar,
    Download,
    X
} from 'lucide-react';

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
    item_brand: string;
    item_model: string;
    item_sku: string;
    item_name: string;
}

interface Stats {
    total_movements: number;
    today_purchases: number;
    today_sales: number;
    today_adjustments: number;
    today_value: number;
    week_purchases: number;
    week_sales: number;
    week_value: number;
}

interface FilterParams {
    type?: string;
    item_type?: string;
    date_from?: string;
    date_to?: string;
}

const Button = ({ children, className = '', variant = 'primary', size = 'md', ...props }: any) => {
    const baseClasses = 'font-medium transition-colors flex items-center gap-2 rounded-lg disabled:opacity-50';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        ghost: 'text-gray-700 hover:bg-gray-100'
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

const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default function StockIndex({ movements, stats, filters: initialFilters }: { movements: any; stats: Stats; filters: FilterParams }) {
    const [filters, setFilters] = useState<FilterParams>(initialFilters || {});
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movement?: StockMovement }>({ isOpen: false });
    const { delete: deleteRequest, processing } = useForm();

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovementConfig = (type: string) => {
        const configs: any = {
            purchase: {
                label: 'Purchase',
                color: 'bg-green-100 text-green-800',
                icon: TrendingUp,
                description: 'Stock In'
            },
            sale: {
                label: 'Sale',
                color: 'bg-blue-100 text-blue-800',
                icon: ShoppingCart,
                description: 'Stock Out'
            },
            adjustment: {
                label: 'Adjustment',
                color: 'bg-yellow-100 text-yellow-800',
                icon: Settings,
                description: 'Stock Modified'
            },
            damage: {
                label: 'Damage',
                color: 'bg-red-100 text-red-800',
                icon: AlertTriangle,
                description: 'Stock Lost'
            },
            return: {
                label: 'Return',
                color: 'bg-purple-100 text-purple-800',
                icon: TrendingDown,
                description: 'Stock Returned'
            }
        };
        return configs[type] || configs.adjustment;
    };

    const getItemTypeLabel = (itemType: string) => {
        const labels: any = {
            glasses: { label: 'Frame', icon: Package },
            lens_types: { label: 'Lens', icon: FileText },
            complete_glasses: { label: 'Complete', icon: Archive }
        };
        return labels[itemType] || { label: itemType, icon: Package };
    };

    const handleFilter = () => {
        router.get('/optics/stock', filters, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilters = () => {
        setFilters({});
        router.get('/optics/stock');
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

    const canEdit = (movement: StockMovement) => movement.movement_type === 'purchase';
    const canDelete = (movement: StockMovement) => movement.movement_type === 'purchase';
    const hasActiveFilters = Object.values(filters).some(v => v);

    return (
        <AdminLayout>
            <Head title="Stock Movements" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
                        <p className="text-gray-600">Track all inventory transactions and changes</p>
                    </div>
                    <Link href="/optics/stock/add">
                        <Button>
                            <Plus className="w-4 h-4" />
                            <span>Add Stock</span>
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Today's Purchases"
                        value={`+${stats.today_purchases}`}
                        subtitle="Items added to stock"
                        icon={TrendingUp}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Today's Sales"
                        value={`-${stats.today_sales}`}
                        subtitle="Items sold"
                        icon={ShoppingCart}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Adjustments"
                        value={stats.today_adjustments}
                        subtitle="Stock corrections"
                        icon={Settings}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="Today's Value"
                        value={formatCurrency(stats.today_value)}
                        subtitle="Total transaction amount"
                        icon={Archive}
                        color="bg-purple-500"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="w-4 h-4" />
                                <span>Clear All</span>
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select
                            value={filters.type || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Movement Types</option>
                            <option value="purchase">Purchase (Stock In)</option>
                            <option value="sale">Sale (Stock Out)</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="damage">Damage/Loss</option>
                            <option value="return">Return</option>
                        </select>
                        <select
                            value={filters.item_type || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, item_type: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Item Types</option>
                            <option value="glasses">Frames</option>
                            <option value="lens_types">Lens Types</option>
                            <option value="complete_glasses">Complete Glasses</option>
                        </select>
                        <input
                            type="date"
                            value={filters.date_from || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="From Date"
                        />
                        <input
                            type="date"
                            value={filters.date_to || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="To Date"
                        />
                        <Button variant="primary" onClick={handleFilter}>
                            <Filter className="w-4 h-4" />
                            <span>Apply</span>
                        </Button>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 mt-3 text-sm">
                            <span className="text-gray-600">Active:</span>
                            {filters.type && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {filters.type}
                                </span>
                            )}
                            {filters.item_type && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    {getItemTypeLabel(filters.item_type).label}
                                </span>
                            )}
                            {filters.date_from && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    From: {filters.date_from}
                                </span>
                            )}
                            {filters.date_to && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    To: {filters.date_to}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movement</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Change</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {movements.data.map((movement: StockMovement) => {
                                    const movementConfig = getMovementConfig(movement.movement_type);
                                    const itemType = getItemTypeLabel(movement.item_type);
                                    const MovementIcon = movementConfig.icon;
                                    const ItemIcon = itemType.icon;

                                    return (
                                        <tr key={movement.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">
                                                            {movement.item_brand}
                                                        </p>
                                                        <p className="text-gray-700">{movement.item_model}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">SKU: {movement.item_sku}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <ItemIcon className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">{itemType.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded ${movementConfig.color}`}>
                                                        <MovementIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {movementConfig.label}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {movementConfig.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-lg font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <span className="font-medium">{movement.previous_stock}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="font-medium">{movement.new_stock}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatCurrency(movement.unit_price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-base font-bold text-gray-900">
                                                    {formatCurrency(movement.total_amount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {formatDate(movement.created_at)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        By: {movement.user.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
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
                                                        <span className="text-xs text-gray-400 italic">Locked</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {movements.data.length === 0 && (
                        <div className="text-center py-12">
                            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
                            <p className="text-gray-500">
                                {hasActiveFilters
                                    ? 'Try adjusting your filters'
                                    : 'Start by adding stock to see movements here'}
                            </p>
                        </div>
                    )}
                </div>

                {movements.links && movements.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing page {movements.current_page} of {movements.last_page}
                            <span className="ml-1">({movements.total} total movements)</span>
                        </p>
                        <div className="flex gap-1">
                            {movements.links.map((link: any, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    preserveState
                                    preserveScroll
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

            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false })}>
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Stock Movement?</h3>
                    <p className="text-gray-600 mb-6">
                        This action will:
                        <br />• Revert stock quantity changes
                        <br />• Refund amount to vendor balance
                        <br />• Cannot be undone
                    </p>
                    {deleteModal.movement && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
                            <div className="space-y-2">
                                <p><strong>Product:</strong> {deleteModal.movement.item_brand} {deleteModal.movement.item_model}</p>
                                <p><strong>SKU:</strong> {deleteModal.movement.item_sku}</p>
                                <p><strong>Quantity:</strong> {deleteModal.movement.quantity}</p>
                                <p><strong>Amount:</strong> {formatCurrency(deleteModal.movement.total_amount)}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
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
                            {processing ? 'Deleting...' : 'Delete Movement'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
