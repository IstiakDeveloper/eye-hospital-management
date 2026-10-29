import AdminLayout from '@/layouts/admin-layout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import VendorTabs from './VendorTabs';

interface VendorTransaction {
    id: number;
    transaction_no: string;
    type: 'purchase' | 'payment' | 'adjustment';
    amount: number | string;
    due_amount: number | string;
    paid_amount: number | string;
    payment_status: 'pending' | 'partial' | 'paid';
    description: string;
    transaction_date: string;
    purchase_date?: string | null;
    due_date?: string | null;
}

interface VendorPayment {
    id: number;
    payment_no: string;
    amount: number | string;
    payment_method: string;
    reference_no?: string | null;
    payment_date: string;
    description: string;
}

interface Vendor {
    id: number;
    name: string;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    current_balance: number | string;
    balance_type: 'due' | 'advance';
    credit_limit: number | string;
    payment_terms_days: number;
    is_active: boolean;
    transactions: VendorTransaction[];
    payments: VendorPayment[];
}

interface Props {
    vendor: Vendor;
    overdueTransactions: VendorTransaction[];
}

const fieldClass = 'h-7 w-full rounded border border-slate-300 px-2 text-[12px]';

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(calendarDate ? `${value}T00:00:00` : value);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(calendarDate ? {} : { timeZone: 'Asia/Dhaka' }),
    });
}

function statusLabel(status: VendorTransaction['payment_status']): string {
    if (status === 'paid') {
        return 'Paid';
    }

    if (status === 'partial') {
        return 'Partial';
    }

    return 'Due';
}

