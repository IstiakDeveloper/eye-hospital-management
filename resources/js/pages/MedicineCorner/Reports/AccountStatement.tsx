import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

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
        window.location.href = `?from_date=${fromDate}&to_date=${toDate}`;
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <div className="flex gap-2 items-center">
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1" />
                            <span className="mx-1">to</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1" />
                            <button onClick={handleFilter} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Filter</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Print</button>
                            <button onClick={handleExportExcel} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Export Excel</button>
                        </div>
                    </div>
                    <div className="print-area">
                        <div className="mb-6 border-b pb-4 text-center print-header">
                            <h1 className="text-2xl font-bold">Medicine Account Statement</h1>
                            <p>
                                Period: {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead className="sticky top-0 z-10 bg-gray-100">
                                    <tr className="bg-gray-200">
                                        <th className="px-2 py-1">Date</th>
                                        <th className="px-2 py-1">Reference No</th>
                                        <th className="px-2 py-1">Description</th>
                                        <th className="px-2 py-1">Deposit</th>
                                        <th className="px-2 py-1">Withdraw</th>
                                        <th className="px-2 py-1">Balance</th>
                                        <th className="px-2 py-1">Created By</th>
                                        <th className="px-2 py-1">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-yellow-50 font-semibold">
                                        <td colSpan={5}>Opening Balance</td>
                                        <td>{openingBalance.toFixed(2)}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                    {transactions.map((tx, idx) => (
                                        <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td>{new Date(tx.date).toLocaleDateString()}</td>
                                            <td>{tx.reference_no}</td>
                                            <td>{tx.description}</td>
                                            <td>{tx.deposit > 0 ? tx.deposit.toFixed(2) : '-'}</td>
                                            <td>{tx.withdraw > 0 ? tx.withdraw.toFixed(2) : '-'}</td>
                                            <td>{tx.balance.toFixed(2)}</td>
                                            <td>{tx.created_by}</td>
                                            <td>{tx.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>Closing Balance: <strong>{summary.closing_balance.toFixed(2)}</strong></div>
                            <div>Total Deposit: <strong>{summary.total_deposit.toFixed(2)}</strong></div>
                            <div>Total Withdraw: <strong>{summary.total_withdraw.toFixed(2)}</strong></div>
                            <div>Transaction Count: <strong>{summary.transaction_count}</strong></div>
                            <div>Current Account Balance: <strong>{currentBalance.toFixed(2)}</strong></div>
                            <p className="col-span-2">Generated on: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
