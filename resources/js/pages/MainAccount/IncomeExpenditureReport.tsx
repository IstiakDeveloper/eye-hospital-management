import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Calendar, Download, Filter, Printer, TrendingUp, TrendingDown } from 'lucide-react';

interface IncomeExpenditureReportProps {
    reportTitle: string;
    startDate: string;
    endDate: string;
    totalIncome: number;
    totalExpenditure: number;
    netSurplusDeficit: number;
    incomes: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    expenditures: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    cumulativeIncomes: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    cumulativeExpenditures: {
        [key: string]: Array<{
            source_account: string;
            source_account_name: string;
            transaction_type: string;
            transaction_type_name: string;
            total_amount: number;
            transaction_count: number;
            formatted_amount: string;
        }>;
    };
    cumulativeTotalIncome: number;
    cumulativeTotalExpenditure: number;
    cumulativeNetSurplusDeficit: number;
    accountSummary: {
        [key: string]: {
            account_name: string;
            income: number;
            expenditure: number;
            surplus_deficit: number;
            formatted_income: string;
            formatted_expenditure: string;
            formatted_surplus_deficit: string;
        };
    };
    monthlyComparison?: {
        previous_month: string;
        previous_income: number;
        previous_expenditure: number;
        previous_surplus_deficit: number;
        income_growth: number;
        expenditure_growth: number;
        formatted_previous_income: string;
        formatted_previous_expenditure: string;
        formatted_previous_surplus_deficit: string;
    };
    formattedTotalIncome: string;
    formattedTotalExpenditure: string;
    formattedNetSurplusDeficit: string;
    formattedCumulativeTotalIncome: string;
    formattedCumulativeTotalExpenditure: string;
    formattedCumulativeNetSurplusDeficit: string;
}

