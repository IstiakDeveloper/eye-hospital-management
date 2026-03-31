import AdminLayout from '@/layouts/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpDown, Building, Calendar, ChevronLeft, Clock, DollarSign, FileText, Hash, Receipt, User } from 'lucide-react';

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
                        <Link href="/main-account/vouchers" className="flex items-center text-gray-600 transition-colors hover:text-gray-900">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Vouchers
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Voucher Details</h1>
                            <p className="mt-1 text-gray-600">Voucher #{voucher.voucher_no}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Voucher Information */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Details Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Voucher Information</h2>
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                        voucher.voucher_type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {voucher.voucher_type}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <Hash className="mt-1 h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Serial Number</label>
                                            <p className="mt-1 text-sm text-gray-900">{voucher.sl_no}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Receipt className="mt-1 h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Voucher Number</label>
                                            <p className="mt-1 font-mono text-sm text-gray-900">{voucher.voucher_no}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Date</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {new Date(voucher.date).toLocaleDateString('en-GB', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <DollarSign className="mt-1 h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Amount</label>
                                            <p
                                                className={`mt-1 text-lg font-bold ${
                                                    voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'
                                                }`}
                                            >
                                                {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <ArrowUpDown className="mt-1 h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Running Balance</label>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(voucher.running_balance)}</p>
                                        </div>
                                    </div>

                                    {voucher.source_voucher_no && (
                                        <div className="flex items-start space-x-3">
                                            <Receipt className="mt-1 h-5 w-5 text-gray-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Source Voucher</label>
                                                <p className="mt-1 font-mono text-sm text-gray-900">{voucher.source_voucher_no}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Narration Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Narration</h3>
                            <div className="rounded-lg bg-gray-50 p-4">
                                <p className="text-sm leading-relaxed text-gray-700">{voucher.narration || 'No narration provided'}</p>
                            </div>
                        </div>

                        {/* Account Information Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Information</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="flex items-start space-x-3">
                                    <Building className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Source Account</label>
                                        <p className="mt-1 text-sm text-gray-900">{voucher.source_account_name}</p>
                                        <p className="mt-1 text-xs text-gray-500">Code: {voucher.source_account}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <ArrowUpDown className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Transaction Type</label>
                                        <p className="mt-1 text-sm text-gray-900">{voucher.transaction_type_name}</p>
                                        <p className="mt-1 text-xs text-gray-500">Code: {voucher.source_transaction_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-600">Voucher Type</span>
                                    <span className={`text-sm font-medium ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {voucher.voucher_type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 py-2">
                                    <span className="text-sm text-gray-600">Amount</span>
                                    <span className={`text-sm font-bold ${voucher.voucher_type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {voucher.formatted_amount || formatCurrency(voucher.amount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 py-2">
                                    <span className="text-sm text-gray-600">Balance After</span>
                                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(voucher.running_balance)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Created By Card */}
                        {voucher.created_by && (
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">Created By</h3>
                                <div className="mb-4 flex items-center space-x-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{voucher.created_by.name}</p>
                                        <p className="text-xs text-gray-500">{voucher.created_by.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs text-gray-500">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-3 w-3" />
                                        <span>Created: {formatDateTime(voucher.created_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-3 w-3" />
                                        <span>Updated: {formatDateTime(voucher.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/main-account/vouchers"
                                    className="block w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Back to All Vouchers
                                </Link>
                                <Link
                                    href="/main-account"
                                    className="block w-full rounded-lg bg-blue-100 px-4 py-2 text-center text-blue-700 transition-colors hover:bg-blue-200"
                                >
                                    Main Account Dashboard
                                </Link>
                                <button
                                    onClick={() => window.print()}
                                    className="block w-full rounded-lg bg-green-100 px-4 py-2 text-center text-green-700 transition-colors hover:bg-green-200"
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
