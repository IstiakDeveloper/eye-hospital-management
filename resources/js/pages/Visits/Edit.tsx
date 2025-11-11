import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    Save,
    X,
    Calendar,
    DollarSign,
    FileText,
    Tag,
    User,
    Stethoscope,
    CreditCard,
    Percent,
    AlertCircle
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
}

interface Doctor {
    id: number;
    user: {
        name: string;
    };
    specialization: string;
    is_active: boolean;
    consultation_fee?: number;
}

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    notes: string;
    payment_method: {
        name: string;
    };
    received_by: {
        name: string;
    };
}

interface Visit {
    id: number;
    patient_id: number;
    selected_doctor_id: number;
    chief_complaint: string;
    discount_type: string;
    discount_value: number;
    payment_status: string;
    overall_status: string;
    total_amount: number;
    total_paid: number;
    total_due: number;
    registration_fee?: number;
    final_amount?: number;
    patient: Patient;
    selected_doctor?: Doctor;
    payments: Payment[];
}

interface EditVisitProps {
    visit: Visit;
    doctors: Doctor[];
}

const EditVisit: React.FC<EditVisitProps> = ({ visit, doctors }) => {
    const [formData, setFormData] = useState({
        chief_complaint: visit.chief_complaint || '',
        selected_doctor_id: visit.selected_doctor_id || '',
        discount_type: visit.discount_type || '',
        discount_value: visit.discount_value?.toString() || '0',
        payment_amount: visit.total_paid?.toString() || '0',
    });
    const [liveSummary, setLiveSummary] = useState({
        registration_fee: visit.registration_fee || 100,
        doctor_fee: visit.selected_doctor?.consultation_fee || 0,
        total_amount: visit.total_amount || 0,
        discount_amount: visit.discount_type ? visit.discount_value || 0 : 0,
        final_amount: visit.final_amount || 0,
    });

    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: null }));
        }
    };

    // Live update financial summary when doctor/discount changes
    useEffect(() => {
        const fetchSummary = async () => {
            const res = await fetch('/patients/calculate-costs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    doctor_id: formData.selected_doctor_id,
                    discount_type: formData.discount_type,
                    discount_value: formData.discount_value,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setLiveSummary(data);
            }
        };
        fetchSummary();
    }, [formData.selected_doctor_id, formData.discount_type, formData.discount_value]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.put(`/visits/${visit.id}`, formData, {
            onSuccess: () => {
                // Will redirect to visit show page
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    const handleCancel = () => {
        router.get(`/visits/${visit.id}`);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this visit? This will reverse all transactions and cannot be undone.')) {
            router.delete(`/visits/${visit.id}`, {
                onSuccess: () => {
                    router.get('/patients');
                }
            });
        }
    };


    return (
        <AdminLayout title="Edit Visit">
            <div className="space-y-8 max-w-3xl mx-auto">
                {/* --- Section: Header --- */}
                <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCancel}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to Visit Details"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Visit</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Patient: <span className="font-medium text-blue-600">{visit.patient.name}</span>
                                ({visit.patient.patient_id})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            visit.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : visit.payment_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {visit.payment_status?.toUpperCase()}
                        </span>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete Visit
                        </button>
                    </div>
                </div>

                {/* --- Section: Patient Info --- */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Patient Information</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Name:</span>
                            <div className="font-medium">{visit.patient.name}</div>
                        </div>
                        <div>
                            <span className="text-gray-600">ID:</span>
                            <div className="font-medium">{visit.patient.patient_id}</div>
                        </div>
                        <div>
                            <span className="text-gray-600">Age:</span>
                            <div className="font-medium">{visit.patient.age} years</div>
                        </div>
                        <div>
                            <span className="text-gray-600">Phone:</span>
                            <div className="font-medium">{visit.patient.phone}</div>
                        </div>
                    </div>
                </div>

                {/* --- Section: Financial Summary (Live) --- */}
                <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Financial Summary (Live)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Registration Fee</div>
                            <div className="font-bold text-blue-700">৳{Number(liveSummary.registration_fee || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Doctor Fee</div>
                            <div className="font-bold text-blue-700">৳{Number(liveSummary.doctor_fee || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Total Amount</div>
                            <div className="font-bold text-blue-700">৳{Number(liveSummary.total_amount || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Discount</div>
                            <div className="font-bold text-orange-600">৳{Number(liveSummary.discount_amount || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500">Final Amount</div>
                            <div className="font-bold text-green-700">৳{Number(liveSummary.final_amount || 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Chief Complaint */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Chief Complaint
                            </label>
                            <textarea
                                name="chief_complaint"
                                value={formData.chief_complaint}
                                onChange={handleInputChange}
                                required
                                rows={3}
                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.chief_complaint ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter patient's chief complaint"
                            />
                            {errors.chief_complaint && (
                                <p className="text-red-600 text-sm mt-1">{errors.chief_complaint}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Doctor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Stethoscope className="w-4 h-4 inline mr-1" />
                                    Assigned Doctor
                                </label>
                                <select
                                    name="selected_doctor_id"
                                    value={formData.selected_doctor_id}
                                    onChange={handleInputChange}
                                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.selected_doctor_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {(doctor.user?.name || 'Unknown Doctor') + (doctor.specialization ? ` - ${doctor.specialization}` : '')}
                                        </option>
                                    ))}
                                </select>
                                {errors.selected_doctor_id && (
                                    <p className="text-red-600 text-sm mt-1">{errors.selected_doctor_id}</p>
                                )}
                            </div>

                            {/* Payment Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Payment Amount (৳)
                                </label>
                                <input
                                    type="number"
                                    name="payment_amount"
                                    value={formData.payment_amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.payment_amount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter payment amount"
                                />
                                {errors.payment_amount && (
                                    <p className="text-red-600 text-sm mt-1">{errors.payment_amount}</p>
                                )}
                            </div>
                        </div>

                        {/* Discount Section */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Percent className="w-4 h-4" />
                                Discount Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                                    >
                                        <option value="">No Discount</option>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="amount">Fixed Amount (৳)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Value
                                    </label>
                                    <input
                                        type="number"
                                        name="discount_value"
                                        value={formData.discount_value}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        disabled={!formData.discount_type}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 disabled:bg-gray-100"
                                        placeholder={formData.discount_type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-between pt-6 border-t">
                            <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-1 text-orange-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Changing payment amount will update all financial records</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                                        loading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Updating...' : 'Update Visit'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Payment History */}
                {visit.payments && visit.payments.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Payment History
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Method</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Received By</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visit.payments.map((payment, index) => (
                                        <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-2">{formatDate(payment.payment_date)}</td>
                                            <td className="px-4 py-2 font-medium text-green-600">
                                                ৳{Number(payment.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2">{payment.payment_method?.name || 'Cash'}</td>
                                            <td className="px-4 py-2">{payment.received_by?.name || 'Unknown'}</td>
                                            <td className="px-4 py-2 text-gray-600">{payment.notes || 'No notes'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default EditVisit;
