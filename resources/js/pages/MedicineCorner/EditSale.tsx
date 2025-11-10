// resources/js/Pages/MedicineCorner/EditSale.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    Save,
    User,
    Phone,
    Search,
    Package,
    AlertCircle,
    X,
    ShoppingCart,
    Calculator,
    DollarSign
} from 'lucide-react';

interface MedicineStock {
    id: number;
    available_quantity: number;
    sale_price: number;
    buy_price: number;
    expiry_date: string;
    batch_number: string;
}

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    unit: string;
    is_active: boolean;
    stocks: MedicineStock[];
}

interface Patient {
    id: number;
    name: string;
    phone: string;
    email?: string;
}

interface User {
    id: number;
    name: string;
}

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    buy_price: number;
    medicine_stock: {
        id: number;
        batch_number: string;
        available_quantity: number;
        medicine: {
            id: number;
            name: string;
            generic_name: string;
            unit: string;
        };
    };
}

interface Sale {
    id: number;
    invoice_number: string;
    sale_date: string;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    total_profit: number;
    payment_status: 'paid' | 'partial' | 'pending';
    notes?: string;
    patient?: Patient;
    sold_by: User;
    items: SaleItem[];
}

interface EditSaleProps {
    sale: Sale;
    medicines: Medicine[];
    patients: Patient[];
}

interface CartItem {
    medicine_stock_id: number;
    medicine: Medicine;
    stock: MedicineStock;
    quantity: number;
    unit_price: number;
    original_quantity?: number; // Track original quantity for stock calculation
}

