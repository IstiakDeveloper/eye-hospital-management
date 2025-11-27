import React from 'react';
import MainAccountLayout from '@/layouts/MainAccountLayout';

import { Head, Link } from '@inertiajs/react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    Calendar,
    Users,
    ArrowRight,
    DollarSign,
    PieChart,
    Download
} from 'lucide-react';

interface Voucher {
    id: number;
    voucher_no: string;
    voucher_type: 'Debit' | 'Credit';
    date: string;
    narration: string;
    amount: number;
    formatted_amount: string;
    source_account_name: string;
    transaction_type_name: string;
    created_by: { id: number; name: string } | null;
    created_at: string;
}

interface Summary {
    total_debit: number;
    total_credit: number;
    net_balance: number;
}

interface DailySummary {
    debit_total: number;
    credit_total: number;
    net_change: number;
    voucher_count: number;
}

interface MonthlyReport {
    debit_total: number;
    credit_total: number;
    net_change: number;
}

interface Props {
    balance: number;
    summary: Summary;
    sourceAccountSummary: any[];
    recentVouchers: Voucher[];
    todaySummary: DailySummary;
    monthlyReport: MonthlyReport;
}

export default function Index({
    balance,
    summary,
    sourceAccountSummary,
    recentVouchers,
    todaySummary,
    monthlyReport
}: Props) {
    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '৳0.00';

        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);

        return `৳${formatted}`;
    };


    const safeBalance = balance || 0;
    const safeSummary = {
        total_debit: summary?.total_debit || 0,
        total_credit: summary?.total_credit || 0,
        net_balance: summary?.net_balance || 0
    };
    const safeTodaySummary = {
        debit_total: todaySummary?.debit_total || 0,
        credit_total: todaySummary?.credit_total || 0,
        net_change: todaySummary?.net_change || 0,
        voucher_count: todaySummary?.voucher_count || 0
    };
    const safeMonthlyReport = {
        debit_total: monthlyReport?.debit_total || 0,
        credit_total: monthlyReport?.credit_total || 0,
        net_change: monthlyReport?.net_change || 0
    };

    return (
        <MainAccountLayout>
            <Head title="Main Account Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Main Account</h1>
                        <p className="text-gray-600 mt-1">Account overview and recent transactions</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/main-account/vouchers"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            View All Vouchers
                        </Link>

                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(safeBalance)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Debit</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(safeSummary.total_debit)}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Credit</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(safeSummary.total_credit)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                                <p className={`text-2xl font-bold mt-1 ${safeSummary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(safeSummary.net_balance)}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${safeSummary.net_balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <DollarSign className={`w-6 h-6 ${safeSummary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today's Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Today's Activity</h3>
                            <Calendar className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Transactions</span>
                                <span className="text-sm font-medium text-gray-900">{safeTodaySummary.voucher_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Debit</span>
                                <span className="text-sm font-medium text-red-600">{formatCurrency(safeTodaySummary.debit_total)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Credit</span>
                                <span className="text-sm font-medium text-green-600">{formatCurrency(safeTodaySummary.credit_total)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">Net Change</span>
                                    <span className={`text-sm font-bold ${safeTodaySummary.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(safeTodaySummary.net_change)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Debit</span>
                                <span className="text-sm font-medium text-red-600">{formatCurrency(safeMonthlyReport.debit_total)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Credit</span>
                                <span className="text-sm font-medium text-green-600">{formatCurrency(safeMonthlyReport.credit_total)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">Net Change</span>
                                    <span className={`text-sm font-bold ${safeMonthlyReport.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(safeMonthlyReport.net_change)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                href="/main-account/vouchers"
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                            >
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 text-gray-500 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">All Vouchers</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            <Link
                                href="/main-account/reports"
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                            >
                                <div className="flex items-center">
                                    <PieChart className="w-4 h-4 text-gray-500 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">Reports</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            <Link
                                href="/main-account/export"
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                            >
                                <div className="flex items-center">
                                    <Download className="w-4 h-4 text-gray-500 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">Export Data</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Vouchers */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Vouchers</h3>
                            <Link
                                href="/main-account/vouchers"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Voucher
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentVouchers && recentVouchers.length > 0 ? (
                                    recentVouchers.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{voucher.voucher_no}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs" title={voucher.narration}>
                                                        {voucher.narration}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(voucher.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${voucher.voucher_type === 'Credit'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {voucher.voucher_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="max-w-xs truncate" title={voucher.source_account_name}>
                                                    {voucher.source_account_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/main-account/vouchers/${voucher.id}`}
                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No recent vouchers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainAccountLayout>
    );
}
