import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

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
        is_active: true
    });

    // Format amount helper
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('BDT', '৳');
    };

    const handleSubmit = () => {
        if (editingCategory) {
            router.put(`/optics-account/categories/${editingCategory.id}`, formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', is_active: true });
                }
            });
        } else {
            router.post('/optics-account/categories', formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setFormData({ name: '', is_active: true });
                }
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, is_active: category.is_active });
        setShowModal(true);
    };

    const toggleStatus = (category: Category) => {
        router.put(`/optics-account/categories/${category.id}`, {
            name: category.name,
            is_active: !category.is_active
        });
    };

    return (
        <OpticsAccountLayout title="Expense Categories">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Optics Expense Categories</h2>
                    <p className="text-gray-600">Manage your optical business expense categories</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', is_active: true });
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {category.transactions_count} transactions
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleEdit(category)}
                                    className="p-1 text-gray-400 hover:text-purple-600"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => toggleStatus(category)}
                                    className={`p-1 ${category.is_active ? 'text-purple-600' : 'text-gray-400'}`}
                                >
                                    {category.is_active ? (
                                        <ToggleRight className="w-5 h-5" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-sm font-medium ${category.is_active ? 'text-purple-600' : 'text-red-600'
                                    }`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {category.total_spent !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Spent:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatAmount(category.total_spent)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plus className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first optics expense category</p>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setFormData({ name: '', is_active: true });
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Add Category
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Category Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., Equipment Cost, Maintenance, Transport"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="mr-2 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name.trim()}
                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                            >
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCategory(null);
                                    setFormData({ name: '', is_active: true });
                                }}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OpticsAccountLayout>
    );
};

export default Categories;
