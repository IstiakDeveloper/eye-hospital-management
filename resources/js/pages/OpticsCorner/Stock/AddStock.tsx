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

export default function AddStock({ frames, lensTypes, completeGlasses }: {
    frames: Item[];
    lensTypes: Item[];
    completeGlasses: Item[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        item_type: 'glasses',
        item_id: '',
        quantity: 1,
        unit_price: '',
        notes: '',
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
        post('/optics/stock');
    };

    const selectedItem = getItemOptions().find(item => item.id.toString() === data.item_id);

    return (
        <AdminLayout>
            <Head title="Add Stock" />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/optics/stock">
                        <Button variant="secondary">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Stock</h1>
                        <p className="text-gray-600">Add new inventory to your stock</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
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

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            rows={3}
                            value={data.notes}
                            onChange={(e: any) => setData('notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Additional notes about this stock addition..."
                        />
                    </div>

                    {/* Summary */}
                    {data.quantity && data.unit_price && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Quantity:</span>
                                    <span className="font-medium">{data.quantity} pcs</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Unit Price:</span>
                                    <span className="font-medium">৳{parseFloat(data.unit_price).toLocaleString()}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Total Cost:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        ৳{(parseFloat(data.unit_price) * parseInt(data.quantity)).toLocaleString()}
                                    </span>
                                </div>
                                {selectedItem && (
                                    <div className="flex justify-between items-center text-sm pt-2 border-t">
                                        <span className="text-gray-600">New Stock Level:</span>
                                        <span className="font-medium text-green-600">
                                            {selectedItem.stock_quantity + parseInt(data.quantity)} pcs
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end space-x-4">
                        <Link href="/optics/stock">
                            <Button variant="secondary" type="button">Cancel</Button>
                        </Link>
                        <Button onClick={handleSubmit} disabled={processing || !data.item_id || !data.unit_price}>
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Adding...' : 'Add Stock'}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
