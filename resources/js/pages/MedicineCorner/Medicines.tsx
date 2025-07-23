// resources/js/Pages/MedicineCorner/Medicines.tsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Pill,
    Plus,
    Search,
    Filter,
    Edit,
    Settings,
    Package,
    AlertTriangle,
    Eye,
    MoreVertical
} from 'lucide-react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    type: string;
    manufacturer: string;
    standard_sale_price: number;
    total_stock: number;
    unit: string;
    is_active: boolean;
    stock_alert?: {
        minimum_stock: number;
        reorder_level: number;
    };
}

interface MedicinesPageProps {
    medicines: {
        data: Medicine[];
        links?: any[];
        meta?: any;
    };
    medicineTypes: string[];
}

export default function Medicines({ medicines, medicineTypes }: MedicinesPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const getStockStatus = (medicine: Medicine) => {
        if (!medicine.stock_alert) return 'normal';

        if (medicine.total_stock <= 0) return 'out';
        if (medicine.total_stock <= medicine.stock_alert.minimum_stock) return 'low';
        if (medicine.total_stock <= medicine.stock_alert.reorder_level) return 'reorder';
        return 'normal';
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'out': return 'bg-red-100 text-red-800 border-red-200';
            case 'low': return 'bg-red-100 text-red-800 border-red-200';
            case 'reorder': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getStockStatusText = (status: string) => {
        switch (status) {
            case 'out': return 'Out of Stock';
            case 'low': return 'Low Stock';
            case 'reorder': return 'Reorder Level';
            default: return 'In Stock';
        }
    };

    // Safe access to medicines data
    const medicineData = medicines?.data || [];
    const totalCount = medicines?.meta?.total || medicineData.length;

    return (
        <AdminLayout>
            <Head title="Medicine List" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine List</h1>
                        <p className="text-gray-600 mt-1">Manage your medicine catalog and inventory settings</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Medicine
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Medicines</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {totalCount}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Pill className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Stock</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {medicineData.filter(m => m.total_stock > 0).length}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Package className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {medicineData.filter(m => getStockStatus(m) === 'low').length}
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
                                <p className="text-sm font-medium text-gray-600">Categories</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {medicineTypes?.length || 0}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Filter className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search medicines by name, generic name, or manufacturer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {medicineTypes?.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Medicine Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medicineData.map((medicine) => {
                        const stockStatus = getStockStatus(medicine);

                        return (
                            <div key={medicine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {medicine.name}
                                            </h3>
                                            {medicine.generic_name && (
                                                <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockStatusColor(stockStatus)}`}>
                                                {getStockStatusText(stockStatus)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Category:</span>
                                            <span className="text-sm font-medium text-gray-900">{medicine.type}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Current Stock:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {medicine.total_stock} {medicine.unit}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sale Price:</span>
                                            <span className="text-sm font-semibold text-green-600">
                                                {formatCurrency(medicine.standard_sale_price)}
                                            </span>
                                        </div>

                                        {medicine.manufacturer && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Manufacturer:</span>
                                                <span className="text-sm text-gray-900 truncate ml-2" title={medicine.manufacturer}>
                                                    {medicine.manufacturer}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock Progress Bar */}
                                    {medicine.stock_alert && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>Stock Level</span>
                                                <span>{medicine.total_stock}/{medicine.stock_alert.reorder_level}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${stockStatus === 'low' || stockStatus === 'out'
                                                            ? 'bg-red-500'
                                                            : stockStatus === 'reorder'
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

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => router.visit(`/medicine-corner/medicines/${medicine.id}`)}
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Edit Medicine"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Alert Settings"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {medicineData.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
                        <p className="text-gray-600 mb-6">Get started by adding your first medicine to the inventory.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Medicine
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
