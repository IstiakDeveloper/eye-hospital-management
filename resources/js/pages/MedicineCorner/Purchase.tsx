import AdminLayout from '@/layouts/admin-layout';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronDown,
    Clock,
    CreditCard,
    DollarSign,
    Package,
    Plus,
    Search,
    ShoppingCart,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    standard_sale_price: number;
    average_buy_price: number;
    total_stock: number;
    latest_buy_price: number;
    latest_sale_price: number;
}

interface Vendor {
    id: number;
    name: string;
    company_name: string;
    current_balance: number;
    credit_limit: number;
    payment_terms_days: number;
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
        vendor?: {
            name: string;
        };
    };
    created_by: {
        name: string;
    };
}

interface VendorWithDue {
    id: number;
    name: string;
    current_balance: number;
}

interface PurchasePageProps {
    medicines: Medicine[];
    vendors: Vendor[];
    recentPurchases: RecentPurchase[];
    todayPurchases: number;
    vendorsWithDues: VendorWithDue[];
}

export default function Purchase({ medicines, vendors, recentPurchases, todayPurchases, vendorsWithDues }: PurchasePageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        vendor_id: '',
        medicine_id: '',
        batch_number: '',
        expiry_date: '',
        quantity: '',
        total_price: '', // ✅ Total price instead of unit price
        sale_price: '',
        paid_amount: '',
        payment_method: 'credit',
        cheque_no: '',
        cheque_date: '',
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
            minute: '2-digit',
        });
    };

    const filteredMedicines = medicines.filter(
        (medicine) =>
            medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) || medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicine-corner.add-stock'), {
            onSuccess: () => {
                reset();
                setSelectedMedicine(null);
                setSelectedVendor(null);
            },
        });
    };

    const handleMedicineSelect = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setData({
            ...data,
            medicine_id: medicine.id.toString(),
            // Default new batch sale from latest stock when available, else list standard.
            sale_price: (medicine.latest_sale_price ?? medicine.standard_sale_price).toString(),
        });
        setSearchTerm('');
        setShowMedicineDropdown(false);
    };

    const handleVendorSelect = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setData({
            ...data,
            vendor_id: vendor.id.toString(),
        });
    };

    // ✅ Calculate unit price from total price
    const getUnitPrice = () => {
        if (data.quantity && data.total_price) {
            const qty = parseFloat(data.quantity);
            const total = parseFloat(data.total_price);
            return qty > 0 ? total / qty : 0;
        }
        return 0;
    };

    // ✅ Calculate new average price
    const getNewAveragePrice = () => {
        if (!selectedMedicine || !data.quantity || !data.total_price) return null;

        const oldStock = selectedMedicine.total_stock;
        const oldPrice = selectedMedicine.average_buy_price || 0;
        const newQty = parseFloat(data.quantity);
        const newPrice = getUnitPrice();

        if (oldStock === 0) return newPrice;

        const newAvg = (oldStock * oldPrice + newQty * newPrice) / (oldStock + newQty);
        return newAvg;
    };

    const getDueAmount = () => {
        const total = parseFloat(data.total_price) || 0;
        const paid = parseFloat(data.paid_amount) || 0;
        return Math.max(0, total - paid);
    };

    const getCreditUtilization = () => {
        if (!selectedVendor || selectedVendor.credit_limit === 0) return 0;
        const newDue = selectedVendor.current_balance + getDueAmount();
        return (newDue / selectedVendor.credit_limit) * 100;
    };

    const unitPrice = getUnitPrice();
    const newAveragePrice = getNewAveragePrice();

    return (
        <AdminLayout>
            <Head title="Purchase Entry" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine Purchase</h1>
                        <p className="mt-1 text-gray-600">Add new stock - Simple & Fast (Like Optics)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Today's Purchases</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(todayPurchases)}</p>
                        </div>
                    </div>
                </div>

                {/* Vendor Due Alert */}
                {vendorsWithDues.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-amber-800">Vendor Due Alert</h3>
                                <p className="mt-1 text-sm text-amber-700">
                                    {vendorsWithDues.length} vendors have pending dues.
                                    <button
                                        onClick={() => window.open(route('medicine-corner.vendor-dues'), '_blank')}
                                        className="ml-2 text-amber-800 underline hover:no-underline"
                                    >
                                        View Details
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Purchase Form */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Plus className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Add New Stock</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Vendor Selection */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Select Vendor *</label>
                                    <select
                                        value={data.vendor_id}
                                        onChange={(e) => {
                                            const vendor = vendors.find((v) => v.id === parseInt(e.target.value));
                                            if (vendor) handleVendorSelect(vendor);
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Choose a vendor...</option>
                                        {vendors.map((vendor) => (
                                            <option key={vendor.id} value={vendor.id}>
                                                {vendor.name} {vendor.company_name && `(${vendor.company_name})`}
                                                {vendor.current_balance > 0 && ` - Due: ${formatCurrency(vendor.current_balance)}`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.vendor_id && <p className="mt-1 text-sm text-red-600">{errors.vendor_id}</p>}

                                    {selectedVendor && (
                                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">Current Due:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(selectedVendor.current_balance)}</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-sm">
                                                <span className="text-gray-700">Credit Limit:</span>
                                                <span className="font-semibold text-gray-800">{formatCurrency(selectedVendor.credit_limit)}</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-sm">
                                                <span className="text-gray-700">Payment Terms:</span>
                                                <span className="font-semibold text-gray-800">{selectedVendor.payment_terms_days} days</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Medicine Search with Dropdown */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Select Medicine *</label>
                                    <div className="relative">
                                        <div className="flex items-center gap-2 rounded-lg border-2 border-gray-300 px-3 py-2 focus-within:border-blue-500">
                                            <Search className="text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search medicines by name or generic name..."
                                                className="flex-1 outline-none"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setShowMedicineDropdown(e.target.value.length > 0);
                                                }}
                                                onFocus={() => setShowMedicineDropdown(searchTerm.length > 0)}
                                            />
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setShowMedicineDropdown(false);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            <ChevronDown className="text-gray-400" size={16} />
                                        </div>

                                        {/* Dropdown */}
                                        {showMedicineDropdown && (
                                            <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {filteredMedicines.length > 0 ? (
                                                    filteredMedicines.slice(0, 10).map((medicine) => (
                                                        <button
                                                            key={medicine.id}
                                                            type="button"
                                                            onClick={() => handleMedicineSelect(medicine)}
                                                            className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-blue-50"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-gray-800">{medicine.name}</p>
                                                                    {medicine.generic_name && (
                                                                        <p className="mt-1 text-xs text-gray-500">{medicine.generic_name}</p>
                                                                    )}
                                                                    <div className="mt-2 flex items-center gap-3 text-xs">
                                                                        <span className="text-gray-600">Stock: {medicine.total_stock}</span>
                                                                        {medicine.average_buy_price > 0 && (
                                                                            <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">
                                                                                Avg: {formatCurrency(medicine.average_buy_price)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4 text-right">
                                                                    <p className="text-sm font-semibold text-blue-600">
                                                                        {formatCurrency(medicine.standard_sale_price)}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">Sale Price</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-center text-gray-500">No medicines found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedMedicine && (
                                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                        <span className="font-semibold text-green-900">{selectedMedicine.name}</span>
                                                    </div>
                                                    {selectedMedicine.generic_name && (
                                                        <p className="mb-2 text-sm text-green-700">{selectedMedicine.generic_name}</p>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Current Stock:</span>
                                                            <span className="ml-2 font-semibold text-gray-800">{selectedMedicine.total_stock}</span>
                                                        </div>
                                                        {selectedMedicine.average_buy_price > 0 && (
                                                            <div>
                                                                <span className="text-gray-600">Avg Price:</span>
                                                                <span className="ml-2 font-semibold text-amber-600">
                                                                    {formatCurrency(selectedMedicine.average_buy_price)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMedicine(null);
                                                        setData('medicine_id', '');
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {errors.medicine_id && <p className="mt-1 text-sm text-red-600">{errors.medicine_id}</p>}
                                </div>

                                {/* Batch and Expiry (Optional) */}
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Optional Details</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-600">Batch Number (Optional)</label>
                                            <input
                                                type="text"
                                                value={data.batch_number}
                                                onChange={(e) => setData('batch_number', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                placeholder="Auto-generated if empty"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-600">Expiry Date (Optional)</label>
                                            <div className="relative">
                                                <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={data.expiry_date}
                                                    onChange={(e) => setData('expiry_date', e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Default: 2 years from now</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity and Total Price */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Quantity *</label>
                                        <div className="relative">
                                            <Package className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="number"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                                min="1"
                                            />
                                        </div>
                                        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Total Price * <span className="text-xs text-gray-500">(Not per unit)</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="number"
                                                value={data.total_price}
                                                onChange={(e) => setData('total_price', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        {errors.total_price && <p className="mt-1 text-sm text-red-600">{errors.total_price}</p>}
                                    </div>
                                </div>

                                {/* Calculated Unit Price Display */}
                                {unitPrice > 0 && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Calculated Unit Price:</p>
                                                <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(unitPrice)}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {data.total_price} ÷ {data.quantity} = {unitPrice.toFixed(2)}
                                                </p>
                                            </div>
                                            {selectedMedicine && selectedMedicine.average_buy_price > 0 && (
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Previous Avg:</p>
                                                    <p className="text-lg font-semibold text-amber-600">
                                                        {formatCurrency(selectedMedicine.average_buy_price)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {newAveragePrice !== null && selectedMedicine && (
                                            <div className="mt-3 border-t border-blue-200 pt-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-700">New Average Price:</span>
                                                    <span className="text-lg font-bold text-green-600">{formatCurrency(newAveragePrice)}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    ({selectedMedicine.total_stock} × {Number(selectedMedicine.average_buy_price || 0).toFixed(2)}) +
                                                    ({data.quantity} × {unitPrice.toFixed(2)}) ÷ ({selectedMedicine.total_stock} +{' '}
                                                    {parseFloat(data.quantity)})
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Details */}
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-green-900">Payment Details</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
                                            <select
                                                value={data.payment_method}
                                                onChange={(e) => setData('payment_method', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="credit">Credit (Pay Later)</option>
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Paid Amount</label>
                                            <div className="relative">
                                                <CreditCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={data.paid_amount}
                                                    onChange={(e) => setData('paid_amount', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-green-500"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        {data.payment_method === 'cheque' && (
                                            <>
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Cheque No</label>
                                                    <input
                                                        type="text"
                                                        value={data.cheque_no}
                                                        onChange={(e) => setData('cheque_no', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Cheque Date</label>
                                                    <input
                                                        type="date"
                                                        value={data.cheque_date}
                                                        onChange={(e) => setData('cheque_date', e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {data.total_price && (
                                        <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-700">Total Amount:</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(parseFloat(data.total_price))}</span>
                                            </div>
                                            {data.paid_amount && parseFloat(data.paid_amount) > 0 && (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-700">Paid Amount:</span>
                                                        <span className="font-semibold text-green-600">
                                                            {formatCurrency(parseFloat(data.paid_amount))}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-green-300 pt-2">
                                                        <span className="font-medium text-gray-700">Due Amount:</span>
                                                        <span className="font-bold text-red-600">{formatCurrency(getDueAmount())}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {selectedVendor && data.total_price && parseFloat(data.total_price) > 0 && (
                                        <div className="mt-3 rounded border border-red-200 bg-red-50 p-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-red-700">Vendor Total Due (After This Purchase):</span>
                                                <span className="font-semibold text-red-800">
                                                    {formatCurrency(selectedVendor.current_balance + getDueAmount())}
                                                </span>
                                            </div>
                                            {selectedVendor.credit_limit > 0 && (
                                                <div className="mt-1">
                                                    <div className="mb-1 flex justify-between text-xs text-red-600">
                                                        <span>Credit Utilization:</span>
                                                        <span className="font-semibold">{getCreditUtilization().toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-red-200">
                                                        <div
                                                            className={`h-1.5 rounded-full ${
                                                                getCreditUtilization() > 90 ? 'bg-red-600' : 'bg-red-400'
                                                            }`}
                                                            style={{ width: `${Math.min(100, getCreditUtilization())}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Any additional notes..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {processing ? 'Adding Stock...' : 'Add Stock to Inventory'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Sidebar - Recent Purchases */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Recent Purchases */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Recent Purchases</h3>
                            </div>

                            <div className="space-y-3">
                                {recentPurchases.slice(0, 5).map((purchase) => (
                                    <div key={purchase.id} className="border-b border-gray-100 pb-3 last:border-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{purchase.medicine_stock.medicine.name}</p>
                                                {purchase.medicine_stock.vendor && (
                                                    <p className="mt-1 text-xs text-gray-500">{purchase.medicine_stock.vendor.name}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {purchase.quantity} units × {formatCurrency(purchase.unit_price)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-600">{formatCurrency(purchase.total_amount)}</p>
                                                <p className="text-xs text-gray-400">{formatDate(purchase.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
