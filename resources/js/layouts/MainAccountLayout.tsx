import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Link, usePage } from '@inertiajs/react';
import {
  FileText,
  TrendingUp,
  Receipt,
  Wallet,
  Eye,
  Pill,
  Activity,
  TestTube
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

interface MainAccountLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainAccountLayout: React.FC<MainAccountLayoutProps> = ({
  children,
  title = "Reports"
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
      name: 'Medicine Buy Sale Stock',
      href: '/medicine/reports/buy-sale-stock',
      icon: Pill,
      current: route().current('medicine.reports.buy-sale-stock'),
      permission: 'medicine.reports.buy-sale-stock'
    },
    {
      name: 'Optics Buy Sale Stock',
      href: '/optics/reports/buy-sale-stock',
      icon: Eye,
      current: route().current('optics.reports.buy-sale-stock'),
      permission: 'optics.reports.buy-sale-stock'
    },
    {
      name: 'Medical Test Income',
      href: '/hospital-account/reports/medical-test-income',
      icon: TestTube,
      current: route().current('reports.medical-test-income'),
      permission: 'hospital.reports.medical-test-income'
    },
    {
      name: 'Operation Income',
      href: '/operation-account/reports/operation-income',
      icon: Activity,
      current: route().current('operation-account.reports.operation-income'),
      permission: 'operation.reports.income'
    },
    {
      name: 'Receipt & Payment',
      href: '/reports/receipt-payment',
      icon: Receipt,
      current: route().current('reports.receipt-payment'),
      permission: 'reports.receipt-payment'
    },
    {
      name: 'Income & Expenditure',
      href: '/reports/income-expenditure',
      icon: TrendingUp,
      current: route().current('reports.income-expenditure'),
      permission: 'reports.income-expenditure'
    },
    {
      name: 'Balance Sheet',
      href: '/reports/balance-sheet',
      icon: Wallet,
      current: route().current('reports.balance-sheet'),
      permission: 'reports.balance-sheet'
    }
  ];

  // Filter navigation based on permissions
  const navigation = allNavigation.filter(item => hasPermission(item.permission));

  return (
    <AdminLayout title={title}>
      <div className="bg-gray-50 min-h-screen">
        {/* Horizontal Tab Navigation */}
        <div className="bg-white border-b border-gray-200 shadow-sm no-print">
          <div className="px-6">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      item.current
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
        <main>
          {children}
        </main>
      </div>

      {/* Print Styles for Layout */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default MainAccountLayout;
