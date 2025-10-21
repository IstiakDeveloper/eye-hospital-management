import React from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';

interface MonthlyReportProps {
    month_name: string;
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

const MonthlyReport: React.FC<MonthlyReportProps> = ({
    month_name,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words
}) => {
    const handlePrint = () => {
        window.print();
    };

    const trimNarration = (text: string, maxLength: number = 50) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="print:p-0">
            {/* Screen Only Content */}
            <div className="print:hidden">
                <Head title={`${voucher_type} Voucher Monthly Report - ${month_name}`} />

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
                        month_name={month_name}
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
                <Head title={`${voucher_type} Voucher Monthly Report - ${month_name}`} />
                <PrintableContent
                    month_name={month_name}
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
                            margin: 0.8in;
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
                            padding: 15px !important;
                            background: white !important;
                            color: black !important;
                            font-size: 10pt !important;
                            line-height: 1.2 !important;
                            border: 2px solid black !important;
                            box-sizing: border-box !important;
                        }

                        .printable-content h1 {
                            font-size: 14pt !important;
                            margin-bottom: 6px !important;
                        }

                        .printable-content p {
                            font-size: 10pt !important;
                            margin: 3px 0 !important;
                        }

                        .printable-content table {
                            width: 100% !important;
                            border-collapse: collapse !important;
                            font-size: 9pt !important;
                            margin-bottom: 10px !important;
                        }

                        .printable-content td,
                        .printable-content th {
                            border: 1px solid black !important;
                            padding: 4px !important;
                            font-size: 9pt !important;
                        }

                        .bg-gray-50 {
                            background-color: #f8f9fa !important;
                        }

                        .bg-gray-100 {
                            background-color: #e9ecef !important;
                        }

                        /* Ensure long tables break properly */
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
                    }
                `
            }} />
        </div>
    );
};

// Separate component for the printable content
const PrintableContent = ({
    month_name,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words,
    trimNarration
}: {
    month_name: string;
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
                Monthly {voucher_type === 'Debit' ? 'Debit/Payment' : 'Credit/Receipt'} Voucher Report
            </p>
        </div>

        {/* Month */}
        <div className="flex justify-end mb-4">
            <div className="border border-black px-2 py-1">
                <span className="text-sm font-semibold">Month: {month_name}</span>
            </div>
        </div>

        {/* Vouchers Table */}
        <div className="border border-black">
            <table className="w-full border-collapse voucher-table">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-12">SL</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-20">Voucher No</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm w-20">Date</th>
                        <th className="border-r border-black px-2 py-2 text-left font-semibold bg-gray-50 text-sm">Narration</th>
                        <th className="px-2 py-2 text-right font-semibold bg-gray-50 text-sm w-24">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {vouchers.map((voucher, index) => (
                        <tr key={index} className="border-b border-black">
                            <td className="border-r border-black px-2 py-2 text-sm">{voucher.sl_no}</td>
                            <td className="border-r border-black px-2 py-2 text-sm">{voucher.voucher_no}</td>
                            <td className="border-r border-black px-2 py-2 text-sm">{voucher.date}</td>
                            <td className="border-r border-black px-2 py-2 text-sm">{trimNarration(voucher.narration)}</td>
                            <td className="px-2 py-2 text-right text-sm">{voucher.amount}</td>
                        </tr>
                    ))}

                    {/* Add some empty rows if there are too few entries */}
                    {vouchers.length < 5 && Array.from({ length: 5 - vouchers.length }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b border-black">
                            <td className="border-r border-black px-2 py-3">&nbsp;</td>
                            <td className="border-r border-black px-2 py-3">&nbsp;</td>
                            <td className="border-r border-black px-2 py-3">&nbsp;</td>
                            <td className="border-r border-black px-2 py-3">&nbsp;</td>
                            <td className="px-2 py-3">&nbsp;</td>
                        </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="border-b border-black bg-gray-100">
                        <td className="border-r border-black px-2 py-2 font-semibold text-sm" colSpan={4}>
                            <span className="font-bold">TOTAL</span>
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

        {/* Summary Info */}
        <div className="mt-4 mb-6">
            <p className="text-sm">
                <span className="font-semibold">Total Entries:</span> {vouchers.length}
            </p>
            <p className="text-sm">
                <span className="font-semibold">Report Generated On:</span> {new Date().toLocaleDateString('en-GB')}
            </p>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Prepared by</p>
            </div>
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Checked by</p>
            </div>
            <div className="text-center">
                <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Approved by</p>
            </div>
        </div>
    </div>
);

export default MonthlyReport;
