import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Search, X, User, Calendar, Clock, DollarSign, FileText, CreditCard } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
}

interface Operation {
    id: number;
    operation_code: string;
    name: string;
    type: string;
    price: number;
    duration_minutes?: number;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization: string;
}

interface Props {
    patient?: Patient | null;
    operations: Operation[];
    doctors: Doctor[];
}

export default function OperationBookingCreate({ patient: initialPatient, operations, doctors }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
    const [selectedOperationId, setSelectedOperationId] = useState<number | ''>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [advancePayment, setAdvancePayment] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentReference, setPaymentReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Discount fields
    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
    const [discountValue, setDiscountValue] = useState('');

    // Eye surgery specific fields
    const [surgeryType, setSurgeryType] = useState('');
    const [customSurgeryType, setCustomSurgeryType] = useState('');
    const [eyeSide, setEyeSide] = useState<'left' | 'right' | ''>('');
    const [lensType, setLensType] = useState('');
    const [customLensType, setCustomLensType] = useState('');
    const [power, setPower] = useState('');
    const [surgeryRemarks, setSurgeryRemarks] = useState('');

    // Search patients
    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`/operation-bookings/search-patients?search=${query}`);
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

    const handleOperationChange = (operationId: number) => {
        setSelectedOperationId(operationId);
        const operation = operations.find(op => op.id === operationId);
        if (operation) {
            setTotalAmount(operation.price.toString());
            setAdvancePayment(operation.price.toString());
        }
    };

    // Calculate discount amount
    const baseAmount = parseFloat(totalAmount) || 0;
    const discountVal = parseFloat(discountValue) || 0;
    const discountAmount = discountType === 'percentage'
        ? (baseAmount * discountVal) / 100
        : discountVal;
    const total = Math.max(0, baseAmount - discountAmount);
    const advanceAmount = parseFloat(advancePayment) || 0;
    const dueAmount = Math.max(0, total - advanceAmount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !selectedOperationId || !selectedDoctorId) {
            alert('Please fill in all required fields');
            return;
        }

        if (advanceAmount > total) {
            alert('Advance payment cannot exceed total amount');
            return;
        }

        const formData = {
            patient_id: selectedPatient.id,
            operation_id: selectedOperationId,
            doctor_id: selectedDoctorId,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            total_amount: total,
            advance_payment: advanceAmount,
            payment_method: advanceAmount > 0 ? paymentMethod : 'cash',
            payment_reference: paymentReference || undefined,
            discount_type: discountAmount > 0 ? discountType : undefined,
            discount_value: discountAmount > 0 ? discountVal : undefined,
            discount_amount: discountAmount > 0 ? discountAmount : undefined,
            notes,
            // Eye surgery specific data
            surgery_type: surgeryType === 'other' ? customSurgeryType : surgeryType,
            eye_side: eyeSide,
            lens_type: lensType === 'other' ? customLensType : lensType,
            power: power,
            surgery_remarks: surgeryRemarks
        };

        setLoading(true);
        router.post('/operation-bookings', formData, {
            onFinish: () => setLoading(false)
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">New Operation Booking</h1>
                        <p className="text-gray-600 mt-1">Schedule a new operation for a patient</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient Selection */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-semibold">Patient Information</h2>
                            </div>

                            {!selectedPatient ? (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search patient by name, ID, or phone..."
                                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                                            {searchResults.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    onClick={() => handleSelectPatient(patient)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                                                >
                                                    <div className="font-medium">{patient.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {patient.patient_id} • {patient.phone}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-lg">{selectedPatient.name}</div>
                                        <div className="text-sm text-gray-600">
                                            {selectedPatient.patient_id} • {selectedPatient.phone}
                                            {selectedPatient.age && ` • ${selectedPatient.age}y • ${selectedPatient.gender}`}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPatient(null)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Operation Details */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Operation Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Operation Type *
                                    </label>
                                    <select
                                        value={selectedOperationId}
                                        onChange={(e) => handleOperationChange(Number(e.target.value))}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Operation</option>
                                        {operations.map(op => (
                                            <option key={op.id} value={op.id}>
                                                {op.name} - {op.type} (৳{op.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Doctor *
                                    </label>
                                    <select
                                        value={selectedDoctorId}
                                        onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Doctor</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.user.name} - {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Date *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Time *
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Eye Surgery Details */}
                        {selectedPatient && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Eye Surgery Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Surgery Type (SICS/Phaco)
                                        </label>
                                        <select
                                            value={surgeryType}
                                            onChange={(e) => setSurgeryType(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Surgery Type</option>
                                            <option value="SICS">SICS</option>
                                            <option value="Phaco">Phaco</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {surgeryType === 'other' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Surgery Type
                                            </label>
                                            <input
                                                type="text"
                                                value={customSurgeryType}
                                                onChange={(e) => setCustomSurgeryType(e.target.value)}
                                                placeholder="Enter custom surgery type"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Eye Side
                                        </label>
                                        <select
                                            value={eyeSide}
                                            onChange={(e) => setEyeSide(e.target.value as 'left' | 'right' | '')}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Eye</option>
                                            <option value="left">Left Eye</option>
                                            <option value="right">Right Eye</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lens Type
                                        </label>
                                        <select
                                            value={lensType}
                                            onChange={(e) => setLensType(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Lens Type</option>
                                            <option value="Monofocal">Monofocal</option>
                                            <option value="Multifocal">Multifocal</option>
                                            <option value="Toric">Toric</option>
                                            <option value="Toric Multifocal">Toric Multifocal</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {lensType === 'other' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Lens Type
                                            </label>
                                            <input
                                                type="text"
                                                value={customLensType}
                                                onChange={(e) => setCustomLensType(e.target.value)}
                                                placeholder="Enter custom lens type"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Power
                                        </label>
                                        <input
                                            type="text"
                                            value={power}
                                            onChange={(e) => setPower(e.target.value)}
                                            placeholder="e.g., +2.50, -1.75"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Surgery Remarks
                                        </label>
                                        <textarea
                                            value={surgeryRemarks}
                                            onChange={(e) => setSurgeryRemarks(e.target.value)}
                                            rows={2}
                                            placeholder="Any additional notes about the surgery..."
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                <h2 className="text-xl font-semibold">Payment Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Base Amount *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={totalAmount}
                                            onChange={(e) => setTotalAmount(e.target.value)}
                                            min="0"
                                            step="0.01"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="amount">Fixed Amount (৳)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'}
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            min="0"
                                            max={discountType === 'percentage' ? '100' : totalAmount}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Advance Payment
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={advancePayment}
                                            onChange={(e) => setAdvancePayment(e.target.value)}
                                            min="0"
                                            max={total.toString()}
                                            step="0.01"
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {advanceAmount > 0 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Method
                                            </label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="mobile_banking">Mobile Banking</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Reference
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentReference}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                placeholder="Optional"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                            <div>
                                                <div className="text-sm text-gray-600">Base Amount</div>
                                                <div className="text-lg font-bold text-gray-900">৳{baseAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Discount</div>
                                                <div className="text-lg font-bold text-orange-600">-৳{discountAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Total Amount</div>
                                                <div className="text-lg font-bold text-blue-600">৳{total.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Advance</div>
                                                <div className="text-lg font-bold text-green-600">৳{advanceAmount.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600">Due Amount</div>
                                                <div className="text-lg font-bold text-red-600">৳{dueAmount.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                    <span>Notes (Optional)</span>
                                </div>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any special instructions or notes..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit('/operation-bookings')}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedPatient}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {loading ? 'Creating Booking...' : 'Create Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
