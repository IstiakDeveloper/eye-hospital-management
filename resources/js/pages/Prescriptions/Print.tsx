import { formatDhakaDate, formatDhakaDateTime, getAgeFromDateOfBirth } from '@/utils/dhaka-time';
import { Head } from '@inertiajs/react';
import { useEffect, type CSSProperties } from 'react';

// Types based on your controller data structure
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    /** YYYY-MM-DD from server; preferred source for displayed age */
    date_of_birth?: string | null;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
}

/** Age in years from DOB (Dhaka calendar), else fallback `age` from API. */
function patientYearsAt(
    patient: Patient,
    asOfIso: string | number | Date | null | undefined,
): number | null {
    if (patient.date_of_birth) {
        const y = getAgeFromDateOfBirth(patient.date_of_birth, asOfIso);
        if (y != null) {
            return y;
        }
    }
    return patient.age ?? null;
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
    prescription_type?: string;
    right_eye_sphere?: number | null;
    right_eye_cylinder?: number | null;
    right_eye_axis?: number | null;
    right_eye_add?: number | null;
    left_eye_sphere?: number | null;
    left_eye_cylinder?: number | null;
    left_eye_axis?: number | null;
    left_eye_add?: number | null;
    pupillary_distance?: number | null;
    segment_height?: number | null;
    optical_center_height?: number | null;
    special_instructions?: string | null;
}

interface VisionTestForPad {
    test_date?: string | null;
    complains?: string | null;
    right_eye_vision_without_glass?: string | null;
    left_eye_vision_without_glass?: string | null;
    right_eye_vision_with_glass?: string | null;
    left_eye_vision_with_glass?: string | null;
    right_eye_iop?: string | null;
    left_eye_iop?: string | null;
    blood_pressure?: string | null;
    blood_sugar?: string | null;
    urine_sugar?: string | null;
    right_eye_fundus?: string | null;
    left_eye_fundus?: string | null;
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
    vision_test?: VisionTestForPad | null;
    medicines: Medicine[];
    glasses: Glass[];
}

function visionTestHasData(v: VisionTestForPad | null | undefined): boolean {
    if (!v) return false;
    return Object.values(v).some((x) => x != null && String(x).trim() !== '');
}

