import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Printer, Filter } from 'lucide-react';

interface LedgerData {
    id: number;
    date: string;
    transaction_no: string;
    description: string;
    previous_balance: number;
    expense: number;
    balance: number;
}

interface Filters {
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

interface Totals {
    total_expense: number;
    balance: number;
}

interface LedgerProps {
    ledgerData: LedgerData[];
    descriptions: string[];
    filters: Filters;
    totals: Totals;
}

const Ledger: React.FC<LedgerProps> = ({ ledgerData, descriptions, filters, totals }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [description, setDescription] = useState(filters.description || '');
    const printRef = useRef<HTMLDivElement>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};

        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (description) params.description = description;

        router.get('/hospital-account/house-security-ledger', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <HospitalAccountLayout title="House Security Ledger">
            {/* Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 no-print">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Filter Transactions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Search description..."
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={handleFilter}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border report-section">
                {/* Print Header */}
                <div className="print-header mb-3 p-4">
                    <div className="text-center mb-1">
                        <h1 className="text-base font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <h2 className="text-sm font-bold">House Security Ledger Report</h2>
                        <p className="text-xs">
                            {startDate && endDate
                                ? `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`
                                : 'All Transactions'}
                            {description && ` - Description: ${description}`}
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Transaction No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Previous Balance
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expense
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ledgerData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(item.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {item.transaction_no}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                            {formatAmount(item.previous_balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                            {formatAmount(item.expense)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                            {formatAmount(item.balance)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {ledgerData.length > 0 && (
                            <tfoot className="bg-gray-100">
                                <tr className="font-bold">
                                    <td colSpan={4} className="px-6 py-4 text-sm">
                                        Total
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-red-600">
                                        {formatAmount(totals.total_expense)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        {formatAmount(totals.balance)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
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
                        size: A4 portrait;
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
