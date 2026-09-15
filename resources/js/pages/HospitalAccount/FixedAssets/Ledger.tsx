import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, router } from '@inertiajs/react';
import { Filter, Printer } from 'lucide-react';
import React, { useState } from 'react';

interface LedgerData {
    id: number;
    date: string;
    purchase_number: string;
    asset_name: string | null;
    asset_number: string | null;
    vendor_name: string | null;
    description: string | null;
    quantity: number | null;
    previous_balance: number;
    purchase_amount: number;
    paid_amount: number;
    due_amount: number;
    balance: number;
}

interface Vendor {
    id: number;
    name: string;
}

interface Filters {
    start_date: string | null;
    end_date: string | null;
    vendor_id: number | null;
    search: string | null;
    status: string | null;
}

interface Totals {
    purchase_amount: number;
    paid_amount: number;
    due_amount: number;
    balance: number;
}

interface LedgerProps {
    ledgerData: LedgerData[];
    vendors: Vendor[];
    filters: Filters;
    totals: Totals;
}

const Ledger: React.FC<LedgerProps> = ({ ledgerData, vendors, filters, totals }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [vendorId, setVendorId] = useState(filters.vendor_id?.toString() || '');
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};

        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (vendorId) params.vendor_id = vendorId;
        if (search) params.search = search;
        if (status) params.status = status;

        router.get(route('hospital-account.fixed-assets.ledger'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedVendorName = vendors.find((vendor) => vendor.id.toString() === vendorId)?.name || 'All Vendors';

    return (
        <HospitalAccountLayout title="Fixed Asset Ledger">
            <div className="no-print mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold">Filter Ledger</h3>
                    </div>
                    <Link href={route('hospital-account.fixed-assets.index')} className="text-sm text-gray-600 hover:text-gray-900">
                        Back to Fixed Assets
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Vendor</label>
                        <select
                            value={vendorId}
                            onChange={(e) => setVendorId(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Vendors</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="fully_paid">Fully Paid</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Asset name or number..."
                            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={handleFilter} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                        Apply Filter
                    </button>
                </div>
            </div>

            <div className="mb-6 flex gap-4">
                <button onClick={handlePrint} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </button>
            </div>

            <div className="report-section rounded-lg border bg-white shadow-sm">
                <div className="print-header mb-3 p-4">
                    <div className="mb-1 text-center">
                        <h1 className="text-base font-bold">Mousumi Eye Hospital</h1>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <h2 className="text-sm font-bold">Fixed Asset Ledger Report</h2>
                        <p className="text-xs">
                            {startDate && endDate ? `Period: ${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Transactions'}
                            {` — ${selectedVendorName}`}
                            {search && ` — Search: ${search}`}
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Asset</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Vendor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Previous Balance</th>
                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Purchase</th>
                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Paid</th>
                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Due</th>
                                <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {ledgerData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm whitespace-nowrap">{formatDate(item.date)}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="font-medium">{item.asset_name ?? '-'}</div>
                                            <div className="text-xs text-gray-500">{item.asset_number}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm whitespace-nowrap">{item.vendor_name ?? '-'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {item.purchase_number}
                                            {item.description ? ` — ${item.description}` : ''}
                                            {item.quantity ? ` (Qty: ${item.quantity})` : ''}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            {formatAmount(item.previous_balance)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap text-purple-600">
                                            {formatAmount(item.purchase_amount)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap text-green-600">
                                            {item.paid_amount > 0 ? formatAmount(item.paid_amount) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap text-red-600">
                                            {item.due_amount > 0 ? formatAmount(item.due_amount) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm font-semibold whitespace-nowrap">{formatAmount(item.balance)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {ledgerData.length > 0 && (
                            <tfoot className="bg-gray-100">
                                <tr className="font-bold">
                                    <td colSpan={5} className="px-4 py-4 text-sm">
                                        Total
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-purple-600">{formatAmount(totals.purchase_amount)}</td>
                                    <td className="px-4 py-4 text-right text-sm text-green-600">{formatAmount(totals.paid_amount)}</td>
                                    <td className="px-4 py-4 text-right text-sm text-red-600">{formatAmount(totals.due_amount)}</td>
                                    <td className="px-4 py-4 text-right text-sm">{formatAmount(totals.balance)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

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
                        padding: 10px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .print-header {
                        display: block !important;
                        visibility: visible !important;
                    }
                    h1 {
                        font-size: 14px !important;
                        margin-bottom: 2px !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                    }
                    h2 {
                        font-size: 12px !important;
                        margin: 2px 0 !important;
                        font-weight: bold;
                    }
                    p {
                        font-size: 10px !important;
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
                    .text-center {
                        text-align: center !important;
                    }
                    button,
                    .mb-6,
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    table {
                        font-size: 10px !important;
                        width: 100%;
                        border-collapse: collapse;
                    }
                    table th {
                        font-size: 10px !important;
                        padding: 4px 6px !important;
                        border: 1px solid #000 !important;
                        font-weight: bold;
                        line-height: 1.2 !important;
                        background-color: #f3f4f6 !important;
                    }
                    table td {
                        font-size: 10px !important;
                        padding: 4px 6px !important;
                        border: 1px solid #000 !important;
                        line-height: 1.2 !important;
                    }
                    tfoot td {
                        font-weight: bold !important;
                        background-color: #f3f4f6 !important;
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
                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </HospitalAccountLayout>
    );
};

export default Ledger;
