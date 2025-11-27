import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
}

interface Props extends PageProps {
    role: Role;
}

export default function EditRole({ role }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AdminLayout title={`Edit Role: ${role.display_name}`}>
            <Head title={`Edit Role - ${role.display_name}`} />

            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Role: {role.display_name}</h1>
                        <p className="text-gray-600 mt-1">Update role information and manage permissions</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Role Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Role Name (System) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && (
                                        <div className="text-sm text-red-600 mt-2">{errors.name}</div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use lowercase with underscores (e.g., super_admin)
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
                                        required
                                    />
                                    {errors.display_name && (
                                        <div className="text-sm text-red-600 mt-2">{errors.display_name}</div>
                                    )}
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
                                        placeholder="Optional description..."
                                    />
                                    {errors.description && (
                                        <div className="text-sm text-red-600 mt-2">{errors.description}</div>
                                    )}
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
                                    {processing ? 'Updating...' : 'Update Role'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 border-2 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Permissions</h3>
                                <p className="text-sm text-gray-600">
                                    Assign or modify permissions for this role to control access
                                </p>
                            </div>
                            <Link
                                href={route('roles.assign-permissions', role.id)}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-lg"
                            >
                                Assign Permissions
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
