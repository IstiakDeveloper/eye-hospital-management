// resources/js/Pages/MedicineCorner/EditSale.tsx

import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calculator, DollarSign, Minus, Package, Phone, Plus, Save, Search, Trash2, User, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
        notes: sale.notes || '',
    });

    // Initialize cart with existing sale items
    useEffect(() => {
        const initialCart: CartItem[] = [];

        sale.items.forEach((item) => {
            // Find the medicine in the medicines array
            const medicine = medicines.find((m) => m.stocks.some((s) => s.id === item.medicine_stock.id));

            if (medicine) {
                // Find the stock
                const stock = medicine.stocks.find((s) => s.id === item.medicine_stock.id);

                if (stock) {
                    initialCart.push({
                        medicine_stock_id: item.medicine_stock.id,
                        medicine: medicine,
                        stock: {
                            ...stock,
                            // Add back the sold quantity to available quantity for editing
                            available_quantity: stock.available_quantity + item.quantity,
                        },
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        original_quantity: item.quantity,
                    });
                } else {
                    // Create a virtual stock entry for items not found in current medicines
                    const virtualMedicine: Medicine = {
                        id: item.medicine_stock.medicine.id,
                        name: item.medicine_stock.medicine.name,
                        generic_name: item.medicine_stock.medicine.generic_name,
                        unit: item.medicine_stock.medicine.unit,
                        is_active: true,
                        stocks: [],
                    };

                    const virtualStock: MedicineStock = {
                        id: item.medicine_stock.id,
                        available_quantity: item.quantity + 1000, // Give enough quantity for editing
                        sale_price: item.unit_price,
                        buy_price: item.buy_price,
                        expiry_date: '2025-12-31',
                        batch_number: item.medicine_stock.batch_number,
                    };

                    initialCart.push({
                        medicine_stock_id: item.medicine_stock.id,
                        medicine: virtualMedicine,
                        stock: virtualStock,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        original_quantity: item.quantity,
                    });
                }
            }
        });

        setCart(initialCart);
    }, [sale, medicines]);

    // Patient search functionality
    useEffect(() => {
        if (phoneSearch.length >= 3) {
            const filtered = patients.filter(
                (patient) => patient.phone.includes(phoneSearch) || patient.name.toLowerCase().includes(phoneSearch.toLowerCase()),
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
            totalProfit,
        };
    }, [cart, data.discount, data.tax, data.paid_amount]);

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount || 0).toLocaleString()}`;
    };

    const filteredMedicines = useMemo(() => {
        return medicines.filter(
            (medicine) =>
                medicine.is_active &&
                (medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())),
        );
    }, [medicines, searchTerm]);

    const addToCart = (medicine: Medicine) => {
        const availableStock = medicine.stocks.find((s) => s.available_quantity > 0);
        if (!availableStock) return;

        const existingItem = cart.find((item) => item.medicine_stock_id === availableStock.id);

        if (existingItem) {
            if (existingItem.quantity < existingItem.stock.available_quantity) {
                setCart((prevCart) =>
                    prevCart.map((item) => (item.medicine_stock_id === availableStock.id ? { ...item, quantity: item.quantity + 1 } : item)),
                );
            }
        } else {
            const newItem: CartItem = {
                medicine_stock_id: availableStock.id,
                medicine,
                stock: availableStock,
                quantity: 1,
                unit_price: availableStock.sale_price,
            };
            setCart((prevCart) => [...prevCart, newItem]);
        }
    };

    const updateQuantity = (stockId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart((prevCart) => prevCart.filter((item) => item.medicine_stock_id !== stockId));
        } else {
            setCart((prevCart) =>
                prevCart.map((item) => {
                    if (item.medicine_stock_id === stockId) {
                        const maxQuantity = item.stock.available_quantity;
                        const validQuantity = Math.min(newQuantity, maxQuantity);
                        return { ...item, quantity: validQuantity };
                    }
                    return item;
                }),
            );
        }
    };

    const updatePrice = (stockId: number, newPrice: number) => {
        if (newPrice >= 0) {
            setCart((prevCart) => prevCart.map((item) => (item.medicine_stock_id === stockId ? { ...item, unit_price: newPrice } : item)));
        }
    };

    const removeFromCart = (stockId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.medicine_stock_id !== stockId));
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

        const cartItems = cart.map((item) => ({
            medicine_stock_id: item.medicine_stock_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
        }));

        // Use router.put directly like POS uses router.post
        router.put(
            `/medicine-corner/sales/${sale.id}`,
            {
                items: cartItems,
                patient_id: data.patient_id || null,
                discount: calculations.discount,
                tax: calculations.tax,
                paid_amount: calculations.paidAmount,
                customer_name: data.customer_name || 'Walk-in Customer',
                customer_phone: data.customer_phone,
                notes: data.notes,
            },
            {
                onSuccess: () => {
                    // Redirect to sale details page
                    router.visit(`/medicine-corner/sales/${sale.id}`);
                },
                onError: (errors) => {
                    console.error('Update failed:', errors);
                },
            },
        );
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
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Sale</h1>
                            <p className="mt-1 text-gray-600">
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
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Please fix the following errors:</span>
                        </div>
                        <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                            {Object.entries(errors).map(([key, message]) => (
                                <li key={key}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                        {/* Left Side - Medicine Selection */}
                        <div className="space-y-6 xl:col-span-3">
                            {/* Search */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search medicines by name or generic name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-12 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Current Cart Items */}
                            {cart.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                                    <div className="border-b border-gray-200 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-gray-900">Current Items</h2>
                                            <span className="text-sm text-gray-500">{cart.length} items</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {cart.map((item) => (
                                                <div key={item.medicine_stock_id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                    <div className="mb-3 flex items-start justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="mb-1 font-medium text-gray-900">{item.medicine.name}</h3>
                                                            {item.medicine.generic_name && (
                                                                <p className="mb-1 text-sm text-gray-600">{item.medicine.generic_name}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span>Batch: {item.stock.batch_number}</span>
                                                                <span>
                                                                    Available: {item.stock.available_quantity} {item.medicine.unit}
                                                                </span>
                                                                <span>Buy Price: {formatCurrency(item.stock.buy_price)}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.medicine_stock_id)}
                                                            className="rounded-lg p-2 text-red-600 hover:bg-red-100"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        {/* Quantity Controls */}
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                                Quantity ({item.medicine.unit})
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.medicine_stock_id, item.quantity - 1)}
                                                                    className="rounded bg-gray-200 p-2 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                                                                    disabled={item.quantity <= 1}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={item.stock.available_quantity}
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        updateQuantity(item.medicine_stock_id, parseInt(e.target.value) || 1)
                                                                    }
                                                                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuantity(item.medicine_stock_id, item.quantity + 1)}
                                                                    disabled={item.quantity >= item.stock.available_quantity}
                                                                    className="rounded bg-gray-200 p-2 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Unit Price */}
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">Unit Price (৳)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.unit_price}
                                                                onChange={(e) => updatePrice(item.medicine_stock_id, parseFloat(e.target.value) || 0)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        {/* Line Total */}
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">Line Total</label>
                                                            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
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
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900">Add More Medicines</h2>
                                {filteredMedicines.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                        <p className="text-sm">
                                            {searchTerm ? 'No medicines found matching your search' : 'Start typing to search medicines'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {filteredMedicines.map((medicine) => {
                                            const availableStock = medicine.stocks.find((s) => s.available_quantity > 0);
                                            const cartItem = cart.find((item) => item.medicine_stock_id === availableStock?.id);
                                            const hasStock = availableStock && availableStock.available_quantity > 0;

                                            return (
                                                <div
                                                    key={medicine.id}
                                                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                                        hasStock
                                                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                            : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                                                    }`}
                                                    onClick={() => hasStock && addToCart(medicine)}
                                                >
                                                    <div className="text-center">
                                                        <div className="mb-2">
                                                            <Package className={`mx-auto h-6 w-6 ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        </div>
                                                        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-900">{medicine.name}</h3>
                                                        {medicine.generic_name && (
                                                            <p className="mb-1 line-clamp-1 text-xs text-gray-500">{medicine.generic_name}</p>
                                                        )}
                                                        <div className="mb-2 text-xs text-gray-600">
                                                            Stock: {availableStock?.available_quantity || 0} {medicine.unit}
                                                        </div>
                                                        <div className="text-sm font-semibold text-green-600">
                                                            {formatCurrency(availableStock?.sale_price || 0)}
                                                        </div>
                                                        {availableStock?.batch_number && (
                                                            <div className="mt-1 text-xs text-gray-500">Batch: {availableStock.batch_number}</div>
                                                        )}
                                                        {cartItem && (
                                                            <div className="mt-1 text-xs font-medium text-blue-600">In cart: {cartItem.quantity}</div>
                                                        )}
                                                        {!hasStock && <div className="mt-1 text-xs font-medium text-red-500">Out of Stock</div>}
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
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900">Customer</h2>

                                {selectedPatient ? (
                                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">{selectedPatient.name}</p>
                                                <p className="text-xs text-blue-600">{selectedPatient.phone}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={clearPatient} className="rounded p-1 hover:bg-blue-200">
                                            <X className="h-4 w-4 text-blue-600" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative space-y-3">
                                        <div className="relative">
                                            <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by phone or name..."
                                                value={phoneSearch}
                                                onChange={(e) => setPhoneSearch(e.target.value)}
                                                onFocus={() => phoneSearch.length >= 3 && setShowPatientSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 200)}
                                                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {showPatientSuggestions && filteredPatients.length > 0 && (
                                            <div className="absolute z-10 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {filteredPatients.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        type="button"
                                                        onClick={() => selectPatient(patient)}
                                                        className="w-full border-b border-gray-100 p-3 text-left last:border-0 hover:bg-gray-50"
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">{patient.name}</p>
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
                                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Phone number"
                                                value={data.customer_phone}
                                                onChange={(e) => setData('customer_phone', e.target.value)}
                                                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Calculation Summary */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Subtotal */}
                                    <div className="flex items-center justify-between border-b border-gray-100 py-2">
                                        <span className="text-sm text-gray-600">Subtotal ({cart.length} items):</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(calculations.subtotal)}</span>
                                    </div>

                                    {/* Discount & Tax Inputs */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Discount {discountType === 'percentage' ? '(%)' : '(৳)'}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDiscountType(discountType === 'amount' ? 'percentage' : 'amount');
                                                        setDiscountInput(0);
                                                    }}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
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
                                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                    placeholder={discountType === 'percentage' ? '0-100' : '0'}
                                                />
                                                <div className="flex w-12 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm font-medium text-gray-700">
                                                    {discountType === 'percentage' ? '%' : '৳'}
                                                </div>
                                            </div>
                                            {discountType === 'percentage' && discountInput > 0 && (
                                                <div className="mt-1 text-xs text-gray-500">Amount: {formatCurrency(calculations.discount)}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Tax (৳)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.tax}
                                                onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Calculations Display */}
                                    <div className="space-y-2 border-t border-gray-200 pt-3">
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
                                        <div className="flex items-center justify-between border-t border-gray-200 py-2">
                                            <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                                            <span className="text-xl font-bold text-blue-600">{formatCurrency(calculations.totalAmount)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Input */}
                                    <div className="pt-3">
                                        <label className="mb-1 block text-sm font-medium text-gray-700">Paid Amount (৳)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={calculations.totalAmount}
                                            value={data.paid_amount}
                                            onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            required
                                        />

                                        {/* Payment Status Display */}
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Paid:</span>
                                                <span className="font-medium text-green-600">{formatCurrency(calculations.paidAmount)}</span>
                                            </div>
                                            {calculations.dueAmount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Due:</span>
                                                    <span className="font-medium text-red-600">{formatCurrency(calculations.dueAmount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Status:</span>
                                                <span
                                                    className={`font-medium ${
                                                        calculations.dueAmount === 0
                                                            ? 'text-green-600'
                                                            : calculations.paidAmount === 0
                                                              ? 'text-red-600'
                                                              : 'text-amber-600'
                                                    }`}
                                                >
                                                    {calculations.dueAmount === 0 ? 'Paid' : calculations.paidAmount === 0 ? 'Pending' : 'Partial'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit Display */}
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-600">Total Profit:</span>
                                            </div>
                                            <span className="text-base font-bold text-green-600">{formatCurrency(calculations.totalProfit)}</span>
                                        </div>
                                        {calculations.totalAmount > 0 && (
                                            <div className="mt-1 text-right text-xs text-gray-500">
                                                Margin: {((calculations.totalProfit / calculations.totalAmount) * 100).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    placeholder="Additional notes for this sale..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={processing || cart.length === 0}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Updating Sale...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Update Sale - {formatCurrency(calculations.totalAmount)}
                                        </>
                                    )}
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        href={`/medicine-corner/sales/${sale.id}`}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
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
                                            className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
                                        >
                                            Clear Cart
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="rounded-xl bg-gray-50 p-4">
                                <h3 className="mb-3 text-sm font-medium text-gray-900">Quick Stats</h3>
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
                                            {cart.length > 0
                                                ? formatCurrency(calculations.subtotal / cart.reduce((sum, item) => sum + item.quantity, 0))
                                                : '৳0'}
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
                    <div className="fixed right-4 bottom-4 left-4 z-40 rounded-lg border border-gray-200 bg-white p-4 shadow-lg xl:hidden">
                        <div className="mb-2 flex items-center justify-between">
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
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
                                onClick={handleSubmit}
                            >
                                {processing ? 'Updating...' : 'Update Sale'}
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-green-600 transition-all duration-300"
                                style={{ width: `${Math.min(100, (calculations.paidAmount / calculations.totalAmount) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Change Detection Warning */}
                {JSON.stringify(cart) !== JSON.stringify([]) && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className="rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-amber-800 shadow-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
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
