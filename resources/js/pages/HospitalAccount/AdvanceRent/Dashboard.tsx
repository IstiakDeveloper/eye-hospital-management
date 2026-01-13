import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HospitalAccountLayout from '@/layouts/HospitalAccountLayout';
import {
    Home,
    Plus,
    Minus,
    Calendar,
    TrendingDown,
    AlertCircle,
    DollarSign,
    CheckCircle,
    Clock
} from 'lucide-react';

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
    }).format(amount).replace('BDT', '৳');
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
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
    floor_type = '2_3_floor'
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
        floor_type: currentFloor
    });

    const [deductFormData, setDeductFormData] = useState({
        amount: '5000',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: '',
        floor_type: currentFloor
    });

    // Update form data when floor changes
    const handleFloorChange = (floorType: string) => {
        setCurrentFloor(floorType);
        router.visit(`/hospital-account/advance-rent?floor_type=${floorType}`, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleAddAdvance = () => {
        setIsAddLoading(true);
        router.post('/hospital-account/advance-rent', { ...addFormData, floor_type: currentFloor }, {
            onSuccess: () => {
                setShowAddModal(false);
                setAddFormData({
                    amount: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    floor_type: currentFloor
                });
                setIsAddLoading(false);
            },
            onError: () => {
                setIsAddLoading(false);
            }
        });
    };

    const handleDeductRent = () => {
        if (!totalAdvanceBalance || totalAdvanceBalance < 5000) {
            alert('Insufficient advance balance! Minimum ৳5,000 required for monthly rent deduction.');
            return;
        }

        setDeductError(null);
        console.log('Deduct Form Data:', { ...deductFormData, floor_type: currentFloor });
        setIsDeductLoading(true);
        router.post('/hospital-account/advance-rent/deduct', { ...deductFormData, floor_type: currentFloor }, {
            onSuccess: (page) => {
                console.log('Deduct Success:', page);
                setShowDeductModal(false);
                setDeductFormData({
                    amount: '5000',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    notes: '',
                    floor_type: currentFloor
                });
                setIsDeductLoading(false);
            },
            onError: (errors) => {
                console.log('Deduct Errors:', errors);
                const errorMessage = errors.error || errors.amount || 'Failed to deduct rent. Please try again.';
                setDeductError(errorMessage);
                setIsDeductLoading(false);
            }
        });
    };

    return (
        <HospitalAccountLayout title="Advance House Rent">
            <div className="max-w-7xl mx-auto py-6 space-y-6">

                {/* Header with Stats */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Home className="w-7 h-7 text-blue-600" />
                                Advance House Rent Management
                            </h1>
                            <p className="text-gray-600 mt-1">Track advance rent payments and monthly deductions</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Advance
                            </button>
                            <button
                                onClick={() => router.visit(`/hospital-account/advance-rent/history?floor_type=${currentFloor}`)}
                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                History
                            </button>
                        </div>
                    </div>

                    {/* Floor Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFloorChange('2_3_floor')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                                    currentFloor === '2_3_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                2nd & 3rd Floor
                            </button>
                            <button
                                onClick={() => handleFloorChange('4_floor')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                                    currentFloor === '4_floor'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                4th Floor
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-green-600 font-semibold mb-1">Available Balance</p>
                                    <p className="text-3xl font-bold text-green-700">{formatCurrency(totalAdvanceBalance)}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">Total Advance Paid</p>
                                    <p className="text-3xl font-bold text-blue-700">{formatCurrency(totalAdvanceGiven)}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">Total Deducted</p>
                                    <p className="text-3xl font-bold text-red-700">{formatCurrency(totalUsed)}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <TrendingDown className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Advances */}
                <div className="bg-white rounded-lg shadow-sm border mb-6">
                    <div className="p-6">
                        <div className="text-center">
                            <button
                                onClick={() => setShowDeductModal(true)}
                                disabled={!totalAdvanceBalance || totalAdvanceBalance < 5000}
                                className="flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg font-semibold"
                            >
                                <Minus className="w-6 h-6" />
                                Deduct Monthly Rent
                            </button>
                            {(!totalAdvanceBalance || totalAdvanceBalance < 5000) && (
                                <p className="text-sm text-red-600 mt-3">
                                    {!totalAdvanceBalance ? 'No advance balance available. Please add advance first.' : `Insufficient balance. Minimum ৳5,000 required (Current: ${formatCurrency(totalAdvanceBalance)})`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Deductions */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Deductions</h2>
                    </div>
                    <div className="p-6">
                        {recentDeductions.length > 0 ? (
                            <div className="space-y-3">
                                {recentDeductions.map((deduction) => (
                                    <div key={deduction.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-sm font-mono text-gray-600">{deduction.deduction_number}</span>
                                                <span className="text-sm text-gray-500">from {deduction.advance_house_rent.payment_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{getMonthName(deduction.month)} {deduction.year}</span>
                                                <span>•</span>
                                                <span>{formatDate(deduction.deduction_date)}</span>
                                            </div>
                                            {deduction.notes && (
                                                <p className="text-sm text-gray-500 mt-1">{deduction.notes}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-red-600">{formatCurrency(deduction.amount)}</p>
                                            <p className="text-xs text-gray-500">by {deduction.deducted_by.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No deductions yet</p>
                        )}
                    </div>
                </div>

                {/* Add Advance Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Add Advance House Rent</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={addFormData.amount}
                                        onChange={(e) => setAddFormData({ ...addFormData, amount: e.target.value })}
                                        className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={addFormData.description}
                                        onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                                        className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        rows={3}
                                        placeholder="e.g., 6 months advance rent for office"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                    <input
                                        type="date"
                                        value={addFormData.date}
                                        onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                                        className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddAdvance}
                                    disabled={isAddLoading}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isAddLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Add Advance'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isAddLoading}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deduct Modal */}
                {showDeductModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Deduct Monthly Rent</h3>

                            {deductError && (
                                <div className="bg-red-50 border border-red-300 rounded p-3 mb-4">
                                    <p className="text-sm text-red-700 font-medium">{deductError}</p>
                                </div>
                            )}

                            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                <p className="text-sm text-green-700 font-medium">Available Balance: {formatCurrency(totalAdvanceBalance)}</p>
                                <p className="text-xs text-green-600 mt-1">Rent will be deducted from available advance balance</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent Amount</label>
                                    <input
                                        type="text"
                                        value="৳ 5,000.00"
                                        disabled
                                        className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-lg cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Fixed monthly rent amount</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                        <select
                                            value={deductFormData.month}
                                            onChange={(e) => setDeductFormData({ ...deductFormData, month: parseInt(e.target.value) })}
                                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                <option key={m} value={m}>{getMonthName(m)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <input
                                            type="number"
                                            value={deductFormData.year}
                                            onChange={(e) => setDeductFormData({ ...deductFormData, year: parseInt(e.target.value) })}
                                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                    <textarea
                                        value={deductFormData.notes}
                                        onChange={(e) => setDeductFormData({ ...deductFormData, notes: e.target.value })}
                                        className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                                        rows={2}
                                        placeholder="Any additional notes"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleDeductRent}
                                    disabled={isDeductLoading}
                                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isDeductLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Deduct Rent'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeductModal(false);
                                        setDeductError(null);
                                    }}
                                    disabled={isDeductLoading}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
