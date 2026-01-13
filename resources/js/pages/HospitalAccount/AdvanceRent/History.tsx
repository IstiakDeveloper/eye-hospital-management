import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    History as HistoryIcon,
    Download,
    FileText,
    ArrowLeft,
    Filter,
    Calendar
} from 'lucide-react';

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
        year: 'numeric'
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
            format
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
            <div className="max-w-7xl mx-auto py-6 space-y-6">

                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <HistoryIcon className="w-7 h-7 text-blue-600" />
                                Advance House Rent History
                            </h1>
                            <p className="text-gray-600 mt-1">Complete transaction history with balance tracking</p>
                        </div>
                        <button
                            onClick={() => router.visit(`/hospital-account/advance-rent?floor_type=${currentFloor}`)}
                            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition print:hidden"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </button>
                    </div>

                    {/* Floor Tabs */}
                    <div className="mb-4 border-b border-gray-200 print:hidden">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFloorChange('2_3_floor')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                                    currentFloor === '2_3_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                2nd & 3rd Floor
                            </button>
                            <button
                                onClick={() => handleFloorChange('4_floor')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                                    currentFloor === '4_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                4th Floor
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 print:hidden">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter:</span>
                        </div>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : '')}
                            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All Months</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleFilter}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Apply
                        </button>

                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                <FileText className="w-4 h-4 mr-1" />
                                Print
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-lg shadow-sm border print:shadow-none">
                    <div className="p-6">
                        <div className="mb-4 flex justify-between items-center print:mb-6">
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
                                    <tr className="bg-gray-50 border-b-2 border-gray-300">
                                        <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                                        <th className="text-left p-3 font-semibold text-gray-700">Description</th>
                                        <th className="text-left p-3 font-semibold text-gray-700">Payment/Deduction No</th>
                                        <th className="text-right p-3 font-semibold text-green-700">Credit (৳)</th>
                                        <th className="text-right p-3 font-semibold text-red-700">Debit (৳)</th>
                                        <th className="text-right p-3 font-semibold text-blue-700">Balance (৳)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Previous Balance Row */}
                                    <tr className="border-b bg-blue-50">
                                        <td colSpan={3} className="p-3 font-medium text-gray-700">
                                            Opening Balance
                                        </td>
                                        <td className="text-right p-3">-</td>
                                        <td className="text-right p-3">-</td>
                                        <td className="text-right p-3 font-bold text-blue-700">
                                            {formatCurrency(previousBalance)}
                                        </td>
                                    </tr>

                                    {transactions.length > 0 ? (
                                        transactions.map((transaction, index) => (
                                            <tr
                                                key={index}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="p-3 text-sm text-gray-700 font-medium">
                                                    {formatDate(transaction.date)}
                                                </td>
                                                <td className="p-3 text-sm text-gray-900">
                                                    {transaction.details.length === 1 ? (
                                                        <div>
                                                            {transaction.details[0].description}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium mb-1">Multiple Transactions:</div>
                                                            <ul className="text-xs space-y-1">
                                                                {transaction.details.map((detail, i) => (
                                                                    <li key={i} className={detail.type === 'advance' ? 'text-green-600' : 'text-red-600'}>
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
                                                        <div className="text-xs space-y-1">
                                                            {transaction.details.map((detail, i) => (
                                                                <div key={i} className="font-mono text-gray-600">{detail.payment_number}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-right p-3 text-sm font-semibold text-green-600">
                                                    {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                                                </td>
                                                <td className="text-right p-3 text-sm font-semibold text-red-600">
                                                    {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                                                </td>
                                                <td className="text-right p-3 text-sm font-bold text-blue-700">
                                                    {formatCurrency(transaction.balance)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-500">
                                                No transactions found for this period
                                            </td>
                                        </tr>
                                    )}

                                    {/* Totals Row */}
                                    {transactions.length > 0 && (
                                        <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                            <td colSpan={3} className="p-3 text-gray-900">
                                                Total
                                            </td>
                                            <td className="text-right p-3 text-green-700">
                                                {formatCurrency(totalCredit)}
                                            </td>
                                            <td className="text-right p-3 text-red-700">
                                                {formatCurrency(totalDebit)}
                                            </td>
                                            <td className="text-right p-3 text-blue-700">
                                                {formatCurrency(finalBalance)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Cards */}
                        {transactions.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mt-6 print:mt-8">
                                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                    <p className="text-xs uppercase tracking-wide text-green-600 font-semibold mb-1">Total Advance Paid</p>
                                    <p className="text-2xl font-bold text-green-700">৳{formatCurrency(totalCredit)}</p>
                                </div>
                                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">Total Rent Deducted</p>
                                    <p className="text-2xl font-bold text-red-700">৳{formatCurrency(totalDebit)}</p>
                                </div>
                                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                                    <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">Closing Balance</p>
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
