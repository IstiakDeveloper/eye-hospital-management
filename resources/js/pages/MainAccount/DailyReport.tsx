import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Printer, ArrowLeft } from 'lucide-react';

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
    hospital_name: string;
    hospital_location: string;
}

const DailyReport: React.FC<DailyReportProps> = ({
    date,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words,
    hospital_name,
    hospital_location
}) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout>
            <Head title={`${voucher_type} Voucher Report - ${date}`} />

            {/* Screen Only Controls */}
            <div className="flex items-center justify-between mb-6 print:hidden">
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

            {/* Print Content */}
            <div className="bg-white shadow-sm rounded-lg">
                <div className="printable-content p-6 max-w-4xl mx-auto border-2 border-black">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-black mb-2">{hospital_name}</h1>
                        <p className="text-base text-black mb-3">{hospital_location}</p>
                        <p className="text-base font-semibold text-black">
                            {voucher_type === 'Debit' ? 'Debit/Receipt' : 'Credit/Payment'} Voucher
                        </p>
                    </div>

                    {/* Date */}
                    <div className="flex justify-end mb-4">
                        <div className="border border-black px-2 py-1">
                            <span className="text-sm font-semibold">Date: {date}</span>
                        </div>
                    </div>

                    {/* Vouchers Table */}
                    <div className="border border-black">
                        <table className="w-full border-collapse">
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
                                        <td className="border-r border-black px-2 py-2 text-sm">{voucher.narration}</td>
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
                                    <td className="border-r border-black px-2 py-2 font-semibold text-sm" colSpan={4}>&nbsp;</td>
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
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }

                    @page {
                        size: A4;
                        margin: 0.8in;
                    }

                    .print\\:hidden {
                        display: none !important;
                    }

                    ::-webkit-scrollbar {
                        display: none !important;
                    }

                    .printable-content {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 15px !important;
                        background: white !important;
                        color: black !important;
                        font-size: 10pt !important;
                        line-height: 1.2 !important;
                        border: 2px solid black !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
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
            `}</style>
        </AdminLayout>
    );
};

export default DailyReport;
