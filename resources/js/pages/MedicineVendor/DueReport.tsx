import AdminLayout from '@/layouts/admin-layout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Eye, Filter, RefreshCw, Search, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import VendorTabs from './VendorTabs';

interface VendorTransaction {
    id: number;
    transaction_no: string;
    amount: number;
    due_amount: number;
    transaction_date: string;
    purchase_date?: string | null;
    due_date: string;
    description: string;
    payment_status: 'pending' | 'partial' | 'paid';
    days_overdue: number;
}

interface VendorWithDues {
    id: number;
    name: string;
    company_name?: string;
    current_balance: number;
    credit_limit: number;
    period_due: number;
    overdue_amount: number;
    transactions: VendorTransaction[];
}

interface AgingAnalysis {
    current: number;
    '1_30_days': number;
    '31_60_days': number;
    '61_90_days': number;
    over_90_days: number;
}

interface DueReportProps {
    vendorsWithDues: VendorWithDues[];
    filters: {
        date_from: string;
        date_to: string;
    };
    summary: {
        total_dues: number;
        total_overdue: number;
        vendor_count: number;
    };
    agingAnalysis: AgingAnalysis;
}

export default function DueReport({ vendorsWithDues, filters, summary, agingAnalysis }: DueReportProps) {
    const [dateRange, setDateRange] = useState({ from: filters.date_from, to: filters.date_to });

    useEffect(() => {
        setDateRange({ from: filters.date_from, to: filters.date_to });
    }, [filters.date_from, filters.date_to]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('due_amount');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorWithDues | null>(null);
    const [openVendorId, setOpenVendorId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        vendor_id: '',
        amount: '',
        payment_method: 'cash',
        reference_no: '',
        payment_date: new Date().toISOString().slice(0, 10),
        description: '',
        allocated_transactions: [] as number[],
    });

    const formatCurrency = (amount: number | string | null | undefined) => formatTaka(amount);

    const formatDate = (date?: string | null) => {
        if (!date) {
            return '—';
        }

        const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
        const parsed = new Date(calendarDate ? `${date}T00:00:00` : date);

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

    const getDaysOverdue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getOverdueStatus = (days: number) => {
        if (days <= 0) return { label: 'Current', color: 'text-green-600 bg-green-100' };
        if (days <= 30) return { label: `${days}d overdue`, color: 'text-yellow-600 bg-yellow-100' };
        if (days <= 60) return { label: `${days}d overdue`, color: 'text-orange-600 bg-orange-100' };
        return { label: `${days}d overdue`, color: 'text-red-600 bg-red-100' };
    };

    const safeVendorsWithDues = Array.isArray(vendorsWithDues) ? vendorsWithDues : [];
    const query = searchTerm.trim().toLowerCase();
    const filteredVendors = safeVendorsWithDues
        .map((vendor) => {
            const nameMatch = vendor.name.toLowerCase().includes(query) || (vendor.company_name?.toLowerCase().includes(query) ?? false);
            const matchingBills = vendor.transactions.filter((transaction) => transaction.transaction_no.toLowerCase().includes(query));

            if (query === '') {
                return vendor;
            }

            if (matchingBills.length > 0) {
                return { ...vendor, transactions: matchingBills };
            }

            return nameMatch ? vendor : null;
        })
        .filter((vendor): vendor is VendorWithDues => vendor !== null)
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'due_amount':
                    return moneyAmount(b.period_due) - moneyAmount(a.period_due);
                case 'overdue_amount':
                    return moneyAmount(b.overdue_amount) - moneyAmount(a.overdue_amount);
                default:
                    return 0;
            }
        });

    useEffect(() => {
        if (query === '') {
            return;
        }

        const match = filteredVendors.find((vendor) =>
            vendor.transactions.some((transaction) => transaction.transaction_no.toLowerCase().includes(query)),
        );

        if (match) {
            setOpenVendorId(match.id);
        }
    }, [query, vendorsWithDues]);

    const handleDateRangeChange = async () => {
        setIsLoading(true);
        router.get(
            route('medicine-vendors.due-report'),
            {
                date_from: dateRange.from,
                date_to: dateRange.to,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-vendors.make-payment'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                setSelectedVendor(null);
                reset();
            },
        });
    };

    const openPaymentModal = (vendor: VendorWithDues, bill?: VendorTransaction) => {
        setSelectedVendor(vendor);
        setData({
            vendor_id: vendor.id.toString(),
            amount: moneyAmount(bill?.due_amount ?? vendor.current_balance).toString(),
            payment_method: 'cash',
            reference_no: '',
            payment_date: new Date().toISOString().slice(0, 10),
            description: bill ? `Payment for bill ${bill.transaction_no}` : `Payment to ${vendor.name} for outstanding dues`,
            allocated_transactions: bill ? [bill.id] : [],
        });
        setShowPaymentModal(true);
    };

    const exportReport = (format: string) => {
        router.get(route('medicine-vendors.export-report'), {
            type: 'due_report',
            format,
            date_from: dateRange.from,
            date_to: dateRange.to,
        });
    };

    return (
        <AdminLayout>
            <Head title="Vendor Due Report" />

            <div className="mx-auto max-w-6xl space-y-3">
                <VendorTabs current="dues" />
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Vendor dues</h1>
                        <p className="text-[12px] text-slate-500">
                            {filters.date_from || filters.date_to
                                ? `Open bills from ${formatDate(filters.date_from)} to ${formatDate(filters.date_to)}`
                                : 'All open bills'}
                        </p>
                    </div>
                    <select
                        onChange={(e) => exportReport(e.target.value)}
                        className="h-7 rounded border border-slate-300 bg-white px-2 text-[12px]"
                        defaultValue=""
                    >
                        <option value="" disabled>
                            Export
                        </option>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleDateRangeChange();
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <span className="text-[12px] text-slate-400">to</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <div className="relative min-w-[180px] flex-1">
                        <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Vendor or bill no"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-7 w-full rounded border border-slate-300 pr-2 pl-7 text-[12px]"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    >
                        <option value="due_amount">Due</option>
                        <option value="overdue_amount">Overdue</option>
                        <option value="name">Name</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700 disabled:bg-slate-400"
                    >
                        {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
                        Show
                    </button>
                    {(dateRange.from || dateRange.to) && (
                        <button
                            type="button"
                            onClick={() => {
                                setDateRange({ from: '', to: '' });
                                setIsLoading(true);
                                router.get(route('medicine-vendors.due-report'), {}, { preserveScroll: true, onFinish: () => setIsLoading(false) });
                            }}
                            className="h-7 rounded border border-slate-300 px-2 text-[12px] text-slate-700 hover:bg-slate-50"
                        >
                            All dates
                        </button>
                    )}
                </form>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 overflow-hidden rounded border border-slate-200 bg-white md:grid-cols-4">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Outstanding</p>
                        <p className="text-[13px] font-semibold text-red-700 tabular-nums">{formatCurrency(summary.total_dues)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Overdue</p>
                        <p className="text-[13px] font-semibold text-orange-700 tabular-nums">{formatCurrency(summary.total_overdue)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Vendors</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{summary.vendor_count}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Average due</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(summary.vendor_count > 0 ? moneyAmount(summary.total_dues) / summary.vendor_count : 0)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-5 overflow-hidden rounded border border-slate-200 bg-white">
                    {[
                        ['Current', agingAnalysis.current],
                        ['1–30d', agingAnalysis['1_30_days']],
                        ['31–60d', agingAnalysis['31_60_days']],
                        ['61–90d', agingAnalysis['61_90_days']],
                        ['90d+', agingAnalysis.over_90_days],
                    ].map(([label, value], index) => (
                        <div key={String(label)} className={`px-3 py-1.5 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
                            <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
                            <p className="text-[12px] font-semibold text-slate-900 tabular-nums">{formatCurrency(Number(value))}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="w-8 px-2 py-1.5" />
                                <th className="px-3 py-1.5 font-medium">Vendor</th>
                                <th className="px-3 py-1.5 text-right font-medium">Due</th>
                                <th className="px-3 py-1.5 text-right font-medium">Overdue</th>
                                <th className="px-3 py-1.5 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-slate-500">
                                        No outstanding bills.
                                    </td>
                                </tr>
                            )}
                            {filteredVendors.map((vendor) => {
                                const open = openVendorId === vendor.id;

                                return (
                                    <React.Fragment key={vendor.id}>
                                        <tr className="border-t border-slate-100 text-slate-800">
                                            <td className="px-2 py-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenVendorId(open ? null : vendor.id)}
                                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                    title="Bills"
                                                >
                                                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                </button>
                                            </td>
                                            <td className="px-3 py-1.5">
                                                <p className="font-medium text-slate-900">{vendor.name}</p>
                                                {vendor.company_name && <p className="text-[11px] text-slate-500">{vendor.company_name}</p>}
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-medium text-red-700 tabular-nums">
                                                {formatCurrency(vendor.period_due)}
                                            </td>
                                            <td className="px-3 py-1.5 text-right text-orange-700 tabular-nums">
                                                {formatCurrency(vendor.overdue_amount)}
                                            </td>
                                            <td className="px-3 py-1.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.visit(route('medicine-vendors.show', vendor.id))}
                                                        className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openPaymentModal(vendor)}
                                                        className="inline-flex h-6 items-center rounded bg-slate-800 px-1.5 text-[11px] text-white hover:bg-slate-700"
                                                    >
                                                        Pay
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {open && (
                                            <tr className="border-t border-slate-100 bg-slate-50">
                                                <td colSpan={5} className="px-3 py-1.5">
                                                    {vendor.transactions.length === 0 ? (
                                                        <p className="text-[11px] text-slate-500">No open bills in this date range.</p>
                                                    ) : (
                                                        <table className="w-full text-[11px]">
                                                            <thead className="text-slate-500">
                                                                <tr>
                                                                    <th className="py-1 text-left font-medium">Bill</th>
                                                                    <th className="py-1 text-left font-medium">Purchase date</th>
                                                                    <th className="py-1 text-left font-medium">Due date</th>
                                                                    <th className="py-1 text-right font-medium">Due</th>
                                                                    <th className="py-1 text-left font-medium">Status</th>
                                                                    <th className="py-1 text-right font-medium">Pay</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {vendor.transactions.map((transaction) => {
                                                                    const daysOverdue = transaction.due_date
                                                                        ? getDaysOverdue(transaction.due_date)
                                                                        : 0;
                                                                    const status = getOverdueStatus(daysOverdue);

                                                                    return (
                                                                        <tr key={transaction.id} className="border-t border-slate-200">
                                                                            <td className="py-1 text-slate-800">{transaction.transaction_no}</td>
                                                                            <td className="py-1 whitespace-nowrap">
                                                                                {formatDate(
                                                                                    transaction.purchase_date || transaction.transaction_date,
                                                                                )}
                                                                            </td>
                                                                            <td className="py-1 whitespace-nowrap">
                                                                                {formatDate(transaction.due_date)}
                                                                            </td>
                                                                            <td className="py-1 text-right tabular-nums">
                                                                                {formatCurrency(transaction.due_amount)}
                                                                            </td>
                                                                            <td className="py-1">
                                                                                <span
                                                                                    className={`rounded px-1 py-0.5 text-[10px] font-medium ${status.color}`}
                                                                                >
                                                                                    {status.label}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1 text-right">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openPaymentModal(vendor, transaction)}
                                                                                    className="inline-flex h-6 items-center rounded bg-slate-800 px-1.5 text-[11px] text-white hover:bg-slate-700"
                                                                                >
                                                                                    Pay bill
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                        <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                                <h2 className="text-[14px] font-semibold text-slate-900">Pay {selectedVendor?.name}</h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedVendor(null);
                                        reset();
                                    }}
                                    className="text-slate-400 hover:text-slate-700"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-2.5 px-4 py-3">
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Bill</label>
                                    <select
                                        value={data.allocated_transactions[0] ?? ''}
                                        onChange={(event) => {
                                            const billId = Number(event.target.value);
                                            const bill = selectedVendor.transactions.find((transaction) => transaction.id === billId);

                                            if (!bill) {
                                                setData({
                                                    ...data,
                                                    amount: moneyAmount(selectedVendor.current_balance).toString(),
                                                    description: `Payment to ${selectedVendor.name} for outstanding dues`,
                                                    allocated_transactions: [],
                                                });

                                                return;
                                            }

                                            setData({
                                                ...data,
                                                amount: moneyAmount(bill.due_amount).toString(),
                                                description: `Payment for bill ${bill.transaction_no}`,
                                                allocated_transactions: [bill.id],
                                            });
                                        }}
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-[12px]"
                                    >
                                        <option value="">Vendor balance</option>
                                        {selectedVendor.transactions.map((transaction) => (
                                            <option key={transaction.id} value={transaction.id}>
                                                {transaction.transaction_no} · {formatCurrency(transaction.due_amount)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-[12px]"
                                        max={
                                            data.allocated_transactions.length > 0
                                                ? moneyAmount(
                                                      selectedVendor.transactions.find(
                                                          (transaction) => transaction.id === data.allocated_transactions[0],
                                                      )?.due_amount,
                                                  )
                                                : moneyAmount(selectedVendor.current_balance)
                                        }
                                    />
                                    {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Method</label>
                                    <select
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-[12px]"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="mobile_banking">Mobile Banking</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Payment date</label>
                                    <input
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-[12px]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Reference</label>
                                    <input
                                        type="text"
                                        value={data.reference_no}
                                        onChange={(e) => setData('reference_no', e.target.value)}
                                        className="h-7 w-full rounded border border-slate-300 px-2 text-[12px]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Note</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={2}
                                        className="w-full rounded border border-slate-300 px-2 py-1 text-[12px]"
                                    />
                                    {errors.description && <p className="mt-1 text-[11px] text-red-600">{errors.description}</p>}
                                </div>

                                <div className="grid grid-cols-3 gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px]">
                                    <div>
                                        <p className="text-slate-500">Due</p>
                                        <p className="font-medium text-red-700 tabular-nums">
                                            {formatCurrency(
                                                data.allocated_transactions.length > 0
                                                    ? selectedVendor.transactions.find(
                                                          (transaction) => transaction.id === data.allocated_transactions[0],
                                                      )?.due_amount
                                                    : selectedVendor.current_balance,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Paying</p>
                                        <p className="font-medium tabular-nums">{formatCurrency(moneyAmount(data.amount))}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Left</p>
                                        <p className="font-medium tabular-nums">
                                            {formatCurrency(
                                                Math.max(
                                                    0,
                                                    moneyAmount(
                                                        data.allocated_transactions.length > 0
                                                            ? selectedVendor.transactions.find(
                                                                  (transaction) => transaction.id === data.allocated_transactions[0],
                                                              )?.due_amount
                                                            : selectedVendor.current_balance,
                                                    ) - moneyAmount(data.amount),
                                                ),
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setSelectedVendor(null);
                                            reset();
                                        }}
                                        className="h-7 rounded border border-slate-300 px-2.5 text-[12px] text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700 disabled:bg-slate-400"
                                    >
                                        {processing ? 'Saving...' : 'Save payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
