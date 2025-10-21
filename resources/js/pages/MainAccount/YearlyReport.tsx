import React from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';

interface YearlyReportProps {
    year: number;
    voucher_type: 'Debit' | 'Credit';
    vouchers: Array<{
        sl_no: string;
        voucher_no: string;
        date: string;
        narration: string;
        amount: string;
    }>;
    total_amount: string;
    amount_in_words: string;
}

const YearlyReport: React.FC<YearlyReportProps> = ({
    year,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words
}) => {
    const handlePrint = () => {
        window.print();
    };

    const trimNarration = (text: string, maxLength: number = 45) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="print:p-0">
            {/* Screen Only Content */}
            <div className="print:hidden">
                <Head title={`${voucher_type} Voucher Yearly Report - ${year}`} />

                {/* Screen Only Controls */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Reports
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Printer className="w-4 h-4" />
                        Print Report
                    </button>
                </div>

                {/* Print Content Preview */}
                <div className="bg-white shadow-sm rounded-lg">
                    <PrintableContent
                        year={year}
                        voucher_type={voucher_type}
                        vouchers={vouchers}
                        total_amount={total_amount}
                        amount_in_words={amount_in_words}
                        trimNarration={trimNarration}
                    />
                </div>
            </div>

            {/* Print Only Content */}
            <div className="hidden print:block">
                <Head title={`${voucher_type} Voucher Yearly Report - ${year}`} />
                <PrintableContent
                    year={year}
                    voucher_type={voucher_type}
                    vouchers={vouchers}
                    total_amount={total_amount}
                    amount_in_words={amount_in_words}
                    trimNarration={trimNarration}
                />
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        @page {
                            size: A4;
                            margin: 0.6in;
                        }

                        .print\\:hidden {
                            display: none !important;
                        }

                        .print\\:block {
                            display: block !important;
                        }

                        .print\\:p-0 {
                            padding: 0 !important;
                        }

                        .printable-content {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 12px !important;
                            background: white !important;
                            color: black !important;
                            font-size: 9pt !important;
                            line-height: 1.1 !important;
                            border: 2px solid black !important;
                            box-sizing: border-box !important;
                        }

                        .printable-content h1 {
                            font-size: 13pt !important;
                            margin-bottom: 5px !important;
                        }

                        .printable-content p {
                            font-size: 9pt !important;
                            margin: 2px 0 !important;
                        }

                        .printable-content table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            font-size: 8pt !important;
                            margin-bottom: 8px !important;
                        }

                        .printable-content td,
                        .printable-content th {
                            border: 1px solid black !important;
                            padding: 3px !important;
                            font-size: 8pt !important;
                            line-height: 1.1 !important;
                        }

                        .bg-gray-50 {
                            background-color: #f8f9fa !important;
                        }

                        .bg-gray-100 {
                            background-color: #e9ecef !important;
                        }

                        /* Better page breaking for long tables */
                        .voucher-table {
                            page-break-inside: auto;
                        }

                        .voucher-table tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }

                        .voucher-table thead {
                            display: table-header-group;
                        }

                        .voucher-table tfoot {
                            display: table-footer-group;
                        }

                        /* Signature section should stay together */
                        .signature-section {
                            page-break-inside: avoid;
                        }

                        /* Summary info */
                        .summary-info {
                            page-break-inside: avoid;
                        }
                    }
                `
            }} />
        </div>
    );
};

// Separate component for the printable content
const PrintableContent = ({
    year,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words,
    trimNarration
}: {
    year: number;
    voucher_type: 'Debit' | 'Credit';
    vouchers: Array<{ sl_no: string; voucher_no: string; date: string; narration: string; amount: string; }>;
    total_amount: string;
    amount_in_words: string;
    trimNarration: (text: string, maxLength?: number) => string;
}) => (
    <div className="printable-content p-6 max-w-4xl mx-auto border-2 border-black print:max-w-none print:mx-0">
        {/* Header */}
        <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-black mb-2">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
            <p className="text-base text-black mb-1">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
            <p className="text-sm text-black mb-3">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
            <p className="text-base font-semibold text-black">
                Yearly {voucher_type === 'Debit' ? 'Debit/Payment' : 'Credit/Receipt'} Voucher Report
            </p>
        </div>

        {/* Year */}
        <div className="flex justify-end mb-4">
            <div className="border border-black px-2 py-1">
                <span className="text-sm font-semibold">Year: {year}</span>
            </div>
        </div>

        {/* Summary Info */}
        <div className="summary-info mb-4 flex justify-between items-center">
            <div className="text-sm">
                <span className="font-semibold">Total Entries:</span> {vouchers.length}
            </div>
            <div className="text-sm">
                <span className="font-semibold">Report Generated:</span> {new Date().toLocaleDateString('en-GB')}
            </div>
        </div>

        {/* Vouchers Table */}
        <div className="border border-black">
            <table className="w-full border-collapse voucher-table">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-10">SL</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-16">Voucher No</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-16">Date</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm">Narration</th>
                        <th className="px-2 py-2 text-right font-semibold bg-gray-50 text-sm w-20">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {vouchers.map((voucher, index) => (
                        <tr key={index} className="border-b border-black">
                            <td className="border-r border-black px-2 py-1 text-xs">{voucher.sl_no}</td>
                            <td className="border-r border-black px-2 py-1 text-xs">{voucher.voucher_no}</td>
                            <td className="border-r border-black px-2 py-1 text-xs">{voucher.date}</td>
                            <td className="border-r border-black px-2 py-1 text-xs">{trimNarration(voucher.narration)}</td>
                            <td className="px-2 py-1 text-right text-xs">{voucher.amount}</td>
                        </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="border-b border-black bg-gray-100">
                        <td className="border-r border-black px-2 py-2 font-semibold text-sm" colSpan={4}>
                            <span className="font-bold">GRAND TOTAL ({year})</span>
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-base">{total_amount}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Amount in Words */}
        <div className="mt-3 mb-6">
            <p className="text-sm font-semibold">
                In Word: <span className="underline">{amount_in_words}</span>
            </p>
        </div>

        {/* Additional Summary */}
        <div className="summary-info border border-black p-3 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p><span className="font-semibold">Report Type:</span> Yearly {voucher_type} Report</p>
                    <p><span className="font-semibold">Period:</span> January 1, {year} to December 31, {year}</p>
                </div>
                <div>
                    <p><span className="font-semibold">Total Transactions:</span> {vouchers.length}</p>
                    <p><span className="font-semibold">Average Amount:</span> {vouchers.length > 0 ?
                        (parseFloat(total_amount.replace(/,/g, '')) / vouchers.length).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }) : '0.00'}</p>
                </div>
            </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Prepared by</p>
                <p className="text-xs mt-1">Accounts Department</p>
            </div>
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Checked by</p>
                <p className="text-xs mt-1">Chief Accountant</p>
            </div>
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Approved by</p>
                <p className="text-xs mt-1">Management</p>
            </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-600">
                This is a computer generated report. Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
            </p>
        </div>
    </div>
);

export default YearlyReport;
