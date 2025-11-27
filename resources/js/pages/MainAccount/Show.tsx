import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft,
    FileText,
    Calendar,
    User,
    Building,
    Hash,
    DollarSign,
    Clock,
    Receipt,
    ArrowUpDown
} from 'lucide-react';

interface VoucherUser {
    id: number;
    name: string;
    email: string;
}

interface Voucher {
    id: number;
    sl_no: number;
    voucher_no: string;
    voucher_type: 'Debit' | 'Credit';
    date: string;
    narration: string;
    amount: number;
    formatted_amount: string;
    source_account: string;
    source_account_name: string;
    source_transaction_type: string;
    transaction_type_name: string;
    source_voucher_no: string;
    running_balance: number;
    created_by: VoucherUser | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    voucher: Voucher;
}

export default function Show({ voucher }: Props) {
    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '৳0.00';

        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);

        return `৳${formatted}`;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout>
            <Head title={`Voucher ${voucher.voucher_no}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/main-account/vouchers"
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Vouchers
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Voucher Details</h1>
                            <p className="text-gray-600 mt-1">
                                Voucher #{voucher.voucher_no}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Print
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Voucher Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Voucher Information</h2>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${voucher.voucher_type === 'Credit'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {voucher.voucher_type}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <Hash className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Serial Number</label>
                                            <p className="text-sm text-gray-900 mt-1">{voucher.sl_no}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Receipt className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Voucher Number</label>
                                            <p className="text-sm text-gray-900 mt-1 font-mono">{voucher.voucher_no}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Date</label>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {new Date(voucher.date).toLocaleDateString('en-GB', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Amount</label>
                                            <p className={`text-lg font-bold mt-1 ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <ArrowUpDown className="w-5 h-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Running Balance</label>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                                {formatCurrency(voucher.running_balance)}
                                            </p>
                                        </div>
                                    </div>

                                    {voucher.source_voucher_no && (
                                        <div className="flex items-start space-x-3">
                                            <Receipt className="w-5 h-5 text-gray-400 mt-1" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Source Voucher</label>
                                                <p className="text-sm text-gray-900 mt-1 font-mono">{voucher.source_voucher_no}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Narration Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Narration</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {voucher.narration || 'No narration provided'}
                                </p>
                            </div>
                        </div>

                        {/* Account Information Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-3">
                                    <Building className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Source Account</label>
                                        <p className="text-sm text-gray-900 mt-1">{voucher.source_account_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Code: {voucher.source_account}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <ArrowUpDown className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Transaction Type</label>
                                        <p className="text-sm text-gray-900 mt-1">{voucher.transaction_type_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Code: {voucher.source_transaction_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Voucher Type</span>
                                    <span className={`text-sm font-medium ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {voucher.voucher_type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Amount</span>
                                    <span className={`text-sm font-bold ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                    <span className="text-sm text-gray-600">Balance After</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {formatCurrency(voucher.running_balance)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Created By Card */}
                        {voucher.created_by && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Created By</h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{voucher.created_by.name}</p>
                                        <p className="text-xs text-gray-500">{voucher.created_by.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs text-gray-500">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-3 h-3" />
                                        <span>Created: {formatDateTime(voucher.created_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-3 h-3" />
                                        <span>Updated: {formatDateTime(voucher.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/main-account/vouchers"
                                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back to All Vouchers
                                </Link>
                                <Link
                                    href="/main-account"
                                    className="block w-full text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                    Main Account Dashboard
                                </Link>
                                <button
                                    onClick={() => window.print()}
                                    className="block w-full text-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                    Print Voucher
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
