import React, { useState, useEffect } from 'react';
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
    X
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

interface POSProps {
    frames: Frame[];
    completeGlasses: CompleteGlasses[];
    lensTypes: LensType[];
    recentCustomers: any[];
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

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_name: '',
        customer_phone: '',
        items: [],
        discount_type: 'amount', // 'amount' or 'percentage'
        discount_value: 0,
        notes: '',
    });

    const formatCurrency = (amount: number) => {
        return `৳${Math.round(amount)}`;
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
            customer_name: data.customer_name || 'Walk-in Customer',
            customer_phone: data.customer_phone,
            items: cartItems,
            discount: discountAmount, // Send calculated discount amount
            notes: data.notes,
        }, {
            onSuccess: () => {
                setShowInvoice(true);
                setCart([]);
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
                    <div className="w-80 flex flex-col bg-white">
                        {/* Customer Info */}
                        <div className="p-3 border-b">
                            <input
                                type="text"
                                placeholder="Customer name..."
                                value={data.customer_name}
                                onChange={(e) => setData('customer_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Phone number..."
                                value={data.customer_phone}
                                onChange={(e) => setData('customer_phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Cart */}
                        <div className="flex-1 flex flex-col">
                            <div className="px-3 py-2 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">Cart ({cart.length})</span>
                                    <ShoppingCart className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3">
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

                        {/* Checkout */}
                        {cart.length > 0 && (
                            <form onSubmit={handleSubmit} className="border-t p-3 bg-gray-50">
                                {/* Discount */}
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
                                            placeholder={data.discount_type === 'percentage' ? 'Discount %' : 'Discount amount'}
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

                                {/* Notes */}
                                <div className="mb-3">
                                    <textarea
                                        placeholder="Notes (optional)"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                {/* Total Display */}
                                <div className="space-y-1 mb-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>
                                                Discount {data.discount_type === 'percentage' ? `(${data.discount_value}%)` : ''}:
                                            </span>
                                            <span>-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg border-t pt-1">
                                        <span>Total:</span>
                                        <span>{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>

                                {/* Complete Sale Button */}
                                <button
                                    type="submit"
                                    disabled={processing || cart.length === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Calculator className="w-4 h-4" />
                                    Complete Sale
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
