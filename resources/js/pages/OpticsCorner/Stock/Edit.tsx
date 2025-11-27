import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save } from 'lucide-react';

interface Item {
    id: number;
    name?: string;
    brand?: string;
    model?: string;
    sku?: string;
    stock_quantity: number;
    selling_price?: number;
    price?: number;
    full_name?: string;
}

interface Movement {
    id: number;
    item_type: string;
    item_id: number;
    movement_type: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    notes?: string;
    previous_stock: number;
    new_stock: number;
    created_at: string;
    user?: {
        name: string;
    };
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

const Input = ({ label, error, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

const Select = ({ label, error, children, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <select
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        >
            {children}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

export default function EditStock({ movement, frames, lensTypes, completeGlasses }: {
    movement: Movement;
    frames: Item[];
    lensTypes: Item[];
    completeGlasses: Item[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        item_type: movement.item_type,
        item_id: movement.item_id.toString(),
        quantity: movement.quantity,
        unit_price: movement.unit_price.toString(),
        notes: movement.notes || '',
    });

    const getItemOptions = () => {
        switch (data.item_type) {
            case 'glasses':
                return frames || [];
            case 'lens_types':
                return lensTypes || [];
            case 'complete_glasses':
                return completeGlasses || [];
            default:
                return [];
        }
    };

    const getItemName = (item: Item) => {
        // For frames: show brand + model
        if (item.brand && item.model) {
            return `${item.brand} ${item.model}`;
        }
        // For lens types or others: show name or full_name
        return item.full_name || item.name || `Item #${item.id}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/optics/stock/${movement.id}`);
    };

    const selectedItem = getItemOptions().find(item => item.id.toString() === data.item_id);

    return (
        <AdminLayout>
            <Head title="Edit Stock Movement" />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/optics/stock">
                        <Button variant="secondary">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Stock Movement</h1>
                        <p className="text-gray-600">Modify stock movement details</p>
                    </div>
                </div>

                {/* Movement Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <p className="text-sm text-yellow-800">
                            <strong>Movement ID:</strong> #{movement.id} | 
                            <strong> Created:</strong> {new Date(movement.created_at).toLocaleDateString()} | 
                            <strong> By:</strong> {movement.user?.name || 'Unknown'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Item Type *"
                                value={data.item_type}
                                onChange={(e: any) => {
                                    setData('item_type', e.target.value);
                                    setData('item_id', ''); // Reset item selection
                                }}
                                error={errors.item_type}
                            >
                                <option value="glasses">Frames</option>
                                <option value="lens_types">Lens Types</option>
                                <option value="complete_glasses">Complete Glasses</option>
                            </Select>

                            <Select
                                label="Select Item *"
                                value={data.item_id}
                                onChange={(e: any) => setData('item_id', e.target.value)}
                                error={errors.item_id}
                            >
                                <option value="">Choose an item</option>
                                {getItemOptions().map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {getItemName(item)} - Stock: {item.stock_quantity}
                                        {item.sku && ` (${item.sku})`}
                                    </option>
                                ))}
                            </Select>

                            <Input
                                label="Quantity *"
                                type="number"
                                min="1"
                                value={data.quantity}
                                onChange={(e: any) => setData('quantity', e.target.value)}
                                error={errors.quantity}
                                placeholder="Enter quantity"
                            />

                            <Input
                                label="Unit Price *"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.unit_price}
                                onChange={(e: any) => setData('unit_price', e.target.value)}
                                error={errors.unit_price}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Selected Item Info */}
                        {selectedItem && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Selected Item Details:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700 font-medium">Name:</span>
                                        <p className="text-blue-900">{getItemName(selectedItem)}</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-700 font-medium">Current Stock:</span>
                                        <p className="text-blue-900">{selectedItem.stock_quantity} pcs</p>
                                    </div>
                                    {selectedItem.sku && (
                                        <div>
                                            <span className="text-blue-700 font-medium">SKU:</span>
                                            <p className="text-blue-900">{selectedItem.sku}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Original vs New Comparison */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Original Values</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Quantity:</span>
                                        <span>{movement.quantity} pcs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Unit Price:</span>
                                        <span>৳{movement.unit_price.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total:</span>
                                        <span>৳{movement.total_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-2">New Values</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Quantity:</span>
                                        <span>{data.quantity} pcs</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Unit Price:</span>
                                        <span>৳{parseFloat(data.unit_price || '0').toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total:</span>
                                        <span>৳{(parseFloat(data.unit_price || '0') * parseInt(data.quantity.toString())).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows={3}
                                value={data.notes}
                                onChange={(e: any) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional notes about this stock movement..."
                            />
                        </div>

                        {/* Amount Difference Alert */}
                        {data.quantity && data.unit_price && (
                            (() => {
                                const newTotal = parseFloat(data.unit_price) * parseInt(data.quantity.toString());
                                const difference = newTotal - movement.total_amount;
                                
                                if (difference !== 0) {
                                    return (
                                        <div className={`mt-6 p-4 rounded-lg ${difference > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${difference > 0 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                                                <p className={`text-sm font-medium ${difference > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                                                    {difference > 0 
                                                        ? `Additional expense: ৳${difference.toLocaleString()}`
                                                        : `Refund amount: ৳${Math.abs(difference).toLocaleString()}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()
                        )}

                        <div className="mt-8 flex justify-end space-x-4">
                            <Link href="/optics/stock">
                                <Button variant="secondary" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing || !data.item_id || !data.unit_price}>
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Updating...' : 'Update Movement'}</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}