import AdminLayout from '@/layouts/admin-layout';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    Edit,
    Package,
    Save,
    Search,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    const [deleting, setDeleting] = useState(false);

    // Ensure HTML `type="date"` always gets `YYYY-MM-DD`.
    // Laravel may send ISO strings like `2026-03-30T00:00:00.000000Z`.
    const normalizeDateForInput = (date?: string | null) => {
        if (!date) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const tIndex = date.indexOf('T');
        if (tIndex !== -1) return date.slice(0, 10);
        return date.slice(0, 10);
    };

    const {
        data,
        setData,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        vendor_id: stock.vendor_id ? stock.vendor_id.toString() : '',
        medicine_id: stock.medicine_id ? stock.medicine_id.toString() : '',
        batch_number: stock.batch_number || '',
        expiry_date: normalizeDateForInput(stock.expiry_date),
        quantity: stock.quantity ? stock.quantity.toString() : '',
        // Consistent with addStock: send total_price (not unit buy_price).
        total_price: stock.total_purchase_amount !== undefined ? stock.total_purchase_amount.toString() : '',
        // Hidden field: batch sale_price (drives standard_sale_price on save via latest-batch sync).
        sale_price: (stock.sale_price ?? stock.medicine?.standard_sale_price ?? 0).toString(),
        paid_amount: stock.paid_amount ? stock.paid_amount.toString() : '0',
        payment_method: stock.payment_method || 'credit',
        cheque_no: stock.cheque_no || '',
        cheque_date: stock.cheque_date || '',
        notes: stock.notes || '',
    });

    // Set selected medicine and vendor from medicines and vendors arrays if not in stock object
    useEffect(() => {
        if (!selectedMedicine && stock.medicine_id) {
            const medicine = medicines.find((m) => m.id === stock.medicine_id);
            if (medicine) setSelectedMedicine(medicine);
        }
        if (!selectedVendor && stock.vendor_id) {
            const vendor = vendors.find((v) => v.id === stock.vendor_id);
            if (vendor) setSelectedVendor(vendor);
        }
    }, [medicines, vendors, stock.medicine_id, stock.vendor_id, selectedMedicine, selectedVendor]);

    const formatCurrency = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
        return `৳${formatted}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const filteredMedicines = medicines.filter(
        (medicine) =>
            medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) || medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('medicine-corner.update-stock', stock.id));
    };

    const canDelete = stock.available_quantity === stock.quantity;
    const handleDelete = () => {
        if (!canDelete) {
            alert('Cannot delete this stock batch because some units were already sold.');
            return;
        }

        const ok = confirm(
            `Delete this stock entry?\n\nMedicine: ${selectedMedicine?.name ?? 'N/A'}\nBatch: ${stock.batch_number}\nQuantity: ${stock.quantity}\n\nThis will refund any paid amount back to Hospital Account and remove vendor purchase records.`,
        );
        if (!ok) return;

        setDeleting(true);
        destroy(route('medicine-corner.delete-stock', stock.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
        });
    };

    const handleMedicineSelect = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setData({
            ...data,
            medicine_id: medicine.id.toString(),
            sale_price: medicine.standard_sale_price.toString(),
        });
        setSearchTerm('');
    };

    const handleVendorSelect = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setData({
            ...data,
            vendor_id: vendor.id.toString(),
        });
    };

    const getTotalAmount = () => {
        if (data.total_price) {
            return parseFloat(data.total_price);
        }
        return 0;
    };

    const getUnitPrice = () => {
        const qty = parseFloat(data.quantity || '0');
        const total = parseFloat(data.total_price || '0');
        if (!qty || qty <= 0) return 0;
        return total / qty;
    };

    const getDueAmount = () => {
        const total = getTotalAmount();
        const paid = parseFloat(data.paid_amount) || 0;
        return Math.max(0, total - paid);
    };

    const getCreditUtilization = () => {
        if (!selectedVendor || selectedVendor.credit_limit === 0) return 0;
        const stockDueAmount = stock.due_amount || 0;
        const currentDue = selectedVendor.id === stock.vendor_id ? selectedVendor.current_balance - stockDueAmount : selectedVendor.current_balance;
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
                            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Stock Entry</h1>
                            <p className="mt-1 text-gray-600">Update stock information for batch: {stock.batch_number}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Original Purchase Date</p>
                        <p className="text-lg font-semibold text-blue-600">{formatDate(stock.purchase_date)}</p>
                    </div>
                </div>

                {/* Current Stock Info */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-blue-900">Current Stock Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
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
                            <div
                                className={`font-semibold ${
                                    (stock.payment_status || 'pending') === 'paid'
                                        ? 'text-green-600'
                                        : (stock.payment_status || 'pending') === 'partial'
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                }`}
                            >
                                {(stock.payment_status || 'pending').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-lg bg-orange-100 p-2">
                                    <Edit className="h-5 w-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Update Stock Information</h2>
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
                                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-green-900">{selectedVendor.name}</span>
                                                {selectedVendor.id !== stock.vendor_id && (
                                                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
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
                                                    <span
                                                        className={`font-semibold ${getCreditUtilization() > 80 ? 'text-red-600' : 'text-green-600'}`}
                                                    >
                                                        {getCreditUtilization().toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Medicine Selection */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Select Medicine *</label>

                                    {/* Current Medicine Display */}
                                    {selectedMedicine ? (
                                        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium text-blue-900">Current: {selectedMedicine.name}</span>
                                                {selectedMedicine.id !== stock.medicine_id && (
                                                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                                                        Medicine Changed
                                                    </span>
                                                )}
                                            </div>
                                            {selectedMedicine.generic_name && (
                                                <div className="mt-1 text-sm text-blue-700">{selectedMedicine.generic_name}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                <span className="font-medium text-yellow-800">No medicine selected - Please select a medicine</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search to change medicine..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {searchTerm && (
                                        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                                            {filteredMedicines.map((medicine) => (
                                                <button
                                                    key={medicine.id}
                                                    type="button"
                                                    onClick={() => handleMedicineSelect(medicine)}
                                                    className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                                                        medicine.id === selectedMedicine.id ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="font-medium text-gray-900">{medicine.name}</div>
                                                    {medicine.generic_name && <div className="text-sm text-gray-600">{medicine.generic_name}</div>}
                                                    <div className="text-sm text-blue-600">
                                                        Standard Price: {formatCurrency(medicine.standard_sale_price)}
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredMedicines.length === 0 && (
                                                <div className="px-4 py-3 text-center text-gray-500">No medicines found</div>
                                            )}
                                        </div>
                                    )}

                                    {errors.medicine_id && <p className="mt-1 text-sm text-red-600">{errors.medicine_id}</p>}
                                </div>

                                {/* Batch and Expiry */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Batch Number *</label>
                                        <input
                                            type="text"
                                            value={data.batch_number}
                                            onChange={(e) => setData('batch_number', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., BATCH001"
                                        />
                                        {errors.batch_number && <p className="mt-1 text-sm text-red-600">{errors.batch_number}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Expiry Date *</label>
                                        <div className="relative">
                                            <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="date"
                                                value={data.expiry_date}
                                                onChange={(e) => setData('expiry_date', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        {errors.expiry_date && <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>}
                                    </div>
                                </div>

                                {/* Quantity and Prices */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Quantity *</label>
                                        <div className="relative">
                                            <Package className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="number"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0"
                                                min="1"
                                            />
                                        </div>
                                        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                                        {getQuantityChangeWarning() && <p className="mt-1 text-sm text-red-600">{getQuantityChangeWarning()}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Total Purchase Price *</label>
                                        <div className="relative">
                                            <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.total_price}
                                                onChange={(e) => setData('total_price', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                min="0"
                                            />
                                        </div>
                                        {errors.total_price && <p className="mt-1 text-sm text-red-600">{errors.total_price}</p>}
                                        <p className="mt-1 text-xs text-gray-500">Unit price: {getUnitPrice().toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="border-t pt-4">
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Payment Details</h3>

                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method *</label>
                                            <select
                                                value={data.payment_method}
                                                onChange={(e) => setData('payment_method', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                                    step="0.01"
                                                    value={data.paid_amount}
                                                    onChange={(e) => setData('paid_amount', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Cheque Number</label>
                                                <input
                                                    type="text"
                                                    value={data.cheque_no}
                                                    onChange={(e) => setData('cheque_no', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Cheque number"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Cheque Date</label>
                                                <input
                                                    type="date"
                                                    value={data.cheque_date}
                                                    onChange={(e) => setData('cheque_date', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Total Calculation & Changes Comparison */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Original Values */}
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <h4 className="mb-3 font-medium text-gray-900">Original Values</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Total Purchase:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(stock.total_purchase_amount || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Paid Amount:</span>
                                                <span className="font-semibold text-blue-600">{formatCurrency(stock.paid_amount || 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Due Amount:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(stock.due_amount || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Values */}
                                    {data.quantity && data.total_price && (
                                        <div className="rounded-lg bg-blue-50 p-4">
                                            <h4 className="mb-3 font-medium text-blue-900">New Values</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Total Purchase:</span>
                                                    <span
                                                        className={`font-semibold ${
                                                            getTotalAmount() !== (stock.total_purchase_amount || 0)
                                                                ? 'text-orange-600'
                                                                : 'text-blue-900'
                                                        }`}
                                                    >
                                                        {formatCurrency(getTotalAmount())}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Paid Amount:</span>
                                                    <span
                                                        className={`font-semibold ${
                                                            parseFloat(data.paid_amount || '0') !== (stock.paid_amount || 0)
                                                                ? 'text-orange-600'
                                                                : 'text-blue-600'
                                                        }`}
                                                    >
                                                        {formatCurrency(parseFloat(data.paid_amount) || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Due Amount:</span>
                                                    <span className={`font-semibold ${getDueAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(getDueAmount())}
                                                    </span>
                                                </div>
                                                {data.sale_price && (
                                                    <div className="flex justify-between">
                                                        <span className="text-blue-700">Expected Profit:</span>
                                                        <span className="font-semibold text-purple-600">
                                                            {formatCurrency(
                                                                (parseFloat(data.sale_price) - getUnitPrice()) * parseFloat(data.quantity),
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any additional notes about this purchase update..."
                                    />
                                    {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing || getQuantityChangeWarning() !== null || !selectedMedicine || !selectedVendor}
                                        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:bg-gray-400"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Updating Stock...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Update Stock
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting || processing || !canDelete}
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-300"
                                        title={!canDelete ? 'Cannot delete: some units were already sold' : 'Delete this stock entry'}
                                    >
                                        {deleting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="h-4 w-4" />
                                                Delete Stock
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Stock History & Information */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-lg bg-purple-100 p-2">
                                    <Package className="h-5 w-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Stock Information</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Stock Status */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <h4 className="mb-3 font-medium text-gray-900">Current Status</h4>
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
                                            <span className="font-semibold text-red-600">{stock.quantity - stock.available_quantity}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning Messages */}
                                {stock.available_quantity !== stock.quantity && (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm font-medium text-yellow-800">Partial Stock Sold</span>
                                        </div>
                                        <p className="mt-1 text-xs text-yellow-700">
                                            {stock.quantity - stock.available_quantity} units have been sold from this batch. Quantity changes may
                                            affect availability.
                                        </p>
                                    </div>
                                )}

                                {/* Vendor Information */}
                                {selectedVendor ? (
                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <h4 className="mb-3 font-medium text-gray-900">Original Vendor</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-medium text-blue-600">{selectedVendor.name}</div>
                                            {selectedVendor.company_name && <div className="text-gray-600">{selectedVendor.company_name}</div>}
                                            <div className="text-gray-600">Current Due: {formatCurrency(selectedVendor.current_balance)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                        <h4 className="mb-3 font-medium text-yellow-800">Vendor Information</h4>
                                        <div className="text-sm text-yellow-700">No vendor information available. Please select a vendor.</div>
                                    </div>
                                )}

                                {/* Medicine Information */}
                                {selectedMedicine ? (
                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <h4 className="mb-3 font-medium text-gray-900">Original Medicine</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-medium text-blue-600">{selectedMedicine.name}</div>
                                            {selectedMedicine.generic_name && <div className="text-gray-600">{selectedMedicine.generic_name}</div>}
                                            <div className="text-gray-600">
                                                Standard Price: {formatCurrency(selectedMedicine.standard_sale_price)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                        <h4 className="mb-3 font-medium text-yellow-800">Medicine Information</h4>
                                        <div className="text-sm text-yellow-700">No medicine information available. Please select a medicine.</div>
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
