import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    CreditCard, DollarSign, Calendar, FileText, AlertCircle,
    CheckCircle, User, Phone, TestTube, ArrowLeft, Receipt
} from 'lucide-react';

interface Patient {
    patient_id: string;
    name: string;
    phone: string;
}

interface MedicalTestInfo {
    name: string;
    code: string;
    category: string;
}

interface Test {
    id: number;
    medical_test: MedicalTestInfo;
    original_price: number;
    discount_amount: number;
    final_price: number;
}

interface Payment {
    id: number;
    payment_number: string;
    amount: number;
    payment_date: string;
}

interface TestGroup {
    id: number;
    group_number: string;
    patient: Patient;
    tests: Test[];
    total_original_price: number;
    total_discount: number;
    final_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    test_date: string;
    payments: Payment[];
}

interface PaymentMethod {
    id: number;
    name: string;
    is_active: boolean;
}

interface Props {
    testGroup: TestGroup;
    paymentMethods: PaymentMethod[];
}

export default function Payment({ testGroup, paymentMethods }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        amount: testGroup.due_amount.toString(),
        payment_method_id: '1',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [paymentAmount, setPaymentAmount] = useState(testGroup.due_amount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/medical-tests/${testGroup.id}/add-payment`);
    };

    const formatCurrency = (amount: number) => {
        return `৳${Number(amount).toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleAmountChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        setPaymentAmount(numValue);
        setData('amount', value);
    };

    const setFullDueAmount = () => {
        setPaymentAmount(testGroup.due_amount);
        setData('amount', testGroup.due_amount.toString());
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit(`/medical-tests/${testGroup.id}`)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Details
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Add Payment</h1>
                        <p className="text-gray-600 mt-1">Record due payment for test group</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    Payment Information
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Payment Amount <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={testGroup.due_amount}
                                                value={data.amount}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.amount && (
                                            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={setFullDueAmount}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Pay Full Due Amount ({formatCurrency(testGroup.due_amount)})
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Payment Method <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.payment_method_id}
                                            onChange={(e) => setData('payment_method_id', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.payment_method_id ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select Payment Method</option>
                                            {paymentMethods.map((method) => (
                                                <option key={method.id} value={method.id}>
                                                    {method.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.payment_method_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.payment_method_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Payment Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={data.payment_date}
                                                onChange={(e) => setData('payment_date', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add any notes about this payment..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={processing}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            {processing ? 'Processing...' : 'Add Payment'}
                                        </button>
                                        <button
                                            onClick={() => router.visit(`/medical-tests/${testGroup.id}`)}
                                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Receipt className="w-5 h-5" />
                                    Test Group Info
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Amount:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(testGroup.final_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Paid Amount:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(testGroup.paid_amount)}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900">Due Amount:</span>
                                            <span className="font-bold text-lg text-red-600">
                                                {formatCurrency(testGroup.due_amount)}
                                            </span>
                                        </div>
                                    </div>
                                    {paymentAmount > 0 && (
                                        <>
                                            <div className="pt-3 border-t border-gray-200">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Paying Now:</span>
                                                    <span className="font-bold text-blue-600">
                                                        {formatCurrency(paymentAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-gray-900">Remaining Due:</span>
                                                <span className="font-bold text-red-600">
                                                    {formatCurrency(Math.max(0, testGroup.due_amount - paymentAmount))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TestTube className="w-5 h-5 text-indigo-600" />
                                    Tests in Group
                                </h3>
                                <div className="space-y-2">
                                    {testGroup.tests.map((test, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-sm py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{test.medical_test.name}</div>
                                                <div className="text-xs text-gray-500">{test.medical_test.code}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-900">
                                                    {formatCurrency(test.final_price)}
                                                </div>
                                                {test.discount_amount > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        -{formatCurrency(test.discount_amount)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {testGroup.payments.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-orange-600" />
                                        Previous Payments
                                    </h3>
                                    <div className="space-y-2">
                                        {testGroup.payments.map((payment, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                                <div>
                                                    <div className="font-semibold text-gray-900">{payment.payment_number}</div>
                                                    <div className="text-xs text-gray-500">{formatDate(payment.payment_date)}</div>
                                                </div>
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold mb-1">Important Note</p>
                                        <p>Please verify the payment amount before proceeding. This action cannot be undone.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
