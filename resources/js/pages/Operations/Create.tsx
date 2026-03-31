import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, DollarSign, FileText, Save, Scissors } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';

interface Props {
    // No props needed for create page
}

export default function CreateOperation(props: Props) {
    const [formData, setFormData] = useState({
        operation_name: '',
        operation_type: '',
        base_price: '',
        description: '',
        is_active: true,
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
        'Other',
    ];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/operations', formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                                <Scissors className="h-8 w-8 text-purple-600" />
                                Add New Operation
                            </h1>
                            <p className="mt-1 text-gray-600">Create a new operation type</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit('/operations')}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
                        {/* Operation Name */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Scissors className="h-4 w-4" />
                                Operation Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="operation_name"
                                value={formData.operation_name}
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500 ${
                                    errors.operation_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Phacoemulsification with IOL"
                                required
                            />
                            {errors.operation_name && <p className="mt-1 text-sm text-red-600">{errors.operation_name}</p>}
                        </div>

                        {/* Operation Type */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4" />
                                Operation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="operation_type"
                                value={formData.operation_type}
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500 ${
                                    errors.operation_type ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select Type</option>
                                {operationTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            {errors.operation_type && <p className="mt-1 text-sm text-red-600">{errors.operation_type}</p>}
                        </div>

                        {/* Base Price */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <DollarSign className="h-4 w-4" />
                                Base Price (৳) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="base_price"
                                value={formData.base_price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-purple-500 ${
                                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter base price"
                                required
                            />
                            {errors.base_price && <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>}
                            <p className="mt-1 text-sm text-gray-500">The default price for this operation. Can be adjusted per booking.</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-purple-500"
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
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                                <label className="text-sm font-medium text-gray-700">Active</label>
                                <p className="text-sm text-gray-500">
                                    Enable this operation for booking. Inactive operations won't appear in the booking form.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 border-t pt-4">
                            <button
                                type="button"
                                onClick={() => router.visit('/operations')}
                                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? 'Creating...' : 'Create Operation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
