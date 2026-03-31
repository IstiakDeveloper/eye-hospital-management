import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import { BarChart3, FileText, History, Package, PieChart, Tags, TrendingUp } from 'lucide-react';
import React from 'react';

interface OpticsAccountLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const OpticsAccountLayout: React.FC<OpticsAccountLayoutProps> = ({ children, title = 'Optics Account' }) => {
    const navigation = [
        {
            name: 'Dashboard',
            href: '/optics-account',
            icon: BarChart3,
            current: route().current('optics-account.dashboard'),
        },
        {
            name: 'Transactions',
            href: '/optics-account/transactions',
            icon: FileText,
            current: route().current('optics-account.transactions'),
        },
        {
            name: 'Fund History',
            href: '/optics-account/fund-history',
            icon: History,
            current: route().current('optics-account.fund-history'),
        },
        {
            name: 'Categories',
            href: '/optics-account/categories',
            icon: Tags,
            current: route().current('optics-account.categories'),
        },
        {
            name: 'Monthly Report',
            href: '/optics-account/monthly-report',
            icon: TrendingUp,
            current: route().current('optics-account.monthly-report'),
        },
        {
            name: 'Balance Sheet',
            href: '/optics-account/balance-sheet',
            icon: FileText,
            current: route().current('optics-account.balance-sheet'),
        },
        {
            name: 'Analytics',
            href: '/optics-account/analytics',
            icon: PieChart,
            current: route().current('optics-account.analytics'),
        },
        {
            name: 'Inventory Report',
            href: '/optics-account/inventory-report',
            icon: Package,
            current: route().current('optics-account.inventory-report'),
        },
        // Only Optics Account Reports
        {
            name: 'Daily Statement',
            href: '/optics/reports/daily-statement',
            icon: FileText,
            current: route().current('optics.reports.daily-statement'),
        },
        {
            name: 'Account Statement',
            href: '/optics/reports/account-statement',
            icon: FileText,
            current: route().current('optics.reports.account-statement'),
        },
        {
            name: 'Buy/Sale/Stock',
            href: '/reports/buy-sale-stock',
            icon: FileText,
            current: route().current('reports.buy-sale-stock'),
        },
    ];

    return (
        <AdminLayout title={title}>
            <div className="flex h-full bg-gray-50">
                {/* Optics Account Sidebar */}
                <div className="w-64 border-r bg-white shadow-sm">
                    <div className="border-b bg-purple-50 p-4">
                        <h2 className="text-lg font-bold text-purple-900">Optics Account</h2>
                        <p className="text-sm text-purple-700">Glasses & Lens Management</p>
                    </div>
                    <nav className="mt-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                                        item.current
                                            ? 'border-r-2 border-purple-700 bg-purple-50 text-purple-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="mr-3 h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            <div className="text-sm text-gray-500">Optics Financial System</div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default OpticsAccountLayout;
