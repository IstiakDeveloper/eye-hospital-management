import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
    phone: string;
}

interface CreateProps {
    vendors: Vendor[];
    errors?: Record<string, string>;
}

const Create: React.FC<CreateProps> = ({ vendors, errors: serverErrors = {} }) => {
    const [formData, setFormData] = useState({
        vendor_id: '',
        name: '',
        description: '',
        total_amount: '',
        paid_amount: '0',
        purchase_date: new Date().toISOString().split('T')[0],
    });

    const [errors, setErrors] = useState<Record<string, string>>(serverErrors);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        router.post(route('hospital-account.fixed-assets.store'), formData, {
            onError: (err) => {
                setErrors(err as Record<string, string>);
            },
        });
    };

    const dueAmount = parseFloat(formData.total_amount || '0') - parseFloat(formData.paid_amount || '0');

    return (
        <HospitalAccountLayout title="Add Fixed Asset">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6">
                    <Link
                        href={route('hospital-account.fixed-assets.index')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fixed Assets
                    </Link>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-md">
                    <h1 className="mb-6 text-2xl font-bold text-gray-900">Add New Fixed Asset</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Vendor <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="vendor_id"
                                value={formData.vendor_id}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.vendor_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select a vendor</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} {vendor.company_name && `(${vendor.company_name})`} - {vendor.phone}
                                    </option>
                                ))}
                            </select>
                            {errors.vendor_id && <p className="mt-1 text-sm text-red-600">{errors.vendor_id}</p>}
                            <p className="mt-1 text-sm text-gray-500">
                                Select the vendor from whom this asset is purchased.
                                <Link href={route('hospital-account.fixed-asset-vendors.create')} className="ml-1 text-blue-600 hover:text-blue-800">
                                    Add new vendor
                                </Link>
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Asset Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Dell Laptop, Office Furniture..."
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Detailed description of the asset..."
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Total Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-3 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="total_amount"
                                        value={formData.total_amount}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className={`w-full rounded-lg border py-2 pr-4 pl-8 focus:ring-2 focus:ring-blue-500 ${
                                            errors.total_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Initial Payment <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-3 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="paid_amount"
                                        value={formData.paid_amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        max={formData.total_amount}
                                        className={`w-full rounded-lg border py-2 pr-4 pl-8 focus:ring-2 focus:ring-blue-500 ${
                                            errors.paid_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.paid_amount && <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Purchase Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.purchase_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.purchase_date && <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>}
                        </div>

                        {/* Summary Card */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-blue-900">Payment Summary</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Total Amount:</span>
                                    <span className="font-semibold text-blue-900">৳{parseFloat(formData.total_amount || '0').toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Initial Payment:</span>
                                    <span className="font-semibold text-green-600">৳{parseFloat(formData.paid_amount || '0').toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-2">
                                    <span className="font-medium text-blue-700">Due Amount:</span>
                                    <span className="font-bold text-red-600">৳{dueAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Create Fixed Asset
                            </button>
                            <Link
                                href={route('hospital-account.fixed-assets.index')}
                                className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalAccountLayout>
    );
};

export default Create;
