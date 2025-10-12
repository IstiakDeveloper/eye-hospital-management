import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface PageProps {
    vendors: Vendor[];
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
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

export default function FrameCreate() {
    const { vendors } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        brand: '',
        model: '',
        type: 'frame',
        frame_type: 'full_rim',
        material: 'plastic',
        color: '',
        gender: 'men',
        size: '',
        lens_width: '',
        bridge_width: '',
        temple_length: '',
        shape: '',
        purchase_price: '',
        selling_price: '',
        stock_quantity: 0,
        minimum_stock_level: 5,
        description: '',
        // ✅ Vendor fields
        default_vendor_id: '',
        paid_amount: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/optics/frames');
    };

    // Calculate totals
    const totalCost = Number(data.purchase_price || 0) * Number(data.stock_quantity || 0);
    const paidAmount = Number(data.paid_amount || 0);
    const dueAmount = totalCost - paidAmount;

    return (
        <AdminLayout>
            <Head title="Add Frame" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Link href="/optics/frames">
                        <Button variant="secondary">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Frame</h1>
                        <p className="text-gray-600">Add a new frame to inventory</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm border p-8">
                        {/* Basic Information Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Brand *"
                                    value={data.brand}
                                    onChange={(e: any) => setData('brand', e.target.value)}
                                    error={errors.brand}
                                    placeholder="e.g., Ray-Ban, Oakley"
                                    required
                                />

                                <Input
                                    label="Model *"
                                    value={data.model}
                                    onChange={(e: any) => setData('model', e.target.value)}
                                    error={errors.model}
                                    placeholder="e.g., Aviator, Wayfarer"
                                    required
                                />

                                <Select
                                    label="Type *"
                                    value={data.type}
                                    onChange={(e: any) => setData('type', e.target.value)}
                                    error={errors.type}
                                    required
                                >
                                    <option value="frame">Frame</option>
                                    <option value="sunglasses">Sunglasses</option>
                                    <option value="reading_glasses">Reading Glasses</option>
                                    <option value="progressive">Progressive</option>
                                    <option value="bifocal">Bifocal</option>
                                </Select>

                                <Select
                                    label="Frame Type *"
                                    value={data.frame_type}
                                    onChange={(e: any) => setData('frame_type', e.target.value)}
                                    error={errors.frame_type}
                                    required
                                >
                                    <option value="full_rim">Full Rim</option>
                                    <option value="half_rim">Half Rim</option>
                                    <option value="rimless">Rimless</option>
                                </Select>

                                <Select
                                    label="Material *"
                                    value={data.material}
                                    onChange={(e: any) => setData('material', e.target.value)}
                                    error={errors.material}
                                    required
                                >
                                    <option value="plastic">Plastic</option>
                                    <option value="metal">Metal</option>
                                    <option value="titanium">Titanium</option>
                                    <option value="acetate">Acetate</option>
                                    <option value="wood">Wood</option>
                                </Select>

                                <Input
                                    label="Color"
                                    value={data.color}
                                    onChange={(e: any) => setData('color', e.target.value)}
                                    error={errors.color}
                                    placeholder="e.g., Black, Brown, Blue"
                                />

                                <Select
                                    label="Gender *"
                                    value={data.gender}
                                    onChange={(e: any) => setData('gender', e.target.value)}
                                    error={errors.gender}
                                    required
                                >
                                    <option value="men">Men</option>
                                    <option value="women">Women</option>
                                    <option value="unisex">Unisex</option>
                                    <option value="kids">Kids</option>
                                </Select>

                                <Input
                                    label="Shape"
                                    value={data.shape}
                                    onChange={(e: any) => setData('shape', e.target.value)}
                                    error={errors.shape}
                                    placeholder="e.g., Round, Square, Oval"
                                />
                            </div>
                        </div>

                        {/* Measurements Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Measurements</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Lens Width (mm)"
                                    type="number"
                                    step="0.01"
                                    value={data.lens_width}
                                    onChange={(e: any) => setData('lens_width', e.target.value)}
                                    error={errors.lens_width}
                                    placeholder="e.g., 52.00"
                                />

                                <Input
                                    label="Bridge Width (mm)"
                                    type="number"
                                    step="0.01"
                                    value={data.bridge_width}
                                    onChange={(e: any) => setData('bridge_width', e.target.value)}
                                    error={errors.bridge_width}
                                    placeholder="e.g., 18.00"
                                />

                                <Input
                                    label="Temple Length (mm)"
                                    type="number"
                                    step="0.01"
                                    value={data.temple_length}
                                    onChange={(e: any) => setData('temple_length', e.target.value)}
                                    error={errors.temple_length}
                                    placeholder="e.g., 140.00"
                                />

                                <Input
                                    label="Size"
                                    value={data.size}
                                    onChange={(e: any) => setData('size', e.target.value)}
                                    error={errors.size}
                                    placeholder="e.g., Medium, Large"
                                />
                            </div>
                        </div>

                        {/* Pricing & Stock Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Pricing & Stock</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Purchase Price *"
                                    type="number"
                                    step="0.01"
                                    value={data.purchase_price}
                                    onChange={(e: any) => setData('purchase_price', e.target.value)}
                                    error={errors.purchase_price}
                                    placeholder="0.00"
                                    required
                                />

                                <Input
                                    label="Selling Price *"
                                    type="number"
                                    step="0.01"
                                    value={data.selling_price}
                                    onChange={(e: any) => setData('selling_price', e.target.value)}
                                    error={errors.selling_price}
                                    placeholder="0.00"
                                    required
                                />

                                <Input
                                    label="Initial Stock Quantity *"
                                    type="number"
                                    value={data.stock_quantity}
                                    onChange={(e: any) => setData('stock_quantity', e.target.value)}
                                    error={errors.stock_quantity}
                                    placeholder="0"
                                    required
                                />

                                <Input
                                    label="Minimum Stock Level *"
                                    type="number"
                                    value={data.minimum_stock_level}
                                    onChange={(e: any) => setData('minimum_stock_level', e.target.value)}
                                    error={errors.minimum_stock_level}
                                    placeholder="5"
                                    required
                                />
                            </div>
                        </div>

                        {/* ✅ Vendor & Payment Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Vendor & Payment (Optional)
                            </h2>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Purchase Options:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li><strong>With Vendor:</strong> Select vendor and optionally make partial payment (remaining will be due)</li>
                                            <li><strong>Cash Purchase:</strong> Leave vendor empty for direct cash purchase</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select
                                    label="Vendor (Optional)"
                                    value={data.default_vendor_id}
                                    onChange={(e: any) => setData('default_vendor_id', e.target.value)}
                                    error={errors.default_vendor_id}
                                >
                                    <option value="">Cash Purchase (No Vendor)</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.name}
                                            {vendor.company_name && ` (${vendor.company_name})`}
                                        </option>
                                    ))}
                                </Select>

                                {data.default_vendor_id && (
                                    <Input
                                        label="Paid Amount (Optional)"
                                        type="number"
                                        step="0.01"
                                        value={data.paid_amount}
                                        onChange={(e: any) => setData('paid_amount', e.target.value)}
                                        error={errors.paid_amount}
                                        placeholder="Enter paid amount"
                                    />
                                )}
                            </div>

                            {/* ✅ Payment Summary */}
                            {data.default_vendor_id && totalCost > 0 && (
                                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Cost:</span>
                                            <span className="font-semibold text-gray-900">
                                                ৳{totalCost.toFixed(2)}
                                            </span>
                                        </div>
                                        {paidAmount > 0 && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Paid Amount:</span>
                                                    <span className="font-semibold text-green-600">
                                                        ৳{paidAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-gray-300">
                                                    <span className="text-gray-700 font-medium">Due Amount:</span>
                                                    <span className="font-bold text-red-600">
                                                        ৳{dueAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        {!paidAmount && (
                                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                                <span className="text-gray-700 font-medium">Due Amount:</span>
                                                <span className="font-bold text-red-600">
                                                    ৳{totalCost.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!data.default_vendor_id && totalCost > 0 && (
                                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-700 font-medium">Cash Purchase Total:</span>
                                        <span className="text-lg font-bold text-green-700">
                                            ৳{totalCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        This amount will be deducted from Optics Account
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                rows={3}
                                value={data.description}
                                onChange={(e: any) => setData('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional notes about this frame..."
                            />
                            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <Link href="/optics/frames">
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving...' : 'Add Frame'}</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
