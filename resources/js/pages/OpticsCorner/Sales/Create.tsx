import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
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

export default function SalesCreate({ frames, lensTypes, completeGlasses }: {
  frames: Item[];
  lensTypes: Item[];
  completeGlasses: Item[];
}) {
  const { data, setData, post, processing, errors } = useForm({
    customer_name: '',
    customer_phone: '',
    items: [{ type: 'frame', id: '', quantity: 1, price: 0 }],
    discount: 0,
    notes: '',
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
    return data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - (data.discount || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/optics/sales');
  };

  return (
    <AdminLayout>
      <Head title="New Sale" />

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/optics/sales">
            <Button variant="secondary">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
            <p className="text-gray-600">Record a new sale transaction</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
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
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">৳{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-৳{(data.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">৳{calculateTotal().toLocaleString()}</span>
                </div>
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
            <Link href="/optics/sales">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={processing || calculateTotal() <= 0 || data.items.some(item => !item.id)}
            >
              <Save className="w-4 h-4" />
              <span>{processing ? 'Processing...' : `Complete Sale - ৳${calculateTotal().toLocaleString()}`}</span>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
