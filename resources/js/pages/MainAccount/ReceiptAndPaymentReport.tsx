import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Calendar, Download, Filter, Printer } from 'lucide-react';

interface ReceiptPaymentReportProps {
    reportTitle: string;
    reportType: 'monthly' | 'custom';
    startDate: string;
    endDate: string;
    openingBalance: number;
    closingBalance: number;
    netChange: number;
    totalReceipts: number;
    totalPayments: number;
    receipts: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    payments: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    accountSummary: {
        [key: string]: {
            account_name: string;
            receipts: number;
            payments: number;
            net_change: number;
            formatted_receipts: string;
            formatted_payments: string;
            formatted_net_change: string;
        };
    };
    formattedOpeningBalance: string;
    formattedClosingBalance: string;
    formattedNetChange: string;
    formattedTotalReceipts: string;
    formattedTotalPayments: string;
    hospital_name: string;
    hospital_location: string;
    month?: number;
    year?: number;
}

const ReceiptAndPaymentReport: React.FC<ReceiptPaymentReportProps> = ({
    reportTitle,
    reportType,
    startDate,
    endDate,
    openingBalance,
    closingBalance,
    netChange,
    totalReceipts,
    totalPayments,
    receipts,
    payments,
    accountSummary,
    formattedOpeningBalance,
    formattedClosingBalance,
    formattedNetChange,
    formattedTotalReceipts,
    formattedTotalPayments,
    hospital_name,
    hospital_location,
    month,
    year
}) => {
    const [selectedReportType, setSelectedReportType] = useState(reportType);
    const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
    const [customStartDate, setCustomStartDate] = useState(startDate);
    const [customEndDate, setCustomEndDate] = useState(endDate);

    const handlePrint = () => {
        window.print();
    };

    const handleFilter = () => {
        if (selectedReportType === 'monthly') {
            router.get('/main-account/receipt-payment-report', {
                report_type: 'monthly',
                month: selectedMonth,
                year: selectedYear
            });
        } else {
            router.get('/main-account/receipt-payment-report', {
                report_type: 'custom',
                date_from: customStartDate,
                date_to: customEndDate
            });
        }
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

    // Process receipts and payments data for display
    const receiptRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];
    const paymentRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];

    // Flatten receipts data
    Object.entries(receipts).forEach(([account, items]) => {
        items.forEach(item => {
            receiptRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Flatten payments data
    Object.entries(payments).forEach(([account, items]) => {
        items.forEach(item => {
            paymentRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Find maximum rows to align tables
    const maxRows = Math.max(receiptRows.length, paymentRows.length, 1);

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
                        size: A4;
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
                        font-size: 12px !important;
                    }

                    th, td {
                        border: 1px solid #000 !important;
                        padding: 4px 6px !important;
                    }

                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    .print-summary {
                        margin-top: 20px;
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 11px;
                    }

                    .bg-gray-50, .bg-green-50, .bg-red-50, .bg-blue-50 {
                        background-color: transparent !important;
                    }

                    .bg-green-200, .bg-red-200, .bg-yellow-50, .bg-gray-200 {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            `}</style>

            <MainAccountLayout title="Receipt and Payment Report">
                {/* Filter Section - Hidden in Print */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Report Type:</label>
                            <select
                                value={selectedReportType}
                                onChange={(e) => setSelectedReportType(e.target.value as 'monthly' | 'custom')}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom Date Range</option>
                            </select>
                        </div>

                        {selectedReportType === 'monthly' ? (
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
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="border rounded px-3 py-1 text-sm"
                                />
                                <span className="text-sm">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="border rounded px-3 py-1 text-sm"
                                />
                            </div>
                        )}

                        <button onClick={handleFilter} className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                            <Filter className="w-3 h-3" />Filter
                        </button>

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
                    {/* Report Header */}
                    <div className="text-center mb-6 print-header">
                        <h1 className="text-2xl font-bold">{hospital_name}</h1>
                        <p className="text-lg">{hospital_location}</p>
                        <h2 className="text-xl font-bold mt-2">Receipt and Payment Report</h2>
                        <p className="text-lg font-semibold">{reportTitle}</p>
                    </div>

                    {/* Main Report Table */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="border border-gray-400 px-3 py-2 font-bold w-1/2 bg-green-600">RECEIPTS</th>
                                    <th className="border border-gray-400 px-3 py-2 font-bold w-1/2 bg-red-600">PAYMENTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Opening Balance Row */}
                                <tr className="bg-yellow-50">
                                    <td className="border border-gray-300 px-3 py-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">To Opening Balance</span>
                                            <span className="font-bold">৳{formattedOpeningBalance}</span>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 bg-gray-50"></td>
                                </tr>

                                {/* Data Rows */}
                                {Array.from({ length: maxRows }).map((_, index) => {
                                    const receiptRow = receiptRows[index];
                                    const paymentRow = paymentRows[index];

                                    return (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-300 px-3 py-2 bg-green-50">
                                                {receiptRow ? (
                                                    <div className="flex justify-between">
                                                        <span>
                                                            By {receiptRow.account_name} - {receiptRow.type_name}
                                                            <span className="text-xs text-gray-500 ml-1">({receiptRow.count})</span>
                                                        </span>
                                                        <span className="font-bold">৳{formatAmount(receiptRow.amount)}</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 bg-red-50">
                                                {paymentRow ? (
                                                    <div className="flex justify-between">
                                                        <span>
                                                            To {paymentRow.account_name} - {paymentRow.type_name}
                                                            <span className="text-xs text-gray-500 ml-1">({paymentRow.count})</span>
                                                        </span>
                                                        <span className="font-bold">৳{formatAmount(paymentRow.amount)}</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Closing Balance Row */}
                                <tr className="bg-yellow-50">
                                    <td className="border border-gray-300 px-3 py-2 bg-gray-50"></td>
                                    <td className="border border-gray-300 px-3 py-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">To Closing Balance</span>
                                            <span className="font-bold">৳{formattedClosingBalance}</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 px-3 py-2 bg-green-200">
                                        <div className="flex justify-between">
                                            <span>TOTAL</span>
                                            <span>৳{formatAmount(openingBalance + totalReceipts)}</span>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 bg-red-200">
                                        <div className="flex justify-between">
                                            <span>TOTAL</span>
                                            <span>৳{formatAmount(totalPayments + closingBalance)}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Account-wise Summary */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 font-bold">Account-wise Summary</div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 text-gray-800 font-medium">
                                    <th className="border border-gray-300 px-3 py-2">Account</th>
                                    <th className="border border-gray-300 px-3 py-2 bg-green-100">Receipts</th>
                                    <th className="border border-gray-300 px-3 py-2 bg-red-100">Payments</th>
                                    <th className="border border-gray-300 px-3 py-2 bg-blue-100">Net Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(accountSummary).map(([account, summary]) => (
                                    <tr key={account} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2 font-medium">{summary.account_name}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-green-50">
                                            ৳{summary.formatted_receipts}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-right bg-red-50">
                                            ৳{summary.formatted_payments}
                                        </td>
                                        <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${summary.net_change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                            ৳{summary.formatted_net_change}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-4 bg-gray-50 p-4 rounded border print-summary">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-gray-600">Opening Balance</div>
                                <div className="font-bold text-lg">৳{formattedOpeningBalance}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Total Receipts</div>
                                <div className="font-bold text-lg text-green-600">৳{formattedTotalReceipts}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Total Payments</div>
                                <div className="font-bold text-lg text-red-600">৳{formattedTotalPayments}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Closing Balance</div>
                                <div className={`font-bold text-lg ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ৳{formattedClosingBalance}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t text-center">
                            <span className="text-gray-600">Net Change: </span>
                            <strong className={`text-lg ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ৳{formattedNetChange}
                            </strong>
                        </div>
                    </div>
                </div>
            </MainAccountLayout>
        </>
    );
};

export default ReceiptAndPaymentReport;
