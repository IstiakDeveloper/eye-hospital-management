import AdminLayout from '@/layouts/HospitalAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface DailyRow {
    date: string;
    fund_in: number;
    income: number;
    fund_out: number;
    expense: number;
    total_credit: number;
    total_debit: number;
    balance: number;
}

interface Totals {
    fund_in: number;
    income: number;
    fund_out: number;
    expense: number;
    total_credit: number;
    total_debit: number;
}

interface Props {
    rows: DailyRow[];
    totals: Totals;
    openingBalance: number;
    filters: {
        from_date: string;
        to_date: string;
    };
}

export default function DailyStatement({ rows, totals, openingBalance, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);

    const handleFilter = () => {
        router.get(
            route('reports.daily-statement'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true }
        );
    };

    return (
        <AdminLayout>
            <Head title="Hospital Daily Statement" />
            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="flex items-end gap-2">
                                <button onClick={handleFilter} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Filter</button>
                                <button onClick={() => window.print()} className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 print:hidden">Print</button>
                            </div>
                        </div>
                    </div>
                    <div className="print-area bg-white p-8 rounded-lg shadow-lg dark:bg-gray-900 print:shadow-none print:p-0">
                        <div className="print-header mb-6 border-b pb-4 text-center print:border-none">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white print:text-2xl">Hospital Daily Statement</h1>
                            <p className="mt-2 text-lg text-gray-700 dark:text-gray-300 print:text-base">Period: {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 print:text-xs">Printed on: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 print:text-xs print:border-black">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 print:bg-white">
                                        <th className="border border-gray-300 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:text-gray-300 print:border-black print:py-1">Date</th>
                                        <th className="border border-gray-300 bg-green-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Fund In</th>
                                        <th className="border border-gray-300 bg-green-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Income</th>
                                        <th className="border border-gray-300 bg-green-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Total Credit</th>
                                        <th className="border border-gray-300 bg-red-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Fund Out</th>
                                        <th className="border border-gray-300 bg-red-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Expense</th>
                                        <th className="border border-gray-300 bg-red-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Total Debit</th>
                                        <th className="border border-gray-300 bg-blue-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-blue-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-blue-50 font-semibold dark:bg-blue-900/20 print:bg-white">
                                        <td className="border border-gray-300 px-4 py-2 text-center dark:border-gray-600 print:border-black print:py-1" colSpan={7}>Opening Balance</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600 print:border-black print:py-1">৳{openingBalance.toFixed(2)}</td>
                                    </tr>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 print:bg-white">
                                            <td className="border border-gray-300 px-4 py-2 text-center text-sm dark:border-gray-600 dark:text-gray-300 print:border-black print:py-1">{new Date(row.date).toLocaleDateString()}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black print:py-1">{row.fund_in > 0 ? `৳${row.fund_in.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black print:py-1">{row.income > 0 ? `৳${row.income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-green-50 px-4 py-2 text-right text-sm font-semibold text-green-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-green-400 print:bg-white print:border-black print:py-1">{row.total_credit > 0 ? `৳${row.total_credit.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black print:py-1">{row.fund_out > 0 ? `৳${row.fund_out.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black print:py-1">{row.expense > 0 ? `৳${row.expense.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-red-50 px-4 py-2 text-right text-sm font-semibold text-red-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-red-400 print:bg-white print:border-black print:py-1">{row.total_debit > 0 ? `৳${row.total_debit.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-blue-50 px-4 py-2 text-right text-sm font-bold text-blue-700 dark:border-gray-600 dark:bg-blue-900/20 dark:text-blue-400 print:bg-white print:border-black print:py-1">৳{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200 font-bold dark:bg-gray-700 print:bg-white">
                                        <td className="border border-gray-300 px-4 py-2 text-center dark:border-gray-600 print:border-black print:py-1">TOTAL</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black print:py-1">৳{totals.fund_in.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black print:py-1">৳{totals.income.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-green-100 px-4 py-2 text-right text-green-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-green-400 print:bg-white print:border-black print:py-1">৳{totals.total_credit.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black print:py-1">৳{totals.fund_out.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black print:py-1">৳{totals.expense.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-red-100 px-4 py-2 text-right text-red-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-red-400 print:bg-white print:border-black print:py-1">৳{totals.total_debit.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-blue-100 px-4 py-2 text-right dark:border-gray-600 dark:bg-blue-900/30 print:bg-white print:border-black print:py-1"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
