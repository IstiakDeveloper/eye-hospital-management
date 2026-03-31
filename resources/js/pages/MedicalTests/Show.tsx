import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, CreditCard, DollarSign, FileText, Printer, Receipt, Trash2, User } from 'lucide-react';
import { useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    address?: string;
}

interface Visit {
    visit_id: string;
}

interface MedicalTest {
    name: string;
    code: string;
    category: string;
}

interface Test {
    id: number;
    test_number: string;
    medical_test: MedicalTest;
    original_price: number;
    discount_amount: number;
    final_price: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    test_status: string;
    test_date: string;
    result?: string;
    notes?: string;
}

interface PaymentMethod {
    name: string;
}

interface ReceivedBy {
    name: string;
}

interface Payment {
    id: number;
    payment_number: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    received_by: ReceivedBy;
    notes?: string;
    created_at: string;
}

interface CreatedBy {
    name: string;
}

interface HospitalTransaction {
    transaction_no: string;
    amount: number;
}

interface TestGroup {
    id: number;
    group_number: string;
    patient: Patient;
    visit?: Visit;
    tests: Test[];
    payments: Payment[];
    total_original_price: number;
    total_discount: number;
    final_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    test_date: string;
    created_at: string;
    created_by?: CreatedBy;
    hospital_transaction?: HospitalTransaction;
}

