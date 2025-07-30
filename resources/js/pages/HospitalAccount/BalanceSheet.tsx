import React from 'react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface BalanceSheetProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalFundIn: number;
  totalFundOut: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
  balance,
  totalIncome,
  totalExpense,
  totalFundIn,
  totalFundOut
}) => {
  const netProfit = totalIncome - totalExpense;
  const netFund = totalFundIn - totalFundOut;
  const totalAssets = balance;
  const totalEquity = netFund + netProfit;

  return (
    <HospitalAccountLayout title="Balance Sheet">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Hospital Account - Balance Sheet
        </h2>
        <p className="text-gray-600">
          As of {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-blue-600">৳{balance.toLocaleString()}</p>
            </div>
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-green-600">৳{totalAssets.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Equity</p>
              <p className="text-2xl font-bold text-purple-600">৳{totalEquity.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ৳{netProfit.toLocaleString()}
              </p>
            </div>
            {netProfit >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Balance Sheet Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-green-50">
            <h3 className="text-lg font-semibold text-green-800">ASSETS</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Current Assets</h4>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Cash & Bank Balance</span>
                <span className="font-medium">৳{balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>TOTAL ASSETS</span>
                <span className="text-green-600">৳{totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">EQUITY</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Owner's Equity</h4>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Capital (Fund In - Fund Out)</span>
                <span className="font-medium">৳{netFund.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Retained Earnings (Net Profit)</span>
                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>TOTAL EQUITY</span>
                <span className="text-blue-600">৳{totalEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow-sm border mt-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Financial Summary</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income Statement Summary */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Income Statement Summary</h4>

              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="text-green-600 font-medium">৳{totalIncome.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="text-red-600 font-medium">৳{totalExpense.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-2 border-t font-semibold">
                  <span>Net Profit/Loss</span>
                  <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ৳{netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Cash Flow Summary</h4>

              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Total Fund In</span>
                  <span className="text-green-600 font-medium">৳{totalFundIn.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Total Fund Out</span>
                  <span className="text-red-600 font-medium">৳{totalFundOut.toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-2 border-t font-semibold">
                  <span>Net Cash Flow</span>
                  <span className={netFund >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ৳{netFund.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Verification */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h4 className="font-semibold text-blue-900 mb-2">Balance Sheet Equation</h4>
        <p className="text-blue-800">
          Assets = Equity → ৳{totalAssets.toLocaleString()} = ৳{totalEquity.toLocaleString()}
        </p>
        <p className="text-sm text-blue-700 mt-1">
          {totalAssets === totalEquity ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet needs reconciliation'}
        </p>
      </div>
    </HospitalAccountLayout>
  );
};

export default BalanceSheet;
