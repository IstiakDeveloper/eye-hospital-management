import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  Plus,
  Search,
  Edit3,
  Package,
  AlertTriangle
} from 'lucide-react';

interface Frame {
  id: number;
  sku: string;
  brand: string;
  model: string;
  type: string;
  frame_type: string;
  material: string;
  color?: string;
  gender: string;
  size?: string;
  selling_price: number;
  purchase_price: number;
  stock_quantity: number;
  minimum_stock_level: number;
  is_low_stock: boolean;
  full_name: string;
  formatted_size: string;
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

export default function FramesIndex({ frames }: { frames: any }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', gender: '', low_stock: false });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/optics/frames', { search, ...filters }, { preserveState: true });
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  return (
    <AdminLayout>
      <Head title="Frames Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Frames Management</h1>
            <p className="text-gray-600">Manage your frame inventory</p>
          </div>
          <Link href="/optics/frames/create">
            <Button>
              <Plus className="w-4 h-4" />
              <span>Add Frame</span>
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by brand, model, or SKU..."
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={filters.type}
              onChange={(e: any) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="frame">Frame</option>
              <option value="sunglasses">Sunglasses</option>
              <option value="reading_glasses">Reading Glasses</option>
              <option value="progressive">Progressive</option>
              <option value="bifocal">Bifocal</option>
            </Select>
            <Select
              value={filters.gender}
              onChange={(e: any) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="">All Genders</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
              <option value="kids">Kids</option>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </div>
        </div>

        {/* Frames Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.data.map((frame: Frame) => (
            <div key={frame.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{frame.full_name}</h3>
                    <p className="text-sm text-gray-600">SKU: {frame.sku}</p>
                  </div>
                  {frame.is_low_stock && (
                    <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span className="text-xs">Low Stock</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{frame.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material:</span>
                    <span className="capitalize">{frame.material}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gender:</span>
                    <span className="capitalize">{frame.gender}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span>{frame.formatted_size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={frame.is_low_stock ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {frame.stock_quantity} pcs
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Purchase Price</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(frame.purchase_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Selling Price</p>
                      <p className="font-semibold text-green-600">{formatCurrency(frame.selling_price)}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/optics/frames/${frame.id}/edit`} className="flex-1">
                      <Button variant="secondary" className="w-full justify-center">
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                    </Link>
                    <Link href={`/optics/stock/add?item_type=glasses&item_id=${frame.id}`}>
                      <Button variant="success">
                        <Package className="w-4 h-4" />
                        <span>Add Stock</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {frames.links && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {frames.links.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : link.url
                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
