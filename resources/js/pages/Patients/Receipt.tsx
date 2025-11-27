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
    user: {
        id: number;
        name: string;
    };
}

interface Visit {
    id: number;
    visit_id: string;
    patient_id: number;
    selected_doctor_id?: number;
    selectedDoctor?: Doctor;
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

// Professional QR Component with Image Support
const ProfessionalQRCode: React.FC<{ patient: Patient; size?: number; csrfToken?: string }> = ({
    patient,
    size = 90,
    csrfToken
}) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

    // Auto-save QR code when component mounts
    useEffect(() => {
        if (patient.qr_code && !hasAttemptedSave && !patient.qr_code_image_path) {
            const timer = setTimeout(() => {
                autoSaveQRCode();
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [patient.qr_code, hasAttemptedSave, patient.qr_code_image_path]);

    // Load existing QR code image if available
    useEffect(() => {
        if (patient.qr_code_image_path) {
            const imageUrl = patient.qr_code_image_path.startsWith('http')
                ? patient.qr_code_image_path
                : `/storage/${patient.qr_code_image_path}`;

            const img = new Image();
            img.onload = () => setQrImageUrl(imageUrl);
            img.onerror = () => {
                console.warn('Saved QR image not found, will generate new one');
                setQrImageUrl(null);
            };
            img.src = imageUrl;
        }
    }, [patient.qr_code_image_path]);

    // Get CSRF token from multiple sources
    const getCSRFToken = (): string | null => {
        if (csrfToken) {
            return csrfToken;
        }

        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            return metaToken;
        }

        const windowToken = (window as any).csrfToken;
        if (windowToken) {
            return windowToken;
        }

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
            const svgElement = qrRef.current.querySelector('svg');
            if (!svgElement) {
                throw new Error('QR SVG not found');
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            const scale = 8;
            canvas.width = size * scale;
            canvas.height = size * scale;
            ctx.scale(scale, scale);

            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load SVG image'));
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const token = getCSRFToken();

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            if (token) {
                headers['X-CSRF-TOKEN'] = token;
            } else {
                console.warn('No CSRF token found - request may fail');
            }

            const response = await fetch(`/patient/${patient.id}/save-qr`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    qr_data_url: dataUrl,
                    patient_id: patient.patient_id
                })
            });

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
                if (result.image_path) {
                    const imageUrl = result.image_path.startsWith('http')
                        ? result.image_path
                        : `/storage/${result.image_path}`;
                    setQrImageUrl(imageUrl);
                }
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

    const retryAutoSave = async () => {
        setHasAttemptedSave(false);
        setSaveStatus('idle');
        setErrorMessage('');

        setTimeout(() => {
            autoSaveQRCode();
        }, 500);
    };

    const getQRCodeData = () => {
        if (patient.qr_code) {
            return patient.qr_code;
        }

        return JSON.stringify({
            type: 'patient',
            patient_id: patient.patient_id,
            name: patient.name,
            phone: patient.phone,
            hospital: 'Naogaon Islamia Eye Hospital',
            url: `${window.location.origin}/patient/${patient.patient_id}`,
            generated_at: new Date().toISOString()
        });
    };

    return (
        <div className="text-center">
            <div className="bg-white p-2 border border-gray-300 rounded mx-auto mb-2 inline-block">
                {qrImageUrl ? (
                    <img
                        src={qrImageUrl}
                        alt="Patient QR Code"
                        className="block"
                        style={{ width: size, height: size }}
                        onError={() => {
                            console.warn('Failed to load saved QR image, falling back to generated');
                            setQrImageUrl(null);
                        }}
                    />
                ) : (
                    <div ref={qrRef}>
                        <QRCode
                            value={getQRCodeData()}
                            size={size}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                        />
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500 mb-1 font-medium">Patient QR</p>

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
                        ⚠️ Retry
                    </button>
                </div>
            )}

            <p className="text-xs text-gray-700 font-mono font-semibold">
                {patient.patient_id}
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
            month: 'short',
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
                        margin: 8mm;
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
                        font-size: 11px;
                        overflow: hidden !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .print-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 50vh !important;
                        max-height: 50vh !important;
                        overflow: hidden !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        padding: 8px !important;
                        margin: 0 !important;
                        font-size: 11px !important;
                        position: relative !important;
                        border: none !important;
                    }

                    .print-content {
                        height: calc(50vh - 50px) !important;
                        overflow: hidden !important;
                    }

                    .print-footer {
                        position: absolute !important;
                        bottom: 0 !important;
                        left: 8px !important;
                        right: 8px !important;
                        height: 35px !important;
                        overflow: hidden !important;
                    }

                    .hospital-header h1 {
                        font-size: 14px !important;
                        line-height: 1.2 !important;
                        margin-bottom: 2px !important;
                    }

                    .hospital-header .text-sm {
                        font-size: 10px !important;
                    }

                    .grid-info {
                        font-size: 10px !important;
                    }

                    .receipt-title {
                        font-size: 11px !important;
                    }

                    .amount-display {
                        font-size: 12px !important;
                    }

                    .print-grid {
                        gap: 6px !important;
                    }

                    .print-info-grid {
                        gap: 4px !important;
                    }

                    /* Force single page */
                    body {
                        page-break-after: avoid !important;
                    }

                    .print-container * {
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                    }
                }

                @media screen {
                    .print-container {
                        width: 100%;
                        max-width: 1200px;
                        min-height: 600px;
                        margin: 20px auto;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        font-size: 13px;
                        padding: 20px;
                        border-radius: 8px;
                        position: relative;
                    }

                    .print-content {
                        height: auto;
                    }

                    .print-footer {
                        position: relative;
                        height: auto;
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
            <div className="no-print bg-blue-50 border-b border-blue-200 p-3 text-center text-sm text-blue-700">
                🔄 QR Code will be automatically saved to database when page loads
            </div>

            {/* Receipt Container */}
            <div className="print-container bg-white border border-gray-300">

                {/* Hospital Header - Compact */}
                <div className="hospital-header text-center border-b-2 border-blue-600 pb-3 mb-4">
                    <div className="flex justify-center items-center mb-2">
                        <img
                            src="/logo.png"
                            alt="Hospital Logo"
                            className="h-10 w-10 object-contain mr-3"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                    fallback.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="h-10 w-10 bg-blue-600 rounded-full hidden items-center justify-center mr-3">
                            <Building className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">
                                নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার
                            </h1>
                        </div>
                    </div>

                    <div className="space-y-1 text-gray-700">
                        <div className="text-sm font-semibold">
                            <span className="font-bold">ঠিকানা:</span> সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।
                        </div>
                        <div className="text-sm font-semibold">
                            <span className="font-bold">যোগাযোগ:</span>
                            <span className="ml-2">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০</span>
                            <span className="ml-3">✉️ niehpc@gmail.com</span>
                        </div>
                    </div>
                </div>

                {/* Print Content */}
                <div className="print-content">
                    {/* Receipt Content */}
                    <div className="grid grid-cols-12 print-grid gap-6">

                        {/* Left Section - Receipt Info & Status */}
                        <div className="col-span-3">
                            <div className="bg-green-50 border border-green-300 rounded p-3 mb-3">
                                <div className="text-center">
                                    <div className="bg-green-600 text-white px-3 py-1 rounded-full mb-2 text-xs">
                                        <CheckCircle className="h-3 w-3 inline mr-1" />
                                        <span className="font-bold">COMPLETED</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-gray-600 block text-xs">Receipt No.</span>
                                            <div className="font-bold text-sm">{generateReceiptNumber().split('-').slice(-1)[0]}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block text-xs">Visit ID</span>
                                            <div className="font-bold text-sm">{visit.visit_id}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block text-xs">Date & Time</span>
                                            <div className="font-bold text-xs">
                                                {formatDate(visit.created_at)}
                                            </div>
                                            <div className="font-bold text-xs text-gray-700">
                                                {formatTime(visit.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`text-center px-3 py-2 rounded font-bold text-sm ${visit.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : visit.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                {visit.payment_status === 'paid' ? 'FULLY PAID' :
                                    visit.payment_status === 'partial' ? 'PARTIALLY PAID' : 'PENDING'}
                            </div>

                            {/* QR Code Section */}
                            <div className="border border-gray-300 rounded p-3 mt-3">
                                <ProfessionalQRCode patient={patient} size={90} csrfToken={csrfToken} />
                            </div>
                        </div>

                        {/* Middle Section - Patient Information */}
                        <div className="col-span-5">
                            <div className="border border-gray-300 rounded p-3 h-full">
                                <h3 className="receipt-title font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <User className="h-4 w-4" />
                                    PATIENT INFORMATION
                                </h3>

                                <div className="grid grid-cols-3 print-info-grid gap-2 grid-info">
                                    <div>
                                        <span className="text-gray-600 block text-xs font-medium">Patient ID</span>
                                        <span className="font-bold">{patient.patient_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block text-xs font-medium">Phone</span>
                                        <span className="font-bold">{patient.phone}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block text-xs font-medium">Gender</span>
                                        <span className="font-bold capitalize">{patient.gender || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block text-xs font-medium">Full Name</span>
                                        <span className="font-bold">{patient.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block text-xs font-medium">Date of Birth</span>
                                        <span className="font-bold text-xs">
                                            {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}
                                        </span>
                                    </div>
                                    {patient.nid_card && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600 block text-xs font-medium">NID Card</span>
                                            <span className="font-bold">{patient.nid_card}</span>
                                        </div>
                                    )}
                                    {patient.email && (
                                        <div className="col-span-3">
                                            <span className="text-gray-600 block text-xs font-medium">Email</span>
                                            <span className="font-bold text-xs">{patient.email}</span>
                                        </div>
                                    )}
                                    {visit.selected_doctor && (
                                        <div className="col-span-3">
                                            <span className="text-gray-600 block text-xs font-medium">Consulting Doctor</span>
                                            <span className="font-bold">{visit.selected_doctor?.user.name}</span>
                                            <span className="text-xs text-gray-600 block">
                                                {visit.selected_doctor.specialization || 'Ophthalmologist'}
                                            </span>
                                        </div>
                                    )}
                                    {visit.chief_complaint && (
                                        <div className="col-span-3">
                                            <span className="text-gray-600 block text-xs font-medium">Chief Complaint</span>
                                            <span className="font-bold text-xs">{visit.chief_complaint}</span>
                                        </div>
                                    )}
                                    {patient.address && (
                                        <div className="col-span-3">
                                            <span className="text-gray-600 block text-xs font-medium">Address</span>
                                            <span className="font-bold text-xs">{patient.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Payment Details */}
                        <div className="col-span-4">
                            <div className="border border-gray-300 rounded p-3">
                                <h3 className="receipt-title font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <DollarSign className="h-4 w-4" />
                                    PAYMENT DETAILS
                                </h3>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Registration Fee:</span>
                                        <span className="font-bold">{formatCurrency(visit.registration_fee)}</span>
                                    </div>

                                    {visit.doctor_fee > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Consultation Fee:</span>
                                            <span className="font-bold">{formatCurrency(visit.doctor_fee)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center border-t pt-2">
                                        <span className="text-gray-600 font-medium">Subtotal:</span>
                                        <span className="font-bold">{formatCurrency(visit.total_amount)}</span>
                                    </div>

                                    {visit.discount_amount > 0 && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span className="font-medium">
                                                Discount ({visit.discount_type === 'percentage'
                                                    ? `${visit.discount_value}%`
                                                    : 'Fixed'}):
                                            </span>
                                            <span className="font-bold">-{formatCurrency(visit.discount_amount)}</span>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 p-3 rounded border border-blue-200 my-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-blue-800">TOTAL AMOUNT:</span>
                                            <span className="font-bold amount-display text-blue-800">{formatCurrency(visit.final_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="font-bold text-sm">AMOUNT PAID:</span>
                                        <span className="font-bold text-lg">{formatCurrency(visit.total_paid)}</span>
                                    </div>

                                    {visit.total_due > 0 && (
                                        <div className="flex justify-between items-center text-red-600">
                                            <span className="font-bold text-sm">AMOUNT DUE:</span>
                                            <span className="font-bold text-lg">{formatCurrency(visit.total_due)}</span>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-3 rounded mt-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-600 block">Payment Method:</span>
                                                <span className="font-bold">
                                                    {getPaymentMethodName(payment?.payment_method_id || 1)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 block">Payment Date:</span>
                                                <span className="font-bold">
                                                    {payment ? formatDate(payment.payment_date)
                                                        : formatDate(visit.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        {payment?.notes && (
                                            <div className="mt-2">
                                                <span className="text-gray-600 block text-xs">Notes:</span>
                                                <span className="font-bold text-xs">{payment.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed Position */}
                <div className="print-footer border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-600 font-medium">
                            Thank you for choosing Naogaon Islamia Eye Hospital
                        </div>
                        <div className="text-gray-500">
                            Generated: {formatDate(new Date())} at {formatTime(new Date())}
                        </div>
                        <div className="bg-black text-white px-3 py-1 font-mono text-sm tracking-wider rounded">
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
