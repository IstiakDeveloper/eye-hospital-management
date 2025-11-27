import AdminLayout from '@/layouts/MainAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface ReportItem {
    id: number;
    sl: number;
    visit_date: string;
    visit_time: string;
    patient_name: string;
    patient_id: string;
    patient_phone: string;
    doctor_name: string;
    consultation_fee: number;
    discount_amount: number;
    total_paid: number;
    total_due: number;
    final_amount: number;
}

interface Totals {
    total_visits: number;
    total_consultation_fee: number;
    total_discount: number;
    total_final_amount: number;
    total_paid: number;
    total_due: number;
}

interface Props {
    reportData: ReportItem[];
    totals: Totals;
    filters: {
        from_date: string;
        to_date: string;
        search: string | null;
    };
}

export default function NewPatientIncomeReport({ reportData = [], totals, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');

    // Ensure reportData is always an array
    const safeReportData = Array.isArray(reportData) ? reportData : [];

    const handleFilter = () => {
        router.get(
            route('reports.new-patient-income'),
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

        excelData.push(['New Patient Income Report']);
        excelData.push([
            `Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        ]);
        excelData.push([]);

        excelData.push([
            'SL',
            'DATE',
            'TIME',
            'PATIENT NAME',
            'PATIENT ID',
            'PHONE',
            'DOCTOR NAME',
            'CONSULTATION FEE',
            'DISCOUNT',
            'FINAL AMOUNT',
            'PAID',
            'DUE',
        ]);

        safeReportData.forEach((item) => {
            excelData.push([
                item.sl,
                item.visit_date,
                item.visit_time,
                item.patient_name,
                item.patient_id,
                item.patient_phone,
                item.doctor_name,
                item.consultation_fee.toFixed(2),
                item.discount_amount.toFixed(2),
                item.final_amount.toFixed(2),
                item.total_paid.toFixed(2),
                item.total_due.toFixed(2),
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
            totals.total_consultation_fee.toFixed(2),
            totals.total_discount.toFixed(2),
            totals.total_final_amount.toFixed(2),
            totals.total_paid.toFixed(2),
            totals.total_due.toFixed(2),
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'New Patient Income');

        XLSX.writeFile(wb, `New_Patient_Income_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <AdminLayout>
            <Head title="New Patient Income Report" />

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Patient Income Report</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Income report for new patient consultations (OPD)
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg bg-white p-4 shadow">
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
                                placeholder="Patient name, ID, phone..."
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

                {/* Action Buttons */}
                <div className="mb-4 flex gap-2">
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

                {/* Report Table */}
                <div className="overflow-x-auto rounded-lg bg-white shadow report-section">
                    {/* Print Header */}
                    <div className="print-header mb-3">
                        <div className="text-center mb-1">
                            <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <h2 className="text-sm font-bold">New Patient Income Report</h2>
                            <p className="text-xs">
                                Date: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <table className="min-w-full table-auto border-collapse">
                        <thead className="bg-gray-50">
                            <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    SL
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    DATE
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    PATIENT NAME
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    DOCTOR NAME
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    FEE
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    DISCOUNT
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    CASH
                                </th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900">
                                    DUE
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {safeReportData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        No data found for the selected period
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {safeReportData.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">
                                                {item.sl}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">
                                                <div>{item.visit_date}</div>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                                                <div className="font-medium">{item.patient_name}</div>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">
                                                {item.doctor_name}
                                            </td>
                                            <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.consultation_fee.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-red-50 px-2 py-2 text-right text-sm text-red-600">
                                                {item.discount_amount.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm font-medium text-green-600">
                                                {item.total_paid.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-orange-50 px-2 py-2 text-right text-sm text-orange-600">
                                                {item.total_due.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Totals Row */}
                                    <tr className="bg-gray-100 font-bold">
                                        <td
                                            colSpan={4}
                                            className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900"
                                        >
                                            TOTAL ({totals.total_visits} Patients)
                                        </td>
                                        <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                            {totals.total_consultation_fee.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-red-100 px-2 py-3 text-right text-sm text-red-600">
                                            {totals.total_discount.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-green-600">
                                            {totals.total_paid.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-orange-100 px-2 py-3 text-right text-sm text-orange-600">
                                            {totals.total_due.toFixed(2)}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Print-only styles */}
                <style>{`
                    .print-header {
                        display: none;
                    }

                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .report-section,
                        .report-section * {
                            visibility: visible;
                        }
                        .report-section {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            background: white;
                            padding: 5px !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                        }
                        .print-header {
                            display: block !important;
                            visibility: visible !important;
                        }
                        h1 {
                            font-size: 12px !important;
                            margin-bottom: 1px !important;
                            font-weight: bold;
                            line-height: 1.2 !important;
                        }
                        h2 {
                            font-size: 10px !important;
                            margin: 1px 0 !important;
                            font-weight: bold;
                        }
                        p {
                            font-size: 8px !important;
                            margin: 0 !important;
                        }
                        .flex {
                            display: flex !important;
                        }
                        .justify-between {
                            justify-content: space-between !important;
                        }
                        .items-center {
                            align-items: center !important;
                        }
                        button,
                        .mb-6,
                        .mb-4 {
                            display: none !important;
                        }
                        @page {
                            size: A4 portrait;
                            margin: 5mm;
                        }
                        table {
                            font-size: 9px !important;
                            width: 100%;
                            border-collapse: collapse;
                        }
                        table th {
                            font-size: 9px !important;
                            padding: 3px 2px !important;
                            border: 1px solid #000 !important;
                            font-weight: bold;
                            line-height: 1.2 !important;
                        }
                        table td {
                            font-size: 9px !important;
                            padding: 3px 2px !important;
                            border: 1px solid #000 !important;
                            line-height: 1.2 !important;
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
                        .text-xs,
                        .text-sm {
                            font-size: 9px !important;
                        }
                    }
                `}</style>
            </div>
        </AdminLayout>
    );
}
