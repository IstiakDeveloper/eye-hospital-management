import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Download, FileText, Filter, History as HistoryIcon } from 'lucide-react';
import { useState } from 'react';

interface TransactionDetail {
    description: string;
    payment_number: string;
    credit: number;
    debit: number;
    type: 'advance' | 'deduction';
}

interface Transaction {
    date: string;
    credit: number;
    debit: number;
    balance: number;
    details: TransactionDetail[];
}

interface Props {
    transactions: Transaction[];
    previousBalance: number;
    filters: {
        year?: number;
        month?: number;
        floor_type?: string;
    };
    years: number[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
};

export default function AdvanceRentHistory({ transactions, previousBalance, filters, years }: Props) {
    const [currentFloor, setCurrentFloor] = useState<string>(filters.floor_type || '2_3_floor');
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | ''>(filters.month || '');

    const handleFloorChange = (floorType: string) => {
        setCurrentFloor(floorType);
        const params: any = { floor_type: floorType, year: selectedYear };
        if (selectedMonth) params.month = selectedMonth;
        router.get('/hospital-account/advance-rent/history', params, { preserveState: true });
    };

    const handleFilter = () => {
        const params: any = { floor_type: currentFloor, year: selectedYear };
        if (selectedMonth) params.month = selectedMonth;
        router.get('/hospital-account/advance-rent/history', params, { preserveState: true });
    };

    const handleExport = (format: 'pdf' | 'excel') => {
        const params: any = {
            floor_type: currentFloor,
            year: selectedYear,
            format,
        };
        if (selectedMonth) params.month = selectedMonth;

        window.location.href = `/hospital-account/advance-rent/export?${new URLSearchParams(params)}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : previousBalance;

    return (
        <HospitalAccountLayout title="Advance Rent History">
            <div className="mx-auto max-w-7xl space-y-6 py-6">
                {/* Header */}
                <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none">
                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                                <HistoryIcon className="h-7 w-7 text-blue-600" />
                                Advance House Rent History
                            </h1>
                            <p className="mt-1 text-gray-600">Complete transaction history with balance tracking</p>
                        </div>
                        <button
                            onClick={() => router.visit(`/hospital-account/advance-rent?floor_type=${currentFloor}`)}
                            className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700 print:hidden"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </button>
                    </div>

                    {/* Floor Tabs */}
                    <div className="mb-4 border-b border-gray-200 print:hidden">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFloorChange('2_3_floor')}
                                className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
                                    currentFloor === '2_3_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                2nd & 3rd Floor
                            </button>
                            <button
                                onClick={() => handleFloorChange('4_floor')}
                                className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
                                    currentFloor === '4_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                4th Floor
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 print:hidden">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter:</span>
                        </div>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : '')}
                            className="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All Months</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                <option key={m} value={m}>
                                    {getMonthName(m)}
                                </option>
                            ))}
                        </select>

                        <button onClick={handleFilter} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                            Apply
                        </button>

                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
                            >
                                <FileText className="mr-1 h-4 w-4" />
                                Print
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="flex items-center rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"
                            >
                                <Download className="mr-1 h-4 w-4" />
                                PDF
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="flex items-center rounded-lg bg-green-100 px-3 py-2 text-green-700 hover:bg-green-200"
                            >
                                <Download className="mr-1 h-4 w-4" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="rounded-lg border bg-white shadow-sm print:shadow-none">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between print:mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selectedMonth ? `${getMonthName(selectedMonth)} ${selectedYear}` : `Year ${selectedYear}`}
                            </h2>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Previous Balance:</span> ৳{formatCurrency(previousBalance)}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                                        <th className="p-3 text-left font-semibold text-gray-700">Date</th>
                                        <th className="p-3 text-left font-semibold text-gray-700">Description</th>
                                        <th className="p-3 text-left font-semibold text-gray-700">Payment/Deduction No</th>
                                        <th className="p-3 text-right font-semibold text-green-700">Credit (৳)</th>
                                        <th className="p-3 text-right font-semibold text-red-700">Debit (৳)</th>
                                        <th className="p-3 text-right font-semibold text-blue-700">Balance (৳)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Previous Balance Row */}
                                    <tr className="border-b bg-blue-50">
                                        <td colSpan={3} className="p-3 font-medium text-gray-700">
                                            Opening Balance
                                        </td>
                                        <td className="p-3 text-right">-</td>
                                        <td className="p-3 text-right">-</td>
                                        <td className="p-3 text-right font-bold text-blue-700">{formatCurrency(previousBalance)}</td>
                                    </tr>

                                    {transactions.length > 0 ? (
                                        transactions.map((transaction, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-sm font-medium text-gray-700">{formatDate(transaction.date)}</td>
                                                <td className="p-3 text-sm text-gray-900">
                                                    {transaction.details.length === 1 ? (
                                                        <div>{transaction.details[0].description}</div>
                                                    ) : (
                                                        <div>
                                                            <div className="mb-1 font-medium">Multiple Transactions:</div>
                                                            <ul className="space-y-1 text-xs">
                                                                {transaction.details.map((detail, i) => (
                                                                    <li
                                                                        key={i}
                                                                        className={detail.type === 'advance' ? 'text-green-600' : 'text-red-600'}
                                                                    >
                                                                        • {detail.description}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {transaction.details.length === 1 ? (
                                                        <span className="font-mono text-gray-600">{transaction.details[0].payment_number}</span>
                                                    ) : (
                                                        <div className="space-y-1 text-xs">
                                                            {transaction.details.map((detail, i) => (
                                                                <div key={i} className="font-mono text-gray-600">
                                                                    {detail.payment_number}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right text-sm font-semibold text-green-600">
                                                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                                                </td>
                                                <td className="p-3 text-right text-sm font-semibold text-red-600">
                                                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                                                </td>
                                                <td className="p-3 text-right text-sm font-bold text-blue-700">
                                                    {formatCurrency(transaction.balance)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500">
                                                No transactions found for this period
                                            </td>
                                        </tr>
                                    )}

                                    {/* Totals Row */}
                                    {transactions.length > 0 && (
                                        <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                                            <td colSpan={3} className="p-3 text-gray-900">
                                                Total
                                            </td>
                                            <td className="p-3 text-right text-green-700">{formatCurrency(totalCredit)}</td>
                                            <td className="p-3 text-right text-red-700">{formatCurrency(totalDebit)}</td>
                                            <td className="p-3 text-right text-blue-700">{formatCurrency(finalBalance)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Cards */}
                        {transactions.length > 0 && (
                            <div className="mt-6 grid grid-cols-3 gap-4 print:mt-8">
                                <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-green-600 uppercase">Total Advance Paid</p>
                                    <p className="text-2xl font-bold text-green-700">৳{formatCurrency(totalCredit)}</p>
                                </div>
                                <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-red-600 uppercase">Total Rent Deducted</p>
                                    <p className="text-2xl font-bold text-red-700">৳{formatCurrency(totalDebit)}</p>
                                </div>
                                <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-blue-600 uppercase">Closing Balance</p>
                                    <p className="text-2xl font-bold text-blue-700">৳{formatCurrency(finalBalance)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:shadow-none, .print\\:shadow-none * {
                        visibility: visible;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            `}</style>
        </HospitalAccountLayout>
    );
}
