import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Building2, CreditCard, DollarSign, Filter, Printer, Receipt, Users, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface VendorRow {
    id: number;
    name: string;
    company_name: string | null;
    phone: string;
    current_balance: number;
    is_active: boolean;
}

interface VendorOption {
    id: number;
    name: string;
    company_name: string | null;
    current_balance: number;
}

interface DueExpenseRow {
    id: number;
    expense_no: string;
    vendor_name: string;
    category_name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    description: string;
    expense_date: string;
}

interface PaymentRow {
    id: number;
    payment_no: string;
    vendor_name: string;
    amount: number;
    payment_method: string;
    description: string | null;
    payment_date: string;
}

interface Category {
    id: number;
    name: string;
}

interface DueExpenseProps {
    balance: number;
    vendors: VendorRow[];
    vendorOptions: VendorOption[];
    dueExpenses: DueExpenseRow[];
    payments: PaymentRow[];
    expenseCategories: Category[];
    filters: { vendor_id: number | null };
    totals: {
        total_due: number;
        vendors_with_due: number;
        total_expense_amount: number;
    };
}

type ModalType = 'vendor' | 'expense' | 'payment' | null;

const DueExpense: React.FC<DueExpenseProps> = ({
    balance,
    vendors,
    vendorOptions,
    dueExpenses,
    payments,
    expenseCategories,
    filters,
    totals,
}) => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [loading, setLoading] = useState(false);
    const [filterVendorId, setFilterVendorId] = useState(filters.vendor_id?.toString() ?? '');

    const [vendorForm, setVendorForm] = useState({
        name: '',
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    const [expenseForm, setExpenseForm] = useState({
        vendor_id: '',
        expense_category_id: '',
        total_amount: '',
        paid_amount: '0',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
    });

    const [paymentForm, setPaymentForm] = useState({
        vendor_id: '',
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
    });

    const dueAmountPreview = useMemo(() => {
        const total = parseFloat(expenseForm.total_amount) || 0;
        const paid = parseFloat(expenseForm.paid_amount) || 0;
        return Math.max(0, total - paid);
    }, [expenseForm.total_amount, expenseForm.paid_amount]);

    const selectedPaymentVendor = useMemo(
        () => vendorOptions.find((v) => v.id.toString() === paymentForm.vendor_id),
        [paymentForm.vendor_id, vendorOptions],
    );

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const formatAmount = (amount: number) =>
        new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
            .format(amount)
            .replace('BDT', '৳');

    const applyFilter = () => {
        router.get(
            route('hospital-account.due-expenses.index'),
            { vendor_id: filterVendorId || undefined },
            { preserveState: true },
        );
    };

    const closeModal = () => {
        setActiveModal(null);
        setLoading(false);
    };

    const submitVendor = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('hospital-account.due-expenses.vendors.store'), vendorForm, {
            onSuccess: () => {
                setVendorForm({
                    name: '',
                    company_name: '',
                    contact_person: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                });
                closeModal();
            },
            onFinish: () => setLoading(false),
        });
    };

    const submitExpense = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('hospital-account.due-expenses.store'), expenseForm, {
            onSuccess: () => {
                setExpenseForm({
                    vendor_id: '',
                    expense_category_id: '',
                    total_amount: '',
                    paid_amount: '0',
                    description: '',
                    expense_date: new Date().toISOString().split('T')[0],
                });
                closeModal();
            },
            onFinish: () => setLoading(false),
        });
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.vendor_id) return;
        setLoading(true);
        router.post(
            route('hospital-account.due-expenses.payment', paymentForm.vendor_id),
            {
                amount: paymentForm.amount,
                payment_method: paymentForm.payment_method,
                reference_no: paymentForm.reference_no,
                description: paymentForm.description,
                payment_date: paymentForm.payment_date,
            },
            {
                onSuccess: () => {
                    setPaymentForm({
                        vendor_id: '',
                        amount: '',
                        payment_method: 'cash',
                        reference_no: '',
                        description: '',
                        payment_date: new Date().toISOString().split('T')[0],
                    });
                    closeModal();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const openPaymentModal = (vendorId?: number) => {
        const vendor = vendorId ? vendorOptions.find((v) => v.id === vendorId) : undefined;
        setPaymentForm((prev) => ({
            ...prev,
            vendor_id: vendorId?.toString() ?? prev.vendor_id,
            amount: vendor && vendor.current_balance > 0 ? vendor.current_balance.toString() : prev.amount,
        }));
        setActiveModal('payment');
    };

    return (
        <HospitalAccountLayout title="Due Expense">
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => router.visit(route('hospital-account.dashboard'))}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit(route('hospital-account.vendor-due-ledger.due-expense'))}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Due Ledger
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('vendor')}
                            className="inline-flex items-center rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Add Vendor
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('expense')}
                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            Add Due Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => openPaymentModal()}
                            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay Vendor
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Account Balance</p>
                        <p className="text-xl font-bold text-blue-700">{formatAmount(balance)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total Vendor Due</p>
                        <p className="text-xl font-bold text-red-600">{formatAmount(totals.total_due)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Vendors With Due</p>
                        <p className="text-xl font-bold text-amber-600">{totals.vendors_with_due}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">Total Expense Recorded</p>
                        <p className="text-xl font-bold text-gray-900">{formatAmount(totals.total_expense_amount)}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="min-w-[200px] flex-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">Filter by Vendor</label>
                        <select
                            value={filterVendorId}
                            onChange={(e) => setFilterVendorId(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            <option value="">All Vendors</option>
                            {vendorOptions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                    {v.current_balance > 0 ? ` (Due: ${formatAmount(v.current_balance)})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={applyFilter}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Apply
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm xl:col-span-1">
                        <div className="border-b bg-gray-50 px-4 py-3">
                            <h3 className="flex items-center font-semibold text-gray-900">
                                <Building2 className="mr-2 h-4 w-4" />
                                Vendors
                            </h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {vendors.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500">No vendors yet. Add a vendor to get started.</p>
                            ) : (
                                vendors.map((vendor) => (
                                    <div
                                        key={vendor.id}
                                        className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{vendor.name}</p>
                                            <p className="text-xs text-gray-500">{vendor.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-semibold ${vendor.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                                            >
                                                {formatAmount(vendor.current_balance)}
                                            </p>
                                            {vendor.current_balance > 0 && vendor.is_active && (
                                                <button
                                                    type="button"
                                                    onClick={() => openPaymentModal(vendor.id)}
                                                    className="mt-1 text-xs text-blue-600 hover:underline"
                                                >
                                                    Pay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm xl:col-span-2">
                        <div className="border-b bg-gray-50 px-4 py-3">
                            <h3 className="flex items-center font-semibold text-gray-900">
                                <Receipt className="mr-2 h-4 w-4" />
                                Due Expenses
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Vendor</th>
                                        <th className="px-4 py-2">Category</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                        <th className="px-4 py-2 text-right">Paid</th>
                                        <th className="px-4 py-2 text-right">Due</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dueExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                                No due expenses recorded.
                                            </td>
                                        </tr>
                                    ) : (
                                        dueExpenses.map((row) => (
                                            <tr key={row.id} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap">{formatDate(row.expense_date)}</td>
                                                <td className="px-4 py-2">{row.vendor_name}</td>
                                                <td className="px-4 py-2">{row.category_name}</td>
                                                <td className="px-4 py-2 text-right">{formatAmount(row.total_amount)}</td>
                                                <td className="px-4 py-2 text-right text-green-600">
                                                    {formatAmount(row.paid_amount)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-red-600">
                                                    {formatAmount(row.due_amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-gray-50 px-4 py-3">
                        <h3 className="flex items-center font-semibold text-gray-900">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Recent Vendor Payments
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Payment No</th>
                                    <th className="px-4 py-2">Vendor</th>
                                    <th className="px-4 py-2">Method</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No payments yet.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((row) => (
                                        <tr key={row.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap">{formatDate(row.payment_date)}</td>
                                            <td className="px-4 py-2 font-mono text-xs">{row.payment_no}</td>
                                            <td className="px-4 py-2">{row.vendor_name}</td>
                                            <td className="px-4 py-2 capitalize">{row.payment_method.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-right font-medium text-green-700">
                                                {formatAmount(row.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {activeModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}
                >
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {activeModal === 'vendor' && 'Add Vendor'}
                                {activeModal === 'expense' && 'Add Due Expense'}
                                {activeModal === 'payment' && 'Pay Vendor'}
                            </h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {activeModal === 'vendor' && (
                            <form onSubmit={submitVendor} className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Name *</label>
                                    <input
                                        required
                                        value={vendorForm.name}
                                        onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Phone *</label>
                                    <input
                                        required
                                        value={vendorForm.phone}
                                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Company</label>
                                    <input
                                        value={vendorForm.company_name}
                                        onChange={(e) => setVendorForm({ ...vendorForm, company_name: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 rounded-lg bg-gray-700 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save Vendor'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-lg bg-gray-200 py-2 text-gray-800 hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeModal === 'expense' && (
                            <form onSubmit={submitExpense} className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Vendor *</label>
                                    <select
                                        required
                                        value={expenseForm.vendor_id}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, vendor_id: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendorOptions.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Expense Category *</label>
                                    <select
                                        required
                                        value={expenseForm.expense_category_id}
                                        onChange={(e) =>
                                            setExpenseForm({ ...expenseForm, expense_category_id: e.target.value })
                                        }
                                        className="w-full rounded-lg border px-3 py-2"
                                    >
                                        <option value="">Select category</option>
                                        {expenseCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Total Amount *</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={expenseForm.total_amount}
                                            onChange={(e) =>
                                                setExpenseForm({ ...expenseForm, total_amount: e.target.value })
                                            }
                                            className="w-full rounded-lg border px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Paid Now</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={expenseForm.paid_amount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, paid_amount: e.target.value })}
                                            className="w-full rounded-lg border px-3 py-2"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Balance: {formatAmount(balance)}</p>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    Due amount: <strong>{formatAmount(dueAmountPreview)}</strong>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={expenseForm.expense_date}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Description *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={expenseForm.description}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            !expenseForm.vendor_id ||
                                            (parseFloat(expenseForm.paid_amount) > 0 &&
                                                parseFloat(expenseForm.paid_amount) > balance)
                                        }
                                        className="flex-1 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Record Expense'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-lg bg-gray-200 py-2 text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeModal === 'payment' && (
                            <form onSubmit={submitPayment} className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Vendor *</label>
                                    <select
                                        required
                                        value={paymentForm.vendor_id}
                                        onChange={(e) => {
                                            const vendor = vendorOptions.find((v) => v.id.toString() === e.target.value);
                                            setPaymentForm({
                                                ...paymentForm,
                                                vendor_id: e.target.value,
                                                amount:
                                                    vendor && vendor.current_balance > 0
                                                        ? vendor.current_balance.toString()
                                                        : paymentForm.amount,
                                            });
                                        }}
                                        className="w-full rounded-lg border px-3 py-2"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendorOptions
                                            .filter((v) => v.current_balance > 0)
                                            .map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} — Due {formatAmount(v.current_balance)}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                {selectedPaymentVendor && (
                                    <p className="text-sm text-red-600">
                                        Outstanding: {formatAmount(selectedPaymentVendor.current_balance)}
                                    </p>
                                )}
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Amount *</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        max={selectedPaymentVendor?.current_balance}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Account balance: {formatAmount(balance)}</p>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Payment Method *</label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={paymentForm.payment_date}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Description</label>
                                    <textarea
                                        rows={2}
                                        value={paymentForm.description}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                        className="w-full rounded-lg border px-3 py-2"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            !paymentForm.vendor_id ||
                                            parseFloat(paymentForm.amount) > balance ||
                                            (selectedPaymentVendor &&
                                                parseFloat(paymentForm.amount) > selectedPaymentVendor.current_balance)
                                        }
                                        className="flex-1 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Record Payment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-lg bg-gray-200 py-2 text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </HospitalAccountLayout>
    );
};

export default DueExpense;
