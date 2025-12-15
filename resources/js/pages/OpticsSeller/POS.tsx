import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    Phone,
    Calculator,
    User,
    Package,
    Glasses,
    Eye,
    X,
    Users,
    ChevronDown,
    Clock,
    UserPlus,
    Calendar
} from 'lucide-react';

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

export default function POS({
    frames,
    completeGlasses,
    lensTypes,
    recentCustomers,
    todaySalesCount,
    lastInvoiceNumber
}: POSProps) {
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
            customer_email: customer.email || ''
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
        ...frames.map(item => ({
            id: item.id,
            type: 'frame' as const,
            name: item.full_name || `${item.brand || ''} ${item.model || ''}`.trim() || 'Unknown Frame',
            price: item.selling_price || 0,
            stock: item.stock_quantity || 0,
            details: `${item.color || ''} | ${item.formatted_size || ''}`.replace('| ', '').replace(' |', '') || 'No details'
        })),
        ...completeGlasses.map(item => ({
            id: item.id,
            type: 'complete_glasses' as const,
            name: item.full_name || item.sku || 'Unknown Complete Glasses',
            price: item.selling_price || 0,
            stock: item.stock_quantity || 0,
            details: `Power: ${item.sphere_power || 'N/A'}`
        })),
        ...lensTypes.map(item => ({
            id: item.id,
            type: 'lens' as const,
            name: item.name || 'Unknown Lens',
            price: item.price || 0,
            stock: item.stock_quantity || 0,
            details: `${item.type || ''} | ${item.material || ''}`.replace('| ', '').replace(' |', '') || 'No details'
        }))
    ];

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'frames' && item.type === 'frame') ||
            (activeTab === 'complete' && item.type === 'complete_glasses') ||
            (activeTab === 'lenses' && item.type === 'lens');
        return matchesSearch && matchesTab && item.stock > 0;
    });

    const addToCart = (item: typeof allItems[0]) => {
        const existingItem = cart.find(cartItem =>
            cartItem.item_id === item.id && cartItem.item_type === item.type
        );

        if (existingItem) {
            if (existingItem.quantity < item.stock) {
                setCart(cart.map(cartItem =>
                    cartItem.item_id === item.id && cartItem.item_type === item.type
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                ));
            }
        } else {
            setCart([...cart, {
                item_id: item.id,
                item_type: item.type,
                item_name: item.name,
                quantity: 1,
                price: item.price,
                stock: item.stock,
                details: item.details
            }]);
        }
    };

    const updateQuantity = (itemId: number, itemType: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(cart.filter(item => !(item.item_id === itemId && item.item_type === itemType)));
        } else {
            const item = cart.find(item => item.item_id === itemId && item.item_type === itemType);
            if (item && newQuantity <= item.stock) {
                setCart(cart.map(cartItem =>
                    cartItem.item_id === itemId && cartItem.item_type === itemType
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
                ));
            }
        }
    };

    const removeFromCart = (itemId: number, itemType: string) => {
        setCart(cart.filter(item => !(item.item_id === itemId && item.item_type === itemType)));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const fittingCharge = data.glass_fitting_price || 0;

    // Calculate discount amount
    const discountAmount = data.discount_type === 'percentage'
        ? ((subtotal + fittingCharge) * (data.discount_value || 0)) / 100
        : (data.discount_value || 0);

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

        const cartItems = cart.map(item => ({
            type: item.item_type,
            id: item.item_id,
            quantity: item.quantity,
            price: item.price
        }));

        router.post('/optics-seller/pos/sale', {
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
        }, {
            onSuccess: () => {
                setShowInvoice(true);
                setCart([]);
                setSaleMode(null); // Reset sale mode after successful sale
                clearCustomer();
                reset('customer_id', 'customer_name', 'customer_phone', 'customer_email', 'items', 'glass_fitting_price', 'discount_type', 'discount_value', 'advance_payment', 'payment_method', 'transaction_id', 'notes');
                // Keep sale_date intact for next sale
            },
            onError: (errors) => {
                console.error('Sale failed:', errors);
                alert('Sale failed. Please try again.');
            }
        });
    };

    return (
        <AdminLayout title="Optics POS">
            <Head title="Optics POS" />

            <div className="h-screen flex flex-col bg-gray-50">
                {/* Compact Header */}
                <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
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
                                className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">{formatDateDisplay(data.sale_date)}</span>
                            </label>
                            <input
                                id="sale-date-picker"
                                type="date"
                                value={data.sale_date}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setData('sale_date', e.target.value)}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="text-lg font-bold text-green-600">
                            {formatCurrency(totalAmount)}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Mode Selection (always visible) */}
                    {!saleMode && (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-gray-50 border-r">
                            <div className="text-center px-6">
                                <div className="mb-3">
                                    <ShoppingCart className="w-16 h-16 mx-auto text-blue-300" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-1">Select Sale Type</h2>
                                <p className="text-gray-600 mb-6">Choose how you want to process this sale</p>

                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('product')}
                                        className="flex flex-col items-center justify-center w-48 h-40 bg-white border-2 border-blue-300 rounded-xl shadow-md hover:shadow-xl hover:border-blue-400 transition-all transform hover:scale-105 p-6"
                                        aria-label="Start product sale"
                                    >
                                        <ShoppingCart className="w-12 h-12 text-blue-600 mb-3" />
                                        <span className="font-bold text-base text-gray-800 mb-1">Add Products</span>
                                        <span className="text-xs text-gray-500">Frames, Lenses, etc.</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('fitting')}
                                        className="flex flex-col items-center justify-center w-48 h-40 bg-white border-2 border-purple-300 rounded-xl shadow-md hover:shadow-xl hover:border-purple-400 transition-all transform hover:scale-105 p-6"
                                        aria-label="Start fitting only sale"
                                    >
                                        <Glasses className="w-12 h-12 text-purple-600 mb-3" />
                                        <span className="font-bold text-base text-gray-800 mb-1">Fitting Only</span>
                                        <span className="text-xs text-gray-500">No products</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Panel - Fitting mode message */}
                    {saleMode === 'fitting' && (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 border-r">
                            <div className="text-center px-8">
                                <div className="mb-4">
                                    <Glasses className="w-20 h-20 mx-auto text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Fitting Service Only</h2>
                                <p className="text-gray-600 mb-4">No products will be added to this sale</p>
                                <p className="text-sm text-gray-500">Enter fitting charge and payment details on the right panel</p>
                            </div>
                        </div>
                    )}

                    {/* Left Panel - Products (Show only in product mode) */}
                    {saleMode === 'product' && (
                    <div className="flex-1 flex flex-col bg-white border-r">
                        {/* Search */}
                        <div className="p-3 border-b">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1">
                                {[
                                    { key: 'all', label: 'All', icon: Package },
                                    { key: 'frames', label: 'Frames', icon: Glasses },
                                    { key: 'complete', label: 'Complete', icon: Eye },
                                    { key: 'lenses', label: 'Lenses', icon: Package }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key as any)}
                                        className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === key
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                {filteredItems.map((item) => {
                                    const cartItem = cart.find(cartItem =>
                                        cartItem.item_id === item.id && cartItem.item_type === item.type
                                    );
                                    const hasStock = item.stock > 0;

                                    return (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className={`p-3 border rounded-lg transition-all cursor-pointer ${hasStock
                                                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
                                                : 'border-gray-100 bg-gray-50 opacity-60'
                                                }`}
                                            onClick={() => hasStock && addToCart(item)}
                                        >
                                            <div className="text-center">
                                                <div className="mb-2">
                                                    {item.type === 'frame' && <Glasses className={`w-6 h-6 mx-auto ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />}
                                                    {item.type === 'complete_glasses' && <Eye className={`w-6 h-6 mx-auto ${hasStock ? 'text-green-600' : 'text-gray-400'}`} />}
                                                    {item.type === 'lens' && <Package className={`w-6 h-6 mx-auto ${hasStock ? 'text-purple-600' : 'text-gray-400'}`} />}
                                                </div>
                                                <h3 className="font-medium text-xs text-gray-900 mb-1 line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                                                    {item.details}
                                                </p>
                                                <div className="text-xs text-gray-600 mb-2">
                                                    Stock: {item.stock}
                                                </div>
                                                <div className="text-sm font-semibold text-green-600">
                                                    {formatCurrency(item.price)}
                                                </div>
                                                {cartItem && (
                                                    <div className="text-xs text-blue-600 font-medium mt-1">
                                                        Cart: {cartItem.quantity}
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
                        </div>
                    </div>
                    )}

                    {/* Right Panel - Cart & Checkout */}
                    <div className="w-full md:w-96 flex flex-col bg-white shadow-lg h-[calc(100vh-56px)]">
                        {/* Scrollable Content Wrapper */}
                        <div className="flex-1 overflow-y-auto">
                        {/* Customer Info - Simplified & Professional */}
                        <div className="p-4 border-b flex-shrink-0 bg-blue-50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <span className="text-base font-bold text-gray-800">Customer Info</span>
                                </div>
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={clearCustomer}
                                        className="text-sm text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Selected Customer Display */}
                            {selectedCustomer ? (
                                <div className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-semibold text-green-900 truncate">
                                                    {selectedCustomer.name}
                                                </p>
                                                <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">
                                                    ID: {selectedCustomer.patient_id}
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-green-700 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {selectedCustomer.phone}
                                                </p>
                                                {selectedCustomer.email && (
                                                    <p className="text-xs text-green-600 truncate">
                                                        {selectedCustomer.email}
                                                    </p>
                                                )}
                                                {selectedCustomer.total_visits && (
                                                    <p className="text-xs text-green-600">
                                                        Total Visits: {selectedCustomer.total_visits}
                                                    </p>
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
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                ref={customerSearchRef}
                                                type="text"
                                                placeholder="Search existing patient..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                onFocus={() => setShowRecentCustomers(true)}
                                                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                            {customerSearch && (
                                                <button
                                                    onClick={() => {
                                                        setCustomerSearch('');
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {isSearchingCustomer && (
                                                <div className="absolute right-9 top-1/2 transform -translate-y-1/2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Search Results Dropdown */}
                                        {showCustomerDropdown && customerResults.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                                <div className="px-2 py-1.5 bg-blue-50 border-b border-blue-100">
                                                    <span className="text-xs font-medium text-blue-900">Found {customerResults.length} patient(s)</span>
                                                </div>
                                                {customerResults.map((customer) => (
                                                    <button
                                                        key={customer.id}
                                                        onClick={() => selectCustomer(customer)}
                                                        className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-gray-900 truncate">{customer.name}</p>
                                                                <p className="text-xs text-gray-600">{customer.phone}</p>
                                                            </div>
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 font-medium whitespace-nowrap">
                                                                {customer.patient_id}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Recent Customers Dropdown */}
                                        {showRecentCustomers && !showCustomerDropdown && !customerSearch && recentCustomers.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                                <div className="px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3 text-gray-600" />
                                                    <span className="text-xs font-medium text-gray-700">Recent Patients</span>
                                                </div>
                                                {recentCustomers.map((customer) => (
                                                    <button
                                                        key={customer.id}
                                                        onClick={() => selectCustomer(customer)}
                                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-gray-900 truncate">{customer.name}</p>
                                                                <p className="text-xs text-gray-600">{customer.phone}</p>
                                                            </div>
                                                            <div className="text-right ml-2">
                                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium whitespace-nowrap block">
                                                                    {customer.patient_id}
                                                                </span>
                                                                {customer.last_visit && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        {customer.last_visit}
                                                                    </p>
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
                                            <span className="px-3 bg-white text-gray-600 font-medium">OR ENTER DETAILS</span>
                                        </div>
                                    </div>

                                    {/* Manual Entry - Quick Fields */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
                                            <input
                                                type="text"
                                                placeholder="Enter customer name"
                                                value={data.customer_name}
                                                onChange={(e) => handleManualCustomerInput('customer_name', e.target.value)}
                                                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                                            />
                                            {data.customer_name && (
                                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                    ✓ Customer ready - Select sale type below
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Enter phone number"
                                                value={data.customer_phone}
                                                onChange={(e) => handleManualCustomerInput('customer_phone', e.target.value)}
                                                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sale Mode Selection - Always show in right panel */}
                        {!saleMode && (
                            <div className="p-6 border-b border-t-2 border-t-blue-300 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex-shrink-0">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Choose Sale Type</h3>
                                    <p className="text-xs text-gray-600">Select what to sell</p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('product')}
                                        className="w-full p-5 border-3 border-blue-400 bg-white rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all flex items-center gap-4 group transform hover:scale-105"
                                    >
                                        <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <ShoppingCart className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-base text-gray-800 mb-1">Add Products</div>
                                            <div className="text-xs text-gray-600">Frames, Lenses, Complete Glasses</div>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-blue-600 transform -rotate-90" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelection('fitting')}
                                        className="w-full p-5 border-3 border-purple-400 bg-white rounded-xl hover:bg-purple-50 hover:shadow-lg transition-all flex items-center gap-4 group transform hover:scale-105"
                                    >
                                        <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                                            <Glasses className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-base text-gray-800 mb-1">Fitting Only</div>
                                            <div className="text-xs text-gray-600">Service charge without products</div>
                                        </div>
                                        <ChevronDown className="w-5 h-5 text-purple-600 transform -rotate-90" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cart - Flexible Height (Show only in product mode) */}
                        {saleMode === 'product' && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="px-3 py-2 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">Cart ({cart.length})</span>
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-gray-600" />
                                            <button
                                                type="button"
                                                onClick={() => setSaleMode(null)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Change Mode
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            <div className="flex-1 overflow-y-auto p-3 min-h-0">
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No items in cart</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map((item) => (
                                            <div key={`${item.item_type}-${item.item_id}`} className="p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-xs text-gray-900 truncate">
                                                            {item.item_name}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            Available: {item.stock}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.item_id, item.item_type)}
                                                        className="p-1 rounded text-red-600 hover:bg-red-100"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.item_id, item.item_type, item.quantity - 1)}
                                                            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.item_id, item.item_type, item.quantity + 1)}
                                                            disabled={item.quantity >= item.stock}
                                                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-600">
                                                            @{formatCurrency(item.price)}
                                                        </div>
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
                            <div className="flex-1 flex flex-col p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800">Fitting Charge Only</h3>
                                    <button
                                        type="button"
                                        onClick={() => setSaleMode(null)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Change Mode
                                    </button>
                                </div>
                                <div className="text-center py-8 text-gray-500 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
                                    <Glasses className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                                    <p className="text-sm font-medium text-gray-700">Fitting Service Sale</p>
                                    <p className="text-xs text-gray-600 mt-1">Enter fitting charge below</p>
                                </div>
                            </div>
                        )}

                        {/* Checkout Section - Inside scrollable area */}
                        {(selectedCustomer || data.customer_name) && saleMode && (
                            <div className="border-t bg-gray-50 flex-shrink-0 pb-20">
                                <div className="p-3">
                                    {/* Fitting Charge */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            <Glasses className="w-3 h-3 inline mr-1" />
                                            Glass Fitting Charge
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="৳0"
                                            value={data.glass_fitting_price || ''}
                                            onChange={(e) => setData('glass_fitting_price', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="1"
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Discount - Compact */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                                        <div className="flex gap-2">
                                            {/* Discount Type Toggle */}
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'amount')}
                                                    className={`px-2 py-1 text-xs rounded transition-colors ${data.discount_type === 'amount'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-600'
                                                        }`}
                                                >
                                                    ৳
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'percentage')}
                                                    className={`px-2 py-1 text-xs rounded transition-colors ${data.discount_type === 'percentage'
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-600'
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
                                                max={data.discount_type === 'percentage' ? 100 : (subtotal + fittingCharge)}
                                                min="0"
                                                step={data.discount_type === 'percentage' ? 0.1 : 1}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Show calculated discount amount */}
                                        {data.discount_value > 0 && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                {data.discount_type === 'percentage'
                                                    ? `${data.discount_value}% = ${formatCurrency(discountAmount)}`
                                                    : `Discount: ${formatCurrency(discountAmount)}`
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Section */}
                                    <div className="mb-3 border-t pt-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Advance Payment</label>
                                        <input
                                            type="number"
                                            placeholder="৳0"
                                            value={data.advance_payment || ''}
                                            onChange={(e) => setData('advance_payment', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            max={totalAmount}
                                            step="1"
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mb-2"
                                        />

                                        <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                                        <div className="grid grid-cols-5 gap-1">
                                            {['cash', 'card', 'bkash', 'nagad', 'rocket'].map((method) => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setData('payment_method', method as any)}
                                                    className={`px-1 py-1 text-xs rounded border transition-colors ${
                                                        data.payment_method === method
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
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
                                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 mt-2"
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
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Total Display - Compact */}
                                    <div className="space-y-1 mb-3 text-sm bg-gray-100 p-2 rounded">
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
                                        <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1 mt-1">
                                            <span>Total:</span>
                                            <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                                        </div>
                                        {data.advance_payment > 0 && (
                                            <>
                                                <div className="flex justify-between text-green-700">
                                                    <span>Advance:</span>
                                                    <span>-{formatCurrency(data.advance_payment)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-base text-orange-600 border-t border-gray-300 pt-1">
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
                            <div className="absolute bottom-4 right-4">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3.5 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    <Calculator className="w-5 h-5" />
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
