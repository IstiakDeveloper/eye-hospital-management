import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';

const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    };

    return (
        <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Input = ({ label, error, required, className = '', ...props }: any) => (
    <div className={className}>
        {label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
            }`}
            {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

const Select = ({ label, error, required, children, className = '', ...props }: any) => (
    <div className={className}>
        {label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
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

export default function CreateVendor() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        trade_license: '',
        opening_balance: 0,
        balance_type: 'due' as 'due' | 'advance',
        credit_limit: 0,
        payment_terms_days: 30,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('optics.vendors.store'));
    };

    return (
        <AdminLayout>
            <Head title="Add Vendor" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Link href={route('optics.vendors.index')}>
                        <Button variant="secondary">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add Vendor</h1>
                        <p className="text-gray-600">Add a new supplier to your vendor list</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm border p-8">
                        {/* Info Alert */}
                        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Vendor Information</p>
                                    <p>Add vendor details to track purchases, payments, and due amounts. Opening balance helps maintain accurate records from the start.</p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Vendor Name"
                                    value={data.name}
                                    onChange={(e: any) => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="e.g., ABC Optical Supplies"
                                    required
                                />

                                <Input
                                    label="Company Name"
                                    value={data.company_name}
                                    onChange={(e: any) => setData('company_name', e.target.value)}
                                    error={errors.company_name}
                                    placeholder="e.g., ABC Corp Ltd."
                                />

                                <Input
                                    label="Contact Person"
                                    value={data.contact_person}
                                    onChange={(e: any) => setData('contact_person', e.target.value)}
                                    error={errors.contact_person}
                                    placeholder="e.g., John Doe"
                                />

                                <Input
                                    label="Phone"
                                    value={data.phone}
                                    onChange={(e: any) => setData('phone', e.target.value)}
                                    error={errors.phone}
                                    placeholder="e.g., 01712345678"
                                    required
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e: any) => setData('email', e.target.value)}
                                    error={errors.email}
                                    placeholder="e.g., vendor@example.com"
                                />

                                <Input
                                    label="Trade License"
                                    value={data.trade_license}
                                    onChange={(e: any) => setData('trade_license', e.target.value)}
                                    error={errors.trade_license}
                                    placeholder="e.g., TL-123456"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Address
                            </h2>
                            <textarea
                                value={data.address}
                                onChange={(e: any) => setData('address', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter complete address..."
                            />
                            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                        </div>

                        {/* Financial Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Financial Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Opening Balance"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.opening_balance}
                                    onChange={(e: any) => setData('opening_balance', parseFloat(e.target.value) || 0)}
                                    error={errors.opening_balance}
                                    placeholder="0.00"
                                />

                                <Select
                                    label="Balance Type"
                                    value={data.balance_type}
                                    onChange={(e: any) => setData('balance_type', e.target.value as 'due' | 'advance')}
                                    error={errors.balance_type}
                                    required
                                >
                                    <option value="due">Due (We Owe Them)</option>
                                    <option value="advance">Advance (They Owe Us)</option>
                                </Select>

                                <Input
                                    label="Credit Limit"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.credit_limit}
                                    onChange={(e: any) => setData('credit_limit', parseFloat(e.target.value) || 0)}
                                    error={errors.credit_limit}
                                    placeholder="0.00"
                                />

                                <Input
                                    label="Payment Terms (Days)"
                                    type="number"
                                    min="0"
                                    value={data.payment_terms_days}
                                    onChange={(e: any) => setData('payment_terms_days', parseInt(e.target.value) || 0)}
                                    error={errors.payment_terms_days}
                                    placeholder="30"
                                />
                            </div>

                            {/* Balance Info */}
                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Opening Balance Summary</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {data.balance_type === 'due'
                                                ? 'Amount you owe to this vendor'
                                                : 'Amount vendor owes to you'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${
                                            data.balance_type === 'due' ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                            ৳{data.opening_balance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Additional Notes
                            </h2>
                            <textarea
                                value={data.notes}
                                onChange={(e: any) => setData('notes', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Any additional information about this vendor..."
                            />
                            {errors.notes && <p className="text-red-600 text-sm mt-1">{errors.notes}</p>}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <Link href={route('optics.vendors.index')}>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving...' : 'Save Vendor'}</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
