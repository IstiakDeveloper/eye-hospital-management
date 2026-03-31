import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { router } from '@inertiajs/react';
import { Edit, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useState } from 'react';

interface Category {
    id: number;
    name: string;
    is_active: boolean;
    transactions_count: number;
    total_spent?: number;
}

interface CategoriesProps {
    categories: Category[];
}

const Categories: React.FC<CategoriesProps> = ({ categories }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
    });

    // Format amount helper
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const handleSubmit = () => {
        if (editingCategory) {
            router.put(`/medicine-account/categories/${editingCategory.id}`, formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', is_active: true });
                },
            });
        } else {
            router.post('/medicine-account/categories', formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setFormData({ name: '', is_active: true });
                },
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, is_active: category.is_active });
        setShowModal(true);
    };

    const toggleStatus = (category: Category) => {
        router.put(`/medicine-account/categories/${category.id}`, {
            name: category.name,
            is_active: !category.is_active,
        });
    };

    return (
        <MedicineAccountLayout title="Expense Categories">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Medicine Expense Categories</h2>
                    <p className="text-gray-600">Manage your pharmacy expense categories</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', is_active: true });
                        setShowModal(true);
                    }}
                    className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <div key={category.id} className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                <p className="text-sm text-gray-600">{category.transactions_count} transactions</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEdit(category)} className="p-1 text-gray-400 hover:text-green-600">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => toggleStatus(category)}
                                    className={`p-1 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                >
                                    {category.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {category.total_spent !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Spent:</span>
                                    <span className="text-sm font-medium text-gray-900">{formatAmount(category.total_spent)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                        <Plus className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">No categories found</h3>
                    <p className="mb-4 text-gray-600">Get started by creating your first medicine expense category</p>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setFormData({ name: '', is_active: true });
                            setShowModal(true);
                        }}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                        Add Category
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="mx-4 w-96 max-w-lg rounded-lg bg-white p-6">
                        <h3 className="mb-4 text-lg font-semibold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium">Category Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., Storage Cost, Transport, Equipment"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="mr-2 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name.trim()}
                                className="flex-1 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 disabled:bg-gray-300"
                            >
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCategory(null);
                                    setFormData({ name: '', is_active: true });
                                }}
                                className="flex-1 rounded-lg bg-gray-500 py-2 text-white hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MedicineAccountLayout>
    );
};

export default Categories;