export function EditSale({ sale, medicines, patients }: EditSaleProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [phoneSearch, setPhoneSearch] = useState(sale.patient?.phone || '');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(sale.patient || null);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [discountInput, setDiscountInput] = useState(sale.discount || 0);

    const { data, setData, processing, errors } = useForm({
        items: [] as any[],
        patient_id: sale.patient?.id?.toString() || '',
        discount: sale.discount || 0,
        tax: sale.tax || 0,
        paid_amount: sale.paid_amount || 0,
        customer_name: sale.patient?.name || '',
        customer_phone: sale.patient?.phone || '',
        notes: sale.notes || ''
    });

    // Initialize cart with existing sale items
    useEffect(() => {
        const initialCart: CartItem[] = [];

        sale.items.forEach(item => {
            // Find the medicine in the medicines array
            const medicine = medicines.find(m =>
                m.stocks.some(s => s.id === item.medicine_stock.id)
            );

            if (medicine) {
                // Find the stock
                const stock = medicine.stocks.find(s => s.id === item.medicine_stock.id);

                if (stock) {
                    initialCart.push({
                        medicine_stock_id: item.medicine_stock.id,
                        medicine: medicine,
                        stock: {
                            ...stock,
                            // Add back the sold quantity to available quantity for editing
                            available_quantity: stock.available_quantity + item.quantity
                        },
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        original_quantity: item.quantity
                    });
                } else {
                    // Create a virtual stock entry for items not found in current medicines
                    const virtualMedicine: Medicine = {
                        id: item.medicine_stock.medicine.id,
                        name: item.medicine_stock.medicine.name,
                        generic_name: item.medicine_stock.medicine.generic_name,
                        unit: item.medicine_stock.medicine.unit,
                        is_active: true,
                        stocks: []
                    };

                    const virtualStock: MedicineStock = {
                        id: item.medicine_stock.id,
                        available_quantity: item.quantity + 1000, // Give enough quantity for editing
                        sale_price: item.unit_price,
                        buy_price: item.buy_price,
                        expiry_date: '2025-12-31',
                        batch_number: item.medicine_stock.batch_number
                    };

                    initialCart.push({
                        medicine_stock_id: item.medicine_stock.id,
                        medicine: virtualMedicine,
                        stock: virtualStock,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        original_quantity: item.quantity
                    });
                }
            }
        });

        setCart(initialCart);
    }, [sale, medicines]);

    // Patient search functionality
    useEffect(() => {
        if (phoneSearch.length >= 3) {
            const filtered = patients.filter(patient =>
                patient.phone.includes(phoneSearch) ||
                patient.name.toLowerCase().includes(phoneSearch.toLowerCase())
            );
            setFilteredPatients(filtered.slice(0, 5));
            setShowPatientSuggestions(true);
        } else {
            setFilteredPatients([]);
            setShowPatientSuggestions(false);
        }
    }, [phoneSearch, patients]);

    // Calculate discount amount based on type
    useEffect(() => {
        const subtotal = cart.reduce((sum, item) => {
            const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
            return sum + itemTotal;
        }, 0);

        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = (subtotal * discountInput) / 100;
        } else {
            discountAmount = discountInput;
        }

        setData('discount', Math.max(0, discountAmount));
    }, [cart, discountInput, discountType]);

    // Calculate totals using useMemo for performance
    const calculations = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => {
            const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
            return sum + itemTotal;
        }, 0);

        const discount = Math.max(0, data.discount || 0);
        const tax = Math.max(0, data.tax || 0);
        const totalAmount = Math.max(0, subtotal - discount + tax);
        const paidAmount = Math.max(0, Math.min(totalAmount, data.paid_amount || 0));
        const dueAmount = Math.max(0, totalAmount - paidAmount);

        const totalProfit = cart.reduce((sum, item) => {
            const profit = ((item.unit_price || 0) - (item.stock.buy_price || 0)) * (item.quantity || 0);
            return sum + profit;
        }, 0);

        return {
            subtotal,
            discount,
            tax,
            totalAmount,
            paidAmount,
            dueAmount,
            totalProfit
        };
    }, [cart, data.discount, data.tax, data.paid_amount]);

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount || 0).toLocaleString()}`;
    };

    const filteredMedicines = useMemo(() => {
        return medicines.filter(medicine =>
            medicine.is_active &&
            (medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [medicines, searchTerm]);

    const addToCart = (medicine: Medicine) => {
        const availableStock = medicine.stocks.find(s => s.available_quantity > 0);
        if (!availableStock) return;

        const existingItem = cart.find(item => item.medicine_stock_id === availableStock.id);

        if (existingItem) {
            if (existingItem.quantity < existingItem.stock.available_quantity) {
                setCart(prevCart =>
                    prevCart.map(item =>
                        item.medicine_stock_id === availableStock.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                );
            }
        } else {
            const newItem: CartItem = {
                medicine_stock_id: availableStock.id,
                medicine,
                stock: availableStock,
                quantity: 1,
                unit_price: availableStock.sale_price
            };
            setCart(prevCart => [...prevCart, newItem]);
        }
    };

    const updateQuantity = (stockId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.medicine_stock_id !== stockId));
        } else {
            setCart(prevCart =>
                prevCart.map(item => {
                    if (item.medicine_stock_id === stockId) {
                        const maxQuantity = item.stock.available_quantity;
                        const validQuantity = Math.min(newQuantity, maxQuantity);
                        return { ...item, quantity: validQuantity };
                    }
                    return item;
                })
            );
        }
    };

    const updatePrice = (stockId: number, newPrice: number) => {
        if (newPrice >= 0) {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.medicine_stock_id === stockId
                        ? { ...item, unit_price: newPrice }
                        : item
                )
            );
        }
    };

    const removeFromCart = (stockId: number) => {
        setCart(prevCart => prevCart.filter(item => item.medicine_stock_id !== stockId));
    };

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setData('patient_id', patient.id.toString());
        setData('customer_name', patient.name);
        setData('customer_phone', patient.phone);
        setPhoneSearch(patient.phone);
        setShowPatientSuggestions(false);
    };

    const clearPatient = () => {
        setSelectedPatient(null);
        setData('patient_id', '');
        setData('customer_name', '');
        setData('customer_phone', phoneSearch);
        setShowPatientSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Please add at least one item to the cart');
            return;
        }

        if (calculations.totalAmount < 0) {
            alert('Total amount cannot be negative');
            return;
        }

        if (data.paid_amount > calculations.totalAmount) {
            alert('Paid amount cannot be greater than total amount');
            return;
        }

        // Validate cart items
        for (const item of cart) {
            if (item.quantity <= 0) {
                alert(`Invalid quantity for ${item.medicine.name}`);
                return;
            }
            if (item.unit_price < 0) {
                alert(`Invalid price for ${item.medicine.name}`);
                return;
            }
            if (item.quantity > item.stock.available_quantity) {
                alert(`Insufficient stock for ${item.medicine.name}. Available: ${item.stock.available_quantity}`);
                return;
            }
        }

        const cartItems = cart.map(item => ({
            medicine_stock_id: item.medicine_stock_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        // Use router.put directly like POS uses router.post
        router.put(`/medicine-corner/sales/${sale.id}`, {
            items: cartItems,
            patient_id: data.patient_id || null,
            discount: calculations.discount,
            tax: calculations.tax,
            paid_amount: calculations.paidAmount,
            customer_name: data.customer_name || 'Walk-in Customer',
            customer_phone: data.customer_phone,
            notes: data.notes
        }, {
            onSuccess: () => {
                // Redirect to sale details page
                router.visit(`/medicine-corner/sales/${sale.id}`);
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    return (
        <AdminLayout title={`Edit Sale - ${sale.invoice_number}`}>
            <Head title={`Edit Sale - ${sale.invoice_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/medicine-corner/sales/${sale.id}`}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Sale</h1>
                            <p className="text-gray-600 mt-1">
                                {sale.invoice_number} • {new Date(sale.sale_date).toLocaleDateString('en-GB')}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Original Total</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</div>
                    </div>
                </div>

                {/* Error Messages */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-800 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Please fix the following errors:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {Object.entries(errors).map(([key, message]) => (
                                <li key={key}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Left Side - Medicine Selection */}
                        <div className="xl:col-span-3 space-y-6">
                            {/* Search */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search medicines by name or generic name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Current Cart Items */}
                            {cart.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-gray-900">Current Items</h2>
                                            <span className="text-sm text-gray-500">{cart.length} items</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {cart.map((item) => (
                                                <div key={item.medicine_stock_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 mb-1">
                                                                {item.medicine.name}
                                                            </h3>
                                                            {item.medicine.generic_name && (
                                                                <p className="text-sm text-gray-600 mb-1">
                                                                    {item.medicine.generic_name}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span>Batch: {item.stock.batch_number}</span>
                                                                <span>Available: {item.stock.available_quantity} {item.medicine.unit}</span>
                                                                <span>Buy Price: {formatCurrency(item.stock.buy_price)}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.medicine_stock_id)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Quantity Controls */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Quantity ({item.medicine.unit})
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.medicine_stock_id, item.quantity - 1)}
                                                                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                    disabled={item.quantity <= 1}
                                                                >
                                                                    <Minus className="w-4 h-4" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={item.stock.available_quantity}
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateQuantity(item.medicine_stock_id, parseInt(e.target.value) || 1)}
                                                                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.medicine_stock_id, item.quantity + 1)}
                                                                    disabled={item.quantity >= item.stock.available_quantity}
                                                                    className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Unit Price */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Unit Price (৳)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.unit_price}
                                                                onChange={(e) => updatePrice(item.medicine_stock_id, parseFloat(e.target.value) || 0)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>

                                                        {/* Line Total */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Line Total
                                                            </label>
                                                            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                                                <div className="text-lg font-bold text-green-700">
                                                                    {formatCurrency(item.quantity * item.unit_price)}
                                                                </div>
                                                                <div className="text-sm text-green-600">
                                                                    Profit: {formatCurrency((item.unit_price - item.stock.buy_price) * item.quantity)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Medicine Grid */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add More Medicines</h2>
                                {filteredMedicines.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">
                                            {searchTerm ? 'No medicines found matching your search' : 'Start typing to search medicines'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                        {filteredMedicines.map((medicine) => {
                                            const availableStock = medicine.stocks.find(s => s.available_quantity > 0);
                                            const cartItem = cart.find(item => item.medicine_stock_id === availableStock?.id);
                                            const hasStock = availableStock && availableStock.available_quantity > 0;

                                            return (
                                                <div
                                                    key={medicine.id}
                                                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                                                        hasStock
                                                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    }`}
                                                    onClick={() => hasStock && addToCart(medicine)}
                                                >
                                                    <div className="text-center">
                                                        <div className="mb-2">
                                                            <Package className={`w-6 h-6 mx-auto ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        </div>
                                                        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                                                            {medicine.name}
                                                        </h3>
                                                        {medicine.generic_name && (
                                                            <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                                                                {medicine.generic_name}
                                                            </p>
                                                        )}
                                                        <div className="text-xs text-gray-600 mb-2">
                                                            Stock: {availableStock?.available_quantity || 0} {medicine.unit}
                                                        </div>
                                                        <div className="text-sm font-semibold text-green-600">
                                                            {formatCurrency(availableStock?.sale_price || 0)}
                                                        </div>
                                                        {availableStock?.batch_number && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Batch: {availableStock.batch_number}
                                                            </div>
                                                        )}
                                                        {cartItem && (
                                                            <div className="text-xs text-blue-600 font-medium mt-1">
                                                                In cart: {cartItem.quantity}
                                                            </div>
                                                        )}
                                                        {!hasStock && (
                                                            <div className="text-xs text-red-500 font-medium mt-1">
                                                                Out of Stock
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Customer & Checkout */}
                        <div className="space-y-6">
                            {/* Customer Selection */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>

                                {selectedPatient ? (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <p className="font-medium text-blue-900 text-sm">{selectedPatient.name}</p>
                                                <p className="text-xs text-blue-600">{selectedPatient.phone}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearPatient}
                                            className="p-1 hover:bg-blue-200 rounded"
                                        >
                                            <X className="w-4 h-4 text-blue-600" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative">
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search by phone or name..."
                                                value={phoneSearch}
                                                onChange={(e) => setPhoneSearch(e.target.value)}
                                                onFocus={() => phoneSearch.length >= 3 && setShowPatientSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 200)}
                                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {showPatientSuggestions && filteredPatients.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {filteredPatients.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        type="button"
                                                        onClick={() => selectPatient(patient)}
                                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                                    >
                                                        <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                                                        <p className="text-xs text-gray-500">{patient.phone}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Customer name"
                                                value={data.customer_name}
                                                onChange={(e) => setData('customer_name', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Phone number"
                                                value={data.customer_phone}
                                                onChange={(e) => setData('customer_phone', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Calculation Summary */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calculator className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Subtotal */}
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Subtotal ({cart.length} items):</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(calculations.subtotal)}</span>
                                    </div>

                                    {/* Discount & Tax Inputs */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Discount {discountType === 'percentage' ? '(%)' : '(৳)'}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDiscountType(discountType === 'amount' ? 'percentage' : 'amount');
                                                        setDiscountInput(0);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Switch to {discountType === 'amount' ? '%' : '৳'}
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={discountType === 'percentage' ? 100 : calculations.subtotal}
                                                    value={discountInput}
                                                    onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder={discountType === 'percentage' ? '0-100' : '0'}
                                                />
                                                <div className="w-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                                                    {discountType === 'percentage' ? '%' : '৳'}
                                                </div>
                                            </div>
                                            {discountType === 'percentage' && discountInput > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Amount: {formatCurrency(calculations.discount)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax (৳)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.tax}
                                                onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Calculations Display */}
                                    <div className="space-y-2 pt-3 border-t border-gray-200">
                                        {calculations.discount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-red-600">Discount:</span>
                                                <span className="text-red-600">-{formatCurrency(calculations.discount)}</span>
                                            </div>
                                        )}
                                        {calculations.tax > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Tax:</span>
                                                <span className="text-gray-900">+{formatCurrency(calculations.tax)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-2 border-t border-gray-200">
                                            <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                                            <span className="text-xl font-bold text-blue-600">{formatCurrency(calculations.totalAmount)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Input */}
                                    <div className="pt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (৳)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={calculations.totalAmount}
                                            value={data.paid_amount}
                                            onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />

                                        {/* Payment Status Display */}
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Paid:</span>
                                                <span className="text-green-600 font-medium">{formatCurrency(calculations.paidAmount)}</span>
                                            </div>
                                            {calculations.dueAmount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Due:</span>
                                                    <span className="text-red-600 font-medium">{formatCurrency(calculations.dueAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Status:</span>
                                                <span className={`font-medium ${
                                                    calculations.dueAmount === 0 ? 'text-green-600' :
                                                    calculations.paidAmount === 0 ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                    {calculations.dueAmount === 0 ? 'Paid' : calculations.paidAmount === 0 ? 'Pending' : 'Partial'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit Display */}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-600">Total Profit:</span>
                                            </div>
                                            <span className="text-base font-bold text-green-600">{formatCurrency(calculations.totalProfit)}</span>
                                        </div>
                                        {calculations.totalAmount > 0 && (
                                            <div className="text-xs text-gray-500 text-right mt-1">
                                                Margin: {((calculations.totalProfit / calculations.totalAmount) * 100).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Additional notes for this sale..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={processing || cart.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating Sale...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Update Sale - {formatCurrency(calculations.totalAmount)}
                                        </>
                                    )}
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        href={`/medicine-corner/sales/${sale.id}`}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
                                    >
                                        Cancel
                                    </Link>
                                    {cart.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to clear the cart?')) {
                                                    setCart([]);
                                                }
                                            }}
                                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                                        >
                                            Clear Cart
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-500">Items</div>
                                        <div className="font-medium">{cart.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Total Qty</div>
                                        <div className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Avg Price</div>
                                        <div className="font-medium">
                                            {cart.length > 0 ? formatCurrency(calculations.subtotal / cart.reduce((sum, item) => sum + item.quantity, 0)) : '৳0'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Per Item</div>
                                        <div className="font-medium">
                                            {cart.length > 0 ? formatCurrency(calculations.subtotal / cart.length) : '৳0'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Mobile Floating Summary */}
                {cart.length > 0 && (
                    <div className="xl:hidden fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-medium text-gray-900">
                                    {cart.length} items • {formatCurrency(calculations.totalAmount)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {calculations.dueAmount > 0 ? `Due: ${formatCurrency(calculations.dueAmount)}` : 'Fully Paid'}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                                onClick={handleSubmit}
                            >
                                {processing ? 'Updating...' : 'Update Sale'}
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (calculations.paidAmount / calculations.totalAmount) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Change Detection Warning */}
                {JSON.stringify(cart) !== JSON.stringify([]) && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Unsaved Changes</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default EditSale;
