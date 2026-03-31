import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Calculator,
    Calendar,
    ChevronDown,
    Clock,
    Eye,
    Glasses,
    Minus,
    Package,
    Phone,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Frame {
    id: number;
    brand?: string;
    model?: string;
    color?: string;
    selling_price: number;
    stock_quantity: number;
    full_name?: string;
    formatted_size?: string;
}

interface CompleteGlasses {
    id: number;
    sku?: string;
    selling_price: number;
    stock_quantity: number;
    sphere_power?: number;
    full_name?: string;
    frame?: Frame;
    lens_type?: {
        id: number;
        name: string;
    };
}

interface LensType {
    id: number;
    name?: string;
    type?: string;
    material?: string;
    price: number;
    stock_quantity: number;
}

interface Customer {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gender?: string;
    display_name: string;
    total_visits?: number;
    last_visit?: string;
}

interface POSProps {
    frames: Frame[];
    completeGlasses: CompleteGlasses[];
    lensTypes: LensType[];
    recentCustomers: Customer[];
    todaySalesCount: number;
    lastInvoiceNumber: string;
}

interface CartItem {
    item_id: number;
    item_type: 'frame' | 'complete_glasses' | 'lens';
    item_name: string;
    quantity: number;
    price: number;
    stock: number;
    details: string;
}

