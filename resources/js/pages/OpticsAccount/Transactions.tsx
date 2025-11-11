import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';

interface Transaction {
  id: number;
  transaction_no: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  expense_category?: {
    name: string;
  };
  created_by?: {
    name: string;
  };
}

interface TransactionsProps {
  transactions: {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  categories: Array<{
    id: number;
    name: string;
  }>;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories }) => {
  const [filter, setFilter] = useState({
    type: '',
    month: '',
    year: '',
    category: ''
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format amount helper
  const formatAmount = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '৳0.00';
    }
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('BDT', '৳');
  };

  const handleFilter = () => {
    router.get('/optics-account/transactions', filter);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'month_year' && value) {
      const [year, month] = value.split('-');
      setFilter({ ...filter, year, month: parseInt(month).toString() });
    } else {
      setFilter({ ...filter, [name]: value });
    }
  };

  return (
    <OpticsAccountLayout title="Transactions">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="income">Income (Sales)</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="month"
            name="month_year"
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="category"
            value={filter.category}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="glasses_sale">Glasses Sales</option>
            <option value="lens_sale">Lens Sales</option>
            <option value="glasses_purchase">Glasses Purchase</option>
            <option value="lens_purchase">Lens Purchase</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleFilter}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Filter
          </button>

          <button
            onClick={() => {
              setFilter({ type: '', month: '', year: '', category: '' });
              router.get('/optics-account/transactions');
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatAmount(Number(transactions.data
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount), 0)
            ))}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Inventory Purchase</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatAmount(transactions.data
              .filter(t => ['glasses_purchase', 'lens_purchase'].includes(t.category))
              .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Other Expenses</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatAmount(transactions.data
              .filter(t => t.type === 'expense' && !['glasses_purchase', 'lens_purchase'].includes(t.category))
              .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-600">Net Amount</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatAmount(Number(transactions.data
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount), 0) -
              transactions.data
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount), 0)
            ))}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            Transactions ({transactions.total} total)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.data.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {transaction.transaction_no}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'income' ? 'Sales' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded ${
                      transaction.category === 'glasses_sale' ? 'bg-green-50 text-green-700' :
                      transaction.category === 'lens_sale' ? 'bg-blue-50 text-blue-700' :
                      transaction.category === 'glasses_purchase' ? 'bg-orange-50 text-orange-700' :
                      transaction.category === 'lens_purchase' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {transaction.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(Number(transaction.amount))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions.last_page > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((transactions.current_page - 1) * transactions.per_page) + 1} to{' '}
                {Math.min(transactions.current_page * transactions.per_page, transactions.total)} of{' '}
                {transactions.total} results
              </div>
              <div className="flex gap-2">
                {transactions.current_page > 1 && (
                  <button
                    onClick={() => router.get('/optics-account/transactions', {
                      ...filter,
                      page: transactions.current_page - 1
                    })}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}

                <span className="px-3 py-1 text-sm">
                  Page {transactions.current_page} of {transactions.last_page}
                </span>

                {transactions.current_page < transactions.last_page && (
                  <button
                    onClick={() => router.get('/optics-account/transactions', {
                      ...filter,
                      page: transactions.current_page + 1
                    })}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OpticsAccountLayout>
  );
};

export default Transactions;
