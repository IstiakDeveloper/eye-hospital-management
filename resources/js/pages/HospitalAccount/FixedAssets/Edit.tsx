import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';

interface FixedAsset {
    id: number;
    asset_number: string;
    name: string;
    description: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    status: string;
}

interface EditProps {
    fixedAsset: FixedAsset;
}

const Edit: React.FC<EditProps> = ({ fixedAsset }) => {
    const [formData, setFormData] = useState({
        name: fixedAsset.name,
        description: fixedAsset.description || '',
        status: fixedAsset.status,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(route('hospital-account.fixed-assets.update', fixedAsset.id), formData, {
            onError: (err) => setErrors(err as Record<string, string>),
        });
    };

    return (
        <HospitalAccountLayout title="Edit Fixed Asset">
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
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Edit Fixed Asset</h1>
                        <p className="mt-1 text-sm text-gray-600">Asset Number: {fixedAsset.asset_number}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="fully_paid">Fully Paid</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                            <p className="mb-2 font-medium text-gray-700">Financial totals (all purchases)</p>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-gray-500">Total</p>
                                    <p className="font-semibold">৳{fixedAsset.total_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Paid</p>
                                    <p className="font-semibold text-green-600">৳{fixedAsset.paid_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Due</p>
                                    <p className="font-semibold text-red-600">৳{fixedAsset.due_amount.toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Add purchases or pay vendor from the asset detail page.</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Update
                            </button>
                            <Link
                                href={route('hospital-account.fixed-assets.show', fixedAsset.id)}
                                className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
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
