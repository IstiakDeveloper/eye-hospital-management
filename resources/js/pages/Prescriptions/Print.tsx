import { formatDhakaDate, formatDhakaDateTime } from '@/utils/dhaka-time';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

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
        // Auto print when page loads.
        // Important: wait for images/fonts to load; otherwise logo may not appear in print.
        let cancelled = false;

        const waitForImages = async () => {
            const images = Array.from(document.images ?? []);
            await Promise.all(
                images.map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise<void>((resolve) => {
                        const done = () => resolve();
                        img.addEventListener('load', done, { once: true });
                        img.addEventListener('error', done, { once: true });
                    });
                }),
            );
        };

        const run = async () => {
            try {
                await (document.fonts?.ready ?? Promise.resolve());
                await waitForImages();
            } finally {
                if (!cancelled) {
                    // Small delay helps browsers render header before print
                    setTimeout(() => window.print(), 150);
                }
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
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
        return formatDhakaDate(dateString, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '__:__ __';
        const dt = formatDhakaDateTime(dateString);
        return dt.includes(', ') ? dt.split(', ')[1] : dt;
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
                    font-family: 'Noto Sans Bengali', Arial, sans-serif;
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

                /* Blank prescription (compact colored header + left panel + blank writing area) */
                .blank-prescription-container {
                    max-width: 200mm;
                    margin: 0 auto;
                    padding: 0;
                }

                .blank-prescription-page {
                    width: 100%;
                    border: 1.5px solid #0b4aa2;
                    padding: 0;
                    background: #fff;
                }

                .blank-header {
                    background: linear-gradient(135deg, #e7f0ff 0%, #f4f8ff 50%, #ffffff 100%);
                    border-bottom: 2px solid #0b4aa2;
                    padding: 4mm 5mm 4mm 5mm;
                }

                .blank-header-inner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2.5mm;
                }

                .blank-logo {
                    width: 20mm;
                    height: 20mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #0b4aa2;
                    border-radius: 50%;
                    background: #fff;
                    overflow: hidden;
                }

                .blank-logo img {
                    width: 20mm;
                    height: 20mm;
                    object-fit: contain;
                    border-radius: 50%;
                }

                .blank-hospital-title {
                    text-align: center;
                }

                .blank-hospital-title .h1 {
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 0.8mm;
                    color: #0b4aa2;
                }

                .blank-hospital-title .h1 .sub {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0b4aa2;
                    margin-left: 2mm;
                }

                .blank-hospital-title .p {
                    font-size: 13.5px;
                    margin-bottom: 0.6mm;
                    color: #334155;
                }

                .blank-patient-grid {
                    margin-top: 3mm;
                    border: 1.5px solid #0b4aa2;
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 3mm;
                    display: grid;
                    grid-template-columns: 1.2fr 1fr 1fr 0.8fr;
                    gap: 2mm 3mm;
                    align-items: center;
                    font-size: 9.5px;
                }

                .blank-label {
                    font-weight: 800;
                    color: #0f172a;
                }

                .blank-value {
                    font-weight: 700;
                    color: #0f172a;
                }

                .blank-pill {
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    padding: 1mm 2mm;
                    border-radius: 999px;
                    font-size: 9px;
                    font-weight: 800;
                    color: #0f172a;
                }

                .blank-main {
                    display: flex;
                    gap: 4mm;
                    padding: 3.5mm 4mm 4mm 4mm;
                }

                .blank-left {
                    flex: 0 0 60mm;
                }

                .blank-right {
                    flex: 1;
                    background: #fff;
                }

                .blank-panel {
                    border: 2px solid #0b4aa2;
                    padding: 2mm;
                    margin-bottom: 3mm;
                    border-radius: 10px;
                }

                .blank-panel-title {
                    font-weight: 900;
                    font-size: 10px;
                    margin-bottom: 1.5mm;
                    text-align: center;
                    color: #0b4aa2;
                }

                .blank-rele-grid {
                    width: 100%;
                    border-collapse: collapse;
                }

                .blank-rele-grid td {
                    border: 1.5px solid #0b4aa2;
                    padding: 1mm 1.2mm;
                    font-size: 9px;
                    vertical-align: top;
                }

                .blank-empties {
                    min-height: 14mm;
                }

                .blank-writing-area {
                    /* keep within one A4 page */
                    min-height: 205mm;
                    border-left: 2px solid #0b4aa2;
                    padding-left: 4mm;
                    position: relative;
                }

                .normal-writing-area {
                    border-left: 2px solid #0b4aa2;
                    padding-left: 4mm;
                }

                .blank-rx-mark {
                    position: absolute;
                    left: 3mm;
                    top: 2mm;
                    font-family: "Times New Roman", Times, serif;
                    font-size: 40px;
                    font-weight: 700;
                    color: #0b4aa2;
                    opacity: 0.45;
                    line-height: 1;
                    transform: rotate(-2deg);
                }

                .blank-prescription-page {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Normal prescription should look plain (minimal borders) */
                .plain-prescription {
                    border: none !important;
                }

                .plain-prescription .blank-header {
                    border-bottom: 1px solid #cbd5e1;
                }

                .plain-prescription .blank-patient-grid {
                    border-color: #cbd5e1;
                }

                .plain-prescription .blank-panel {
                    border: none;
                    border-radius: 0;
                }

                .plain-prescription .blank-rele-grid td {
                    border: none;
                }

                .plain-prescription .normal-writing-area {
                    border-left: none;
                }

                .plain-prescription .diagnosis-section .section-box,
                .plain-prescription .notes-section .notes-box {
                    border: none;
                }

                .plain-prescription .medicine-table,
                .plain-prescription .medicine-table th,
                .plain-prescription .medicine-table td {
                    border: none;
                }

                .plain-prescription .medicine-table th {
                    background: transparent;
                }

                .plain-prescription .medicine-table tr:nth-child(even) {
                    background: transparent;
                }
            `}</style>

            <div className="print-container" style={{ display: isBlankPrescription ? 'none' : 'block' }}>
                {/* Normal prescription header: match Blank design */}
                <div className="blank-prescription-page plain-prescription">
                    <div className="blank-header">
                        <div className="blank-header-inner">
                            <div className="blank-logo">
                                <img src="/logo.png" alt="Hospital Logo" />
                            </div>
                            <div className="blank-hospital-title">
                                <div className="p">মৌসুমি (এনজিও) ও অংশীজনের যৌথ উদ্যোগে পরিচালিত</div>
                                <div className="h1">
                                    নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল <span className="sub">এন্ড ফ্যাকো সেন্টার</span>
                                </div>
                                <div className="p">মেইন রোড, মৎস্য অফিসের পাশে, নওগাঁ সদর, নওগাঁ।</div>
                                <div className="p">মোবাইলঃ ০১৩০৭-৮৮৫৫৬৬</div>
                            </div>
                        </div>

                        <div className="blank-patient-grid">
                            <div>
                                <span className="blank-label">রোগীর নাম:</span> <span className="blank-value">{prescription.patient.name}</span>
                            </div>
                            <div>
                                <span className="blank-label">আইডি:</span> <span className="blank-value">{prescription.patient.patient_id}</span>
                            </div>
                            <div>
                                <span className="blank-label">ফোন:</span> <span className="blank-value">{prescription.patient.phone || ''}</span>
                            </div>
                            <div>
                                <span className="blank-label">তারিখ:</span> <span className="blank-value">{formatDate(prescription.created_at)}</span>
                            </div>

                            <div style={{ gridColumn: '1 / span 2' }}>
                                <span className="blank-label">ঠিকানা:</span> <span className="blank-value">{prescription.patient.address || ''}</span>
                            </div>
                            <div>
                                <span className="blank-label">বয়স:</span>{' '}
                                <span className="blank-value">{prescription.patient.age ? `${prescription.patient.age} বছর` : ''}</span>
                            </div>
                            <div>
                                <span className="blank-label">লিঙ্গ:</span>{' '}
                                <span className="blank-pill">
                                    {prescription.patient.gender
                                        ? prescription.patient.gender.charAt(0).toUpperCase() + prescription.patient.gender.slice(1)
                                        : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body: left panel + right panel like Blank */}
                <div className="blank-main">
                    <div className="blank-left">
                        <div className="blank-panel">
                            <div className="blank-panel-title">Vision</div>
                            <table className="blank-rele-grid">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '12mm' }}>RE</td>
                                        <td className="blank-empties" />
                                    </tr>
                                    <tr>
                                        <td>LE</td>
                                        <td className="blank-empties" />
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="blank-panel">
                            <div className="blank-panel-title">IOP</div>
                            <table className="blank-rele-grid">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '12mm' }}>RE</td>
                                        <td className="blank-empties" />
                                    </tr>
                                    <tr>
                                        <td>LE</td>
                                        <td className="blank-empties" />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="blank-right">
                        <div className="normal-writing-area">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2mm' }}>
                                <div
                                    style={{
                                        fontFamily: 'Times New Roman, Times, serif',
                                        fontSize: '34px',
                                        fontWeight: 700,
                                        color: '#0b4aa2',
                                        opacity: 0.55,
                                    }}
                                >
                                    ℞
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#0b4aa2' }}>
                                    Rx #{String(prescription.id).padStart(6, '0')} • {formatTime(prescription.created_at)}
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div className="diagnosis-section">
                                <div className="section-label">Medical Diagnosis:</div>
                                <div className="section-box">{isBlankPrescription ? '' : prescription.diagnosis || ''}</div>
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
                                    {isBlankPrescription
                                        ? // Create 8 empty rows for blank prescription
                                          Array.from({ length: 8 }, (_, i) => (
                                              <tr key={i}>
                                                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                                  <td style={{ height: '8mm' }}></td>
                                                  <td style={{ height: '8mm' }}></td>
                                                  <td style={{ height: '8mm' }}></td>
                                                  <td style={{ height: '8mm' }}></td>
                                              </tr>
                                          ))
                                        : prescription.medicines && prescription.medicines.length > 0
                                          ? prescription.medicines.map((medicine, index) => (
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
                                                            <>
                                                                <br />
                                                                <small>({medicine.frequency})</small>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                          : // Show 3 empty rows if no medicines
                                            Array.from({ length: 3 }, (_, i) => (
                                                <tr key={i}>
                                                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                                    <td style={{ height: '8mm' }}></td>
                                                    <td style={{ height: '8mm' }}></td>
                                                    <td style={{ height: '8mm' }}></td>
                                                    <td style={{ height: '8mm' }}></td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>

                            {/* Glasses Prescription */}
                            {!isBlankPrescription &&
                                prescription.glasses &&
                                prescription.glasses.length > 0 &&
                                prescription.glasses.map((glass, index) => (
                                    <div key={glass.id} className="glasses-section">
                                        <div className="glasses-header">
                                            Optical Prescription - {glass.eye ? glass.eye.replace('_', ' ').toUpperCase() : 'Glasses'}
                                        </div>
                                        <div className="glasses-content">
                                            <div className="optical-notice">This prescription can be used at any optical shop</div>

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
                                ))}

                            {/* Advice */}
                            <div className="advice-section">
                                <div className="advice-title">Medical Advice & Recommendations:</div>
                                <div style={{ minHeight: '15mm' }}>{isBlankPrescription ? '' : prescription.advice || ''}</div>
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
                                <div className="notes-box">{isBlankPrescription ? '' : prescription.notes || ''}</div>
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
                                            {!isBlankPrescription && (
                                                <div className="doctor-info">
                                                    <div className="doctor-name">Dr. {prescription.doctor.name}</div>
                                                    <div className="doctor-details">
                                                        {prescription.doctor.specialization && (
                                                            <>
                                                                {prescription.doctor.specialization}
                                                                <br />
                                                            </>
                                                        )}
                                                        {prescription.doctor.bmdc_number && (
                                                            <>
                                                                BMDC Reg: {prescription.doctor.bmdc_number}
                                                                <br />
                                                            </>
                                                        )}
                                                        License to Practice Medicine
                                                    </div>
                                                </div>
                                            )}
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
                                Generated: {formatDhakaDate(new Date())} {formatTime(new Date().toISOString())} |
                                {isBlankPrescription ? (
                                    <> Blank Prescription Form</>
                                ) : (
                                    <>
                                        {' '}
                                        Prescription ID: {String(prescription.id).padStart(6, '0')} |
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
                        </div>
                    </div>
                </div>

                {/* Print Controls for Screen View */}
                <div
                    className="no-print"
                    style={{
                        textAlign: 'center',
                        marginTop: '20px',
                        padding: '20px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                    }}
                >
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
                            marginRight: '10px',
                        }}
                    >
                        🖨️ Print Again
                    </button>
                    {/* For blank prescription we hide "Go Back" to prevent accidental navigation. */}
                    {!isBlankPrescription && (
                        <button
                            onClick={handleGoBack}
                            style={{
                                padding: '10px 20px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            ← Go Back
                        </button>
                    )}
                </div>
            </div>

            {/* Blank prescription */}
            {isBlankPrescription && (
                <div className="blank-prescription-container">
                    <div className="blank-prescription-page">
                        <div className="blank-header">
                            <div className="blank-header-inner">
                                <div className="blank-logo">
                                    <img src="/logo.png" alt="Hospital Logo" />
                                </div>
                                <div className="blank-hospital-title">
                                    <div className="p">মৌসুমি (এনজিও) ও অংশীজনের যৌথ উদ্যোগে পরিচালিত</div>
                                    <div className="h1">
                                        নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল <span className="sub">এন্ড ফ্যাকো সেন্টার</span>
                                    </div>
                                    <div className="p">মেইন রোড, মৎস্য অফিসের পাশে, নওগাঁ সদর, নওগাঁ।</div>
                                    <div className="p">মোবাইলঃ ০১৩০৭-৮৮৫৫৬৬</div>
                                </div>
                            </div>

                            <div className="blank-patient-grid">
                                <div>
                                    <span className="blank-label">রোগীর নাম:</span> <span className="blank-value">{prescription.patient.name}</span>
                                </div>
                                <div>
                                    <span className="blank-label">আইডি:</span> <span className="blank-value">{prescription.patient.patient_id}</span>
                                </div>
                                <div>
                                    <span className="blank-label">ফোন:</span> <span className="blank-value">{prescription.patient.phone || ''}</span>
                                </div>
                                <div>
                                    <span className="blank-label">তারিখ:</span> <span className="blank-value">{formatDhakaDate(new Date())}</span>
                                </div>

                                <div style={{ gridColumn: '1 / span 2' }}>
                                    <span className="blank-label">ঠিকানা:</span>{' '}
                                    <span className="blank-value">{prescription.patient.address || ''}</span>
                                </div>
                                <div>
                                    <span className="blank-label">বয়স:</span>{' '}
                                    <span className="blank-value">{prescription.patient.age ? `${prescription.patient.age} বছর` : ''}</span>
                                </div>
                                <div>
                                    <span className="blank-label">লিঙ্গ:</span>{' '}
                                    <span className="blank-pill">
                                        {prescription.patient.gender === 'male'
                                            ? 'পুরুষ'
                                            : prescription.patient.gender === 'female'
                                              ? 'মহিলা'
                                              : prescription.patient.gender || ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="blank-main">
                            <div className="blank-left">
                                <div className="blank-panel">
                                    <div className="blank-panel-title">Vision</div>
                                    <table className="blank-rele-grid">
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '12mm' }}>RE</td>
                                                <td className="blank-empties" />
                                            </tr>
                                            <tr>
                                                <td>LE</td>
                                                <td className="blank-empties" />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="blank-panel">
                                    <div className="blank-panel-title">IOP</div>
                                    <table className="blank-rele-grid">
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '12mm' }}>RE</td>
                                                <td className="blank-empties" />
                                            </tr>
                                            <tr>
                                                <td>LE</td>
                                                <td className="blank-empties" />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="blank-right">
                                {/* Entire area blank for handwriting */}
                                <div className="blank-writing-area">
                                    <div className="blank-rx-mark">℞</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="no-print"
                        style={{
                            textAlign: 'center',
                            marginTop: '12px',
                            padding: '12px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                        }}
                    >
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
                            }}
                        >
                            🖨️ Print Again
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
