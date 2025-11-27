import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/MainAccountLayout';
import { Calendar, FileText, TrendingUp, TrendingDown } from 'lucide-react';

const Reports: React.FC = () => {
    const [formData, setFormData] = useState({
        reportType: 'daily',
        voucherType: 'Debit',
        date: new Date().toISOString().split('T')[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const params = {
            voucher_type: formData.voucherType,
        };

        if (formData.reportType === 'daily') {
            router.get('/main-account/daily-report', {
                ...params,
                date: formData.date
            });
        } else if (formData.reportType === 'monthly') {
            router.get('/main-account/monthly-report', {
                ...params,
                month: formData.month,
                year: formData.year
            });
        } else if (formData.reportType === 'yearly') {
            router.get('/main-account/yearly-report', {
                ...params,
                year: formData.year
            });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">

                <div className="bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: 'daily', label: 'Daily Report', icon: Calendar },
                                    { value: 'monthly', label: 'Monthly Report', icon: FileText },
                                    { value: 'yearly', label: 'Yearly Report', icon: TrendingUp },
                                ].map((option) => (
                                    <label key={option.value} className="relative">
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value={option.value}
                                            checked={formData.reportType === option.value}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${formData.reportType === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}>
                                            <option.icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Voucher Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Voucher Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: 'Debit', label: 'Debit Voucher', icon: TrendingDown },
                                    { value: 'Credit', label: 'Credit Voucher', icon: TrendingUp },
                                ].map((option) => (
                                    <label key={option.value} className="relative">
                                        <input
                                            type="radio"
                                            name="voucherType"
                                            value={option.value}
                                            checked={formData.voucherType === option.value}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`p-4 rounded-lg border-2 cursor-pointer text-center ${formData.voucherType === option.value
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}>
                                            <option.icon className={`w-6 h-6 mx-auto mb-2 ${option.value === 'Debit' ? 'text-red-600' : 'text-green-600'
                                                }`} />
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-4">
                            {formData.reportType === 'daily' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            )}

                            {formData.reportType === 'monthly' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                                        <select
                                            name="month"
                                            value={formData.month}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {Array.from({ length: 10 }, (_, i) => {
                                                const year = new Date().getFullYear() - 5 + i;
                                                return (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {formData.reportType === 'yearly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                    <select
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const year = new Date().getFullYear() - 5 + i;
                                            return (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                            Generate Report
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Reports;
