import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import React from 'react';

interface BalanceSheetProps {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    totalFundIn: number;
    totalFundOut: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ balance, totalIncome, totalExpense, totalFundIn, totalFundOut }) => {
    const netProfit = totalIncome - totalExpense;
    const netFund = totalFundIn - totalFundOut;
    const totalAssets = balance;
    const totalEquity = netFund + netProfit;

    return (
        <HospitalAccountLayout title="Balance Sheet">
            {/* Header */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Hospital Account - Balance Sheet</h2>
                <p className="text-gray-600">
                    As of{' '}
                    {new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Current Balance</p>
                            <p className="text-2xl font-bold text-blue-600">৳{balance.toLocaleString()}</p>
                        </div>
                        <Wallet className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Assets</p>
                            <p className="text-2xl font-bold text-green-600">৳{totalAssets.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Equity</p>
                            <p className="text-2xl font-bold text-purple-600">৳{totalEquity.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ৳{netProfit.toLocaleString()}
                            </p>
                        </div>
                        {netProfit >= 0 ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-red-600" />}
                    </div>
                </div>
            </div>

            {/* Balance Sheet Tables */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Assets */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-green-50 p-6">
                        <h3 className="text-lg font-semibold text-green-800">ASSETS</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium tracking-wide text-gray-900 uppercase">Current Assets</h4>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Cash & Bank Balance</span>
                                <span className="font-medium">৳{balance.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>TOTAL ASSETS</span>
                                <span className="text-green-600">৳{totalAssets.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equity */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b bg-blue-50 p-6">
                        <h3 className="text-lg font-semibold text-blue-800">EQUITY</h3>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium tracking-wide text-gray-900 uppercase">Owner's Equity</h4>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Capital (Fund In - Fund Out)</span>
                                <span className="font-medium">৳{netFund.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center justify-between border-b py-2">
                                <span className="text-gray-700">Retained Earnings (Net Profit)</span>
                                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ৳{netProfit.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>TOTAL EQUITY</span>
                                <span className="text-blue-600">৳{totalEquity.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-8 rounded-lg border bg-white shadow-sm">
                <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">Financial Summary</h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Income Statement Summary */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Income Statement Summary</h4>

                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Total Revenue</span>
                                    <span className="font-medium text-green-600">৳{totalIncome.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Total Expenses</span>
                                    <span className="font-medium text-red-600">৳{totalExpense.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Net Profit/Loss</span>
                                    <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>৳{netProfit.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cash Flow Summary */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Cash Flow Summary</h4>

                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Total Fund In</span>
                                    <span className="font-medium text-green-600">৳{totalFundIn.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Total Fund Out</span>
                                    <span className="font-medium text-red-600">৳{totalFundOut.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between border-t py-2 font-semibold">
                                    <span>Net Cash Flow</span>
                                    <span className={netFund >= 0 ? 'text-green-600' : 'text-red-600'}>৳{netFund.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Verification */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h4 className="mb-2 font-semibold text-blue-900">Balance Sheet Equation</h4>
                <p className="text-blue-800">
                    Assets = Equity → ৳{totalAssets.toLocaleString()} = ৳{totalEquity.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-blue-700">
                    {totalAssets === totalEquity ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet needs reconciliation'}
                </p>
            </div>
        </HospitalAccountLayout>
    );
};

export default BalanceSheet;
