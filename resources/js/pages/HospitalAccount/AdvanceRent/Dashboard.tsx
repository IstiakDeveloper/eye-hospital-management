import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import { router } from '@inertiajs/react';
import { Calendar, CheckCircle, DollarSign, Home, Minus, Plus, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface AdvanceRent {
    id: number;
    advance_amount: number;
    used_amount: number;
    remaining_amount: number;
    status: string;
    description: string;
    payment_date: string;
    payment_number: string;
    created_by: {
        name: string;
    };
}

interface Deduction {
    id: number;
    month: number;
    year: number;
    amount: number;
    notes?: string;
    deduction_date: string;
    deduction_number: string;
    advance_house_rent: {
        payment_number: string;
    };
    deducted_by: {
        name: string;
    };
}

interface Props {
    activeAdvances: AdvanceRent[];
    exhaustedAdvances: AdvanceRent[];
    recentDeductions: Deduction[];
    totalAdvanceBalance: number;
    totalAdvanceGiven: number;
    totalUsed: number;
    monthlyDeductions: Record<number, number>;
    floor_type?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 2,
    })
        .format(amount)
        .replace('BDT', '৳');
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
};

export default function AdvanceRentDashboard({
    activeAdvances,
    exhaustedAdvances,
    recentDeductions,
    totalAdvanceBalance,
    totalAdvanceGiven,
    totalUsed,
    monthlyDeductions,
    floor_type = '2_3_floor',
}: Props) {
    const [currentFloor, setCurrentFloor] = useState<string>(floor_type);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeductModal, setShowDeductModal] = useState(false);
    const [isAddLoading, setIsAddLoading] = useState(false);
    const [isDeductLoading, setIsDeductLoading] = useState(false);
    const [deductError, setDeductError] = useState<string | null>(null);

    const [addFormData, setAddFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        floor_type: currentFloor,
    });

    const [deductFormData, setDeductFormData] = useState({
        amount: '5000',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: '',
        floor_type: currentFloor,
    });

    // Update form data when floor changes
    const handleFloorChange = (floorType: string) => {
        setCurrentFloor(floorType);
        router.visit(`/hospital-account/advance-rent?floor_type=${floorType}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleAddAdvance = () => {
        setIsAddLoading(true);
        router.post(
            '/hospital-account/advance-rent',
            { ...addFormData, floor_type: currentFloor },
            {
                onSuccess: () => {
                    setShowAddModal(false);
                    setAddFormData({
                        amount: '',
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        floor_type: currentFloor,
                    });
                    setIsAddLoading(false);
                },
                onError: () => {
                    setIsAddLoading(false);
                },
            },
        );
    };

    const handleDeductRent = () => {
        if (!totalAdvanceBalance || totalAdvanceBalance < 5000) {
            alert('Insufficient advance balance! Minimum ৳5,000 required for monthly rent deduction.');
            return;
        }

        setDeductError(null);
        console.log('Deduct Form Data:', { ...deductFormData, floor_type: currentFloor });
        setIsDeductLoading(true);
        router.post(
            '/hospital-account/advance-rent/deduct',
            { ...deductFormData, floor_type: currentFloor },
            {
                onSuccess: (page) => {
                    console.log('Deduct Success:', page);
                    setShowDeductModal(false);
                    setDeductFormData({
                        amount: '5000',
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        notes: '',
                        floor_type: currentFloor,
                    });
                    setIsDeductLoading(false);
                },
                onError: (errors) => {
                    console.log('Deduct Errors:', errors);
                    const errorMessage = errors.error || errors.amount || 'Failed to deduct rent. Please try again.';
                    setDeductError(errorMessage);
                    setIsDeductLoading(false);
                },
            },
        );
    };

    return (
        <HospitalAccountLayout title="Advance House Rent">
            <div className="mx-auto max-w-7xl space-y-6 py-6">
                {/* Header with Stats */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                                <Home className="h-7 w-7 text-blue-600" />
                                Advance House Rent Management
                            </h1>
                            <p className="mt-1 text-gray-600">Track advance rent payments and monthly deductions</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Advance
                            </button>
                            <button
                                onClick={() => router.visit(`/hospital-account/advance-rent/history?floor_type=${currentFloor}`)}
                                className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                History
                            </button>
                        </div>
                    </div>

                    {/* Floor Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFloorChange('2_3_floor')}
                                className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
                                    currentFloor === '2_3_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                2nd & 3rd Floor
                            </button>
                            <button
                                onClick={() => handleFloorChange('4_floor')}
                                className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
                                    currentFloor === '4_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                4th Floor
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-green-600 uppercase">Available Balance</p>
                                    <p className="text-3xl font-bold text-green-700">{formatCurrency(totalAdvanceBalance)}</p>
                                </div>
                                <div className="rounded-full bg-green-100 p-3">
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-blue-600 uppercase">Total Advance Paid</p>
                                    <p className="text-3xl font-bold text-blue-700">{formatCurrency(totalAdvanceGiven)}</p>
                                </div>
                                <div className="rounded-full bg-blue-100 p-3">
                                    <CheckCircle className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-semibold tracking-wide text-red-600 uppercase">Total Deducted</p>
                                    <p className="text-3xl font-bold text-red-700">{formatCurrency(totalUsed)}</p>
                                </div>
                                <div className="rounded-full bg-red-100 p-3">
                                    <TrendingDown className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Advances */}
                <div className="mb-6 rounded-lg border bg-white shadow-sm">
                    <div className="p-6">
                        <div className="text-center">
                            <button
                                onClick={() => setShowDeductModal(true)}
                                disabled={!totalAdvanceBalance || totalAdvanceBalance < 5000}
                                className="mx-auto flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                <Minus className="h-6 w-6" />
                                Deduct Monthly Rent
                            </button>
                            {(!totalAdvanceBalance || totalAdvanceBalance < 5000) && (
                                <p className="mt-3 text-sm text-red-600">
                                    {!totalAdvanceBalance
                                        ? 'No advance balance available. Please add advance first.'
                                        : `Insufficient balance. Minimum ৳5,000 required (Current: ${formatCurrency(totalAdvanceBalance)})`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Deductions */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Deductions</h2>
                    </div>
                    <div className="p-6">
                        {recentDeductions.length > 0 ? (
                            <div className="space-y-3">
                                {recentDeductions.map((deduction) => (
                                    <div key={deduction.id} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
                                        <div>
                                            <div className="mb-1 flex items-center gap-3">
                                                <span className="font-mono text-sm text-gray-600">{deduction.deduction_number}</span>
                                                <span className="text-sm text-gray-500">from {deduction.advance_house_rent.payment_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {getMonthName(deduction.month)} {deduction.year}
                                                </span>
                                                <span>•</span>
                                                <span>{formatDate(deduction.deduction_date)}</span>
                                            </div>
                                            {deduction.notes && <p className="mt-1 text-sm text-gray-500">{deduction.notes}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-red-600">{formatCurrency(deduction.amount)}</p>
                                            <p className="text-xs text-gray-500">by {deduction.deducted_by.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-gray-500">No deductions yet</p>
                        )}
                    </div>
                </div>

                {/* Add Advance Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h3 className="mb-4 text-lg font-semibold">Add Advance House Rent</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        value={addFormData.amount}
                                        onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })}
                                        className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={addFormData.description}
                                        onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                                        className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        rows={3}
                                        placeholder="e.g., 6 months advance rent for office"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payment Date</label>
                                    <input
                                        type="date"
                                        value={addFormData.date}
                                        onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                                        className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleAddAdvance}
                                    disabled={isAddLoading}
                                    className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                >
                                    {isAddLoading ? (
                                        <>
                                            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        'Add Advance'
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isAddLoading}
                                    className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deduct Modal */}
                {showDeductModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-lg bg-white p-6">
                            <h3 className="mb-4 text-lg font-semibold">Deduct Monthly Rent</h3>

                            {deductError && (
                                <div className="mb-4 rounded border border-red-300 bg-red-50 p-3">
                                    <p className="text-sm font-medium text-red-700">{deductError}</p>
                                </div>
                            )}

                            <div className="mb-4 rounded border border-green-200 bg-green-50 p-3">
                                <p className="text-sm font-medium text-green-700">Available Balance: {formatCurrency(totalAdvanceBalance)}</p>
                                <p className="mt-1 text-xs text-green-600">Rent will be deducted from available advance balance</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Rent Amount</label>
                                    <input
                                        type="text"
                                        value="৳ 5,000.00"
                                        disabled
                                        className="w-full cursor-not-allowed rounded border bg-gray-100 px-3 py-2 text-lg font-semibold text-gray-700"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Fixed monthly rent amount</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">Month</label>
                                        <select
                                            value={deductFormData.month}
                                            onChange={(e) => setDeductFormData({ ...deductFormData, month: parseInt(e.target.value) })}
                                            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                                <option key={m} value={m}>
                                                    {getMonthName(m)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                                        <input
                                            type="number"
                                            value={deductFormData.year}
                                            onChange={(e) => setDeductFormData({ ...deductFormData, year: parseInt(e.target.value) })}
                                            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        value={deductFormData.notes}
                                        onChange={(e) => setDeductFormData({ ...deductFormData, notes: e.target.value })}
                                        className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        rows={2}
                                        placeholder="Any additional notes"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleDeductRent}
                                    disabled={isDeductLoading}
                                    className="flex flex-1 items-center justify-center rounded-lg bg-orange-600 py-2 text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-400"
                                >
                                    {isDeductLoading ? (
                                        <>
                                            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        'Deduct Rent'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeductModal(false);
                                        setDeductError(null);
                                    }}
                                    disabled={isDeductLoading}
                                    className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HospitalAccountLayout>
    );
}