function PadVisionColumn({ data, formatTestDate }: { data: VisionTestForPad | null | undefined; formatTestDate: (d: string) => string }) {
    const v = data;
    const dash = (s?: string | null) => (s != null && String(s).trim() !== '' ? String(s).trim() : '—');

    return (
        <div className="pad-vision-block">
            <div className="pad-vision-heading">Vision test</div>
            {!visionTestHasData(v) ? (
                <div className="pad-vision-empty">—</div>
            ) : (
                <div className="pad-vision-body">
                    {v?.test_date ? <div className="pad-vision-meta">{formatTestDate(v.test_date)}</div> : null}

                    {(v?.right_eye_vision_without_glass != null && v.right_eye_vision_without_glass !== '') ||
                    (v?.left_eye_vision_without_glass != null && v.left_eye_vision_without_glass !== '') ? (
                        <div className="pad-vision-metric">
                            <span className="pad-v-k">V/A u/a</span>
                            <span className="pad-v-re">RE {dash(v?.right_eye_vision_without_glass)}</span>
                            <span className="pad-v-le">LE {dash(v?.left_eye_vision_without_glass)}</span>
                        </div>
                    ) : null}

                    {(v?.right_eye_vision_with_glass != null && v.right_eye_vision_with_glass !== '') ||
                    (v?.left_eye_vision_with_glass != null && v.left_eye_vision_with_glass !== '') ? (
                        <div className="pad-vision-metric">
                            <span className="pad-v-k">V/A aid</span>
                            <span className="pad-v-re">RE {dash(v?.right_eye_vision_with_glass)}</span>
                            <span className="pad-v-le">LE {dash(v?.left_eye_vision_with_glass)}</span>
                        </div>
                    ) : null}

                    {(v?.right_eye_iop != null && v.right_eye_iop !== '') || (v?.left_eye_iop != null && v.left_eye_iop !== '') ? (
                        <div className="pad-vision-metric">
                            <span className="pad-v-k">IOP</span>
                            <span className="pad-v-re">RE {dash(v?.right_eye_iop)}</span>
                            <span className="pad-v-le">LE {dash(v?.left_eye_iop)}</span>
                        </div>
                    ) : null}

                    {v?.blood_pressure != null && v.blood_pressure !== '' ? (
                        <div className="pad-vision-single">
                            <span className="pad-v-k">BP</span> {v.blood_pressure}
                        </div>
                    ) : null}
                    {v?.blood_sugar != null && v.blood_sugar !== '' ? (
                        <div className="pad-vision-single">
                            <span className="pad-v-k">BS</span> {v.blood_sugar}
                        </div>
                    ) : null}
                    {v?.urine_sugar != null && v.urine_sugar !== '' ? (
                        <div className="pad-vision-single">
                            <span className="pad-v-k">Urine</span> {v.urine_sugar}
                        </div>
                    ) : null}

                    {(v?.right_eye_fundus != null && v.right_eye_fundus !== '') || (v?.left_eye_fundus != null && v.left_eye_fundus !== '') ? (
                        <div className="pad-vision-fundus">
                            <div className="pad-v-k">Fundus</div>
                            <div className="pad-vision-fundus-line">RE {dash(v?.right_eye_fundus)}</div>
                            <div className="pad-vision-fundus-line">LE {dash(v?.left_eye_fundus)}</div>
                        </div>
                    ) : null}

                    {v?.complains != null && v.complains.trim() !== '' ? (
                        <div className="pad-vision-complains">
                            <div className="pad-v-k">CC</div>
                            <div>{v.complains}</div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function PadDiagnosis({ value }: { value: string }) {
    return (
        <div className="pad-diagnosis">
            <div className="pad-diagnosis-title">Medical Diagnosis</div>
            <div className="pad-diagnosis-body">{value && value.trim() !== '' ? value : '—'}</div>
        </div>
    );
}

interface PrintMetadata {
    print_date: string;
    printed_by: string;
    has_glasses: boolean;
    glasses_count: number;
    filename: string;
    is_blank_prescription?: boolean;
    /** When true, skip letterhead/footer; reserve top ~2in + bottom ~1.5in for pre-printed pad (A4 ~11.2"). */
    preprinted_pad?: boolean;
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
    const isPreprintedPad = Boolean(print_metadata?.preprinted_pad) && !isBlankPrescription;

    const padGenderShort = (g?: string) => {
        const x = g?.toLowerCase();
        if (x === 'male') return 'M';
        if (x === 'female') return 'F';
        return g ? g.charAt(0).toUpperCase() : '';
    };

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

    const formatGenderDisplay = (g?: string) => {
        if (!g) return '';
        const lower = g.toLowerCase();
        if (lower === 'male') return 'Male';
        if (lower === 'female') return 'Female';
        if (lower === 'other') return 'Other';
        return g.charAt(0).toUpperCase() + g.slice(1);
    };

    const patientAgeYears = patientYearsAt(prescription.patient, prescription.created_at);

    const blankVisionRows = ['V/A (Unaided)', 'V/A ē P.H', 'V/A (Aided)', 'IOP', 'SPT'];
    const blankAnteriorRows = ['Lid', 'Conjunctiva', 'Cornea', 'A.Chamber', 'Iris', 'Pupil', 'lens', 'Ocular movements'];

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

                /* Pre-printed A4 pad (~11.2in tall): no letterhead/footer on paper — only body content
                   টিউন: --pad-top-reserve = প্যাডের প্রিন্টেড হেডারের উচ্চতা (কমালে/বাড়ালে প্রিন্ট মিলবে)
                   --pad-bottom-reserve = নিচের ফুটার জোন */
                .print-container.pad-preprinted {
                    /* Slightly larger header reserve for the pre-printed pad */
                    --pad-top-reserve: 1.9in;
                    /* Micro-tune top padding without changing inches */
                    --pad-top-tweak: 15px;
                    --pad-bottom-reserve: 1.5in;
                    --pad-side-inset: 0.35in;
                    /* Space after the pre-printed "Patient name" label on the pad */
                    --pad-patient-name-offset: 34mm;
                    /* Space after the pre-printed "Age" + "ID" labels on the pad */
                    --pad-patient-age-offset: 4mm;
                    --pad-patient-id-offset: 1mm;
                    /* Push header strip a bit further right (date/age) */
                    --pad-strip-right-extra: 8mm;
                    max-width: none;
                    width: 100%;
                    box-sizing: border-box;
                    min-height: 11.2in;
                    padding: calc(var(--pad-top-reserve) + var(--pad-top-tweak)) var(--pad-side-inset) var(--pad-bottom-reserve)
                        var(--pad-side-inset);
                    background: transparent;
                }

                .pad-patient-strip {
                    display: grid;
                    grid-template-columns: minmax(0, 3.15fr) minmax(0, 0.55fr) minmax(0, 0.9fr) auto;
                    gap: 0 2mm;
                    align-items: baseline;
                    font-size: 10.5pt;
                    font-weight: 600;
                    color: #000;
                    margin: 0 0 3mm 0;
                    width: calc(100% + var(--pad-strip-right-extra));
                }

                .pad-patient-strip .pad-patient-cell {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .pad-patient-strip .pad-patient-cell.pad-patient-name {
                    padding-left: var(--pad-patient-name-offset);
                }

                .pad-patient-strip .pad-patient-cell.pad-patient-age {
                    padding-left: var(--pad-patient-age-offset);
                }

                .pad-patient-strip .pad-patient-cell.pad-patient-id {
                    padding-left: var(--pad-patient-id-offset);
                }

                /* Date should stick to the far right edge */
                .pad-patient-strip .pad-patient-cell.pad-patient-date {
                    justify-self: end;
                    text-align: right;
                    font-size: 8pt;
                    font-weight: 600;
                }

                .pad-rx-meta {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 4mm;
                    font-size: 8.5pt;
                    color: #333;
                    margin: 0 0 2mm 0;
                }

                .pad-preprinted-main.blank-main {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    gap: 2.5mm;
                    padding: 0;
                    margin: 0;
                }

                .pad-col-vision {
                    flex: 0 0 2in;
                    width: 2in;
                    max-width: 2in;
                    box-sizing: border-box;
                    font-size: 7.5pt;
                    line-height: 1.3;
                    color: #000;
                    padding: 0 1.5mm 0 0;
                }

                .pad-vision-block {
                    width: 100%;
                }

                .pad-diagnosis {
                    margin-top: 3mm;
                    font-size: 7.5pt;
                    line-height: 1.35;
                    color: #000;
                }

                .pad-diagnosis-title {
                    font-weight: 700;
                    border-top: 1px solid #bbb;
                    padding-top: 1.5mm;
                    margin-bottom: 1mm;
                }

                .pad-diagnosis-body {
                    white-space: pre-wrap;
                    word-break: break-word;
                    min-height: 12mm;
                }

                .pad-vision-heading {
                    font-weight: 700;
                    font-size: 8pt;
                    margin-bottom: 1.5mm;
                    padding-bottom: 0.5mm;
                    border-bottom: 1px solid #bbb;
                }

                .pad-vision-meta {
                    font-size: 6.5pt;
                    color: #444;
                    margin-bottom: 1.5mm;
                }

                .pad-vision-empty {
                    color: #888;
                    font-size: 8pt;
                }

                .pad-vision-metric {
                    display: grid;
                    grid-template-columns: 0.95fr 1fr 1fr;
                    gap: 0.5mm 1.5mm;
                    font-size: 7pt;
                    margin-bottom: 1.2mm;
                    align-items: baseline;
                }

                .pad-v-k {
                    font-weight: 700;
                }

                .pad-v-re,
                .pad-v-le {
                    min-width: 0;
                    word-break: break-word;
                }

                .pad-vision-single {
                    font-size: 7pt;
                    margin-bottom: 1mm;
                }

                .pad-vision-fundus {
                    margin-top: 1mm;
                    margin-bottom: 1mm;
                    font-size: 6.5pt;
                }

                .pad-vision-fundus-line {
                    margin-top: 0.3mm;
                    word-break: break-word;
                }

                .pad-vision-complains {
                    margin-top: 1.5mm;
                    font-size: 6.5pt;
                    word-break: break-word;
                }

                .pad-preprinted-main .blank-right.pad-col-rx {
                    flex: 1 1 auto;
                    min-width: 0;
                    width: auto;
                    max-width: none;
                }

                .pad-col-rx .normal-writing-area {
                    padding-left: 0 !important;
                    border-left: none !important;
                }

                .pad-medicines-section {
                    margin: 2mm 0 4mm 0;
                }

                .pad-medicine-list {
                    margin: 1mm 0 0 0;
                    padding-left: 4mm;
                    list-style: decimal;
                }

                .pad-medicine-item {
                    margin-bottom: 3mm;
                    padding-left: 1mm;
                }

                .pad-med-name {
                    font-weight: 700;
                    font-size: 10pt;
                    line-height: 1.25;
                }

                .pad-med-detail {
                    font-size: 9pt;
                    margin-top: 0.5mm;
                    color: #111;
                    line-height: 1.3;
                }

                .pad-med-inst {
                    font-size: 8.5pt;
                    margin-top: 0.6mm;
                    color: #333;
                    line-height: 1.35;
                }

                .pad-med-empty {
                    font-size: 9pt;
                    color: #666;
                    margin-top: 1mm;
                }

                .pad-preprinted .advice-section,
                .pad-preprinted .glasses-section {
                    border: none !important;
                    background: transparent !important;
                }

                .pad-preprinted .advice-title {
                    color: #000;
                }

                .pad-preprinted .glasses-header,
                .pad-preprinted .optical-notice,
                .pad-preprinted .measurements-box {
                    border: none !important;
                    background: transparent !important;
                }

                .pad-preprinted .prescription-footer {
                    display: none !important;
                }

                .pad-preprinted .medicine-table,
                .pad-preprinted .medicine-table th,
                .pad-preprinted .medicine-table td {
                    border: none !important;
                }

                .pad-preprinted .medicine-table th {
                    background: transparent !important;
                }

                .pad-preprinted .medicine-table tr:nth-child(even) {
                    background: transparent !important;
                }

                .pad-preprinted .signature-table td {
                    border-top: 1px solid #000 !important;
                }

                .pad-preprinted .signature-left {
                    border-right: none !important;
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

                /* No border (screen + print) — avoid reusing .section-box so global CSS cannot win */
                .diagnosis-section-body {
                    min-height: 8mm;
                    padding: 1mm 0;
                    width: 100%;
                    border: 0 !important;
                    border-style: none !important;
                    outline: none !important;
                    box-shadow: none !important;
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

                    .print-container.pad-preprinted {
                        padding: calc(var(--pad-top-reserve) + var(--pad-top-tweak)) var(--pad-side-inset) var(--pad-bottom-reserve)
                            var(--pad-side-inset) !important;
                        min-height: 0 !important;
                        background: transparent !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .diagnosis-section-body {
                        border: 0 !important;
                        border-style: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                    }

                    @page {
                        margin: 0;
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
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 0;
                    box-sizing: border-box;
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

                /* ─── Official blank template (matches hospital print form) ─── */
                /* Uniform gutters; A4 content column ≈ 210mm − page padding */
                .tpl-blank-page {
                    --tpl-pad-x: 4mm;
                    --tpl-pad-y: 3mm;
                    --tpl-inner-pad: 2.5mm;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-height: 287mm;
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: var(--tpl-pad-y) var(--tpl-pad-x);
                    background: #fff;
                    color: #000;
                    font-size: 8.5px;
                    line-height: 1.25;
                    box-sizing: border-box;
                    border: 1px solid #000;
                }

                .tpl-page-watermark {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    z-index: 0;
                }

                .tpl-page-watermark img {
                    width: min(100mm, 48vw);
                    max-width: 100%;
                    height: auto;
                    object-fit: contain;
                    opacity: 0.18;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .tpl-blank-layer {
                    position: relative;
                    z-index: 1;
                }

                .tpl-blank-main {
                    flex: 1 1 auto;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }

                .tpl-header {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 1mm 0 3mm 0;
                    margin: 0;
                    border-bottom: 2px solid #000;
                    flex-shrink: 0;
                    background: #fff;
                }

                .tpl-header-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 3mm;
                }

                .tpl-logo {
                    width: 20mm;
                    height: 20mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .tpl-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .tpl-header-text {
                    text-align: center;
                }

                .tpl-hospital-name {
                    font-size: 15px;
                    font-weight: 700;
                    margin-bottom: 1mm;
                }

                .tpl-header-line {
                    font-size: 9.5px;
                    margin-bottom: 0.5mm;
                }

                .tpl-doc-title {
                    font-size: 13px;
                    font-weight: 700;
                    margin-top: 2mm;
                    letter-spacing: 0.5px;
                }

                .tpl-patient-wrap {
                    padding: var(--tpl-inner-pad) 0;
                    margin: 0;
                    border-bottom: 1px solid #000;
                    flex-shrink: 0;
                    background: #fff;
                }

                .tpl-p-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: baseline;
                    gap: 1mm 3mm;
                    margin-bottom: 1.5mm;
                }

                .tpl-p-row:last-child {
                    margin-bottom: 0;
                }

                .tpl-field {
                    display: inline-flex;
                    align-items: baseline;
                    gap: 1mm;
                    flex: 1 1 auto;
                }

                .tpl-field-grow {
                    flex: 2 1 45%;
                }

                .tpl-field-sm {
                    flex: 0 1 auto;
                    min-width: 18mm;
                }

                .tpl-label {
                    font-weight: 700;
                    white-space: nowrap;
                }

                .tpl-line {
                    flex: 1;
                    min-width: 12mm;
                    border-bottom: 1px solid #000;
                    min-height: 3.2mm;
                }

                .tpl-push {
                    margin-left: auto;
                }

                .tpl-cc-box {
                    box-sizing: border-box;
                    width: 100%;
                    border: 1px solid #000;
                    border-top: none;
                    padding: 1.5mm var(--tpl-inner-pad);
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 0.8mm;
                    margin: 0;
                    flex-shrink: 0;
                    background: #fff;
                }

                .tpl-cc-box .tpl-label {
                    flex-shrink: 0;
                }

                /* One handwritten line below “CC :” */
                .tpl-cc-body {
                    flex: 0 0 auto;
                    min-height: 4.5mm;
                    min-width: 0;
                }

                .tpl-split {
                    box-sizing: border-box;
                    width: 100%;
                    flex: 1 1 auto;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    grid-template-rows: minmax(0, 1fr);
                    margin: 0;
                    padding: 0;
                    border: 1px solid #000;
                    border-top: none;
                    min-height: 0;
                    align-self: stretch;
                }

                .tpl-col-left {
                    box-sizing: border-box;
                    border-right: 3px solid #000;
                    padding: var(--tpl-inner-pad);
                    display: flex;
                    flex-direction: column;
                    gap: 2mm;
                    min-height: 0;
                    align-self: stretch;
                    height: 100%;
                    background: transparent;
                }

                .tpl-left-tables-grow {
                    flex: 1 1 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2mm;
                    min-height: 0;
                }

                .tpl-table-grow-wrap {
                    flex: 1 1 0;
                    min-height: 22mm;
                    display: flex;
                    flex-direction: column;
                }

                /* Vision + vitals: compact rows for numbers only */
                .tpl-table-grow-wrap--compact {
                    flex: 0 0 auto;
                    min-height: 0;
                }

                .tpl-table-grow-wrap--vitals {
                    flex: 0 0 auto;
                }

                .tpl-table-grow-wrap--anterior {
                    flex: 1 1 0;
                    min-height: 72mm;
                }

                .tpl-clinical-table.tpl-clinical-table--compact {
                    flex: 0 0 auto;
                    height: auto;
                    font-size: 10px;
                }

                .tpl-clinical-table.tpl-clinical-table--compact th,
                .tpl-clinical-table.tpl-clinical-table--compact td {
                    padding: calc(0.65mm + 3px) calc(0.85mm + 2px);
                    line-height: 1.3;
                    vertical-align: middle;
                }

                .tpl-clinical-table.tpl-clinical-table--compact .tpl-c-label {
                    width: 36%;
                }

                .tpl-vitals.tpl-vitals--compact {
                    font-size: 10px;
                }

                .tpl-vitals.tpl-vitals--compact td {
                    padding: 0.55mm 0.75mm;
                    line-height: 1.25;
                    vertical-align: middle;
                }

                /* BP / RBS: writable line height */
                .tpl-vitals.tpl-vitals--compact .tpl-line {
                    min-height: 5mm !important;
                    min-width: 45% !important;
                    vertical-align: middle;
                }

                .tpl-clinical-table.tpl-stretch {
                    flex: 1;
                    height: 100%;
                    width: 100%;
                    table-layout: fixed;
                }

                .tpl-clinical-table.tpl-stretch tbody {
                    height: 100%;
                }

                .tpl-clinical-table.tpl-stretch tbody tr {
                    height: calc(100% / var(--tpl-rows, 1));
                }

                .tpl-clinical-table.tpl-stretch td {
                    vertical-align: top;
                    padding: 2mm 1mm;
                    min-height: 7mm;
                }

                /* Anterior / comment section: taller cells; text vertically centered */
                .tpl-clinical-table.tpl-stretch.tpl-stretch--comment td {
                    padding: 1.4mm 1mm;
                    min-height: 11mm;
                    vertical-align: middle;
                    text-align: center;
                }

                .tpl-clinical-table.tpl-stretch.tpl-stretch--comment .tpl-c-label {
                    text-align: left;
                    vertical-align: middle;
                }

                .tpl-col-right {
                    box-sizing: border-box;
                    position: relative;
                    padding: var(--tpl-inner-pad);
                    min-height: 0;
                    align-self: stretch;
                    height: 100%;
                    background: transparent;
                }

                .tpl-rx-symbol {
                    position: relative;
                    z-index: 1;
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 38px;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 2mm;
                    color: #000;
                }

                .tpl-clinical-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8px;
                }

                .tpl-clinical-table th,
                .tpl-clinical-table td {
                    border: 1px solid #000;
                    padding: 0.8mm 1mm;
                    vertical-align: middle;
                }

                .tpl-clinical-table th {
                    font-weight: 700;
                    text-align: center;
                }

                .tpl-clinical-table .tpl-c-label {
                    font-weight: 700;
                    width: 32%;
                }

                .tpl-vitals {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8px;
                }

                .tpl-vitals td {
                    border: 1px solid #000;
                    padding: 1mm;
                }

                .tpl-vitals .tpl-v-lab {
                    font-weight: 700;
                    width: 18mm;
                }

                .tpl-fundus {
                    border: 1px solid #000;
                    padding: 1mm 2mm;
                    min-height: 38mm;
                    flex-shrink: 0;
                }

                .tpl-diagnosis {
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    padding: 1mm 2mm 1mm 0;
                    min-height: 18mm;
                    flex-shrink: 0;
                }

                .tpl-fundus-label,
                .tpl-diagnosis-label {
                    font-weight: 700;
                    margin-bottom: 1mm;
                }

                .tpl-footer {
                    flex-shrink: 0;
                    background: #fff;
                }

                .tpl-footer-gold {
                    height: 3.5mm;
                    background: #e8b923;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .tpl-footer-bn {
                    background: #000;
                    color: #fff;
                    text-align: center;
                    padding: 2mm 3mm;
                    font-size: 9.5px;
                    font-weight: 600;
                    line-height: 1.35;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                @media print {
                    .tpl-blank-page {
                        font-size: 8px;
                        min-height: 287mm;
                        max-width: none;
                        width: 100%;
                    }

                    .tpl-page-watermark img {
                        width: 100mm;
                        max-width: 55%;
                        opacity: 0.2;
                    }

                    .tpl-diagnosis {
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                    }

                    .blank-prescription-container {
                        max-width: none;
                        width: 100%;
                        margin: 0;
                    }
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

            <div
                className={`print-container${isPreprintedPad ? ' pad-preprinted' : ''}`}
                style={{ display: isBlankPrescription ? 'none' : 'block' }}
            >
                {isPreprintedPad ? (
                    <div className="pad-patient-strip">
                        <div className="pad-patient-cell pad-patient-name">{prescription.patient.name}</div>
                        <div className="pad-patient-cell pad-patient-id">{prescription.patient.patient_id}</div>
                        <div className="pad-patient-cell pad-patient-age">{patientAgeYears != null ? String(patientAgeYears) : ''}</div>
                        <div className="pad-patient-cell pad-patient-date">{formatDate(prescription.created_at)}</div>
                    </div>
                ) : (
                    <>
                        {/* Normal prescription header: match Blank design */}
                        <div className="blank-prescription-page plain-prescription">
                            <div className="blank-header">
                                <div className="blank-header-inner">
                                    <div className="blank-logo">
                                        <img src="/logo.png" alt="Hospital Logo" />
                                    </div>
                                    <div className="blank-hospital-title">
                                        <div className="p">মৌসুমি (এনজিও) ও অংশীজনের যৌথ উদ্যোগে পরিচালিত</div>
                                        <div className="h1">মৌসুমী চক্ষু হাসপাতাল</div>
                                        <div className="p">মেইন রোড, মৎস্য অফিসের পাশে, নওগাঁ সদর, নওগাঁ।</div>
                                        <div className="p">মোবাইলঃ ০১৩০৭-৮৮৫৫৬৬</div>
                                    </div>
                                </div>

                                <div className="blank-patient-grid">
                                    <div>
                                        <span className="blank-label">রোগীর নাম:</span>{' '}
                                        <span className="blank-value">{prescription.patient.name}</span>
                                    </div>
                                    <div>
                                        <span className="blank-label">আইডি:</span> <span className="blank-value">{prescription.patient.patient_id}</span>
                                    </div>
                                    <div>
                                        <span className="blank-label">ফোন:</span> <span className="blank-value">{prescription.patient.phone || ''}</span>
                                    </div>
                                    <div>
                                        <span className="blank-label">তারিখ:</span>{' '}
                                        <span className="blank-value">{formatDate(prescription.created_at)}</span>
                                    </div>

                                    <div style={{ gridColumn: '1 / span 2' }}>
                                        <span className="blank-label">ঠিকানা:</span>{' '}
                                        <span className="blank-value">{prescription.patient.address || ''}</span>
                                    </div>
                                    <div>
                                        <span className="blank-label">বয়স:</span>{' '}
                                        <span className="blank-value">
                                            {patientAgeYears != null ? `${patientAgeYears} বছর` : ''}
                                        </span>
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
                    </>
                )}

                {isPreprintedPad && (
                    <div className="pad-rx-meta" style={{ marginBottom: '4mm' }}>
                        <span>Rx #{String(prescription.id).padStart(6, '0')}</span>
                        <span>{formatTime(prescription.created_at)}</span>
                    </div>
                )}

                {/* Body: left panel + right panel like Blank (pad: Rx column only) */}
                <div className={`blank-main${isPreprintedPad ? ' pad-preprinted-main' : ''}`}>
                    {!isPreprintedPad && (
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
                    )}

                    {isPreprintedPad && (
                        <div className="pad-col-vision">
                            <PadVisionColumn data={prescription.vision_test} formatTestDate={formatDate} />
                            <PadDiagnosis value={prescription.diagnosis || ''} />
                        </div>
                    )}

                    <div className={`blank-right${isPreprintedPad ? ' pad-col-rx' : ''}`}>
                        <div className="normal-writing-area">
                            {isPreprintedPad ? null : (
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
                            )}

                            {/* Diagnosis (pad: shown in left column under vision) */}
                            {!isPreprintedPad && (
                                <div className="diagnosis-section">
                                    <div className="section-label">Medical Diagnosis:</div>
                                    <div className="diagnosis-section-body">{isBlankPrescription ? '' : prescription.diagnosis || ''}</div>
                                </div>
                            )}

                            {/* Medicines — pad: clean list under Rx; screen/blank: table */}
                            {isPreprintedPad && !isBlankPrescription ? (
                                <div className="pad-medicines-section">
                                    <div className="section-label">Medicines</div>
                                    {prescription.medicines && prescription.medicines.length > 0 ? (
                                        <ol className="pad-medicine-list">
                                            {prescription.medicines.map((medicine) => {
                                                const detail = [medicine.dosage, medicine.frequency, medicine.duration]
                                                    .filter((x) => x != null && String(x).trim() !== '')
                                                    .join(' · ');
                                                return (
                                                    <li key={medicine.id} className="pad-medicine-item">
                                                        <div className="pad-med-name">{medicine.medicine_name}</div>
                                                        {detail ? <div className="pad-med-detail">{detail}</div> : null}
                                                        {medicine.instructions != null && String(medicine.instructions).trim() !== '' ? (
                                                            <div className="pad-med-inst">{medicine.instructions}</div>
                                                        ) : null}
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    ) : (
                                        <div className="pad-med-empty">—</div>
                                    )}
                                </div>
                            ) : (
                                <>
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
                                                ? Array.from({ length: 8 }, (_, i) => (
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
                                                  : Array.from({ length: 3 }, (_, i) => (
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
                                </>
                            )}

                            {/* Glasses Prescription */}
                            {!isBlankPrescription &&
                                prescription.glasses &&
                                prescription.glasses.length > 0 &&
                                prescription.glasses.map((glass) => (
                                    <div key={glass.id} className="glasses-section">
                                        <div className="glasses-header">
                                            Optical Prescription{glass.prescription_type ? ` - ${String(glass.prescription_type).toUpperCase()}` : ''}
                                        </div>
                                        <div className="glasses-content">
                                            <div className="optical-notice">This prescription can be used at any optical shop</div>

                                            <table className="glasses-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '22%' }}>Eye</th>
                                                        <th style={{ width: '19%' }}>SPH</th>
                                                        <th style={{ width: '19%' }}>CYL</th>
                                                        <th style={{ width: '18%' }}>AXIS</th>
                                                        <th style={{ width: '22%' }}>ADD</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="eye-cell">RE (OD)</td>
                                                        <td>{formatSphereValue(glass.right_eye_sphere ?? undefined)}</td>
                                                        <td>{formatSphereValue(glass.right_eye_cylinder ?? undefined)}</td>
                                                        <td>{formatAxisValue(glass.right_eye_axis ?? undefined)}</td>
                                                        <td>{glass.right_eye_add != null ? formatSphereValue(glass.right_eye_add) : '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="eye-cell">LE (OS)</td>
                                                        <td>{formatSphereValue(glass.left_eye_sphere ?? undefined)}</td>
                                                        <td>{formatSphereValue(glass.left_eye_cylinder ?? undefined)}</td>
                                                        <td>{formatAxisValue(glass.left_eye_axis ?? undefined)}</td>
                                                        <td>{glass.left_eye_add != null ? formatSphereValue(glass.left_eye_add) : '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {(glass.pupillary_distance != null ||
                                                glass.segment_height != null ||
                                                glass.optical_center_height != null ||
                                                (glass.special_instructions != null && String(glass.special_instructions).trim() !== '')) && (
                                                <div className="measurements-box">
                                                    {glass.pupillary_distance != null ? (
                                                        <>
                                                            <strong>PD:</strong> {glass.pupillary_distance}mm{' '}
                                                        </>
                                                    ) : null}
                                                    {glass.segment_height != null ? (
                                                        <>
                                                            <strong>SH:</strong> {glass.segment_height}mm{' '}
                                                        </>
                                                    ) : null}
                                                    {glass.optical_center_height != null ? (
                                                        <>
                                                            <strong>OC:</strong> {glass.optical_center_height}mm{' '}
                                                        </>
                                                    ) : null}
                                                    {glass.special_instructions != null && String(glass.special_instructions).trim() !== '' ? (
                                                        <>
                                                            <br />
                                                            <strong>Note:</strong> {glass.special_instructions}
                                                        </>
                                                    ) : null}
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

                            {/* Footer — hidden on pre-printed pad (footer is already on paper) */}
                            {!isPreprintedPad && (
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
                            )}
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

            {/* Blank prescription — hospital official layout (OPD print form) */}
            {isBlankPrescription && (
                <div className="blank-prescription-container">
                    <div className="tpl-blank-page">
                        <div className="tpl-page-watermark" aria-hidden>
                            <img src="/logo.png" alt="" width={280} height={280} decoding="async" />
                        </div>

                        <header className="tpl-header tpl-blank-layer">
                            <div className="tpl-header-brand">
                                <div className="tpl-logo">
                                    <img src="/logo.png" alt="" />
                                </div>
                                <div className="tpl-header-text">
                                    <div className="tpl-hospital-name">Mousumi Eye Hospital</div>
                                    <div className="tpl-header-line">Nearest Circuit house. Main Road, Naogaon</div>
                                    <div className="tpl-header-line">Hotline : 01307-885566, 01334-925910</div>
                                    <div className="tpl-doc-title">Prescription</div>
                                </div>
                            </div>
                        </header>

                        <div className="tpl-blank-main tpl-blank-layer">
                        <section className="tpl-patient-wrap">
                            <div className="tpl-p-row" style={{ justifyContent: 'space-between' }}>
                                <div className="tpl-field tpl-field-grow" style={{ maxWidth: '48%' }}>
                                    <span className="tpl-label">Patient ID-</span>
                                    <span className="tpl-line">{prescription.patient.patient_id}</span>
                                </div>
                                <div className="tpl-field" style={{ maxWidth: '42%' }}>
                                    <span className="tpl-label">Date :</span>
                                    <span className="tpl-line">{formatDate(prescription.created_at)}</span>
                                </div>
                            </div>
                            <div
                                className="tpl-p-row"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.15fr 1fr 0.42fr 0.42fr',
                                    gap: '2mm',
                                    alignItems: 'end',
                                }}
                            >
                                <div className="tpl-field" style={{ flex: 'unset', minWidth: 0 }}>
                                    <span className="tpl-label">Name :</span>
                                    <span className="tpl-line">{prescription.patient.name}</span>
                                </div>
                                <div className="tpl-field" style={{ flex: 'unset', minWidth: 0 }}>
                                    <span className="tpl-label">Guardian Name:</span>
                                    <span className="tpl-line" />
                                </div>
                                <div className="tpl-field tpl-field-sm" style={{ flex: 'unset' }}>
                                    <span className="tpl-label">Age :</span>
                                    <span className="tpl-line">{patientAgeYears != null ? String(patientAgeYears) : ''}</span>
                                </div>
                                <div className="tpl-field tpl-field-sm" style={{ flex: 'unset' }}>
                                    <span className="tpl-label">Gender :</span>
                                    <span className="tpl-line">{formatGenderDisplay(prescription.patient.gender)}</span>
                                </div>
                            </div>
                            <div className="tpl-p-row">
                                <div className="tpl-field tpl-field-grow">
                                    <span className="tpl-label">Address :</span>
                                    <span className="tpl-line">{prescription.patient.address || ''}</span>
                                </div>
                                <div className="tpl-field" style={{ minWidth: '38%' }}>
                                    <span className="tpl-label">Mobile No-</span>
                                    <span className="tpl-line">{prescription.patient.phone || ''}</span>
                                </div>
                            </div>
                        </section>

                        <div className="tpl-cc-box">
                            <span className="tpl-label">CC :</span>
                            <div className="tpl-cc-body" aria-hidden />
                        </div>

                        <div className="tpl-split">
                            <div className="tpl-col-left">
                                <div className="tpl-left-tables-grow">
                                    <div className="tpl-table-grow-wrap tpl-table-grow-wrap--compact">
                                        <table className="tpl-clinical-table tpl-clinical-table--compact">
                                            <thead>
                                                <tr>
                                                    <th />
                                                    <th>R/E</th>
                                                    <th>L/E</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blankVisionRows.map((label) => (
                                                    <tr key={label}>
                                                        <td className="tpl-c-label">{label}</td>
                                                        <td />
                                                        <td />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="tpl-table-grow-wrap tpl-table-grow-wrap--vitals">
                                        <table className="tpl-vitals tpl-vitals--compact">
                                            <tbody>
                                                <tr>
                                                    <td className="tpl-v-lab">BP</td>
                                                    <td>
                                                        <span
                                                            className="tpl-line"
                                                            style={{ display: 'inline-block', minWidth: '55%', verticalAlign: 'baseline' }}
                                                        />
                                                        <span style={{ marginLeft: '2mm' }}>mm of Hg</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="tpl-v-lab">RBS</td>
                                                    <td>
                                                        <span
                                                            className="tpl-line"
                                                            style={{ display: 'inline-block', minWidth: '55%', verticalAlign: 'baseline' }}
                                                        />
                                                        <span style={{ marginLeft: '2mm' }}>mmol/L</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div
                                        className="tpl-table-grow-wrap tpl-table-grow-wrap--anterior"
                                        style={{ '--tpl-rows': blankAnteriorRows.length } as CSSProperties}
                                    >
                                        <table className="tpl-clinical-table tpl-stretch tpl-stretch--comment">
                                            <thead>
                                                <tr>
                                                    <th />
                                                    <th>R/E</th>
                                                    <th>L/E</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blankAnteriorRows.map((label) => (
                                                    <tr key={label}>
                                                        <td className="tpl-c-label">{label}</td>
                                                        <td />
                                                        <td />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="tpl-fundus">
                                    <div className="tpl-fundus-label">Fundus :</div>
                                </div>
                                <div className="tpl-diagnosis">
                                    <div className="tpl-diagnosis-label">Diagnosis :</div>
                                </div>
                            </div>

                            <div className="tpl-col-right">
                                <div className="tpl-rx-symbol">℞</div>
                            </div>
                        </div>
                        </div>

                        <footer className="tpl-footer tpl-blank-layer">
                            <div className="tpl-footer-gold" />
                            <div className="tpl-footer-bn">
                                শুক্রবার সহ প্রতিদিন হাসপাতাল খোলা সকাল ০৯.০০ মিঃ হতে ০৫.৩০মিঃ পর্যন্ত।
                            </div>
                        </footer>
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
