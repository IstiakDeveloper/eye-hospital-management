import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { router } from '@inertiajs/react';
import { MinusCircle, PlusCircle, Receipt, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';

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
    expenseCategories: Array<{ id: number; name: string }>;
    incomeCategories: Array<{ id: number; name: string }>;
    investorNames: string[];
}

const Dashboard: React.FC<DashboardProps> = ({
    balance,
    monthlyReport,
    recentTransactions,
    recentFundTransactions,
    expenseCategories,
    incomeCategories,
    investorNames,
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
        date: new Date().toISOString().split('T')[0],
    });

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return '—';
        }

        const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
        const parsed = new Date(calendarDate ? `${dateString}T00:00:00` : dateString);

        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            ...(calendarDate ? {} : { timeZone: 'Asia/Dhaka' }),
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If expense category is selected, also set the category name
        if (name === 'expense_category_id') {
            const selectedCategory = expenseCategories.find((cat) => cat.id.toString() === value);
            setFormData({
                ...formData,
                expense_category_id: value,
                category: selectedCategory?.name || '',
            });
        }
        // If income category is selected, also set the category name
        else if (name === 'income_category_id') {
            const selectedCategory = incomeCategories.find((cat) => cat.id.toString() === value);
            setFormData({
                ...formData,
                income_category_id: value,
                category: selectedCategory?.name || '',
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
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
            date: new Date().toISOString().split('T')[0],
        });
    };

    const handleFundIn = () => {
        const investorName = formData.investor_name || formData.purpose;
        setLoading(true);
        router.post(
            '/hospital-account/fund-in',
            {
                amount: formData.amount,
                purpose: investorName,
                description: formData.description,
                date: formData.date,
            },
            {
                onSuccess: () => {
                    setFundInModal(false);
                    resetForm();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleFundOut = () => {
        const investorName = formData.investor_name || formData.purpose;
        setLoading(true);
        router.post(
            '/hospital-account/fund-out',
            {
                amount: formData.amount,
                purpose: investorName,
                description: formData.description,
                date: formData.date,
            },
            {
                onSuccess: () => {
                    setFundOutModal(false);
                    resetForm();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleExpense = () => {
        // Prepare data for expense
        const expenseData = {
            amount: formData.amount,
            category: formData.category,
            expense_category_id: formData.expense_category_id || null,
            description: formData.description,
            date: formData.date,
        };

        setLoading(true);
        router.post('/hospital-account/expense', expenseData, {
            onSuccess: () => {
                setExpenseModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleOtherIncome = () => {
        const incomeData = {
            amount: formData.amount,
            category: formData.category,
            description: formData.description,
            date: formData.date,
        };

        setLoading(true);
        router.post('/hospital-account/other-income', incomeData, {
            onSuccess: () => {
                setOtherIncomeModal(false);
                resetForm();
            },
            onFinish: () => setLoading(false),
        });
    };

    const profit = moneyAmount(monthlyReport.profit);
    const fieldClass = 'h-8 w-full rounded border border-slate-300 px-2 text-[12px] focus:border-slate-500 focus:outline-none';
    const noteClass = 'w-full rounded border border-slate-300 px-2 py-1.5 text-[12px] focus:border-slate-500 focus:outline-none';

    return (
        <HospitalAccountLayout title="Dashboard">
            <div className="space-y-3 text-[13px] text-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-[15px] font-semibold text-slate-900">Hospital account</h1>
                        <p className="text-[12px] text-slate-500">This month</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFundInModal(true)}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[12px] hover:bg-slate-50"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Fund in
                        </button>
                        <button
                            type="button"
                            onClick={() => setFundOutModal(true)}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[12px] hover:bg-slate-50"
                        >
                            <MinusCircle className="h-3.5 w-3.5" />
                            Fund out
                        </button>
                        <button
                            type="button"
                            onClick={() => setOtherIncomeModal(true)}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[12px] hover:bg-slate-50"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Other income
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit(route('hospital-account.due-expenses.index'))}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[12px] hover:bg-slate-50"
                        >
                            <Receipt className="h-3.5 w-3.5" />
                            Due expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpenseModal(true)}
                            className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700"
                        >
                            <TrendingDown className="h-3.5 w-3.5" />
                            Add expense
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded border border-slate-200 bg-white sm:grid-cols-4">
                    {[
                        ['Balance', formatTaka(balance), 'text-slate-900'],
                        ['Income', formatTaka(monthlyReport.income), 'text-emerald-700'],
                        ['Expense', formatTaka(monthlyReport.expense), 'text-red-700'],
                        ['Profit', formatTaka(monthlyReport.profit), profit >= 0 ? 'text-emerald-700' : 'text-red-700'],
                    ].map(([label, value, tone]) => (
                        <div key={label} className="px-3 py-2">
                            <p className="text-[11px] text-slate-500">{label}</p>
                            <p className={`text-[13px] font-semibold tabular-nums ${tone}`}>{value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <section className="overflow-hidden rounded border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-3 py-2">
                            <h2 className="text-[13px] font-semibold">Recent transactions</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-[12px]">
                                <thead className="bg-slate-50 text-[11px] text-slate-500">
                                    <tr>
                                        <th className="px-3 py-1.5 font-medium">Category</th>
                                        <th className="px-3 py-1.5 font-medium">Date</th>
                                        <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                                                No transactions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentTransactions.map((transaction) => (
                                            <tr key={transaction.id} className="border-t border-slate-100">
                                                <td className="px-3 py-1.5">
                                                    <p className="text-slate-900">{transaction.category}</p>
                                                    <p className="max-w-xs truncate text-[11px] text-slate-500">{transaction.description}</p>
                                                </td>
                                                <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">
                                                    {formatDate(transaction.transaction_date)}
                                                </td>
                                                <td
                                                    className={`px-3 py-1.5 text-right font-medium tabular-nums ${transaction.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}
                                                >
                                                    {transaction.type === 'income' ? '+' : '−'}
                                                    {formatTaka(transaction.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-3 py-2">
                            <h2 className="text-[13px] font-semibold">Recent funds</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-[12px]">
                                <thead className="bg-slate-50 text-[11px] text-slate-500">
                                    <tr>
                                        <th className="px-3 py-1.5 font-medium">Investor</th>
                                        <th className="px-3 py-1.5 font-medium">Date</th>
                                        <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentFundTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                                                No fund entries yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentFundTransactions.map((fund) => (
                                            <tr key={fund.id} className="border-t border-slate-100">
                                                <td className="px-3 py-1.5">
                                                    <p className="text-slate-900">{fund.purpose}</p>
                                                    <p className="max-w-xs truncate text-[11px] text-slate-500">{fund.description}</p>
                                                </td>
                                                <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{formatDate(fund.date)}</td>
                                                <td
                                                    className={`px-3 py-1.5 text-right font-medium tabular-nums ${fund.type === 'fund_in' ? 'text-emerald-700' : 'text-red-700'}`}
                                                >
                                                    {fund.type === 'fund_in' ? '+' : '−'}
                                                    {formatTaka(fund.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Fund In Modal */}
            {fundInModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4">
                        <h2 className="mb-3 text-[14px] font-semibold text-slate-900">Add Fund</h2>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className={fieldClass}
                                required
                            />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Investor Name *</label>
                            <select name="investor_name" value={formData.investor_name} onChange={handleInputChange} className={fieldClass} required>
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
                                        className={fieldClass}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Date *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={fieldClass} required />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className={noteClass}
                                rows={2}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFundIn}
                                disabled={!formData.amount || (!formData.investor_name && !formData.purpose) || !formData.description || loading}
                                className="h-7 flex-1 rounded bg-slate-800 text-[12px] text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {loading ? 'Adding...' : 'Add Fund'}
                            </button>
                            <button
                                onClick={() => setFundInModal(false)}
                                disabled={loading}
                                className="h-7 flex-1 rounded border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fund Out Modal */}
            {fundOutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4">
                        <h2 className="mb-3 text-[14px] font-semibold text-slate-900">Withdraw Fund</h2>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                max={balance}
                                placeholder="Enter amount"
                                className={fieldClass}
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Available balance: {formatTaka(balance)}</p>
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Investor Name *</label>
                            <select name="investor_name" value={formData.investor_name} onChange={handleInputChange} className={fieldClass} required>
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
                                        className={fieldClass}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Date *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={fieldClass} required />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className={noteClass}
                                rows={2}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFundOut}
                                disabled={
                                    !formData.amount ||
                                    (!formData.investor_name && !formData.purpose) ||
                                    !formData.description ||
                                    parseFloat(formData.amount) > balance ||
                                    loading
                                }
                                className="h-7 flex-1 rounded bg-slate-800 text-[12px] text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {loading ? 'Processing...' : 'Withdraw'}
                            </button>
                            <button
                                onClick={() => setFundOutModal(false)}
                                disabled={loading}
                                className="h-7 flex-1 rounded border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {expenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4">
                        <h2 className="mb-3 text-[14px] font-semibold text-slate-900">Add Expense</h2>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                max={balance}
                                placeholder="Enter amount"
                                className={fieldClass}
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Available balance: {formatTaka(balance)}</p>
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Category *</label>
                            <select
                                name="expense_category_id"
                                value={formData.expense_category_id}
                                onChange={handleInputChange}
                                className={fieldClass}
                                required
                            >
                                <option value="">Select Category</option>
                                {expenseCategories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Date *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={fieldClass} required />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className={noteClass}
                                rows={2}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExpense}
                                disabled={
                                    !formData.amount ||
                                    !formData.expense_category_id ||
                                    !formData.description ||
                                    parseFloat(formData.amount) > balance ||
                                    loading
                                }
                                className="h-7 flex-1 rounded bg-slate-800 text-[12px] text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {loading ? 'Adding...' : 'Add Expense'}
                            </button>
                            <button
                                onClick={() => setExpenseModal(false)}
                                disabled={loading}
                                className="h-7 flex-1 rounded border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {otherIncomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4">
                        <h2 className="mb-3 text-[14px] font-semibold text-slate-900">Add Other Income</h2>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Amount *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className={fieldClass}
                                required
                            />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Income Category *</label>
                            <select
                                name="income_category_id"
                                value={formData.income_category_id}
                                onChange={handleInputChange}
                                className={fieldClass}
                                required
                            >
                                <option value="">Select Income Category</option>
                                {incomeCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Date *</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={fieldClass} required />
                        </div>
                        <div className="mb-2.5">
                            <label className="mb-1 block text-[11px] font-medium text-slate-600">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                className={noteClass}
                                rows={2}
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleOtherIncome}
                                disabled={!formData.amount || !formData.income_category_id || !formData.description || loading}
                                className="h-7 flex-1 rounded bg-slate-800 text-[12px] text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {loading ? 'Adding...' : 'Add Income'}
                            </button>
                            <button
                                onClick={() => setOtherIncomeModal(false)}
                                disabled={loading}
                                className="h-7 flex-1 rounded border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
