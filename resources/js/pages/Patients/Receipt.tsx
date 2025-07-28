import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    User, Phone, Mail, Calendar,
    Receipt, DollarSign, FileText,
    CheckCircle, Building, Clock, Save
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
    qr_code_image_path?: string;
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
    csrfToken?: string;
}

// Auto-Save QR Component
const AutoSaveQRCode: React.FC<{ patient: Patient; size?: number; csrfToken?: string }> = ({
    patient,
    size = 55,
    csrfToken
}) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Auto-save QR code when component mounts
    useEffect(() => {
        if (patient.qr_code && !hasAttemptedSave && !patient.qr_code_image_path) {
            const timer = setTimeout(() => {
                autoSaveQRCode();
            }, 2000); // Increased delay for QR rendering

            return () => clearTimeout(timer);
        }
    }, [patient.qr_code, hasAttemptedSave, patient.qr_code_image_path]);

    // Get CSRF token from multiple sources
    const getCSRFToken = (): string | null => {
        // Priority order for token retrieval

        // 1. From props (passed from Laravel)
        if (csrfToken) {
            return csrfToken;
        }

        // 2. From meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            return metaToken;
        }

        // 3. From window object (if set by Laravel)
        const windowToken = (window as any).csrfToken;
        if (windowToken) {
            return windowToken;
        }

        // 4. From cookie (XSRF-TOKEN)
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }

        return null;
    };

    const autoSaveQRCode = async () => {
        if (!qrRef.current || !patient.qr_code || hasAttemptedSave) return;

        setHasAttemptedSave(true);
        setSaveStatus('saving');
        setErrorMessage('');

        try {
            // Get SVG from QR component
            const svgElement = qrRef.current.querySelector('svg');
            if (!svgElement) {
                throw new Error('QR SVG not found');
            }

            // Create high-quality canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            const scale = 8; // Higher quality scale
            canvas.width = size * scale;
            canvas.height = size * scale;
            ctx.scale(scale, scale);

            // Convert SVG to image
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load SVG image'));
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });

            // Draw on canvas with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert to base64 PNG
            const dataUrl = canvas.toDataURL('image/png', 1.0);

            // Get CSRF token
            const token = getCSRFToken();

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            // Add CSRF token to headers
            if (token) {
                headers['X-CSRF-TOKEN'] = token;
            } else {
                console.warn('No CSRF token found - request may fail');
            }

            // Send to server (using web route only)
            const response = await fetch(`/patient/${patient.id}/save-qr`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    qr_data_url: dataUrl,
                    patient_id: patient.patient_id
                })
            });

            // Handle response
            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    errorMsg = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();

            if (result.success) {
                setSaveStatus('saved');
                console.log('QR code auto-saved successfully:', result);
            } else {
                throw new Error(result.message || 'Save failed');
            }

        } catch (error) {
            console.error('Auto-save QR error:', error);
            setSaveStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    // Manual retry function
    const retryAutoSave = async () => {
        setHasAttemptedSave(false);
        setSaveStatus('idle');
        setErrorMessage('');

        // Wait a moment then try again
        setTimeout(() => {
            autoSaveQRCode();
        }, 500);
    };

    // Generate QR data
    const getQRCodeData = () => {
        if (patient.qr_code) {
            return patient.qr_code;
        }

        // Generate structured QR data
        return JSON.stringify({
            type: 'patient',
            patient_id: patient.patient_id,
            name: patient.name,
            phone: patient.phone,
            hospital: 'Naogaon Islamia Chakkhu Hospital',
            url: `${window.location.origin}/patient/${patient.patient_id}`,
            generated_at: new Date().toISOString()
        });
    };

    return (
        <div className="text-center">
            {/* QR Code Display */}
            <div ref={qrRef} className="bg-white p-2 border border-gray-400 rounded mx-auto mb-1 w-fit">
                <QRCode
                    value={getQRCodeData()}
                    size={size}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                />
            </div>

            <p className="text-xs text-gray-400 mb-1">Patient QR Code</p>

            {/* Save Status Indicator */}
            {saveStatus === 'saving' && (
                <div className="text-xs text-blue-600 mb-1">
                    <Save className="w-3 h-3 inline mr-1" />
                    Saving...
                </div>
            )}

            {saveStatus === 'saved' && (
                <div className="text-xs text-green-600 mb-1">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Saved
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="text-xs text-red-600 mb-1">
                    <button
                        onClick={retryAutoSave}
                        className="hover:underline"
                        title={`Error: ${errorMessage}. Click to retry`}
                    >
                        ⚠️ Error (Retry)
                    </button>
                </div>
            )}

            {/* QR Data Display */}
            <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                ID: {patient.patient_id}
            </p>
        </div>
    );
};

