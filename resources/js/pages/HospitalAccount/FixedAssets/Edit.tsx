import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { ArrowLeft, Save } from 'lucide-react';

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    description: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    purchase_date: string;
    status: string;
}

interface EditProps {
    fixedAsset: FixedAsset;
}

const Edit: React.FC<EditProps> = ({ fixedAsset }) => {
    const [formData, setFormData] = useState({
        name: fixedAsset.name,
        description: fixedAsset.description || '',
        total_amount: fixedAsset.total_amount.toString(),
        purchase_date: fixedAsset.purchase_date,
        status: fixedAsset.status
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        router.put(route('hospital-account.fixed-assets.update', fixedAsset.id), formData, {
            onError: (err) => {
                setErrors(err as Record<string, string>);
            }
        });
    };

    const newDueAmount = parseFloat(formData.total_amount || '0') - fixedAsset.paid_amount;

    return (
        <HospitalAccountLayout title="Edit Fixed Asset">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link
                        href={route('hospital-account.fixed-assets.index')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Fixed Assets
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Edit Fixed Asset</h1>
                        <p className="text-sm text-gray-600 mt-1">Asset Number: {fixedAsset.asset_number}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Asset Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="total_amount"
                                        value={formData.total_amount}
                                        onChange={handleInputChange}
                                        required
                                        min={fixedAsset.paid_amount}
                                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                            errors.total_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimum: ৳{fixedAsset.paid_amount.toLocaleString()} (already paid)
                                </p>
                                {errors.total_amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Paid Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">৳</span>
                                    <input
                                        type="text"
                                        value={fixedAsset.paid_amount.toLocaleString()}
                                        disabled
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Cannot be edited directly. Use payment function.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purchase Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        errors.purchase_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.purchase_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        errors.status ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="active">Active</option>
                                    <option value="fully_paid">Fully Paid</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Updated Summary</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Total Amount:</span>
                                    <span className="font-semibold text-blue-900">
                                        ৳{parseFloat(formData.total_amount || '0').toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Paid Amount:</span>
                                    <span className="font-semibold text-green-600">
                                        ৳{fixedAsset.paid_amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-blue-200">
                                    <span className="text-blue-700 font-medium">Due Amount:</span>
                                    <span className="font-bold text-red-600">
                                        ৳{newDueAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Update Fixed Asset
                            </button>
                            <Link
                                href={route('hospital-account.fixed-assets.index')}
                                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-200 border border-transparent rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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

export default Edit;
