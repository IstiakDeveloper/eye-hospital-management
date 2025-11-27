import AdminLayout from '@/layouts/MainAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface ReportItem {
    id: number;
    sl: number;
    name: string;
    operation_code: string;
    type: string;
    standard_price: number;

    // Booking Information
    total_bookings: number;
    scheduled: number;
    confirmed: number;
    completed: number;
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
    total_bookings: number;
    scheduled: number;
    confirmed: number;
    completed: number;
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

export default function OperationIncomeReport({ reportData, totals, filters }: Props) {
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

        excelData.push(['Operation Income Report']);
        excelData.push([
            `Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        ]);
        excelData.push([]);

        excelData.push([
            'SL',
            'OPERATION NAME',
            'CODE',
            'TYPE',
            'TOTAL BOOKINGS',
            'SCHEDULED',
            'CONFIRMED',
            'COMPLETED',
            'AVG PRICE',
            'TOTAL PRICE',
            'TOTAL DISCOUNT',
            'TOTAL INCOME',
            'TOTAL PAID',
            'TOTAL DUE',
        ]);

        reportData.forEach((item) => {
            excelData.push([
                item.sl,
                item.name,
                item.operation_code,
                item.type,
                item.total_bookings,
                item.scheduled,
                item.confirmed,
                item.completed,
                item.avg_original_price.toFixed(2),
                item.total_original_price.toFixed(2),
                item.total_discount.toFixed(2),
                item.total_income.toFixed(2),
                item.total_paid.toFixed(2),
                item.total_due.toFixed(2),
            ]);
        });

        excelData.push([]);
        excelData.push([
            '',
            'TOTAL',
            '',
            '',
            totals.total_bookings,
            totals.scheduled,
            totals.confirmed,
            totals.completed,
            '',
            totals.total_original_price.toFixed(2),
            totals.total_discount.toFixed(2),
            totals.total_income.toFixed(2),
            totals.total_paid.toFixed(2),
            totals.total_due.toFixed(2),
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Operation Income');
        XLSX.writeFile(wb, `Operation_Income_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <>
            <Head title="Operation Income Report" />

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

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
                        <div className="mb-6 hidden text-center print:block">
                            <h1 className="text-2xl font-bold">Operation Income Report</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Period: {new Date(fromDate).toLocaleDateString()} to{' '}
                                {new Date(toDate).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
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
                                                OPERATION NAME
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                            >
                                                TYPE
                                            </th>
                                            <th
                                                colSpan={5}
                                                className="border border-gray-300 bg-blue-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                            >
                                                BOOKING INFORMATION
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
                                            <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                TOTAL
                                            </th>
                                            <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                SCHEDULED
                                            </th>
                                            <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                CONFIRMED
                                            </th>
                                            <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                COMPLETED
                                            </th>
                                            <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                TOTAL PRICE
                                            </th>
                                            <th className="border border-gray-300 bg-red-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                                TOTAL
                                            </th>
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
                                                <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
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
                                                            <div className="font-medium">{item.name}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">
                                                                {item.operation_code}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
                                                            {item.type}
                                                        </td>

                                                        <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-gray-900">
                                                            {item.total_bookings}
                                                        </td>
                                                        <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-gray-600">
                                                            {item.scheduled}
                                                        </td>
                                                        <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-gray-600">
                                                            {item.confirmed}
                                                        </td>
                                                        <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-green-700">
                                                            {item.completed}
                                                        </td>
                                                        <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                            {item.total_original_price.toFixed(2)}
                                                        </td>

                                                        <td className="border border-gray-300 bg-red-50 px-2 py-2 text-right text-sm text-red-600">
                                                            {item.total_discount.toFixed(2)}
                                                        </td>

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

                                                <tr className="bg-gray-100 font-bold">
                                                    <td
                                                        colSpan={3}
                                                        className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900"
                                                    >
                                                        TOTAL
                                                    </td>

                                                    <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                                        {totals.total_bookings}
                                                    </td>
                                                    <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                                        {totals.scheduled}
                                                    </td>
                                                    <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                                        {totals.confirmed}
                                                    </td>
                                                    <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                                        {totals.completed}
                                                    </td>
                                                    <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                                        {totals.total_original_price.toFixed(2)}
                                                    </td>

                                                    <td className="border border-gray-300 bg-red-100 px-2 py-3 text-right text-sm text-red-600">
                                                        {totals.total_discount.toFixed(2)}
                                                    </td>

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
                </div>
            </AdminLayout>
        </>
    );
}
