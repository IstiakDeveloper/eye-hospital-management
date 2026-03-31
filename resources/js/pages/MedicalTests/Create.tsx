import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { ArrowRight, Calendar, CreditCard, FileText, Hash, Minus, Phone, Plus, Search, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    last_visit_id?: number;
    last_visit_number?: string;
}

interface MedicalTest {
    id: number;
    name: string;
    code: string;
    category: string;
    price: number;
    description?: string;
}

interface SelectedTest {
    medical_test_id: number;
    test: MedicalTest;
    discount_amount: number;
    final_price: number;
}

interface PaymentMethod {
    id: number;
    name: string;
}

export default function MedicalTestCreate({
    tests,
    paymentMethods,
    categories,
}: {
    tests: MedicalTest[];
    paymentMethods: PaymentMethod[];
    categories: Record<string, string>;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [paymentMethodId, setPaymentMethodId] = useState<number>(paymentMethods[0]?.id || 1);
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Search patients
    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`/medical-tests/search-patients?search=${query}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) searchPatients(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleAddTest = (test: MedicalTest) => {
        if (selectedTests.some((t) => t.medical_test_id === test.id)) {
            setSelectedTests(selectedTests.filter((t) => t.medical_test_id !== test.id));
            return;
        }

        const price = parseFloat(String(test.price)) || 0;
        setSelectedTests([
            ...selectedTests,
            {
                medical_test_id: test.id,
                test: { ...test, price },
                discount_amount: 0,
                final_price: price,
            },
        ]);
    };

    const handleRemoveTest = (testId: number) => {
        setSelectedTests(selectedTests.filter((t) => t.medical_test_id !== testId));
    };

    const handleDiscountChange = (testId: number, discount: number) => {
        setSelectedTests(
            selectedTests.map((t) => {
                if (t.medical_test_id === testId) {
                    const price = parseFloat(String(t.test.price)) || 0;
                    const discountAmount = Math.min(Math.max(0, discount), price);
                    return {
                        ...t,
                        discount_amount: discountAmount,
                        final_price: price - discountAmount,
                    };
                }
                return t;
            }),
        );
    };

    const totalOriginal = selectedTests.reduce((sum, t) => sum + (parseFloat(String(t.test.price)) || 0), 0);
    const totalDiscount = selectedTests.reduce((sum, t) => sum + (parseFloat(String(t.discount_amount)) || 0), 0);
    const totalFinal = selectedTests.reduce((sum, t) => sum + (parseFloat(String(t.final_price)) || 0), 0);
    const paidAmountNum = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, totalFinal - paidAmountNum);

    // Auto-update paid amount when total changes
    useEffect(() => {
        if (totalFinal > 0) {
            setPaidAmount(totalFinal.toFixed(2));
        } else {
            setPaidAmount('');
        }
    }, [totalFinal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || selectedTests.length === 0) {
            alert('Please select a patient and at least one test');
            return;
        }

        if (paidAmountNum > totalFinal) {
            alert('Paid amount cannot exceed total amount');
            return;
        }

        const formData = {
            patient_id: selectedPatient.id,
            visit_id: selectedPatient.last_visit_id,
            tests: selectedTests.map((t) => ({
                medical_test_id: t.medical_test_id,
                discount_amount: t.discount_amount,
            })),
            payment_method_id: paymentMethodId,
            paid_amount: paidAmountNum,
            test_date: testDate,
            notes,
        };

        setLoading(true);
        router.post('/medical-tests', formData, {
            onFinish: () => setLoading(false),
        });
    };

    const filteredTests = selectedCategory === 'all' ? tests : tests.filter((t) => t.category === selectedCategory);

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Medical Test Booking</h1>
                        <p className="mt-1 text-gray-600">Book medical tests for patients</p>
                    </div>

                    <div className="mb-8 flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${selectedPatient ? 'text-green-600' : 'text-blue-600'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${selectedPatient ? 'bg-green-600' : 'bg-blue-600'} font-bold text-white`}
                            >
                                1
                            </div>
                            <span className="font-medium">Select Patient</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className={`flex items-center gap-2 ${selectedTests.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${selectedTests.length > 0 ? 'bg-green-600' : 'bg-gray-300'} font-bold text-white`}
                            >
                                2
                            </div>
                            <span className="font-medium">Select Tests</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className={`flex items-center gap-2 ${selectedTests.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${selectedTests.length > 0 ? 'bg-blue-600' : 'bg-gray-300'} font-bold text-white`}
                            >
                                3
                            </div>
                            <span className="font-medium">Payment</span>
                        </div>
                    </div>

                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                        <div className="mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            <h2 className="text-xl font-semibold">Step 1: Select Patient</h2>
                        </div>

                        {!selectedPatient ? (
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by Patient ID, Name, Phone, or NID..."
                                        className="w-full rounded-lg border py-3 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                                        {searchResults.map((patient) => (
                                            <div
                                                key={patient.id}
                                                onClick={() => handleSelectPatient(patient)}
                                                className="cursor-pointer border-b p-4 transition last:border-b-0 hover:bg-blue-50"
                                            >
                                                <div className="text-lg font-semibold text-gray-900">{patient.name}</div>
                                                <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Hash className="h-4 w-4" />
                                                        {patient.patient_id}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4" />
                                                        {patient.phone}
                                                    </span>
                                                    {patient.age && <span>Age: {patient.age}</span>}
                                                    {patient.gender && <span>{patient.gender}</span>}
                                                </div>
                                                {patient.last_visit_number && (
                                                    <div className="mt-1 text-xs text-blue-600">Last Visit: {patient.last_visit_number}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-4">
                                <div>
                                    <div className="text-lg font-semibold text-gray-900">{selectedPatient.name}</div>
                                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Hash className="h-4 w-4" />
                                            {selectedPatient.patient_id}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            {selectedPatient.phone}
                                        </span>
                                        {selectedPatient.last_visit_number && (
                                            <span className="text-blue-600">Visit: {selectedPatient.last_visit_number}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setSelectedTests([]);
                                        setPaidAmount('');
                                    }}
                                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-red-600 transition hover:bg-red-100"
                                >
                                    <X className="h-4 w-4" />
                                    Change
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedPatient && (
                        <>
                            <div className="mb-6 rounded-lg bg-white p-6 shadow">
                                <div className="mb-4 flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold">Step 2: Select Tests</h2>
                                    {selectedTests.length > 0 && (
                                        <span className="ml-auto rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                            {selectedTests.length} selected
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory('all')}
                                        className={`rounded-lg px-4 py-2 font-medium transition ${
                                            selectedCategory === 'all'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        All Tests ({tests.length})
                                    </button>
                                    {Object.entries(categories).map(([key, value]) => {
                                        const count = tests.filter((t) => t.category === key).length;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setSelectedCategory(key)}
                                                className={`rounded-lg px-4 py-2 font-medium transition ${
                                                    selectedCategory === key
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {value} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredTests.map((test) => {
                                        const isSelected = selectedTests.some((t) => t.medical_test_id === test.id);
                                        return (
                                            <div
                                                key={test.id}
                                                onClick={() => handleAddTest(test)}
                                                className={`transform cursor-pointer rounded-lg border-2 p-4 transition hover:scale-105 ${
                                                    isSelected
                                                        ? 'border-green-500 bg-green-50 shadow-lg'
                                                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="mb-2 flex justify-end">
                                                        <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
                                                            ✓ Selected
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="font-semibold text-gray-900">{test.name}</div>
                                                <div className="mt-1 text-sm text-gray-500">{test.code}</div>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">{test.category}</span>
                                                    <span className="text-xl font-bold text-blue-600">
                                                        ৳{parseFloat(String(test.price)).toFixed(2)}
                                                    </span>
                                                </div>
                                                {test.description && (
                                                    <div className="mt-2 line-clamp-2 text-xs text-gray-500">{test.description}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedTests.length > 0 && (
                                <>
                                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                                        <div className="mb-4 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <h2 className="text-xl font-semibold">Selected Tests Summary</h2>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Test Name</th>
                                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Final Price</th>
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {selectedTests.map((item) => (
                                                        <tr key={item.medical_test_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-gray-900">{item.test.name}</div>
                                                                <div className="text-sm text-gray-500">{item.test.code}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-900">
                                                                ৳{parseFloat(String(item.test.price)).toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDiscountChange(item.medical_test_id, item.discount_amount - 10);
                                                                        }}
                                                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                                                    >
                                                                        <Minus className="h-4 w-4" />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={item.test.price}
                                                                        step="0.01"
                                                                        value={item.discount_amount || ''}
                                                                        onChange={(e) =>
                                                                            handleDiscountChange(
                                                                                item.medical_test_id,
                                                                                parseFloat(e.target.value) || 0,
                                                                            )
                                                                        }
                                                                        className="w-24 rounded border px-2 py-1 text-right focus:ring-2 focus:ring-blue-500"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDiscountChange(item.medical_test_id, item.discount_amount + 10);
                                                                        }}
                                                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                                                ৳{parseFloat(String(item.final_price)).toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTest(item.medical_test_id)}
                                                                    className="inline-flex items-center gap-1 rounded px-3 py-1 text-red-600 transition hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 font-semibold">
                                                    <tr>
                                                        <td className="px-4 py-3 text-gray-900">Total</td>
                                                        <td className="px-4 py-3 text-right text-gray-900">৳{totalOriginal.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-red-600">-৳{totalDiscount.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-xl text-blue-600">৳{totalFinal.toFixed(2)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                                        <div className="mb-4 flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                            <h2 className="text-xl font-semibold">Step 3: Payment Details</h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Payment Method <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <CreditCard className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                                    <select
                                                        value={paymentMethodId}
                                                        onChange={(e) => setPaymentMethodId(parseInt(e.target.value))}
                                                        className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    >
                                                        {paymentMethods.map((method) => (
                                                            <option key={method.id} value={method.id}>
                                                                {method.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Test Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={testDate}
                                                        onChange={(e) => setTestDate(e.target.value)}
                                                        className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Paid Amount <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={totalFinal}
                                                    step="0.01"
                                                    value={paidAmount}
                                                    onChange={(e) => setPaidAmount(e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setPaidAmount(totalFinal.toFixed(2))}
                                                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Pay Full Amount (৳{totalFinal.toFixed(2)})
                                                </button>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={3}
                                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Optional notes..."
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-6">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="text-center">
                                                    <div className="mb-1 text-sm text-gray-600">Total Amount</div>
                                                    <div className="text-3xl font-bold text-gray-900">৳{totalFinal.toFixed(2)}</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="mb-1 text-sm text-gray-600">Paid Amount</div>
                                                    <div className="text-3xl font-bold text-green-600">৳{paidAmountNum.toFixed(2)}</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="mb-1 text-sm text-gray-600">Due Amount</div>
                                                    <div className="text-3xl font-bold text-red-600">৳{dueAmount.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={() => router.visit('/medical-tests')}
                                            className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Complete Booking & Print Receipt'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
