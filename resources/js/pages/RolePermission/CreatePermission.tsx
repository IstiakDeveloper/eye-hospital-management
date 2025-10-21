import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';

interface Props extends PageProps {
    categories: string[];
}

export default function CreatePermission({  categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        display_name: '',
        category: categories[0] || '',
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('permissions.store'));
    };

    return (
        <AdminLayout title="Create New Permission">
            <Head title="Create Permission" />

            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Permission</h1>
                        <p className="text-gray-600 mt-1">Add a new permission to the system</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Permission Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Permission Name (System) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., users.create, appointments.view"
                                        required
                                    />
                                    {errors.name && <div className="text-sm text-red-600 mt-2">{errors.name}</div>}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use dot notation (e.g., module.action)
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="display_name"
                                        type="text"
                                        name="display_name"
                                        value={data.display_name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="e.g., Create Users, View Appointments"
                                        required
                                    />
                                    {errors.display_name && <div className="text-sm text-red-600 mt-2">{errors.display_name}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <div className="text-sm text-red-600 mt-2">{errors.category}</div>}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Or enter a new category name below
                                    </p>
                                    <input
                                        type="text"
                                        className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('category', e.target.value)}
                                        placeholder="Or type new category name..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Optional description of what this permission allows..."
                                    />
                                    {errors.description && <div className="text-sm text-red-600 mt-2">{errors.description}</div>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-6">
                                <Link
                                    href={route('roles.index')}
                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg"
                                >
                                    {processing ? 'Creating...' : 'Create Permission'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
