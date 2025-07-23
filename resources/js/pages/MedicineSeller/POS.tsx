// resources/js/Pages/MedicineSeller/POS.tsx

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Calculator,
  DollarSign
} from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  standard_sale_price: number;
  unit: string;
  stocks: {
    id: number;
    available_quantity: number;
    sale_price: number;
    expiry_date: string;
  }[];
}

interface POSProps {
  medicines: Medicine[];
  recentCustomers: any[];
  todaySalesCount: number;
  lastInvoiceNumber: string;
}

interface CartItem {
  medicine_stock_id: number;
  medicine: Medicine;
  quantity: number;
  unit_price: number;
}

export default function POS({ medicines, recentCustomers, todaySalesCount, lastInvoiceNumber }: POSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    items: [],
    patient_id: '',
    discount: 0,
    tax: 0,
    paid_amount: 0,
    customer_name: '',
    customer_phone: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    const availableStock = medicine.stocks.find(s => s.available_quantity > 0);
    if (!availableStock) return;

    const existingItem = cart.find(item => item.medicine_stock_id === availableStock.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.medicine_stock_id === availableStock.id
          ? { ...item, quantity: Math.min(item.quantity + 1, availableStock.available_quantity) }
          : item
      ));
    } else {
      setCart([...cart, {
        medicine_stock_id: availableStock.id,
        medicine,
        quantity: 1,
        unit_price: availableStock.sale_price
      }]);
    }
  };

  const updateQuantity = (stockId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.medicine_stock_id !== stockId));
    } else {
      setCart(cart.map(item =>
        item.medicine_stock_id === stockId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (stockId: number) => {
    setCart(cart.filter(item => item.medicine_stock_id !== stockId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalAmount = subtotal - (data.discount || 0) + (data.tax || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      ...data,
      items: cart.map(item => ({
        medicine_stock_id: item.medicine_stock_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    post('/medicine-seller/pos/sale', {
      data: formData,
      onSuccess: () => {
        setCart([]);
        reset();
        setSelectedCustomer(null);
      }
    });
  };

  return (
    <AdminLayout>
      <Head title="Point of Sale" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-gray-600 mt-1">Today: {todaySalesCount} sales • Last: {lastInvoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Medicine Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Medicines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredMedicines.map((medicine) => {
                  const availableStock = medicine.stocks.find(s => s.available_quantity > 0);

                  return (
                    <div
                      key={medicine.id}
                      onClick={() => addToCart(medicine)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                          {medicine.generic_name && (
                            <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Stock: {availableStock?.available_quantity || 0} {medicine.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(availableStock?.sale_price || 0)}
                          </p>
                          <button className="mt-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer name"
                  value={data.customer_name}
                  onChange={(e) => setData('customer_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  value={data.customer_phone}
                  onChange={(e) => setData('customer_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cart ({cart.length})</h2>
              </div>
              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No items in cart</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.medicine_stock_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.medicine.name}</p>
                          <p className="text-xs text-gray-600">{formatCurrency(item.unit_price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.medicine_stock_id, item.quantity - 1)}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.medicine_stock_id, item.quantity + 1)}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.medicine_stock_id)}
                            className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checkout */}
            {cart.length > 0 && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Checkout</h2>

                <div className="space-y-4">
                  {/* Discount & Tax */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={data.discount}
                        onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                      <input
                        type="number"
                        step="0.01"
                        value={data.tax}
                        onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {data.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(data.discount)}</span>
                      </div>
                    )}
                    {data.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>+{formatCurrency(data.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={data.paid_amount}
                      onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {data.paid_amount > 0 && data.paid_amount !== totalAmount && (
                      <p className="text-sm mt-1 text-amber-600">
                        Change: {formatCurrency(Math.max(0, data.paid_amount - totalAmount))}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={processing || cart.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Complete Sale
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
