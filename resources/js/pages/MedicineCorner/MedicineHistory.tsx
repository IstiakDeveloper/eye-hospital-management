import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface MedicineSummary {
    id: number;
    name: string;
    generic_name?: string | null;
    manufacturer?: string | null;
    unit: string;
}

interface PurchaseRow {
    id: number;
    purchase_date: string | null;
    batch_number: string;
    vendor_name?: string | null;
    quantity: number;
    buy_price: number;
    total_amount: number;
    entered_by?: string | null;
    was_updated: boolean;
    bill_no?: string | null;
    payment_status?: 'paid' | 'partial' | 'pending' | null;
    paid_amount?: number | null;
    due_amount?: number | null;
}

interface Summary {
    purchase_count: number;
    total_quantity: number;
    total_amount: number;
}

interface MedicineHistoryProps {
    medicine: MedicineSummary;
    filters: {
        from_date: string;
        to_date: string;
    };
    summary: Summary;
    purchases: PurchaseRow[];
}

function money(amount: number): string {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return '৳0.00';
    }

    return `৳${new Intl.NumberFormat('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)}`;
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function paymentLabel(purchase: PurchaseRow): string {
    if (purchase.payment_status === 'paid') {
        return 'Paid';
    }

    if (purchase.payment_status === 'partial') {
        return `Partial · due ${money(purchase.due_amount ?? 0)}`;
    }

    if (purchase.payment_status === 'pending') {
        return 'Due';
    }

    return '—';
}

function quantityLabel(quantity: number, unit: string): string {
    const value = Number(quantity);

    if (!Number.isFinite(value)) {
        return `0 ${unit}`;
    }

    return `${value.toLocaleString('en-BD')} ${unit}`;
}

export default function MedicineHistory({ medicine, filters, summary, purchases }: MedicineHistoryProps) {
    const { errors } = usePage().props as { errors?: Record<string, string> };
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);

    const showHistory = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            route('medicine-corner.medicine-history', medicine.id),
            { from_date: fromDate, to_date: toDate },
            { preserveScroll: true, replace: true },
        );
    };

    const subtitle = [medicine.generic_name, medicine.manufacturer].filter(Boolean).join(' · ');

    return (
        <AdminLayout>
            <Head title={`${medicine.name} purchase history`} />

            <div className="mx-auto max-w-6xl space-y-3 print:max-w-none">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <Link
                            href="/medicine-corner/medicines"
                            className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-800 print:hidden"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Medicine List
                        </Link>
                        <h1 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-slate-900">{medicine.name}</h1>
                        <p className="text-[12px] text-slate-500">
                            Purchase history{subtitle ? ` · ${subtitle}` : ''} · Unit {medicine.unit}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-[12px] text-slate-700 hover:bg-slate-50 print:hidden"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                    </button>
                </div>

                <form
                    onSubmit={showHistory}
                    className="flex flex-wrap items-end gap-2 rounded border border-slate-200 bg-white px-3 py-2 print:hidden"
                >
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => setFromDate(event.target.value)}
                            className="h-7 rounded border border-slate-300 px-2 text-[12px] text-slate-800"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(event) => setToDate(event.target.value)}
                            className="h-7 rounded border border-slate-300 px-2 text-[12px] text-slate-800"
                        />
                    </label>
                    <button type="submit" className="h-7 rounded bg-slate-800 px-3 text-[12px] font-medium text-white hover:bg-slate-700">
                        Show
                    </button>
                    {(errors?.from_date || errors?.to_date) && (
                        <p className="w-full text-[12px] text-red-600">{errors.from_date || errors.to_date}</p>
                    )}
                </form>

                <div className="grid grid-cols-3 overflow-hidden rounded border border-slate-200 bg-white">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Purchases</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{summary.purchase_count}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Quantity bought</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
                            {quantityLabel(summary.total_quantity, medicine.unit)}
                        </p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Purchase amount</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{money(summary.total_amount)}</p>
                    </div>
                </div>

                <p className="text-[11px] text-slate-500">
                    {formatDate(filters.from_date)} – {formatDate(filters.to_date)}. This list is purchased quantity only. Stock on hand is unchanged
                    by opening this page.
                </p>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">Date</th>
                                <th className="px-3 py-1.5 font-medium">Batch</th>
                                <th className="px-3 py-1.5 font-medium">Vendor</th>
                                <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                                <th className="px-3 py-1.5 text-right font-medium">Rate</th>
                                <th className="px-3 py-1.5 text-right font-medium">Amount</th>
                                <th className="px-3 py-1.5 font-medium">Bill</th>
                                <th className="px-3 py-1.5 font-medium">Payment</th>
                                <th className="px-3 py-1.5 font-medium">Entered by</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-[12px] text-slate-500">
                                        No purchases in this date range.
                                    </td>
                                </tr>
                            )}
                            {purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-t border-slate-100 text-slate-800">
                                    <td className="px-3 py-1.5 whitespace-nowrap">
                                        {formatDate(purchase.purchase_date)}
                                        {purchase.was_updated && (
                                            <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                                                Updated
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">{purchase.batch_number}</td>
                                    <td className="px-3 py-1.5">{purchase.vendor_name || '—'}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{quantityLabel(purchase.quantity, medicine.unit)}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{money(purchase.buy_price)}</td>
                                    <td className="px-3 py-1.5 text-right font-medium tabular-nums">{money(purchase.total_amount)}</td>
                                    <td className="px-3 py-1.5 whitespace-nowrap">{purchase.bill_no || '—'}</td>
                                    <td
                                        className={`px-3 py-1.5 whitespace-nowrap ${
                                            purchase.payment_status === 'paid'
                                                ? 'text-green-700'
                                                : purchase.payment_status === 'pending'
                                                  ? 'text-red-700'
                                                  : purchase.payment_status === 'partial'
                                                    ? 'text-amber-700'
                                                    : ''
                                        }`}
                                    >
                                        {paymentLabel(purchase)}
                                    </td>
                                    <td className="px-3 py-1.5">{purchase.entered_by || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                        {purchases.length > 0 && (
                            <tfoot className="border-t border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-900">
                                <tr>
                                    <td className="px-3 py-1.5" colSpan={3}>
                                        Total
                                    </td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{quantityLabel(summary.total_quantity, medicine.unit)}</td>
                                    <td className="px-3 py-1.5" />
                                    <td className="px-3 py-1.5 text-right tabular-nums">{money(summary.total_amount)}</td>
                                    <td className="px-3 py-1.5" colSpan={3} />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
