import React from 'react';
import MedicineAccountLayout from '@/layouts/MedicineAccountLayout';
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart, BarChart3 } from 'lucide-react';

interface BalanceSheetProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalFundIn: number;
  totalFundOut: number;
  totalMedicinePurchases: number;
  totalMedicineSales: number;
  medicineProfit: number;
  currentMonthPurchases: number;
  currentMonthSales: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
  balance,
  totalIncome,
  totalExpense,
  totalFundIn,
  totalFundOut,
  totalMedicinePurchases,
  totalMedicineSales,
  medicineProfit,
  currentMonthPurchases,
  currentMonthSales
}) => {
  // Format amount helper
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  const netProfit = totalIncome - totalExpense;
  const netFund = totalFundIn - totalFundOut;
  const totalAssets = balance;
  const totalEquity = netFund + netProfit;

  // Calculate ROI and other metrics
  const roi = totalFundIn > 0 ? (netProfit / totalFundIn) * 100 : 0;
  const currentMonthProfit = currentMonthSales - currentMonthPurchases;
  const profitMargin = totalMedicineSales > 0 ? (medicineProfit / totalMedicineSales) * 100 : 0;

  return (
    <MedicineAccountLayout title="Balance Sheet">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Medicine Account - Balance Sheet
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(balance)}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(totalAssets)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Equity</p>
              <p className="text-2xl font-bold text-purple-600">{formatAmount(totalEquity)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medicine Profit</p>
              <p className={`text-2xl font-bold ${medicineProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(medicineProfit)}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Balance Sheet Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                <span className="font-medium">{formatAmount(balance)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>TOTAL ASSETS</span>
                <span className="text-green-600">{formatAmount(totalAssets)}</span>
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
                <span className="font-medium">{formatAmount(netFund)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">Retained Earnings (Net Profit)</span>
                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(netProfit)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>TOTAL EQUITY</span>
                <span className="text-blue-600">{formatAmount(totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Business Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Medicine Business Performance */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Medicine Business Analysis</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Total Medicine Sales</span>
                <span className="text-green-600 font-medium">{formatAmount(totalMedicineSales)}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-600">Total Medicine Purchases</span>
                <span className="text-orange-600 font-medium">{formatAmount(totalMedicinePurchases)}</span>
              </div>

              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Medicine Gross Profit</span>
                <span className={medicineProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatAmount(medicineProfit)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-600">Profit Margin</span>
                <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Current Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Monthly Sales</span>
                  <span className="text-green-600 font-medium">{formatAmount(currentMonthSales)}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Monthly Purchases</span>
                  <span className="text-orange-600 font-medium">{formatAmount(currentMonthPurchases)}</span>
                </div>

                <div className="flex justify-between py-2 border-t font-semibold">
                  <span>Monthly Profit</span>
                  <span className={currentMonthProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(currentMonthProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Financial Summary</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Income Statement Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Income Statement Summary</h4>

                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="text-green-600 font-medium">{formatAmount(totalIncome)}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="text-red-600 font-medium">{formatAmount(totalExpense)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-t font-semibold">
                    <span>Net Profit/Loss</span>
                    <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(netProfit)}
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
                    <span className="text-green-600 font-medium">{formatAmount(totalFundIn)}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Total Fund Out</span>
                    <span className="text-red-600 font-medium">{formatAmount(totalFundOut)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-t font-semibold">
                    <span>Net Cash Flow</span>
                    <span className={netFund >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(netFund)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{profitMargin.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Profit Margin</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{roi.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Return on Investment</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalMedicinePurchases > 0 ? (totalMedicineSales / totalMedicinePurchases).toFixed(1) : '0'}x
              </div>
              <div className="text-sm text-gray-600">Sales Multiplier</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalFundIn > 0 ? ((balance / totalFundIn) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-600">Fund Efficiency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Verification */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-2">Balance Sheet Equation</h4>
        <p className="text-green-800">
          Assets = Equity → {formatAmount(totalAssets)} = {formatAmount(totalEquity)}
        </p>
        <p className="text-sm text-green-700 mt-1">
          {totalAssets === totalEquity ? '✓ Balance Sheet is balanced' : '⚠ Balance Sheet needs reconciliation'}
        </p>

        <div className="mt-4 text-sm text-green-700">
          <p><strong>Medicine Business Health:</strong> {profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : profitMargin > 0 ? 'Fair' : 'Needs Improvement'} profit margin of {profitMargin.toFixed(1)}%</p>
        </div>
      </div>
    </MedicineAccountLayout>
  );
};

export default BalanceSheet;
