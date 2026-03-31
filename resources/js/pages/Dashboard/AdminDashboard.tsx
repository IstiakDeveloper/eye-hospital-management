import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Calendar,
    CalendarDays,
    Clock,
    CreditCard,
    DollarSign,
    Eye,
    FileText,
    Filter,
    Glasses,
    Package,
    Pill,
    Scissors,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';

interface DashboardProps {
    auth: any;
    accountBalances: {
        hospital: { balance: number | string; currency: string; lastUpdated: string };
        medicine: { balance: number | string; currency: string; lastUpdated: string };
        optics: { balance: number | string; currency: string; lastUpdated: string };
        operation: { balance: number | string; currency: string; lastUpdated: string };
        total: number | string;
    };
    hospitalOverview: {
        patients: { total: number; today: number; growth?: number };
        visits: { total: number; today: number; active: number; completed: number; growth?: number };
        appointments: { total: number; today: number; pending: number; completed: number; growth?: number };
        doctors: { total: number; available: number };
        prescriptions: { total: number; today: number; growth?: number };
    };
    medicineStockInfo: {
        overview: {
            totalMedicines: number;
            activeMedicines: number;
            lowStockMedicines: number;
            totalStockValue: number | string;
            expiredStock: number;
            expiringStock: number;
        };
        alerts: { lowStock: number; expired: number; expiring: number };
        topSelling: Array<{ name: string; total_sold: number; total_revenue: number | string }>;
        periodStats: {
            totalSales: number | string;
            totalProfit: number | string;
            totalSold: number;
            salesGrowth?: number;
            profitGrowth?: number;
        };
    };
    opticsStockInfo: {
        frames: { total: number; active: number; lowStock: number; totalValue: number | string };
        lenses: { total: number; active: number; lowStock: number; totalValue: number | string };
        completeGlasses: { total: number; active: number; lowStock: number; totalValue: number | string };
        alerts: { totalLowStock: number; framesLowStock: number; lensesLowStock: number; completeGlassesLowStock: number };
        topSellingFrames: Array<{ brand: string; model: string; selling_price: number | string; prescription_glasses_count: number }>;
        totalStockValue: number | string;
        periodStats: { prescriptionGlasses: number; prescriptionGlassesGrowth?: number };
    };
    recentActivities: {
        recentPatients: Array<any>;
        recentVisits: Array<any>;
        recentPayments: Array<any>;
    };
    periodReports: {
        hospital: {
            income: number | string;
            opdIncome: number | string;
            medicalTestIncome: number | string;
            expense: number | string;
            profit: number | string;
            balance: number | string;
            incomeGrowth?: number;
            opdIncomeGrowth?: number;
            medicalTestIncomeGrowth?: number;
        };
        medicine: { income: number | string; expense: number | string; profit: number | string; balance: number | string };
        optics: { income: number | string; expense: number | string; profit: number | string; balance: number | string };
        operation: { income: number | string; expense: number | string; profit: number | string; balance: number | string };
    };
    dateRange: {
        start: string;
        end: string;
        period: string;
    };
}

const parseAmount = (amount: number | string): number => {
    const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(parsed) || parsed === null || parsed === undefined ? 0 : parsed;
};

const formatCurrency = (amount: number | string, currency: string = 'BDT') => {
    const numAmount = parseAmount(amount);
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
        .format(numAmount)
        .replace(currency, '৳');
};

