import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { router } from '@inertiajs/react';
import { Edit, Plus, ToggleLeft, ToggleRight, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

interface Category {
    id: number;
    name: string;
    is_active: boolean;
    transactions_count: number;
    total_spent?: number;
}

interface CategoriesProps {
    expenseCategories: Category[];
    incomeCategories: Category[];
}

const Categories: React.FC<CategoriesProps> = ({ expenseCategories, incomeCategories }) => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'expense' | 'income'>('expense');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
    });

    const handleSubmit = () => {
        const route = modalType === 'income' ? '/hospital-account/income-categories' : '/hospital-account/categories';

        if (editingCategory) {
            const updateRoute =
                modalType === 'income'
                    ? `/hospital-account/income-categories/${editingCategory.id}`
                    : `/hospital-account/categories/${editingCategory.id}`;

            router.put(updateRoute, formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: '', is_active: true });
                },
            });
        } else {
            router.post(route, formData, {
                onSuccess: () => {
                    setShowModal(false);
                    setFormData({ name: '', is_active: true });
                },
            });
        }
    };

    const handleEdit = (category: Category, type: 'expense' | 'income') => {
        setEditingCategory(category);
        setModalType(type);
        setFormData({ name: category.name, is_active: category.is_active });
        setShowModal(true);
    };

    const toggleStatus = (category: Category, type: 'expense' | 'income') => {
        const route = type === 'income' ? `/hospital-account/income-categories/${category.id}` : `/hospital-account/categories/${category.id}`;

        router.put(route, {
            name: category.name,
            is_active: !category.is_active,
        });
    };

    const openAddModal = (type: 'expense' | 'income') => {
        setEditingCategory(null);
        setModalType(type);
        setFormData({ name: '', is_active: true });
        setShowModal(true);
    };

    return (
        <HospitalAccountLayout title="Categories">
            {/* Income Categories Section */}
            <div className="mb-10">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Income Categories</h2>
                            <p className="text-gray-600">Manage your income categories</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openAddModal('income')}
                        className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Income Category
                    </button>
                </div>

                {/* Income Categories Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {incomeCategories.map((category) => (
                        <div key={category.id} className="rounded-lg border border-green-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                    <p className="text-sm text-gray-600">{category.transactions_count} transactions</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEdit(category, 'income')} className="p-1 text-gray-400 hover:text-green-600">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(category, 'income')}
                                        className={`p-1 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                        {category.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-green-100 pt-4">
                                <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expense Categories Section */}
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="h-6 w-6 text-red-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Expense Categories</h2>
                            <p className="text-gray-600">Manage your expense categories</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openAddModal('expense')}
                        className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense Category
                    </button>
                </div>

                {/* Expense Categories Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {expenseCategories.map((category) => (
                        <div key={category.id} className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                    <p className="text-sm text-gray-600">{category.transactions_count} transactions</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEdit(category, 'expense')} className="p-1 text-gray-400 hover:text-blue-600">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(category, 'expense')}
                                        className={`p-1 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                        {category.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-blue-100 pt-4">
                                <span className={`text-sm font-medium ${category.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="w-96 rounded-lg bg-white p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            {editingCategory
                                ? `Edit ${modalType === 'income' ? 'Income' : 'Expense'} Category`
                                : `Add New ${modalType === 'income' ? 'Income' : 'Expense'} Category`}
                        </h3>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium">Category Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2"
                                placeholder="Enter category name"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name.trim()}
                                className={`flex-1 ${modalType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg py-2 text-white disabled:bg-gray-300`}
                            >
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCategory(null);
                                    setFormData({ name: '', is_active: true });
                                }}
                                className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HospitalAccountLayout>
    );
};

export default Categories;
