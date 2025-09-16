import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    ArrowLeft,
    Save,
    DollarSign,
    FileText,
    Calendar,
    Tag,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    XCircle,
    User,
    Clock,
    RefreshCw
} from 'lucide-react';

// Utility function for date formatting
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
};

interface Transaction {
    id: number;
    transaction_no: string;
    type: string;
    amount: number;
    category: string;
    expense_category_id?: number;
    description: string;
    transaction_date: string;
    created_at: string;
    updated_at: string;
    created_by?: {
        id: number;
        name: string;
    };
    expense_category?: {
        id: number;
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
    is_active: boolean;
}

interface EditTransactionProps {
    transaction: Transaction;
    categories: Category[];
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: Record<string, string>;
}

const EditTransaction: React.FC<EditTransactionProps> = ({
    transaction,
    categories,
    flash,
    errors: serverErrors
}) => {
    const [formData, setFormData] = useState({
        amount: transaction.amount.toString(),
        category: transaction.category || '',
        expense_category_id: transaction.expense_category_id?.toString() || '',
        description: transaction.description || '',
        date: transaction.transaction_date || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>(serverErrors || {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    // Track changes
    useEffect(() => {
        const originalData = {
            amount: transaction.amount.toString(),
            category: transaction.category || '',
            expense_category_id: transaction.expense_category_id?.toString() || '',
            description: transaction.description || '',
            date: transaction.transaction_date || '',
        };

        const hasFormChanges = Object.keys(formData).some(
            key => formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData]
        );

        setHasChanges(hasFormChanges);
    }, [formData, transaction]);

    // Update errors when server errors change
    useEffect(() => {
        if (serverErrors) {
            setErrors(serverErrors);
        }
    }, [serverErrors]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Auto-populate category when selecting from dropdown
        if (name === 'expense_category_id' && value) {
            const selectedCategory = categories.find(cat => cat.id.toString() === value);
            if (selectedCategory) {
                setFormData(prev => ({
                    ...prev,
                    category: selectedCategory.name,
                    expense_category_id: value
                }));
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        if (!formData.category.trim()) {
            newErrors.category = 'Category is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else if (new Date(formData.date) > new Date()) {
            newErrors.date = 'Date cannot be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const submitData = {
            ...formData,
            amount: parseFloat(formData.amount),
        };

        router.put(`/hospital-account/transactions/${transaction.id}`, submitData, {
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                setIsSubmitting(false);
                setHasChanges(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleCancel = () => {
        if (hasChanges) {
            setShowUnsavedWarning(true);
        } else {
            router.get('/hospital-account/transactions');
        }
    };

    const confirmCancel = () => {
        setShowUnsavedWarning(false);
        router.get('/hospital-account/transactions');
    };

    const cancelUnsavedWarning = () => {
        setShowUnsavedWarning(false);
    };

    const resetForm = () => {
        setFormData({
            amount: transaction.amount.toString(),
            category: transaction.category || '',
            expense_category_id: transaction.expense_category_id?.toString() || '',
            description: transaction.description || '',
            date: transaction.transaction_date || '',
        });
        setErrors({});
        setHasChanges(false);
    };

    return (
        <HospitalAccountLayout title="Edit Transaction">
            <div className="max-w-4xl mx-auto">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                            <p className="text-green-800">{flash.success}</p>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                        <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-400 mr-2" />
                            <p className="text-red-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <button
                                onClick={handleCancel}
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Transaction</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Transaction No: <span className="font-mono font-medium text-blue-600">{transaction.transaction_no}</span>
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-center px-3 py-1 text-xs font-semibold rounded-full ${transaction.type === 'income'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {transaction.type === 'income' ? (
                                <>
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Income Transaction
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    Expense Transaction
                                </>
                            )}
                        </div>
                    </div>

                    {/* Transaction Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            <span>Created by: <strong>{transaction.created_by?.name || 'Unknown'}</strong></span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Created: <strong>{formatDate(transaction.created_at)}</strong></span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            <span>Updated: <strong>{formatDate(transaction.updated_at)}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
                                {hasChanges && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        Unsaved changes
                                    </span>
                                )}
                            </div>

                            <div className="space-y-6">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        Amount (৳) *
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0.01"
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter amount"
                                    />
                                    {errors.amount && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.amount}
                                        </div>
                                    )}
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Tag className="w-4 h-4 inline mr-1" />
                                        Category *
                                    </label>

                                    {/* Category Dropdown (for expenses) */}
                                    {transaction.type === 'expense' && categories.length > 0 && (
                                        <div className="mb-3">
                                            <select
                                                name="expense_category_id"
                                                value={formData.expense_category_id}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                            >
                                                <option value="">Select from existing categories</option>
                                                {categories.filter(cat => cat.is_active).map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Or enter a custom category below
                                            </p>
                                        </div>
                                    )}

                                    {/* Custom Category Input */}
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter category name"
                                    />
                                    {errors.category && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.category}
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter detailed description of the transaction"
                                        maxLength={500}
                                    />
                                    <div className="mt-1 flex justify-between items-center">
                                        {errors.description ? (
                                            <div className="flex items-center text-sm text-red-600">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.description}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500">
                                                Provide clear details about this transaction
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {formData.description.length}/500
                                        </span>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Transaction Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.date && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.date}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !hasChanges}
                                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium"
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        {isSubmitting ? 'Updating Transaction...' : 'Update Transaction'}
                                    </button>

                                    <button
                                        onClick={resetForm}
                                        disabled={isSubmitting || !hasChanges}
                                        className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium"
                                    >
                                        <RefreshCw className="w-5 h-5 mr-2" />
                                        Reset Changes
                                    </button>

                                    <button
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>

                            <div className="space-y-4">
                                {/* Current Amount */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Current Amount</span>
                                        <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}৳{Number(transaction.amount).toLocaleString('en-BD')}
                                        </span>
                                    </div>
                                </div>

                                {/* New Amount Preview */}
                                {hasChanges && formData.amount && !errors.amount && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-blue-700">New Amount</span>
                                            <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : '-'}৳{Number(formData.amount).toLocaleString('en-BD')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            Change: ৳{Math.abs(Number(formData.amount) - Number(transaction.amount)).toLocaleString('en-BD')}
                                        </div>
                                    </div>
                                )}

                                {/* Category Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Category</div>
                                    <div className="text-sm text-gray-900">
                                        Current: <span className="font-medium">{transaction.category}</span>
                                    </div>
                                    {hasChanges && formData.category !== transaction.category && (
                                        <div className="text-sm text-blue-600 mt-1">
                                            New: <span className="font-medium">{formData.category}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Date Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Transaction Date</div>
                                    <div className="text-sm text-gray-900">
                                        Current: <span className="font-medium">{formatDate(transaction.transaction_date)}</span>
                                    </div>
                                    {hasChanges && formData.date !== transaction.transaction_date && (
                                        <div className="text-sm text-blue-600 mt-1">
                                            New: <span className="font-medium">{formatDate(formData.date)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Warning */}
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-yellow-800">
                                            <div className="font-medium mb-1">Important Note</div>
                                            <div>Updating this transaction will automatically adjust the hospital account balance and related main account vouchers.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unsaved Changes Warning Modal */}
                {showUnsavedWarning && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full mx-4 animate-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="bg-yellow-100 p-2 rounded-full mr-4">
                                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Unsaved Changes</h3>
                                        <p className="text-sm text-gray-500">You have unsaved changes</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-6">
                                    You have made changes to this transaction. Are you sure you want to leave without saving?
                                </p>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={cancelUnsavedWarning}
                                        className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Stay & Continue Editing
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                                    >
                                        Leave Without Saving
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HospitalAccountLayout>
    );
};

export default EditTransaction;