export default function VendorShow({ vendor, overdueTransactions }: Props) {
    const [showPayment, setShowPayment] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);

    const payment = useForm({
        vendor_id: vendor.id,
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        payment_date: new Date().toISOString().slice(0, 10),
        description: '',
        allocated_transactions: [] as number[],
    });

    const adjust = useForm({
        vendor_id: vendor.id,
        adjustment_type: 'increase',
        amount: '',
        reason: '',
    });

    const openBills = vendor.transactions.filter((transaction) => transaction.type === 'purchase' && transaction.payment_status !== 'paid');
    const overdue = overdueTransactions.reduce((sum, transaction) => sum + moneyAmount(transaction.due_amount), 0);
    const purchases = vendor.transactions
        .filter((transaction) => transaction.type === 'purchase')
        .reduce((sum, transaction) => sum + moneyAmount(transaction.amount), 0);
    const payments = vendor.payments.reduce((sum, item) => sum + moneyAmount(item.amount), 0);

    const openBillPayment = (bill?: VendorTransaction) => {
        payment.setData({
            vendor_id: vendor.id,
            amount: moneyAmount(bill?.due_amount ?? vendor.current_balance).toString(),
            payment_method: 'cash',
            reference_no: '',
            payment_date: new Date().toISOString().slice(0, 10),
            description: bill ? `Payment for bill ${bill.transaction_no}` : `Payment to ${vendor.name}`,
            allocated_transactions: bill ? [bill.id] : [],
        });
        setShowPayment(true);
    };

    const selectedBill = openBills.find((bill) => bill.id === payment.data.allocated_transactions[0]);
    const payable = moneyAmount(selectedBill?.due_amount ?? vendor.current_balance);

    return (
        <AdminLayout>
            <Head title={vendor.name} />

            <div className="space-y-3 text-[13px] text-slate-800">
                <VendorTabs />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Link
                            href={route('medicine-vendors.index')}
                            className="mb-1 inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-800"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Vendors
                        </Link>
                        <h1 className="text-[15px] font-semibold text-slate-900">{vendor.name}</h1>
                        <p className="text-[12px] text-slate-500">
                            {[vendor.company_name, vendor.phone, vendor.email].filter(Boolean).join(' · ') || 'No contact details'}
                            {vendor.address ? ` · ${vendor.address}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowAdjust(true)}
                            className="h-7 rounded border border-slate-300 px-2.5 text-[12px] hover:bg-slate-50"
                        >
                            Adjust
                        </button>
                        <button
                            type="button"
                            onClick={() => openBillPayment()}
                            className="h-7 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700"
                        >
                            Pay
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded border border-slate-200 bg-white sm:grid-cols-4">
                    {[
                        ['Balance', formatTaka(vendor.current_balance), vendor.balance_type === 'due' ? 'text-red-700' : 'text-emerald-700'],
                        ['Overdue', formatTaka(overdue), 'text-red-700'],
                        ['Purchases', formatTaka(purchases), 'text-slate-900'],
                        ['Payments', formatTaka(payments), 'text-slate-900'],
                    ].map(([label, value, tone]) => (
                        <div key={label} className="px-3 py-2">
                            <p className="text-[11px] text-slate-500">{label}</p>
                            <p className={`text-[13px] font-semibold tabular-nums ${tone}`}>{value}</p>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-3 py-2">
                        <h2 className="text-[13px] font-semibold">Open bills</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-[12px]">
                            <thead className="bg-slate-50 text-[11px] text-slate-500">
                                <tr>
                                    <th className="px-3 py-1.5 font-medium">Bill</th>
                                    <th className="px-3 py-1.5 font-medium">Purchase date</th>
                                    <th className="px-3 py-1.5 font-medium">Due date</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Due</th>
                                    <th className="px-3 py-1.5 font-medium">Status</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {openBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                                            No open bills.
                                        </td>
                                    </tr>
                                ) : (
                                    openBills.map((bill) => (
                                        <tr key={bill.id} className="border-t border-slate-100">
                                            <td className="px-3 py-1.5 text-slate-900">{bill.transaction_no}</td>
                                            <td className="px-3 py-1.5 whitespace-nowrap">
                                                {formatDate(bill.purchase_date || bill.transaction_date)}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(bill.due_date)}</td>
                                            <td className="px-3 py-1.5 text-right tabular-nums">{formatTaka(bill.amount)}</td>
                                            <td className="px-3 py-1.5 text-right font-medium text-red-700 tabular-nums">
                                                {formatTaka(bill.due_amount)}
                                            </td>
                                            <td className="px-3 py-1.5">{statusLabel(bill.payment_status)}</td>
                                            <td className="px-3 py-1.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openBillPayment(bill)}
                                                    className="h-6 rounded bg-slate-800 px-1.5 text-[11px] text-white hover:bg-slate-700"
                                                >
                                                    Pay bill
                                                </button>
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
                        <h2 className="text-[13px] font-semibold">Payments</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-[12px]">
                            <thead className="bg-slate-50 text-[11px] text-slate-500">
                                <tr>
                                    <th className="px-3 py-1.5 font-medium">Payment</th>
                                    <th className="px-3 py-1.5 font-medium">Date</th>
                                    <th className="px-3 py-1.5 font-medium">Method</th>
                                    <th className="px-3 py-1.5 font-medium">Reference</th>
                                    <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendor.payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                            No payments yet.
                                        </td>
                                    </tr>
                                ) : (
                                    vendor.payments.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-100">
                                            <td className="px-3 py-1.5">{item.payment_no}</td>
                                            <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(item.payment_date)}</td>
                                            <td className="px-3 py-1.5 capitalize">{item.payment_method.replace('_', ' ')}</td>
                                            <td className="px-3 py-1.5">{item.reference_no || '—'}</td>
                                            <td className="px-3 py-1.5 text-right tabular-nums">{formatTaka(item.amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            payment.post(route('medicine-vendors.make-payment'), {
                                onSuccess: () => {
                                    setShowPayment(false);
                                    payment.reset('amount', 'reference_no', 'description', 'allocated_transactions');
                                },
                            });
                        }}
                        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white"
                    >
                        <div className="border-b border-slate-200 px-4 py-2.5">
                            <h2 className="text-[14px] font-semibold">Pay {vendor.name}</h2>
                            <p className="text-[11px] text-slate-500">Payable {formatTaka(payable)}</p>
                        </div>
                        <div className="space-y-2.5 px-4 py-3">
                            <label className="block text-[11px] font-medium text-slate-600">
                                Bill
                                <select
                                    value={payment.data.allocated_transactions[0] ?? ''}
                                    onChange={(event) => {
                                        const bill = openBills.find((item) => item.id === Number(event.target.value));
                                        payment.setData({
                                            ...payment.data,
                                            amount: moneyAmount(bill?.due_amount ?? vendor.current_balance).toString(),
                                            description: bill ? `Payment for bill ${bill.transaction_no}` : `Payment to ${vendor.name}`,
                                            allocated_transactions: bill ? [bill.id] : [],
                                        });
                                    }}
                                    className={`${fieldClass} mt-1`}
                                >
                                    <option value="">Vendor balance</option>
                                    {openBills.map((bill) => (
                                        <option key={bill.id} value={bill.id}>
                                            {bill.transaction_no} · {formatTaka(bill.due_amount)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-[11px] font-medium text-slate-600">
                                Amount
                                <input
                                    type="number"
                                    min="1"
                                    max={payable}
                                    step="0.01"
                                    value={payment.data.amount}
                                    onChange={(event) => payment.setData('amount', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                    required
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block text-[11px] font-medium text-slate-600">
                                    Date
                                    <input
                                        type="date"
                                        value={payment.data.payment_date}
                                        onChange={(event) => payment.setData('payment_date', event.target.value)}
                                        className={`${fieldClass} mt-1`}
                                        required
                                    />
                                </label>
                                <label className="block text-[11px] font-medium text-slate-600">
                                    Method
                                    <select
                                        value={payment.data.payment_method}
                                        onChange={(event) => payment.setData('payment_method', event.target.value)}
                                        className={`${fieldClass} mt-1`}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_banking">Mobile banking</option>
                                    </select>
                                </label>
                            </div>
                            <label className="block text-[11px] font-medium text-slate-600">
                                Reference
                                <input
                                    value={payment.data.reference_no}
                                    onChange={(event) => payment.setData('reference_no', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                />
                            </label>
                            <label className="block text-[11px] font-medium text-slate-600">
                                Description
                                <input
                                    value={payment.data.description}
                                    onChange={(event) => payment.setData('description', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                    required
                                />
                            </label>
                            {payment.errors.amount && <p className="text-[11px] text-red-600">{payment.errors.amount}</p>}
                        </div>
                        <div className="flex justify-end gap-1.5 border-t border-slate-200 px-4 py-2.5">
                            <button
                                type="button"
                                onClick={() => setShowPayment(false)}
                                className="h-7 rounded border border-slate-300 px-2.5 text-[12px]"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={payment.processing} className="h-7 rounded bg-slate-800 px-2.5 text-[12px] text-white">
                                Save payment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showAdjust && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            adjust.post(route('medicine-vendors.adjust-balance'), {
                                onSuccess: () => {
                                    setShowAdjust(false);
                                    adjust.reset('amount', 'reason');
                                },
                            });
                        }}
                        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white"
                    >
                        <div className="border-b border-slate-200 px-4 py-2.5">
                            <h2 className="text-[14px] font-semibold">Adjust balance</h2>
                        </div>
                        <div className="space-y-2.5 px-4 py-3">
                            <label className="block text-[11px] font-medium text-slate-600">
                                Type
                                <select
                                    value={adjust.data.adjustment_type}
                                    onChange={(event) => adjust.setData('adjustment_type', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                >
                                    <option value="increase">Increase due</option>
                                    <option value="decrease">Decrease due</option>
                                </select>
                            </label>
                            <label className="block text-[11px] font-medium text-slate-600">
                                Amount
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={adjust.data.amount}
                                    onChange={(event) => adjust.setData('amount', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                    required
                                />
                            </label>
                            <label className="block text-[11px] font-medium text-slate-600">
                                Reason
                                <input
                                    value={adjust.data.reason}
                                    onChange={(event) => adjust.setData('reason', event.target.value)}
                                    className={`${fieldClass} mt-1`}
                                    required
                                />
                            </label>
                        </div>
                        <div className="flex justify-end gap-1.5 border-t border-slate-200 px-4 py-2.5">
                            <button
                                type="button"
                                onClick={() => setShowAdjust(false)}
                                className="h-7 rounded border border-slate-300 px-2.5 text-[12px]"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={adjust.processing} className="h-7 rounded bg-slate-800 px-2.5 text-[12px] text-white">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
