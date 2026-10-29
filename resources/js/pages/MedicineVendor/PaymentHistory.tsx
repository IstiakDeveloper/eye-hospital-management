import AdminLayout from '@/layouts/admin-layout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Filter, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import VendorTabs from './VendorTabs';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface VendorPayment {
    id: number;
    payment_no: string;
    amount: number | string;
    payment_method: string;
    reference_no?: string;
    payment_date: string;
    description: string;
    vendor: Vendor;
    created_by: {
        name: string;
    };
    allocated_transactions?: number[];
}

interface PaymentHistoryProps {
    payments: {
        data: VendorPayment[];
        links: any[];
        meta: any;
    };
    vendors: Vendor[];
    filters: {
        date_from: string;
        date_to: string;
        vendor_id?: string;
        payment_method?: string;
    };
    totalPayments: number | string;
}

export default function PaymentHistory({ payments, vendors, filters, totalPayments }: PaymentHistoryProps) {
    const [searchFilters, setSearchFilters] = useState({
        date_from: filters.date_from,
        date_to: filters.date_to,
        vendor_id: filters.vendor_id || '',
        payment_method: filters.payment_method || '',
        search: '',
    });

    const [sortBy, setSortBy] = useState('payment_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isLoading, setIsLoading] = useState(false);

    const formatCurrency = (amount: number | string | null | undefined) => formatTaka(amount);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getPaymentMethodBadge = (method: string) => {
        const methodConfig = {
            cash: { color: 'bg-green-100 text-green-800', label: 'Cash' },
            bank_transfer: { color: 'bg-blue-100 text-blue-800', label: 'Bank Transfer' },
            cheque: { color: 'bg-purple-100 text-purple-800', label: 'Cheque' },
            mobile_banking: { color: 'bg-orange-100 text-orange-800', label: 'Mobile Banking' },
        };

        const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.cash;

        return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}>{config.label}</span>;
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const applyFilters = async () => {
        setIsLoading(true);
        router.get(
            route('medicine-vendors.payment-history'),
            {
                ...searchFilters,
                sort_by: sortBy,
                sort_order: sortOrder,
            },
            {
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const exportPayments = (format: string) => {
        router.get(route('medicine-vendors.export-report'), {
            type: 'payment_history',
            format,
            ...searchFilters,
        });
    };

    // Calculate summary statistics
    const currentPageTotal = payments.data.reduce((sum, payment) => sum + moneyAmount(payment.amount), 0);

    const paymentMethodStats = payments.data.reduce(
        (acc, payment) => {
            const validAmount = moneyAmount(payment.amount);
            acc[payment.payment_method] = (acc[payment.payment_method] || 0) + validAmount;
            return acc;
        },
        {} as Record<string, number>,
    );

    const visiblePayments = [...payments.data]
        .filter((payment) => {
            const query = searchFilters.search.trim().toLowerCase();
            if (query === '') {
                return true;
            }

            return (
                payment.payment_no.toLowerCase().includes(query) ||
                payment.vendor.name.toLowerCase().includes(query) ||
                (payment.description || '').toLowerCase().includes(query)
            );
        })
        .sort((left, right) => {
            const direction = sortOrder === 'asc' ? 1 : -1;

            if (sortBy === 'amount') {
                return (moneyAmount(left.amount) - moneyAmount(right.amount)) * direction;
            }

            if (sortBy === 'payment_no') {
                return left.payment_no.localeCompare(right.payment_no) * direction;
            }

            return left.payment_date.localeCompare(right.payment_date) * direction;
        });

    const topPaymentMethod = Object.entries(paymentMethodStats).sort((a, b) => b[1] - a[1])[0];

    return (
        <AdminLayout>
            <Head title="Payment History" />

            <div className="mx-auto max-w-6xl space-y-3">
                <VendorTabs current="payments" />
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Payments</h1>
                        <p className="text-[12px] text-slate-500">Vendor payments for the selected dates</p>
                    </div>
                    <select
                        onChange={(e) => exportPayments(e.target.value)}
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

                <div className="grid grid-cols-2 overflow-hidden rounded border border-slate-200 bg-white md:grid-cols-4">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Period total</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatCurrency(totalPayments)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">This page</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatCurrency(currentPageTotal)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Payments</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{payments.meta?.total || payments.data.length}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Top method</p>
                        <p className="text-[13px] font-semibold text-slate-900 capitalize">
                            {topPaymentMethod ? topPaymentMethod[0].replaceAll('_', ' ') : '—'}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        applyFilters();
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <input
                        type="date"
                        value={searchFilters.date_from}
                        onChange={(e) => setSearchFilters({ ...searchFilters, date_from: e.target.value })}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <span className="text-[12px] text-slate-400">to</span>
                    <input
                        type="date"
                        value={searchFilters.date_to}
                        onChange={(e) => setSearchFilters({ ...searchFilters, date_to: e.target.value })}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <select
                        value={searchFilters.vendor_id}
                        onChange={(e) => setSearchFilters({ ...searchFilters, vendor_id: e.target.value })}
                        className="h-7 max-w-[180px] rounded border border-slate-300 px-2 text-[12px]"
                    >
                        <option value="">All vendors</option>
                        {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={searchFilters.payment_method}
                        onChange={(e) => setSearchFilters({ ...searchFilters, payment_method: e.target.value })}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    >
                        <option value="">All methods</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank</option>
                        <option value="cheque">Cheque</option>
                        <option value="mobile_banking">Mobile</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search this page"
                        value={searchFilters.search}
                        onChange={(e) => setSearchFilters({ ...searchFilters, search: e.target.value })}
                        className="h-7 min-w-[140px] flex-1 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700 disabled:bg-slate-400"
                    >
                        {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
                        Show
                    </button>
                </form>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">
                                    <button type="button" onClick={() => handleSort('payment_date')} className="hover:text-slate-800">
                                        Date
                                    </button>
                                </th>
                                <th className="px-3 py-1.5 font-medium">
                                    <button type="button" onClick={() => handleSort('payment_no')} className="hover:text-slate-800">
                                        Payment
                                    </button>
                                </th>
                                <th className="px-3 py-1.5 font-medium">Vendor</th>
                                <th className="px-3 py-1.5 font-medium">Method</th>
                                <th className="px-3 py-1.5 text-right font-medium">
                                    <button type="button" onClick={() => handleSort('amount')} className="hover:text-slate-800">
                                        Amount
                                    </button>
                                </th>
                                <th className="px-3 py-1.5 font-medium">By</th>
                                <th className="px-3 py-1.5 text-right font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {visiblePayments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-slate-500">
                                        No payments in this range.
                                    </td>
                                </tr>
                            )}
                            {visiblePayments.map((payment) => (
                                <tr key={payment.id} className="border-t border-slate-100 text-slate-800">
                                    <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(payment.payment_date)}</td>
                                    <td className="px-3 py-1.5">
                                        <p className="font-medium text-slate-900">{payment.payment_no}</p>
                                        {payment.reference_no && <p className="text-[11px] text-slate-500">{payment.reference_no}</p>}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <p>{payment.vendor.name}</p>
                                        {payment.vendor.company_name && <p className="text-[11px] text-slate-500">{payment.vendor.company_name}</p>}
                                    </td>
                                    <td className="px-3 py-1.5">{getPaymentMethodBadge(payment.payment_method)}</td>
                                    <td className="px-3 py-1.5 text-right font-medium tabular-nums">{formatCurrency(payment.amount)}</td>
                                    <td className="px-3 py-1.5 text-slate-600">{payment.created_by?.name ?? '—'}</td>
                                    <td className="px-3 py-1.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('medicine-vendors.show', payment.vendor.id))}
                                            className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {payments.data.length > 0 && payments.meta && payments.meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-600">
                            <span>
                                {payments.meta?.from || 0}–{payments.meta?.to || 0} of {payments.meta?.total || 0}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevLink = payments.links?.find((link) => link.label === '&laquo; Previous');
                                        if (prevLink?.url) {
                                            router.get(prevLink.url);
                                        }
                                    }}
                                    disabled={!payments.links?.find((link) => link.label === '&laquo; Previous')?.url}
                                    className="inline-flex h-6 items-center rounded border border-slate-300 px-1.5 disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                {payments.links?.slice(1, -1).map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`h-6 min-w-6 rounded px-1.5 ${link.active ? 'bg-slate-800 text-white' : 'border border-slate-300'}`}
                                    >
                                        {link.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextLink = payments.links?.find((link) => link.label === 'Next &raquo;');
                                        if (nextLink?.url) {
                                            router.get(nextLink.url);
                                        }
                                    }}
                                    disabled={!payments.links?.find((link) => link.label === 'Next &raquo;')?.url}
                                    className="inline-flex h-6 items-center rounded border border-slate-300 px-1.5 disabled:opacity-40"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
