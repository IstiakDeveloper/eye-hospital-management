import { useState, FormEvent, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Save, Scissors, DollarSign, FileText } from 'lucide-react';

interface Operation {
    id: number;
    operation_name: string;
    operation_type: string;
    base_price: number;
    description?: string;
    is_active: boolean;
}

interface Props {
    operation: Operation;
}

export default function EditOperation({ operation }: Props) {
    const [formData, setFormData] = useState({
        operation_name: operation.operation_name,
        operation_type: operation.operation_type,
        base_price: operation.base_price.toString(),
        description: operation.description || '',
        is_active: operation.is_active
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const operationTypes = [
        'Cataract Surgery',
        'Glaucoma Surgery',
        'Retinal Surgery',
        'Corneal Surgery',
        'LASIK',
        'Pterygium Surgery',
        'Squint Surgery',
        'Oculoplastic Surgery',
        'Other'
    ];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(`/operations/${operation.id}`, formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Scissors className="w-8 h-8 text-purple-600" />
                                Edit Operation
                            </h1>
                            <p className="text-gray-600 mt-1">Update operation details</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(`/operations/${operation.id}`)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        {/* Operation Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Scissors className="w-4 h-4" />
                                Operation Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="operation_name"
                                value={formData.operation_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.operation_name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., Phacoemulsification with IOL"
                                required
                            />
                            {errors.operation_name && <p className="text-sm text-red-600 mt-1">{errors.operation_name}</p>}
                        </div>

                        {/* Operation Type */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Operation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="operation_type"
                                value={formData.operation_type}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.operation_type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="">Select Type</option>
                                {operationTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.operation_type && <p className="text-sm text-red-600 mt-1">{errors.operation_type}</p>}
                        </div>

                        {/* Base Price */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Base Price (৳) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="base_price"
                                value={formData.base_price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.base_price ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter base price"
                                required
                            />
                            {errors.base_price && <p className="text-sm text-red-600 mt-1">{errors.base_price}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                The default price for this operation. Can be adjusted per booking.
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Description (Optional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                                placeholder="Brief description about this operation, requirements, precautions, etc."
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Active
                                </label>
                                <p className="text-sm text-gray-500">
                                    Enable this operation for booking. Inactive operations won't appear in the booking form.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => router.visit(`/operations/${operation.id}`)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
