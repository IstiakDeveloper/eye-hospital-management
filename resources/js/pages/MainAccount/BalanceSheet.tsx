import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import MainAccountLayout from '@/layouts/MainAccountLayout';
import { Calendar, Download, Filter, Printer, AlertCircle, CheckCircle } from 'lucide-react';

interface BalanceSheetProps {
    asOnDate: string;
    asOnDateFormatted: string;
    reportTitle: string;
    currentAssets: Array<{
        name: string;
        amount: number;
        formatted_amount: string;
    }>;
    fixedAssets: Array<{
        account: string;
        account_name: string;
        amount: number;
        formatted_amount: string;
    }>;
    totalCurrentAssets: number;
    totalFixedAssets: number;
    totalAssets: number;
    liabilities: Array<{
        name: string;
        amount: number;
        formatted_amount: string;
    }>;
    capitalReserves: Array<{
        name: string;
        amount: number;
        formatted_amount: string;
    }>;
    totalLiabilities: number;
    totalCapital: number;
    totalLiabilitiesAndCapital: number;
    formattedTotalCurrentAssets: string;
    formattedTotalFixedAssets: string;
    formattedTotalAssets: string;
    formattedTotalLiabilities: string;
    formattedTotalCapital: string;
    formattedTotalLiabilitiesAndCapital: string;
    accountBalances: Array<{
        name: string;
        balance: number;
        formatted_balance: string;
        status: 'asset' | 'liability';
    }>;
    balanceDifference: number;
    formattedBalanceDifference: string;
    isBalanced: boolean;
    initialCapital: number;
    retainedEarnings: number;
    totalIncome: number;
    totalExpenses: number;
    totalFundIn: number;
    totalFundOut: number;
    formattedInitialCapital: string;
    formattedRetainedEarnings: string;
    hospital_name: string;
    hospital_location: string;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
    asOnDate,
    asOnDateFormatted,
    reportTitle,
    currentAssets,
    fixedAssets,
    totalCurrentAssets,
    totalFixedAssets,
    totalAssets,
    liabilities,
    capitalReserves,
    totalLiabilities,
    totalCapital,
    totalLiabilitiesAndCapital,
    formattedTotalCurrentAssets,
    formattedTotalFixedAssets,
    formattedTotalAssets,
    formattedTotalLiabilities,
    formattedTotalCapital,
    formattedTotalLiabilitiesAndCapital,
    accountBalances,
    balanceDifference,
    formattedBalanceDifference,
    isBalanced,
    initialCapital,
    retainedEarnings,
    hospital_name,
    hospital_location
}) => {
    const [selectedDate, setSelectedDate] = useState(asOnDate);

    const handlePrint = () => {
        window.print();
    };

    const handleFilter = () => {
        router.get('/main-account/balance-sheet', {
            date: selectedDate
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Calculate maximum rows for alignment
    const assetsRows = currentAssets.length + fixedAssets.length + 3; // +3 for subtotals and total
    const liabilitiesRows = liabilities.length + capitalReserves.length + 3; // +3 for subtotals and total
    const maxRows = Math.max(assetsRows, liabilitiesRows);

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

                    .bg-gray-50, .bg-blue-50, .bg-green-50, .bg-red-50 {
                        background-color: transparent !important;
                    }
                    
                    .bg-blue-200, .bg-gray-200 {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
            `}</style>

            <MainAccountLayout title="Balance Sheet">
                {/* Filter Section - Hidden in Print */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <label className="text-sm font-medium">As on Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
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

                {/* Balance Verification Alert */}
                <div className={`mb-6 p-4 rounded-lg border no-print ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                        {isBalanced ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-800">Balance Sheet is Balanced</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="font-semibold text-red-800">Balance Sheet Difference: ৳{formattedBalanceDifference}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Print Area - Contains all printable content */}
                <div className="print-area">
                    {/* Report Header */}
                    <div className="text-center mb-6 print-header">
                        <h1 className="text-2xl font-bold">{hospital_name}</h1>
                        <p className="text-lg">{hospital_location}</p>
                        <h2 className="text-xl font-bold mt-2">Balance Sheet</h2>
                        <p className="text-lg font-semibold">As on {asOnDateFormatted}</p>
                    </div>

                    {/* Main Balance Sheet Table */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="border border-gray-400 px-3 py-2 font-bold w-1/2">ASSETS</th>
                                    <th className="border border-gray-400 px-3 py-2 font-bold w-1/2">LIABILITIES & CAPITAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Current Assets Section */}
                                <tr className="bg-blue-100">
                                    <td className="border border-gray-300 px-3 py-2 font-bold">CURRENT ASSETS</td>
                                    <td className="border border-gray-300 px-3 py-2 font-bold">CURRENT LIABILITIES</td>
                                </tr>

                                {/* Current Assets Rows */}
                                {currentAssets.map((asset, index) => (
                                    <tr key={`current-${index}`} className="bg-white">
                                        <td className="border border-gray-300 px-3 py-2 pl-6">
                                            <div className="flex justify-between">
                                                <span>{asset.name}</span>
                                                <span className="font-bold">৳{asset.formatted_amount}</span>
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 pl-6">
                                            {index < liabilities.length ? (
                                                <div className="flex justify-between">
                                                    <span>{liabilities[index].name}</span>
                                                    <span className="font-bold">৳{liabilities[index].formatted_amount}</span>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}

                                {/* Current Assets Total */}
                                <tr className="bg-blue-50">
                                    <td className="border border-gray-300 px-3 py-2 font-bold">
                                        <div className="flex justify-between">
                                            <span>Total Current Assets</span>
                                            <span>৳{formattedTotalCurrentAssets}</span>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 font-bold">
                                        <div className="flex justify-between">
                                            <span>Total Current Liabilities</span>
                                            <span>৳{formattedTotalLiabilities}</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Fixed Assets Section */}
                                <tr className="bg-blue-100">
                                    <td className="border border-gray-300 px-3 py-2 font-bold">FIXED ASSETS</td>
                                    <td className="border border-gray-300 px-3 py-2 font-bold">CAPITAL & RESERVES</td>
                                </tr>

                                {/* Fixed Assets and Capital Rows */}
                                {Math.max(fixedAssets.length, capitalReserves.length) > 0 && Array.from({
                                    length: Math.max(fixedAssets.length, capitalReserves.length)
                                }).map((_, index) => {
                                    const fixedAsset = fixedAssets[index];
                                    const capital = capitalReserves[index];

                                    return (
                                        <tr key={`fixed-${index}`} className="bg-white">
                                            <td className="border border-gray-300 px-3 py-2 pl-6">
                                                {fixedAsset ? (
                                                    <div className="flex justify-between">
                                                        <span>{fixedAsset.account_name}</span>
                                                        <span className="font-bold">৳{fixedAsset.formatted_amount}</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 pl-6">
                                                {capital ? (
                                                    <div className="flex justify-between">
                                                        <span>{capital.name}</span>
                                                        <span className={`font-bold ${capital.amount >= 0 ? 'text-black' : 'text-red-600'}`}>
                                                            ৳{capital.formatted_amount}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Fixed Assets Total */}
                                <tr className="bg-blue-50">
                                    <td className="border border-gray-300 px-3 py-2 font-bold">
                                        <div className="flex justify-between">
                                            <span>Total Fixed Assets</span>
                                            <span>৳{formattedTotalFixedAssets}</span>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 font-bold">
                                        <div className="flex justify-between">
                                            <span>Total Capital & Reserves</span>
                                            <span className={`${totalCapital >= 0 ? 'text-black' : 'text-red-600'}`}>
                                                ৳{formattedTotalCapital}
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Grand Total Row */}
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border border-gray-300 px-3 py-2 bg-blue-200">
                                        <div className="flex justify-between text-lg">
                                            <span>TOTAL ASSETS</span>
                                            <span>৳{formattedTotalAssets}</span>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 bg-blue-200">
                                        <div className="flex justify-between text-lg">
                                            <span>TOTAL LIABILITIES & CAPITAL</span>
                                            <span>৳{formattedTotalLiabilitiesAndCapital}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Account Balances Summary */}
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
                        <div className="bg-blue-600 text-white px-4 py-2 font-bold">Individual Account Balances</div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 text-gray-800 font-medium">
                                    <th className="border border-gray-300 px-3 py-2">Account</th>
                                    <th className="border border-gray-300 px-3 py-2">Balance</th>
                                    <th className="border border-gray-300 px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountBalances.map((account, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2 font-medium">{account.name}</td>
                                        <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ৳{account.formatted_balance}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${account.status === 'asset' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {account.status === 'asset' ? 'Asset' : 'Liability'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                            <div className="text-green-600 text-sm font-medium">Total Assets</div>
                            <div className="text-lg font-bold text-green-800">৳{formattedTotalAssets}</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                            <div className="text-red-600 text-sm font-medium">Total Liabilities</div>
                            <div className="text-lg font-bold text-red-800">৳{formattedTotalLiabilities}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                            <div className="text-blue-600 text-sm font-medium">Total Capital</div>
                            <div className={`text-lg font-bold ${totalCapital >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                                ৳{formattedTotalCapital}
                            </div>
                        </div>
                        <div className={`border rounded p-3 text-center ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                Balance Status
                            </div>
                            <div className={`text-lg font-bold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                                {isBalanced ? 'Balanced' : `Diff: ৳${formattedBalanceDifference}`}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-gray-50 p-4 rounded border text-sm">
                        <h4 className="font-bold mb-2">Notes:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>Current Assets represent cash and bank balances in the main account</li>
                            <li>Fixed Assets are calculated from expense transactions marked as "Fixed Asset"</li>
                            <li>Capital Account shows net fund contributions (Fund In - Fund Out)</li>
                            <li>Retained Earnings represent accumulated surplus/deficit from operations</li>
                            <li>Individual account balances show the status of each sub-account</li>
                        </ul>
                    </div>
                </div>
            </MainAccountLayout>
        </>
    );
};

export default BalanceSheet;