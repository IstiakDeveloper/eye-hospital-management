import { formatDhakaDate, formatDhakaDateTime } from '@/utils/dhaka-time';
import { Head } from '@inertiajs/react';
import { Building, CheckCircle, DollarSign, Receipt, Save, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
const ProfessionalQRCode: React.FC<{ patient: Patient; size?: number; csrfToken?: string }> = ({ patient, size = 90, csrfToken }) => {
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
            const imageUrl = patient.qr_code_image_path.startsWith('http') ? patient.qr_code_image_path : `/storage/${patient.qr_code_image_path}`;

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
        for (const cookie of cookies) {
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
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
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
                    patient_id: patient.patient_id,
                }),
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
                    const imageUrl = result.image_path.startsWith('http') ? result.image_path : `/storage/${result.image_path}`;
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
            hospital: 'Mousumi Eye Hospital',
            url: `${window.location.origin}/patient/${patient.patient_id}`,
            generated_at: new Date().toISOString(),
        });
    };

    return (
        <div className="text-center">
            <div className="mx-auto mb-2 inline-block rounded border border-gray-300 bg-white p-2">
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
                        <QRCode value={getQRCodeData()} size={size} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                )}
            </div>

            <p className="mb-1 text-xs font-medium text-gray-500">Patient QR</p>

            {saveStatus === 'saving' && (
                <div className="mb-1 text-xs text-blue-600">
                    <Save className="mr-1 inline h-3 w-3" />
                    Saving...
                </div>
            )}

            {saveStatus === 'saved' && (
                <div className="mb-1 text-xs text-green-600">
                    <CheckCircle className="mr-1 inline h-3 w-3" />
                    Saved
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="mb-1 text-xs text-red-600">
                    <button onClick={retryAutoSave} className="hover:underline" title={`Error: ${errorMessage}. Click to retry`}>
                        ⚠️ Retry
                    </button>
                </div>
            )}

            <p className="font-mono text-xs font-semibold text-gray-700">{patient.patient_id}</p>
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
        return formatDhakaDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (date: string | Date): string => {
        // Extract time part from Dhaka datetime, e.g. "01 Mar 2026, 01:49 AM"
        const dt = formatDhakaDateTime(date);
        return dt.includes(', ') ? dt.split(', ')[1] : dt;
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
            4: 'Bank Transfer',
        };
        return methods[methodId] || 'Cash';
    };

    return (
        <div className="min-h-screen bg-white">
            <Head title="Patient Registration Receipt" />

            {csrfToken && <meta name="csrf-token" content={csrfToken} />}

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
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-lg transition-colors hover:bg-blue-700"
                >
                    <Receipt className="h-5 w-5" />
                    Print Receipt
                </button>
            </div>

            {/* Auto-Save Status Banner */}
            <div className="no-print border-b border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-700">
                🔄 QR Code will be automatically saved to database when page loads
            </div>

            {/* Receipt Container */}
            <div className="print-container border border-gray-300 bg-white">
                {/* Hospital Header - Compact */}
                <div className="hospital-header mb-4 border-b-2 border-blue-600 pb-3 text-center">
                    <div className="mb-2 flex items-center justify-center">
                        <img
                            src="/logo.png"
                            alt="Hospital Logo"
                            className="mr-3 h-10 w-10 object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                    fallback.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="mr-3 hidden h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                            <Building className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl leading-tight font-bold text-gray-900">Mousumi Eye Hospital</h1>
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
                    <div className="print-grid grid grid-cols-12 gap-6">
                        {/* Left Section - Receipt Info & Status */}
                        <div className="col-span-3">
                            <div className="mb-3 rounded border border-green-300 bg-green-50 p-3">
                                <div className="text-center">
                                    <div className="mb-2 rounded-full bg-green-600 px-3 py-1 text-xs text-white">
                                        <CheckCircle className="mr-1 inline h-3 w-3" />
                                        <span className="font-bold">COMPLETED</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="block text-xs text-gray-600">Receipt No.</span>
                                            <div className="text-sm font-bold">{generateReceiptNumber().split('-').slice(-1)[0]}</div>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-600">Visit ID</span>
                                            <div className="text-sm font-bold">{visit.visit_id}</div>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-600">Date & Time</span>
                                            <div className="text-xs font-bold">{formatDate(visit.created_at)}</div>
                                            <div className="text-xs font-bold text-gray-700">{formatTime(visit.created_at)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`rounded px-3 py-2 text-center text-sm font-bold ${
                                    visit.payment_status === 'paid'
                                        ? 'border border-green-300 bg-green-100 text-green-800'
                                        : visit.payment_status === 'partial'
                                          ? 'border border-yellow-300 bg-yellow-100 text-yellow-800'
                                          : 'border border-red-300 bg-red-100 text-red-800'
                                }`}
                            >
                                {visit.payment_status === 'paid' ? 'FULLY PAID' : visit.payment_status === 'partial' ? 'PARTIALLY PAID' : 'PENDING'}
                            </div>

                            {/* QR Code Section */}
                            <div className="mt-3 rounded border border-gray-300 p-3">
                                <ProfessionalQRCode patient={patient} size={90} csrfToken={csrfToken} />
                            </div>
                        </div>

                        {/* Middle Section - Patient Information */}
                        <div className="col-span-5">
                            <div className="h-full rounded border border-gray-300 p-3">
                                <h3 className="receipt-title mb-3 flex items-center gap-2 border-b pb-2 font-bold text-gray-800">
                                    <User className="h-4 w-4" />
                                    PATIENT INFORMATION
                                </h3>

                                <div className="print-info-grid grid-info grid grid-cols-3 gap-2">
                                    <div>
                                        <span className="block text-xs font-medium text-gray-600">Patient ID</span>
                                        <span className="font-bold">{patient.patient_id}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-600">Phone</span>
                                        <span className="font-bold">{patient.phone}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-600">Gender</span>
                                        <span className="font-bold capitalize">{patient.gender || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-xs font-medium text-gray-600">Full Name</span>
                                        <span className="font-bold">{patient.name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-gray-600">Date of Birth</span>
                                        <span className="text-xs font-bold">{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}</span>
                                    </div>
                                    {patient.nid_card && (
                                        <div className="col-span-2">
                                            <span className="block text-xs font-medium text-gray-600">NID Card</span>
                                            <span className="font-bold">{patient.nid_card}</span>
                                        </div>
                                    )}
                                    {patient.email && (
                                        <div className="col-span-3">
                                            <span className="block text-xs font-medium text-gray-600">Email</span>
                                            <span className="text-xs font-bold">{patient.email}</span>
                                        </div>
                                    )}
                                    {visit.selected_doctor && (
                                        <div className="col-span-3">
                                            <span className="block text-xs font-medium text-gray-600">Consulting Doctor</span>
                                            <span className="font-bold">{visit.selected_doctor?.user.name}</span>
                                            <span className="block text-xs text-gray-600">
                                                {visit.selected_doctor.specialization || 'Ophthalmologist'}
                                            </span>
                                        </div>
                                    )}
                                    {visit.chief_complaint && (
                                        <div className="col-span-3">
                                            <span className="block text-xs font-medium text-gray-600">Chief Complaint</span>
                                            <span className="text-xs font-bold">{visit.chief_complaint}</span>
                                        </div>
                                    )}
                                    {patient.address && (
                                        <div className="col-span-3">
                                            <span className="block text-xs font-medium text-gray-600">Address</span>
                                            <span className="text-xs font-bold">{patient.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Payment Details */}
                        <div className="col-span-4">
                            <div className="rounded border border-gray-300 p-3">
                                <h3 className="receipt-title mb-3 flex items-center gap-2 border-b pb-2 font-bold text-gray-800">
                                    <DollarSign className="h-4 w-4" />
                                    PAYMENT DETAILS
                                </h3>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Registration Fee:</span>
                                        <span className="font-bold">{formatCurrency(visit.registration_fee)}</span>
                                    </div>

                                    {visit.doctor_fee > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Consultation Fee:</span>
                                            <span className="font-bold">{formatCurrency(visit.doctor_fee)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t pt-2">
                                        <span className="font-medium text-gray-600">Subtotal:</span>
                                        <span className="font-bold">{formatCurrency(visit.total_amount)}</span>
                                    </div>

                                    {visit.discount_amount > 0 && (
                                        <div className="flex items-center justify-between text-green-600">
                                            <span className="font-medium">
                                                Discount ({visit.discount_type === 'percentage' ? `${visit.discount_value}%` : 'Fixed'}):
                                            </span>
                                            <span className="font-bold">-{formatCurrency(visit.discount_amount)}</span>
                                        </div>
                                    )}

                                    <div className="my-3 rounded border border-blue-200 bg-blue-50 p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-blue-800">TOTAL AMOUNT:</span>
                                            <span className="amount-display font-bold text-blue-800">{formatCurrency(visit.final_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-green-600">
                                        <span className="text-sm font-bold">AMOUNT PAID:</span>
                                        <span className="text-lg font-bold">{formatCurrency(visit.total_paid)}</span>
                                    </div>

                                    {visit.total_due > 0 && (
                                        <div className="flex items-center justify-between text-red-600">
                                            <span className="text-sm font-bold">AMOUNT DUE:</span>
                                            <span className="text-lg font-bold">{formatCurrency(visit.total_due)}</span>
                                        </div>
                                    )}

                                    <div className="mt-3 rounded bg-gray-50 p-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="block text-gray-600">Payment Method:</span>
                                                <span className="font-bold">{getPaymentMethodName(payment?.payment_method_id || 1)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-600">Payment Date:</span>
                                                <span className="font-bold">
                                                    {payment ? formatDate(payment.payment_date) : formatDate(visit.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        {payment?.notes && (
                                            <div className="mt-2">
                                                <span className="block text-xs text-gray-600">Notes:</span>
                                                <span className="text-xs font-bold">{payment.notes}</span>
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
                    <div className="flex items-center justify-between text-xs">
                        <div className="font-medium text-gray-600">Thank you for choosing Mousumi Eye Hospital</div>
                        <div className="text-gray-500">
                            Generated: {formatDate(new Date())} at {formatTime(new Date())}
                        </div>
                        <div className="rounded bg-black px-3 py-1 font-mono text-sm tracking-wider text-white">{patient.patient_id}</div>
                    </div>
                </div>
            </div>

            {/* Screen Only - Back Button */}
            <div className="no-print mt-6 text-center">
                <button
                    onClick={() => window.history.back()}
                    className="rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
                >
                    Back to Registration
                </button>
            </div>
        </div>
    );
};

export default PatientReceipt;
