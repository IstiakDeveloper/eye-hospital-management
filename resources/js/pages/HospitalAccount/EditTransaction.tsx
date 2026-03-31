import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatDate } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, FileText, Save, Tag, X } from 'lucide-react';
import React, { useState } from 'react';

interface Transaction {
    id: number;
    transaction_no: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    expense_category_id?: number;
    expense_category?: {
        id: number;
        name: string;
    };
    created_by?: {
        name: string;
    };
}

interface ExpenseCategory {
    id: number;
    name: string;
    is_active: boolean;
}

interface EditTransactionProps {
    transaction: Transaction;
    expenseCategories: ExpenseCategory[];
}

const EditTransaction: React.FC<EditTransactionProps> = ({ transaction, expenseCategories }) => {
    const [formData, setFormData] = useState({
        amount: transaction.amount.toString(),
        category: transaction.category || '',
        expense_category_id: transaction.expense_category_id || '',
        description: transaction.description || '',
        date: transaction.transaction_date.split('T')[0], // Format date properly for input field
    });

    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }

        // Auto-fill category name when category ID is selected
        if (name === 'expense_category_id' && value) {
            const selectedCategory = expenseCategories.find((cat) => cat.id.toString() === value);
            if (selectedCategory) {
                setFormData((prev) => ({
                    ...prev,
                    category: selectedCategory.name,
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.put(`/hospital-account/transactions/${transaction.id}`, formData, {
            onSuccess: () => {
                router.get('/hospital-account/transactions');
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    const handleCancel = () => {
        router.get('/hospital-account/transactions');
    };

    return (
        <HospitalAccountLayout title="Edit Transaction">
            {/* Header */}
            <div className="mb-4 rounded border bg-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            className="rounded p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            title="Back to Transactions"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Edit Transaction</h2>
                            <p className="text-sm text-gray-600">
                                Transaction No: <span className="font-mono text-blue-600">{transaction.transaction_no}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`rounded px-3 py-1 text-sm font-medium ${
                                transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                        >
                            {transaction.type.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div className="rounded border bg-white p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Amount */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <DollarSign className="mr-1 inline h-4 w-4" />
                                Amount (৳)
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                required
                                className={`w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                                    errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter amount"
                            />
                            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <Calendar className="mr-1 inline h-4 w-4" />
                                Transaction Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className={`w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                                    errors.date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                        </div>

                        {/* Category Selection (for expenses) */}
                        {transaction.type === 'expense' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    <Tag className="mr-1 inline h-4 w-4" />
                                    Expense Category
                                </label>
                                <select
                                    name="expense_category_id"
                                    value={formData.expense_category_id}
                                    onChange={handleInputChange}
                                    className={`w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                                        errors.expense_category_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Category</option>
                                    {expenseCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.expense_category_id && <p className="mt-1 text-xs text-red-600">{errors.expense_category_id}</p>}
                            </div>
                        )}

                        {/* Category Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                <Tag className="mr-1 inline h-4 w-4" />
                                Category Name
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                                    errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter category name"
                            />
                            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            <FileText className="mr-1 inline h-4 w-4" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className={`w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                                errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter transaction description"
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Created by:</span> {transaction.created_by?.name || 'Unknown'}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 ${
                                    loading ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Updating...' : 'Update Transaction'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Transaction Info */}
            <div className="mt-4 rounded border bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Transaction Information</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 md:grid-cols-4">
                    <div>
                        <span className="font-medium">Original Amount:</span>
                        <br />৳{Number(transaction.amount).toLocaleString()}
                    </div>
                    <div>
                        <span className="font-medium">Original Date:</span>
                        <br />
                        {formatDate(transaction.transaction_date)}
                    </div>
                    <div>
                        <span className="font-medium">Original Category:</span>
                        <br />
                        {transaction.category || 'N/A'}
                    </div>
                    <div>
                        <span className="font-medium">Transaction Type:</span>
                        <br />
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>{transaction.type.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </HospitalAccountLayout>
    );
};

export default EditTransaction;
