import AdminLayout from '@/layouts/MainAccountLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface MedicineItem {
    id: number;
    name: string;
    generic_name: string;
    type: string;
    unit: string;
    buy_qty: number;
    buy_total: number;
    sale_qty: number;
    sale_total: number;
    profit: number;
    available_stock_qty: number;
    available_stock_value: number;
}

interface CompanyGroup {
    manufacturer: string;
    total_medicines: number;
    total_buy_qty: number;
    total_buy_total: number;
    total_sale_qty: number;
    total_sale_total: number;
    total_profit: number;
    available_stock_qty: number;
    available_stock_value: number;
    medicines: MedicineItem[];
}

interface Props {
    reportData: CompanyGroup[];
    allManufacturers: string[];
    filters: {
        from_date: string;
        to_date: string;
        search: string | null;
        manufacturer: string | null;
    };
}

export default function CompanyMedicineStockReport({ reportData, allManufacturers, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);
    const [search, setSearch] = useState(filters.search || '');
    const [manufacturer, setManufacturer] = useState(filters.manufacturer || '');
    const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set());

    const handleFilter = () => {
        router.get(
            route('medicine.reports.company-medicine-stock'),
            {
                from_date: fromDate,
                to_date: toDate,
                search: search || undefined,
                manufacturer: manufacturer || undefined,
            },
            { preserveState: true },
        );
    };

    const toggleCompany = (name: string) => {
        setCollapsedCompanies((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    const expandAll = () => setCollapsedCompanies(new Set());
    const collapseAll = () =>
        setCollapsedCompanies(new Set(reportData.map((c) => c.manufacturer)));

    const handlePrint = () => {
        // Expand all before printing
        setCollapsedCompanies(new Set());
        setTimeout(() => window.print(), 100);
    };

    const handleExportExcel = () => {
        const excelData: (string | number)[][] = [];

        excelData.push(['Medicine Company-wise Detailed Stock Report']);
        excelData.push([`Period: ${fromDate} to ${toDate}`]);
        excelData.push([]);

        reportData.forEach((company) => {
            excelData.push([
                `COMPANY: ${company.manufacturer}`,
                '',
                '',
                '',
                '',
                `Medicines: ${company.total_medicines}`,
                `Sale QTY: ${company.total_sale_qty}`,
                `Sale Total: ${company.total_sale_total.toFixed(2)}`,
                `Profit: ${company.total_profit.toFixed(2)}`,
                `Available QTY: ${company.available_stock_qty}`,
                `Available Value: ${company.available_stock_value.toFixed(2)}`,
            ]);
            excelData.push(['SL', 'MEDICINE NAME', 'GENERIC NAME', 'TYPE', 'UNIT', 'SALE QTY', 'SALE TOTAL', 'PROFIT', 'AVAILABLE QTY', 'AVAILABLE VALUE']);
            company.medicines.forEach((med, idx) => {
                excelData.push([idx + 1, med.name, med.generic_name, med.type, med.unit, med.sale_qty, med.sale_total.toFixed(2), med.profit.toFixed(2), med.available_stock_qty, med.available_stock_value.toFixed(2)]);
            });
            excelData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Company Medicine Stock');
        XLSX.writeFile(wb, `Company_Medicine_Stock_${fromDate}_to_${toDate}.xlsx`);
    };

    const grandTotals = reportData.reduce(
        (acc, company) => ({
            total_medicines: acc.total_medicines + company.total_medicines,
            total_buy_qty: acc.total_buy_qty + company.total_buy_qty,
            total_buy_total: acc.total_buy_total + company.total_buy_total,
            total_sale_qty: acc.total_sale_qty + company.total_sale_qty,
            total_sale_total: acc.total_sale_total + company.total_sale_total,
            total_profit: acc.total_profit + company.total_profit,
            available_stock_qty: acc.available_stock_qty + company.available_stock_qty,
            available_stock_value: acc.available_stock_value + company.available_stock_value,
        }),
        {
            total_medicines: 0,
            total_buy_qty: 0,
            total_buy_total: 0,
            total_sale_qty: 0,
            total_sale_total: 0,
            total_profit: 0,
            available_stock_qty: 0,
            available_stock_value: 0,
        },
    );

    return (
        <AdminLayout>
            <Head title="Company-wise Medicine Stock Report" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Company-wise Medicine Stock Detail</h1>
                    <p className="mt-1 text-sm text-gray-500">Manufacturer অনুযায়ী প্রতিটি medicine এর sale ও available stock</p>
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
                            <label className="block text-xs font-medium text-gray-600">Company</label>
                            <select value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="">All Companies</option>
                                {allManufacturers.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Search</label>
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                placeholder="Medicine / company..."
                                className="mt-1 block rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <button onClick={handleFilter} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                            Filter
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-3 flex gap-2">
                    <button onClick={handlePrint} className="rounded-md bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Print</button>
                    <button onClick={handleExportExcel} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Export Excel</button>
                    <button onClick={expandAll} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200">Expand All</button>
                    <button onClick={collapseAll} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200">Collapse All</button>
                </div>

                {/* Report */}
                <div className="report-section space-y-3">
                    <div className="print-header mb-3">
                        <h1 className="text-center text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center - Medicine Corner</h1>
                        <div className="mt-1 flex justify-between text-sm">
                            <span className="font-semibold">Company-wise Medicine Stock Detail</span>
                            <span>Period: {fromDate} to {toDate}</span>
                        </div>
                    </div>

                    {reportData.length === 0 ? (
                        <div className="rounded-lg bg-white py-12 text-center text-gray-500 shadow">No data found</div>
                    ) : (
                        reportData.map((company) => {
                            const isCollapsed = collapsedCompanies.has(company.manufacturer);

                            return (
                                <div key={company.manufacturer} className="company-block overflow-hidden rounded-lg bg-white shadow">
                                    {/* Company Header Row */}
                                    <div onClick={() => toggleCompany(company.manufacturer)}
                                        className="flex cursor-pointer items-center justify-between bg-gray-700 px-4 py-3 text-white hover:bg-gray-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold">{isCollapsed ? '▶' : '▼'}</span>
                                            <span className="text-sm font-bold">{company.manufacturer}</span>
                                            <span className="rounded-full bg-gray-600 px-2 py-0.5 text-xs">{company.total_medicines} medicines</span>
                                        </div>
                                        <div className="flex gap-5 text-xs">
                                            <div className="text-center">
                                                <div className="text-gray-400">Buy QTY</div>
                                                <div className="font-semibold">{company.total_buy_qty}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-400">Buy Total</div>
                                                <div className="font-semibold">{company.total_buy_total.toFixed(2)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-400">Sale QTY</div>
                                                <div className="font-semibold">{company.total_sale_qty}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-400">Sale Total</div>
                                                <div className="font-semibold">{company.total_sale_total.toFixed(2)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-400">Profit</div>
                                                <div className="font-semibold">{company.total_profit.toFixed(2)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-300 font-medium">Available QTY</div>
                                                <div className="font-bold text-white">{company.available_stock_qty}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-gray-300 font-medium">Available Value</div>
                                                <div className="font-bold text-white">{company.available_stock_value.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Medicine Table */}
                                    {!isCollapsed && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">SL</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">MEDICINE NAME</th>
                                                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">GENERIC NAME</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">TYPE</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">UNIT</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">BUY QTY</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">BUY TOTAL</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">SALE QTY</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">SALE TOTAL</th>
                                                        <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">PROFIT</th>
                                                        <th className="border border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-bold text-gray-800">AVAILABLE QTY</th>
                                                        <th className="border border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-bold text-gray-800">AVAILABLE VALUE</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                    {company.medicines.map((med, idx) => (
                                                        <tr key={med.id} className="hover:bg-gray-50">
                                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">{idx + 1}</td>
                                                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">{med.name}</td>
                                                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{med.generic_name}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">{med.type}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-600">{med.unit}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-700">{med.buy_qty > 0 ? med.buy_qty : '-'}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-700">{med.buy_total > 0 ? med.buy_total.toFixed(2) : '-'}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-700">{med.sale_qty > 0 ? med.sale_qty : '-'}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-700">{med.sale_total > 0 ? med.sale_total.toFixed(2) : '-'}</td>
                                                            <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-700">{med.profit > 0 ? med.profit.toFixed(2) : '-'}</td>
                                                            <td className="border border-gray-300 bg-gray-50 px-2 py-2 text-center text-sm font-bold text-gray-900">{med.available_stock_qty}</td>
                                                            <td className="border border-gray-300 bg-gray-50 px-2 py-2 text-right text-sm font-bold text-gray-900">{med.available_stock_value.toFixed(2)}</td>
                                                        </tr>
                                                    ))}

                                                    {/* Company subtotal row */}
                                                    <tr className="bg-gray-100 font-bold">
                                                        <td colSpan={5} className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-800">
                                                            SUBTOTAL ({company.manufacturer})
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">{company.total_buy_qty}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-900">{company.total_buy_total.toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-900">{company.total_sale_qty}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-900">{company.total_sale_total.toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm text-gray-900">{company.total_profit.toFixed(2)}</td>
                                                        <td className="border border-gray-300 bg-gray-200 px-2 py-2 text-center text-sm font-bold text-gray-900">{company.available_stock_qty}</td>
                                                        <td className="border border-gray-300 bg-gray-200 px-2 py-2 text-right text-sm font-bold text-gray-900">{company.available_stock_value.toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Grand Totals */}
                    {reportData.length > 0 && (
                        <div className="grand-totals rounded-lg bg-gray-800 p-4 text-white shadow">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Companies</div>
                                    <div className="text-xl font-bold">{reportData.length}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Medicines</div>
                                    <div className="text-xl font-bold">{grandTotals.total_medicines}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Buy QTY</div>
                                    <div className="text-xl font-bold">{grandTotals.total_buy_qty}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Buy</div>
                                    <div className="text-xl font-bold">{grandTotals.total_buy_total.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Sale QTY</div>
                                    <div className="text-xl font-bold">{grandTotals.total_sale_qty}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Sale</div>
                                    <div className="text-xl font-bold">{grandTotals.total_sale_total.toFixed(2)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Total Profit</div>
                                    <div className="text-xl font-bold">{grandTotals.total_profit.toFixed(2)}</div>
                                </div>
                                <div className="rounded-lg bg-gray-600 p-2 text-center">
                                    <div className="text-xs font-semibold text-gray-300">AVAILABLE STOCK QTY</div>
                                    <div className="text-2xl font-bold">{grandTotals.available_stock_qty}</div>
                                    <div className="mt-1 text-xs font-semibold text-gray-300">VALUE</div>
                                    <div className="text-lg font-bold">{grandTotals.available_stock_value.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    )}
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
                    .company-block { margin-bottom: 8px !important; }
                    table { font-size: 7px !important; width: 100%; border-collapse: collapse; }
                    table th, table td {
                        font-size: 7px !important; padding: 2px 1px !important;
                        border: 1px solid #000 !important; line-height: 1.2 !important;
                    }
                    thead { display: table-header-group; }
                    tbody { display: table-row-group; }
                    tr { page-break-inside: avoid; }
                    h1 { font-size: 11px !important; font-weight: bold; }
                    h2 { font-size: 9px !important; font-weight: bold; }
                    p { font-size: 8px !important; }
                    .grand-totals {
                        background: #e5e7eb !important;
                        color: #000 !important;
                        padding: 4px !important;
                        margin-top: 8px !important;
                    }
                    .grand-totals .text-purple-300,
                    .grand-totals .text-yellow-300,
                    .grand-totals .text-green-400 { color: #000 !important; }
                    .grand-totals .text-gray-400 { color: #374151 !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
