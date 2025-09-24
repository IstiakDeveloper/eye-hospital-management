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
    UserPlus
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
        customer_id: null as number | null,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        items: [],
        discount_type: 'amount',
        discount_value: 0,
        notes: '',
    });

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount)}`;
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
        setData({
            ...data,
            customer_id: null,
            customer_name: '',
            customer_phone: '',
            customer_email: ''
        });
    };

    const handleManualCustomerInput = (field: string, value: string) => {
        // If manually editing and there's a selected customer, clear the selection
        if (selectedCustomer && field === 'customer_name' && value !== selectedCustomer.name) {
            setSelectedCustomer(null);
            setData({ ...data, customer_id: null });
        }
        setData(field, value);
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

    // Calculate discount amount
    const discountAmount = data.discount_type === 'percentage'
        ? (subtotal * (data.discount_value || 0)) / 100
        : (data.discount_value || 0);

    const totalAmount = subtotal - discountAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Please add items to cart');
            return;
        }

        const cartItems = cart.map(item => ({
            type: item.item_type,
            id: item.item_id,
            quantity: item.quantity,
            price: item.price
        }));

        router.post('/optics-seller/pos/sale', {
            customer_id: data.customer_id,
            customer_name: data.customer_name || 'Walk-in Customer',
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            items: cartItems,
            discount: discountAmount,
            notes: data.notes,
        }, {
            onSuccess: () => {
                setShowInvoice(true);
                setCart([]);
                clearCustomer();
                reset();
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
                    <div className="text-lg font-bold text-green-600">
                        {formatCurrency(totalAmount)}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Products */}
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

                    {/* Right Panel - Cart & Checkout */}
                    <div className="w-80 flex flex-col bg-white max-h-full">
                        {/* Customer Info - Fixed Height */}
                        <div className="p-3 border-b flex-shrink-0 max-h-80 overflow-y-auto">
                            <div className="relative mb-2" ref={customerDropdownRef}>
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Customer</span>
                                    {selectedCustomer && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            ID: {selectedCustomer.patient_id}
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        ref={customerSearchRef}
                                        type="text"
                                        placeholder="Search customer by name or phone..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        onFocus={() => setShowRecentCustomers(true)}
                                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    {customerSearch && (
                                        <button
                                            onClick={clearCustomer}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isSearchingCustomer && (
                                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Customer Search Dropdown - Fixed positioning */}
                                {showCustomerDropdown && customerResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {customerResults.map((customer) => (
                                            <button
                                                key={customer.id}
                                                onClick={() => selectCustomer(customer)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                                                        <p className="text-xs text-gray-600">{customer.phone}</p>
                                                        {customer.email && (
                                                            <p className="text-xs text-gray-500">{customer.email}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            ID: {customer.patient_id}
                                                        </span>
                                                        {customer.total_visits && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {customer.total_visits} visits
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Recent Customers Dropdown - Fixed positioning */}
                                {showRecentCustomers && !showCustomerDropdown && recentCustomers.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        <div className="px-3 py-2 bg-gray-50 border-b">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-gray-600" />
                                                <span className="text-xs font-medium text-gray-700">Recent Customers</span>
                                            </div>
                                        </div>
                                        {recentCustomers.map((customer) => (
                                            <button
                                                key={customer.id}
                                                onClick={() => selectCustomer(customer)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                                                        <p className="text-xs text-gray-600">{customer.phone}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                            ID: {customer.patient_id}
                                                        </span>
                                                        {customer.last_visit && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Last: {customer.last_visit}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Manual Customer Fields - Compact */}
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Customer name*"
                                    value={data.customer_name}
                                    onChange={(e) => handleManualCustomerInput('customer_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <div className="grid grid-cols-1 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Phone number"
                                        value={data.customer_phone}
                                        onChange={(e) => handleManualCustomerInput('customer_phone', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={data.customer_email}
                                        onChange={(e) => handleManualCustomerInput('customer_email', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {/* Selected Customer Info - Compact */}
                            {selectedCustomer && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-green-900 truncate">
                                                {selectedCustomer.name}
                                            </p>
                                            <p className="text-xs text-green-700">
                                                {selectedCustomer.phone} • ID: {selectedCustomer.patient_id}
                                            </p>
                                            {selectedCustomer.total_visits && (
                                                <p className="text-xs text-green-600">
                                                    {selectedCustomer.total_visits} visits
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={clearCustomer}
                                            className="text-green-600 hover:text-green-800 flex-shrink-0 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart - Flexible Height */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="px-3 py-2 border-b bg-gray-50 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">Cart ({cart.length})</span>
                                    <ShoppingCart className="w-4 h-4 text-gray-600" />
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

                        {/* Checkout - Fixed at Bottom */}
                        {cart.length > 0 && (
                            <div className="border-t bg-gray-50 flex-shrink-0">
                                <form onSubmit={handleSubmit} className="p-3">
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
                                                max={data.discount_type === 'percentage' ? 100 : subtotal}
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
                                    <div className="space-y-1 mb-3 text-sm">
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Discount:</span>
                                                <span>-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-lg border-t pt-1">
                                            <span>Total:</span>
                                            <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                                        </div>
                                    </div>

                                    {/* Complete Sale Button - Always Visible */}
                                    <button
                                        type="submit"
                                        disabled={processing || cart.length === 0}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-base"
                                    >
                                        <Calculator className="w-5 h-5" />
                                        {processing ? 'Processing...' : 'Complete Sale'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
