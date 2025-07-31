import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Filter, Archive } from 'lucide-react';

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

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
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

export default function StockIndex({ movements }: { movements: any }) {
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

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select defaultValue="">
                            <option value="">All Movement Types</option>
                            <option value="purchase">Purchase</option>
                            <option value="sale">Sale</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="damage">Damage</option>
                        </Select>
                        <Select defaultValue="">
                            <option value="">All Item Types</option>
                            <option value="glasses">Frames</option>
                            <option value="lens_types">Lens Types</option>
                            <option value="complete_glasses">Complete Glasses</option>
                        </Select>
                        <Button variant="secondary">
                            <Filter className="w-4 h-4" />
                            <span>Apply Filters</span>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Change</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {movements.data.map((movement: StockMovement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{movement.item_name}</p>
                                                <p className="text-sm text-gray-500 capitalize">{movement.item_type.replace('_', ' ')}</p>
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
                                            {formatCurrency(movement.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(movement.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {movement.user.name}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
        </AdminLayout>
    );
}
