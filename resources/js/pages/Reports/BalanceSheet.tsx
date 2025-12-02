import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Printer, TrendingUp } from 'lucide-react';

interface BalanceSheetProps {
    asOnDate: string;
    asOnDateFormatted: string;

    // Assets
    bankBalance: number;
    medicineStockValue: number;
    opticsStockValue: number;
    advanceHouseRent: number;
    fixedAssets: number;
    opticsSaleDue: number;
    medicineSaleDue: number;
    operationDue: number;
    reconciliationAdjustment: number;
    totalAssets: number;

    // Liabilities
    opticsVendorDue: number;
    medicineVendorDue: number;
    assetPurchaseDue: number;
    totalLiabilities: number;

    // Fund & Profit
    fund: number;
    netProfit: number;
    totalLiabilitiesAndFund: number;

    filters: {
        as_on_date: string;
    };
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
    asOnDate,
    asOnDateFormatted,
    bankBalance,
    medicineStockValue,
    opticsStockValue,
    advanceHouseRent,
    fixedAssets,
    opticsSaleDue,
    medicineSaleDue,
    operationDue,
    reconciliationAdjustment,
    totalAssets,
    opticsVendorDue,
    medicineVendorDue,
    assetPurchaseDue,
    totalLiabilities,
    fund,
    netProfit,
    totalLiabilitiesAndFund,
    filters
}) => {
    const [selectedDate, setSelectedDate] = useState(filters.as_on_date);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.get('/reports/balance-sheet', { as_on_date: date }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        window.location.href = `/reports/balance-sheet/export?as_on_date=${selectedDate}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <MainAccountLayout>
            <Head title="Balance Sheet" />

            {/* Header Section - No Print */}
            <div className="no-print mb-6 px-6 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Balance Sheet</h1>
                        <p className="text-gray-600 mt-1">Statement of Financial Position</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="outline" size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={handleExport} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">As on Date</label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <Button onClick={() => handleDateChange(selectedDate)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Apply Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Content - Printable */}
            <div className="bg-white shadow-lg rounded-lg print-section" style={{ padding: '40px' }}>
                    {/* Report Header */}
                    <div className="mb-4">
                        <div className="text-center mb-2">
                            <h1 className="text-xl font-bold">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                            <p className="text-sm">Circuit House Adjacent, Main Road, Naogaon.</p>
                        </div>
                        <h2 className="text-lg font-bold text-center mt-4">Statement of Financial Position</h2>
                        <p className="text-sm text-right">
                            Date: {formatDate(asOnDate)}
                        </p>
                    </div>

                    {/* Main Report Table */}
                    <table className="w-full border-collapse" style={{ fontSize: '14px' }}>
                        <thead>
                            <tr>
                                <th colSpan={3} className="border border-gray-800 bg-gray-200 px-2 py-2 text-center font-bold">
                                    Fund & Liabilities
                                </th>
                                <th colSpan={3} className="border-l-2 border-t border-r border-b border-gray-800 bg-gray-200 px-2 py-2 text-center font-bold">
                                    Property & Assets
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>Particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                                <th className="border-l-2 border-t border-r border-b border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>Particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Row 1 - Total Fund */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">1</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Total Fund</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(fund)}</td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">1</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Bank Balance</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(bankBalance)}</td>
                            </tr>

                            {/* Row 2 - Surplus/(Deficit) */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">2</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Surplus/(Deficit)</td>
                                <td className={`border border-gray-800 px-2 py-1 text-right text-xs font-semibold }`}>{formatCurrency(netProfit)}</td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">2</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Optics Stock Value</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(opticsStockValue)}</td>
                            </tr>

                            {/* Row 3 - Optics Vendor Due */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">3</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Optics Vendor Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(opticsVendorDue)}</td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">3</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Medicine Stock Value</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(medicineStockValue)}</td>
                            </tr>

                            {/* Row 4 - Medicine Vendor Due */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">4</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Medicine Vendor Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(medicineVendorDue)}</td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">4</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Advance House Rent</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(advanceHouseRent)}</td>
                            </tr>

                            {/* Row 5 - Asset Purchase Due */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs">5</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Asset Vendor Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(assetPurchaseDue)}</td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">5</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Fixed Asset</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(fixedAssets)}</td>
                            </tr>

                            {/* Row 6 - Empty left side */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">6</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Optics Sale Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(opticsSaleDue)}</td>
                            </tr>

                            {/* Row 7 - Empty left side */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">7</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Medicine Sale Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(medicineSaleDue)}</td>
                            </tr>

                            {/* Row 8 - Empty left side */}
                            <tr>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-1 text-center text-xs">8</td>
                                <td className="border border-gray-800 px-2 py-1 text-xs">Operation Due</td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs">{formatCurrency(operationDue)}</td>
                            </tr>

                            {/* Total Row */}
                            <tr className="font-bold bg-gray-200">
                                <td colSpan={2} className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totalLiabilitiesAndFund)}
                                </td>
                                <td className="border-l-2 border-t border-r border-b border-gray-800 px-2 py-2"></td>
                                <td className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totalAssets)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="mt-16 grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="border-t-2 border-gray-800 pt-2 mt-16">
                                <p className="font-semibold text-sm">Prepared By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-800 pt-2 mt-16">
                                <p className="font-semibold text-sm">Checked By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-800 pt-2 mt-16">
                                <p className="font-semibold text-sm">Approved By</p>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print-section {
                        width: 100%;
                        background: white;
                        padding: 20px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    table {
                        page-break-inside: auto;
                        font-size: 10px !important;
                        width: 100%;
                    }
                    table th {
                        font-size: 14px !important;
                        padding: 4px 6px !important;
                        border: 1px solid #000 !important;
                        font-weight: bold;
                    }
                    table td {
                        font-size: 12px !important;
                        padding: 3px 6px !important;
                        border: 1px solid #000 !important;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    h1 {
                        font-size: 22px !important;
                        margin-bottom: 4px !important;
                        font-weight: bold;
                    }
                    h2 {
                        font-size: 20px !important;
                        margin-top: 6px !important;
                        margin-bottom: 4px !important;
                        font-weight: bold;
                    }
                    p {
                        font-size: 18px !important;
                        margin: 2px 0 !important;
                    }
                    .grid {
                        display: grid !important;
                    }
                    .mt-16 {
                        margin-top: 40px !important;
                    }
                    .border-t-2 {
                        border-top: 2px solid #000 !important;
                    }
                }
            `}</style>
        </MainAccountLayout>
    );
};

export default BalanceSheet;
