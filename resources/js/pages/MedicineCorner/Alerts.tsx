import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  AlertTriangle,
  Calendar,
  Package,
  Settings,
  Bell,
  BellOff,
  Plus,
  Minus,
  Trash2,
  Eye,
  Clock,
  X
} from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  total_stock: number;
  unit: string;
  stock_alert?: {
    minimum_stock: number;
    reorder_level: number;
    low_stock_alert: boolean;
    expiry_alert: boolean;
    expiry_alert_days: number;
  };
}

interface StockItem {
  id: number;
  batch_number: string;
  expiry_date: string;
  available_quantity: number;
  medicine: {
    name: string;
    generic_name: string;
    unit: string;
  };
}

interface AlertsPageProps {
  lowStockMedicines: Medicine[];
  expiringMedicines: StockItem[];
  expiredMedicines: StockItem[];
}

export default function Alerts({ lowStockMedicines, expiringMedicines, expiredMedicines }: AlertsPageProps) {
  const [activeTab, setActiveTab] = useState<'low-stock' | 'expiring' | 'expired'>('low-stock');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 15) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getStockUrgencyColor = (current: number, minimum: number) => {
    if (current === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (current <= minimum * 0.5) return 'text-red-600 bg-red-50 border-red-200';
    if (current <= minimum) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const handleAddStock = (medicineId: number) => {
    router.visit(`/medicine-corner/purchase?medicine_id=${medicineId}`);
  };

  const handleMarkExpired = (stockId: number) => {
    // Handle marking stock as expired
    console.log('Mark expired:', stockId);
  };

  const tabs = [
    {
      id: 'low-stock',
      name: 'Low Stock',
      count: lowStockMedicines.length,
      icon: Package,
      color: 'text-red-600'
    },
    {
      id: 'expiring',
      name: 'Expiring Soon',
      count: expiringMedicines.length,
      icon: Calendar,
      color: 'text-amber-600'
    },
    {
      id: 'expired',
      name: 'Expired',
      count: expiredMedicines.length,
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <AdminLayout>
      <Head title="Stock Alerts" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor low stock levels and expiring medicines</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4" />
              Alert Settings
            </button>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Low Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {lowStockMedicines.filter(m => m.total_stock === 0).length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring This Week</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {expiringMedicines.filter(item => getDaysUntilExpiry(item.expiry_date) <= 7).length}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Already Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {expiredMedicines.length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Low Stock Tab */}
            {activeTab === 'low-stock' && (
              <div className="space-y-4">
                {lowStockMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Alerts</h3>
                    <p className="text-gray-600">All medicines are adequately stocked.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lowStockMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className={`border rounded-lg p-4 ${getStockUrgencyColor(
                          medicine.total_stock,
                          medicine.stock_alert?.minimum_stock || 0
                        )}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                            {medicine.generic_name && (
                              <p className="text-sm text-gray-600 mt-1">{medicine.generic_name}</p>
                            )}
                            <div className="mt-2 flex items-center gap-4">
                              <div className="text-sm">
                                <span className="text-gray-600">Current: </span>
                                <span className="font-semibold">
                                  {medicine.total_stock} {medicine.unit}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Min: </span>
                                <span className="font-semibold">
                                  {medicine.stock_alert?.minimum_stock || 0} {medicine.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddStock(medicine.id)}
                              className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Add Stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMedicine(medicine);
                                setShowSettingsModal(true);
                              }}
                              className="inline-flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Alert Settings"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Stock Progress Bar */}
                        {medicine.stock_alert && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  medicine.total_stock === 0
                                    ? 'bg-red-500'
                                    : medicine.total_stock <= medicine.stock_alert.minimum_stock * 0.5
                                    ? 'bg-red-500'
                                    : medicine.total_stock <= medicine.stock_alert.minimum_stock
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min((medicine.total_stock / medicine.stock_alert.reorder_level) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expiring Tab */}
            {activeTab === 'expiring' && (
              <div className="space-y-4">
                {expiringMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Expiring Stock</h3>
                    <p className="text-gray-600">No medicines are expiring in the next 30 days.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiringMedicines.map((stock) => {
                      const days = getDaysUntilExpiry(stock.expiry_date);
                      return (
                        <div
                          key={stock.id}
                          className={`border rounded-lg p-4 ${getUrgencyColor(days)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                              {stock.medicine.generic_name && (
                                <p className="text-sm text-gray-600 mt-1">{stock.medicine.generic_name}</p>
                              )}
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600">
                                  Batch: <span className="font-medium">{stock.batch_number}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Stock: <span className="font-medium">{stock.available_quantity} {stock.medicine.unit}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Expires: <span className="font-medium">{formatDate(stock.expiry_date)}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                days <= 0 ? 'text-red-600' : days <= 7 ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {days <= 0 ? 'Expired' : `${days}d`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <button
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Stock
                            </button>
                            <button
                              onClick={() => handleMarkExpired(stock.id)}
                              className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Mark as Expired"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Expired Tab */}
            {activeTab === 'expired' && (
              <div className="space-y-4">
                {expiredMedicines.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Expired Stock</h3>
                    <p className="text-gray-600">No expired medicines found in your inventory.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiredMedicines.map((stock) => (
                      <div
                        key={stock.id}
                        className="border border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                            {stock.medicine.generic_name && (
                              <p className="text-sm text-gray-600 mt-1">{stock.medicine.generic_name}</p>
                            )}
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                Batch: <span className="font-medium">{stock.batch_number}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Stock: <span className="font-medium">{stock.available_quantity} {stock.medicine.unit}</span>
                              </p>
                              <p className="text-sm text-red-600">
                                Expired: <span className="font-medium">{formatDate(stock.expiry_date)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button className="inline-flex items-center p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Remove from Inventory">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
