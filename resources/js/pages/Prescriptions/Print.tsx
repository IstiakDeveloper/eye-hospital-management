import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

// Types based on your controller data structure
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization?: string;
    bmdc_number?: string;
    qualification?: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
}

interface Medicine {
    id: number;
    medicine_name: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}

interface Glass {
    id: number;
    eye?: string;
    sphere?: number;
    cylinder?: number;
    axis?: number;
    addition?: number;
    prism?: number;
    notes?: string;
}

interface Prescription {
    id: string | number;
    patient: Patient;
    doctor: Doctor;
    appointment?: Appointment | null;
    diagnosis?: string;
    advice?: string;
    notes?: string;
    followup_date?: string;
    created_at: string;
    medicines: Medicine[];
    glasses: Glass[];
}

interface PrintMetadata {
    print_date: string;
    printed_by: string;
    has_glasses: boolean;
    glasses_count: number;
    filename: string;
    is_blank_prescription?: boolean;
}

interface User {
    name: string;
    role: string;
}

interface PrescriptionPrintProps {
    prescription: Prescription;
    print_metadata: PrintMetadata;
    user: User;
}

export default function PrescriptionPrint({ prescription, print_metadata, user }: PrescriptionPrintProps) {
    const isBlankPrescription = print_metadata?.is_blank_prescription || false;

    useEffect(() => {
        // Auto print when page loads
        window.print();
    }, []);

    const handleGoBack = () => {
        // Try multiple methods to go back
        if (window.history.length > 1) {
            window.history.back();
        } else if (document.referrer) {
            window.location.href = document.referrer;
        } else {
            // Fallback to dashboard or home
            window.location.href = '/dashboard';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '__/__/____';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '__:__ __';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatSphereValue = (value?: number) => {
        if (!value) return '-';
        return value > 0 ? `+${value}` : `${value}`;
    };

    const formatAxisValue = (value?: number) => {
        if (!value) return '-';
        return `${value}°`;
    };

    return (
        <>
            <Head title={`Medical Prescription - ${prescription.patient.name}`} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');

                /* Reset all default styles */
                *, *::before, *::after {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 100%;
                    width: 100%;
                }

                @page {
                    size: A4 portrait;
                    margin: 5mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    line-height: 1.3;
                    color: #000;
                    background: white;
                }

                .print-container {
                    max-width: 200mm;
                    margin: 0 auto;
                    padding: 3mm;
                    background: white;
                }

                /* Hospital Header with Logo */
                .hospital-header {
                    margin-bottom: 1mm;
                    border-bottom: 2px solid #000;
                    padding-bottom: 3mm;
                    width: 100%;
                    text-align: center;
                    min-height: 25mm;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5mm;
                }

                .logo-placeholder {
                    width: 20mm;
                    height: 15mm;
                    border: 2px solid #000;
                    background: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    font-weight: bold;
                }

                .hospital-info h1 {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 2mm;
                }

                .hospital-info p {
                    font-size: 10px;
                    margin-bottom: 1mm;
                }

                /* Prescription Title Section */
                .prescription-title-section {
                    width: 100%;
                    margin: 1mm auto 1mm auto;
                    position: relative;
                    height: 15mm;
                }

                .prescription-title {
                    width: 70mm;
                    margin: 0 auto;
                    border: 2px solid #000;
                    padding: 1mm;
                    text-align: center;
                    font-weight: bold;
                    font-size: 12px;
                    background: #f5f5f5;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }

                .header-left {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 35mm;
                    font-size: 9px;
                    font-weight: bold;
                }

                .header-right {
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 35mm;
                    text-align: right;
                    font-size: 9px;
                    font-weight: bold;
                }

                .rx-number {
                    color: #666;
                    margin-bottom: 1mm;
                }

                .date-info {
                    font-weight: bold;
                    margin-bottom: 1mm;
                }

                .time-info {
                    font-size: 8px;
                    color: #666;
                }

                /* Patient Info Table */
                .patient-info-table {
                    width: 100%;
                    margin-bottom: 3mm;
                    border-collapse: collapse;
                    font-size: 9px;
                }

                .patient-info-table td {
                    padding: 1mm;
                    vertical-align: top;
                }

                .patient-label {
                    font-weight: bold;
                    width: 12mm;
                }

                .patient-value {
                    border-bottom: 1px solid #000;
                    min-height: 3mm;
                    width: 25mm;
                    padding-left: 1mm;
                }

                /* Section Styles */
                .diagnosis-section {
                    margin-bottom: 3mm;
                }

                .section-label {
                    font-weight: bold;
                    margin-bottom: 0.5mm;
                    font-size: 10px;
                }

                .section-box {
                    border: 1px solid #000;
                    min-height: 8mm;
                    padding: 1mm;
                    width: 98.7%;
                }

                /* Medicine Table */
                .medicine-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 3mm;
                    font-size: 8px;
                }

                .medicine-table th,
                .medicine-table td {
                    border: 1px solid #000;
                    padding: 1mm;
                    text-align: left;
                }

                .medicine-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                    font-size: 8px;
                }

                .medicine-table tr:nth-child(even) {
                    background: #f8f8f8;
                }

                .medicine-name {
                    font-weight: bold;
                    color: #000;
                    font-size: 9px;
                }

                .dosage-cell {
                    text-align: center;
                    font-weight: bold;
                }

                /* Glasses Section */
                .glasses-section {
                    margin-bottom: 3mm;
                    border: 1px solid #000;
                }

                .glasses-header {
                    background: #f0f0f0;
                    font-weight: bold;
                    padding: 1mm;
                    text-align: center;
                    font-size: 9px;
                    border-bottom: 1px solid #000;
                }

                .glasses-content {
                    padding: 2mm;
                }

                .glasses-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1mm 0;
                    font-size: 8px;
                }

                .glasses-table th,
                .glasses-table td {
                    border: 1px solid #000;
                    padding: 1mm;
                    text-align: center;
                }

                .glasses-table th {
                    background: #f8f8f8;
                    font-weight: bold;
                }

                .eye-cell {
                    background: #fff5f5;
                    font-weight: bold;
                }

                .measurements-box {
                    margin-top: 1mm;
                    padding: 1mm;
                    background: #f8f8f8;
                    border: 1px solid #ddd;
                    font-size: 7px;
                }

                .optical-notice {
                    background: #f0f8ff;
                    border: 1px solid #007acc;
                    padding: 1mm;
                    margin: 1mm 0;
                    text-align: center;
                    font-size: 8px;
                    font-weight: bold;
                }

                /* Advice Section */
                .advice-section {
                    background: #fffbf0;
                    border: 1px solid #cc9900;
                    padding: 3mm;
                    margin-bottom: 3mm;
                }

                .advice-title {
                    font-weight: bold;
                    color: #cc6600;
                    margin-bottom: 2mm;
                    font-size: 11px;
                }

                /* Follow-up */
                .followup-section {
                    display: inline-block;
                    background: #f0fff0;
                    border: 1px solid #009900;
                    padding: 2mm 4mm;
                    margin-bottom: 3mm;
                    font-size: 10px;
                }

                .followup-label {
                    font-weight: bold;
                    color: #006600;
                }

                .followup-date {
                    font-weight: bold;
                    margin-left: 2mm;
                }

                /* Notes Section */
                .notes-section {
                    margin-bottom: 5mm;
                }

                .notes-box {
                    border: 1px solid #000;
                    min-height: 12mm;
                    padding: 2mm;
                    width: 97.6%;
                }

                /* Signature Table */
                .signature-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 5mm;
                    font-size: 9px;
                }

                .signature-table td {
                    border-top: 1px solid #000;
                    padding: 3mm 2mm 2mm 2mm;
                    width: 50%;
                    vertical-align: top;
                }

                .signature-left {
                    text-align: center;
                    border-right: 1px solid #000;
                }

                .signature-right {
                    text-align: center;
                }

                .signature-line {
                    border-bottom: 1px solid #000;
                    height: 12mm;
                    margin-bottom: 2mm;
                    width: 80%;
                    margin-left: auto;
                    margin-right: auto;
                }

                .signature-label {
                    font-weight: bold;
                    font-size: 8px;
                }

                .doctor-info {
                    margin-bottom: 3mm;
                    text-align: center;
                }

                .doctor-name {
                    font-weight: bold;
                    font-size: 11px;
                }

                .doctor-details {
                    font-size: 8px;
                    color: #666;
                    margin-top: 1mm;
                }

                /* Footer */
                .prescription-footer {
                    position: fixed;
                    bottom: 5mm;
                    left: 5mm;
                    right: 5mm;
                    text-align: center;
                    font-size: 7px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 2mm;
                }

                @media print {
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .print-container {
                        margin: 0 !important;
                        padding: 3mm !important;
                        width: 100% !important;
                        max-width: none !important;
                        box-shadow: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    @page {
                        margin: 5mm;
                    }
                }

                @media screen {
                    body {
                        background: #f5f5f5;
                        padding: 20px;
                    }

                    .print-container {
                        background: white;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        margin: 20px auto;
                    }
                }
            `}</style>

            <div className="print-container">
                {/* Hospital Header with Logo */}
                <div className="hospital-header">
                    <div className="header-content">
                        <div className="logo-container">
                            <img
                                src="/logo.png"
                                alt="Hospital Logo"
                                style={{
                                    width: '20mm',
                                    height: '15mm',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                        <div className="hospital-info">
                            <h1 className="text-2xl font-bold">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
                            <p>সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
                            <p>মোবাইল: ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০; ইমেইল: niehpc@gmail.com</p>
                        </div>
                    </div>
                </div>

                {/* Prescription Title with Date and Rx Number */}
                <div className="prescription-title-section">
                    <div className="header-left">
                        <div className="rx-number">
                            Rx #{isBlankPrescription ? '______' : String(prescription.id).padStart(6, '0')}
                        </div>
                    </div>

                    <div className="prescription-title">MEDICAL PRESCRIPTION</div>

                    <div className="header-right">
                        <div className="date-info">
                            {isBlankPrescription ? '__/__/____' : formatDate(prescription.created_at)}
                        </div>
                        <div className="time-info">
                            {isBlankPrescription ? '__:__ __' : formatTime(prescription.created_at)}
                        </div>
                    </div>
                </div>

                {/* Patient Information */}
                <table className="patient-info-table">
                    <tbody>
                        <tr>
                            <td className="patient-label">Name:</td>
                            <td className="patient-value">{prescription.patient.name}</td>
                            <td style={{ width: '5mm' }}></td>
                            <td className="patient-label">Patient ID:</td>
                            <td className="patient-value">{prescription.patient.patient_id}</td>
                            <td style={{ width: '5mm' }}></td>
                            <td className="patient-label">Gender:</td>
                            <td className="patient-value">
                                {prescription.patient.gender ? prescription.patient.gender.charAt(0).toUpperCase() + prescription.patient.gender.slice(1) : 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td className="patient-label">Age:</td>
                            <td className="patient-value">
                                {prescription.patient.age ? `${prescription.patient.age} Years` : 'N/A'}
                            </td>
                            <td style={{ width: '5mm' }}></td>
                            <td className="patient-label">Phone:</td>
                            <td className="patient-value">{prescription.patient.phone || 'N/A'}</td>
                            <td style={{ width: '5mm' }}></td>
                            <td className="patient-label">Date:</td>
                            <td className="patient-value">
                                {isBlankPrescription ? '__/__/____' : formatDate(prescription.created_at)}
                            </td>
                        </tr>
                        <tr>
                            <td className="patient-label">Address:</td>
                            <td colSpan={7} className="patient-value" style={{ width: 'auto' }}>
                                {prescription.patient.address || 'N/A'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Diagnosis */}
                <div className="diagnosis-section">
                    <div className="section-label">Medical Diagnosis:</div>
                    <div className="section-box">
                        {isBlankPrescription ? '' : prescription.diagnosis || ''}
                    </div>
                </div>

                {/* Medicines */}
                <div className="section-label">Prescribed Medicines:</div>
                <table className="medicine-table">
                    <thead>
                        <tr>
                            <th style={{ width: '8%' }}>S/L</th>
                            <th style={{ width: '40%' }}>Medicine Name</th>
                            <th style={{ width: '18%' }}>Dosage</th>
                            <th style={{ width: '15%' }}>Duration</th>
                            <th style={{ width: '19%' }}>Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isBlankPrescription ? (
                            // Create 8 empty rows for blank prescription
                            Array.from({ length: 8 }, (_, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ height: '8mm' }}></td>
                                    <td style={{ height: '8mm' }}></td>
                                    <td style={{ height: '8mm' }}></td>
                                    <td style={{ height: '8mm' }}></td>
                                </tr>
                            ))
                        ) : (
                            prescription.medicines && prescription.medicines.length > 0 ? (
                                prescription.medicines.map((medicine, index) => (
                                    <tr key={medicine.id}>
                                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                        <td>
                                            <div className="medicine-name">{medicine.medicine_name}</div>
                                        </td>
                                        <td className="dosage-cell">{medicine.dosage || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>{medicine.duration || '-'}</td>
                                        <td>
                                            {medicine.instructions || '-'}
                                            {medicine.frequency && (
                                                <><br /><small>({medicine.frequency})</small></>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Show 3 empty rows if no medicines
                                Array.from({ length: 3 }, (_, i) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                        <td style={{ height: '8mm' }}></td>
                                        <td style={{ height: '8mm' }}></td>
                                        <td style={{ height: '8mm' }}></td>
                                        <td style={{ height: '8mm' }}></td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>

                {/* Glasses Prescription */}
                {!isBlankPrescription && prescription.glasses && prescription.glasses.length > 0 && (
                    prescription.glasses.map((glass, index) => (
                        <div key={glass.id} className="glasses-section">
                            <div className="glasses-header">
                                Optical Prescription - {glass.eye ? glass.eye.replace('_', ' ').toUpperCase() : 'Glasses'}
                            </div>
                            <div className="glasses-content">
                                <div className="optical-notice">
                                    This prescription can be used at any optical shop
                                </div>

                                <table className="glasses-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '25%' }}>Measurement</th>
                                            <th style={{ width: '25%' }}>SPH</th>
                                            <th style={{ width: '25%' }}>CYL</th>
                                            <th style={{ width: '25%' }}>AXIS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="eye-cell">{glass.eye || 'Value'}</td>
                                            <td>{formatSphereValue(glass.sphere)}</td>
                                            <td>{formatSphereValue(glass.cylinder)}</td>
                                            <td>{formatAxisValue(glass.axis)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {glass.addition && (
                                    <div className="measurements-box">
                                        <strong>Addition:</strong> +{glass.addition}
                                    </div>
                                )}

                                {glass.prism && (
                                    <div className="measurements-box">
                                        <strong>Prism:</strong> {glass.prism}
                                    </div>
                                )}

                                {glass.notes && (
                                    <div className="measurements-box">
                                        <strong>Notes:</strong> {glass.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Advice */}
                <div className="advice-section">
                    <div className="advice-title">Medical Advice & Recommendations:</div>
                    <div style={{ minHeight: '15mm' }}>
                        {isBlankPrescription ? '' : prescription.advice || ''}
                    </div>
                </div>

                {/* Follow-up */}
                {!isBlankPrescription && prescription.followup_date && (
                    <div className="followup-section">
                        <span className="followup-label">Next Follow-up:</span>
                        <span className="followup-date">{formatDate(prescription.followup_date)}</span>
                    </div>
                )}

                {/* Clinical Notes */}
                <div className="notes-section">
                    <div className="section-label">Clinical Notes:</div>
                    <div className="notes-box">
                        {isBlankPrescription ? '' : prescription.notes || ''}
                    </div>
                </div>

                {/* Signature */}
                <table className="signature-table">
                    <tbody>
                        <tr>
                            <td className="signature-left">
                                <div className="signature-line"></div>
                                <div className="signature-label">Patient's Signature</div>
                            </td>
                            <td className="signature-right">
                                <div className="doctor-info">
                                    <div className="doctor-name">Dr. {prescription.doctor.name}</div>
                                    <div className="doctor-details">
                                        {prescription.doctor.specialization && (
                                            <>{prescription.doctor.specialization}<br /></>
                                        )}
                                        {prescription.doctor.bmdc_number && (
                                            <>BMDC Reg: {prescription.doctor.bmdc_number}<br /></>
                                        )}
                                        License to Practice Medicine
                                    </div>
                                </div>
                                <div className="signature-line"></div>
                                <div className="signature-label">Doctor's Signature & Seal</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer */}
                <div className="prescription-footer">
                    <strong>Important:</strong> Take medicines as prescribed • Valid for 30 days • Keep out of reach of children
                    {!isBlankPrescription && prescription.glasses && prescription.glasses.length > 0 && (
                        <> • Optical prescription valid at any certified optical shop</>
                    )}
                    <br />
                    Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour12: true })} |
                    {isBlankPrescription ? (
                        <> Blank Prescription Form</>
                    ) : (
                        <>
                            {' '}Prescription ID: {String(prescription.id).padStart(6, '0')} |
                            {prescription.medicines && prescription.medicines.length > 0 && (
                                <> {prescription.medicines.length} Medicine(s)</>
                            )}
                            {prescription.glasses && prescription.glasses.length > 0 && (
                                <>
                                    {prescription.medicines && prescription.medicines.length > 0 && ' + '}
                                    {prescription.glasses.length} Glasses Prescription(s)
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Print Controls for Screen View */}
                <div className="no-print" style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    padding: '20px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            padding: '10px 20px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        🖨️ Print Again
                    </button>
                    <button
                        onClick={handleGoBack}
                        style={{
                            padding: '10px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </>
    );
}
