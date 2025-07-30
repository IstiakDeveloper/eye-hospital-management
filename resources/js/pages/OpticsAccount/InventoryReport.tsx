import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OpticsAccountLayout from '@/layouts/OpticsAccountLayout';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Glasses,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart
} from 'lucide-react';

interface InventoryReportProps {
  accountBalance: number;
  totalInventoryValue: number;
  totalGlassesValue: number;
  totalLensValue: number;
  totalInvestment: number;
  totalSold: number;
}

const InventoryReport: React.FC<InventoryReportProps> = ({
  accountBalance,
  totalInventoryValue,
  totalGlassesValue,
  totalLensValue,
  totalInvestment,
  totalSold
}) => {
  const [refreshing, setRefreshing] = useState(false);

  // Format amount helper
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  // Calculate metrics
  const totalProfit = totalSold - totalInvestment;
  const profitPercentage = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100) : 0;
  const inventoryTurnover = totalInventoryValue > 0 ? (totalSold / totalInventoryValue) : 0;
  const remainingValue = totalInvestment - totalSold;
  const cashFlow = accountBalance + totalInventoryValue;

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    router.reload({
      onFinish: () => setRefreshing(false)
    });
  };

  // Export report
  const handleExport = (format: string) => {
    router.post('/optics-account/export-report', {
      type: 'inventory',
      format: format
    });
  };

  return (
    <OpticsAccountLayout title="Inventory Report">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Inventory Value Report</h2>
          <p className="text-gray-600">Complete overview of your optical inventory and investments</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Account Balance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Balance</p>
              <p className="text-2xl font-bold text-purple-600">{formatAmount(accountBalance)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Inventory Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(totalInventoryValue)}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Total Investment */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Investment</p>
              <p className="text-2xl font-bold text-orange-600">{formatAmount(totalInvestment)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sold</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(totalSold)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white mb-6">
        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-purple-200 text-sm mb-1">Total Profit/Loss</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatAmount(totalProfit)}
            </p>
            <p className="text-purple-200 text-sm mt-1">
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}% ROI
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Cash Flow</p>
            <p className="text-2xl font-bold text-white">
              {formatAmount(cashFlow)}
            </p>
            <p className="text-purple-200 text-sm mt-1">
              Balance + Inventory
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Inventory Turnover</p>
            <p className="text-2xl font-bold text-white">
              {inventoryTurnover.toFixed(2)}x
            </p>
            <p className="text-purple-200 text-sm mt-1">
              Sales / Inventory Value
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Glasses Inventory */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Glasses Inventory</h3>
            <Glasses className="w-5 h-5 text-blue-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Stock Value:</span>
              <span className="font-bold text-blue-600">
                {formatAmount(totalGlassesValue)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage of Total:</span>
              <span className="font-semibold text-gray-900">
                {totalInventoryValue > 0 ? ((totalGlassesValue / totalInventoryValue) * 100).toFixed(1) : 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: totalInventoryValue > 0 ? `${(totalGlassesValue / totalInventoryValue) * 100}%` : '0%'
                }}
              ></div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center text-sm">
                {totalGlassesValue > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-green-600">In Stock</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-yellow-600">Low Stock</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lens Inventory */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lens Inventory</h3>
            <Eye className="w-5 h-5 text-purple-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Stock Value:</span>
              <span className="font-bold text-purple-600">
                {formatAmount(totalLensValue)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage of Total:</span>
              <span className="font-semibold text-gray-900">
                {totalInventoryValue > 0 ? ((totalLensValue / totalInventoryValue) * 100).toFixed(1) : 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{
                  width: totalInventoryValue > 0 ? `${(totalLensValue / totalInventoryValue) * 100}%` : '0%'
                }}
              ></div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center text-sm">
                {totalLensValue > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-green-600">In Stock</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-yellow-600">Low Stock</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Investment Analysis</h3>
          <BarChart3 className="w-5 h-5 text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Invested</p>
            <p className="text-xl font-bold text-red-600">{formatAmount(totalInvestment)}</p>
            <p className="text-xs text-gray-500 mt-1">Purchase Cost</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Sold</p>
            <p className="text-xl font-bold text-green-600">{formatAmount(totalSold)}</p>
            <p className="text-xs text-gray-500 mt-1">Revenue Generated</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Remaining Investment</p>
            <p className="text-xl font-bold text-orange-600">{formatAmount(remainingValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Unsold Stock Cost</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Net Profit</p>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(totalProfit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}% ROI
            </p>
          </div>
        </div>

        {/* Investment Performance Indicators */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                profitPercentage >= 20 ? 'bg-green-500' :
                profitPercentage >= 10 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <p className="text-xs text-gray-600">ROI Status</p>
              <p className="text-sm font-semibold">
                {profitPercentage >= 20 ? 'Excellent' :
                 profitPercentage >= 10 ? 'Good' :
                 profitPercentage >= 0 ? 'Fair' : 'Loss'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                inventoryTurnover >= 2 ? 'bg-green-500' :
                inventoryTurnover >= 1 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <p className="text-xs text-gray-600">Turnover Rate</p>
              <p className="text-sm font-semibold">
                {inventoryTurnover >= 2 ? 'High' :
                 inventoryTurnover >= 1 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                totalInventoryValue >= 50000 ? 'bg-green-500' :
                totalInventoryValue >= 20000 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <p className="text-xs text-gray-600">Stock Level</p>
              <p className="text-sm font-semibold">
                {totalInventoryValue >= 50000 ? 'High' :
                 totalInventoryValue >= 20000 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Business Recommendations</h3>
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Recommendations */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-3">Inventory Management</h4>

            {totalInventoryValue < 20000 && (
              <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Low Stock Alert</p>
                  <p className="text-xs text-yellow-700">Consider restocking inventory to meet demand</p>
                </div>
              </div>
            )}

            {inventoryTurnover < 1 && (
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Slow Moving Stock</p>
                  <p className="text-xs text-red-700">Focus on sales strategies to improve turnover</p>
                </div>
              </div>
            )}

            {totalGlassesValue === 0 && (
              <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Glasses Out of Stock</p>
                  <p className="text-xs text-orange-700">Restock glasses inventory immediately</p>
                </div>
              </div>
            )}

            {totalLensValue === 0 && (
              <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Lens Out of Stock</p>
                  <p className="text-xs text-orange-700">Restock lens inventory immediately</p>
                </div>
              </div>
            )}

            {profitPercentage >= 20 && (
              <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Excellent Performance</p>
                  <p className="text-xs text-green-700">Consider expanding successful product lines</p>
                </div>
              </div>
            )}
          </div>

          {/* Financial Recommendations */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-3">Financial Management</h4>

            {accountBalance < 10000 && (
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Low Cash Balance</p>
                  <p className="text-xs text-red-700">Monitor cash flow closely and plan for expenses</p>
                </div>
              </div>
            )}

            {totalProfit < 0 && (
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Operating at Loss</p>
                  <p className="text-xs text-red-700">Review pricing strategy and reduce costs</p>
                </div>
              </div>
            )}

            {cashFlow >= 100000 && (
              <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Strong Cash Position</p>
                  <p className="text-xs text-blue-700">Consider investing in new inventory or equipment</p>
                </div>
              </div>
            )}

            {profitPercentage >= 15 && inventoryTurnover >= 1.5 && (
              <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Optimal Performance</p>
                  <p className="text-xs text-green-700">Business is performing well across all metrics</p>
                </div>
              </div>
            )}

            {inventoryTurnover >= 2 && (
              <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">High Turnover Rate</p>
                  <p className="text-xs text-green-700">Excellent inventory management performance</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show message if no recommendations */}
        {totalInventoryValue >= 20000 &&
         inventoryTurnover >= 1 &&
         totalGlassesValue > 0 &&
         totalLensValue > 0 &&
         accountBalance >= 10000 &&
         totalProfit >= 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">All Systems Running Smoothly!</h4>
            <p className="text-gray-600">Your optical business is performing well across all metrics. Keep up the excellent work!</p>
          </div>
        )}
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
          <PieChart className="w-5 h-5 text-purple-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Liquidity Ratio */}
          <div className="text-center p-4 border rounded-lg">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Liquidity Ratio</p>
            <p className="text-xl font-bold text-blue-600">
              {totalInventoryValue > 0 ? (accountBalance / totalInventoryValue).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500">Cash / Inventory</p>
          </div>

          {/* Asset Efficiency */}
          <div className="text-center p-4 border rounded-lg">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Asset Efficiency</p>
            <p className="text-xl font-bold text-green-600">
              {totalInventoryValue > 0 ? ((totalSold / totalInventoryValue) * 100).toFixed(1) : '0.0'}%
            </p>
            <p className="text-xs text-gray-500">Sales / Assets</p>
          </div>

          {/* Profit Margin */}
          <div className="text-center p-4 border rounded-lg">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className={`text-xl font-bold ${profitPercentage >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {profitPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Net Profit / Sales</p>
          </div>

          {/* Inventory Days */}
          <div className="text-center p-4 border rounded-lg">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Inventory Days</p>
            <p className="text-xl font-bold text-orange-600">
              {inventoryTurnover > 0 ? Math.round(365 / inventoryTurnover) : '∞'}
            </p>
            <p className="text-xs text-gray-500">Days to sell</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.visit('/optics-account/transactions')}
            className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
            <span className="font-medium">View Transactions</span>
          </button>

          <button
            onClick={() => router.visit('/optics-account/analytics')}
            className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
            <span className="font-medium">Business Analytics</span>
          </button>

          <button
            onClick={() => router.visit('/optics-account/balance-sheet')}
            className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PieChart className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium">Balance Sheet</span>
          </button>

          <button
            onClick={() => router.visit('/optics-account')}
            className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="w-5 h-5 text-orange-500 mr-2" />
            <span className="font-medium">Dashboard</span>
          </button>
        </div>
      </div>
    </OpticsAccountLayout>
  );
};

export default InventoryReport;
