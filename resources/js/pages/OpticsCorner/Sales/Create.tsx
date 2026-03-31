import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react';
import React from 'react';

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
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Input = ({ label, error, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>}
        <input
            className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
            }`}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const Select = ({ label, error, children, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>}
        <select
            className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
            }`}
            {...props}
        >
            {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

export default function SalesCreate({ frames, lensTypes, completeGlasses }: { frames: Item[]; lensTypes: Item[]; completeGlasses: Item[] }) {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        items: [{ type: 'frame', id: '', quantity: 1, price: 0 }],
        discount: 0,
        notes: '',
    });

    const addItem = () => {
        setData('items', [...data.items, { type: 'frame', id: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-set price when item is selected
        if (field === 'id' && value) {
            const selectedItem = getItemById(newItems[index].type, value);
            if (selectedItem) {
                newItems[index].price = selectedItem.selling_price || selectedItem.price || 0;
            }
        }

        setData('items', newItems);
    };

    const getItemById = (type: string, id: string) => {
        switch (type) {
            case 'frame':
                return frames.find((f: any) => f.id == id);
            case 'lens':
                return lensTypes.find((l: any) => l.id == id);
            case 'complete_glasses':
                return completeGlasses.find((c: any) => c.id == id);
            default:
                return null;
        }
    };

    const getItemOptions = (type: string) => {
        switch (type) {
            case 'frame':
                return frames;
            case 'lens':
                return lensTypes;
            case 'complete_glasses':
                return completeGlasses;
            default:
                return [];
        }
    };

    const calculateSubtotal = () => {
        return data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() - (data.discount || 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/optics/sales');
    };

    return (
        <AdminLayout>
            <Head title="New Sale" />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link href="/optics/sales">
                        <Button variant="secondary">
                            <ChevronLeft className="h-4 w-4" />
                            <span>Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
                        <p className="text-gray-600">Record a new sale transaction</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    {/* Customer Info */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Input
                            label="Customer Name *"
                            value={data.customer_name}
                            onChange={(e: any) => setData('customer_name', e.target.value)}
                            error={errors.customer_name}
                            placeholder="Enter customer name"
                        />
                        <Input
                            label="Customer Phone"
                            value={data.customer_phone}
                            onChange={(e: any) => setData('customer_phone', e.target.value)}
                            error={errors.customer_phone}
                            placeholder="Enter phone number"
                        />
                    </div>

                    {/* Items Section */}
                    <div className="mb-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                            <Button type="button" onClick={addItem} variant="secondary">
                                <Plus className="h-4 w-4" />
                                <span>Add Item</span>
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.items.map((item, index) => (
                                <div key={index} className="rounded-lg border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                                        <Select label="Type" value={item.type} onChange={(e: any) => updateItem(index, 'type', e.target.value)}>
                                            <option value="frame">Frame</option>
                                            <option value="lens">Lens</option>
                                            <option value="complete_glasses">Complete Glasses</option>
                                        </Select>

                                        <div className="md:col-span-2">
                                            <Select label="Item" value={item.id} onChange={(e: any) => updateItem(index, 'id', e.target.value)}>
                                                <option value="">Select Item</option>
                                                {getItemOptions(item.type).map((option: any) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.full_name || option.name} (Stock: {option.stock_quantity})
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>

                                        <Input
                                            label="Quantity"
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e: any) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        />

                                        <Input
                                            label="Price"
                                            type="number"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e: any) => updateItem(index, 'price', parseFloat(e.target.value))}
                                        />

                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="danger"
                                                onClick={() => removeItem(index)}
                                                disabled={data.items.length === 1}
                                                className="w-full justify-center"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {item.id && item.quantity && item.price && (
                                        <div className="mt-3 text-right">
                                            <span className="text-sm text-gray-600">Item Total: </span>
                                            <span className="font-semibold text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="mb-8 rounded-lg bg-gray-50 p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Input
                                label="Discount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.discount}
                                onChange={(e: any) => setData('discount', parseFloat(e.target.value) || 0)}
                                error={errors.discount}
                                placeholder="0.00"
                            />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-semibold">৳{calculateSubtotal().toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span className="font-semibold text-red-600">-৳{(data.discount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3">
                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                    <span className="text-2xl font-bold text-green-600">৳{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-8">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            rows={3}
                            value={data.notes}
                            onChange={(e: any) => setData('notes', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes about this sale..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-4">
                        <Link href="/optics/sales">
                            <Button variant="secondary" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button onClick={handleSubmit} disabled={processing || calculateTotal() <= 0 || data.items.some((item) => !item.id)}>
                            <Save className="h-4 w-4" />
                            <span>{processing ? 'Processing...' : `Complete Sale - ৳${calculateTotal().toLocaleString()}`}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
