import AdminLayout from '@/layouts/MainAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface CompanyItem {
    sl: number;
    manufacturer: string;
    total_medicines: number;
    buy_qty: number;
    buy_total: number;
    sale_qty: number;
    sale_total: number;
    total_profit: number;
    available_stock_qty: number;
    available_stock_value: number;
}

interface Totals {
    total_medicines: number;
    buy_qty: number;
    buy_total: number;
    sale_qty: number;
    sale_total: number;
    total_profit: number;
    available_stock_qty: number;
    available_stock_value: number;
}

interface Props {
    reportData: CompanyItem[];
    totals: Totals;
    filters: {
        from_date: string;
        to_date: string;
        search: string | null;
    };
}

export default function CompanyStockReport({ reportData, totals, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = () => {
        router.get(
            route('medicine.reports.company-stock'),
            { from_date: fromDate, to_date: toDate, search: search || undefined },
            { preserveState: true },
        );
    };

    const handleExportExcel = () => {
        const excelData: (string | number)[][] = [];
        excelData.push(['Medicine Company-wise Stock Report']);
        excelData.push([`Period: ${fromDate} to ${toDate}`]);
        excelData.push([]);
        excelData.push(['SL', 'COMPANY / MANUFACTURER', 'Total Medicines', 'Buy QTY', 'Buy Total', 'Sale QTY', 'Sale Total', 'Profit', 'Available Stock QTY', 'Available Stock Value']);
        reportData.forEach((item) => {
            excelData.push([item.sl, item.manufacturer, item.total_medicines, item.buy_qty, item.buy_total.toFixed(2), item.sale_qty, item.sale_total.toFixed(2), item.total_profit.toFixed(2), item.available_stock_qty, item.available_stock_value.toFixed(2)]);
        });
        excelData.push(['', 'TOTAL', totals.total_medicines, totals.buy_qty, totals.buy_total.toFixed(2), totals.sale_qty, totals.sale_total.toFixed(2), totals.total_profit.toFixed(2), totals.available_stock_qty, totals.available_stock_value.toFixed(2)]);
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Company Stock');
        XLSX.writeFile(wb, `Company_Stock_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <AdminLayout>
            <Head title="Company-wise Stock Report" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Company-wise Stock Report</h1>
                    <p className="mt-1 text-sm text-gray-500">Manufacturer-অনুযায়ী sale summary এবং available stock</p>
                </div>

                {/* Filters */}
                <div className="mb-4 rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Search Company</label>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                placeholder="Company name..."
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <button onClick={handleFilter} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                            Filter
                        </button>
                    </div>
                </div>

                <div className="mb-3 flex gap-2">
                    <button onClick={() => window.print()} className="rounded-md bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Print</button>
                    <button onClick={handleExportExcel} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Export Excel</button>
                </div>

                {/* Report Table */}
                <div className="report-section overflow-x-auto rounded-lg bg-white shadow">
                    <div className="print-header p-4 pb-2">
                        <h1 className="text-center text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center - Medicine Corner</h1>
                        <div className="mt-1 flex justify-between text-sm">
                            <span className="font-semibold">Company-wise Stock Report</span>
                            <span>Period: {fromDate} to {toDate}</span>
                        </div>
                    </div>

                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">SL</th>
                                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">COMPANY / MANUFACTURER</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">MEDICINES</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">BUY QTY</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">BUY TOTAL</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">SALE QTY</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">SALE TOTAL</th>
                                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">PROFIT</th>
                                <th className="border border-gray-300 bg-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-800">AVAILABLE STOCK (QTY)</th>
                                <th className="border border-gray-300 bg-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-800">AVAILABLE VALUE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">No data found</td>
                                </tr>
                            ) : (
                                <>
                                    {reportData.map((item) => (
                                        <tr key={item.manufacturer} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">{item.sl}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">{item.manufacturer}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">{item.total_medicines}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">{item.buy_qty > 0 ? item.buy_qty : '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">{item.buy_total > 0 ? item.buy_total.toFixed(2) : '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">{item.sale_qty > 0 ? item.sale_qty : '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">{item.sale_total > 0 ? item.sale_total.toFixed(2) : '-'}</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">{item.total_profit > 0 ? item.total_profit.toFixed(2) : '-'}</td>
                                            <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm font-bold text-gray-900">{item.available_stock_qty}</td>
                                            <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-right text-sm font-bold text-gray-900">{item.available_stock_value.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={2} className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">TOTAL</td>
                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">{totals.total_medicines}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">{totals.buy_qty}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">{totals.buy_total.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">{totals.sale_qty}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">{totals.sale_total.toFixed(2)}</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">{totals.total_profit.toFixed(2)}</td>
                                        <td className="border border-gray-300 bg-gray-200 px-3 py-2 text-center text-sm font-bold text-gray-900">{totals.available_stock_qty}</td>
                                        <td className="border border-gray-300 bg-gray-200 px-3 py-2 text-right text-sm font-bold text-gray-900">{totals.available_stock_value.toFixed(2)}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .print-header { display: none; }
                @media print {
                    body * { visibility: hidden; }
                    .report-section, .report-section * { visibility: visible; }
                    .report-section {
                        position: absolute; left: 0; top: 0; width: 100%;
                        background: white; padding: 5px !important;
                        margin: 0 !important; box-shadow: none !important;
                    }
                    .print-header { display: block !important; visibility: visible !important; }
                    button, .mb-6, .mb-4 { display: none !important; }
                    @page { size: A4 landscape; margin: 8mm; }
                    table { font-size: 9px !important; width: 100%; border-collapse: collapse; }
                    table th, table td {
                        font-size: 9px !important; padding: 3px 2px !important;
                        border: 1px solid #000 !important; line-height: 1.2 !important;
                    }
                    thead { display: table-header-group; }
                    tbody { display: table-row-group; }
                    tr { page-break-inside: avoid; }
                    h1 { font-size: 11px !important; font-weight: bold; }
                    h2 { font-size: 9px !important; font-weight: bold; }
                    p { font-size: 8px !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
