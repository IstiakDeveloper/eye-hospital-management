import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  FileText,
  History,
  TrendingUp,
  PieChart,
  Scissors,
  Activity
} from 'lucide-react';

interface OperationAccountLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const OperationAccountLayout: React.FC<OperationAccountLayoutProps> = ({
  children,
  title = "Operation Account"
}) => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/operation-account',
      icon: BarChart3,
      current: route().current('operation-account.dashboard')
    },
    {
      name: 'Transactions',
      href: '/operation-account/transactions',
      icon: FileText,
      current: route().current('operation-account.transactions')
    },
    {
      name: 'Fund History',
      href: '/operation-account/fund-history',
      icon: History,
      current: route().current('operation-account.fund-history')
    },
    {
      name: 'Monthly Report',
      href: '/operation-account/monthly-report',
      icon: TrendingUp,
      current: route().current('operation-account.monthly-report')
    },
    {
      name: 'Balance Sheet',
      href: '/operation-account/balance-sheet',
      icon: FileText,
      current: route().current('operation-account.balance-sheet')
    },
    {
      name: 'Analytics',
      href: '/operation-account/analytics',
      icon: PieChart,
      current: route().current('operation-account.analytics')
    },
    // Only Operation Account Reports
    {
      name: 'Daily Statement',
      href: '/operation-account/reports/daily-statement',
      icon: FileText,
      current: route().current('operation-account.reports.daily-statement')
    },
    {
      name: 'Account Statement',
      href: '/operation-account/reports/account-statement',
      icon: FileText,
      current: route().current('operation-account.reports.account-statement')
    },
  ];

  return (
    <AdminLayout title={title}>
      <div className="flex h-full bg-gray-50">
        {/* Operation Account Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4 border-b bg-purple-50">
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-purple-900">Operation Account</h2>
            </div>
            <p className="text-sm text-purple-700">Surgery Finance</p>
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
                      ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <div className="text-sm text-gray-500">
                Operation Financial System
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OperationAccountLayout;