// Main Receipt Component
const PatientReceipt: React.FC<Props> = ({ patient, visit, payment, csrfToken }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 2000);
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

            {csrfToken && (
                <meta name="csrf-token" content={csrfToken} />
            )}

            <style>{`
    @media print {
        @page {
                size: A4 portrait;
                margin: 12mm 10mm;
            }

            * {
                box-sizing: border-box;
            }

            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        .no-print {
            display: none !important;
        }
        .print-container {
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: 460px;
            page-break-inside: avoid;
            font-size: 10px;
            margin: 0;
            padding: 10mm;
        }
    }
    @media screen {
        .print-container {
            width: 100%;
            max-width: 900px;
            min-height: 400px;
            margin: 20px auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            font-size: 12px;
            padding: 12px;
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

            {/* Auto-Save Status Banner */}
            <div className="no-print bg-blue-50 border-b border-blue-200 p-2 text-center text-sm text-blue-700">
                🔄 QR Code will be automatically saved to database when page loads
            </div>

            {/* Receipt Container */}
            <div className="print-container bg-white border font-mono">
                <div className="grid grid-cols-10 gap-2 h-full">

                    {/* Left Section - Hospital Info */}
                    <div className="col-span-2">
                        {/* Hospital Header with Logo */}
                        <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 mb-2">
                            <div className="flex justify-center mb-1">
                                <img
                                    src="/logo.png"
                                    alt="Hospital Logo"
                                    className="h-6 w-6 object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) {
                                            fallback.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className="h-6 w-6 bg-blue-600 rounded-full hidden items-center justify-center">
                                    <Building className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <h1 className="text-xs font-bold text-gray-900 leading-tight">NAOGAON ISLAMIA</h1>
                            <h2 className="text-xs font-bold text-blue-600">CHAKKHU HOSPITAL</h2>
                            <p className="text-xs text-gray-600">& Phaco Center</p>
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <p>Main Road, Naogaon</p>
                                <p>01307-885566</p>
                                <p>niehpc@gmail.com</p>
                            </div>
                        </div>

                        {/* Receipt Info */}
                        <div className="text-center mb-2">
                            <div className="bg-green-100 border border-green-300 rounded-lg p-1.5 mb-2">
                                <div className="flex items-center justify-center gap-1 text-green-700">
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="font-semibold text-xs">COMPLETED</span>
                                </div>
                            </div>

                            <div className="space-y-1 text-xs">
                                <div>
                                    <span className="text-gray-600">Receipt:</span>
                                    <div className="font-bold text-xs">{generateReceiptNumber().split('-').slice(-1)[0]}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Visit:</span>
                                    <div className="font-bold">{visit.visit_id}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Date:</span>
                                    <div className="font-bold">{new Date(visit.created_at).toLocaleDateString('en-BD', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                    })}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Time:</span>
                                    <div className="font-bold">{formatTime(visit.created_at)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${visit.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : visit.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                <CheckCircle className="h-3 w-3" />
                                {visit.payment_status === 'paid' ? 'PAID' :
                                    visit.payment_status === 'partial' ? 'PARTIAL' : 'PENDING'}
                            </div>
                        </div>
                    </div>

                    {/* Patient Information */}
                    <div className="col-span-3">
                        <div className="border border-gray-300 rounded-lg p-2 h-full">
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-xs">
                                <User className="h-3 w-3" />
                                PATIENT DETAILS
                            </h3>

                            <div className="grid grid-cols-1 gap-y-1.5 text-xs">
                                <div className="grid grid-cols-2 gap-x-2">
                                    <div>
                                        <span className="text-gray-600 block">Patient ID:</span>
                                        <span className="font-bold">{patient.patient_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Phone:</span>
                                        <span className="font-bold">{patient.phone}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-gray-600 block">Full Name:</span>
                                    <span className="font-bold">{patient.name}</span>
                                </div>

                                {patient.nid_card && (
                                    <div>
                                        <span className="text-gray-600 block">NID Card:</span>
                                        <span className="font-bold">{patient.nid_card}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-x-2">
                                    <div>
                                        <span className="text-gray-600 block">Gender:</span>
                                        <span className="font-bold capitalize">{patient.gender || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Birth Date:</span>
                                        <span className="font-bold">
                                            {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-BD', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: '2-digit'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {patient.email && (
                                    <div>
                                        <span className="text-gray-600 block">Email:</span>
                                        <span className="font-bold text-xs">{patient.email}</span>
                                    </div>
                                )}

                                {visit.selected_doctor && (
                                    <div>
                                        <span className="text-gray-600 block">Doctor:</span>
                                        <span className="font-bold">Dr. {visit.selected_doctor.name}</span>
                                        <span className="text-xs text-gray-500 block">
                                            {visit.selected_doctor.specialization || 'Ophthalmologist'}
                                        </span>
                                    </div>
                                )}

                                {visit.chief_complaint && (
                                    <div>
                                        <span className="text-gray-600 block">Complaint:</span>
                                        <span className="font-bold text-xs">
                                            {visit.chief_complaint.length > 40
                                                ? visit.chief_complaint.substring(0, 40) + '...'
                                                : visit.chief_complaint}
                                        </span>
                                    </div>
                                )}

                                {patient.address && (
                                    <div>
                                        <span className="text-gray-600 block">Address:</span>
                                        <span className="font-bold text-xs">
                                            {patient.address.length > 50
                                                ? patient.address.substring(0, 50) + '...'
                                                : patient.address}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="col-span-3">
                        <div className="border border-gray-300 rounded-lg p-2 h-full">
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-xs">
                                <DollarSign className="h-3 w-3" />
                                PAYMENT BREAKDOWN
                            </h3>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Registration:</span>
                                    <span className="font-bold">{formatCurrency(visit.registration_fee)}</span>
                                </div>

                                {visit.doctor_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Consultation:</span>
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

                                <div className="border-t-2 border-dashed border-gray-400 pt-1.5 mt-1.5">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span>TOTAL:</span>
                                        <span>{formatCurrency(visit.final_amount)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-green-600">
                                    <span className="font-bold">PAID:</span>
                                    <span className="font-bold">{formatCurrency(visit.total_paid)}</span>
                                </div>

                                {visit.total_due > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span className="font-bold">DUE:</span>
                                        <span className="font-bold">{formatCurrency(visit.total_due)}</span>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-1.5 rounded mt-1.5">
                                    <div className="text-xs text-gray-600">
                                        Method: <span className="font-bold">
                                            {getPaymentMethodName(payment?.payment_method_id || 1)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Date: <span className="font-bold">
                                            {payment ? new Date(payment.payment_date).toLocaleDateString('en-BD', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: '2-digit'
                                            }) : new Date(visit.created_at).toLocaleDateString('en-BD', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps & QR */}
                    <div className="col-span-2">
                        {/* Next Steps */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 mb-2">
                            <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                NEXT STEPS
                            </h4>
                            <ul className="text-xs text-blue-700 space-y-0.5">
                                {visit.payment_status === 'paid' ? (
                                    <>
                                        <li>• Vision Test Dept</li>
                                        <li>• Present receipt</li>
                                        <li>• Bring docs</li>
                                        <li>• Follow tech</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Complete payment</li>
                                        <li>• Visit counter</li>
                                        <li>• Pay: {formatCurrency(visit.total_due)}</li>
                                        <li>• Then vision test</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Visit Status */}
                        <div className="border border-gray-300 rounded-lg p-1.5 mb-2">
                            <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                <CheckCircle className="h-3 w-3" />
                                STATUS
                            </h4>
                            <div className="text-xs text-gray-700">
                                <div className="mb-1">
                                    Payment: <span className={`font-bold ${visit.payment_status === 'paid' ? 'text-green-600' :
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
                            <div className="border border-gray-300 rounded-lg p-1.5 mb-2">
                                <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1 text-xs">
                                    <FileText className="h-3 w-3" />
                                    NOTES
                                </h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    {patient.medical_history.length > 50
                                        ? patient.medical_history.substring(0, 50) + '...'
                                        : patient.medical_history}
                                </p>
                            </div>
                        )}

                        {/* QR Code */}
                        <AutoSaveQRCode patient={patient} size={55} csrfToken={csrfToken} />
                    </div>

                </div>

                {/* Footer */}
                <div className="border-t-2 border-dashed border-gray-400 pt-1 mt-2">
                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-600">
                            Thank you for choosing our hospital
                        </div>
                        <div className="text-gray-400">
                            Generated: {new Date().toLocaleDateString('en-BD', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                            })} {formatTime(new Date())}
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
