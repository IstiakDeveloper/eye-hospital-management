import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Calendar, Download, Filter, Printer } from 'lucide-react';

interface ReceiptPaymentReportProps {
    reportTitle: string;
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
}

const ReceiptAndPaymentReport: React.FC<ReceiptPaymentReportProps> = ({
    reportTitle,
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
    hospital_location
}) => {
    // Get current month's first and last date
    const getCurrentMonthDates = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0]
        };
    };

    const currentMonthDates = getCurrentMonthDates();
    const [customStartDate, setCustomStartDate] = useState(startDate || currentMonthDates.start);
    const [customEndDate, setCustomEndDate] = useState(endDate || currentMonthDates.end);

    const handlePrint = () => {
        window.print();
    };

    const handleFilter = () => {
        router.get('/main-account/receipt-payment-report', {
            date_from: customStartDate,
            date_to: customEndDate
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

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

                    .grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 15px !important;
                    }

                    .border-2 {
                        border: 2px solid #000 !important;
                    }

                    .border-green-600, .border-red-600 {
                        border-color: #000 !important;
                    }

                    .bg-green-600, .bg-red-600 {
                        background-color: #f0f0f0 !important;
                        color: #000 !important;
                    }

                    .space-y-3 > * + * {
                        margin-top: 12px !important;
                    }

                    .print-summary {
                        margin-top: 20px;
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 11px;
                    }

                    .bg-green-50, .bg-red-50, .bg-yellow-100, .bg-gray-50 {
                        background-color: transparent !important;
                    }

                    .text-green-700, .text-red-700 {
                        color: #000 !important;
                    }

                    .border {
                        border: 1px solid #000 !important;
                    }
                }
            `}</style>

            <MainAccountLayout title="Receipt and Payment Report">
                {/* Filter Section - Hidden in Print */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <label className="text-sm font-medium">From:</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            />
                            <label className="text-sm font-medium ml-2">To:</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            />
                        </div>

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

                    {/* Main Report - Side by Side Layout */}
                    <div className="grid grid-cols-2 gap-4 mb-6 print:grid-cols-2">
                        {/* RECEIPTS SECTION */}
                        <div className="bg-white border-2 border-green-600 rounded-lg overflow-hidden">
                            <div className="bg-green-600 text-white px-4 py-3 font-bold text-center">RECEIPTS</div>
                            <div className="p-4">
                                {/* Opening Balance */}
                                <div className="mb-4 pb-3 border-b border-gray-300">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">To Opening Balance</span>
                                        <span className="font-bold text-lg">৳{formattedOpeningBalance}</span>
                                    </div>
                                </div>

                                {/* Receipt Items */}
                                {receiptRows.length > 0 ? (
                                    <div className="space-y-3">
                                        {receiptRows.map((row, index) => (
                                            <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        By {row.account_name}
                                                    </span>
                                                    <span className="font-bold text-green-700">৳{formatAmount(row.amount)}</span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {row.type_name} <span className="text-gray-500">({row.count})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-4">No receipts</div>
                                )}

                                {/* Subtotal */}
                                <div className="mt-4 pt-3 border-t border-green-600">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">TOTAL</span>
                                        <span className="font-bold text-lg text-green-700">৳{formatAmount(openingBalance + totalReceipts)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAYMENTS SECTION */}
                        <div className="bg-white border-2 border-red-600 rounded-lg overflow-hidden">
                            <div className="bg-red-600 text-white px-4 py-3 font-bold text-center">PAYMENTS</div>
                            <div className="p-4">
                                {/* Payment Items */}
                                {paymentRows.length > 0 ? (
                                    <div className="space-y-3">
                                        {paymentRows.map((row, index) => (
                                            <div key={index} className="bg-red-50 p-3 rounded border border-red-200">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-800">
                                                        To {row.account_name}
                                                    </span>
                                                    <span className="font-bold text-red-700">৳{formatAmount(row.amount)}</span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {row.type_name} <span className="text-gray-500">({row.count})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-4">No payments</div>
                                )}

                            {/* Closing Balance */}
                                <div className="mt-4 pt-3 border-t border-red-600">
                                    <div className="flex justify-between items-center bg-yellow-100 p-2 rounded mb-3">
                                        <span className="font-medium text-gray-700">To Closing Balance</span>
                                        <span className="font-bold text-lg">৳{formattedClosingBalance}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">TOTAL</span>
                                        <span className="font-bold text-lg text-red-700">৳{formatAmount(totalPayments + closingBalance)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
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
