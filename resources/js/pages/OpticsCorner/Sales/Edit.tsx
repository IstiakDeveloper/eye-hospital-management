import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';

interface Item {
  id: number;
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  stock_quantity: number;
  selling_price?: number;
  price?: number;
  full_name?: string;
}

interface SaleItem {
  id: number;
  type: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  items: SaleItem[];
  glass_fitting_price: number;
  discount: number;
  advance_payment: number;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
  total_amount: number;
  due_amount: number;
  status: string;
}

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button className={`${baseClasses} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', ...props }: any) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

const Select = ({ label, error, children, className = '', ...props }: any) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <select
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

export default function SalesEdit({ sale, frames, lensTypes, completeGlasses }: {
  sale: Sale;
  frames: Item[];
  lensTypes: Item[];
  completeGlasses: Item[];
}) {
  const { data, setData, put, processing, errors } = useForm({
    customer_id: sale.customer_id,
    customer_name: sale.customer_name,
    customer_phone: sale.customer_phone || '',
    customer_email: sale.customer_email || '',
    items: sale.items.map(item => ({
      type: item.type,
      id: item.id,
      quantity: item.quantity,
      price: item.price
    })),
    glass_fitting_price: sale.glass_fitting_price || 0,
    discount: sale.discount || 0,
    advance_payment: sale.advance_payment || 0,
    payment_method: sale.payment_method || 'cash',
    transaction_id: sale.transaction_id || '',
    notes: sale.notes || '',
  });

  const addItem = () => {
    setData('items', [...data.items, { type: 'frame', id: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData('items', newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-set price when item is selected
    if (field === 'id' && value) {
      const selectedItem = getItemById(newItems[index].type, value);
      if (selectedItem) {
        newItems[index].price = selectedItem.selling_price || selectedItem.price || 0;
      }
    }

    setData('items', newItems);
  };

  const getItemById = (type: string, id: string) => {
    switch (type) {
      case 'frame':
        return frames.find((f: any) => f.id == id);
      case 'lens':
        return lensTypes.find((l: any) => l.id == id);
      case 'complete_glasses':
        return completeGlasses.find((c: any) => c.id == id);
      default:
        return null;
    }
  };

  const getItemOptions = (type: string) => {
    switch (type) {
      case 'frame':
        return frames;
      case 'lens':
        return lensTypes;
      case 'complete_glasses':
        return completeGlasses;
      default:
        return [];
    }
  };

  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const fittingPrice = Number(data.glass_fitting_price) || 0;
    const discount = Number(data.discount) || 0;
    return subtotal + fittingPrice - discount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('optics.sales.update', sale.id));
  };

  return (
    <AdminLayout>
      <Head title={`Edit Sale - ${sale.invoice_number}`} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={route('optics.sales')}>
              <Button variant="secondary">
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Sale - {sale.invoice_number}</h1>
              <p className="text-gray-600">Update sale transaction details</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Original Total: <span className="font-semibold">৳{sale.total_amount.toLocaleString()}</span></p>
            <p className="text-sm text-gray-600">Original Due: <span className="font-semibold text-red-600">৳{sale.due_amount.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit}>
            {/* Customer Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Customer Name *"
                  value={data.customer_name}
                  onChange={(e: any) => setData('customer_name', e.target.value)}
                  error={errors.customer_name}
                  placeholder="Enter customer name"
                />
                <Input
                  label="Customer Phone"
                  value={data.customer_phone}
                  onChange={(e: any) => setData('customer_phone', e.target.value)}
                  error={errors.customer_phone}
                  placeholder="Enter phone number"
                />
                <Input
                  label="Customer Email"
                  type="email"
                  value={data.customer_email}
                  onChange={(e: any) => setData('customer_email', e.target.value)}
                  error={errors.customer_email}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <Button type="button" onClick={addItem} variant="secondary">
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </Button>
              </div>

              <div className="space-y-4">
                {data.items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <Select
                        label="Type"
                        value={item.type}
                        onChange={(e: any) => updateItem(index, 'type', e.target.value)}
                      >
                        <option value="frame">Frame</option>
                        <option value="lens">Lens</option>
                        <option value="complete_glasses">Complete Glasses</option>
                      </Select>

                      <div className="md:col-span-2">
                        <Select
                          label="Item"
                          value={item.id}
                          onChange={(e: any) => updateItem(index, 'id', e.target.value)}
                        >
                          <option value="">Select Item</option>
                          {getItemOptions(item.type).map((option: any) => (
                            <option key={option.id} value={option.id}>
                              {option.full_name || option.name} (Stock: {option.stock_quantity})
                            </option>
                          ))}
                        </Select>
                      </div>

                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e: any) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      />

                      <Input
                        label="Price"
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e: any) => updateItem(index, 'price', parseFloat(e.target.value))}
                      />

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => removeItem(index)}
                          disabled={data.items.length === 1}
                          className="w-full justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {item.id && item.quantity && item.price && (
                      <div className="mt-3 text-right">
                        <span className="text-sm text-gray-600">Item Total: </span>
                        <span className="font-semibold text-gray-900">
                          ৳{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Calculation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Input
                  label="Glass Fitting Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.glass_fitting_price}
                  onChange={(e: any) => setData('glass_fitting_price', parseFloat(e.target.value) || 0)}
                  error={errors.glass_fitting_price}
                  placeholder="0.00"
                />
                <Input
                  label="Discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.discount}
                  onChange={(e: any) => setData('discount', parseFloat(e.target.value) || 0)}
                  error={errors.discount}
                  placeholder="0.00"
                />
                <Input
                  label="Advance Payment *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.advance_payment}
                  onChange={(e: any) => setData('advance_payment', parseFloat(e.target.value) || 0)}
                  error={errors.advance_payment}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Select
                  label="Payment Method *"
                  value={data.payment_method}
                  onChange={(e: any) => setData('payment_method', e.target.value)}
                  error={errors.payment_method}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </Select>
                <Input
                  label="Transaction ID"
                  value={data.transaction_id}
                  onChange={(e: any) => setData('transaction_id', e.target.value)}
                  error={errors.transaction_id}
                  placeholder="Enter transaction ID (for digital payments)"
                />
              </div>

              <div className="space-y-3 bg-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span className="font-semibold">৳{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fitting Charge:</span>
                  <span className="font-semibold text-blue-600">+৳{(Number(data.glass_fitting_price) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-৳{(Number(data.discount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">৳{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Advance Payment:</span>
                  <span className="font-semibold text-blue-600">৳{(Number(data.advance_payment) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-semibold text-gray-900">Due Amount:</span>
                  <span className="text-xl font-bold text-red-600">
                    ৳{Math.max(0, calculateTotal() - (Number(data.advance_payment) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={data.notes}
                onChange={(e: any) => setData('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about this sale..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Link href={route('optics.sales')}>
                <Button variant="secondary" type="button">Cancel</Button>
              </Link>
              <Button
                type="submit"
                disabled={processing || calculateTotal() <= 0 || data.items.some(item => !item.id)}
              >
                <Save className="w-4 h-4" />
                <span>{processing ? 'Updating...' : `Update Sale - ৳${calculateTotal().toLocaleString()}`}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
