import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Calendar, Clock, Eye, Package, Plus, Settings, Trash2, X } from 'lucide-react';
import { useState } from 'react';

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
            year: 'numeric',
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
            color: 'text-red-600',
        },
        {
            id: 'expiring',
            name: 'Expiring Soon',
            count: expiringMedicines.length,
            icon: Calendar,
            color: 'text-amber-600',
        },
        {
            id: 'expired',
            name: 'Expired',
            count: expiredMedicines.length,
            icon: AlertTriangle,
            color: 'text-red-600',
        },
    ];

    return (
        <AdminLayout>
            <Head title="Stock Alerts" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Stock Alerts</h1>
                        <p className="mt-1 text-gray-600">Monitor low stock levels and expiring medicines</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50">
                            <Settings className="h-4 w-4" />
                            Alert Settings
                        </button>
                    </div>
                </div>

                {/* Alert Summary Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critical Low Stock</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">{lowStockMedicines.filter((m) => m.total_stock === 0).length}</p>
                            </div>
                            <div className="rounded-lg bg-red-100 p-3">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Expiring This Week</p>
                                <p className="mt-1 text-2xl font-bold text-amber-600">
                                    {expiringMedicines.filter((item) => getDaysUntilExpiry(item.expiry_date) <= 7).length}
                                </p>
                            </div>
                            <div className="rounded-lg bg-amber-100 p-3">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Already Expired</p>
                                <p className="mt-1 text-2xl font-bold text-red-600">{expiredMedicines.length}</p>
                            </div>
                            <div className="rounded-lg bg-red-100 p-3">
                                <X className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 border-b-2 px-2 py-4 text-sm font-medium transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.name}
                                        {tab.count > 0 && (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
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
                                    <div className="py-12 text-center">
                                        <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">No Low Stock Alerts</h3>
                                        <p className="text-gray-600">All medicines are adequately stocked.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {lowStockMedicines.map((medicine) => (
                                            <div
                                                key={medicine.id}
                                                className={`rounded-lg border p-4 ${getStockUrgencyColor(
                                                    medicine.total_stock,
                                                    medicine.stock_alert?.minimum_stock || 0,
                                                )}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                                                        {medicine.generic_name && (
                                                            <p className="mt-1 text-sm text-gray-600">{medicine.generic_name}</p>
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
                                                            className="inline-flex items-center rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                            title="Add Stock"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMedicine(medicine);
                                                                setShowSettingsModal(true);
                                                            }}
                                                            className="inline-flex items-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50"
                                                            title="Alert Settings"
                                                        >
                                                            <Settings className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Stock Progress Bar */}
                                                {medicine.stock_alert && (
                                                    <div className="mt-3">
                                                        <div className="h-2 w-full rounded-full bg-gray-200">
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
                                                                    width: `${Math.min((medicine.total_stock / medicine.stock_alert.reorder_level) * 100, 100)}%`,
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
                                    <div className="py-12 text-center">
                                        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">No Expiring Stock</h3>
                                        <p className="text-gray-600">No medicines are expiring in the next 30 days.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {expiringMedicines.map((stock) => {
                                            const days = getDaysUntilExpiry(stock.expiry_date);
                                            return (
                                                <div key={stock.id} className={`rounded-lg border p-4 ${getUrgencyColor(days)}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                                                            {stock.medicine.generic_name && (
                                                                <p className="mt-1 text-sm text-gray-600">{stock.medicine.generic_name}</p>
                                                            )}
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-sm text-gray-600">
                                                                    Batch: <span className="font-medium">{stock.batch_number}</span>
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    Stock:{' '}
                                                                    <span className="font-medium">
                                                                        {stock.available_quantity} {stock.medicine.unit}
                                                                    </span>
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    Expires: <span className="font-medium">{formatDate(stock.expiry_date)}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div
                                                                className={`text-lg font-bold ${
                                                                    days <= 0 ? 'text-red-600' : days <= 7 ? 'text-red-600' : 'text-amber-600'
                                                                }`}
                                                            >
                                                                {days <= 0 ? 'Expired' : `${days}d`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-2">
                                                        <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                                                            <Eye className="h-4 w-4" />
                                                            View Stock
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkExpired(stock.id)}
                                                            className="inline-flex items-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                                                            title="Mark as Expired"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                                    <div className="py-12 text-center">
                                        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">No Expired Stock</h3>
                                        <p className="text-gray-600">No expired medicines found in your inventory.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {expiredMedicines.map((stock) => (
                                            <div key={stock.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                                                        {stock.medicine.generic_name && (
                                                            <p className="mt-1 text-sm text-gray-600">{stock.medicine.generic_name}</p>
                                                        )}
                                                        <div className="mt-2 space-y-1">
                                                            <p className="text-sm text-gray-600">
                                                                Batch: <span className="font-medium">{stock.batch_number}</span>
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Stock:{' '}
                                                                <span className="font-medium">
                                                                    {stock.available_quantity} {stock.medicine.unit}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-red-600">
                                                                Expired: <span className="font-medium">{formatDate(stock.expiry_date)}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                            Expired
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        className="inline-flex items-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100"
                                                        title="Remove from Inventory"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
