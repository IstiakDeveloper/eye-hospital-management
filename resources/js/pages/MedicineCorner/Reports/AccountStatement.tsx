import React from 'react';
import AdminLayout from '@/layouts/MedicineAccountLayout';
import { Head, router } from '@inertiajs/react';

interface Transaction {
    id: number;
    date: string;
    reference_no: string;
    description: string;
    deposit: number;
    withdraw: number;
    balance: number;
    created_by: string;
    source: string;
}

interface Summary {
    opening_balance: number;
    total_deposit: number;
    total_withdraw: number;
    closing_balance: number;
    transaction_count: number;
}

interface Props {
    transactions: Transaction[];
    summary: Summary;
    openingBalance: number;
    currentBalance: number;
    filters: {
        from_date: string;
        to_date: string;
    };
}

export default function AccountStatement({ transactions, summary, openingBalance, currentBalance, filters }: Props) {
    const [fromDate, setFromDate] = React.useState(filters.from_date);
    const [toDate, setToDate] = React.useState(filters.to_date);

    const handleFilter = () => {
        router.get(
            route('medicine.reports.account-statement'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        // Placeholder for Excel export logic
        alert('Export to Excel coming soon!');
    };

    return (
        <AdminLayout>
            <Head title="Medicine Account Statement" />
            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    {/* Filter Section - Hidden in Print */}
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
                                <button onClick={handlePrint} className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">Print</button>
                                <button onClick={handleExportExcel} className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Export Excel</button>
                            </div>
                        </div>
                    </div>
                    {/* Print Area - Contains all printable content */}
                    <div className="print-area">
                        {/* Report Section */}
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            {/* Header */}
                            <div className="mb-6 border-b pb-4 text-center print-header">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Medicine Account Statement</h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">Period: {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}</p>
                            </div>
                            {/* Summary Cards */}
                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 dark:border-gray-600 dark:bg-blue-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</div>
                                    <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">৳{openingBalance.toFixed(2)}</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-green-50 p-4 dark:border-gray-600 dark:bg-green-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Deposit</div>
                                    <div className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">৳{summary.total_deposit.toFixed(2)}</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-red-50 p-4 dark:border-gray-600 dark:bg-red-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Withdraw</div>
                                    <div className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">৳{summary.total_withdraw.toFixed(2)}</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-indigo-50 p-4 dark:border-gray-600 dark:bg-indigo-900/20">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Closing Balance</div>
                                    <div className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">৳{summary.closing_balance.toFixed(2)}</div>
                                </div>
                            </div>
                            {/* Transaction Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Date</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Reference No</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Description</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Deposit</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Withdraw</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Balance</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Created By</th>
                                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-300">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance Row */}
                                        <tr className="bg-blue-50 font-semibold dark:bg-blue-900/20">
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={5}>Opening Balance</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600">৳{openingBalance.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={2}></td>
                                        </tr>
                                        {/* Transaction Rows */}
                                        {transactions.map((tx, idx) => {
                                            const deposit = Number(tx.deposit) || 0;
                                            const withdraw = Number(tx.withdraw) || 0;
                                            const balance = Number(tx.balance) || 0;
                                            return (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{tx.reference_no}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{tx.description}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-right text-sm text-green-600 dark:border-gray-600 dark:text-green-400">{deposit > 0 ? `৳${deposit.toFixed(2)}` : '-'}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-right text-sm text-red-600 dark:border-gray-600 dark:text-red-400">{withdraw > 0 ? `৳${withdraw.toFixed(2)}` : '-'}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold dark:border-gray-600 dark:text-gray-300">৳{balance.toFixed(2)}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{tx.created_by}</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300">{tx.source}</td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals Row */}
                                        <tr className="bg-gray-100 font-bold dark:bg-gray-700">
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={3}>Total</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-green-600 dark:border-gray-600 dark:text-green-400">৳{summary.total_deposit.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right text-red-600 dark:border-gray-600 dark:text-red-400">৳{summary.total_withdraw.toFixed(2)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600"></td>
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={2}></td>
                                        </tr>
                                        {/* Closing Balance Row */}
                                        <tr className="bg-indigo-50 font-bold dark:bg-indigo-900/20">
                                            <td className="border border-gray-300 px-4 py-2 dark:border-gray-600" colSpan={6}>Closing Balance</td>
                                            <td className="border border-gray-300 px-4 py-2 text-right dark:border-gray-600" colSpan={2}>৳{summary.closing_balance.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            {/* Footer Info */}
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p>Total Transactions: {summary.transaction_count}</p>
                                <p>Current Account Balance: ৳{typeof currentBalance === 'number' && !isNaN(currentBalance) ? currentBalance.toFixed(2) : Number(currentBalance).toFixed(2)}</p>
                                <p className="mt-2">Generated on: {new Date().toLocaleString()}</p>
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
