import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Search, Edit3, Package, AlertTriangle, Save } from 'lucide-react';

interface LensType {
  id: number;
  name: string;
  type: string;
  material: string;
  coating?: string;
  price: number;
  stock_quantity: number;
  minimum_stock_level: number;
  is_low_stock: boolean;
  description?: string;
  is_active: boolean;
  created_at: string;
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

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default function LensTypesIndex({ lensTypes }: { lensTypes: any }) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    type: '',
    material: '',
    coating: '',
    price: '',
    stock_quantity: 0,
    minimum_stock_level: 5,
    description: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/optics/lens-types', { search }, { preserveState: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/optics/lens-types', {
      onSuccess: () => {
        setShowAddModal(false);
        reset();
      }
    });
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <AdminLayout>
      <Head title="Lens Types Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lens Types Management</h1>
            <p className="text-gray-600">Manage your lens inventory</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Lens Type</span>
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by name, type, or material..."
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </div>
        </div>

        {/* Lens Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lensTypes.data.map((lens: LensType) => (
            <div key={lens.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lens.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{lens.type}</p>
                  </div>
                  {lens.is_low_stock && (
                    <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span className="text-xs">Low Stock</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Material:</span>
                    <span className="capitalize">{lens.material}</span>
                  </div>
                  {lens.coating && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coating:</span>
                      <span className="capitalize">{lens.coating}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={lens.is_low_stock ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {lens.stock_quantity} pcs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Min Level:</span>
                    <span>{lens.minimum_stock_level} pcs</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(lens.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Added</p>
                      <p className="text-sm text-gray-700">{formatDate(lens.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="secondary" className="flex-1 justify-center">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    <Link href={`/optics/stock/add?item_type=lens_types&item_id=${lens.id}`}>
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
        {lensTypes.links && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {lensTypes.links.map((link: any, index: number) => (
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

      {/* Add Lens Type Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lens Type">
        <div className="space-y-4">
          <Input
            label="Name *"
            value={data.name}
            onChange={(e: any) => setData('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Single Vision, Progressive"
          />

          <Input
            label="Type *"
            value={data.type}
            onChange={(e: any) => setData('type', e.target.value)}
            error={errors.type}
            placeholder="e.g., clear, tinted, photochromic"
          />

          <Input
            label="Material *"
            value={data.material}
            onChange={(e: any) => setData('material', e.target.value)}
            error={errors.material}
            placeholder="e.g., CR-39, Polycarbonate"
          />

          <Input
            label="Coating"
            value={data.coating}
            onChange={(e: any) => setData('coating', e.target.value)}
            error={errors.coating}
            placeholder="e.g., Anti-reflective, Blue light"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price *"
              type="number"
              step="0.01"
              value={data.price}
              onChange={(e: any) => setData('price', e.target.value)}
              error={errors.price}
              placeholder="0.00"
            />

            <Input
              label="Initial Stock *"
              type="number"
              value={data.stock_quantity}
              onChange={(e: any) => setData('stock_quantity', e.target.value)}
              error={errors.stock_quantity}
              placeholder="0"
            />
          </div>

          <Input
            label="Minimum Stock Level *"
            type="number"
            value={data.minimum_stock_level}
            onChange={(e: any) => setData('minimum_stock_level', e.target.value)}
            error={errors.minimum_stock_level}
            placeholder="5"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e: any) => setData('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this lens type..."
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} type="button">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={processing}>
              <Save className="w-4 h-4" />
              <span>{processing ? 'Adding...' : 'Add Lens Type'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
