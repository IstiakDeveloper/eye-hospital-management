
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
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
    hospital_name: string;
    hospital_location: string;
}

const YearlyReport: React.FC<YearlyReportProps> = ({
    year,
    voucher_type,
    vouchers,
    total_amount,
    amount_in_words,
    hospital_name,
    hospital_location
}) => {
    return (
        <AdminLayout>
            <Head title={`${voucher_type} Voucher Report - ${year}`} />

            <div className="flex items-center justify-between mb-6 print:hidden">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Printer className="w-4 h-4" />
                    Print Report
                </button>
            </div>

            <div className="bg-white print:shadow-none print:m-0 print:p-0 shadow-sm rounded-lg p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-black mb-2">{hospital_name}</h1>
                        <p className="text-lg text-black mb-4">{hospital_location}</p>
                        <p className="text-lg font-semibold text-black">
                            {voucher_type}/Payment Voucher - {year}
                        </p>
                    </div>

                    <div className="border-2 border-black">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="border-r-2 border-black px-2 py-3 text-left font-semibold">SL</th>
                                    <th className="border-r-2 border-black px-2 py-3 text-left font-semibold">Voucher No</th>
                                    <th className="border-r-2 border-black px-2 py-3 text-left font-semibold">Date</th>
                                    <th className="border-r-2 border-black px-2 py-3 text-left font-semibold">Narration</th>
                                    <th className="px-2 py-3 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vouchers.map((voucher, index) => (
                                    <tr key={index} className="border-b border-black">
                                        <td className="border-r-2 border-black px-2 py-2">{voucher.sl_no}</td>
                                        <td className="border-r-2 border-black px-2 py-2">{voucher.voucher_no}</td>
                                        <td className="border-r-2 border-black px-2 py-2">{voucher.date}</td>
                                        <td className="border-r-2 border-black px-2 py-2">{voucher.narration}</td>
                                        <td className="px-2 py-2 text-right">{voucher.amount}</td>
                                    </tr>
                                ))}

                                <tr className="border-b-2 border-black bg-gray-50">
                                    <td className="border-r-2 border-black px-2 py-3 font-semibold" colSpan={4}>&nbsp;</td>
                                    <td className="px-2 py-3 text-right font-bold text-lg">{total_amount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 mb-8">
                        <p className="font-semibold">
                            In Word: <span className="underline">{amount_in_words}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-8 mt-16">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                            <p className="font-semibold">Prepared by</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                            <p className="font-semibold">Checked by</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 pb-8">&nbsp;</div>
                            <p className="font-semibold">Approved by</p>
                        </div>
                    </div>
                </div>
            </div>

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

export default YearlyReport;
