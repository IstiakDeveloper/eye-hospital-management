import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

interface Props {
    rows: any[];
    openingBalance: number;
    filters: { date: string };
    summary: any;
    currentBalance: number;
}

const DailyStatement: React.FC<Props> = ({ rows, openingBalance, filters, summary, currentBalance }) => {
    const [date, setDate] = React.useState<string>(filters?.date ?? "");
        const [fromDate, setFromDate] = useState(filters.from_date);
        const [toDate, setToDate] = useState(filters.to_date);
        const handleFilter = () => {
            router.get(
                route('operation.reports.daily-statement'),
                { from_date: fromDate, to_date: toDate },
                { preserveState: true }
            );
        window.location.href = `?date=${date}`;
    };

    const handlePrint = () => {
        window.print();
    };

            const excelData = [];
            excelData.push(['Operation Bank Report - November 2025']);
            excelData.push([`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`]);
            excelData.push([]);
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
            excelData.push([
                'Previous Balance', '-', '-', '-', '-', '-', '-', '-', '-', openingBalance.toFixed(2),
            ]);
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
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Operation Bank Report');
            XLSX.writeFile(wb, `Operation-Bank-Report-${fromDate}-to-${toDate}.xlsx`);
        alert('Export to Excel coming soon!');
    };

    return (
        <AdminLayout>
            <Head title="Operation Daily Statement" />
            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <div className="flex gap-2 items-center">
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" />
                            <button onClick={handleFilter} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Filter</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Print</button>
                            <button onClick={handleExportExcel} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Export Excel</button>
                        </div>
                    </div>
                    <div className="print-area">
                        <div className="mb-6 border-b pb-4 text-center print-header">
                            <h1 className="text-2xl font-bold">Operation Daily Statement</h1>
                            <p>
                                Date: {date ? new Date(date).toLocaleDateString() : "-"}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead className="sticky top-0 z-10 bg-gray-100">
                                    <tr className="bg-gray-200">
                                        <th className="px-2 py-1">Time</th>
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
                                        <td colSpan={4}>Opening Balance</td>
                                        <td>{openingBalance?.toFixed(2) ?? "-"}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                    {rows?.map((row: any, idx: number) => (
                                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td>{row.time}</td>
                                            <td>{row.description}</td>
                                            <td>{row.deposit > 0 ? row.deposit.toFixed(2) : '-'}</td>
                                            <td>{row.withdraw > 0 ? row.withdraw.toFixed(2) : '-'}</td>
                                            <td>{row.balance.toFixed(2)}</td>
                                            <td>{row.created_by}</td>
                                            <td>{row.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>Closing Balance: <strong>{summary?.closing_balance?.toFixed(2) ?? "-"}</strong></div>
                            <div>Total Deposit: <strong>{summary?.total_deposit?.toFixed(2) ?? "-"}</strong></div>
                            <div>Total Withdraw: <strong>{summary?.total_withdraw?.toFixed(2) ?? "-"}</strong></div>
                            <div>Transaction Count: <strong>{summary?.transaction_count ?? "-"}</strong></div>
                            <div>Current Account Balance: <strong>{currentBalance?.toFixed(2) ?? "-"}</strong></div>
                            <p className="col-span-2">Generated on: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DailyStatement;
