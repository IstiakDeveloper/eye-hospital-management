import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Phone, Mail, MapPin, Calendar, FileText,
    Stethoscope, DollarSign, Percent, Save, X,
    Calculator, Receipt, CreditCard, Users,
    CheckCircle, AlertCircle, Clock, IdCard, Hash
} from 'lucide-react';

// Type definitions
interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    description?: string;
}

interface CostBreakdown {
    registration_fee: number;
    doctor_fee: number;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
}

interface Props {
    doctors: Doctor[];
    paymentMethods: PaymentMethod[];
}

interface FormData {
    name: string;
    phone: string;
    nid_card: string;
    email: string;
    address: string;
    date_of_birth: string;
    gender: string;
    medical_history: string;
    chief_complaint: string;
    selected_doctor_id: string;
    discount_type: 'percentage' | 'amount' | '';
    discount_value: number;
    payment_amount: number;
}

const PatientCreate: React.FC<Props> = ({ doctors = [], paymentMethods = [] }) => {
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        name: '',
        phone: '',
        nid_card: '',
        email: '',
        address: '',
        date_of_birth: '',
        gender: '',
        medical_history: '',
        chief_complaint: '',
        selected_doctor_id: '',
        discount_type: '',
        discount_value: 0,
        payment_amount: 0,
    });

    const [costs, setCosts] = useState<CostBreakdown>({
        registration_fee: 0,
        doctor_fee: 0,
        total_amount: 0,
        discount_amount: 0,
        final_amount: 0,
    });

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [ageInput, setAgeInput] = useState<string>('');

    // Date utility functions for 4-digit year format
    const ensureValidDateInput = (dateString: string): string => {
        if (!dateString) return '';

        // Handle various date formats and ensure 4-digit year
        let cleanDate = dateString.replace(/[^\d-]/g, '');

        // If year appears to be 6 digits, extract the last 4
        const parts = cleanDate.split('-');
        if (parts.length === 3 && parts[0].length > 4) {
            parts[0] = parts[0].slice(-4);
            cleanDate = parts.join('-');
        }

        return cleanDate;
    };

    const formatDateForInput = (date: string | Date): string => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate age from date of birth
    const calculateAgeFromDate = (dateOfBirth: string): number => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birth = new Date(dateOfBirth);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Calculate date of birth from age
    const calculateDateFromAge = (age: number): string => {
        if (!age || age < 0 || age > 150) return '';

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-based
        const currentDay = today.getDate();

        // Calculate birth year
        const birthYear = currentYear - age;

        // Set birth date to current month/day of the calculated year
        // This gives a reasonable approximation
        const birthDate = new Date(birthYear, currentMonth, currentDay);

        return formatDateForInput(birthDate);
    };

    // Handle age input change
    const handleAgeChange = (ageValue: string) => {
        setAgeInput(ageValue);

        const age = parseInt(ageValue);
        if (age && age > 0 && age <= 150) {
            const calculatedDate = calculateDateFromAge(age);
            setData('date_of_birth', calculatedDate);
        } else if (ageValue === '') {
            setData('date_of_birth', '');
        }
    };

    // Handle date of birth change
    const handleDateOfBirthChange = (dateValue: string) => {
        const cleanDate = ensureValidDateInput(dateValue);
        setData('date_of_birth', cleanDate);

        if (cleanDate) {
            const age = calculateAgeFromDate(cleanDate);
            setAgeInput(age > 0 ? age.toString() : '');
        } else {
            setAgeInput('');
        }
    };

    // Calculate costs whenever doctor or discount changes
    useEffect(() => {
        calculateCosts();
    }, [data.selected_doctor_id, data.discount_type, data.discount_value]);

    const calculateCosts = async (): Promise<void> => {
        setIsCalculating(true);

        try {
            // Try API calculation first if route helper exists
            if (typeof route !== 'undefined' && route('patients.calculate-costs')) {
                const response = await fetch(route('patients.calculate-costs'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    },
                    body: JSON.stringify({
                        doctor_id: data.selected_doctor_id || null,
                        discount_type: data.discount_type,
                        discount_value: data.discount_value,
                    }),
                });

                if (response.ok) {
                    const newCosts: CostBreakdown = await response.json();
                    setCosts(newCosts);
                    setData('payment_amount', newCosts.final_amount);
                    setIsCalculating(false);
                    return;
                }
            }
        } catch (error) {
            console.warn('API cost calculation failed, using local calculation:', error);
        }

        // Fallback to local calculation
        calculateCostsLocally();
        setIsCalculating(false);
    };

    const calculateCostsLocally = (): void => {
        const registrationFee = 0; // No registration fee
        let doctorFee = 0;

        if (data.selected_doctor_id) {
            const doctor = doctors.find(d => d.id === parseInt(data.selected_doctor_id));
            doctorFee = doctor ? doctor.consultation_fee : 0;
        }

        const totalAmount = doctorFee; // Only doctor fee
        let discountAmount = 0;

        if (data.discount_value > 0 && data.discount_type) {
            if (data.discount_type === 'percentage') {
                discountAmount = (totalAmount * data.discount_value) / 100;
            } else {
                discountAmount = Math.min(data.discount_value, totalAmount);
            }
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        setCosts({
            registration_fee: registrationFee,
            doctor_fee: doctorFee,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
        });

        setData('payment_amount', finalAmount);
    };

    const handleDoctorChange = (doctorId: string): void => {
        setData('selected_doctor_id', doctorId);
        const doctor = doctors.find(d => d.id === parseInt(doctorId));
        setSelectedDoctor(doctor || null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        // Basic validation
        if (!data.name.trim()) {
            return;
        }
        if (!data.phone.trim()) {
            return;
        }

        // Submit using Inertia
        post(route('patients.store'), {
            onSuccess: () => {
                console.log('Patient registered successfully');
            },
            onError: (errors) => {
                console.error('Registration failed:', errors);
            },
        });
    };

    const handleCancel = (): void => {
        reset();
        if (typeof route !== 'undefined' && route('patients.index')) {
            router.visit(route('patients.index'));
        } else {
            window.history.back();
        }
    };

    const formatCurrency = (amount: number): string => {
        return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <AdminLayout title="Register New Patient">
            <Head title="Register New Patient" />

            {/* Add CSS for date input styling */}
            <style>{`
                .date-input-fixed::-webkit-datetime-edit-year-field {
                    min-width: 4ch !important;
                    max-width: 4ch !important;
                    -webkit-appearance: none;
                }

                input[type="date"]::-webkit-datetime-edit-year-field {
                    min-width: 4ch !important;
                    max-width: 4ch !important;
                }

                input[type="date"] {
                    -moz-appearance: textfield;
                }

                .date-input-fixed {
                    font-feature-settings: "tnum";
                    font-variant-numeric: tabular-nums;
                    direction: ltr;
                    text-align: left;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Register New Patient</h1>
                                <p className="text-gray-600 text-lg">Complete registration with payment processing</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Patient Information Card */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                                            <User className="h-6 w-6" />
                                            Patient Information
                                        </h2>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Name Field */}
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name *
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <input
                                                        id="name"
                                                        type="text"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        placeholder="Enter full name"
                                                        required
                                                        autoComplete="name"
                                                    />
                                                </div>
                                                {errors.name && (
                                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {errors.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Phone Field */}
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number *
                                                </label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <input
                                                        id="phone"
                                                        type="tel"
                                                        value={data.phone}
                                                        onChange={(e) => setData('phone', e.target.value)}
                                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        placeholder="Enter phone number"
                                                        required
                                                        autoComplete="tel"
                                                    />
                                                </div>
                                                {errors.phone && (
                                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {errors.phone}
                                                    </p>
                                                )}
                                            </div>

                                            {/* NID Card Field */}
                                            <div>
                                                <label htmlFor="nid_card" className="block text-sm font-medium text-gray-700 mb-2">
                                                    NID Card Number
                                                </label>
                                                <div className="relative">
                                                    <IdCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <input
                                                        id="nid_card"
                                                        type="text"
                                                        value={data.nid_card}
                                                        onChange={(e) => setData('nid_card', e.target.value)}
                                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.nid_card ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        placeholder="Enter NID card number"
                                                        maxLength={20}
                                                    />
                                                </div>
                                                {errors.nid_card && (
                                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {errors.nid_card}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Email Field */}
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Enter email address"
                                                        autoComplete="email"
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-4 w-4" />
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Address Field */}
                                            <div>
                                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                    <input
                                                        id="address"
                                                        type="text"
                                                        value={data.address}
                                                        onChange={(e) => setData('address', e.target.value)}
                                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200"
                                                        placeholder="Enter address"
                                                        autoComplete="address-line1"
                                                    />
                                                </div>
                                            </div>

                                            {/* Gender Field */}
                                            <div>
                                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Gender
                                                </label>
                                                <select
                                                    id="gender"
                                                    value={data.gender}
                                                    onChange={(e) => setData('gender', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200"
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Date of Birth and Age Section */}
                                        <div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Date of Birth Field */}
                                                <div>
                                                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Date of Birth
                                                    </label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                        <input
                                                            id="date_of_birth"
                                                            type="date"
                                                            value={ensureValidDateInput(data.date_of_birth)}
                                                            onChange={(e) => handleDateOfBirthChange(e.target.value)}
                                                            max={new Date().toISOString().split('T')[0]}
                                                            min="1900-01-01"
                                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 date-input-fixed"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Age Input Field */}
                                                <div>
                                                    <label htmlFor="age_input" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Age (Years)
                                                    </label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                        <input
                                                            id="age_input"
                                                            type="number"
                                                            value={ageInput}
                                                            onChange={(e) => handleAgeChange(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200"
                                                            placeholder="Enter age"
                                                            min="0"
                                                            max="150"
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Enter age to auto-calculate birth year
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Age Display */}
                                            {data.date_of_birth && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Calculated Age:</strong> {calculateAgeFromDate(data.date_of_birth)} years old
                                                        {ageInput && ageInput !== calculateAgeFromDate(data.date_of_birth).toString() && (
                                                            <span className="text-blue-600 ml-2">(Approximate based on current date)</span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Medical History */}
                                        <div>
                                            <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-2">
                                                Medical History
                                            </label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <textarea
                                                    id="medical_history"
                                                    rows={4}
                                                    value={data.medical_history}
                                                    onChange={(e) => setData('medical_history', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 resize-none"
                                                    placeholder="Enter medical conditions, allergies, or previous eye treatments..."
                                                />
                                            </div>
                                        </div>

                                        {/* Chief Complaint */}
                                        <div>
                                            <label htmlFor="chief_complaint" className="block text-sm font-medium text-gray-700 mb-2">
                                                Chief Complaint / Reason for Visit
                                            </label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <textarea
                                                    id="chief_complaint"
                                                    rows={3}
                                                    value={data.chief_complaint}
                                                    onChange={(e) => setData('chief_complaint', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 resize-none"
                                                    placeholder="Describe the main reason for today's visit..."
                                                    maxLength={500}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {data.chief_complaint.length}/500 characters
                                            </div>
                                        </div>

                                        {/* Doctor Selection */}
                                        <div>
                                            <label htmlFor="selected_doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Doctor (Optional)
                                            </label>
                                            <div className="relative">
                                                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <select
                                                    id="selected_doctor_id"
                                                    value={data.selected_doctor_id}
                                                    onChange={(e) => handleDoctorChange(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200"
                                                >
                                                    <option value="">No doctor selected</option>
                                                    {doctors.map((doctor) => (
                                                        <option key={doctor.id} value={doctor.id}>
                                                            Dr. {doctor.name} - {doctor.specialization} ({formatCurrency(doctor.consultation_fee)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedDoctor && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Dr. {selectedDoctor.name}</strong> - {selectedDoctor.specialization}
                                                        <br />
                                                        Consultation Fee: {formatCurrency(selectedDoctor.consultation_fee)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment & Cost Summary Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-4">
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                                            <Calculator className="h-6 w-6" />
                                            Payment Summary
                                            {isCalculating && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                                            )}
                                        </h2>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {/* Cost Breakdown */}
                                        <div className="space-y-3">
                                            {/* Registration Fee - Hidden since it's 0 */}
                                            {costs.registration_fee > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">Registration Fee</span>
                                                    <span className="font-semibold">{formatCurrency(costs.registration_fee)}</span>
                                                </div>
                                            )}

                                            {costs.doctor_fee > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                    <span className="text-gray-600">Doctor Fee</span>
                                                    <span className="font-semibold">{formatCurrency(costs.doctor_fee)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-800 font-medium">Subtotal</span>
                                                <span className="font-semibold">{formatCurrency(costs.total_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Discount Section */}
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                                <Percent className="h-4 w-4" />
                                                Apply Discount
                                            </h3>

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'percentage')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${data.discount_type === 'percentage'
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('discount_type', 'amount')}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${data.discount_type === 'amount'
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    ৳
                                                </button>
                                            </div>

                                            <input
                                                type="number"
                                                value={data.discount_value}
                                                onChange={(e) => setData('discount_value', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={data.discount_type === 'percentage' ? 'Enter %' : 'Enter amount'}
                                                min="0"
                                                max={data.discount_type === 'percentage' ? 100 : costs.total_amount}
                                                step="0.01"
                                                disabled={!data.discount_type}
                                            />

                                            {costs.discount_amount > 0 && (
                                                <div className="flex justify-between items-center text-green-600">
                                                    <span className="text-sm">Discount</span>
                                                    <span className="font-semibold">-{formatCurrency(costs.discount_amount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Amount */}
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-100">Total Payable</span>
                                                <span className="text-2xl font-bold">{formatCurrency(costs.final_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Payment Amount */}
                                        <div>
                                            <label htmlFor="payment_amount" className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Amount *
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <input
                                                    id="payment_amount"
                                                    type="number"
                                                    value={data.payment_amount}
                                                    onChange={(e) => setData('payment_amount', parseFloat(e.target.value) || 0)}
                                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 ${errors.payment_amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Enter amount"
                                                    min="0"
                                                    max={costs.final_amount}
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', costs.final_amount)}
                                                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    Full Payment
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', Math.round(costs.final_amount / 2))}
                                                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    50%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('payment_amount', 0)}
                                                    className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                                >
                                                    No Payment
                                                </button>
                                            </div>
                                            {errors.payment_amount && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {errors.payment_amount}
                                                </p>
                                            )}
                                        </div>

                                        {/* Payment Status Info */}
                                        {data.payment_amount < costs.final_amount && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-yellow-800">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Partial Payment</span>
                                                </div>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Remaining: {formatCurrency(costs.final_amount - data.payment_amount)}
                                                </p>
                                            </div>
                                        )}

                                        {data.payment_amount >= costs.final_amount && data.payment_amount > 0 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 text-green-800">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Full Payment</span>
                                                </div>
                                                <p className="text-xs text-green-700 mt-1">
                                                    Patient will be ready for vision test
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Messages */}
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-red-800 mb-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <h3 className="font-medium">Please correct the following errors:</h3>
                                </div>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {Object.entries(errors).map(([key, message]) => (
                                        <li key={key}>• {message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                    disabled={processing}
                                >
                                    <X className="h-5 w-5" />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-medium transition-all duration-200 ${processing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                                        }`}
                                >
                                    {processing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            Register Patient & Process Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PatientCreate;
