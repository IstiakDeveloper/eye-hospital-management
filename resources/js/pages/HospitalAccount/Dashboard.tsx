import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    CreditCard,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PlusCircle,
    MinusCircle
} from 'lucide-react';

interface DashboardProps {
    balance: number;
    monthlyReport: {
        income: number;
        expense: number;
        profit: number;
    };
    recentTransactions: Array<{
        id: number;
        transaction_no: string;
        type: string;
        amount: number;
        category: string;
        description: string;
        transaction_date: string;
    }>;
    recentFundTransactions: Array<{
        id: number;
        voucher_no: string;
        type: string;
        amount: number;
        purpose: string;
        description: string;
        date: string;
    }>;
    expenseCategories: Array<{ id: number, name: string }>;
    incomeCategories: Array<{ id: number, name: string }>;
    investorNames: string[];
}

const Dashboard: React.FC<DashboardProps> = ({
    balance,
    monthlyReport,
    recentTransactions,
    recentFundTransactions,
    expenseCategories,
    incomeCategories,
    investorNames
}) => {
    const [fundInModal, setFundInModal] = useState(false);
    const [fundOutModal, setFundOutModal] = useState(false);
    const [expenseModal, setExpenseModal] = useState(false);
    const [otherIncomeModal, setOtherIncomeModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        purpose: '',
        investor_name: '',
        description: '',
        category: '',
        expense_category_id: '',
        income_category_id: '',
        date: new Date().toISOString().split('T')[0]
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If expense category is selected, also set the category name
        if (name === 'expense_category_id') {
            const selectedCategory = expenseCategories.find(cat => cat.id.toString() === value);
            setFormData({
                ...formData,
                expense_category_id: value,
                category: selectedCategory?.name || ''
            });
        }
        // If income category is selected, also set the category name
        else if (name === 'income_category_id') {
            const selectedCategory = incomeCategories.find(cat => cat.id.toString() === value);
            setFormData({
                ...formData,
                income_category_id: value,
                category: selectedCategory?.name || ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            purpose: '',
            investor_name: '',
            description: '',
            category: '',
            expense_category_id: '',
            income_category_id: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleFundIn = () => {
        const investorName = formData.investor_name || formData.purpose;
        setLoading(true);
        router.post('/hospital-account/fund-in', {
            amount: formData.amount,
            purpose: investorName,
            description: formData.description,
            date: formData.date
        }, {
            onSuccess: () => {
                setFundInModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false)
        });
    };

    const handleFundOut = () => {
        const investorName = formData.investor_name || formData.purpose;
        setLoading(true);
        router.post('/hospital-account/fund-out', {
            amount: formData.amount,
            purpose: investorName,
            description: formData.description,
            date: formData.date
        }, {
            onSuccess: () => {
                setFundOutModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false)
        });
    };

    const handleExpense = () => {
        // Prepare data for expense
        const expenseData = {
            amount: formData.amount,
            category: formData.category,
            expense_category_id: formData.expense_category_id || null,
            description: formData.description,
            date: formData.date
        };

        setLoading(true);
        router.post('/hospital-account/expense', expenseData, {
            onSuccess: () => {
                setExpenseModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false)
        });
    };

    const handleOtherIncome = () => {
        const incomeData = {
            amount: formData.amount,
            category: formData.category,
            description: formData.description,
            date: formData.date
        };

        setLoading(true);
        router.post('/hospital-account/other-income', incomeData, {
            onSuccess: () => {
                setOtherIncomeModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false)
        });
    };

    return (
        <HospitalAccountLayout title="Dashboard">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Balance</p>
                            <p className="text-2xl font-bold text-gray-900">{formatAmount(balance)}</p>
                        </div>
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                            <p className="text-2xl font-bold text-green-600">{formatAmount(monthlyReport.income)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Expense</p>
                            <p className="text-2xl font-bold text-red-600">{formatAmount(monthlyReport.expense)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Profit</p>
                            <p className={`text-2xl font-bold ${monthlyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAmount(monthlyReport.profit)}
                            </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setFundInModal(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Fund In
                </button>
                <button
                    onClick={() => setFundOutModal(true)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <MinusCircle className="w-4 h-4 mr-2" />
                    Fund Out
                </button>
                <button
                    onClick={() => setExpenseModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Add Expense
                </button>
                <button
                    onClick={() => setOtherIncomeModal(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Other Income
                </button>
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold">Recent Transactions</h3>
                    </div>
                    <div className="p-6">
                        {recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{transaction.category}</p>
                                    <p className="text-sm text-gray-600 truncate max-w-xs">{transaction.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                                    </p>
                                    <p className="text-sm text-gray-600">{formatDate(transaction.transaction_date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold">Recent Fund Transactions</h3>
                    </div>
                    <div className="p-6">
                        {recentFundTransactions.map((fund) => (
                            <div key={fund.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{fund.purpose}</p>
                                    <p className="text-sm text-gray-600 truncate max-w-xs">{fund.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${fund.type === 'fund_in' ? 'text-green-600' : 'text-red-600'}`}>
                                        {fund.type === 'fund_in' ? '+' : '-'}{formatAmount(fund.amount)}
                                    </p>
                                    <p className="text-sm text-gray-600">{formatDate(fund.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fund In Modal */}
            {fundInModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Fund</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Investor Name *</label>
                            <select
                                name="investor_name"
                                value={formData.investor_name}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select Investor</option>
                                {investorNames.map((name, index) => (
                                    <option key={index} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            {!formData.investor_name && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="Or type new investor name"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFundIn}
                                disabled={!formData.amount || (!formData.investor_name && !formData.purpose) || !formData.description || loading}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Fund'}
                            </button>
                            <button
                                onClick={() => setFundInModal(false)}
                                disabled={loading}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fund Out Modal */}
            {fundOutModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4">Withdraw Fund</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                max={balance}
                                placeholder="Enter amount"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Available balance: {formatAmount(balance)}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Investor Name *</label>
                            <select
                                name="investor_name"
                                value={formData.investor_name}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                required
                            >
                                <option value="">Select Investor</option>
                                {investorNames.map((name, index) => (
                                    <option key={index} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            {!formData.investor_name && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="Or type new investor name"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFundOut}
                                disabled={!formData.amount || (!formData.investor_name && !formData.purpose) || !formData.description || parseFloat(formData.amount) > balance || loading}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Withdraw'}
                            </button>
                            <button
                                onClick={() => setFundOutModal(false)}
                                disabled={loading}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {expenseModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                max={balance}
                                placeholder="Enter amount"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Available balance: {formatAmount(balance)}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Category *</label>
                            <select
                                name="expense_category_id"
                                value={formData.expense_category_id}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select Category</option>
                                {expenseCategories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {!formData.expense_category_id && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="Or type custom category"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExpense}
                                disabled={!formData.amount || (!formData.category && !formData.expense_category_id) || !formData.description || parseFloat(formData.amount) > balance || loading}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Expense'}
                            </button>
                            <button
                                onClick={() => setExpenseModal(false)}
                                disabled={loading}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {otherIncomeModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}>
                    <div className="bg-white rounded-lg p-6 w-96 max-w-lg mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Other Income</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Income Category *</label>
                            <select
                                name="income_category_id"
                                value={formData.income_category_id}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">Select Income Category</option>
                                {incomeCategories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Or enter custom category below</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Custom Category (Optional)</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="e.g., Bank Interest, Commission, Refund etc."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleOtherIncome}
                                disabled={!formData.amount || (!formData.income_category_id && !formData.category) || !formData.description || loading}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Income'}
                            </button>
                            <button
                                onClick={() => setOtherIncomeModal(false)}
                                disabled={loading}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
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

export default Dashboard;
