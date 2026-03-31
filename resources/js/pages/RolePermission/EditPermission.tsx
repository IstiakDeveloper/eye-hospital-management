import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Permission {
    id: number;
    name: string;
    display_name: string;
    category: string;
    description: string | null;
}

interface Props extends PageProps {
    permission: Permission;
    categories: string[];
}

export default function EditPermission({ permission, categories }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        display_name: permission.display_name,
        category: permission.category,
        description: permission.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('permissions.update', permission.id));
    };

    return (
        <AdminLayout title={`Edit Permission: ${permission.display_name}`}>
            <Head title={`Edit Permission - ${permission.display_name}`} />

            <div className="p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Permission: {permission.display_name}</h1>
                        <p className="mt-1 text-gray-600">Update permission details</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h3 className="mb-6 text-xl font-semibold text-gray-900">Permission Details</h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                        Permission Name (System) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="mt-2 text-sm text-red-600">{errors.name}</div>}
                                    <p className="mt-1 text-xs text-gray-500">Use dot notation (e.g., module.action)</p>
                                </div>

                                <div>
                                    <label htmlFor="display_name" className="mb-2 block text-sm font-medium text-gray-700">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="display_name"
                                        type="text"
                                        name="display_name"
                                        value={data.display_name}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        required
                                    />
                                    {errors.display_name && <div className="mt-2 text-sm text-red-600">{errors.display_name}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <div className="mt-2 text-sm text-red-600">{errors.category}</div>}
                                    <p className="mt-1 text-xs text-gray-500">Or enter a new category name below</p>
                                    <input
                                        type="text"
                                        className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('category', e.target.value)}
                                        placeholder="Or type new category name..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Optional description..."
                                    />
                                    {errors.description && <div className="mt-2 text-sm text-red-600">{errors.description}</div>}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-4">
                                <Link
                                    href={route('roles.index')}
                                    className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update Permission'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
