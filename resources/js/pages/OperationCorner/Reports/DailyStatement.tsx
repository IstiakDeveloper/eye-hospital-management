
import AdminLayout from '@/layouts/OperationAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

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

interface Props {
    rows: DailyRow[];
    totals: {
        fund_in: number;
        income: number;
        fund_out: number;
        expense: number;
        total_credit: number;
        total_debit: number;
    };
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
            route('operation.reports.daily-statement'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const excelData = [];
        excelData.push(['Operation Daily Statement']);
        excelData.push([`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`]);
        excelData.push([]);
        excelData.push(['Summary']);
        excelData.push(['Opening Balance', openingBalance.toFixed(2)]);
        excelData.push(['Total Fund In', totals.fund_in.toFixed(2)]);
        excelData.push(['Total Income', totals.income.toFixed(2)]);
        excelData.push(['Total Fund Out', totals.fund_out.toFixed(2)]);
        excelData.push(['Total Expense', totals.expense.toFixed(2)]);
        excelData.push(['Total Credit', totals.total_credit.toFixed(2)]);
        excelData.push(['Total Debit', totals.total_debit.toFixed(2)]);
        excelData.push([]);
        excelData.push([
            'Date',
            'Fund In',
            'Income',
            'Fund Out',
            'Expense',
            'Total Credit',
            'Total Debit',
            'Balance',
        ]);
        excelData.push([
            'Opening Balance',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            openingBalance.toFixed(2),
        ]);
        rows.forEach((row) => {
            excelData.push([
                row.date,
                row.fund_in > 0 ? row.fund_in.toFixed(2) : '-',
                row.income > 0 ? row.income.toFixed(2) : '-',
                row.fund_out > 0 ? row.fund_out.toFixed(2) : '-',
                row.expense > 0 ? row.expense.toFixed(2) : '-',
                row.total_credit > 0 ? row.total_credit.toFixed(2) : '-',
                row.total_debit > 0 ? row.total_debit.toFixed(2) : '-',
                row.balance.toFixed(2),
            ]);
        });
        excelData.push([
            'Total',
            totals.fund_in.toFixed(2),
            totals.income.toFixed(2),
            totals.fund_out.toFixed(2),
            totals.expense.toFixed(2),
            totals.total_credit.toFixed(2),
            totals.total_debit.toFixed(2),
            '',
        ]);
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Statement');
        XLSX.writeFile(wb, `Operation-Daily-Statement-${fromDate}-to-${toDate}.xlsx`);
    };

    return (
        <AdminLayout>
            <Head title="Operation Daily Statement" />
            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    {/* Filter Section - Hidden in Print */}
                    <div className={`mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800`}>
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
                                    onClick={handlePrint}
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
                        {/* Report Section */}
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            {/* Header */}
                            <div className="mb-6 border-b pb-4 text-center print:border-black">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Operation Daily Statement
                                </h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">
                                    Period: {new Date(filters.from_date).toLocaleDateString()} to{' '}
                                    {new Date(filters.to_date).toLocaleDateString()}
                                </p>
                            </div>
                            {/* Summary Cards */}
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 dark:border-gray-600 dark:bg-blue-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</div>
                                    <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
                                        ৳{openingBalance.toFixed(2)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-green-50 p-4 dark:border-gray-600 dark:bg-green-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Fund In</div>
                                    <div className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                                        ৳{totals.fund_in.toFixed(2)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-yellow-50 p-4 dark:border-gray-600 dark:bg-yellow-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Income</div>
                                    <div className="mt-1 text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                        ৳{totals.income.toFixed(2)}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-red-50 p-4 dark:border-gray-600 dark:bg-red-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Fund Out</div>
                                    <div className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                                        ৳{totals.fund_out.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            {/* Transaction Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Date</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Fund In</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Income</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Fund Out</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Expense</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Total Credit</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Total Debit</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance Row */}
                                        <tr className="bg-blue-50 font-semibold dark:bg-blue-900/20">
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600">Opening Balance</td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600">৳{openingBalance.toFixed(2)}</td>
                                        </tr>
                                        {/* Transaction Rows */}
                                        {rows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{row.date}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400">{row.fund_in > 0 ? `৳${row.fund_in.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm text-yellow-600 dark:border-gray-600 dark:text-yellow-400">{row.income > 0 ? `৳${row.income.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{row.fund_out > 0 ? `৳${row.fund_out.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{row.expense > 0 ? `৳${row.expense.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold dark:border-gray-600 dark:text-gray-300">{row.total_credit > 0 ? `৳${row.total_credit.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold dark:border-gray-600 dark:text-gray-300">{row.total_debit > 0 ? `৳${row.total_debit.toFixed(2)}` : '-'}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold dark:border-gray-600 dark:text-gray-300">৳{row.balance.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr className="bg-gray-100 font-bold dark:bg-gray-700">
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600">Total</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400">৳{totals.fund_in.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-yellow-600 dark:border-gray-600 dark:text-yellow-400">৳{totals.income.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{totals.fund_out.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{totals.expense.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right font-semibold dark:border-gray-600 dark:text-gray-300">৳{totals.total_credit.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right font-semibold dark:border-gray-600 dark:text-gray-300">৳{totals.total_debit.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {/* Footer Info */}
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p>Generated on: {new Date().toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                        size: A4 portrait;
                        margin: 0.5cm;
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
        </AdminLayout>
    );
}
