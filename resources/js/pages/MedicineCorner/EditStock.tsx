import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ShoppingCart,
    Save,
    Calendar,
    Package,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Search,
    ArrowLeft,
    User,
    TrendingUp,
    Building2,
    CreditCard,
    AlertTriangle,
    Edit
} from 'lucide-react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    standard_sale_price: number;
}

interface Vendor {
    id: number;
    name: string;
    company_name: string;
    current_balance: number;
    credit_limit: number;
    payment_terms_days: number;
}

interface StockData {
    id: number;
    vendor_id: number;
    medicine_id: number;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    available_quantity: number;
    buy_price: number;
    sale_price: number;
    notes?: string;
    purchase_date: string;
    paid_amount?: number;
    payment_method?: string;
    cheque_no?: string;
    cheque_date?: string;
    medicine?: Medicine;
    vendor?: Vendor;
    total_purchase_amount: number;
    due_amount?: number;
    payment_status?: string;
}

interface EditStockProps {
    stock: StockData;
    medicines: Medicine[];
    vendors: Vendor[];
}

export default function EditStock({ stock, medicines, vendors }: EditStockProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(stock.medicine || null);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(stock.vendor || null);

    const { data, setData, put, processing, errors, reset } = useForm({
        vendor_id: stock.vendor_id ? stock.vendor_id.toString() : '',
        medicine_id: stock.medicine_id ? stock.medicine_id.toString() : '',
        batch_number: stock.batch_number || '',
        expiry_date: stock.expiry_date || '',
        quantity: stock.quantity ? stock.quantity.toString() : '',
        buy_price: stock.buy_price ? stock.buy_price.toString() : '',
        sale_price: stock.sale_price ? stock.sale_price.toString() : '',
        paid_amount: stock.paid_amount ? stock.paid_amount.toString() : '0',
        payment_method: stock.payment_method || 'credit',
        cheque_no: stock.cheque_no || '',
        cheque_date: stock.cheque_date || '',
        notes: stock.notes || '',
    });

    // Set selected medicine and vendor from medicines and vendors arrays if not in stock object
    useEffect(() => {
        if (!selectedMedicine && stock.medicine_id) {
            const medicine = medicines.find(m => m.id === stock.medicine_id);
            if (medicine) setSelectedMedicine(medicine);
        }
        if (!selectedVendor && stock.vendor_id) {
            const vendor = vendors.find(v => v.id === stock.vendor_id);
            if (vendor) setSelectedVendor(vendor);
        }
    }, [medicines, vendors, stock.medicine_id, stock.vendor_id, selectedMedicine, selectedVendor]);

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
            year: 'numeric'
        });
    };

    const filteredMedicines = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('medicine-corner.update-stock', stock.id));
    };

    const handleMedicineSelect = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setData({
            ...data,
            medicine_id: medicine.id.toString(),
            sale_price: medicine.standard_sale_price.toString()
        });
        setSearchTerm('');
    };

    const handleVendorSelect = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setData({
            ...data,
            vendor_id: vendor.id.toString()
        });
    };

    const getTotalAmount = () => {
        if (data.quantity && data.buy_price) {
            return parseFloat(data.quantity) * parseFloat(data.buy_price);
        }
        return 0;
    };

    const getDueAmount = () => {
        const total = getTotalAmount();
        const paid = parseFloat(data.paid_amount) || 0;
        return Math.max(0, total - paid);
    };

    const getCreditUtilization = () => {
        if (!selectedVendor || selectedVendor.credit_limit === 0) return 0;
        const stockDueAmount = stock.due_amount || 0;
        const currentDue = selectedVendor.id === stock.vendor_id
            ? selectedVendor.current_balance - stockDueAmount
            : selectedVendor.current_balance;
        const newDue = currentDue + getDueAmount();
        return (newDue / selectedVendor.credit_limit) * 100;
    };

    const getQuantityChangeWarning = () => {
        const newQuantity = parseInt(data.quantity) || 0;
        const quantityDifference = newQuantity - stock.quantity;

        if (quantityDifference < 0 && Math.abs(quantityDifference) > stock.available_quantity) {
            return `Cannot reduce quantity by ${Math.abs(quantityDifference)}. Only ${stock.available_quantity} units available.`;
        }
        return null;
    };

    return (
        <AdminLayout>
            <Head title="Edit Stock Entry" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Stock Entry</h1>
                            <p className="text-gray-600 mt-1">
                                Update stock information for batch: {stock.batch_number}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Original Purchase Date</p>
                        <p className="text-lg font-semibold text-blue-600">{formatDate(stock.purchase_date)}</p>
                    </div>
                </div>

                {/* Current Stock Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-blue-900">Current Stock Information</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700">Original Quantity:</span>
                            <div className="font-semibold text-blue-900">{stock.quantity} units</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Available:</span>
                            <div className="font-semibold text-green-600">{stock.available_quantity} units</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Sold:</span>
                            <div className="font-semibold text-red-600">{stock.quantity - stock.available_quantity} units</div>
                        </div>
                        <div>
                            <span className="text-blue-700">Payment Status:</span>
                            <div className={`font-semibold ${(stock.payment_status || 'pending') === 'paid' ? 'text-green-600' :
                                    (stock.payment_status || 'pending') === 'partial' ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {(stock.payment_status || 'pending').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Edit className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Update Stock Information</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Vendor Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Vendor *
                                    </label>
                                    <select
                                        value={data.vendor_id}
                                        onChange={(e) => {
                                            const vendor = vendors.find(v => v.id === parseInt(e.target.value));
                                            if (vendor) handleVendorSelect(vendor);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Choose a vendor...</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.id} value={vendor.id}>
                                                {vendor.name} {vendor.company_name && `(${vendor.company_name})`}
                                                {vendor.current_balance > 0 && ` - Due: ${formatCurrency(vendor.current_balance)}`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.vendor_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.vendor_id}</p>
                                    )}

                                    {selectedVendor && (
                                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4 text-green-600" />
                                                <span className="font-medium text-green-900">
                                                    {selectedVendor.name}
                                                </span>
                                                {selectedVendor.id !== stock.vendor_id && (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                        Vendor Changed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-green-700">Current Due: </span>
                                                    <span className="font-semibold text-red-600">
                                                        {formatCurrency(selectedVendor.current_balance)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-green-700">Credit Limit: </span>
                                                    <span className="font-semibold text-green-600">
                                                        {formatCurrency(selectedVendor.credit_limit)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-green-700">Payment Terms: </span>
                                                    <span className="font-semibold">{selectedVendor.payment_terms_days} days</span>
                                                </div>
                                                <div>
                                                    <span className="text-green-700">New Credit Used: </span>
                                                    <span className={`font-semibold ${getCreditUtilization() > 80 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {getCreditUtilization().toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Medicine Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Medicine *
                                    </label>

                                    {/* Current Medicine Display */}
                                    {selectedMedicine ? (
                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                                <span className="font-medium text-blue-900">
                                                    Current: {selectedMedicine.name}
                                                </span>
                                                {selectedMedicine.id !== stock.medicine_id && (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                        Medicine Changed
                                                    </span>
                                                )}
                                            </div>
                                            {selectedMedicine.generic_name && (
                                                <div className="text-sm text-blue-700 mt-1">
                                                    {selectedMedicine.generic_name}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                <span className="font-medium text-yellow-800">
                                                    No medicine selected - Please select a medicine
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search to change medicine..."
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
                                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${medicine.id === selectedMedicine.id ? 'bg-blue-50' : ''
                                                        }`}
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
                                        {getQuantityChangeWarning() && (
                                            <p className="mt-1 text-sm text-red-600">{getQuantityChangeWarning()}</p>
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

                                {/* Payment Details */}
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Method *
                                            </label>
                                            <select
                                                value={data.payment_method}
                                                onChange={(e) => setData('payment_method', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="credit">Credit (Pay Later)</option>
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Paid Amount
                                            </label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={data.paid_amount}
                                                    onChange={(e) => setData('paid_amount', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="0.00"
                                                    min="0"
                                                    max={getTotalAmount()}
                                                />
                                            </div>
                                            {parseFloat(data.paid_amount || '0') !== (stock.paid_amount || 0) && (
                                                <p className="mt-1 text-sm text-blue-600">
                                                    Original payment: {formatCurrency(stock.paid_amount || 0)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cheque Details */}
                                    {data.payment_method === 'cheque' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cheque Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.cheque_no}
                                                    onChange={(e) => setData('cheque_no', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Cheque number"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cheque Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.cheque_date}
                                                    onChange={(e) => setData('cheque_date', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Total Calculation & Changes Comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Original Values */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Original Values</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Total Purchase:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(stock.total_purchase_amount || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Paid Amount:</span>
                                                <span className="font-semibold text-blue-600">
                                                    {formatCurrency(stock.paid_amount || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Due Amount:</span>
                                                <span className="font-semibold text-red-600">
                                                    {formatCurrency(stock.due_amount || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Values */}
                                    {(data.quantity && data.buy_price) && (
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <h4 className="font-medium text-blue-900 mb-3">New Values</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Total Purchase:</span>
                                                    <span className={`font-semibold ${getTotalAmount() !== (stock.total_purchase_amount || 0) ? 'text-orange-600' : 'text-blue-900'
                                                        }`}>
                                                        {formatCurrency(getTotalAmount())}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Paid Amount:</span>
                                                    <span className={`font-semibold ${parseFloat(data.paid_amount || '0') !== (stock.paid_amount || 0) ? 'text-orange-600' : 'text-blue-600'
                                                        }`}>
                                                        {formatCurrency(parseFloat(data.paid_amount) || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Due Amount:</span>
                                                    <span className={`font-semibold ${getDueAmount() > 0 ? 'text-red-600' : 'text-green-600'
                                                        }`}>
                                                        {formatCurrency(getDueAmount())}
                                                    </span>
                                                </div>
                                                {data.sale_price && (
                                                    <div className="flex justify-between">
                                                        <span className="text-blue-700">Expected Profit:</span>
                                                        <span className="font-semibold text-purple-600">
                                                            {formatCurrency((parseFloat(data.sale_price) - parseFloat(data.buy_price)) * parseFloat(data.quantity))}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                        placeholder="Any additional notes about this purchase update..."
                                    />
                                    {errors.notes && (
                                        <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={processing || getQuantityChangeWarning() !== null || !selectedMedicine || !selectedVendor}
                                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Updating Stock...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Update Stock
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Stock History & Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Stock Information</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Stock Status */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Current Status</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Batch Number:</span>
                                            <span className="font-semibold">{stock.batch_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Expiry Date:</span>
                                            <span className="font-semibold">{formatDate(stock.expiry_date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Purchase Date:</span>
                                            <span className="font-semibold">{formatDate(stock.purchase_date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Units Sold:</span>
                                            <span className="font-semibold text-red-600">
                                                {stock.quantity - stock.available_quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning Messages */}
                                {stock.available_quantity !== stock.quantity && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            <span className="text-sm font-medium text-yellow-800">
                                                Partial Stock Sold
                                            </span>
                                        </div>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            {stock.quantity - stock.available_quantity} units have been sold from this batch.
                                            Quantity changes may affect availability.
                                        </p>
                                    </div>
                                )}

                                {/* Vendor Information */}
                                {selectedVendor ? (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Original Vendor</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-medium text-blue-600">{selectedVendor.name}</div>
                                            {selectedVendor.company_name && (
                                                <div className="text-gray-600">{selectedVendor.company_name}</div>
                                            )}
                                            <div className="text-gray-600">
                                                Current Due: {formatCurrency(selectedVendor.current_balance)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                                        <h4 className="font-medium text-yellow-800 mb-3">Vendor Information</h4>
                                        <div className="text-sm text-yellow-700">
                                            No vendor information available. Please select a vendor.
                                        </div>
                                    </div>
                                )}

                                {/* Medicine Information */}
                                {selectedMedicine ? (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Original Medicine</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-medium text-blue-600">{selectedMedicine.name}</div>
                                            {selectedMedicine.generic_name && (
                                                <div className="text-gray-600">{selectedMedicine.generic_name}</div>
                                            )}
                                            <div className="text-gray-600">
                                                Standard Price: {formatCurrency(selectedMedicine.standard_sale_price)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                                        <h4 className="font-medium text-yellow-800 mb-3">Medicine Information</h4>
                                        <div className="text-sm text-yellow-700">
                                            No medicine information available. Please select a medicine.
                                        </div>
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