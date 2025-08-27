import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  Wallet
} from 'lucide-react';

interface MainAccountLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainAccountLayout: React.FC<MainAccountLayoutProps> = ({
  children,
  title = "Main Account"
}) => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/main-account',
      icon: BarChart3,
      current: route().current('main-account.index') || route().current('main-account.dashboard')
    },
    {
      name: 'Bank Report',
      href: '/main-account/bank-report',
      icon: Building2,
      current: route().current('main-account.bank-report*')
    },
    {
      name: 'Receipt & Payment',
      href: '/main-account/receipt-payment',
      icon: Receipt,
      current: route().current('main-account.receipt-payment*')
    },
    {
      name: 'Income Expenditure',
      href: '/main-account/income-expenditure',
      icon: TrendingUp,
      current: route().current('main-account.income-expenditure*')
    },
    {
      name: 'Balance Sheet',
      href: '/main-account/balance-sheet',
      icon: Wallet,
      current: route().current('main-account.balance-sheet*')
    },
    {
      name: 'Voucher Reports',
      href: '/main-account/reports',
      icon: TrendingDown,
      current: route().current('main-account.reports*')
    }
  ];

  return (
    <AdminLayout title={title}>
      <div className="flex h-full bg-gray-50">
        {/* Main Account Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4 border-b bg-indigo-50">
            <h2 className="text-lg font-bold text-indigo-900">Main Account</h2>
            <p className="text-sm text-indigo-700">Central Financial System</p>
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
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
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
                Main Financial Control Center
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MainAccountLayout;
