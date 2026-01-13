import AdminLayout from '@/layouts/MainAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface ReportItem {
    sl: number;
    transaction_id: number;
    receipt_date: string;
    transaction_no: string;
    booking_no: string;
    patient_id: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    operation_name: string;
    operation_code: string;
    operation_type: string;
    doctor_name: string | null;
    scheduled_date: string;
    base_amount: number;
    discount: number;
    total_bill: number;
    payment_received: number;
    total_paid: number;
    remaining_due: number;
    status: string;
}

interface Summary {
    total_receipts: number;
    total_base_amount: number;
    total_discount: number;
    total_bill: number;
    total_received: number;
}

interface Props {
    reportData: ReportItem[];
    summary: Summary;
    filters: {
        from_date: string;
        to_date: string;
        search: string | null;
    };
}

export default function OperationIncomeReport({ reportData, summary, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = () => {
        router.get(
            route('operation-account.reports.operation-income'),
            {
                from_date: fromDate,
                to_date: toDate,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const excelData = [];

        excelData.push(['Operation Income Receipt Report']);
        excelData.push([
            `Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        ]);
        excelData.push([]);

        excelData.push([
            'SL',
            'DATE',
            'PATIENT ID',
            'PATIENT NAME',
            'AGE',
            'OPERATION',
            'BILL AMOUNT',
            'DISCOUNT',
            'NET BILL',
            'RECEIVED',
        ]);

        reportData.forEach((item) => {
            excelData.push([
                item.sl,
                item.receipt_date,
                item.patient_id,
                item.patient_name,
                item.patient_age,
                item.operation_name,
                item.doctor_name || '-',
                item.base_amount.toFixed(2),
                item.discount.toFixed(2),
                item.total_bill.toFixed(2),
                item.payment_received.toFixed(2),
            ]);
        });

        excelData.push([]);
        excelData.push([
            '',
            '',
            '',
            '',
            '',
            '',
            'TOTAL',
            summary.total_base_amount.toFixed(2),
            summary.total_discount.toFixed(2),
            summary.total_bill.toFixed(2),
            summary.total_received.toFixed(2),
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Operation Receipts');
        XLSX.writeFile(wb, `Operation_Income_Receipts_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <>
            <Head title="Operation Income Report" />

            <AdminLayout>
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="mb-6 flex items-center justify-between print:hidden">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Operation Income Report</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Income and performance report for operations
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 rounded-lg bg-white p-4 shadow print:hidden">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Search</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search operations..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 flex gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Print
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Export Excel
                        </button>
                    </div>

                    <div id="printable-area">
                        <div className="overflow-hidden rounded-lg bg-white shadow report-section">
                            {/* Print Header */}
                            <div className="print-header mb-3">
                                <div className="text-center mb-2">
                                    <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                                    <h2 className="text-sm font-semibold mt-1">Operation Corner - Operation Income Receipt Report</h2>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs font-medium">Period Report</p>
                                    <p className="text-xs">
                                        {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                                SL
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                                DATE
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                                PATIENT
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                                OPERATION
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                                BILL
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-red-600">
                                                DISCOUNT
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                                NET BILL
                                            </th>
                                            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-green-600">
                                                RECEIVED
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {reportData.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                    No receipts found for the selected period
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {reportData.map((item) => (
                                                    <tr key={item.transaction_id} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">
                                                            {item.sl}
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">
                                                            {new Date(item.receipt_date).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-sm">
                                                            <span className="font-medium text-gray-900">{item.patient_name}</span>
                                                            <span className="text-xs text-gray-500"> (ID: {item.patient_id}, {item.patient_age}y/{item.patient_gender})</span>
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-sm">
                                                            <span className="font-medium text-gray-900">{item.operation_name}</span>
                                                            <span className="text-xs text-gray-500"> ({item.operation_code})</span>
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-900">
                                                            ৳{item.base_amount.toFixed(2)}
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm text-red-600">
                                                            ৳{item.discount.toFixed(2)}
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm font-medium text-gray-900">
                                                            ৳{item.total_bill.toFixed(2)}
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm font-semibold text-green-600">
                                                            ৳{item.payment_received.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                <tr className="bg-gray-100 font-bold">
                                                    <td
                                                        colSpan={4}
                                                        className="border border-gray-300 px-3 py-3 text-right text-sm text-gray-900"
                                                    >
                                                        TOTAL ({summary.total_receipts} receipts)
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-3 text-right text-sm text-gray-900">
                                                        ৳{summary.total_base_amount.toFixed(2)}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-3 text-right text-sm text-red-600">
                                                        ৳{summary.total_discount.toFixed(2)}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-3 text-right text-sm text-gray-900">
                                                        ৳{summary.total_bill.toFixed(2)}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-3 text-right text-sm text-green-600">
                                                        ৳{summary.total_received.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print-only styles */}
                <style>{`
                    .print-header {
                        display: none;
                    }

                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        body * {
                            visibility: hidden;
                        }
                        #printable-area,
                        #printable-area * {
                            visibility: visible;
                        }
                        #printable-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .report-section {
                            position: relative !important;
                            width: 100%;
                            background: white;
                            padding: 0 !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                        }
                        .print-header {
                            display: block !important;
                            visibility: visible !important;
                            margin-bottom: 8px !important;
                        }
                        .print-header h1 {
                            font-size: 12px !important;
                            margin: 0 0 4px 0 !important;
                            padding: 0 !important;
                            font-weight: bold;
                            line-height: 1.3 !important;
                            font-family: 'Arial', 'Helvetica', sans-serif !important;
                        }
                        .print-header h2 {
                            font-size: 10px !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            font-weight: bold;
                            font-family: 'Arial', 'Helvetica', sans-serif !important;
                        }
                        .print-header p {
                            font-size: 8px !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            font-family: 'Arial', 'Helvetica', sans-serif !important;
                        }
                        .print-header .flex {
                            display: flex !important;
                        }
                        .print-header .justify-between {
                            justify-content: space-between !important;
                        }
                        .print-header .items-center {
                            align-items: center !important;
                        }
                        button,
                        .mb-6,
                        .mb-4 {
                            display: none !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        @page {
                            size: A4 portrait;
                            margin: 8mm 10mm;
                        }
                        table {
                            font-size: 9px !important;
                            width: 100%;
                            border-collapse: collapse;
                            font-family: 'Arial', 'Helvetica', sans-serif !important;
                        }
                        table th {
                            font-size: 9px !important;
                            padding: 3px 4px !important;
                            border: 1px solid #000 !important;
                            font-weight: bold;
                            line-height: 1.3 !important;
                            background-color: #f3f4f6 !important;
                        }
                        table td {
                            font-size: 9px !important;
                            padding: 3px 4px !important;
                            border: 1px solid #000 !important;
                            line-height: 1.3 !important;
                        }
                        table td span {
                            display: inline !important;
                        }
                        tr {
                            page-break-inside: avoid;
                        }
                        thead {
                            display: table-header-group;
                        }
                        tbody {
                            display: table-row-group;
                        }
                        .text-xs {
                            font-size: 8px !important;
                        }
                        .text-sm {
                            font-size: 9px !important;
                        }
                        .font-medium {
                            font-weight: 600 !important;
                        }
                        .font-semibold {
                            font-weight: 700 !important;
                        }
                        .font-bold {
                            font-weight: bold !important;
                        }
                        .text-red-600 {
                            color: #dc2626 !important;
                        }
                        .text-green-600 {
                            color: #16a34a !important;
                        }
                        .text-gray-500 {
                            color: #6b7280 !important;
                        }
                        .text-gray-700 {
                            color: #374151 !important;
                        }
                        .text-gray-900 {
                            color: #111827 !important;
                        }
                        .bg-gray-100 {
                            background-color: #f3f4f6 !important;
                        }
                    }
                `}</style>
            </AdminLayout>
        </>
    );
}
