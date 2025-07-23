import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ShoppingCart,
    Plus,
    Calendar,
    Package,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Search,
    Clock,
    User,
    TrendingUp
} from 'lucide-react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    standard_sale_price: number;
}

interface RecentPurchase {
    id: number;
    quantity: number;
    unit_price: number;
    total_amount: number;
    created_at: string;
    medicine_stock: {
        batch_number: string;
        medicine: {
            name: string;
        };
    };
    created_by: {
        name: string;
    };
}

interface PurchasePageProps {
    medicines: Medicine[];
    recentPurchases: RecentPurchase[];
    todayPurchases: number;
}

export default function Purchase({ medicines, recentPurchases, todayPurchases }: PurchasePageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        medicine_id: '',
        batch_number: '',
        expiry_date: '',
        quantity: '',
        buy_price: '',
        sale_price: '',
        notes: '',
    });

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredMedicines = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/medicine-corner/stock/add', {
            onSuccess: () => {
                reset();
                setSelectedMedicine(null);
            }
        });
    };

    const handleMedicineSelect = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setData({
            ...data,
            medicine_id: medicine.id.toString(),
            sale_price: medicine.standard_sale_price.toString()
        });
    };

    return (
        <AdminLayout>
            <Head title="Purchase Entry" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Purchase Entry</h1>
                        <p className="text-gray-600 mt-1">Add new stock to your medicine inventory</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Today's Purchases</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(todayPurchases)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Purchase Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Add New Stock</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Medicine Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Medicine *
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search medicines..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {searchTerm && (
                                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                                            {filteredMedicines.map((medicine) => (
                                                <button
                                                    key={medicine.id}
                                                    type="button"
                                                    onClick={() => handleMedicineSelect(medicine)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                                >
                                                    <div className="font-medium text-gray-900">{medicine.name}</div>
                                                    {medicine.generic_name && (
                                                        <div className="text-sm text-gray-600">{medicine.generic_name}</div>
                                                    )}
                                                    <div className="text-sm text-blue-600">
                                                        Standard Price: {formatCurrency(medicine.standard_sale_price)}
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredMedicines.length === 0 && (
                                                <div className="px-4 py-3 text-gray-500 text-center">
                                                    No medicines found
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedMedicine && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                                <span className="font-medium text-blue-900">
                                                    Selected: {selectedMedicine.name}
                                                </span>
                                            </div>
                                            {selectedMedicine.generic_name && (
                                                <div className="text-sm text-blue-700 mt-1">
                                                    {selectedMedicine.generic_name}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {errors.medicine_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.medicine_id}</p>
                                    )}
                                </div>

                                {/* Batch and Expiry */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Batch Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.batch_number}
                                            onChange={(e) => setData('batch_number', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., BATCH001"
                                        />
                                        {errors.batch_number && (
                                            <p className="mt-1 text-sm text-red-600">{errors.batch_number}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={data.expiry_date}
                                                onChange={(e) => setData('expiry_date', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        {errors.expiry_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity and Prices */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quantity *
                                        </label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0"
                                                min="1"
                                            />
                                        </div>
                                        {errors.quantity && (
                                            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Buy Price (per unit) *
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.buy_price}
                                                onChange={(e) => setData('buy_price', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        {errors.buy_price && (
                                            <p className="mt-1 text-sm text-red-600">{errors.buy_price}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sale Price (per unit) *
                                        </label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.sale_price}
                                                onChange={(e) => setData('sale_price', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        {errors.sale_price && (
                                            <p className="mt-1 text-sm text-red-600">{errors.sale_price}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Total Calculation */}
                                {data.quantity && data.buy_price && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Total Purchase Amount:</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(parseFloat(data.quantity) * parseFloat(data.buy_price))}
                                            </span>
                                        </div>
                                        {data.sale_price && (
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-sm font-medium text-gray-700">Expected Profit:</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {formatCurrency((parseFloat(data.sale_price) - parseFloat(data.buy_price)) * parseFloat(data.quantity))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Any additional notes about this purchase..."
                                    />
                                    {errors.notes && (
                                        <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={processing || !selectedMedicine}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Adding Stock...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Add Stock
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            reset();
                                            setSelectedMedicine(null);
                                            setSearchTerm('');
                                        }}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Clear Form
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Recent Purchases */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Recent Purchases</h2>
                            </div>

                            <div className="space-y-4">
                                {recentPurchases.map((purchase) => (
                                    <div key={purchase.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">
                                                    {purchase.medicine_stock.medicine.name}
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    Batch: {purchase.medicine_stock.batch_number}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-green-600">
                                                {formatCurrency(purchase.total_amount)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                <span>{purchase.quantity} units</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>{purchase.created_by.name}</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(purchase.created_at)}
                                        </div>
                                    </div>
                                ))}

                                {recentPurchases.length === 0 && (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No recent purchases</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
