import AdminLayout from '@/layouts/MainAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Row {
    month: string; // YYYY-MM
    label: string; // e.g. Mar 2026
    opening_due: number;
    this_month_due: number;
    due_cash_received: number;
    closing_due: number;
}

interface Props {
    rows: Row[];
    filters: {
        from_month: string; // YYYY-MM
        to_month: string; // YYYY-MM
        months: number;
    };
}

export default function OpticsDueMonthlyLedger({ rows, filters }: Props) {
    const [fromMonth, setFromMonth] = useState(filters.from_month);
    const [toMonth, setToMonth] = useState(filters.to_month);
    const [months, setMonths] = useState(String(filters.months ?? 5));

    const totals = useMemo(() => {
        const sum = (k: keyof Row) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
        return {
            opening_due: sum('opening_due'),
            this_month_due: sum('this_month_due'),
            due_cash_received: sum('due_cash_received'),
            closing_due: rows.length ? rows[rows.length - 1].closing_due : 0,
        };
    }, [rows]);

    const handleFilter = () => {
        router.get(
            route('optics.reports.optics-due-ledger'),
            {
                from_month: fromMonth || undefined,
                to_month: toMonth || undefined,
                months: months || undefined,
            },
            { preserveState: true },
        );
    };

    const fmt = (v: number) => `৳${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <AdminLayout>
            <Head title="Optics Due Monthly Ledger" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row md:items-end md:justify-between print:hidden">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Optics Due Monthly Ledger</h1>
                        <p className="text-sm text-gray-600">Previous due, this month due, due cash received, and closing due.</p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600">From month</label>
                            <input
                                type="month"
                                value={fromMonth}
                                onChange={(e) => setFromMonth(e.target.value)}
                                className="w-40 rounded-md border px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600">To month</label>
                            <input
                                type="month"
                                value={toMonth}
                                onChange={(e) => setToMonth(e.target.value)}
                                className="w-40 rounded-md border px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-600">Default months</label>
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={months}
                                onChange={(e) => setMonths(e.target.value)}
                                className="w-28 rounded-md border px-3 py-2 text-sm"
                            />
                        </div>

                        <button onClick={handleFilter} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                            Apply
                        </button>
                        <button onClick={() => window.print()} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300">
                            Print
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="mb-3 hidden print:block">
                        <div className="text-center">
                            <div className="text-lg font-bold">Optics Due Monthly Ledger</div>
                            <div className="text-sm text-gray-700">
                                Period: {filters.from_month} to {filters.to_month}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border px-3 py-2 text-left">Month</th>
                                    <th className="border px-3 py-2 text-right">Previous Month Due (Opening)</th>
                                    <th className="border px-3 py-2 text-right">This Month Due (Invoices in Month)</th>
                                    <th className="border px-3 py-2 text-right">Due Cash Received (Prev Due Paid)</th>
                                    <th className="border px-3 py-2 text-right">Due Balance (Closing)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.month} className="hover:bg-gray-50">
                                        <td className="border px-3 py-2">{r.label}</td>
                                        <td className="border px-3 py-2 text-right">{fmt(r.opening_due)}</td>
                                        <td className="border px-3 py-2 text-right">{fmt(r.this_month_due)}</td>
                                        <td className="border px-3 py-2 text-right text-green-700">{fmt(r.due_cash_received)}</td>
                                        <td className="border px-3 py-2 text-right font-semibold text-red-700">{fmt(r.closing_due)}</td>
                                    </tr>
                                ))}

                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="border px-3 py-8 text-center text-gray-500">
                                            No data for selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="border px-3 py-2 text-right">TOTAL</td>
                                    <td className="border px-3 py-2 text-right">{fmt(totals.opening_due)}</td>
                                    <td className="border px-3 py-2 text-right">{fmt(totals.this_month_due)}</td>
                                    <td className="border px-3 py-2 text-right text-green-800">{fmt(totals.due_cash_received)}</td>
                                    <td className="border px-3 py-2 text-right text-red-800">{fmt(totals.closing_due)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <style>{`
                    @media print {
                        .print\\:hidden { display: none !important; }
                        .print\\:block { display: block !important; }
                    }
                `}</style>
            </div>
        </AdminLayout>
    );
}

