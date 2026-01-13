import AdminLayout from '@/layouts/HospitalAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface DailyRow {
    date: string;
    // Credit
    fund_in: number;
    medicine_income: number;
    optics_income: number;
    medical_test_income: number;
    opd_income: number;
    operation_income: number;
    other_income: number;
    total_credit: number;
    // Debit
    fund_out: number;
    advance_house_rent: number;
    medicine_purchase: number;
    optics_purchase: number;
    fixed_assets: number;
    other_expenses: number;
    total_debit: number;
    // Balance
    balance: number;
}

interface Totals {
    // Credit
    fund_in: number;
    medicine_income: number;
    optics_income: number;
    medical_test_income: number;
    opd_income: number;
    operation_income: number;
    other_income: number;
    total_credit: number;
    // Debit
    fund_out: number;
    advance_house_rent: number;
    medicine_purchase: number;
    optics_purchase: number;
    fixed_assets: number;
    other_expenses: number;
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
                    <div className="print-area bg-white p-8 rounded-lg shadow-lg dark:bg-gray-900 print:shadow-none print:p-0 report-section">
                        {/* Print Header - Hidden on screen, visible on print */}
                        <div className="print-header-new mb-3">
                            <div className="text-center mb-1">
                                <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <h2 className="text-sm font-bold">Hospital Daily Statement</h2>
                                <p className="text-xs">
                                    Date: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Screen Header - Hidden on print */}
                        <div className="print-header mb-6 border-b pb-4 text-center print:border-none screen-only">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white print:text-2xl">Hospital Daily Statement</h1>
                            <p className="mt-2 text-lg text-gray-700 dark:text-gray-300 print:text-base">Period: {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 print:text-xs">Printed on: {new Date().toLocaleString()}</p>
                        </div>
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 print:text-xs print:border-black">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 print:bg-white">
                                        <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:text-gray-300 print:border-black print:py-1">Date</th>
                                        <th colSpan={8} className="border border-gray-300 bg-green-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Credit</th>
                                        <th colSpan={7} className="border border-gray-300 bg-red-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Debit</th>
                                        <th rowSpan={2} className="border border-gray-300 bg-blue-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-blue-900/30 dark:text-gray-300 print:bg-white print:border-black print:py-1">Balance</th>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-800 print:bg-white">
                                        {/* Credit columns */}
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Fund In</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Medicine Income</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Optics Income</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Medical Test</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">OPD Income</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Operation</th>
                                        <th className="border border-gray-300 bg-green-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300 print:bg-white print:border-black">Others</th>
                                        <th className="border border-gray-300 bg-green-100 px-2 py-1 text-center text-xs font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300 print:bg-white print:border-black">Total</th>
                                        {/* Debit columns */}
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Fund Out</th>
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Advance Rent</th>
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Medicine Purchase</th>
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Optics Purchase</th>
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Fixed Assets</th>
                                        <th className="border border-gray-300 bg-red-50 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300 print:bg-white print:border-black">Others</th>
                                        <th className="border border-gray-300 bg-red-100 px-2 py-1 text-center text-xs font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300 print:bg-white print:border-black">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-blue-50 font-semibold dark:bg-blue-900/20 print:bg-white">
                                        <td className="border border-gray-300 px-4 py-2 text-center dark:border-gray-600 print:border-black print:py-1" colSpan={16}>Opening Balance</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600 print:border-black print:py-1">৳{openingBalance.toFixed(2)}</td>
                                    </tr>
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 print:bg-white">
                                            <td className="border border-gray-300 px-2 py-1 text-center text-xs dark:border-gray-600 dark:text-gray-300 print:border-black">{new Date(row.date).toLocaleDateString()}</td>
                                            {/* Credit columns */}
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.fund_in > 0 ? `৳${row.fund_in.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.medicine_income > 0 ? `৳${row.medicine_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.optics_income > 0 ? `৳${row.optics_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.medical_test_income > 0 ? `৳${row.medical_test_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.opd_income > 0 ? `৳${row.opd_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.operation_income > 0 ? `৳${row.operation_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">{row.other_income > 0 ? `৳${row.other_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-green-50 px-2 py-1 text-right text-xs font-semibold text-green-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-green-400 print:bg-white print:border-black">{row.total_credit > 0 ? `৳${row.total_credit.toFixed(2)}` : '-'}</td>
                                            {/* Debit columns */}
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.fund_out > 0 ? `৳${row.fund_out.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.advance_house_rent > 0 ? `৳${row.advance_house_rent.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.medicine_purchase > 0 ? `৳${row.medicine_purchase.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.optics_purchase > 0 ? `৳${row.optics_purchase.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.fixed_assets > 0 ? `৳${row.fixed_assets.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-2 py-1 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">{row.other_expenses > 0 ? `৳${row.other_expenses.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-red-50 px-2 py-1 text-right text-xs font-semibold text-red-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-red-400 print:bg-white print:border-black">{row.total_debit > 0 ? `৳${row.total_debit.toFixed(2)}` : '-'}</td>
                                            {/* Balance */}
                                            <td className="border border-gray-300 bg-blue-50 px-2 py-1 text-right text-xs font-bold text-blue-700 dark:border-gray-600 dark:bg-blue-900/20 dark:text-blue-400 print:bg-white print:border-black">৳{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200 font-bold dark:bg-gray-700 print:bg-white">
                                        <td className="border border-gray-300 px-2 py-2 text-center text-xs dark:border-gray-600 print:border-black">TOTAL</td>
                                        {/* Credit totals */}
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.fund_in.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.medicine_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.optics_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.medical_test_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.opd_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.operation_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-600 dark:border-gray-600 dark:text-green-400 print:border-black">৳{totals.other_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-green-100 px-2 py-2 text-right text-xs text-green-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-green-400 print:bg-white print:border-black">৳{totals.total_credit.toFixed(2)}</td>
                                        {/* Debit totals */}
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.fund_out.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.advance_house_rent.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.medicine_purchase.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.optics_purchase.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.fixed_assets.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-2 py-2 text-right text-xs text-red-600 dark:border-gray-600 dark:text-red-400 print:border-black">৳{totals.other_expenses.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-red-100 px-2 py-2 text-right text-xs text-red-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-red-400 print:bg-white print:border-black">৳{totals.total_debit.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-blue-100 px-2 py-2 text-right text-xs font-bold text-blue-700 dark:border-gray-600 dark:bg-blue-900/30 dark:text-blue-400 print:bg-white print:border-black">
                                            ৳{rows.length > 0 ? rows[rows.length - 1].balance.toFixed(2) : openingBalance.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                .print-header-new {
                    display: none;
                }
                .screen-only {
                    display: block;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .report-section,
                    .report-section * {
                        visibility: visible;
                    }
                    .report-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        padding: 5px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .print-header-new {
                        display: block !important;
                        visibility: visible !important;
                    }
                    .screen-only {
                        display: none !important;
                    }
                    h1 {
                        font-size: 10px !important;
                        margin-bottom: 1px !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                    }
                    h2 {
                        font-size: 9px !important;
                        margin: 1px 0 !important;
                        font-weight: bold;
                    }
                    p {
                        font-size: 7px !important;
                        margin: 0 !important;
                    }
                    .flex {
                        display: flex !important;
                    }
                    .justify-between {
                        justify-content: space-between !important;
                    }
                    .items-center {
                        align-items: center !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 5mm;
                    }
                    table {
                        font-size: 7px !important;
                        width: 100%;
                        border-collapse: collapse;
                    }
                    table th {
                        font-size: 7px !important;
                        padding: 2px 1px !important;
                        border: 1px solid #000 !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                    }
                    table td {
                        font-size: 7px !important;
                        padding: 2px 1px !important;
                        border: 1px solid #000 !important;
                        line-height: 1.2 !important;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tbody {
                        display: table-row-group;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
