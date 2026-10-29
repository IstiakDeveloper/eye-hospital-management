import AdminLayout from '@/layouts/admin-layout';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, BookOpen, FileText, History, Package, Receipt, Tags, Users } from 'lucide-react';
import React from 'react';

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

const HospitalAccountLayout: React.FC<HospitalAccountLayoutProps> = ({ children, title = 'Hospital Account' }) => {
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
            permission: 'hospital-account.view',
        },
        {
            name: 'Transactions',
            href: '/hospital-account/transactions',
            icon: FileText,
            current: route().current('hospital-account.transactions'),
            permission: 'hospital-account.transactions',
        },
        {
            name: 'Fund History',
            href: '/hospital-account/fund-history',
            icon: History,
            current: route().current('hospital-account.fund-history'),
            permission: 'hospital-account.fund-history',
        },
        {
            name: 'Fund Ledger',
            href: '/hospital-account/fund-ledger',
            icon: BookOpen,
            current: route().current('hospital-account.fund-ledger'),
            permission: 'hospital-account.view',
        },
        {
            name: 'House Security Ledger',
            href: '/hospital-account/house-security-ledger',
            icon: BookOpen,
            current: route().current('hospital-account.house-security-ledger'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Categories',
            href: '/hospital-account/categories',
            icon: Tags,
            current: route().current('hospital-account.categories'),
            permission: 'hospital-account.categories',
        },
        {
            name: 'Due Expense',
            href: '/hospital-account/due-expenses',
            icon: Receipt,
            current: route().current('hospital-account.due-expenses.*'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Due Expense Ledger',
            href: '/hospital-account/vendor-due-ledger/due-expense',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.due-expense'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Fixed Assets',
            href: '/hospital-account/fixed-assets',
            icon: Package,
            current: Boolean(route().current('hospital-account.fixed-assets.*') && !route().current('hospital-account.fixed-assets.ledger')),
            permission: 'hospital-account.fixed-assets',
        },
        {
            name: 'Fixed Asset Ledger',
            href: '/hospital-account/fixed-assets/ledger',
            icon: BookOpen,
            current: Boolean(route().current('hospital-account.fixed-assets.ledger')),
            permission: 'hospital-account.fixed-assets',
        },
        {
            name: 'Asset Vendors',
            href: '/hospital-account/fixed-asset-vendors',
            icon: Users,
            current: route().current('hospital-account.fixed-asset-vendors.*'),
            permission: 'hospital-account.fixed-asset-vendors',
        },
        {
            name: 'Advance House Rent',
            href: '/hospital-account/advance-rent',
            icon: BookOpen,
            current: route().current('hospital-account.advance-rent*'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Fixed Asset Vendor Due',
            href: '/hospital-account/vendor-due-ledger/fixed-asset',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.fixed-asset'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Medicine Vendor Due',
            href: '/hospital-account/vendor-due-ledger/medicine',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.medicine'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Optics Vendor Due',
            href: '/hospital-account/vendor-due-ledger/optics',
            icon: FileText,
            current: route().current('hospital-account.vendor-due-ledger.optics'),
            permission: 'hospital-account.view',
        },
        {
            name: 'Daily Statement',
            href: '/hospital-account/reports/daily-statement',
            icon: FileText,
            current: route().current('reports.daily-statement'),
            permission: 'hospital.reports.daily-statement',
        },
        {
            name: 'Account Statement',
            href: '/hospital-account/reports/account-statement',
            icon: FileText,
            current: route().current('reports.account-statement'),
            permission: 'hospital.reports.account-statement',
        },
    ];

    // Filter navigation based on permissions
    const navigation = allNavigation.filter((item) => hasPermission(item.permission));

    return (
        <AdminLayout title={title}>
            <div>
                <div className="overflow-x-auto border-b border-slate-200 bg-white">
                    <div className="flex min-w-max items-center px-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-[12px] font-medium whitespace-nowrap ${
                                        item.current ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4">{children}</div>
            </div>
        </AdminLayout>
    );
};

export default HospitalAccountLayout;
