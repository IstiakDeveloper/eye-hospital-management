import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    FileText,
    History,
    Tags,
    TrendingUp,
    Package,
    Users,
    BookOpen
} from 'lucide-react';

interface PageProps {
    [key: string]: any;
    auth: {
        user: {
            name: string;
            email: string;
            role: {
                name: string;
            };
            permissions?: string[];
        };
    };
}

interface HospitalAccountLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const HospitalAccountLayout: React.FC<HospitalAccountLayoutProps> = ({
    children,
    title = "Hospital Account"
}) => {
    const { auth } = usePage<PageProps>().props;
    const userPermissions = auth.user.permissions || [];

    // Permission check helper
    const hasPermission = (permission: string): boolean => {
        // Super Admin has all permissions (indicated by wildcard)
        if (userPermissions.includes('*')) return true;
        return userPermissions.includes(permission);
    };

    const allNavigation = [
        {
            name: 'Dashboard',
            href: '/hospital-account',
            icon: BarChart3,
            current: route().current('hospital-account.dashboard'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Transactions',
            href: '/hospital-account/transactions',
            icon: FileText,
            current: route().current('hospital-account.transactions'),
            permission: 'hospital-account.transactions'
        },
        {
            name: 'Fund History',
            href: '/hospital-account/fund-history',
            icon: History,
            current: route().current('hospital-account.fund-history'),
            permission: 'hospital-account.fund-history'
        },
        {
            name: 'Fund Ledger',
            href: '/hospital-account/fund-ledger',
            icon: BookOpen,
            current: route().current('hospital-account.fund-ledger'),
            permission: 'hospital-account.view'
        },
        {
            name: 'House Security Ledger',
            href: '/hospital-account/house-security-ledger',
            icon: BookOpen,
            current: route().current('hospital-account.house-security-ledger'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Categories',
            href: '/hospital-account/categories',
            icon: Tags,
            current: route().current('hospital-account.categories'),
            permission: 'hospital-account.categories'
        },
        {
            name: 'Fixed Assets',
            href: '/hospital-account/fixed-assets',
            icon: Package,
            current: route().current('hospital-account.fixed-assets.*'),
            permission: 'hospital-account.fixed-assets'
        },
        {
            name: 'Asset Vendors',
            href: '/hospital-account/fixed-asset-vendors',
            icon: Users,
            current: route().current('hospital-account.fixed-asset-vendors.*'),
            permission: 'hospital-account.fixed-asset-vendors'
        },
        {
            name: 'Advance House Rent',
            href: '/hospital-account/advance-rent',
            icon: BookOpen,
            current: route().current('hospital-account.advance-rent*'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Fixed Asset Vendor Due',
            href: '/hospital-account/vendor-due-ledger/fixed-asset',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.fixed-asset'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Medicine Vendor Due',
            href: '/hospital-account/vendor-due-ledger/medicine',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.medicine'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Optics Vendor Due',
            href: '/hospital-account/vendor-due-ledger/optics',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.optics'),
            permission: 'hospital-account.view'
        },
        {
            name: 'Daily Statement',
            href: '/hospital-account/reports/daily-statement',
            icon: FileText,
            current: route().current('reports.daily-statement'),
            permission: 'hospital.reports.daily-statement'
        },
        {
            name: 'Account Statement',
            href: '/hospital-account/reports/account-statement',
            icon: FileText,
            current: route().current('reports.account-statement'),
            permission: 'hospital.reports.account-statement'
        },
    ];

    // Filter navigation based on permissions
    const navigation = allNavigation.filter(item => hasPermission(item.permission));

    return (
        <AdminLayout title={title}>
            <div className="bg-gray-50 min-h-screen">
                {/* Horizontal Tab Navigation */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-6">
                        <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${item.current
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </AdminLayout>
    );
};

export default HospitalAccountLayout;
