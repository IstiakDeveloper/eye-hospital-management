import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Package,
    AlertTriangle,
    Calendar,
    TrendingUp,
    Plus,
    Minus,
    Edit3,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Package2
} from 'lucide-react';

interface Stock {
    id: number;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    available_quantity: number;
    buy_price: number;
    sale_price: number;
    medicine: {
        id: number;
        name: string;
        generic_name: string;
        unit: string;
    };
    added_by: {
        name: string;
    };
}

interface StockPageProps {
    stocks: {
        data: Stock[];
        links: any[];
        meta: any;
    };
    lowStockMedicines: any[];
    expiringStock: Stock[];
    totalStockValue: number;
}

export default function Stock({ stocks, lowStockMedicines, expiringStock, totalStockValue }: StockPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB');
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <AdminLayout>
            <Head title="Stock Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
                        <p className="text-gray-600 mt-1">Manage your medicine inventory and track stock levels</p>
                    </div>
                    <button
                        onClick={() => router.visit('/medicine-corner/purchase')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Stock
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Stock Value</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(totalStockValue)}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {lowStockMedicines.length}
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
                                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                    {expiringStock.length}
                                </p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <Calendar className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Stock Items</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {stocks.data.length}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert Banners */}
                {lowStockMedicines.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    {lowStockMedicines.length} medicines are running low on stock.
                                    <button
                                        onClick={() => router.visit('/medicine-corner/alerts')}
                                        className="ml-2 text-red-800 underline hover:no-underline"
                                    >
                                        View Details
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by medicine name, batch number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Current Stock</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medicine
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Batch
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Prices
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expiry
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Added By
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stocks.data.map((stock) => {
                                    const daysUntilExpiry = getDaysUntilExpiry(stock.expiry_date);
                                    const isExpiring = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                    const isExpired = daysUntilExpiry <= 0;

                                    return (
                                        <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {stock.medicine.name}
                                                    </div>
                                                    {stock.medicine.generic_name && (
                                                        <div className="text-sm text-gray-500">
                                                            {stock.medicine.generic_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {stock.batch_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    <span className="font-medium">{stock.available_quantity}</span>
                                                    <span className="text-gray-500">/{stock.quantity} {stock.medicine.unit}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{
                                                            width: `${(stock.available_quantity / stock.quantity) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="text-gray-900">Buy: {formatCurrency(stock.buy_price)}</div>
                                                    <div className="text-gray-500">Sale: {formatCurrency(stock.sale_price)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className={`font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-gray-900'}`}>
                                                        {formatDate(stock.expiry_date)}
                                                    </div>
                                                    <div className={`text-xs ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-gray-500'}`}>
                                                        {isExpired ? 'Expired' : isExpiring ? `${daysUntilExpiry} days left` : `${daysUntilExpiry} days`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{stock.added_by.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStock(stock);
                                                            setShowAdjustModal(true);
                                                        }}
                                                        className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                        title="Adjust Stock"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expiring Stock Section */}
                {expiringStock.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-amber-600" />
                                <h2 className="text-lg font-semibold text-amber-900">Expiring Soon (Next 30 Days)</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {expiringStock.map((stock) => (
                                    <div key={stock.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{stock.medicine.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">Batch: {stock.batch_number}</p>
                                                <p className="text-sm text-gray-600">Stock: {stock.available_quantity} {stock.medicine.unit}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-amber-600">
                                                    {getDaysUntilExpiry(stock.expiry_date)} days
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDate(stock.expiry_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
