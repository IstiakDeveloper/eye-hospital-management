import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Printer } from 'lucide-react';
import MainAccountLayout from '@/layouts/MainAccountLayout';

interface IncomeExpenditureItem {
    serial: number;
    category: string;
    category_id: number | null;
    current_month: number;
    cumulative: number;
    is_active: boolean;
    is_special?: boolean;
    is_adjustment?: boolean;
}

interface IncomeExpenditureProps {
    incomes: IncomeExpenditureItem[];
    expenses: IncomeExpenditureItem[];
    totals: {
        current_month_income: number;
        current_month_expenditure: number;
        cumulative_income: number;
        cumulative_expenditure: number;
        current_surplus_deficit: number;
        cumulative_surplus_deficit: number;
        current_is_surplus: boolean;
        cumulative_is_surplus: boolean;
    };
    filters: {
        from_date: string;
        to_date: string;
    };
}

const IncomeExpenditure: React.FC<IncomeExpenditureProps> = ({
    incomes,
    expenses,
    totals,
    filters
}) => {
    const [fromDate, setFromDate] = useState(filters.from_date);
    const [toDate, setToDate] = useState(filters.to_date);

    const handleFilter = () => {
        router.get('/reports/income-expenditure', {
            from_date: fromDate,
            to_date: toDate
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        window.open(`/reports/income-expenditure/export?from_date=${fromDate}&to_date=${toDate}`, '_blank');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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
            <Head title="Income & Expenditure Report" />

            <div className="p-6">
                {/* Header Section - No Print */}
                <div className="no-print mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">Income & Expenditure Report</h1>
                            <p className="text-gray-600 mt-1">Statement of Income & Expenditure</p>
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
                                    <label className="block text-sm font-medium mb-2">From Date</label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">To Date</label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleFilter}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Apply Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Content - Printable */}
                <div className="bg-white shadow-lg rounded-lg print-section" style={{ padding: '30px' }}>
                    {/* Report Header */}
                    <div className="mb-1">
                        <div className="text-center mb-0">
                            <h1 className="text-base font-bold mb-0">Naogaon Islamia Eye Hospital and Phaco Center</h1>
                            <p className="text-xs mb-0">Circuit House Adjacent, Main Road, Naogaon.</p>
                        </div>
                        <h2 className="text-sm text-center mt-1 mb-1">Statement of Comprehensive Income & Expenditure</h2>
                        <p className="text-xs text-right mb-0">
                            Date: {formatDate(fromDate)} to {formatDate(toDate)}
                        </p>
                    </div>

                    {/* Main Report Table */}
                    <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
                        <thead>
                            <tr>
                                <th colSpan={4} className="border border-gray-800 bg-gray-200 px-2 py-2 text-center font-bold">
                                    Expenditure
                                </th>
                                <th colSpan={4} className="border border-gray-800 bg-gray-200 px-2 py-2 text-center font-bold">
                                    Income
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>Particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Cummulative</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-center text-xs" style={{ width: '40px' }}>SL</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-left text-xs" style={{ width: '200px' }}>Particulars</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Current Month</th>
                                <th className="border border-gray-800 bg-gray-100 px-2 py-1 text-right text-xs" style={{ width: '100px' }}>Cummulative</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Data Rows */}
                            {Array.from({ length: Math.max(expenses.length, incomes.length) }).map((_, index) => {
                                const expense = expenses[index];
                                const income = incomes[index];

                                return (
                                    <tr key={index}>
                                        {/* Expenditure Side */}
                                        <td className="border border-gray-800 px-2 py-1 text-center text-xs">
                                            {expense?.serial || ''}
                                        </td>
                                        <td className={`border border-gray-800 px-2 py-1 text-xs ${expense?.is_adjustment ? 'font-semibold italic text-blue-800' : ''}`}>
                                            {expense?.category || ''}
                                        </td>
                                        <td className={`border border-gray-800 px-2 py-1 text-right text-xs ${expense?.is_adjustment ? 'font-semibold text-blue-800' : ''}`}>
                                            {expense ? formatCurrency(expense.current_month) : ''}
                                        </td>
                                        <td className={`border border-gray-800 px-2 py-1 text-right text-xs ${expense?.is_adjustment ? 'font-semibold text-blue-800' : ''}`}>
                                            {expense ? formatCurrency(expense.cumulative) : ''}
                                        </td>

                                        {/* Income Side */}
                                        <td className="border border-gray-800 px-2 py-1 text-center text-xs">
                                            {income?.serial || ''}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-1 text-xs">
                                            {income?.category || ''}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-1 text-right text-xs">
                                            {income ? formatCurrency(income.current_month) : ''}
                                        </td>
                                        <td className="border border-gray-800 px-2 py-1 text-right text-xs">
                                            {income ? formatCurrency(income.cumulative) : ''}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Sub Total Row */}
                            <tr className="font-bold bg-gray-50">
                                <td colSpan={2} className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Total Expenditure:
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_month_expenditure)}
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_expenditure)}
                                </td>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                            </tr>

                            {/* Surplus/Deficit Row - Only on Expenditure Side */}
                            <tr className="font-bold bg-gray-100">
                                <td colSpan={2} className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Surplus/(Deficit):
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_surplus_deficit)}
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_surplus_deficit)}
                                </td>
                                <td className="border border-gray-800 px-2 py-1 text-center text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                                <td className="border border-gray-800 px-2 py-1 text-right text-xs"></td>
                            </tr>

                            {/* Grand Total Row */}
                            <tr className="font-bold bg-gray-200">
                                <td colSpan={2} className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_month_income)}
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_income)}
                                </td>
                                <td colSpan={2} className="border border-gray-800 px-2 py-2 text-center text-xs">
                                    Total:
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.current_month_income)}
                                </td>
                                <td className="border border-gray-800 px-2 py-2 text-right text-xs">
                                    {formatCurrency(totals.cumulative_income)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="mt-6 grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-8">
                                <p className="font-medium text-xs">Prepared By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-8">
                                <p className="font-medium text-xs">Checked By</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-800 pt-1 mt-8">
                                <p className="font-medium text-xs">Approved By</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
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
                        font-size: 10px !important;
                        padding: 3px 6px !important;
                        border: 1px solid #000 !important;
                    }
                    .italic {
                        font-style: italic;
                    }
                    .text-blue-800 {
                        color: #1e40af !important;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    h1 {
                        font-size: 18px !important;
                        margin-bottom: 0px !important;
                        font-weight: bold;
                    }
                    h2 {
                        font-size: 16px !important;
                        margin-top: 2px !important;
                        margin-bottom: 2px !important;
                    }
                    p {
                        font-size: 14px !important;
                        margin: 0px !important;
                    }
                }
            `}</style>
        </MainAccountLayout>
    );
};

export default IncomeExpenditure;
