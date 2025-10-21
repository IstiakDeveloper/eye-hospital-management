import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OperationAccountLayout from '@/layouts/OperationAccountLayout';
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
}

const Dashboard: React.FC<DashboardProps> = ({
    balance,
    monthlyReport,
    recentTransactions,
    recentFundTransactions
}) => {
    const [fundInModal, setFundInModal] = useState(false);
    const [fundOutModal, setFundOutModal] = useState(false);
    const [expenseModal, setExpenseModal] = useState(false);
    const [otherIncomeModal, setOtherIncomeModal] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        purpose: '',
        description: '',
        category: '',
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            purpose: '',
            description: '',
            category: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleFundIn = () => {
        router.post('/operation-account/fund-in', formData, {
            onSuccess: () => {
                setFundInModal(false);
                resetForm();
            }
        });
    };

    const handleFundOut = () => {
        router.post('/operation-account/fund-out', formData, {
            onSuccess: () => {
                setFundOutModal(false);
                resetForm();
            }
        });
    };

    const handleExpense = () => {
        router.post('/operation-account/expense', formData, {
            onSuccess: () => {
                setExpenseModal(false);
                resetForm();
            }
        });
    };

    const handleOtherIncome = () => {
        router.post('/operation-account/other-income', formData, {
            onSuccess: () => {
                setOtherIncomeModal(false);
                resetForm();
            }
        });
    };

    return (
        <OperationAccountLayout title="Dashboard">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Balance</p>
                            <p className="text-2xl font-bold text-gray-900">{formatAmount(balance)}</p>
                        </div>
                        <CreditCard className="w-8 h-8 text-purple-600" />
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
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((transaction) => (
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
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No transactions yet</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold">Recent Fund Transactions</h3>
                    </div>
                    <div className="p-6">
                        {recentFundTransactions.length > 0 ? (
                            recentFundTransactions.map((fund) => (
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
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No fund transactions yet</p>
                        )}
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
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Purpose *</label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                placeholder="e.g., Equipment Purchase, Initial Fund etc."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                rows={3}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFundIn}
                                disabled={!formData.amount || !formData.purpose || !formData.description}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Add Fund
                            </button>
                            <button
                                onClick={() => setFundInModal(false)}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
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
                            <label className="block text-sm font-medium mb-2">Purpose *</label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                placeholder="e.g., Equipment Maintenance, Staff Salary etc."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                required
                            />
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
                                disabled={!formData.amount || !formData.purpose || !formData.description || parseFloat(formData.amount) > balance}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Withdraw
                            </button>
                            <button
                                onClick={() => setFundOutModal(false)}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
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
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="e.g., Equipment, Supplies, Utilities etc."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
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
                                disabled={!formData.amount || !formData.category || !formData.description || parseFloat(formData.amount) > balance}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Add Expense
                            </button>
                            <button
                                onClick={() => setExpenseModal(false)}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Income Modal */}
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
                            <label className="block text-sm font-medium mb-2">Category *</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                placeholder="e.g., Consultation Fee, Follow-up, Other Service etc."
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
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
                                disabled={!formData.amount || !formData.category || !formData.description}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Add Income
                            </button>
                            <button
                                onClick={() => setOtherIncomeModal(false)}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OperationAccountLayout>
    );
};

export default Dashboard;
