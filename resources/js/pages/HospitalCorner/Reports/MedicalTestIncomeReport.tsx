import AdminLayout from '@/layouts/MainAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface ReportItem {
    id: number;
    sl: number;
    name: string;
    code: string;
    category: string;
    standard_price: number;

    // Test Information
    total_tests: number;
    avg_original_price: number;
    total_original_price: number;

    // Discount Information
    avg_discount: number;
    total_discount: number;

    // Income Information
    avg_income: number;
    total_income: number;
    total_paid: number;
    total_due: number;
}

interface Totals {
    total_tests: number;
    total_original_price: number;
    total_discount: number;
    total_income: number;
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

export default function MedicalTestIncomeReport({ reportData, totals, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = () => {
        router.get(
            route('reports.medical-test-income'),
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
        // Prepare data for Excel
        const excelData = [];

        // Add title
        excelData.push(['Medical Test Income Report']);
        excelData.push([
            `Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        ]);
        excelData.push([]); // Empty row

        // Add headers
        excelData.push([
            'SL',
            'TEST NAME',
            'CODE',
            'CATEGORY',
            'TESTS COUNT',
            'AVG PRICE',
            'TOTAL PRICE',
            'TOTAL DISCOUNT',
            'TOTAL INCOME',
            'TOTAL PAID',
            'TOTAL DUE',
        ]);

        // Add data rows
        reportData.forEach((item) => {
            excelData.push([
                item.sl,
                item.name,
                item.code,
                item.category,
                item.total_tests,
                item.avg_original_price.toFixed(2),
                item.total_original_price.toFixed(2),
                item.total_discount.toFixed(2),
                item.total_income.toFixed(2),
                item.total_paid.toFixed(2),
                item.total_due.toFixed(2),
            ]);
        });

        // Add totals row
        excelData.push([]);
        excelData.push([
            '',
            'TOTAL',
            '',
            '',
            totals.total_tests,
            '',
            totals.total_original_price.toFixed(2),
            totals.total_discount.toFixed(2),
            totals.total_income.toFixed(2),
            totals.total_paid.toFixed(2),
            totals.total_due.toFixed(2),
        ]);

        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Medical Test Income');

        // Export
        XLSX.writeFile(wb, `Medical_Test_Income_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <>
            <Head title="Medical Test Income Report" />

            {/* Print Styles */}
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
                        font-size: 11px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-weight: bold;
                        line-height: 1.3 !important;
                        font-family: 'Arial', 'Helvetica', sans-serif !important;
                    }
                    .print-header h2 {
                        font-size: 9px !important;
                        margin: 2px 0 !important;
                        padding: 0 !important;
                        font-weight: bold;
                        font-family: 'Arial', 'Helvetica', sans-serif !important;
                    }
                    .print-header p {
                        font-size: 8px !important;
                        margin: 2px 0 0 0 !important;
                        padding: 0 !important;
                        font-family: 'Arial', 'Helvetica', sans-serif !important;
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
                        size: A4 landscape;
                        margin: 8mm 10mm;
                    }
                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                    .overflow-hidden {
                        overflow: visible !important;
                    }
                    .rounded-lg {
                        border-radius: 0 !important;
                    }
                    .shadow {
                        box-shadow: none !important;
                    }
                    table {
                        font-size: 8px !important;
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-family: 'Arial', 'Helvetica', sans-serif !important;
                        table-layout: auto !important;
                    }
                    table th {
                        font-size: 8px !important;
                        padding: 2px 3px !important;
                        border: 1px solid #000 !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                    }
                    table td {
                        font-size: 8px !important;
                        padding: 2px 3px !important;
                        border: 1px solid #000 !important;
                        line-height: 1.2 !important;
                    }
                    table td span {
                        display: inline !important;
                    }
                    table tbody {
                        display: table-row-group !important;
                    }
                    table tr {
                        page-break-inside: avoid !important;
                        display: table-row !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    tbody {
                        display: table-row-group !important;
                    }
                    tfoot {
                        display: table-row-group !important;
                    }
                    .text-xs {
                        font-size: 7px !important;
                    }
                    .text-sm {
                        font-size: 8px !important;
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
                    .text-orange-600 {
                        color: #ea580c !important;
                    }
                    .text-gray-500 {
                        color: #6b7280 !important;
                    }
                    .text-gray-600 {
                        color: #4b5563 !important;
                    }
                    .text-gray-700 {
                        color: #374151 !important;
                    }
                    .text-gray-900 {
                        color: #111827 !important;
                    }
                    .bg-blue-50 {
                        background-color: #eff6ff !important;
                    }
                    .bg-blue-100 {
                        background-color: #dbeafe !important;
                    }
                    .bg-red-50 {
                        background-color: #fef2f2 !important;
                    }
                    .bg-red-100 {
                        background-color: #fee2e2 !important;
                    }
                    .bg-green-50 {
                        background-color: #f0fdf4 !important;
                    }
                    .bg-green-100 {
                        background-color: #dcfce7 !important;
                    }
                    .bg-gray-100 {
                        background-color: #f3f4f6 !important;
                    }
                }
            `}</style>

            <AdminLayout>
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between print:hidden">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Medical Test Income Report</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Income and performance report for medical tests
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
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
                                    placeholder="Search tests..."
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

                    {/* Printable Area */}
                    <div id="printable-area">
                        <div className="overflow-hidden rounded-lg bg-white shadow report-section">
                            {/* Print Header */}
                            <div className="print-header mb-3">
                                <div className="text-center mb-2">
                                    <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                                    <h2 className="text-sm font-semibold mt-1">Hospital Corner - Medical Test Income Report</h2>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs font-medium">Period Report</p>
                                    <p className="text-xs">
                                        {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th
                                        rowSpan={2}
                                        className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        SL
                                    </th>
                                    <th
                                        rowSpan={2}
                                        className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        TEST NAME
                                    </th>
                                    <th
                                        rowSpan={2}
                                        className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        CATEGORY
                                    </th>
                                    <th
                                        colSpan={3}
                                        className="border border-gray-300 bg-blue-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        TEST INFORMATION
                                    </th>
                                    <th
                                        colSpan={1}
                                        className="border border-gray-300 bg-red-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        DISCOUNT
                                    </th>
                                    <th
                                        colSpan={3}
                                        className="border border-gray-300 bg-green-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                    >
                                        INCOME INFORMATION
                                    </th>
                                </tr>
                                <tr>
                                    {/* Test Information */}
                                    <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        COUNT
                                    </th>
                                    <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        AVG PRICE
                                    </th>
                                    <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        TOTAL PRICE
                                    </th>
                                    {/* Discount */}
                                    <th className="border border-gray-300 bg-red-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        TOTAL
                                    </th>
                                    {/* Income */}
                                    <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        TOTAL
                                    </th>
                                    <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        PAID
                                    </th>
                                    <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                        DUE
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                                            No data found for the selected period
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {reportData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">
                                                    {item.sl}
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-xs text-gray-500"> ({item.code})</span>
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
                                                    {item.category}
                                                </td>

                                                {/* Test Information */}
                                                <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-gray-900">
                                                    {item.total_tests}
                                                </td>
                                                <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                    {item.avg_original_price.toFixed(2)}
                                                </td>
                                                <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                    {item.total_original_price.toFixed(2)}
                                                </td>

                                                {/* Discount */}
                                                <td className="border border-gray-300 bg-red-50 px-2 py-2 text-right text-sm text-red-600">
                                                    {item.total_discount.toFixed(2)}
                                                </td>

                                                {/* Income */}
                                                <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm text-green-600 font-medium">
                                                    {item.total_income.toFixed(2)}
                                                </td>
                                                <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm text-gray-900">
                                                    {item.total_paid.toFixed(2)}
                                                </td>
                                                <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm text-orange-600">
                                                    {item.total_due.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Totals Row */}
                                        <tr className="bg-gray-100 font-bold">
                                            <td
                                                colSpan={3}
                                                className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900"
                                            >
                                                TOTAL
                                            </td>

                                            {/* Test Information Totals */}
                                            <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                                {totals.total_tests}
                                            </td>
                                            <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                                -
                                            </td>
                                            <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                                {totals.total_original_price.toFixed(2)}
                                            </td>

                                            {/* Discount Total */}
                                            <td className="border border-gray-300 bg-red-100 px-2 py-3 text-right text-sm text-red-600">
                                                {totals.total_discount.toFixed(2)}
                                            </td>

                                            {/* Income Totals */}
                                            <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-green-600">
                                                {totals.total_income.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-gray-900">
                                                {totals.total_paid.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-orange-600">
                                                {totals.total_due.toFixed(2)}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                        </div>
                    </div>
                    {/* End Printable Area */}
                </div>
            </AdminLayout>
        </>
    );
}
