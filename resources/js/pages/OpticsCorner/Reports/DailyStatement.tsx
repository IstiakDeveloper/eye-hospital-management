import AdminLayout from '@/layouts/OpticsAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface DailyRow {
    date: string;
    fund_in: number;
    sales: number;
    other_income: number;
    fund_out: number;
    purchases: number;
    expense: number;
    total_credit: number;
    total_debit: number;
    balance: number;
}

interface Totals {
    fund_in: number;
    sales: number;
    other_income: number;
    fund_out: number;
    purchases: number;
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
            route('optics.reports.daily-statement'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true }
        );
    };

    // PDF export removed as requested
    const handleExport = () => {
        // Placeholder for future export logic (Excel, CSV, etc.)
    };

    const handleExportExcel = () => {
        // Prepare data for Excel
        const excelData = [];

        // Add title
        excelData.push(['Bank Report - November 2025']);
        excelData.push([`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`]);
        excelData.push([]); // Empty row

        // Add headers
        excelData.push([
            'Date',
            'Fund In',
            'Sale',
            'Others Income',
            'Total Credit',
            'Fund Out',
            'Purchase',
            'Expense',
            'Total Debit',
            'Balance',
        ]);

        // Add opening balance
        excelData.push([
            'Previous Balance',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            openingBalance.toFixed(2),
        ]);

        // Add data rows
        rows.forEach((row) => {
            excelData.push([
                new Date(row.date).toLocaleDateString(),
                row.fund_in > 0 ? row.fund_in.toFixed(2) : '-',
                row.sales > 0 ? row.sales.toFixed(2) : '-',
                row.other_income > 0 ? row.other_income.toFixed(2) : '-',
                row.total_credit > 0 ? row.total_credit.toFixed(2) : '-',
                row.fund_out > 0 ? row.fund_out.toFixed(2) : '-',
                row.purchases > 0 ? row.purchases.toFixed(2) : '-',
                row.expense > 0 ? row.expense.toFixed(2) : '-',
                row.total_debit > 0 ? row.total_debit.toFixed(2) : '-',
                row.balance.toFixed(2),
            ]);
        });

        // Add total row
        excelData.push([
            'TOTAL',
            totals.fund_in.toFixed(2),
            totals.sales.toFixed(2),
            totals.other_income.toFixed(2),
            totals.total_credit.toFixed(2),
            totals.fund_out.toFixed(2),
            totals.purchases.toFixed(2),
            totals.expense.toFixed(2),
            totals.total_debit.toFixed(2),
            '-',
        ]);

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // Date
            { wch: 12 }, // Fund In
            { wch: 12 }, // Sale
            { wch: 15 }, // Others Income
            { wch: 15 }, // Total Credit
            { wch: 12 }, // Fund Out
            { wch: 12 }, // Purchase
            { wch: 12 }, // Expense
            { wch: 15 }, // Total Debit
            { wch: 15 }, // Balance
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bank Report');

        // Save file
        XLSX.writeFile(wb, `Bank-Report-${fromDate}-to-${toDate}.xlsx`);
    };

    return (
        <AdminLayout>
            <Head title="Bank Report - Optics" />

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }

                    .print-area, .print-area * {
                        visibility: visible;
                    }

                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    @page {
                        size: A4 landscape;
                        margin: 0.5in;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }

                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        font-size: 10px !important;
                    }

                    th, td {
                        border: 1px solid #000 !important;
                        padding: 3px 4px !important;
                    }

                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    .print-summary {
                        margin-top: 15px;
                        border: 1px solid #000;
                        padding: 8px;
                        font-size: 10px;
                    }

                    .bg-gray-50, .bg-green-50, .bg-red-50, .bg-blue-50, .bg-yellow-50 {
                        background-color: transparent !important;
                    }

                    .bg-green-100, .bg-red-100, .bg-blue-100, .bg-yellow-100 {
                        background-color: #f5f5f5 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    .bg-green-200, .bg-red-200, .bg-blue-200, .bg-green-300, .bg-red-300, .bg-gray-200 {
                        background-color: #e5e5e5 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    {/* Filter Section - Hide on print */}
                    <div className="no-print mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                                >
                                    Filter
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                                >
                                    Print
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                >
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Print Area - Contains all printable content */}
                    <div className="print-area">
                        {/* Header */}
                        <div className="mb-6 border-b pb-4 text-center print-header">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white print:text-xl">
                                Bank Report - {new Date(filters.from_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400 print:text-base">
                                Period: {new Date(filters.from_date).toLocaleDateString()} to{' '}
                                {new Date(filters.to_date).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Bank Report Table and Footer Info - all inside print-area */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-gray-700">
                                        <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:text-gray-300">Date</th>
                                        <th colSpan={4} className="border border-gray-300 bg-green-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-gray-300">Credit Section</th>
                                        <th colSpan={4} className="border border-gray-300 bg-red-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-gray-300">Debit Section</th>
                                        <th rowSpan={2} className="border border-gray-300 bg-blue-100 px-4 py-2 text-center text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-blue-900/30 dark:text-gray-300">Available Balance</th>
                                    </tr>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="border border-gray-300 bg-green-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300">Fund In</th>
                                        <th className="border border-gray-300 bg-green-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300">Sale</th>
                                        <th className="border border-gray-300 bg-green-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300">Others Income</th>
                                        <th className="border border-gray-300 bg-green-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-gray-300">Total Credit</th>
                                        <th className="border border-gray-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300">Fund Out</th>
                                        <th className="border border-gray-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300">Purchase</th>
                                        <th className="border border-gray-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300">Expense</th>
                                        <th className="border border-gray-300 bg-red-50 px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-gray-300">Total Debit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Previous Balance Row */}
                                    <tr className="bg-yellow-50 font-semibold dark:bg-yellow-900/20">
                                        <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={9}>Previous Balance</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600">৳{openingBalance.toFixed(2)}</td>
                                    </tr>
                                    {/* Daily Rows */}
                                    {rows.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="border border-gray-300 px-4 py-2 text-center text-sm dark:border-gray-600 dark:text-gray-300">{new Date(row.date).toLocaleDateString()}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400">{row.fund_in > 0 ? `৳${row.fund_in.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400">{row.sales > 0 ? `৳${row.sales.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400">{row.other_income > 0 ? `৳${row.other_income.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-green-50 px-4 py-2 text-right text-sm font-semibold text-green-700 dark:border-gray-600 dark:bg-green-900/20 dark:text-green-400">{row.total_credit > 0 ? `৳${row.total_credit.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{row.fund_out > 0 ? `৳${row.fund_out.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{row.purchases > 0 ? `৳${row.purchases.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{row.expense > 0 ? `৳${row.expense.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-red-50 px-4 py-2 text-right text-sm font-semibold text-red-700 dark:border-gray-600 dark:bg-red-900/20 dark:text-red-400">{row.total_debit > 0 ? `৳${row.total_debit.toFixed(2)}` : '-'}</td>
                                            <td className="border border-gray-300 bg-blue-50 px-4 py-2 text-right text-sm font-bold text-blue-700 dark:border-gray-600 dark:bg-blue-900/20 dark:text-blue-400">৳{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-gray-200 font-bold dark:bg-gray-700">
                                        <td className="border border-gray-300 px-4 py-2 text-center dark:border-gray-600">TOTAL</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400">৳{totals.fund_in.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400">৳{totals.sales.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400">৳{totals.other_income.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-green-100 px-4 py-2 text-right text-green-700 dark:border-gray-600 dark:bg-green-900/30 dark:text-green-400">৳{totals.total_credit.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{totals.fund_out.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{totals.purchases.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{totals.expense.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-red-100 px-4 py-2 text-right text-red-700 dark:border-gray-600 dark:bg-red-900/30 dark:text-red-400">৳{totals.total_debit.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-blue-100 px-4 py-2 text-right dark:border-gray-600 dark:bg-blue-900/30"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Footer Info - Enhanced for Print */}
                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 print-summary">
                            <p>Generated on: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