export default function POS({ frames, completeGlasses, lensTypes, recentCustomers, todaySalesCount, lastInvoiceNumber }: POSProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'frames' | 'complete' | 'lenses'>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showInvoice, setShowInvoice] = useState(false);
    const [saleMode, setSaleMode] = useState<'product' | 'fitting' | null>(null); // New state for sale mode

    // Customer search states
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showRecentCustomers, setShowRecentCustomers] = useState(false);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    const customerSearchRef = useRef<HTMLInputElement>(null);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        sale_date: new Date().toISOString().split('T')[0], // Default to today's date
        customer_id: null as number | null,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        items: [],
        glass_fitting_price: 0,
        discount_type: 'amount',
        discount_value: 0,
        advance_payment: 0,
        payment_method: 'cash' as 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket',
        transaction_id: '',
        notes: '',
    });

    const formatCurrency = (amount: number | null | undefined) => {
        const numericAmount = Number(amount) || 0;
        return `৳${Math.round(numericAmount)}`;
    };

    const formatDateDisplay = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dateString);
        selectedDate.setHours(0, 0, 0, 0);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];

        if (selectedDate.getTime() === today.getTime()) {
            return `Today (${dayName})`;
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (selectedDate.getTime() === yesterday.getTime()) {
            return `Yesterday (${dayName})`;
        }

        return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (${dayName})`;
    };

    // Customer search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (customerSearch && customerSearch.length >= 2) {
                searchCustomers(customerSearch);
            } else {
                setCustomerResults([]);
                setShowCustomerDropdown(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [customerSearch]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
                setShowRecentCustomers(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchCustomers = async (query: string) => {
        setIsSearchingCustomer(true);
        try {
            const response = await fetch(`/optics-seller/search-customer?q=${encodeURIComponent(query)}`);
            const customers = await response.json();
            setCustomerResults(customers);
            setShowCustomerDropdown(customers.length > 0);
        } catch (error) {
            console.error('Customer search failed:', error);
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.display_name);
        setData({
            ...data,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_email: customer.email || '',
        });
        setShowCustomerDropdown(false);
        setShowRecentCustomers(false);
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerSearch('');
        setSaleMode(null); // Reset sale mode when clearing customer
        setCart([]); // Clear cart as well
        setData({
            ...data,
            customer_id: null,
            customer_name: '',
            customer_phone: '',
            customer_email: '',
            // Keep sale_date when clearing customer
        });
    };

    const handleManualCustomerInput = (field: 'customer_name' | 'customer_phone' | 'customer_email', value: string) => {
        // If manually editing and there's a selected customer, clear the selection
        if (selectedCustomer && field === 'customer_name' && value !== selectedCustomer.name) {
            setSelectedCustomer(null);
            setData({ ...data, customer_id: null });
        }
        setData(field, value);
    };

    // Handle sale mode selection - no validation, allow customer entry later
    const handleModeSelection = (mode: 'product' | 'fitting') => {
        setSaleMode(mode);
    };

    // Combine all items for search
    const allItems = [
        ...frames.map((item) => ({
            id: item.id,
            type: 'frame' as const,
            name: item.full_name || `${item.brand || ''} ${item.model || ''}`.trim() || 'Unknown Frame',
            price: item.selling_price || 0,
            stock: item.stock_quantity || 0,
            details: `${item.color || ''} | ${item.formatted_size || ''}`.replace('| ', '').replace(' |', '') || 'No details',
        })),
        ...completeGlasses.map((item) => ({
            id: item.id,
            type: 'complete_glasses' as const,
            name: item.full_name || item.sku || 'Unknown Complete Glasses',
            price: item.selling_price || 0,
            stock: item.stock_quantity || 0,
            details: `Power: ${item.sphere_power || 'N/A'}`,
        })),
        ...lensTypes.map((item) => ({
            id: item.id,
            type: 'lens' as const,
            name: item.name || 'Unknown Lens',
            price: item.price || 0,
            stock: item.stock_quantity || 0,
            details: `${item.type || ''} | ${item.material || ''}`.replace('| ', '').replace(' |', '') || 'No details',
        })),
    ];

    const filteredItems = allItems.filter((item) => {
        const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'frames' && item.type === 'frame') ||
            (activeTab === 'complete' && item.type === 'complete_glasses') ||
            (activeTab === 'lenses' && item.type === 'lens');
        return matchesSearch && matchesTab && item.stock > 0;
    });

    const addToCart = (item: (typeof allItems)[0]) => {
        const existingItem = cart.find((cartItem) => cartItem.item_id === item.id && cartItem.item_type === item.type);

        if (existingItem) {
            if (existingItem.quantity < item.stock) {
                setCart(
                    cart.map((cartItem) =>
                        cartItem.item_id === item.id && cartItem.item_type === item.type
                            ? { ...cartItem, quantity: cartItem.quantity + 1 }
                            : cartItem,
                    ),
                );
            }
        } else {
            setCart([
                ...cart,
                {
                    item_id: item.id,
                    item_type: item.type,
                    item_name: item.name,
                    quantity: 1,
                    price: item.price,
                    stock: item.stock,
                    details: item.details,
                },
            ]);
        }
    };

    const updateQuantity = (itemId: number, itemType: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(cart.filter((item) => !(item.item_id === itemId && item.item_type === itemType)));
        } else {
            const item = cart.find((item) => item.item_id === itemId && item.item_type === itemType);
            if (item && newQuantity <= item.stock) {
                setCart(
                    cart.map((cartItem) =>
                        cartItem.item_id === itemId && cartItem.item_type === itemType ? { ...cartItem, quantity: newQuantity } : cartItem,
                    ),
                );
            }
        }
    };

    const removeFromCart = (itemId: number, itemType: string) => {
        setCart(cart.filter((item) => !(item.item_id === itemId && item.item_type === itemType)));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const fittingCharge = data.glass_fitting_price || 0;

    // Calculate discount amount
    const discountAmount =
        data.discount_type === 'percentage' ? ((subtotal + fittingCharge) * (data.discount_value || 0)) / 100 : data.discount_value || 0;

    const totalAmount = subtotal + fittingCharge - discountAmount;
    const dueAmount = totalAmount - (data.advance_payment || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Allow sale with only fitting charge (no items required)
        const hasFittingCharge = fittingCharge > 0;
        const hasItems = cart.length > 0;

        if (!hasItems && !hasFittingCharge) {
            alert('Please add items to cart or enter fitting charge');
            return;
        }

        if (!data.customer_name || data.customer_name.trim() === '') {
            alert('Please enter customer name');
            return;
        }

        const cartItems = cart.map((item) => ({
            type: item.item_type,
            id: item.item_id,
            quantity: item.quantity,
            price: item.price,
        }));

        router.post(
            '/optics-seller/pos/sale',
            {
                sale_date: data.sale_date,
                customer_id: data.customer_id,
                customer_name: data.customer_name || 'Walk-in Customer',
                customer_phone: data.customer_phone,
                customer_email: data.customer_email,
                items: cartItems,
                glass_fitting_price: data.glass_fitting_price || 0,
                discount: discountAmount,
                advance_payment: data.advance_payment || 0,
                payment_method: data.payment_method,
                transaction_id: data.transaction_id,
                notes: data.notes,
            },
            {
                onSuccess: () => {
                    setShowInvoice(true);
                    setCart([]);
                    setSaleMode(null); // Reset sale mode after successful sale
                    clearCustomer();
                    reset(
                        'customer_id',
                        'customer_name',
                        'customer_phone',
                        'customer_email',
                        'items',
                        'glass_fitting_price',
                        'discount_type',
                        'discount_value',
                        'advance_payment',
                        'payment_method',
                        'transaction_id',
                        'notes',
                    );
                    // Keep sale_date intact for next sale
                },
                onError: (errors) => {
                    console.error('Sale failed:', errors);
                    alert('Sale failed. Please try again.');
                },
            },
        );
    };

    return (
        <AdminLayout title="Optics POS">
            <Head title="Optics POS" />

            <div className="flex h-screen flex-col bg-gray-50">
                {/* Compact Header */}
                <div className="flex items-center justify-between border-b bg-white px-4 py-2">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">Optics POS System</h1>
                        <div className="text-sm text-gray-600">
                            Today: {todaySalesCount} • Last: {lastInvoiceNumber}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Date Picker */}
                        <div className="relative">
                            <label
                                htmlFor="sale-date-picker"
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 transition-colors hover:bg-blue-100"
                            >
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">{formatDateDisplay(data.sale_date)}</span>
                            </label>
                            <input
                                id="sale-date-picker"
                                type="date"
                                value={data.sale_date}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setData('sale_date', e.target.value)}
                                className="absolute top-0 left-0 h-full w-full cursor-pointer opacity-0"
                            />
                        </div>
                        <div className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel - Mode Selection (always visible) */}
                    {!saleMode && (
                        <div className="flex flex-1 items-center justify-center border-r bg-gradient-to-br from-white to-gray-50">
                            <div className="px-6 text-center">
                                <div className="mb-3">
                                    <ShoppingCart className="mx-auto h-16 w-16 text-blue-300" />
                                </div>
                                <h2 className="mb-1 text-2xl font-semibold text-gray-800">Select Sale Type</h2>
                                <p className="mb-6 text-gray-600">Choose how you want to process this sale</p>

                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('product')}
                                        className="flex h-40 w-48 transform flex-col items-center justify-center rounded-xl border-2 border-blue-300 bg-white p-6 shadow-md transition-all hover:scale-105 hover:border-blue-400 hover:shadow-xl"
                                        aria-label="Start product sale"
                                    >
                                        <ShoppingCart className="mb-3 h-12 w-12 text-blue-600" />
                                        <span className="mb-1 text-base font-bold text-gray-800">Add Products</span>
                                        <span className="text-xs text-gray-500">Frames, Lenses, etc.</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('fitting')}
                                        className="flex h-40 w-48 transform flex-col items-center justify-center rounded-xl border-2 border-purple-300 bg-white p-6 shadow-md transition-all hover:scale-105 hover:border-purple-400 hover:shadow-xl"
                                        aria-label="Start fitting only sale"
                                    >
                                        <Glasses className="mb-3 h-12 w-12 text-purple-600" />
                                        <span className="mb-1 text-base font-bold text-gray-800">Fitting Only</span>
                                        <span className="text-xs text-gray-500">No products</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Panel - Fitting mode message */}
                    {saleMode === 'fitting' && (
                        <div className="flex flex-1 items-center justify-center border-r bg-gradient-to-br from-purple-50 to-pink-50">
                            <div className="px-8 text-center">
                                <div className="mb-4">
                                    <Glasses className="mx-auto h-20 w-20 text-purple-400" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-gray-800">Fitting Service Only</h2>
                                <p className="mb-4 text-gray-600">No products will be added to this sale</p>
                                <p className="text-sm text-gray-500">Enter fitting charge and payment details on the right panel</p>
                            </div>
                        </div>
                    )}

                    {/* Left Panel - Products (Show only in product mode) */}
                    {saleMode === 'product' && (
                        <div className="flex flex-1 flex-col border-r bg-white">
                            {/* Search */}
                            <div className="border-b p-3">
                                <div className="relative mb-3">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1">
                                    {[
                                        { key: 'all', label: 'All', icon: Package },
                                        { key: 'frames', label: 'Frames', icon: Glasses },
                                        { key: 'complete', label: 'Complete', icon: Eye },
                                        { key: 'lenses', label: 'Lenses', icon: Package },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key as any)}
                                            className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors ${
                                                activeTab === key ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icon className="h-3 w-3" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="flex-1 overflow-y-auto p-3">
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {filteredItems.map((item) => {
                                        const cartItem = cart.find((cartItem) => cartItem.item_id === item.id && cartItem.item_type === item.type);
                                        const hasStock = item.stock > 0;

                                        return (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                                    hasStock
                                                        ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                                        : 'border-gray-100 bg-gray-50 opacity-60'
                                                }`}
                                                onClick={() => hasStock && addToCart(item)}
                                            >
                                                <div className="text-center">
                                                    <div className="mb-2">
                                                        {item.type === 'frame' && (
                                                            <Glasses className={`mx-auto h-6 w-6 ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        )}
                                                        {item.type === 'complete_glasses' && (
                                                            <Eye className={`mx-auto h-6 w-6 ${hasStock ? 'text-green-600' : 'text-gray-400'}`} />
                                                        )}
                                                        {item.type === 'lens' && (
                                                            <Package
                                                                className={`mx-auto h-6 w-6 ${hasStock ? 'text-purple-600' : 'text-gray-400'}`}
                                                            />
                                                        )}
                                                    </div>
                                                    <h3 className="mb-1 line-clamp-2 text-xs font-medium text-gray-900">{item.name}</h3>
                                                    <p className="mb-1 line-clamp-1 text-xs text-gray-500">{item.details}</p>
                                                    <div className="mb-2 text-xs text-gray-600">Stock: {item.stock}</div>
                                                    <div className="text-sm font-semibold text-green-600">{formatCurrency(item.price)}</div>
                                                    {cartItem && (
                                                        <div className="mt-1 text-xs font-medium text-blue-600">Cart: {cartItem.quantity}</div>
                                                    )}
                                                    {!hasStock && <div className="mt-1 text-xs font-medium text-red-500">Out of Stock</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Panel - Cart & Checkout */}
                    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-white shadow-lg md:w-96">
                        {/* Scrollable Content Wrapper */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Customer Info - Simplified & Professional */}
                            <div className="flex-shrink-0 border-b bg-blue-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        <span className="text-base font-bold text-gray-800">Customer Info</span>
                                    </div>
                                    {selectedCustomer && (
                                        <button
                                            type="button"
                                            onClick={clearCustomer}
                                            className="rounded px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Selected Customer Display */}
                                {selectedCustomer ? (
                                    <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2.5">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-green-900">{selectedCustomer.name}</p>
                                                    <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-medium text-white">
                                                        ID: {selectedCustomer.patient_id}
                                                    </span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="flex items-center gap-1 text-xs text-green-700">
                                                        <Phone className="h-3 w-3" />
                                                        {selectedCustomer.phone}
                                                    </p>
                                                    {selectedCustomer.email && (
                                                        <p className="truncate text-xs text-green-600">{selectedCustomer.email}</p>
                                                    )}
                                                    {selectedCustomer.total_visits && (
                                                        <p className="text-xs text-green-600">Total Visits: {selectedCustomer.total_visits}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Search Existing Customer */}
                                        <div className="relative" ref={customerDropdownRef}>
                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                                <input
                                                    ref={customerSearchRef}
                                                    type="text"
                                                    placeholder="Search existing patient..."
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    onFocus={() => setShowRecentCustomers(true)}
                                                    className="w-full rounded-lg border border-gray-300 py-2 pr-8 pl-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                />
                                                {customerSearch && (
                                                    <button
                                                        onClick={() => {
                                                            setCustomerSearch('');
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                        className="absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {isSearchingCustomer && (
                                                    <div className="absolute top-1/2 right-9 -translate-y-1/2 transform">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {showCustomerDropdown && customerResults.length > 0 && (
                                                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                                                    <div className="border-b border-blue-100 bg-blue-50 px-2 py-1.5">
                                                        <span className="text-xs font-medium text-blue-900">
                                                            Found {customerResults.length} patient(s)
                                                        </span>
                                                    </div>
                                                    {customerResults.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            onClick={() => selectCustomer(customer)}
                                                            className="w-full border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-blue-50"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-gray-900">{customer.name}</p>
                                                                    <p className="text-xs text-gray-600">{customer.phone}</p>
                                                                </div>
                                                                <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-blue-700">
                                                                    {customer.patient_id}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Recent Customers Dropdown */}
                                            {showRecentCustomers && !showCustomerDropdown && !customerSearch && recentCustomers.length > 0 && (
                                                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                                                    <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
                                                        <Clock className="h-3 w-3 text-gray-600" />
                                                        <span className="text-xs font-medium text-gray-700">Recent Patients</span>
                                                    </div>
                                                    {recentCustomers.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            onClick={() => selectCustomer(customer)}
                                                            className="w-full border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-gray-900">{customer.name}</p>
                                                                    <p className="text-xs text-gray-600">{customer.phone}</p>
                                                                </div>
                                                                <div className="ml-2 text-right">
                                                                    <span className="block rounded bg-gray-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-700">
                                                                        {customer.patient_id}
                                                                    </span>
                                                                    {customer.last_visit && (
                                                                        <p className="mt-0.5 text-xs text-gray-500">{customer.last_visit}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Divider with text */}
                                        <div className="relative my-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t-2 border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="bg-white px-3 font-medium text-gray-600">OR ENTER DETAILS</span>
                                            </div>
                                        </div>

                                        {/* Manual Entry - Quick Fields */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-gray-700">Customer Name *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter customer name"
                                                    value={data.customer_name}
                                                    onChange={(e) => handleManualCustomerInput('customer_name', e.target.value)}
                                                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                />
                                                {data.customer_name && (
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                                        ✓ Customer ready - Select sale type below
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold text-gray-700">Phone Number (Optional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter phone number"
                                                    value={data.customer_phone}
                                                    onChange={(e) => handleManualCustomerInput('customer_phone', e.target.value)}
                                                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sale Mode Selection - Always show in right panel */}
                            {!saleMode && (
                                <div className="flex-shrink-0 border-t-2 border-b border-t-blue-300 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
                                    <div className="mb-4 text-center">
                                        <h3 className="mb-1 text-lg font-bold text-gray-800">Choose Sale Type</h3>
                                        <p className="text-xs text-gray-600">Select what to sell</p>
                                    </div>
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => handleModeSelection('product')}
                                            className="group flex w-full transform items-center gap-4 rounded-xl border-3 border-blue-400 bg-white p-5 transition-all hover:scale-105 hover:bg-blue-50 hover:shadow-lg"
                                        >
                                            <div className="rounded-lg bg-blue-100 p-3 transition-colors group-hover:bg-blue-200">
                                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="mb-1 text-base font-bold text-gray-800">Add Products</div>
                                                <div className="text-xs text-gray-600">Frames, Lenses, Complete Glasses</div>
                                            </div>
                                            <ChevronDown className="h-5 w-5 -rotate-90 transform text-blue-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleModeSelection('fitting')}
                                            className="group flex w-full transform items-center gap-4 rounded-xl border-3 border-purple-400 bg-white p-5 transition-all hover:scale-105 hover:bg-purple-50 hover:shadow-lg"
                                        >
                                            <div className="rounded-lg bg-purple-100 p-3 transition-colors group-hover:bg-purple-200">
                                                <Glasses className="h-8 w-8 text-purple-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="mb-1 text-base font-bold text-gray-800">Fitting Only</div>
                                                <div className="text-xs text-gray-600">Service charge without products</div>
                                            </div>
                                            <ChevronDown className="h-5 w-5 -rotate-90 transform text-purple-600" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Cart - Flexible Height (Show only in product mode) */}
                            {saleMode === 'product' && (
                                <div className="flex min-h-0 flex-1 flex-col">
                                    <div className="flex-shrink-0 border-b bg-gray-50 px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Cart ({cart.length})</span>
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-gray-600" />
                                                <button
                                                    type="button"
                                                    onClick={() => setSaleMode(null)}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                                >
                                                    Change Mode
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                                        {cart.length === 0 ? (
                                            <div className="py-8 text-center text-gray-500">
                                                <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                                                <p className="text-sm">No items in cart</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {cart.map((item) => (
                                                    <div key={`${item.item_type}-${item.item_id}`} className="rounded-lg bg-gray-50 p-2">
                                                        <div className="mb-2 flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-xs font-medium text-gray-900">{item.item_name}</p>
                                                                <p className="text-xs text-gray-600">Available: {item.stock}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item.item_id, item.item_type)}
                                                                className="rounded p-1 text-red-600 hover:bg-red-100"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => updateQuantity(item.item_id, item.item_type, item.quantity - 1)}
                                                                    className="rounded bg-gray-200 p-1 hover:bg-gray-300"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.item_id, item.item_type, item.quantity + 1)}
                                                                    disabled={item.quantity >= item.stock}
                                                                    className="rounded bg-gray-200 p-1 hover:bg-gray-300 disabled:bg-gray-100"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-600">@{formatCurrency(item.price)}</div>
                                                                <div className="text-sm font-medium text-green-600">
                                                                    {formatCurrency(item.quantity * item.price)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Fitting Only Mode - Show fitting charge form */}
                            {saleMode === 'fitting' && (
                                <div className="flex flex-1 flex-col p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-800">Fitting Charge Only</h3>
                                        <button
                                            type="button"
                                            onClick={() => setSaleMode(null)}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            Change Mode
                                        </button>
                                    </div>
                                    <div className="rounded-lg border-2 border-dashed border-purple-200 bg-purple-50 py-8 text-center text-gray-500">
                                        <Glasses className="mx-auto mb-3 h-12 w-12 text-purple-400" />
                                        <p className="text-sm font-medium text-gray-700">Fitting Service Sale</p>
                                        <p className="mt-1 text-xs text-gray-600">Enter fitting charge below</p>
                                    </div>
                                </div>
                            )}

                            {/* Checkout Section - Inside scrollable area */}
                            {(selectedCustomer || data.customer_name) && saleMode && (
                                <div className="flex-shrink-0 border-t bg-gray-50 pb-20">
                                    <div className="p-3">
                                        {/* Fitting Charge */}
                                        <div className="mb-3">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                                <Glasses className="mr-1 inline h-3 w-3" />
                                                Glass Fitting Charge
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="৳0"
                                                value={data.glass_fitting_price || ''}
                                                onChange={(e) => setData('glass_fitting_price', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="1"
                                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Discount - Compact */}
                                        <div className="mb-3">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Discount</label>
                                            <div className="flex gap-2">
                                                {/* Discount Type Toggle */}
                                                <div className="flex rounded-lg bg-gray-100 p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('discount_type', 'amount')}
                                                        className={`rounded px-2 py-1 text-xs transition-colors ${
                                                            data.discount_type === 'amount' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        ৳
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('discount_type', 'percentage')}
                                                        className={`rounded px-2 py-1 text-xs transition-colors ${
                                                            data.discount_type === 'percentage' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        %
                                                    </button>
                                                </div>

                                                {/* Discount Input */}
                                                <input
                                                    type="number"
                                                    placeholder={data.discount_type === 'percentage' ? '%' : '৳'}
                                                    value={data.discount_value || ''}
                                                    onChange={(e) => setData('discount_value', parseFloat(e.target.value) || 0)}
                                                    max={data.discount_type === 'percentage' ? 100 : subtotal + fittingCharge}
                                                    min="0"
                                                    step={data.discount_type === 'percentage' ? 0.1 : 1}
                                                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>

                                            {/* Show calculated discount amount */}
                                            {data.discount_value > 0 && (
                                                <div className="mt-1 text-xs text-gray-600">
                                                    {data.discount_type === 'percentage'
                                                        ? `${data.discount_value}% = ${formatCurrency(discountAmount)}`
                                                        : `Discount: ${formatCurrency(discountAmount)}`}
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Section */}
                                        <div className="mb-3 border-t pt-3">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Advance Payment</label>
                                            <input
                                                type="number"
                                                placeholder="৳0"
                                                value={data.advance_payment || ''}
                                                onChange={(e) => setData('advance_payment', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                max={totalAmount}
                                                step="1"
                                                className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                            />

                                            <label className="mb-1 block text-xs font-medium text-gray-700">Payment Method</label>
                                            <div className="grid grid-cols-5 gap-1">
                                                {['cash', 'card', 'bkash', 'nagad', 'rocket'].map((method) => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        onClick={() => setData('payment_method', method as any)}
                                                        className={`rounded border px-1 py-1 text-xs transition-colors ${
                                                            data.payment_method === method
                                                                ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {method.charAt(0).toUpperCase() + method.slice(1)}
                                                    </button>
                                                ))}
                                            </div>

                                            {data.payment_method !== 'cash' && (
                                                <input
                                                    type="text"
                                                    placeholder="Transaction ID (optional)"
                                                    value={data.transaction_id}
                                                    onChange={(e) => setData('transaction_id', e.target.value)}
                                                    className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                                                />
                                            )}
                                        </div>

                                        {/* Notes - Compact */}
                                        <div className="mb-3">
                                            <textarea
                                                placeholder="Notes (optional)"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                rows={1}
                                                className="w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Total Display - Compact */}
                                        <div className="mb-3 space-y-1 rounded bg-gray-100 p-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Items Subtotal:</span>
                                                <span>{formatCurrency(subtotal)}</span>
                                            </div>
                                            {fittingCharge > 0 && (
                                                <div className="flex justify-between text-blue-600">
                                                    <span>Fitting Charge:</span>
                                                    <span>+{formatCurrency(fittingCharge)}</span>
                                                </div>
                                            )}
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-red-600">
                                                    <span>Discount:</span>
                                                    <span>-{formatCurrency(discountAmount)}</span>
                                                </div>
                                            )}
                                            <div className="mt-1 flex justify-between border-t border-gray-300 pt-1 text-base font-bold">
                                                <span>Total:</span>
                                                <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                                            </div>
                                            {data.advance_payment > 0 && (
                                                <>
                                                    <div className="flex justify-between text-green-700">
                                                        <span>Advance:</span>
                                                        <span>-{formatCurrency(data.advance_payment)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-gray-300 pt-1 text-base font-bold text-orange-600">
                                                        <span>Due:</span>
                                                        <span>{formatCurrency(dueAmount)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Complete Sale Button - FIXED AT BOTTOM RIGHT CORNER */}
                        {(selectedCustomer || data.customer_name) && saleMode && (
                            <div className="absolute right-4 bottom-4">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
                                >
                                    <Calculator className="h-5 w-5" />
                                    <span className="whitespace-nowrap">{processing ? 'Processing...' : 'Complete Sale'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
