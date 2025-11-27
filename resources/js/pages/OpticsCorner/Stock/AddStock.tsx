import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save, AlertCircle, Search, X } from 'lucide-react';

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
    default_vendor_id?: number;
    purchase_price?: number; // ✅ Added for previous price display
}

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface PageProps {
    frames: Item[];
    lensTypes: Item[];
    completeGlasses: Item[];
    vendors: Vendor[];
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
            }`}
            {...props}
        >
            {children}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

// ✅ Searchable Select Component
const SearchableSelect = ({ label, error, items, value, onChange, getItemLabel, placeholder = "Search...", className = '' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedItem = items.find((item: any) => item.id.toString() === value);

    // Filter items based on search
    const filteredItems = items.filter((item: any) => {
        const label = getItemLabel(item).toLowerCase();
        const search = searchTerm.toLowerCase();
        return label.includes(search) ||
               (item.sku && item.sku.toLowerCase().includes(search)) ||
               (item.brand && item.brand.toLowerCase().includes(search)) ||
               (item.model && item.model.toLowerCase().includes(search));
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: any) => {
        onChange(item.id.toString());
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className={className} ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

            <div className="relative">
                {/* Selected Display / Search Input */}
                <div
                    className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
                        error ? 'border-red-300' : 'border-gray-300'
                    } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={selectedItem ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedItem ? getItemLabel(selectedItem) : 'Choose an item...'}
                    </span>
                    <div className="flex items-center space-x-2">
                        {selectedItem && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <Search className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b sticky top-0 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={placeholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="overflow-y-auto max-h-64">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
                                            item.id.toString() === value ? 'bg-blue-100' : ''
                                        }`}
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{getItemLabel(item)}</p>
                                                {item.sku && (
                                                    <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm text-gray-600">Stock: {item.stock_quantity}</p>
                                                {item.purchase_price && (
                                                    <p className="text-xs text-amber-600">৳{parseFloat(item.purchase_price.toString()).toFixed(2)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    <p>No items found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default function AddStock() {
    const { frames, lensTypes, completeGlasses, vendors } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        item_type: 'glasses',
        item_id: '',
        quantity: 1,
        total_price: '', // ✅ Changed from unit_price to total_price
        notes: '',
        // ✅ Vendor fields
        vendor_id: '',
        paid_amount: '',
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
        if (item.brand && item.model) {
            return `${item.brand} ${item.model}`;
        }
        return item.full_name || item.name || `Item #${item.id}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/optics/stock');
    };

    const selectedItem = getItemOptions().find(item => item.id.toString() === data.item_id);

    // ✅ Calculate unit price from total price
    const unitPrice = data.total_price && data.quantity > 0
        ? Number(data.total_price) / Number(data.quantity)
        : 0;

    // Calculate totals
    const totalCost = Number(data.total_price || 0);
    const paidAmount = Number(data.paid_amount || 0);
    const dueAmount = totalCost - paidAmount;

    // Check if vendor purchase is available
    const isVendorPurchaseAvailable = data.item_type === 'glasses';

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

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        {/* Item Selection Section */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Item Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="Item Type *"
                                    value={data.item_type}
                                    onChange={(e: any) => {
                                        setData('item_type', e.target.value);
                                        setData('item_id', '');
                                        setData('vendor_id', ''); // Reset vendor
                                        setData('paid_amount', ''); // Reset payment
                                    }}
                                    error={errors.item_type}
                                    required
                                >
                                    <option value="glasses">Frames</option>
                                    <option value="lens_types">Lens Types</option>
                                    <option value="complete_glasses">Complete Glasses</option>
                                </Select>

                                {/* ✅ Searchable Select for Items */}
                                <SearchableSelect
                                    label="Select Item *"
                                    items={getItemOptions()}
                                    value={data.item_id}
                                    onChange={(value: string) => {
                                        setData('item_id', value);
                                        // Auto-fill vendor if item has default vendor
                                        const item = getItemOptions().find(i => i.id.toString() === value);
                                        if (item?.default_vendor_id && data.item_type === 'glasses') {
                                            setData('vendor_id', item.default_vendor_id.toString());
                                        }
                                    }}
                                    getItemLabel={getItemName}
                                    placeholder="Search by name, brand, model, or SKU..."
                                    error={errors.item_id}
                                />

                                <Input
                                    label="Quantity *"
                                    type="number"
                                    min="1"
                                    value={data.quantity}
                                    onChange={(e: any) => setData('quantity', e.target.value)}
                                    error={errors.quantity}
                                    placeholder="Enter quantity"
                                    required
                                />

                                <Input
                                    label="Total Price * (for all items)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.total_price}
                                    onChange={(e: any) => setData('total_price', e.target.value)}
                                    error={errors.total_price}
                                    placeholder="0.00"
                                    required
                                />

                                {/* ✅ Show calculated unit price */}
                                {data.total_price && data.quantity > 0 && (
                                    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="text-sm">
                                            <span className="text-blue-700 font-medium">Unit Price: </span>
                                            <span className="text-blue-900 font-bold">
                                                ৳{unitPrice.toFixed(2)}
                                            </span>
                                            <span className="text-blue-600 text-xs ml-2">
                                                (Total ÷ Quantity)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ Previous Price & Item Details */}
                        {selectedItem && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Selected Item Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="text-blue-700 font-medium block mb-1">Name:</span>
                                        <p className="text-blue-900 font-semibold">{getItemName(selectedItem)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-100">
                                        <span className="text-blue-700 font-medium block mb-1">Current Stock:</span>
                                        <p className="text-blue-900 font-semibold">{selectedItem.stock_quantity} pcs</p>
                                    </div>
                                    {selectedItem.sku && (
                                        <div className="bg-white p-3 rounded border border-blue-100">
                                            <span className="text-blue-700 font-medium block mb-1">SKU:</span>
                                            <p className="text-blue-900 font-semibold">{selectedItem.sku}</p>
                                        </div>
                                    )}
                                    {selectedItem.purchase_price && (
                                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                                            <span className="text-amber-700 font-medium block mb-1">Previous Unit Price:</span>
                                            <p className="text-amber-900 font-bold text-lg">
                                                ৳{parseFloat(selectedItem.purchase_price.toString()).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ✅ Show average price calculation preview for glasses */}
                                {data.item_type === 'glasses' && data.total_price && data.quantity > 0 && selectedItem.purchase_price && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                                        <p className="text-sm text-green-800 font-medium mb-2">
                                            📊 New Average Purchase Price Calculation:
                                        </p>
                                        <div className="text-xs text-green-700 space-y-1">
                                            <p>
                                                Old: {selectedItem.stock_quantity} pcs × ৳{parseFloat(selectedItem.purchase_price.toString()).toFixed(2)}
                                                = ৳{(selectedItem.stock_quantity * parseFloat(selectedItem.purchase_price.toString())).toFixed(2)}
                                            </p>
                                            <p>
                                                New: {data.quantity} pcs × ৳{unitPrice.toFixed(2)}
                                                = ৳{(Number(data.quantity) * unitPrice).toFixed(2)}
                                            </p>
                                            <hr className="border-green-300" />
                                            <p className="font-bold text-green-900">
                                                Average: ৳{(
                                                    ((selectedItem.stock_quantity * parseFloat(selectedItem.purchase_price.toString())) +
                                                    (Number(data.quantity) * unitPrice)) /
                                                    (selectedItem.stock_quantity + Number(data.quantity))
                                                ).toFixed(2)} per unit
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ✅ Vendor & Payment Section (Only for Glasses) */}
                        {isVendorPurchaseAvailable && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                    Vendor & Payment (Optional)
                                </h2>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-medium mb-1">Purchase Options:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li><strong>With Vendor:</strong> Select vendor for credit purchase (due tracking)</li>
                                                <li><strong>Cash Purchase:</strong> Leave vendor empty for immediate payment</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Vendor (Optional - For Glasses Only)"
                                        value={data.vendor_id}
                                        onChange={(e: any) => setData('vendor_id', e.target.value)}
                                        error={errors.vendor_id}
                                    >
                                        <option value="">Cash Purchase (No Vendor)</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                                {vendor.company_name && ` (${vendor.company_name})`}
                                            </option>
                                        ))}
                                    </Select>

                                    {data.vendor_id && (
                                        <Input
                                            label="Paid Amount (Optional)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={totalCost}
                                            value={data.paid_amount}
                                            onChange={(e: any) => setData('paid_amount', e.target.value)}
                                            error={errors.paid_amount}
                                            placeholder="Enter paid amount"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows={3}
                                value={data.notes}
                                onChange={(e: any) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional notes about this stock addition..."
                            />
                        </div>

                        {/* ✅ Enhanced Summary */}
                        {data.quantity && data.total_price && (
                            <div className="mb-6">
                                {/* Cost Summary */}
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Quantity:</span>
                                            <span className="font-medium">{data.quantity} pcs</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Unit Price:</span>
                                            <span className="font-medium">৳{unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700">Total Cost:</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                ৳{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </span>
                                        </div>
                                        {selectedItem && (
                                            <div className="flex justify-between items-center text-sm pt-2 border-t">
                                                <span className="text-gray-600">New Stock Level:</span>
                                                <span className="font-medium text-green-600">
                                                    {selectedItem.stock_quantity + Number(data.quantity)} pcs
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ✅ Payment Summary (for vendor purchase) */}
                                {data.vendor_id && (
                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <h3 className="text-sm font-semibold text-orange-900 mb-3">Vendor Payment Summary</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-orange-700">Total Cost:</span>
                                                <span className="font-semibold text-orange-900">
                                                    ৳{totalCost.toFixed(2)}
                                                </span>
                                            </div>
                                            {paidAmount > 0 && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-orange-700">Paid Now:</span>
                                                        <span className="font-semibold text-green-600">
                                                            ৳{paidAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t border-orange-300">
                                                        <span className="text-orange-900 font-medium">Due to Vendor:</span>
                                                        <span className="font-bold text-red-600">
                                                            ৳{dueAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {!paidAmount && (
                                                <div className="flex justify-between pt-2 border-t border-orange-300">
                                                    <span className="text-orange-900 font-medium">Full Amount Due:</span>
                                                    <span className="font-bold text-red-600">
                                                        ৳{totalCost.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ Cash Purchase Summary */}
                                {!data.vendor_id && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h3 className="text-sm font-semibold text-green-900 mb-2">Cash Purchase</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-green-700">Amount to be paid:</span>
                                            <span className="text-lg font-bold text-green-700">
                                                ৳{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-600 mt-2">
                                            Will be deducted from Hospital Account immediately
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <Link href="/optics/stock">
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing || !data.item_id || !data.total_price}
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Adding...' : 'Add Stock'}</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
