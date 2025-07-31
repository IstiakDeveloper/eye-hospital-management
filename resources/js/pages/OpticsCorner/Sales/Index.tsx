import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Search } from 'lucide-react';

interface Sale {
  id: number;
  transaction_no: string;
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  created_by: {
    name: string;
  };
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }: any) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
);

export default function SalesIndex({ sales }: { sales: any }) {
  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <AdminLayout>
      <Head title="Sales Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
            <p className="text-gray-600">Track all your sales transactions</p>
          </div>
          <Link href="/optics/sales/create">
            <Button>
              <Plus className="w-4 h-4" />
              <span>New Sale</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Search by customer or transaction..."
            />
            <Input
              type="date"
              placeholder="From Date"
            />
            <Input
              type="date"
              placeholder="To Date"
            />
            <Button variant="secondary">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.data.map((sale: Sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{sale.transaction_no}</p>
                        <p className="text-sm text-gray-500">{sale.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{sale.description.split(' - ')[1]?.split(' | ')[0] || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(sale.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(sale.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sale.created_by.name}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="secondary" className="text-xs">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {sales.links && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {sales.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : link.url
                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
