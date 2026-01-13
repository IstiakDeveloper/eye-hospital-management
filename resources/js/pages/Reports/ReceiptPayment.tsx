import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Printer } from 'lucide-react';
import MainAccountLayout from '@/layouts/MainAccountLayout';

interface ReceiptPaymentItem {
    serial: number;
    category: string;
    current_month: number;
    cumulative: number;
    type: string;
}

interface ReceiptPaymentProps {
    openingBalance: {
        current: number;
        cumulative: number;
    };
    closingBalance: {
        current: number;
        cumulative: number;
    };
    receipts: ReceiptPaymentItem[];
    payments: ReceiptPaymentItem[];
    totals: {
        current_month_receipts: number;
        cumulative_receipts: number;
        current_month_payments: number;
        cumulative_payments: number;
        current_receipt_side_total: number;
        current_payment_side_total: number;
        cumulative_receipt_side_total: number;
        cumulative_payment_side_total: number;
    };
    filters: {
        from_date: string;
        to_date: string;
    };
    verification: {
        current_is_balanced: boolean;
        current_difference: number;
        cumulative_is_balanced: boolean;
        cumulative_difference: number;
    };
}

const ReceiptPayment: React.FC<ReceiptPaymentProps> = ({
    openingBalance,
    closingBalance,
    receipts,
    payments,
    totals,
    filters,
    verification
}) => {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);

    const handleFilter = () => {
        router.get('/reports/receipt-payment', {
            from_date: fromDate,
            to_date: toDate
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        window.open(`/reports/receipt-payment/export?from_date=${fromDate}&to_date=${toDate}`, '_blank');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <MainAccountLayout>
            <Head title="Receipt & Payment Report" />

            <div className="p-6">
                {/* Header Section - No Print */}
                <div className="no-print mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">Receipt & Payment Report</h1>
                            <p className="text-gray-600 mt-1">Statement of Receipts & Payments</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={handleExport} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">From Date</label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">To Date</label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleFilter}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Apply Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Content - Printable */}
                <div className="bg-white shadow-lg rounded-lg print-section" style={{ padding: '28px' }}>
                    {/* Report Header */}
                    <div className="mb-1">
                        <div className="text-center mb-0">
                            <h1 className="text-base font-bold mb-0">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                            <p className="text-xs mb-0">Circuit House Adjacent, Main Road, Naogaon.</p>
                        </div>
                        <h2 className="text-sm font-bold text-center mt-1 mb-0">Statement of Receipts & Payments</h2>
                        <p className="text-xs text-right mb-0">
                            Date: {formatDate(fromDate)} to {formatDate(toDate)}
                        </p>
                    </div>

                    {/* Verification Status */}
                    {(!verification.current_is_balanced || !verification.cumulative_is_balanced) && (
                        <div className="no-print mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                            {!verification.current_is_balanced && (
                                <p className="text-yellow-800 text-sm font-medium">
                                    ⚠️ Warning: Current Month not balanced. Difference: ৳ {formatCurrency(Math.abs(verification.current_difference))}
                                </p>
                            )}
                            {!verification.cumulative_is_balanced && (
                                <p className="text-yellow-800 text-sm font-medium">
                                    ⚠️ Warning: Cumulative not balanced. Difference: ৳ {formatCurrency(Math.abs(verification.cumulative_difference))}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Main Report Table */}
                    <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                        <thead>
                            <tr>
                                <th colSpan={4} className="border-2 border-gray-900 bg-gray-200 px-2 py-1 text-center font-bold text-xs">
                                    Receipts
                                </th>
                                <th colSpan={4} className="border-l-4 border-t-2 border-r-2 border-b-2 border-gray-900 bg-gray-200 px-2 py-2 text-center font-bold">
                                    Payments
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Cumulative</th>
                                <th className="border-l-4 border-r border-t border-b border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Cumulative</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data Rows - including Opening Balance as first receipt and Closing Balance as last payment */}
                            {Array.from({ length: Math.max(receipts.length + 1, payments.length + 1) }).map((_, index) => {
                                // First row: Opening Balance on receipt side
                                const isFirstRow = index === 0;
                                const isClosingRow = index === payments.length;
                                const receipt = isFirstRow ? null : receipts[index - 1];
                                const payment = isClosingRow ? null : payments[index];

                                return (
                                    <tr key={index}>
                                        {/* Receipt Side */}
                                        {isFirstRow ? (
                                            <>
                                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">1</td>
                                                <td className="border border-gray-800 px-2 py-1 font-semibold text-xs">Opening Cash in Hand</td>
                                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(openingBalance.current)}</td>
                                                <td className="border-2 border-r-gray-900 border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(openingBalance.cumulative)}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">
                                                    {receipt ? receipt.serial + 1 : ''}
                                                </td>
                                                <td className="border border-gray-800 px-2 py-1 text-xs">
                                                    {receipt?.category || ''}
                                                </td>
                                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">
                                                    {receipt ? formatCurrency(receipt.current_month) : ''}
                                                </td>
                                                <td className="border-2 border-r-gray-900 border-gray-800 px-2 py-1 text-right text-xs">
                                                    {receipt ? formatCurrency(receipt.cumulative) : ''}
                                                </td>
                                            </>
                                        )}

                                        {/* Payment Side */}
                                        {isClosingRow ? (
                                            <>
                                                <td className="border-l-4 border-r border-t border-b border-gray-800 px-2 py-1 text-center text-xs">{payments.length + 1}</td>
                                                <td className="border border-gray-800 px-2 py-1 font-semibold text-xs">Closing Bank Balance</td>
                                                <td className="border border-gray-800 px-2 py-1 text-right font-semibold text-xs">{formatCurrency(closingBalance.current)}</td>
                                                <td className="border border-gray-800 px-2 py-1 text-right font-semibold text-xs">{formatCurrency(closingBalance.cumulative)}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="border-l-4 border-r border-t border-b border-gray-800 px-2 py-1 text-center text-xs">
                                                    {payment ? payment.serial : ''}
                                                </td>
                                                <td className="border border-gray-800 px-2 py-1 text-xs">
                                                    {payment?.category || ''}
                                                </td>
                                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">
                                                    {payment ? formatCurrency(payment.current_month) : ''}
                                                </td>
                                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">
                                                    {payment ? formatCurrency(payment.cumulative) : ''}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}

                            {/* Grand Total Row */}
                            <tr className="font-bold bg-gray-100">
                                <td colSpan={2} className="border-2 border-gray-900 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border-2 border-gray-900 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_receipt_side_total)}
                                </td>
                                <td className="border-2 border-gray-900 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_receipt_side_total)}
                                </td>
                                <td className="border-l-4 border-t-2 border-r border-b-2 border-gray-800 px-2 py-2 text-center text-xs"></td>
                                <td className="border-2 border-gray-900 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border-2 border-gray-900 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_payment_side_total)}
                                </td>
                                <td className="border-2 border-gray-900 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_payment_side_total)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="mt-5 grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-7">
                                <p className="font-medium text-xs">Prepared By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-7">
                                <p className="font-medium text-xs">Checked By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-7">
                                <p className="font-medium text-xs">Approved By</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        padding: 18px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    table {
                        page-break-inside: auto;
                        font-size: 10px !important;
                        width: 100%;
                    }
                    table th {
                        font-size: 10px !important;
                        padding: 3px 4px !important;
                        border: 1px solid #000 !important;
                        font-weight: bold;
                    }
                    table td {
                        font-size: 10px !important;
                        padding: 2px 4px !important;
                        border: 1px solid #000 !important;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    h1 {
                        font-size: 17px !important;
                        margin-bottom: 0px !important;
                        font-weight: bold;
                    }
                    h2 {
                        font-size: 15px !important;
                        margin-top: 1px !important;
                        margin-bottom: 1px !important;

                    }
                    p {
                        font-size: 13px !important;
                        margin: 0px !important;
                    }
                }
            `}</style>
        </MainAccountLayout>
    );
};

export default ReceiptPayment;
