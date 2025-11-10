import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Calendar, Download, Filter, Printer } from 'lucide-react';

interface BankReportProps {
    bankData: Array<{
        date: string;
        date_raw: string;
        credit: {
            fund_in: number;
            income: number;
            other_income: number;
            total: number;
        };
        debit: {
            fund_out: number;
            fixed_asset: number;
            expense: number;
            total: number;
        };
        running_balance: number;
    }>;
    month: number;
    year: number;
    monthName: string;
    previousMonthBalance: number;
    currentBalance: number;
}

const BankReport: React.FC<BankReportProps> = ({
    bankData,
    month,
    year,
    monthName,
    previousMonthBalance,
    currentBalance
}) => {
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [selectedYear, setSelectedYear] = useState(year);

    const handlePrint = () => {
        window.print();
    };

    const handleFilter = () => {
        router.get('/main-account/bank-report', { month: selectedMonth, year: selectedYear });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

    return (
        <>
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

            <MainAccountLayout title="Bank Report">
                {/* Filter Section - Hidden in Print */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 no-print">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <button onClick={handleFilter} className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                <Filter className="w-3 h-3" />Filter
                            </button>
                        </div>

                        <button onClick={handlePrint} className="bg-purple-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                            <Printer className="w-3 h-3" />Print
                        </button>

                        <button className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 ml-auto">
                            <Download className="w-3 h-3" />Export
                        </button>
                    </div>
                </div>

                {/* Print Area - Contains all printable content */}
                <div className="print-area">
                    {/* Report Header - Enhanced for Print */}
                    <div className="text-center mb-4 print-header">
                        <h1 className="text-2xl font-bold print:text-xl">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                        <p className="text-lg print:text-base">Naogaon</p>
                        <h2 className="text-xl font-bold print:text-lg">Bank Report - {monthName}</h2>
                    </div>

                    {/* Excel-like Table */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            {/* Header */}
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="border border-gray-400 px-3 py-2 font-bold">Date</th>
                                    <th className="border border-gray-400 px-3 py-2 font-bold bg-green-600" colSpan={4}>Credit Section</th>
                                    <th className="border border-gray-400 px-3 py-2 font-bold bg-red-600" colSpan={4}>Debit Section</th>
                                    <th className="border border-gray-400 px-3 py-2 font-bold">Available Balance</th>
                                </tr>
                                <tr className="bg-gray-100 text-gray-800 font-medium">
                                    <th className="border border-gray-400 px-2 py-1"></th>
                                    <th className="border border-gray-400 px-2 py-1 bg-green-100">Fund In</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-green-100">Income</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-green-100">Others Income</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-green-200 font-bold">Total Credit</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-red-100">Fund Out</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-red-100">Fixed Asset</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-red-100">Expense</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-red-200 font-bold">Total Debit</th>
                                    <th className="border border-gray-400 px-2 py-1 bg-blue-100 font-bold">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Previous Month Balance Row */}
                                <tr className="bg-yellow-50">
                                    <td className="border border-gray-300 px-3 py-2 font-medium">Previous Balance</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-center">-</td>
                                    <td className="border border-gray-300 px-3 py-2 text-right font-bold bg-yellow-100">
                                        ৳{formatAmount(previousMonthBalance)}
                                    </td>
                                </tr>

                                {/* Data Rows */}
                                {bankData.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-300 px-3 py-2 font-medium">{row.date}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-green-50">
                                            {row.credit.fund_in > 0 ? `৳${formatAmount(row.credit.fund_in)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-green-50">
                                            {row.credit.income > 0 ? `৳${formatAmount(row.credit.income)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-green-50">
                                            {row.credit.other_income > 0 ? `৳${formatAmount(row.credit.other_income)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-green-100 font-bold">
                                            {row.credit.total > 0 ? `৳${formatAmount(row.credit.total)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-red-50">
                                            {row.debit.fund_out > 0 ? `৳${formatAmount(row.debit.fund_out)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-red-50">
                                            {row.debit.fixed_asset > 0 ? `৳${formatAmount(row.debit.fixed_asset)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-red-50">
                                            {row.debit.expense > 0 ? `৳${formatAmount(row.debit.expense)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-red-100 font-bold">
                                            {row.debit.total > 0 ? `৳${formatAmount(row.debit.total)}` : '-'}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right font-bold bg-blue-50">
                                            ৳{formatAmount(row.running_balance)}
                                        </td>
                                    </tr>
                                ))}

                                {/* Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 px-3 py-2">TOTAL</td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.credit.fund_in, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.credit.income, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.credit.other_income, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-green-300">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.credit.total, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-red-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.debit.fund_out, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-red-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.debit.fixed_asset, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-red-200">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.debit.expense, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-red-300">
                                        ৳{formatAmount(bankData.reduce((sum, row) => sum + row.debit.total, 0))}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right bg-blue-200">
                                        ৳{formatAmount(currentBalance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Summary - Enhanced for Print */}
                    <div className="mt-4 bg-gray-50 p-4 rounded border print-summary">
                        <div className="flex justify-between text-sm">
                            <span>Opening Balance: <strong>৳{formatAmount(previousMonthBalance)}</strong></span>
                            <span>Closing Balance: <strong>৳{formatAmount(currentBalance)}</strong></span>
                            <span>Net Change: <strong className={currentBalance - previousMonthBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ৳{formatAmount(currentBalance - previousMonthBalance)}
                            </strong></span>
                        </div>
                    </div>
                </div>
            </MainAccountLayout>
        </>
    );
};

export default BankReport;
