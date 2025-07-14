import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

import {
    User, Phone, Mail, Calendar,
    Receipt, DollarSign, FileText,
    CheckCircle, Building, Clock
} from 'lucide-react';
import QRCode from 'react-qr-code';

// Type definitions
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    nid_card?: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    medical_history?: string;
    qr_code?: string;
    created_at: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization?: string;
    consultation_fee: number;
}

interface Visit {
    id: number;
    visit_id: string;
    patient_id: number;
    selected_doctor_id?: number;
    registration_fee: number;
    doctor_fee: number;
    total_amount: number;
    discount_type?: string;
    discount_value?: number;
    discount_amount: number;
    final_amount: number;
    total_paid: number;
    total_due: number;
    payment_status: string;
    overall_status: string;
    chief_complaint?: string;
    created_at: string;
    selected_doctor?: Doctor;
}

interface Payment {
    id: number;
    patient_id: number;
    visit_id: number;
    amount: number;
    payment_method_id: number;
    payment_date: string;
    notes?: string;
    created_at: string;
}

interface Props {
    patient: Patient;
    visit: Visit;
    payment?: Payment;
}

// Receipt Component for A4 50% height, full width
const PatientReceipt: React.FC<Props> = ({ patient, visit, payment }) => {

    // Auto print when component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount: number): string => {
        return `৳${parseFloat(amount.toString()).toLocaleString('en-BD')}`;
    };

    const formatDate = (date: string | Date): string => {
        return new Date(date).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: string | Date): string => {
        return new Date(date).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const generateReceiptNumber = (): string => {
        if (payment) {
            return `PAY-${new Date(payment.payment_date).toISOString().slice(0, 10).replace(/-/g, '')}-${payment.id.toString().padStart(4, '0')}`;
        }
        return `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${visit.id.toString().padStart(4, '0')}`;
    };

    const getPaymentMethodName = (methodId: number): string => {
        const methods: { [key: number]: string } = {
            1: 'Cash',
            2: 'Card',
            3: 'Mobile Banking',
            4: 'Bank Transfer'
        };
        return methods[methodId] || 'Cash';
    };

    return (
        <div className="min-h-screen bg-white">
            <Head title="Patient Registration Receipt" />

            {/* Print Styles */}
            <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            width: 100%;
            height: 55vh;
            max-height: 450px;
            page-break-inside: avoid;
            font-size: 11px;
          }
        }

        @media screen {
          .print-container {
            width: 100%;
            max-width: 850px;
            height: 380px;
            margin: 20px auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            font-size: 13px;
          }
        }
      `}</style>

            {/* Screen Only - Print Button */}
            <div className="no-print fixed top-4 right-4 z-50">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                >
                    <Receipt className="h-5 w-5" />
                    Print Receipt
                </button>
            </div>

            {/* Receipt Container - Optimized Layout */}
            <div className="print-container bg-white p-3 font-mono border">

                <div className="grid grid-cols-12 gap-3 h-full">

                    {/* Left Section - Hospital Info */}
                    <div className="col-span-2">
                        {/* Hospital Header */}
                        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-3">
                            <div className="flex justify-center mb-1">
                                <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <h1 className="text-sm font-bold text-gray-900">EYE HOSPITAL</h1>
                            <p className="text-xs text-gray-600">Registration Receipt</p>
                            <p className="text-xs text-gray-500 mt-1">
                                📍 Dhaka, Bangladesh
                            </p>
                            <p className="text-xs text-gray-500">
                                📞 +880 1234-567890
                            </p>
                        </div>

                        {/* Receipt Info */}
                        <div className="text-center mb-3">
                            <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-2">
                                <div className="flex items-center justify-center gap-1 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="font-semibold text-xs">COMPLETED</span>
                                </div>
                            </div>

                            <div className="space-y-1 text-xs">
                                <div>
                                    <span className="text-gray-600">Receipt No:</span>
                                    <div className="font-bold">{generateReceiptNumber()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Visit ID:</span>
                                    <div className="font-bold">{visit.visit_id}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Date:</span>
                                    <div className="font-bold">{formatDate(visit.created_at)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Time:</span>
                                    <div className="font-bold">{formatTime(visit.created_at)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                visit.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : visit.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                <CheckCircle className="h-3 w-3" />
                                {visit.payment_status === 'paid' ? 'FULLY PAID' :
                                 visit.payment_status === 'partial' ? 'PARTIALLY PAID' : 'PENDING'}
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - Patient Information */}
                    <div className="col-span-4">
                        <div className="border border-gray-300 rounded-lg p-3 h-full">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                PATIENT DETAILS
                            </h3>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                <div>
                                    <span className="text-gray-600 block mb-1">Patient ID:</span>
                                    <span className="font-bold">{patient.patient_id}</span>
                                </div>

                                <div>
                                    <span className="text-gray-600 block mb-1">Phone:</span>
                                    <span className="font-bold">{patient.phone}</span>
                                </div>

                                <div className="col-span-2">
                                    <span className="text-gray-600 block mb-1">Full Name:</span>
                                    <span className="font-bold">{patient.name}</span>
                                </div>

                                {patient.nid_card && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block mb-1">NID Card:</span>
                                        <span className="font-bold">{patient.nid_card}</span>
                                    </div>
                                )}

                                <div>
                                    <span className="text-gray-600 block mb-1">Gender:</span>
                                    <span className="font-bold capitalize">{patient.gender || 'N/A'}</span>
                                </div>

                                <div>
                                    <span className="text-gray-600 block mb-1">Date of Birth:</span>
                                    <span className="font-bold">
                                        {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}
                                    </span>
                                </div>

                                {patient.email && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block mb-1">Email:</span>
                                        <span className="font-bold">{patient.email}</span>
                                    </div>
                                )}

                                {visit.selected_doctor && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block mb-1">Selected Doctor:</span>
                                        <span className="font-bold">Dr. {visit.selected_doctor.name}</span>
                                        <span className="text-xs text-gray-500 block">
                                            {visit.selected_doctor.specialization || 'Ophthalmologist'}
                                        </span>
                                    </div>
                                )}

                                {visit.chief_complaint && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block mb-1">Chief Complaint:</span>
                                        <span className="font-bold text-xs">
                                            {visit.chief_complaint.length > 60
                                                ? visit.chief_complaint.substring(0, 60) + '...'
                                                : visit.chief_complaint}
                                        </span>
                                    </div>
                                )}

                                {patient.address && (
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block mb-1">Address:</span>
                                        <span className="font-bold text-xs">{patient.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Payment Details */}
                    <div className="col-span-3">
                        <div className="border border-gray-300 rounded-lg p-3 h-full">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                PAYMENT BREAKDOWN
                            </h3>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Registration Fee:</span>
                                    <span className="font-bold">{formatCurrency(visit.registration_fee)}</span>
                                </div>

                                {visit.doctor_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Doctor Consultation:</span>
                                        <span className="font-bold">{formatCurrency(visit.doctor_fee)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-bold">{formatCurrency(visit.total_amount)}</span>
                                </div>

                                {visit.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>
                                            Discount ({visit.discount_type === 'percentage'
                                                ? `${visit.discount_value}%`
                                                : 'Fixed'}):
                                        </span>
                                        <span className="font-bold">-{formatCurrency(visit.discount_amount)}</span>
                                    </div>
                                )}

                                <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2">
                                    <div className="flex justify-between text-base font-bold">
                                        <span>TOTAL AMOUNT:</span>
                                        <span>{formatCurrency(visit.final_amount)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-green-600">
                                    <span className="font-bold">PAID ({getPaymentMethodName(payment?.payment_method_id || 1)}):</span>
                                    <span className="font-bold">{formatCurrency(visit.total_paid)}</span>
                                </div>

                                {visit.total_due > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span className="font-bold">REMAINING:</span>
                                        <span className="font-bold">{formatCurrency(visit.total_due)}</span>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-2 rounded mt-2">
                                    <div className="text-xs text-gray-600">
                                        Payment Method: <span className="font-bold">
                                            {getPaymentMethodName(payment?.payment_method_id || 1)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Payment Date: <span className="font-bold">
                                            {payment ? formatDate(payment.payment_date) : formatDate(visit.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Far Right Section - Next Steps */}
                    <div className="col-span-3">
                        {/* Next Steps */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                NEXT STEPS
                            </h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                {visit.payment_status === 'paid' ? (
                                    <>
                                        <li>• Proceed to Vision Test Department</li>
                                        <li>• Present this receipt</li>
                                        <li>• Bring medical documents</li>
                                        <li>• Follow technician instructions</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Complete payment first</li>
                                        <li>• Visit payment counter</li>
                                        <li>• Pay remaining: {formatCurrency(visit.total_due)}</li>
                                        <li>• Then proceed to vision test</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Visit Status */}
                        <div className="border border-gray-300 rounded-lg p-2 mb-3">
                            <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                VISIT STATUS
                            </h4>
                            <div className="text-xs text-gray-700">
                                <div className="mb-1">
                                    Payment: <span className={`font-bold ${
                                        visit.payment_status === 'paid' ? 'text-green-600' :
                                        visit.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {visit.payment_status.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    Overall: <span className="font-bold text-blue-600">
                                        {visit.overall_status.toUpperCase().replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Medical History */}
                        {patient.medical_history && (
                            <div className="border border-gray-300 rounded-lg p-2 mb-3">
                                <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    MEDICAL NOTES
                                </h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    {patient.medical_history.length > 80
                                        ? patient.medical_history.substring(0, 80) + '...'
                                        : patient.medical_history}
                                </p>
                            </div>
                        )}

                        {/* QR Code */}
                        <div className="text-center">
                            <div className="bg-white p-2 border border-gray-400 rounded mx-auto mb-1 w-fit">
                                {patient.qr_code ? (
                                    <QRCode value={patient.qr_code} size={64} />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                        QR
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-400">Patient QR Code</p>
                            {patient.qr_code && (
                                <p className="text-xs text-gray-600 mt-1 font-mono">{patient.qr_code}</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                            Thank you for choosing Eye Hospital
                        </div>
                        <div className="text-xs text-gray-400">
                            Generated: {formatDate(new Date())} at {formatTime(new Date())}
                        </div>
                        <div className="bg-black text-white px-2 py-1 font-mono text-xs tracking-wider rounded">
                            {patient.patient_id}
                        </div>
                    </div>
                </div>
            </div>

            {/* Screen Only - Back Button */}
            <div className="no-print text-center mt-6">
                <button
                    onClick={() => window.history.back()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                    Back to Registration
                </button>
            </div>
        </div>
    );
};

export default PatientReceipt;
