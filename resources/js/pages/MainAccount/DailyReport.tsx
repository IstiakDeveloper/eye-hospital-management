import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import React from 'react';

interface DailyReportProps {
    date: string;
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

const DailyReport: React.FC<DailyReportProps> = ({ date, voucher_type, vouchers, total_amount, amount_in_words }) => {
    const handlePrint = () => {
        window.print();
    };

    const trimNarration = (text: string, maxLength: number = 50) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="print:p-0">
            {/* AdminLayout only for screen view */}
            <div className="print:hidden">
                <AdminLayout>
                    <Head title={`${voucher_type} Voucher Report - ${date}`} />

                    {/* Screen Only Controls */}
                    <div className="mb-6 flex items-center justify-between">
                        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Reports
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            <Printer className="h-4 w-4" />
                            Print Report
                        </button>
                    </div>

                    {/* Print Content Preview */}
                    <div className="rounded-lg bg-white shadow-sm">
                        <PrintableContent
                            date={date}
                            voucher_type={voucher_type}
                            vouchers={vouchers}
                            total_amount={total_amount}
                            amount_in_words={amount_in_words}
                            trimNarration={trimNarration}
                        />
                    </div>
                </AdminLayout>
            </div>

            {/* Print Only Content */}
            <div className="hidden print:block">
                <Head title={`${voucher_type} Voucher Report - ${date}`} />
                <PrintableContent
                    date={date}
                    voucher_type={voucher_type}
                    vouchers={vouchers}
                    total_amount={total_amount}
                    amount_in_words={amount_in_words}
                    trimNarration={trimNarration}
                />
            </div>

            {/* Print Styles */}
            <style
                dangerouslySetInnerHTML={{
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
                    }
                `,
                }}
            />
        </div>
    );
};

// Separate component for the printable content
const PrintableContent = ({
    date,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words,
    trimNarration,
}: {
    date: string;
    voucher_type: 'Debit' | 'Credit';
    vouchers: Array<{ sl_no: string; voucher_no: string; date: string; narration: string; amount: string }>;
    total_amount: string;
    amount_in_words: string;
    trimNarration: (text: string, maxLength?: number) => string;
}) => (
    <div className="printable-content mx-auto max-w-4xl border-2 border-black p-6 print:mx-0 print:max-w-none">
        {/* Header */}
        <div className="mb-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-black">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
            <p className="mb-1 text-base text-black">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
            <p className="mb-3 text-sm text-black">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
            <p className="text-base font-semibold text-black">{voucher_type === 'Debit' ? 'Debit/Payment' : 'Credit/Receipt'} Voucher</p>
        </div>

        {/* Date */}
        <div className="mb-4 flex justify-end">
            <div className="border border-black px-2 py-1">
                <span className="text-sm font-semibold">Date: {date}</span>
            </div>
        </div>

        {/* Vouchers Table */}
        <div className="border border-black">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-black">
                        <th className="w-12 border-r border-black bg-gray-50 px-2 py-2 text-left text-sm font-semibold">SL</th>
                        <th className="w-20 border-r border-black bg-gray-50 px-2 py-2 text-left text-sm font-semibold">Voucher No</th>
                        <th className="w-20 border-r border-black bg-gray-50 px-2 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="border-r border-black bg-gray-50 px-2 py-2 text-left text-sm font-semibold">Narration</th>
                        <th className="w-24 bg-gray-50 px-2 py-2 text-right text-sm font-semibold">Amount</th>
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

                    {/* Empty rows for padding */}
                    {Array.from({ length: Math.max(0, 10 - vouchers.length) }).map((_, i) => (
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
                        <td className="border-r border-black px-2 py-2 text-sm font-semibold" colSpan={4}>
                            &nbsp;
                        </td>
                        <td className="px-2 py-2 text-right text-base font-bold">{total_amount}</td>
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

        {/* Signature Section */}
        <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="text-center">
                <div className="mb-2 border-b border-black pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Prepared by</p>
            </div>
            <div className="text-center">
                <div className="mb-2 border-b border-black pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Checked by</p>
            </div>
            <div className="text-center">
                <div className="mb-2 border-b border-black pb-8">&nbsp;</div>
                <p className="text-sm font-semibold">Approved by</p>
            </div>
        </div>
    </div>
);

export default DailyReport;