const IncomeExpenditureReport: React.FC<IncomeExpenditureReportProps> = ({
    reportTitle,
    startDate,
    endDate,
    totalIncome,
    totalExpenditure,
    netSurplusDeficit,
    incomes,
    expenditures,
    cumulativeIncomes,
    cumulativeExpenditures,
    cumulativeTotalIncome,
    cumulativeTotalExpenditure,
    cumulativeNetSurplusDeficit,
    accountSummary,
    monthlyComparison,
    formattedTotalIncome,
    formattedTotalExpenditure,
    formattedNetSurplusDeficit,
    formattedCumulativeTotalIncome,
    formattedCumulativeTotalExpenditure,
    formattedCumulativeNetSurplusDeficit
}) => {
    // Get current month's first and last date
    const getCurrentMonthDates = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0]
        };
    };

    const currentMonthDates = getCurrentMonthDates();
    const [customStartDate, setCustomStartDate] = useState(startDate || currentMonthDates.start);
    const [customEndDate, setCustomEndDate] = useState(endDate || currentMonthDates.end);

    const handlePrint = () => {
        window.print();
    };

    const handleFilter = () => {
        router.get('/main-account/income-expenditure-report', {
            date_from: customStartDate,
            date_to: customEndDate
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Process incomes and expenditures data for display
    const incomeRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];
    const expenditureRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];
    const cumulativeIncomeRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];
    const cumulativeExpenditureRows: Array<{ account: string; account_name: string; type: string; type_name: string; amount: number; count: number }> = [];

    // Flatten incomes data
    Object.entries(incomes).forEach(([account, items]) => {
        items.forEach(item => {
            incomeRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Flatten expenditures data
    Object.entries(expenditures).forEach(([account, items]) => {
        items.forEach(item => {
            expenditureRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Flatten cumulative incomes data
    Object.entries(cumulativeIncomes).forEach(([account, items]) => {
        items.forEach(item => {
            cumulativeIncomeRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Flatten cumulative expenditures data
    Object.entries(cumulativeExpenditures).forEach(([account, items]) => {
        items.forEach(item => {
            cumulativeExpenditureRows.push({
                account: item.source_account,
                account_name: item.source_account_name,
                type: item.transaction_type,
                type_name: item.transaction_type_name,
                amount: item.total_amount,
                count: item.transaction_count
            });
        });
    });

    // Find maximum rows to align tables
    const maxRows = Math.max(incomeRows.length, expenditureRows.length, 1);

    return (
        <>
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }

                    .print-area, .print-area * {
                        visibility: visible;
                    }

                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    @page {
                        size: A4;
                        margin: 0.5in;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }

                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        font-size: 12px !important;
                    }

                    th, td {
                        border: 1px solid #000 !important;
                        padding: 4px 6px !important;
                    }

                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    .print-summary {
                        margin-top: 20px;
                        border: 1px solid #000;
                        padding: 10px;
                        font-size: 11px;
                    }

                    .bg-gray-50, .bg-green-50, .bg-red-50, .bg-blue-50 {
                        background-color: transparent !important;
                    }

                    .bg-green-200, .bg-red-200, .bg-blue-200, .bg-gray-200 {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            `}</style>

            <MainAccountLayout title="Income and Expenditure Report">
                {/* Filter Section - Hidden in Print */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <label className="text-sm font-medium">From:</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            />
                            <label className="text-sm font-medium ml-2">To:</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            />
                        </div>

                        <button onClick={handleFilter} className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                            <Filter className="w-3 h-3" />Filter
                        </button>

                        <button onClick={handlePrint} className="bg-purple-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                            <Printer className="w-3 h-3" />Print
                        </button>

                        <button className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 ml-auto">
                            <Download className="w-3 h-3" />Export
                        </button>
                    </div>
                </div>

                {/* Print Area - Contains all printable content */}
                <div className="print-area">
                    {/* Report Header */}
                    <div className="text-center mb-6 print-header">
                        <h1 className="text-2xl font-bold">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
                        <p className="text-base">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
                        <p className="text-sm">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
                        <h2 className="text-xl font-bold mt-2">Income and Expenditure Report</h2>
                        <p className="text-lg font-semibold">{reportTitle}</p>
                    </div>

                    {/* Monthly Comparison - Show only if data exists */}
                    {monthlyComparison && Object.keys(monthlyComparison).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 no-print">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Monthly Comparison vs {monthlyComparison.previous_month}
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="text-gray-600">Income Growth</div>
                                    <div className={`font-bold text-lg flex items-center justify-center gap-1 ${monthlyComparison.income_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {monthlyComparison.income_growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {monthlyComparison.income_growth?.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Expenditure Growth</div>
                                    <div className={`font-bold text-lg flex items-center justify-center gap-1 ${monthlyComparison.expenditure_growth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {monthlyComparison.expenditure_growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {monthlyComparison.expenditure_growth?.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Previous Surplus/Deficit</div>
                                    <div className={`font-bold text-lg ${monthlyComparison.previous_surplus_deficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ৳{monthlyComparison.formatted_previous_surplus_deficit}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Report Table */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th rowSpan={2} className="border border-gray-400 px-3 py-2 font-bold bg-green-600 w-1/3">INCOME</th>
                                    <th colSpan={2} className="border border-gray-400 px-2 py-1 font-bold bg-green-500 text-xs">Amount</th>
                                    <th rowSpan={2} className="border border-gray-400 px-3 py-2 font-bold bg-red-600 w-1/3">EXPENDITURE</th>
                                    <th colSpan={2} className="border border-gray-400 px-2 py-1 font-bold bg-red-500 text-xs">Amount</th>
                                </tr>
                                <tr className="bg-gray-100 text-gray-800 font-medium text-xs">
                                    <th className="border border-gray-300 px-2 py-1 bg-green-100">Period</th>
                                    <th className="border border-gray-300 px-2 py-1 bg-green-50">Cumulative</th>
                                    <th className="border border-gray-300 px-2 py-1 bg-red-100">Period</th>
                                    <th className="border border-gray-300 px-2 py-1 bg-red-50">Cumulative</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Data Rows */}
                                {Array.from({ length: maxRows }).map((_, index) => {
                                    const incomeRow = incomeRows[index];
                                    const expenditureRow = expenditureRows[index];
                                    const cumulativeIncomeRow = cumulativeIncomeRows[index];
                                    const cumulativeExpenditureRow = cumulativeExpenditureRows[index];

                                    return (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-300 px-2 py-2 bg-green-50">
                                                {incomeRow ? (
                                                    <span className="text-xs">
                                                        {incomeRow.account_name} - {incomeRow.type_name}
                                                        <span className="text-xs text-gray-500 ml-1">({incomeRow.count})</span>
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right bg-green-50">
                                                {incomeRow ? (
                                                    <span className="font-bold">৳{formatAmount(incomeRow.amount)}</span>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right bg-green-100">
                                                {cumulativeIncomeRow ? (
                                                    <span className="font-bold">৳{formatAmount(cumulativeIncomeRow.amount)}</span>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 bg-red-50">
                                                {expenditureRow ? (
                                                    <span className="text-xs">
                                                        {expenditureRow.account_name} - {expenditureRow.type_name}
                                                        <span className="text-xs text-gray-500 ml-1">({expenditureRow.count})</span>
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right bg-red-50">
                                                {expenditureRow ? (
                                                    <span className="font-bold">৳{formatAmount(expenditureRow.amount)}</span>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right bg-red-100">
                                                {cumulativeExpenditureRow ? (
                                                    <span className="font-bold">৳{formatAmount(cumulativeExpenditureRow.amount)}</span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Income Total Row */}
                                <tr className="bg-green-200 font-bold border-t-2 border-green-600">
                                    <td className="border border-gray-300 px-2 py-2 bg-green-200">
                                        <span>TOTAL INCOME</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-green-200 text-right">
                                        <span>৳{formattedTotalIncome}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-green-300 text-right">
                                        <span>৳{formattedCumulativeTotalIncome}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-200">
                                        <span>TOTAL EXPENDITURE</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-200 text-right">
                                        <span>৳{formattedTotalExpenditure}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-300 text-right">
                                        <span>৳{formattedCumulativeTotalExpenditure}</span>
                                    </td>
                                </tr>

                                {/* Surplus/Deficit Row */}
                                <tr className="bg-blue-50">
                                    {netSurplusDeficit >= 0 ? (
                                        <>
                                            <td className="border border-gray-300 px-2 py-2 bg-gray-50" colSpan={3}></td>
                                            <td className="border border-gray-300 px-2 py-2">
                                                <span className="font-medium text-xs">Surplus (Period/Cumulative)</span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right">
                                                <span className="font-bold text-green-600">৳{formattedNetSurplusDeficit}</span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right">
                                                <span className="font-bold text-green-600">৳{formattedCumulativeNetSurplusDeficit}</span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="border border-gray-300 px-2 py-2">
                                                <span className="font-medium text-xs">Deficit (Period/Cumulative)</span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right">
                                                <span className="font-bold text-red-600">৳{formatAmount(Math.abs(netSurplusDeficit))}</span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right">
                                                <span className="font-bold text-red-600">৳{formatAmount(Math.abs(cumulativeNetSurplusDeficit))}</span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 bg-gray-50" colSpan={3}></td>
                                        </>
                                    )}
                                </tr>

                                {/* Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 px-2 py-2 bg-green-200">
                                        <span>TOTAL</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-green-200 text-right">
                                        <span>৳{formatAmount(netSurplusDeficit >= 0 ? totalIncome : totalIncome + Math.abs(netSurplusDeficit))}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-green-300 text-right">
                                        <span>৳{formatAmount(cumulativeNetSurplusDeficit >= 0 ? cumulativeTotalIncome : cumulativeTotalIncome + Math.abs(cumulativeNetSurplusDeficit))}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-200">
                                        <span>TOTAL</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-200 text-right">
                                        <span>৳{formatAmount(netSurplusDeficit >= 0 ? totalExpenditure + netSurplusDeficit : totalExpenditure)}</span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 bg-red-300 text-right">
                                        <span>৳{formatAmount(cumulativeNetSurplusDeficit >= 0 ? cumulativeTotalExpenditure + cumulativeNetSurplusDeficit : cumulativeTotalExpenditure)}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    {/* <div className="mt-4 bg-gray-50 p-4 rounded border print-summary">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-gray-600">Total Income</div>
                                <div className="font-bold text-lg text-green-600">৳{formattedTotalIncome}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Total Expenditure</div>
                                <div className="font-bold text-lg text-red-600">৳{formattedTotalExpenditure}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Net {netSurplusDeficit >= 0 ? 'Surplus' : 'Deficit'}</div>
                                <div className={`font-bold text-lg ${netSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ৳{formattedNetSurplusDeficit}
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </MainAccountLayout>
        </>
    );
};

export default IncomeExpenditureReport;
