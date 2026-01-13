import AdminLayout from '@/layouts/MainAccountLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

interface ReportItem {
    id: number;
    sl: number;
    name: string;
    generic_name: string;
    manufacturer: string;
    unit: string;

    // Before stock information
    before_stock_qty: number;
    before_stock_price: number;
    before_stock_value: number;

    // Buy information
    buy_qty: number;
    buy_price: number;
    buy_total: number;

    // Sale information
    sale_qty: number;
    sale_price: number;
    sale_subtotal: number;
    sale_discount: number;
    sale_total: number;
    sale_cash: number;
    sale_due: number;

    // Available information
    available_stock: number;
    available_value: number;

    // Profit information
    profit_per_unit: number;
    total_profit: number;
}

interface Totals {
    before_stock_qty: number;
    before_stock_value: number;
    buy_qty: number;
    buy_total: number;
    sale_qty: number;
    sale_subtotal: number;
    sale_discount: number;
    sale_total: number;
    sale_cash: number;
    sale_due: number;
    available_stock: number;
    available_value: number;
    total_profit: number;
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

export default function BuySaleStockReport({ reportData: rawReportData, totals: rawTotals, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');

    // Calculate sale_cash for each item (sale_cash = sale_total - sale_due)
    const reportData = rawReportData.map(item => ({
        ...item,
        sale_cash: item.sale_total - item.sale_due,
    }));

    // Calculate sale_cash for totals
    const totals = {
        ...rawTotals,
        sale_cash: rawTotals.sale_total - rawTotals.sale_due,
    };

    const handleFilter = () => {
        router.get(
            route('medicine.reports.buy-sale-stock'),
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
        excelData.push(['Medicine Buy-Sale-Stock Report']);
        excelData.push([
            `Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`,
        ]);
        excelData.push([]); // Empty row

        // Add headers
        excelData.push([
            'SL',
            'NAME',
            'MANUFACTURER',
            'UNIT',
            // Before Stock
            'Before QTY',
            'Before PRICE',
            'Before VALUE',
            // Buy
            'Buy QTY',
            'Buy PRICE',
            'Buy TOTAL',
            // Sale
            'Sale QTY',
            'Sale PRICE',
            'Sale SUBTOTAL',
            'Sale DISCOUNT',
            'Sale TOTAL',
            'Sale CASH',
            'Sale DUE',
            // Profit
            'Profit/UNIT',
            'Total PROFIT',
            // Available
            'Available STOCK',
            'Available VALUE',
        ]);

        // Add data rows
        reportData.forEach((item) => {
            excelData.push([
                item.sl,
                item.name,
                item.manufacturer,
                item.unit,
                item.before_stock_qty,
                item.before_stock_price.toFixed(2),
                item.before_stock_value.toFixed(2),
                item.buy_qty,
                item.buy_price.toFixed(2),
                item.buy_total.toFixed(2),
                item.sale_qty,
                item.sale_price.toFixed(2),
                item.sale_subtotal.toFixed(2),
                item.sale_discount.toFixed(2),
                item.sale_total.toFixed(2),
                item.sale_cash.toFixed(2),
                item.sale_due.toFixed(2),
                item.profit_per_unit.toFixed(2),
                item.total_profit.toFixed(2),
                item.available_stock,
                item.available_value.toFixed(2),
            ]);
        });

        // Add totals row
        excelData.push([
            '',
            'TOTAL',
            '',
            '',
            totals.before_stock_qty,
            '',
            totals.before_stock_value.toFixed(2),
            totals.buy_qty,
            '',
            totals.buy_total.toFixed(2),
            totals.sale_qty,
            '',
            totals.sale_subtotal.toFixed(2),
            totals.sale_discount.toFixed(2),
            totals.sale_total.toFixed(2),
            totals.sale_cash.toFixed(2),
            totals.sale_due.toFixed(2),
            '',
            totals.total_profit.toFixed(2),
            totals.available_stock,
            totals.available_value.toFixed(2),
        ]);

        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Buy-Sale-Stock Report');

        // Export
        XLSX.writeFile(wb, `Medicine_Buy_Sale_Stock_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <AdminLayout>
            <Head title="Medicine Buy-Sale-Stock Report" />

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Medicine Buy-Sale-Stock Report</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Detailed stock movement report with purchases, sales, and inventory
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
                                placeholder="Search medicines..."
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
                <div className="overflow-x-auto rounded-lg bg-white shadow report-section max-h-[calc(100vh-300px)]">
                    {/* Print Header */}
                    <div className="print-header mb-3">
                        <div className="text-center mb-1">
                            <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center - Medicine Corner</h1>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <h2 className="text-sm font-bold">Buy-Sale-Stock Report</h2>
                            <p className="text-xs">
                                Date: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
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
                                    MEDICINE NAME
                                </th>
                                <th
                                    colSpan={3}
                                    className="border border-gray-300 bg-blue-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                >
                                    BEFORE STOCK INFORMATION
                                </th>
                                <th
                                    colSpan={3}
                                    className="border border-gray-300 bg-green-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                >
                                    BUY INFORMATION
                                </th>
                                <th
                                    colSpan={7}
                                    className="border border-gray-300 bg-yellow-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                >
                                    SALE INFORMATION
                                </th>
                                <th
                                    colSpan={2}
                                    className="border border-gray-300 bg-pink-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                >
                                    PROFIT INFORMATION
                                </th>
                                <th
                                    colSpan={2}
                                    className="border border-gray-300 bg-purple-100 px-3 py-2 text-center text-xs font-semibold text-gray-900"
                                >
                                    AVAILABLE INFORMATION
                                </th>
                            </tr>
                            <tr>
                                {/* Before Stock */}
                                <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    QTY
                                </th>
                                <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    PRICE
                                </th>
                                <th className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    VALUE
                                </th>

                                {/* Buy */}
                                <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    QTY
                                </th>
                                <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    PRICE
                                </th>
                                <th className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    TOTAL
                                </th>

                                {/* Sale */}
                                <th className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    QTY
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    PRICE
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-1 py-2 text-center text-xs font-medium text-gray-700">
                                    SUBTOTAL
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-1 py-2 text-center text-xs font-medium text-gray-700">
                                    DISCOUNT
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    TOTAL
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    CASH
                                </th>
                                <th className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-xs font-medium text-gray-700">
                                    DUE
                                </th>

                                {/* Profit */}
                                <th className="border border-gray-300 bg-pink-50 py-2 text-center text-xs font-medium text-gray-700">
                                    PER UNIT
                                </th>
                                <th className="border border-gray-300 bg-pink-50 py-2 text-center text-xs font-medium text-gray-700">
                                    TOTAL
                                </th>

                                {/* Available */}
                                <th className="border border-gray-300 bg-purple-50 px-1 py-2 text-center text-xs font-medium text-gray-700">
                                    STOCK
                                </th>
                                <th className="border border-gray-300 bg-purple-50 px-1 py-2 text-center text-xs font-medium text-gray-700">
                                    VALUE
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="px-6 py-8 text-center text-gray-500">
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
                                                    {item.manufacturer} • {item.unit}
                                                </div>
                                            </td>

                                            {/* Before Stock */}
                                            <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-center text-sm text-gray-900">
                                                {item.before_stock_qty}
                                            </td>
                                            <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.before_stock_price.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-blue-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.before_stock_value.toFixed(2)}
                                            </td>

                                            {/* Buy */}
                                            <td className="border border-gray-300 bg-green-50 px-2 py-2 text-center text-sm text-gray-900">
                                                {item.buy_qty > 0 ? item.buy_qty : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.buy_qty > 0 ? item.buy_price.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-green-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.buy_qty > 0 ? item.buy_total.toFixed(2) : '-'}
                                            </td>

                                            {/* Sale */}
                                            <td className="border border-gray-300 bg-yellow-50 px-2 py-2 text-center text-sm text-gray-900">
                                                {item.sale_qty > 0 ? item.sale_qty : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.sale_qty > 0 ? item.sale_price.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-1 py-2 text-right text-sm text-gray-900">
                                                {item.sale_qty > 0 ? item.sale_subtotal.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-1 py-2 text-right text-sm text-gray-900">
                                                {item.sale_discount > 0 ? item.sale_discount.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.sale_qty > 0 ? item.sale_total.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-2 py-2 text-right text-sm font-medium text-green-600">
                                                {item.sale_cash > 0 ? item.sale_cash.toFixed(2) : '-'}
                                            </td>
                                            <td className="border border-gray-300 bg-yellow-50 px-2 py-2 text-right text-sm text-red-600 font-medium">
                                                {item.sale_due > 0 ? item.sale_due.toFixed(2) : '-'}
                                            </td>

                                            {/* Profit */}
                                            <td className="border border-gray-300 bg-pink-50 px-2 py-2 text-right text-sm text-gray-900">
                                                {item.profit_per_unit.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 bg-pink-50 px-2 py-2 text-right text-sm font-medium text-green-600">
                                                {item.total_profit.toFixed(2)}
                                            </td>

                                            {/* Available */}
                                            <td className="border border-gray-300 bg-purple-50 px-1 py-2 text-center text-sm text-gray-900">
                                                {item.available_stock}
                                            </td>
                                            <td className="border border-gray-300 bg-purple-50 px-1 py-2 text-right text-sm text-gray-900">
                                                {item.available_value.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Totals Row */}
                                    <tr className="bg-gray-100 font-bold">
                                        <td
                                            colSpan={2}
                                            className="border border-gray-300 px-3 py-3 text-center text-sm text-gray-900"
                                        >
                                            TOTAL
                                        </td>

                                        {/* Before Stock Totals */}
                                        <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-center text-sm text-gray-900">
                                            {totals.before_stock_qty}
                                        </td>
                                        <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                            -
                                        </td>
                                        <td className="border border-gray-300 bg-blue-100 px-2 py-3 text-right text-sm text-gray-900">
                                            {totals.before_stock_value.toFixed(2)}
                                        </td>

                                        {/* Buy Totals */}
                                        <td className="border border-gray-300 bg-green-100 px-2 py-3 text-center text-sm text-gray-900">
                                            {totals.buy_qty}
                                        </td>
                                        <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-gray-900">
                                            -
                                        </td>
                                        <td className="border border-gray-300 bg-green-100 px-2 py-3 text-right text-sm text-gray-900">
                                            {totals.buy_total.toFixed(2)}
                                        </td>

                                        {/* Sale Totals */}
                                        <td className="border border-gray-300 bg-yellow-100 px-2 py-3 text-center text-sm text-gray-900">
                                            {totals.sale_qty}
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-2 py-3 text-right text-sm text-gray-900">
                                            -
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-1 py-3 text-right text-sm text-gray-900">
                                            {totals.sale_subtotal.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-1 py-3 text-right text-sm text-gray-900">
                                            {totals.sale_discount.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-2 py-3 text-right text-sm text-gray-900">
                                            {totals.sale_total.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-2 py-3 text-right text-sm font-bold text-green-600">
                                            {totals.sale_cash.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 bg-yellow-100 px-2 py-3 text-right text-sm font-bold text-red-600">
                                            {totals.sale_due.toFixed(2)}
                                        </td>

                                        {/* Profit Totals */}
                                        <td className="border border-gray-300 bg-pink-100 px-2 py-3 text-right text-sm text-gray-900">
                                            -
                                        </td>
                                        <td className="border border-gray-300 bg-pink-100 px-2 py-3 text-right text-sm font-bold text-green-600">
                                            {totals.total_profit.toFixed(2)}
                                        </td>

                                        {/* Available Totals */}
                                        <td className="border border-gray-300 bg-purple-100 px-1 py-3 text-center text-sm text-gray-900">
                                            {totals.available_stock}
                                        </td>
                                        <td className="border border-gray-300 bg-purple-100 px-1 py-3 text-right text-sm text-gray-900">
                                            {totals.available_value.toFixed(2)}
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
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        .print-header {
                            display: block !important;
                            visibility: visible !important;
                        }
                        thead {
                            position: static !important;
                        }
                        h1 {
                            font-size: 10px !important;
                            margin-bottom: 1px !important;
                            font-weight: bold;
                            line-height: 1.2 !important;
                        }
                        h2 {
                            font-size: 9px !important;
                            margin: 1px 0 !important;
                            font-weight: bold;
                        }
                        p {
                            font-size: 7px !important;
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
                            size: A4 landscape;
                            margin: 5mm;
                        }
                        table {
                            font-size: 8px !important;
                            width: 100%;
                            border-collapse: collapse;
                        }
                        table th {
                            font-size: 8px !important;
                            padding: 2px 1px !important;
                            border: 1px solid #000 !important;
                            font-weight: bold;
                            line-height: 1.2 !important;
                        }
                        table td {
                            font-size: 8px !important;
                            padding: 2px 1px !important;
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
                            font-size: 8px !important;
                        }
                    }
                `}</style>
            </div>
        </AdminLayout>
    );
}
