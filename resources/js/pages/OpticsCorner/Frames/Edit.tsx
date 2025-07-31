import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save } from 'lucide-react';

interface Frame {
  id: number;
  brand: string;
  model: string;
  type: string;
  frame_type: string;
  material: string;
  color?: string;
  gender: string;
  size?: string;
  lens_width?: number;
  bridge_width?: number;
  temple_length?: number;
  shape?: string;
  purchase_price: number;
  selling_price: number;
  minimum_stock_level: number;
  description?: string;
  is_active: boolean;
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

export default function FrameEdit({ frame }: { frame: Frame }) {
  const { data, setData, put, processing, errors } = useForm({
    brand: frame.brand || '',
    model: frame.model || '',
    type: frame.type || 'frame',
    frame_type: frame.frame_type || 'full_rim',
    material: frame.material || 'plastic',
    color: frame.color || '',
    gender: frame.gender || 'unisex',
    size: frame.size || '',
    lens_width: frame.lens_width || '',
    bridge_width: frame.bridge_width || '',
    temple_length: frame.temple_length || '',
    shape: frame.shape || '',
    purchase_price: frame.purchase_price || '',
    selling_price: frame.selling_price || '',
    minimum_stock_level: frame.minimum_stock_level || 5,
    description: frame.description || '',
    is_active: frame.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/optics/frames/${frame.id}`);
  };

  return (
    <AdminLayout>
      <Head title="Edit Frame" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/optics/frames">
            <Button variant="secondary">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Frame</h1>
            <p className="text-gray-600">Update frame details</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <Input
              label="Brand *"
              value={data.brand}
              onChange={(e: any) => setData('brand', e.target.value)}
              error={errors.brand}
              placeholder="e.g., Ray-Ban, Oakley"
            />

            <Input
              label="Model *"
              value={data.model}
              onChange={(e: any) => setData('model', e.target.value)}
              error={errors.model}
              placeholder="e.g., Aviator, Wayfarer"
            />

            <Select
              label="Type *"
              value={data.type}
              onChange={(e: any) => setData('type', e.target.value)}
              error={errors.type}
            >
              <option value="frame">Frame</option>
              <option value="sunglasses">Sunglasses</option>
              <option value="reading_glasses">Reading Glasses</option>
              <option value="progressive">Progressive</option>
              <option value="bifocal">Bifocal</option>
            </Select>

            <Select
              label="Frame Type *"
              value={data.frame_type}
              onChange={(e: any) => setData('frame_type', e.target.value)}
              error={errors.frame_type}
            >
              <option value="full_rim">Full Rim</option>
              <option value="half_rim">Half Rim</option>
              <option value="rimless">Rimless</option>
            </Select>

            <Select
              label="Material *"
              value={data.material}
              onChange={(e: any) => setData('material', e.target.value)}
              error={errors.material}
            >
              <option value="plastic">Plastic</option>
              <option value="metal">Metal</option>
              <option value="titanium">Titanium</option>
              <option value="acetate">Acetate</option>
              <option value="wood">Wood</option>
            </Select>

            <Input
              label="Color"
              value={data.color}
              onChange={(e: any) => setData('color', e.target.value)}
              error={errors.color}
              placeholder="e.g., Black, Brown, Blue"
            />

            <Select
              label="Gender *"
              value={data.gender}
              onChange={(e: any) => setData('gender', e.target.value)}
              error={errors.gender}
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
              <option value="kids">Kids</option>
            </Select>

            <Input
              label="Shape"
              value={data.shape}
              onChange={(e: any) => setData('shape', e.target.value)}
              error={errors.shape}
              placeholder="e.g., Round, Square, Oval"
            />

            {/* Measurements */}
            <Input
              label="Lens Width (mm)"
              type="number"
              step="0.01"
              value={data.lens_width}
              onChange={(e: any) => setData('lens_width', e.target.value)}
              error={errors.lens_width}
              placeholder="e.g., 52.00"
            />

            <Input
              label="Bridge Width (mm)"
              type="number"
              step="0.01"
              value={data.bridge_width}
              onChange={(e: any) => setData('bridge_width', e.target.value)}
              error={errors.bridge_width}
              placeholder="e.g., 18.00"
            />

            <Input
              label="Temple Length (mm)"
              type="number"
              step="0.01"
              value={data.temple_length}
              onChange={(e: any) => setData('temple_length', e.target.value)}
              error={errors.temple_length}
              placeholder="e.g., 140.00"
            />

            <Input
              label="Size"
              value={data.size}
              onChange={(e: any) => setData('size', e.target.value)}
              error={errors.size}
              placeholder="e.g., Medium, Large"
            />

            {/* Pricing */}
            <Input
              label="Purchase Price *"
              type="number"
              step="0.01"
              value={data.purchase_price}
              onChange={(e: any) => setData('purchase_price', e.target.value)}
              error={errors.purchase_price}
              placeholder="0.00"
            />

            <Input
              label="Selling Price *"
              type="number"
              step="0.01"
              value={data.selling_price}
              onChange={(e: any) => setData('selling_price', e.target.value)}
              error={errors.selling_price}
              placeholder="0.00"
            />

            <Input
              label="Minimum Stock Level *"
              type="number"
              value={data.minimum_stock_level}
              onChange={(e: any) => setData('minimum_stock_level', e.target.value)}
              error={errors.minimum_stock_level}
              placeholder="5"
            />
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e: any) => setData('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this frame..."
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Active Status */}
          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.is_active}
                onChange={(e: any) => setData('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Active (available for sale)</span>
            </label>
          </div>

          {/* Submit */}
          <div className="mt-8 flex justify-end space-x-4">
            <Link href="/optics/frames">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={processing}>
              <Save className="w-4 h-4" />
              <span>{processing ? 'Saving...' : 'Update Frame'}</span>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
