import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name: string | null;
    phone: string;
}

interface CreateProps {
    vendors: Vendor[];
    errors?: Record<string, string>;
}

const Create: React.FC<CreateProps> = ({ vendors }) => {
    const [payInFull, setPayInFull] = useState(true);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        vendor_id: '',
        name: '',
        description: '',
        quantity: '',
        total_amount: '',
        paid_amount: '',
        purchase_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (payInFull && data.total_amount) {
            setData('paid_amount', data.total_amount);
        }
    }, [data.total_amount, payInFull]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'total_amount' && payInFull) {
            setData({ total_amount: value, paid_amount: value });
        } else {
            setData(name as keyof typeof data, value);
        }
        if (errors[name as keyof typeof errors]) {
            clearErrors(name as keyof typeof errors);
        }
    };

    const handlePayInFullChange = (checked: boolean) => {
        setPayInFull(checked);
        if (checked && data.total_amount) {
            setData('paid_amount', data.total_amount);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('hospital-account.fixed-assets.store'), { preserveScroll: true });
    };

    const totalNum = parseFloat(data.total_amount || '0');
    const paidNum = parseFloat(data.paid_amount || '0');
    const dueAmount = totalNum - paidNum;

    return (
        <HospitalAccountLayout title="Add Fixed Asset">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6">
                    <Link
                        href={route('hospital-account.fixed-assets.index')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fixed Assets
                    </Link>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-md">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">Add New Asset</h1>
                    <p className="mb-6 text-sm text-gray-500">
                        Paid amount is deducted from hospital account. Remaining balance goes to vendor as due.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <p className="font-medium">Please fix the following:</p>
                                <ul className="mt-2 list-inside list-disc space-y-1">
                                    {Object.entries(errors).map(([field, message]) => (
                                        <li key={field}>{message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Asset Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Office Chair, Interior Design..."
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Vendor <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="vendor_id"
                                value={data.vendor_id}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.vendor_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select a vendor</option>
                                {vendors.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name} {vendor.company_name && `(${vendor.company_name})`} - {vendor.phone}
                                    </option>
                                ))}
                            </select>
                            {errors.vendor_id && <p className="mt-1 text-sm text-red-600">{errors.vendor_id}</p>}
                            <p className="mt-1 text-sm text-gray-500">
                                <Link href={route('hospital-account.fixed-asset-vendors.create')} className="text-blue-600 hover:text-blue-800">
                                    Add new vendor
                                </Link>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity (optional)</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    value={data.quantity}
                                    onChange={handleInputChange}
                                    className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                        errors.quantity ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g. 10"
                                />
                                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Total Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-3 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="total_amount"
                                        value={data.total_amount}
                                        onChange={handleInputChange}
                                        required
                                        min="1"
                                        className={`w-full rounded-lg border py-2 pr-4 pl-8 focus:ring-2 focus:ring-blue-500 ${
                                            errors.total_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 flex cursor-pointer items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={payInFull}
                                        onChange={(e) => handlePayInFullChange(e.target.checked)}
                                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Pay full amount from hospital account now</span>
                                </label>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Paid Now (Hospital Account) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-2 left-3 text-gray-500">৳</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="paid_amount"
                                        value={data.paid_amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        max={totalNum > 0 ? totalNum : undefined}
                                        disabled={payInFull}
                                        className={`w-full rounded-lg border py-2 pr-4 pl-8 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                                            errors.paid_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.paid_amount && <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>}
                                <p className="mt-1 text-xs text-gray-500">Only this amount creates a hospital transaction.</p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Vendor Due</label>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                    <p className="text-2xl font-bold text-red-600">৳{dueAmount > 0 ? dueAmount.toLocaleString() : '0'}</p>
                                    <p className="mt-1 text-xs text-gray-500">Pay later from Fixed Asset Vendors</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={data.description}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Optional notes..."
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Purchase Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={data.purchase_date}
                                onChange={handleInputChange}
                                required
                                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                                    errors.purchase_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.purchase_date && <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>}
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-blue-900">Payment Summary</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Total Amount:</span>
                                    <span className="font-semibold text-blue-900">৳{totalNum.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Paid Now:</span>
                                    <span className="font-semibold text-green-600">৳{paidNum.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-2">
                                    <span className="font-medium text-blue-700">Vendor Due:</span>
                                    <span className="font-bold text-red-600">৳{dueAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Saving...' : 'Add Asset'}
                            </button>
                            <Link
                                href={route('hospital-account.fixed-assets.index')}
                                className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalAccountLayout>
    );
};

export default Create;