export default function Show({ testGroup }: { testGroup: TestGroup }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(testGroup.due_amount);

    const formatCurrency = (amount: number) => {
        return `৳${parseFloat(amount.toString()).toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-red-100 text-red-800 border-red-200',
            partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            paid: 'bg-green-100 text-green-800 border-green-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        const icons = {
            pending: <AlertCircle className="h-3 w-3" />,
            partial: <Clock className="h-3 w-3" />,
            paid: <CheckCircle className="h-3 w-3" />,
            completed: <CheckCircle className="h-3 w-3" />,
            in_progress: <Clock className="h-3 w-3" />,
            cancelled: <Trash2 className="h-3 w-3" />,
        };

        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}
            >
                {icons[status as keyof typeof icons]}
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.visit('/medical-tests')} className="rounded-lg p-2 transition hover:bg-gray-100">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Test Group Details</h1>
                                <p className="mt-1 text-gray-600">Group: {testGroup.group_number}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => router.visit(`/medical-tests/${testGroup.id}/receipt`)}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                            >
                                <Receipt className="h-4 w-4" />
                                View Receipt
                            </button>
                            <button
                                onClick={() => router.visit(`/medical-tests/${testGroup.id}/print`)}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </button>
                            {testGroup.payment_status !== 'paid' && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Add Payment
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-100">Total Amount</p>
                                    <p className="mt-1 text-3xl font-bold">{formatCurrency(testGroup.final_amount)}</p>
                                </div>
                                <DollarSign className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-100">Paid Amount</p>
                                    <p className="mt-1 text-3xl font-bold">{formatCurrency(testGroup.paid_amount)}</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-green-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-100">Due Amount</p>
                                    <p className="mt-1 text-3xl font-bold">{formatCurrency(testGroup.due_amount)}</p>
                                </div>
                                <AlertCircle className="h-12 w-12 text-red-200" />
                            </div>
                        </div>

                        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-100">Total Tests</p>
                                    <p className="mt-1 text-3xl font-bold">{testGroup.tests.length}</p>
                                </div>
                                <FileText className="h-12 w-12 text-purple-200" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Patient Information */}
                            <div className="rounded-lg bg-white p-6 shadow">
                                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Patient Information
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-600">Patient ID</label>
                                        <p className="font-semibold">{testGroup.patient.patient_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Name</label>
                                        <p className="font-semibold">{testGroup.patient.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Phone</label>
                                        <p className="font-semibold">{testGroup.patient.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Age / Gender</label>
                                        <p className="font-semibold">
                                            {testGroup.patient.age || 'N/A'} / {testGroup.patient.gender || 'N/A'}
                                        </p>
                                    </div>
                                    {testGroup.visit && (
                                        <div>
                                            <label className="text-sm text-gray-600">Visit ID</label>
                                            <p className="font-semibold">{testGroup.visit.visit_id}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm text-gray-600">Test Date</label>
                                        <p className="font-semibold">{formatDate(testGroup.test_date)}</p>
                                    </div>
                                    {testGroup.patient.address && (
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-600">Address</label>
                                            <p className="font-semibold">{testGroup.patient.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tests List */}
                            <div className="rounded-lg bg-white p-6 shadow">
                                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Ordered Tests
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Test</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Final</th>
                                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {testGroup.tests.map((test) => (
                                                <tr key={test.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{test.medical_test.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {test.medical_test.code} • {test.medical_test.category}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(test.original_price)}</td>
                                                    <td className="px-4 py-3 text-right text-red-600">
                                                        {test.discount_amount > 0 ? `-${formatCurrency(test.discount_amount)}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(test.final_price)}</td>
                                                    <td className="px-4 py-3 text-center">{getStatusBadge(test.test_status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-3">Total</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(testGroup.total_original_price)}</td>
                                                <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(testGroup.total_discount)}</td>
                                                <td className="px-4 py-3 text-right text-lg text-blue-600">
                                                    {formatCurrency(testGroup.final_amount)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Payment History */}
                            {testGroup.payments.length > 0 && (
                                <div className="rounded-lg bg-white p-6 shadow">
                                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                        Payment History
                                    </h2>
                                    <div className="space-y-3">
                                        {testGroup.payments.map((payment) => (
                                            <div key={payment.id} className="rounded-lg border border-gray-200 p-4">
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div>
                                                        <div className="font-semibold text-blue-600">{payment.payment_number}</div>
                                                        <div className="text-sm text-gray-500">{formatDateTime(payment.created_at)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Method:</span>
                                                        <span className="ml-2 font-medium">{payment.payment_method.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Date:</span>
                                                        <span className="ml-2 font-medium">{formatDate(payment.payment_date)}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-600">Received by:</span>
                                                        <span className="ml-2 font-medium">{payment.received_by.name}</span>
                                                    </div>
                                                    {payment.notes && (
                                                        <div className="col-span-2">
                                                            <span className="text-gray-600">Notes:</span>
                                                            <span className="ml-2 font-medium">{payment.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Payment Summary */}
                            <div className="rounded-lg bg-white p-6 shadow">
                                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                    Payment Summary
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold">{formatCurrency(testGroup.total_original_price)}</span>
                                    </div>
                                    {testGroup.total_discount > 0 && (
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <span className="text-red-600">Discount</span>
                                            <span className="font-semibold text-red-600">-{formatCurrency(testGroup.total_discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="font-bold text-gray-900">Total Amount</span>
                                        <span className="text-xl font-bold text-blue-600">{formatCurrency(testGroup.final_amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-green-600">Paid Amount</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(testGroup.paid_amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-red-600">Due Amount</span>
                                        <span className="text-xl font-bold text-red-600">{formatCurrency(testGroup.due_amount)}</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="text-center">{getStatusBadge(testGroup.payment_status)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Group Information */}
                            <div className="rounded-lg bg-white p-6 shadow">
                                <h2 className="mb-4 text-xl font-semibold">Group Information</h2>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-600">Group Number</label>
                                        <p className="font-semibold text-blue-600">{testGroup.group_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-gray-600">Created At</label>
                                        <p className="font-semibold">{formatDateTime(testGroup.created_at)}</p>
                                    </div>
                                    {testGroup.created_by && (
                                        <div>
                                            <label className="text-gray-600">Created By</label>
                                            <p className="font-semibold">{testGroup.created_by.name}</p>
                                        </div>
                                    )}
                                    {testGroup.hospital_transaction && (
                                        <div>
                                            <label className="text-gray-600">Transaction No</label>
                                            <p className="font-semibold">{testGroup.hospital_transaction.transaction_no}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        <div className="p-6">
                            <h3 className="mb-4 text-xl font-bold">Add Payment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Payment Amount <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={testGroup.due_amount}
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Maximum: {formatCurrency(testGroup.due_amount)}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => router.visit(`/medical-tests/${testGroup.id}/payment`)}
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