const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    trend = null,
    subtitle = null,
}: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    trend?: { value: number; isPositive: boolean } | null;
    subtitle?: string | null;
}) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };

    return (
        <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-gray-900">{value}</p>
                        {trend && (
                            <span
                                className={`flex items-center rounded-full px-2 py-1 text-xs ${
                                    trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {trend.isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

const DateRangeSelector = ({
    currentRange,
    onRangeChange,
}: {
    currentRange: { start: string; end: string; period: string };
    onRangeChange: (period: string, startDate?: string, endDate?: string) => void;
}) => {
    const [showCustom, setShowCustom] = useState(currentRange.period === 'custom');
    const [customStart, setCustomStart] = useState(currentRange.start);
    const [customEnd, setCustomEnd] = useState(currentRange.end);

    const predefinedRanges = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7_days', label: 'Last 7 Days' },
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_year', label: 'This Year' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const handlePeriodChange = (period: string) => {
        if (period === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        onRangeChange(period);
    };

    const handleCustomApply = () => {
        onRangeChange('custom', customStart, customEnd);
    };

    return (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Date Range Filter</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        {predefinedRanges.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => handlePeriodChange(range.value)}
                                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                    currentRange.period === range.value
                                        ? 'border border-blue-300 bg-blue-100 text-blue-700'
                                        : 'border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {showCustom && (
                        <div className="ml-4 flex items-center gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            />
                            <button
                                onClick={handleCustomApply}
                                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Selected Range:</span> {new Date(currentRange.start).toLocaleDateString('en-BD')} -{' '}
                {new Date(currentRange.end).toLocaleDateString('en-BD')}
            </div>
        </div>
    );
};

const AlertCard = ({
    title,
    alerts,
    color = 'red',
}: {
    title: string;
    alerts: Array<{ label: string; count: number; color?: string }>;
    color?: string;
}) => {
    const totalAlerts = alerts.reduce((sum, alert) => sum + (alert.count || 0), 0);

    if (totalAlerts === 0) return null;

    return (
        <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                    {totalAlerts} alert{totalAlerts > 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-2">
                {alerts.map(
                    (alert, index) =>
                        (alert.count || 0) > 0 && (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{alert.label}</span>
                                <span className={`font-medium ${alert.color || 'text-red-600'}`}>{alert.count || 0}</span>
                            </div>
                        ),
                )}
            </div>
        </div>
    );
};

const RecentActivityCard = ({
    title,
    items,
    icon: Icon,
    renderItem,
}: {
    title: string;
    items: Array<any>;
    icon: any;
    renderItem: (item: any) => React.ReactNode;
}) => (
    <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
        </div>
        <div className="p-6">
            {items.length > 0 ? (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="py-8 text-center text-gray-500">No recent activities in selected period</p>
            )}
        </div>
    </div>
);

export default function AdminDashboard({
    auth,
    accountBalances,
    hospitalOverview,
    medicineStockInfo,
    opticsStockInfo,
    recentActivities,
    periodReports,
    dateRange,
}: DashboardProps) {
    const handleDateRangeChange = (period: string, startDate?: string, endDate?: string) => {
        const params: any = { period };

        if (period === 'custom' && startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
        }

        router.get('/dashboard', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getGrowthTrend = (growth?: number) => {
        if (growth === undefined) return null;
        return { value: Math.abs(growth), isPositive: growth >= 0 };
    };

    // Safe calculation helpers
    const getTotalIncome = () => {
        return (
            parseAmount(periodReports.hospital.income) +
            parseAmount(periodReports.medicine.income) +
            parseAmount(periodReports.optics.income) +
            parseAmount(periodReports.operation.income)
        );
    };

    const getTotalExpense = () => {
        return (
            parseAmount(periodReports.hospital.expense) +
            parseAmount(periodReports.medicine.expense) +
            parseAmount(periodReports.optics.expense) +
            parseAmount(periodReports.operation.expense)
        );
    };

    const getTotalProfit = () => {
        return (
            parseAmount(periodReports.hospital.profit) +
            parseAmount(periodReports.medicine.profit) +
            parseAmount(periodReports.optics.profit) +
            parseAmount(periodReports.operation.profit)
        );
    };

    return (
        <AdminLayout title="Super Admin Dashboard">
            <Head title="Super Admin Dashboard" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Date Range Selector */}
                    <DateRangeSelector currentRange={dateRange} onRangeChange={handleDateRangeChange} />

                    {/* Account Balance Section - Hospital Only */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                        <StatCard
                            title="Hospital Account Balance"
                            value={formatCurrency(accountBalances.hospital.balance)}
                            icon={Wallet}
                            color="blue"
                            subtitle={`Last updated: ${new Date(accountBalances.hospital.lastUpdated).toLocaleString('en-BD')}`}
                        />
                    </div>

                    {/* Period Reports */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Eye className="h-5 w-5 text-blue-600" />
                                Hospital - Selected Period
                                {periodReports.hospital.incomeGrowth !== undefined && (
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs ${
                                            periodReports.hospital.incomeGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {periodReports.hospital.incomeGrowth >= 0 ? '+' : ''}
                                        {periodReports.hospital.incomeGrowth}%
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Total Income</span>
                                    <span className="font-semibold text-green-600">+{formatCurrency(periodReports.hospital.income)}</span>
                                </div>

                                {/* OPD Income */}
                                <div className="flex items-center justify-between border-l-2 border-blue-200 pl-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-500">OPD Income</span>
                                        {periodReports.hospital.opdIncomeGrowth !== undefined && (
                                            <span
                                                className={`text-xs ${periodReports.hospital.opdIncomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {periodReports.hospital.opdIncomeGrowth >= 0 ? '↑' : '↓'}{' '}
                                                {Math.abs(periodReports.hospital.opdIncomeGrowth)}%
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-green-600">+{formatCurrency(periodReports.hospital.opdIncome)}</span>
                                </div>

                                {/* Medical Test Income */}
                                <div className="flex items-center justify-between border-l-2 border-purple-200 pl-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-500">Medical Test</span>
                                        {periodReports.hospital.medicalTestIncomeGrowth !== undefined && (
                                            <span
                                                className={`text-xs ${periodReports.hospital.medicalTestIncomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {periodReports.hospital.medicalTestIncomeGrowth >= 0 ? '↑' : '↓'}{' '}
                                                {Math.abs(periodReports.hospital.medicalTestIncomeGrowth)}%
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-green-600">
                                        +{formatCurrency(periodReports.hospital.medicalTestIncome)}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-600">Expense</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(periodReports.hospital.expense)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold text-gray-900">Profit</span>
                                    <span
                                        className={`font-bold ${parseAmount(periodReports.hospital.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(periodReports.hospital.profit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Pill className="h-5 w-5 text-green-600" />
                                Medicine - Selected Period
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Income</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(periodReports.medicine.income)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expense</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(periodReports.medicine.expense)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold text-gray-900">Profit</span>
                                    <span
                                        className={`font-bold ${parseAmount(periodReports.medicine.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(periodReports.medicine.profit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Glasses className="h-5 w-5 text-yellow-600" />
                                Optics - Selected Period
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Income</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(periodReports.optics.income)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expense</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(periodReports.optics.expense)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold text-gray-900">Profit</span>
                                    <span
                                        className={`font-bold ${parseAmount(periodReports.optics.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(periodReports.optics.profit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                <Activity className="h-5 w-5 text-purple-600" />
                                Operation - Selected Period
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Income</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(periodReports.operation.income)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expense</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(periodReports.operation.expense)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold text-gray-900">Profit</span>
                                    <span
                                        className={`font-bold ${parseAmount(periodReports.operation.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(periodReports.operation.profit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hospital Overview */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b px-6 py-4">
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Hospital Overview - Selected Period
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                                <StatCard
                                    title="Total Patients"
                                    value={(hospitalOverview.patients.total || 0).toLocaleString()}
                                    icon={Users}
                                    color="blue"
                                    trend={getGrowthTrend(hospitalOverview.patients.growth)}
                                    subtitle={`${hospitalOverview.patients.today || 0} today`}
                                />
                                <StatCard
                                    title="Patient Visits"
                                    value={(hospitalOverview.visits.total || 0).toLocaleString()}
                                    icon={Calendar}
                                    color="green"
                                    trend={getGrowthTrend(hospitalOverview.visits.growth)}
                                    subtitle={`${hospitalOverview.visits.today || 0} today, ${hospitalOverview.visits.active || 0} active`}
                                />
                                <StatCard
                                    title="Appointments"
                                    value={(hospitalOverview.appointments.total || 0).toLocaleString()}
                                    icon={Clock}
                                    color="yellow"
                                    trend={getGrowthTrend(hospitalOverview.appointments.growth)}
                                    subtitle={`${hospitalOverview.appointments.pending || 0} pending, ${hospitalOverview.appointments.completed || 0} completed`}
                                />
                                <StatCard
                                    title="Doctors"
                                    value={hospitalOverview.doctors.total || 0}
                                    icon={User}
                                    color="purple"
                                    subtitle={`${hospitalOverview.doctors.available || 0} available`}
                                />
                                <StatCard
                                    title="Prescriptions"
                                    value={(hospitalOverview.prescriptions.total || 0).toLocaleString()}
                                    icon={FileText}
                                    color="indigo"
                                    trend={getGrowthTrend(hospitalOverview.prescriptions.growth)}
                                    subtitle={`${hospitalOverview.prescriptions.today || 0} today`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medicine Stock Information */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b px-6 py-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                                        <Pill className="h-5 w-5 text-green-600" />
                                        Medicine Stock Overview
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <StatCard
                                            title="Total Medicines"
                                            value={medicineStockInfo.overview.totalMedicines || 0}
                                            icon={Package}
                                            color="green"
                                            subtitle={`${medicineStockInfo.overview.activeMedicines || 0} active`}
                                        />
                                        <StatCard
                                            title="Stock Value"
                                            value={formatCurrency(medicineStockInfo.overview.totalStockValue)}
                                            icon={DollarSign}
                                            color="blue"
                                        />
                                        <StatCard
                                            title="Period Sales"
                                            value={formatCurrency(medicineStockInfo.periodStats.totalSales)}
                                            icon={TrendingUp}
                                            color="purple"
                                            trend={getGrowthTrend(medicineStockInfo.periodStats.salesGrowth)}
                                            subtitle={`Profit: ${formatCurrency(medicineStockInfo.periodStats.totalProfit)}`}
                                        />
                                    </div>

                                    {/* Top Selling Medicines */}
                                    <div className="mt-6">
                                        <h4 className="mb-3 font-medium text-gray-900">Top Selling Medicines (Selected Period)</h4>
                                        <div className="space-y-2">
                                            {medicineStockInfo.topSelling.length > 0 ? (
                                                medicineStockInfo.topSelling.map((medicine, index) => (
                                                    <div key={index} className="flex items-center justify-between border-b border-gray-100 py-2">
                                                        <div>
                                                            <span className="font-medium text-gray-900">{medicine.name}</span>
                                                            <span className="ml-2 text-sm text-gray-500">{medicine.total_sold} units sold</span>
                                                        </div>
                                                        <span className="font-medium text-green-600">{formatCurrency(medicine.total_revenue)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="py-4 text-center text-gray-500">No sales in selected period</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <AlertCard
                                title="Medicine Alerts"
                                alerts={[
                                    { label: 'Low Stock Items', count: medicineStockInfo.alerts.lowStock || 0, color: 'text-yellow-600' },
                                    { label: 'Expired Stock', count: medicineStockInfo.alerts.expired || 0, color: 'text-red-600' },
                                    { label: 'Expiring Soon', count: medicineStockInfo.alerts.expiring || 0, color: 'text-orange-600' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Optics Stock Information */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b px-6 py-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                                        <Glasses className="h-5 w-5 text-yellow-600" />
                                        Optics Stock Overview
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <h4 className="mb-3 flex items-center justify-between font-medium text-gray-900">
                                                Frames
                                                {opticsStockInfo.periodStats.prescriptionGlassesGrowth !== undefined && (
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs ${
                                                            opticsStockInfo.periodStats.prescriptionGlassesGrowth >= 0
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {opticsStockInfo.periodStats.prescriptionGlassesGrowth >= 0 ? '+' : ''}
                                                        {opticsStockInfo.periodStats.prescriptionGlassesGrowth}%
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-medium">{opticsStockInfo.frames.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Active:</span>
                                                    <span className="font-medium">{opticsStockInfo.frames.active || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Value:</span>
                                                    <span className="font-medium">{formatCurrency(opticsStockInfo.frames.totalValue)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Low Stock:</span>
                                                    <span className="font-medium text-red-600">{opticsStockInfo.frames.lowStock || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <h4 className="mb-3 font-medium text-gray-900">Lenses</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-medium">{opticsStockInfo.lenses.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Active:</span>
                                                    <span className="font-medium">{opticsStockInfo.lenses.active || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Value:</span>
                                                    <span className="font-medium">{formatCurrency(opticsStockInfo.lenses.totalValue)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Low Stock:</span>
                                                    <span className="font-medium text-red-600">{opticsStockInfo.lenses.lowStock || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-4">
                                            <h4 className="mb-3 font-medium text-gray-900">Complete Glasses</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-medium">{opticsStockInfo.completeGlasses.total || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Active:</span>
                                                    <span className="font-medium">{opticsStockInfo.completeGlasses.active || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Value:</span>
                                                    <span className="font-medium">{formatCurrency(opticsStockInfo.completeGlasses.totalValue)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Low Stock:</span>
                                                    <span className="font-medium text-red-600">{opticsStockInfo.completeGlasses.lowStock || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Period Stats */}
                                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                        <h4 className="mb-3 font-medium text-gray-900">Selected Period Statistics</h4>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Prescription Glasses:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{opticsStockInfo.periodStats.prescriptionGlasses || 0}</span>
                                                    {opticsStockInfo.periodStats.prescriptionGlassesGrowth !== undefined && (
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs ${
                                                                opticsStockInfo.periodStats.prescriptionGlassesGrowth >= 0
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}
                                                        >
                                                            {opticsStockInfo.periodStats.prescriptionGlassesGrowth >= 0 ? '+' : ''}
                                                            {opticsStockInfo.periodStats.prescriptionGlassesGrowth}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Selling Frames */}
                                    <div className="mt-6">
                                        <h4 className="mb-3 font-medium text-gray-900">Top Selling Frames (Selected Period)</h4>
                                        <div className="space-y-2">
                                            {opticsStockInfo.topSellingFrames.length > 0 ? (
                                                opticsStockInfo.topSellingFrames.map((frame, index) => (
                                                    <div key={index} className="flex items-center justify-between border-b border-gray-100 py-2">
                                                        <div>
                                                            <span className="font-medium text-gray-900">
                                                                {frame.brand} {frame.model}
                                                            </span>
                                                            <span className="ml-2 text-sm text-gray-500">
                                                                {frame.prescription_glasses_count || 0} sold
                                                            </span>
                                                        </div>
                                                        <span className="font-medium text-green-600">{formatCurrency(frame.selling_price)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="py-4 text-center text-gray-500">No frame sales in selected period</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <AlertCard
                                title="Optics Alerts"
                                alerts={[
                                    { label: 'Frames Low Stock', count: opticsStockInfo.alerts.framesLowStock || 0, color: 'text-yellow-600' },
                                    { label: 'Lenses Low Stock', count: opticsStockInfo.alerts.lensesLowStock || 0, color: 'text-orange-600' },
                                    {
                                        label: 'Complete Glasses Low Stock',
                                        count: opticsStockInfo.alerts.completeGlassesLowStock || 0,
                                        color: 'text-red-600',
                                    },
                                ]}
                            />

                            <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
                                <h4 className="mb-3 font-medium text-gray-900">Total Optics Stock Value</h4>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600">{formatCurrency(opticsStockInfo.totalStockValue)}</div>
                                    <div className="mt-1 text-sm text-gray-500">Combined value of all optics inventory</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <RecentActivityCard
                            title="Recent Patients"
                            items={recentActivities.recentPatients || []}
                            icon={Users}
                            renderItem={(patient) => (
                                <>
                                    <div>
                                        <div className="font-medium text-gray-900">{patient.name}</div>
                                        <div className="text-sm text-gray-500">
                                            ID: {patient.patient_id} • {patient.phone}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">{new Date(patient.created_at).toLocaleDateString()}</div>
                                    </div>
                                </>
                            )}
                        />

                        <RecentActivityCard
                            title="Recent Visits"
                            items={recentActivities.recentVisits || []}
                            icon={Calendar}
                            renderItem={(visit) => (
                                <>
                                    <div>
                                        <div className="font-medium text-gray-900">Visit #{visit.visit_id}</div>
                                        <div className="text-sm text-gray-500">
                                            {visit.patient?.name} • Dr. {visit.selected_doctor?.user?.name}
                                        </div>
                                        <span
                                            className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                                                visit.overall_status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : visit.overall_status === 'prescription'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : visit.overall_status === 'vision_test'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {visit.overall_status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-900">{formatCurrency(visit.final_amount)}</div>
                                        <div className="text-sm text-gray-500">{new Date(visit.created_at).toLocaleDateString()}</div>
                                    </div>
                                </>
                            )}
                        />

                        <RecentActivityCard
                            title="Recent Payments"
                            items={recentActivities.recentPayments || []}
                            icon={CreditCard}
                            renderItem={(payment) => (
                                <>
                                    <div>
                                        <div className="font-medium text-gray-900">{payment.payment_number}</div>
                                        <div className="text-sm text-gray-500">{payment.patient?.name}</div>
                                        <div className="text-sm text-gray-500">By: {payment.received_by?.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-green-600">{formatCurrency(payment.amount)}</div>
                                        <div className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</div>
                                    </div>
                                </>
                            )}
                        />
                    </div>

                    {/* Performance Summary */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 font-semibold text-gray-900">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Performance Summary - Selected Period
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="text-center">
                                <div className="mb-2 text-xl font-bold text-blue-600">{formatCurrency(getTotalIncome())}</div>
                                <div className="text-sm text-gray-600">Total Income</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    H: {formatCurrency(periodReports.hospital.income)} | M: {formatCurrency(periodReports.medicine.income)} | O:{' '}
                                    {formatCurrency(periodReports.optics.income)} | Op: {formatCurrency(periodReports.operation.income)}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="mb-2 text-xl font-bold text-red-600">{formatCurrency(getTotalExpense())}</div>
                                <div className="text-sm text-gray-600">Total Expense</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    H: {formatCurrency(periodReports.hospital.expense)} | M: {formatCurrency(periodReports.medicine.expense)} | O:{' '}
                                    {formatCurrency(periodReports.optics.expense)} | Op: {formatCurrency(periodReports.operation.expense)}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className={`mb-2 text-xl font-bold ${getTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(getTotalProfit())}
                                </div>
                                <div className="text-sm text-gray-600">Total Profit</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    H: {formatCurrency(periodReports.hospital.profit)} | M: {formatCurrency(periodReports.medicine.profit)} | O:{' '}
                                    {formatCurrency(periodReports.optics.profit)} | Op: {formatCurrency(periodReports.operation.profit)}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="mb-2 text-xl font-bold text-purple-600">
                                    {(hospitalOverview.patients.total || 0) +
                                        (hospitalOverview.visits.total || 0) +
                                        (hospitalOverview.prescriptions.total || 0)}
                                </div>
                                <div className="text-sm text-gray-600">Total Activities</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    P: {hospitalOverview.patients.total || 0} | V: {hospitalOverview.visits.total || 0} | Rx:{' '}
                                    {hospitalOverview.prescriptions.total || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                            <Filter className="h-5 w-5 text-gray-600" />
                            Quick Actions
                        </h3>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                            <button
                                onClick={() => router.visit('/patients')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700 transition-colors hover:bg-blue-100"
                            >
                                <Users className="h-5 w-5" />
                                <span className="text-sm font-medium">Patients</span>
                            </button>

                            <button
                                onClick={() => router.visit('/medicine-account')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 transition-colors hover:bg-green-100"
                            >
                                <Pill className="h-5 w-5" />
                                <span className="text-sm font-medium">Medicine</span>
                            </button>

                            <button
                                onClick={() => router.visit('/optics-account')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700 transition-colors hover:bg-yellow-100"
                            >
                                <Glasses className="h-5 w-5" />
                                <span className="text-sm font-medium">Optics</span>
                            </button>

                            <button
                                onClick={() => router.visit('/operation-account')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-700 transition-colors hover:bg-purple-100"
                            >
                                <Scissors className="h-5 w-5" />
                                <span className="text-sm font-medium">Operations</span>
                            </button>

                            <button
                                onClick={() => router.visit('/main-account')}
                                className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                                <Wallet className="h-5 w-5" />
                                <span className="text-sm font-medium">Main Account</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
