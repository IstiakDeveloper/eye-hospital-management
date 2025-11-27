import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Search, Calendar, Filter, Eye, CreditCard, FileText, Plus,
    TrendingUp, DollarSign, AlertCircle, CheckCircle, Clock,
    Download, RefreshCw, ChevronLeft, ChevronRight, BarChart3, PieChart, FileBarChart
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
}

interface Visit {
    visit_id: string;
}

interface MedicalTestInfo {
    name: string;
    code: string;
}

interface TestItem {
    id: number;
    medical_test: MedicalTestInfo;
    final_price: number;
}

interface TestGroup {
    id: number;
    group_number: string;
    patient: Patient;
    visit?: Visit;
    tests: TestItem[];
    total_original_price: number;
    total_discount: number;
    final_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    test_date: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: TestGroup[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Stats {
    today_total: number;
    today_paid: number;
    today_due: number;
    pending_count: number;
}

interface Filters {
    search?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    testGroups: PaginatedData;
    filters?: Filters;
    stats?: Stats;
}

export default function MedicalTestIndex({ testGroups, filters, stats }: Props) {
    const safeFilters = filters || {};
    const safeStats = stats || {
        today_total: 0,
        today_paid: 0,
        today_due: 0,
        pending_count: 0
    };

    const [searchQuery, setSearchQuery] = useState(safeFilters.search || '');
    const [paymentStatus, setPaymentStatus] = useState(safeFilters.payment_status || '');
    const [dateFrom, setDateFrom] = useState(safeFilters.date_from || '');
    const [dateTo, setDateTo] = useState(safeFilters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);

    const handleSearch = () => {
        router.get('/medical-tests', {
            search: searchQuery,
            payment_status: paymentStatus,
            date_from: dateFrom,
            date_to: dateTo
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleReset = () => {
        setSearchQuery('');
        setPaymentStatus('');
        setDateFrom('');
        setDateTo('');
        router.get('/medical-tests');
    };

    const getStatusBadge = (status: string) => {
        let bgColor = 'bg-red-100';
        let textColor = 'text-red-800';
        let borderColor = 'border-red-200';
        let icon = <AlertCircle className="w-3 h-3" />;

        if (status === 'paid') {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            borderColor = 'border-green-200';
            icon = <CheckCircle className="w-3 h-3" />;
        } else if (status === 'partial') {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            borderColor = 'border-yellow-200';
            icon = <Clock className="w-3 h-3" />;
        }

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>
                {icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return `৳${Number(amount).toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDailyReport = () => {
        const date = dateFrom || new Date().toISOString().split('T')[0];
        router.visit(`/medical-tests/reports/daily?date=${date}`);
    };

    const handleMonthlyReport = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        router.visit(`/medical-tests/reports/monthly?month=${month}&year=${year}`);
    };

    const handleTestWiseReport = () => {
        const endDate = dateTo || new Date().toISOString().split('T')[0];
        const startDate = dateFrom || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        router.visit(`/medical-tests/reports/test-wise?start_date=${startDate}&end_date=${endDate}`);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Medical Test Bookings</h1>
                            <p className="text-gray-600 mt-1">Manage and track all test bookings</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit('/medical-tests/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                New Booking
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">
                                        {dateFrom || dateTo ? 'Selected Period Total' : "Today's Total"}
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{formatCurrency(safeStats.today_total)}</p>
                                    {(dateFrom || dateTo) && (
                                        <p className="text-blue-100 text-xs mt-1">
                                            {dateFrom && formatDate(dateFrom)} - {dateTo ? formatDate(dateTo) : 'Now'}
                                        </p>
                                    )}
                                </div>
                                <DollarSign className="w-12 h-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">
                                        {dateFrom || dateTo ? 'Period Paid' : "Today's Paid"}
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{formatCurrency(safeStats.today_paid)}</p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-green-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm">
                                        {dateFrom || dateTo ? 'Period Due' : "Today's Due"}
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{formatCurrency(safeStats.today_due)}</p>
                                </div>
                                <AlertCircle className="w-12 h-12 text-red-200" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Pending Payments</p>
                                    <p className="text-3xl font-bold mt-1">{safeStats.pending_count}</p>
                                    {(dateFrom || dateTo) && (
                                        <p className="text-purple-100 text-xs mt-1">In selected period</p>
                                    )}
                                </div>
                                <TrendingUp className="w-12 h-12 text-purple-200" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Filters</h3>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by group number, patient name, phone..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Payment Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                        <option value="paid">Paid</option>
                                    </select>

                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Search className="w-4 h-4" />
                                    Search
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </button>

                                <div className="ml-auto relative">
                                    <button
                                        onClick={() => setShowReportMenu(!showReportMenu)}
                                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Reports
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showReportMenu ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showReportMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <button
                                                onClick={() => {
                                                    handleDailyReport();
                                                    setShowReportMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left"
                                            >
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Daily Report</div>
                                                    <div className="text-xs text-gray-500">Day-wise summary</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    handleMonthlyReport();
                                                    setShowReportMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition text-left"
                                            >
                                                <PieChart className="w-5 h-5 text-purple-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Monthly Report</div>
                                                    <div className="text-xs text-gray-500">Month-wise analysis</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    handleTestWiseReport();
                                                    setShowReportMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition text-left"
                                            >
                                                <FileBarChart className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Test-wise Report</div>
                                                    <div className="text-xs text-gray-500">Performance by test type</div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Group #</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tests</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Amount</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Paid</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Due</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {testGroups.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <p className="text-lg font-medium">No test bookings found</p>
                                                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        testGroups.data.map((group) => (
                                            <tr key={group.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-blue-600">{group.group_number}</div>
                                                        {group.visit && (
                                                            <div className="text-xs text-gray-500">Visit: {group.visit.visit_id}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{group.patient.name}</div>
                                                        <div className="text-sm text-gray-500">{group.patient.patient_id}</div>
                                                        <div className="text-xs text-gray-500">{group.patient.phone}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">{group.tests.length} Test(s)</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {group.tests.slice(0, 2).map((test, idx) => (
                                                                <div key={idx}>{test.medical_test.name}</div>
                                                            ))}
                                                            {group.tests.length > 2 && (
                                                                <div className="text-blue-600">+{group.tests.length - 2} more</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-semibold text-gray-900">{formatCurrency(group.final_amount)}</div>
                                                    {group.total_discount > 0 && (
                                                        <div className="text-xs text-red-600">-{formatCurrency(group.total_discount)}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-semibold text-green-600">{formatCurrency(group.paid_amount)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-semibold text-red-600">{formatCurrency(group.due_amount)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {getStatusBadge(group.payment_status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{formatDate(group.test_date)}</div>
                                                    <div className="text-xs text-gray-500">{formatDateTime(group.created_at)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.visit(`/medical-tests/${group.id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => router.visit(`/medical-tests/${group.id}/receipt`)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        {group.payment_status !== 'paid' && (
                                                            <button
                                                                onClick={() => router.visit(`/medical-tests/${group.id}/payment`)}
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                                title="Add Payment"
                                                            >
                                                                <CreditCard className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {testGroups.last_page > 1 && (
                            <div className="px-6 py-4 border-t bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {testGroups.data.length} of {testGroups.total} results
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {testGroups.links.map((link, idx) => {
                                            if (!link.url) return null;

                                            const isActive = link.active;
                                            const isPrev = link.label.includes('Previous');
                                            const isNext = link.label.includes('Next');

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    disabled={isActive}
                                                    className={`px-3 py-2 rounded-lg transition ${isActive
                                                            ? 'bg-blue-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {isPrev && <ChevronLeft className="w-4 h-4" />}
                                                    {!isPrev && !isNext && link.label}
                                                    {isNext && <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
