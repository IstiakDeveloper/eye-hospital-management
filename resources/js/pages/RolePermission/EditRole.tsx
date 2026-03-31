import AdminLayout from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Role: {role.display_name}</h1>
                        <p className="mt-1 text-gray-600">Update role information and manage permissions</p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="mb-6 rounded-lg bg-white p-6 shadow">
                            <h3 className="mb-6 text-xl font-semibold text-gray-900">Role Information</h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                        Role Name (System) <span className="text-red-500">*</span>
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
                                    <p className="mt-1 text-xs text-gray-500">Use lowercase with underscores (e.g., super_admin)</p>
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
                                    {processing ? 'Updating...' : 'Update Role'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900">Manage Permissions</h3>
                                <p className="text-sm text-gray-600">Assign or modify permissions for this role to control access</p>
                            </div>
                            <Link
                                href={route('roles.assign-permissions', role.id)}
                                className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-purple-700"
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
