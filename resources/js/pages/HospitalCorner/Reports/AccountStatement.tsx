import AdminLayout from '@/layouts/HospitalAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);

    const handleFilter = () => {
        router.get(
            route('reports.account-statement'),
            { from_date: fromDate, to_date: toDate },
            { preserveState: true }
        );
    };

    return (
        <AdminLayout>
            <Head title="Hospital Account Statement" />
            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Filter Report</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">From Date</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">To Date</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="flex items-end gap-3">
                                <button onClick={handleFilter} className="flex-1 rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg">
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Filter
                                    </span>
                                </button>
                                <button onClick={() => window.print()} className="flex-1 rounded-lg bg-gray-700 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-gray-800 hover:shadow-lg">
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Page Header */}
                    <div className="mb-6 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 shadow-lg">
                        <h1 className="text-center text-3xl font-bold text-white">Hospital Account Statement</h1>
                        <p className="mt-2 text-center text-indigo-100">
                            Period: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="group rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-md transition hover:shadow-xl dark:border-blue-800 dark:from-blue-900/30 dark:to-blue-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Opening Balance</p>
                                    <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">৳{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="rounded-full bg-blue-200 p-3 dark:bg-blue-800">
                                    <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-md transition hover:shadow-xl dark:border-green-800 dark:from-green-900/30 dark:to-green-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">Total Deposit</p>
                                    <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">৳{summary.total_deposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-500">{summary.transaction_count} transactions</p>
                                </div>
                                <div className="rounded-full bg-green-200 p-3 dark:bg-green-800">
                                    <svg className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-md transition hover:shadow-xl dark:border-red-800 dark:from-red-900/30 dark:to-red-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Total Withdraw</p>
                                    <p className="mt-2 text-3xl font-bold text-red-700 dark:text-red-300">৳{summary.total_withdraw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="rounded-full bg-red-200 p-3 dark:bg-red-800">
                                    <svg className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="group rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-md transition hover:shadow-xl dark:border-purple-800 dark:from-purple-900/30 dark:to-purple-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Closing Balance</p>
                                    <p className="mt-2 text-3xl font-bold text-purple-700 dark:text-purple-300">৳{summary.closing_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div className="rounded-full bg-purple-200 p-3 dark:bg-purple-800">
                                    <svg className="h-8 w-8 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="print-area report-section">
                        {/* Print Header - Hidden on screen, visible on print */}
                        <div className="print-header-new">
                            <div className="header-title">
                                <h1>Naogaon Islamia Eye Hospital and Phaco Center</h1>
                                <h2>Hospital Account Statement</h2>
                                <p>Period: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            {/* Summary Section - Print Only */}
                            <div className="summary-section">
                                <table className="summary-table">
                                    <tbody>
                                        <tr>
                                            <td className="summary-label">Opening Balance:</td>
                                            <td className="summary-value">৳{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="summary-label">Total Deposit:</td>
                                            <td className="summary-value positive">৳{summary.total_deposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="summary-label">Total Withdraw:</td>
                                            <td className="summary-value negative">৳{summary.total_withdraw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="summary-label">Closing Balance:</td>
                                            <td className="summary-value closing">৳{summary.closing_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="summary-label">Total Transactions:</td>
                                            <td className="summary-value" colSpan={3}>{summary.transaction_count}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Screen Header - Hidden on print */}
                        <div className="screen-only">
                            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Transaction Details</h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg bg-white shadow-lg dark:bg-gray-800">
                            <table className="transaction-table min-w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                    <tr>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Date</th>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Ref No</th>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Description</th>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Deposit (৳)</th>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Withdraw (৳)</th>
                                        <th className="border-b-2 border-gray-300 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Balance (৳)</th>
                                        <th className="screen-only border-b-2 border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Created By</th>
                                        <th className="screen-only border-b-2 border-gray-300 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:border-gray-600 dark:text-gray-300">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr className="bg-gradient-to-r from-blue-50 to-blue-100 font-semibold dark:from-blue-900/20 dark:to-blue-900/30">
                                        <td className="border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-700" colSpan={5}>
                                            <span className="flex items-center gap-2">
                                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Opening Balance
                                            </span>
                                        </td>
                                        <td className="border-b border-gray-200 px-4 py-3 text-right text-sm font-bold text-blue-700 dark:border-gray-700 dark:text-blue-300">
                                            ৳{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="screen-only border-b border-gray-200 px-4 py-3 dark:border-gray-700" colSpan={2}></td>
                                    </tr>
                                    {transactions.map((tx, index) => (
                                        <tr key={tx.id} className={`transition hover:bg-blue-50 dark:hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                            <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                                                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">{tx.reference_no}</span>
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">{tx.description}</td>
                                            <td className="border-b border-gray-200 px-4 py-3 text-right text-sm font-semibold dark:border-gray-700">
                                                {tx.deposit > 0 ? (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        +{tx.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-3 text-right text-sm font-semibold dark:border-gray-700">
                                                {tx.withdraw > 0 ? (
                                                    <span className="text-red-600 dark:text-red-400">
                                                        -{tx.withdraw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="border-b border-gray-200 px-4 py-3 text-right text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                                {tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="screen-only border-b border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">{tx.created_by}</td>
                                            <td className="screen-only border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
                                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{tx.source}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 font-bold dark:from-gray-700 dark:to-gray-800">
                                        <td className="border-t-2 border-gray-300 px-4 py-4 text-sm dark:border-gray-600" colSpan={3}>
                                            <span className="flex items-center gap-2">
                                                <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                Total Transactions
                                            </span>
                                        </td>
                                        <td className="border-t-2 border-gray-300 px-4 py-4 text-right text-sm font-bold text-green-700 dark:border-gray-600 dark:text-green-400">
                                            +{summary.total_deposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="border-t-2 border-gray-300 px-4 py-4 text-right text-sm font-bold text-red-700 dark:border-gray-600 dark:text-red-400">
                                            -{summary.total_withdraw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="border-t-2 border-gray-300 px-4 py-4 text-right text-sm dark:border-gray-600"></td>
                                        <td className="screen-only border-t-2 border-gray-300 px-4 py-4 dark:border-gray-600" colSpan={2}></td>
                                    </tr>
                                    <tr className="bg-gradient-to-r from-purple-100 to-purple-200 font-bold dark:from-purple-900/30 dark:to-purple-900/40">
                                        <td className="border-t-2 border-purple-300 px-4 py-4 text-sm dark:border-purple-700" colSpan={5}>
                                            <span className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Closing Balance
                                            </span>
                                        </td>
                                        <td className="border-t-2 border-purple-300 px-4 py-4 text-right text-base font-bold text-purple-700 dark:border-purple-700 dark:text-purple-300">
                                            ৳{summary.closing_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="screen-only border-t-2 border-purple-300 px-4 py-4 dark:border-purple-700" colSpan={2}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Info */}
                        <div className="screen-only mt-6 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">Report Generated:</span>
                                    <span>{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-medium">Total Records:</span>
                                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{summary.transaction_count}</span>
                                </div>
                            </div>
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
                        padding: 2mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }

                    /* Print Header Styles */
                    .print-header-new {
                        display: block !important;
                        visibility: visible !important;
                        margin-bottom: 4mm !important;
                    }

                    .header-title {
                        text-align: center;
                        border-bottom: 1.5pt solid #000;
                        padding-bottom: 2mm;
                        margin-bottom: 3mm;
                    }

                    .header-title h1 {
                        font-size: 11px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-weight: bold;
                        line-height: 1.4 !important;
                    }

                    .header-title h2 {
                        font-size: 9px !important;
                        margin: 1mm 0 0 0 !important;
                        padding: 0 !important;
                        font-weight: 600;
                        line-height: 1.3 !important;
                    }

                    .header-title p {
                        font-size: 7px !important;
                        margin: 1mm 0 0 0 !important;
                        padding: 0 !important;
                        line-height: 1.2 !important;
                        color: #333;
                    }

                    /* Summary Section */
                    .summary-section {
                        margin: 3mm 0 4mm 0 !important;
                        border: 1pt solid #000;
                        padding: 2mm !important;
                        background: #f9f9f9 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .summary-table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    .summary-table td {
                        padding: 1mm 2mm !important;
                        font-size: 7px !important;
                        line-height: 1.3 !important;
                        border: none !important;
                    }

                    .summary-label {
                        font-weight: 600;
                        width: 25%;
                    }

                    .summary-value {
                        font-weight: bold;
                        width: 25%;
                    }

                    .summary-value.positive {
                        color: #059669 !important;
                    }

                    .summary-value.negative {
                        color: #dc2626 !important;
                    }

                    .summary-value.closing {
                        color: #4f46e5 !important;
                    }

                    .screen-only {
                        display: none !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }

                    /* Transaction Table */
                    .transaction-table {
                        font-size: 6.5px !important;
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 0 !important;
                    }

                    .transaction-table th {
                        font-size: 7px !important;
                        padding: 1.5mm 1mm !important;
                        border: 0.5pt solid #000 !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                        background: #e5e7eb !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        text-align: left;
                    }

                    .transaction-table td {
                        font-size: 6.5px !important;
                        padding: 0.8mm 1mm !important;
                        border: 0.5pt solid #000 !important;
                        line-height: 1.3 !important;
                    }

                    .transaction-table tbody tr:nth-child(odd) {
                        background: #fafafa !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
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

                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
