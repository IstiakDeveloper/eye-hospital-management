import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { Beaker, CheckCircle, Clock, DollarSign, Edit, Plus, Save, Search, Trash2, X, XCircle } from 'lucide-react';
import { useState } from 'react';

interface MedicalTest {
    id: number;
    name: string;
    code: string;
    category: string;
    price: number;
    description?: string;
    duration_minutes: number;
    is_active: boolean;
    created_at: string;
}

interface Props {
    tests: MedicalTest[];
    categories: Record<string, string>;
}

export default function TestIndex({ tests, categories }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingTest, setEditingTest] = useState<MedicalTest | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'Laboratory',
        price: '',
        description: '',
        duration_minutes: '30',
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    const filteredTests = tests.filter((test) => {
        const matchesSearch =
            test.name.toLowerCase().includes(searchQuery.toLowerCase()) || test.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || test.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCreate = () => {
        setEditingTest(null);
        setFormData({
            name: '',
            code: '',
            category: 'Laboratory',
            price: '',
            description: '',
            duration_minutes: '30',
            is_active: true,
        });
        setShowModal(true);
    };

    const handleEdit = (test: MedicalTest) => {
        setEditingTest(test);
        setFormData({
            name: test.name,
            code: test.code,
            category: test.category,
            price: test.price.toString(),
            description: test.description || '',
            duration_minutes: test.duration_minutes.toString(),
            is_active: test.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = editingTest ? `/medical-tests/tests/${editingTest.id}` : '/medical-tests/tests';

        const method = editingTest ? 'put' : 'post';

        router[method](url, formData, {
            onSuccess: () => {
                setShowModal(false);
                setEditingTest(null);
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleDelete = (test: MedicalTest) => {
        if (!confirm(`Are you sure you want to delete "${test.name}"?`)) return;
        router.delete(`/medical-tests/tests/${test.id}`);
    };

    const toggleActive = (test: MedicalTest) => {
        router.put(`/medical-tests/tests/${test.id}`, {
            ...test,
            is_active: !test.is_active,
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Medical Tests Master</h1>
                            <p className="mt-1 text-gray-600">Manage all medical test types</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-lg transition hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Test
                        </button>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-4 shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Tests</p>
                                    <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
                                </div>
                                <Beaker className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Tests</p>
                                    <p className="text-2xl font-bold text-green-600">{tests.filter((t) => t.is_active).length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Inactive Tests</p>
                                    <p className="text-2xl font-bold text-red-600">{tests.filter((t) => !t.is_active).length}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Categories</p>
                                    <p className="text-2xl font-bold text-purple-600">{Object.keys(categories).length}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or code..."
                                    className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {Object.entries(categories).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Test Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Price</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Duration</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <Beaker className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                                <p className="text-lg font-medium">No tests found</p>
                                                <p className="text-sm">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTests.map((test) => (
                                            <tr key={test.id} className="transition hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{test.name}</div>
                                                        {test.description && (
                                                            <div className="mt-1 line-clamp-1 text-sm text-gray-500">{test.description}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                        {test.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{test.category}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-lg font-semibold text-blue-600">৳{Number(test.price).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                                        <Clock className="h-4 w-4" />
                                                        {test.duration_minutes} min
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleActive(test)}
                                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                                                            test.is_active
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {test.is_active ? (
                                                            <>
                                                                <CheckCircle className="h-3 w-3" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-3 w-3" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(test)}
                                                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(test)}
                                                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
                        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">{editingTest ? 'Edit Test' : 'Add New Test'}</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-2 transition hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Test Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Test Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Auto-generated if empty"
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {Object.entries(categories).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Price (৳) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional test description..."
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Active (available for booking)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg border border-gray-300 px-6 py-2 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {loading ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
