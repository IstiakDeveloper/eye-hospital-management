import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  FileText,
  History,
  Tags,
  TrendingUp,
  ShoppingCart,
  PieChart,
  Package
} from 'lucide-react';

interface MedicineAccountLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MedicineAccountLayout: React.FC<MedicineAccountLayoutProps> = ({
  children,
  title = "Medicine Account"
}) => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/medicine-account',
      icon: BarChart3,
      current: route().current('medicine-account.dashboard')
    },
    {
      name: 'Transactions',
      href: '/medicine-account/transactions',
      icon: FileText,
      current: route().current('medicine-account.transactions')
    },
    {
      name: 'Fund History',
      href: '/medicine-account/fund-history',
      icon: History,
      current: route().current('medicine-account.fund-history')
    },
    {
      name: 'Categories',
      href: '/medicine-account/categories',
      icon: Tags,
      current: route().current('medicine-account.categories')
    },
    {
      name: 'Monthly Report',
      href: '/medicine-account/monthly-report',
      icon: TrendingUp,
      current: route().current('medicine-account.monthly-report')
    },
    {
      name: 'Balance Sheet',
      href: '/medicine-account/balance-sheet',
      icon: FileText,
      current: route().current('medicine-account.balance-sheet')
    },
    {
      name: 'Analytics',
      href: '/medicine-account/analytics',
      icon: PieChart,
      current: route().current('medicine-account.analytics')
    },
    {
      name: 'Stock Value Report',
      href: '/medicine-account/stock-value-report',
      icon: Package,
      current: route().current('medicine-account.stock-value-report')
    },
    // Only Medicine Account Reports
    {
      name: 'Daily Statement',
      href: '/medicine/reports/daily-statement',
      icon: FileText,
      current: route().current('medicine.reports.daily-statement')
    },
    {
      name: 'Account Statement',
      href: '/medicine/reports/account-statement',
      icon: FileText,
      current: route().current('medicine.reports.account-statement')
    },
    {
      name: 'Buy/Sale/Stock',
      href: '/medicine/reports/buy-sale-stock',
      icon: FileText,
      current: route().current('medicine.reports.buy-sale-stock')
    },
    {
      name: 'Company Stock Summary',
      href: '/medicine/reports/company-stock',
      icon: FileText,
      current: route().current('medicine.reports.company-stock')
    },
    {
      name: 'Company Medicine Stock',
      href: '/medicine/reports/company-medicine-stock',
      icon: FileText,
      current: route().current('medicine.reports.company-medicine-stock')
    },
  ];

  return (
    <AdminLayout title={title}>
      <div className="flex h-full bg-gray-50">
        {/* Medicine Account Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4 border-b bg-green-50">
            <h2 className="text-lg font-bold text-green-900">Medicine Account</h2>
            <p className="text-sm text-green-700">Pharmacy Management</p>
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
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
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
                Medicine Financial System
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MedicineAccountLayout;
