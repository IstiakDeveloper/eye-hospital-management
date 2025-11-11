import React from 'react';
import AdminLayout from '@/layouts/admin-layout'; // Main admin layout import
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  FileText,
  History,
  Tags,
  TrendingUp
} from 'lucide-react';

interface HospitalAccountLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const HospitalAccountLayout: React.FC<HospitalAccountLayoutProps> = ({
  children,
  title = "Hospital Account"
}) => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/hospital-account',
      icon: BarChart3,
      current: route().current('hospital-account.dashboard')
    },
    {
      name: 'Transactions',
      href: '/hospital-account/transactions',
      icon: FileText,
      current: route().current('hospital-account.transactions')
    },
    {
      name: 'Fund History',
      href: '/hospital-account/fund-history',
      icon: History,
      current: route().current('hospital-account.fund-history')
    },
    {
      name: 'Categories',
      href: '/hospital-account/categories',
      icon: Tags,
      current: route().current('hospital-account.categories')
    },
    {
      name: 'Monthly Report',
      href: '/hospital-account/monthly-report',
      icon: TrendingUp,
      current: route().current('hospital-account.monthly-report')
    },
    {
      name: 'Balance Sheet',
      href: '/hospital-account/balance-sheet',
      icon: FileText,
      current: route().current('hospital-account.balance-sheet')
    },
    // Only Hospital Account Reports
    {
      name: 'Daily Statement',
      href: '/hospital-account/reports/daily-statement',
      icon: FileText,
      current: route().current('reports.daily-statement')
    },
    {
      name: 'Account Statement',
      href: '/hospital-account/reports/account-statement',
      icon: FileText,
      current: route().current('reports.account-statement')
    },
  ];

  return (
    <AdminLayout title={title}>
      <div className="flex h-full bg-gray-50">
        {/* Hospital Account Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4 border-b bg-blue-50">
            <h2 className="text-lg font-bold text-blue-900">Hospital Account</h2>
            <p className="text-sm text-blue-700">Financial Management</p>
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
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
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
                Hospital Financial System
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HospitalAccountLayout;
