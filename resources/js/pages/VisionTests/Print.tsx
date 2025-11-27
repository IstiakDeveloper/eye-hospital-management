import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

interface VisionTest {
    id: string | number;
    test_date: string;
    complains: string;
    right_eye_diagnosis: string;
    left_eye_diagnosis: string;
    right_eye_lids: string;
    left_eye_lids: string;
    right_eye_conjunctiva: string;
    left_eye_conjunctiva: string;
    right_eye_cornea: string;
    left_eye_cornea: string;
    right_eye_anterior_chamber: string;
    left_eye_anterior_chamber: string;
    right_eye_iris: string;
    left_eye_iris: string;
    right_eye_pupil: string;
    left_eye_pupil: string;
    right_eye_lens: string;
    left_eye_lens: string;
    right_eye_ocular_movements: string;
    left_eye_ocular_movements: string;
    right_eye_vision_without_glass: string;
    left_eye_vision_without_glass: string;
    right_eye_vision_with_glass: string;
    left_eye_vision_with_glass: string;
    right_eye_iop: string;
    left_eye_iop: string;
    right_eye_ducts: string;
    left_eye_ducts: string;
    blood_pressure: string;
    urine_sugar: string;
    blood_sugar: string;
    right_eye_fundus: string;
    left_eye_fundus: string;
    detailed_history: string;
    is_one_eyed: boolean;
    is_diabetic: boolean;
    is_cardiac: boolean;
    is_asthmatic: boolean;
    is_hypertensive: boolean;
    is_thyroid: boolean;
    other_conditions: string;
    drugs_used: string;
    patient: {
        id: number;
        patient_id: string;
        name: string;
        phone: string;
        address: string;
        date_of_birth: string;
        gender: string;
        age: number;
    };
    performedBy: {
        name: string;
    };
}

interface Props {
    visionTest: VisionTest;
    qrCodeBase64?: string;
    isBlankReport?: boolean;
    hospitalInfo: {
        name: string;
        address: string;
        contact: string;
    };
}

export default function VisionTestPrint({ visionTest, qrCodeBase64, isBlankReport = false, hospitalInfo }: Props) {

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
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getGenderInBangla = (gender: string) => {
        switch (gender) {
            case 'male': return 'পুরুষ';
            case 'female': return 'মহিলা';
            default: return gender;
        };
    };

    return (
        <>
            <Head title={`Vision Test Report - ${visionTest.patient.name}`} />

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
                    margin: 12mm 10mm;
                }

                body {
                    font-family: 'Noto Sans Bengali', Arial, sans-serif;
                    font-size: 10px;
                    line-height: 1.4;
                    color: #000;
                    background: white;
                }

                .print-container {
                    max-width: 190mm;
                    margin: 5mm auto;
                    padding: 5mm;
                    background: white;
                }

                .hospital-header {
                    margin-bottom: 4mm;
                    border-bottom: 2px solid #000;
                    padding-bottom: 5mm;
                    text-align: center;
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

                .title-section {
                    position: relative;
                    margin: 4mm 0;
                    height: 25mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .title-left {
                    position: absolute;
                    left: 0;
                    top: 0;
                    font-size: 9px;
                    font-weight: bold;
                }

                .title-center {
                    border: 2px solid #000;
                    padding: 4mm 8mm;
                    background: #f5f5f5;
                    font-weight: bold;
                    font-size: 14px;
                }

                .title-right {
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 30mm;
                    text-align: right;
                }

                .qr-code {
                    width: 18mm;
                    height: 18mm;
                    border: 1px solid #ccc;
                    margin-left: auto;
                    margin-bottom: 2mm;
                }

                .patient-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 6mm;
                    font-size: 10px;
                }

                .patient-info-table td {
                    padding: 2mm;
                    vertical-align: top;
                }

                .patient-label {
                    font-weight: bold;
                    width: 15mm;
                }

                .patient-value {
                    border-bottom: 1px solid #000;
                    min-height: 4mm;
                    width: 30mm;
                    padding-left: 1mm;
                }

                .section-title {
                    font-weight: bold;
                    margin-bottom: 2mm;
                    font-size: 11px;
                }

                .section-box {
                    border: 1px solid #000;
                    min-height: 10mm;
                    padding: 2mm;
                    margin-bottom: 5mm;
                    word-wrap: break-word;
                }


                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 5mm;
                    font-size: 10px;
                }

                .data-table th,
                .data-table td {
                    border: 1px solid #000;
                    padding: 2mm;
                    text-align: left;
                }

                .data-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }

                .label-cell {
                    background: #f8f8f8;
                    font-weight: bold;
                    width: 25%;
                }

                .eye-cell {
                    width: 37.5%;
                    text-align: center;
                }

                .vitals-table {

                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                }

                .vitals-table td {
                    border: 1px solid #000;
                    padding: 3mm;
                    width: 33.33%;
                    vertical-align: top;
                }

                .vitals-label {
                    font-weight: bold;
                    margin-bottom: 2mm;
                }

                .vitals-value {
                    border-bottom: 1px solid #000;
                    min-height: 5mm;
                    padding-left: 1mm;
                }

                .drug-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 5mm;
                    font-size: 10px;
                }

                .drug-table td {
                    padding: 2mm;
                    vertical-align: middle;
                }

                .checkbox {
                    width: 3mm;
                    height: 3mm;
                    border: 1px solid #000;
                    display: inline-block;
                    text-align: center;
                    margin-right: 2mm;
                    vertical-align: middle;
                    font-size: 9px;
                    line-height: 2.8mm;
                    font-weight: bold;
                }

                .checkbox.checked {
                    background: #000;
                    color: white;
                }

                .signature-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 8mm;
                    font-size: 9px;
                }

                .signature-table td {
                    border-top: 1px solid #000;
                    padding: 5mm 2mm 2mm 2mm;
                    width: 50%;
                    vertical-align: top;
                    text-align: center;
                }

                .signature-left {
                    border-right: 1px solid #000;
                }

                .signature-line {
                    border-bottom: 1px solid #000;
                    height: 10mm;
                    margin: 0 auto 2mm auto;
                    width: 80%;
                }

                .signature-label {
                    font-weight: bold;
                    font-size: 8px;
                }

                .examiner-info {
                    margin-bottom: 3mm;
                }

                .examiner-name {
                    font-weight: bold;
                    font-size: 10px;
                }

                .examiner-title {
                    font-size: 9px;
                    margin-top: 1mm;
                }

                .examiner-date {
                    font-size: 8px;
                    margin-top: 1mm;
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
                        padding: 10mm !important;
                        width: 100% !important;
                        max-width: none !important;
                        box-shadow: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    @page {
                        margin: 12mm 10mm;
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
                {/* Hospital Header */}
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
                            <h1>{hospitalInfo.name}</h1>
                            <p>{hospitalInfo.address}</p>
                            <p>{hospitalInfo.contact}</p>
                        </div>
                    </div>
                </div>

                {/* Title Section */}
                <div className="title-section">
                    <div className="title-left">
                        <div>{isBlankReport ? '__/__/____' : formatDate(visionTest.test_date)}</div>
                        <div style={{ fontSize: '8px', color: '#666' }}>
                            {isBlankReport ? '__:__ __' : formatTime(visionTest.test_date)}
                        </div>
                    </div>

                    <div className="title-center">
                        Particulars of Patient
                    </div>

                    <div className="title-right">
                        {qrCodeBase64 ? (
                            <img
                                src={`data:image/png;base64,${qrCodeBase64}`}
                                className="qr-code"
                                alt="Patient QR Code"
                            />
                        ) : (
                            <div className="qr-code" style={{
                                border: '2px solid #000',
                                background: '#fff',
                                fontSize: '4px',
                                padding: '2mm',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <div style={{ fontWeight: 'bold' }}>NO QR</div>
                                <div style={{ fontSize: '2px' }}>{visionTest.patient.patient_id}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Information */}
                <table className="patient-info-table">
                    <tbody>
                        <tr>
                            <td className="patient-label">Invoice:</td>
                            <td className="patient-value">
                                {isBlankReport ? 'DEMO-000000' : String(visionTest.id).padStart(6, '0')}
                            </td>
                            <td style={{ width: '10mm' }}></td>
                            <td className="patient-label">Patient ID:</td>
                            <td className="patient-value">{visionTest.patient.patient_id}</td>
                        </tr>
                        <tr>
                            <td className="patient-label">Name:</td>
                            <td className="patient-value">{visionTest.patient.name}</td>
                            <td style={{ width: '10mm' }}></td>
                            <td className="patient-label">Type:</td>
                            <td className="patient-value">Regular</td>
                        </tr>
                        <tr>
                            <td className="patient-label">Age:</td>
                            <td className="patient-value">
                                {visionTest.patient.age ? `${visionTest.patient.age} years` : ''}
                            </td>
                            <td style={{ width: '10mm' }}></td>
                            <td className="patient-label">Guardian:</td>
                            <td className="patient-value"></td>
                        </tr>
                        <tr>
                            <td className="patient-label">Gender:</td>
                            <td className="patient-value">
                                {visionTest.patient.gender}
                            </td>
                            <td style={{ width: '10mm' }}></td>
                            <td className="patient-label">Mobile:</td>
                            <td className="patient-value">{visionTest.patient.phone}</td>
                        </tr>
                        <tr>
                            <td className="patient-label">Address:</td>
                            <td colSpan={4} className="patient-value" style={{ width: 'auto' }}>
                                {visionTest.patient.address || ''}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Complaints */}
                <div className="section-title">Complaints:</div>
                <div className="section-box">
                    {isBlankReport ? '' : visionTest.complains || ''}
                </div>

                {/* Physical Examination Table */}
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}></th>
                            <th style={{ width: '37.5%' }}>Right Eye</th>
                            <th style={{ width: '37.5%' }}>Left Eye</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="label-cell">Diagnosis</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_diagnosis || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_diagnosis || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Lids</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_lids || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_lids || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Conjunctiva</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_conjunctiva || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_conjunctiva || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Cornea</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_cornea || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_cornea || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Anterior Chamber</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_anterior_chamber || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_anterior_chamber || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Iris</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_iris || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_iris || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Pupil</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_pupil || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_pupil || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Lens</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_lens || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_lens || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Ocular Movements</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_ocular_movements || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_ocular_movements || ''}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Vision Tests Table */}
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}></th>
                            <th style={{ width: '37.5%' }}>Right Eye</th>
                            <th style={{ width: '37.5%' }}>Left Eye</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="label-cell">Vision Without Glass</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_vision_without_glass || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_vision_without_glass || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Vision With Glass</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_vision_with_glass || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_vision_with_glass || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">IOP</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_iop || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_iop || ''}</td>
                        </tr>
                        <tr>
                            <td className="label-cell">Ducts</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.right_eye_ducts || ''}</td>
                            <td className="eye-cell">{isBlankReport ? '' : visionTest.left_eye_ducts || ''}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Vitals Section */}
                <table className="vitals-table">
                    <tbody>
                        <tr>
                            <td>
                                <div className="vitals-label">Blood Pressure</div>
                                <div className="vitals-value">{isBlankReport ? '' : visionTest.blood_pressure || ''}</div>
                            </td>
                            <td>
                                <div className="vitals-label">Urine Sugar</div>
                                <div className="vitals-value">{isBlankReport ? '' : visionTest.urine_sugar || ''}</div>
                            </td>
                            <td>
                                <div className="vitals-label">Blood Sugar</div>
                                <div className="vitals-value">{isBlankReport ? '' : visionTest.blood_sugar || ''}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Fundus Section */}
                <div className="fundus-section">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Fundus:</th>
                                <th style={{ width: '40%' }}>Right Eye</th>
                                <th style={{ width: '40%' }}>Left Eye</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td></td>
                                <td style={{ minHeight: '12mm', verticalAlign: 'top', padding: '2mm' }}>
                                    {isBlankReport ? '' : visionTest.right_eye_fundus || ''}
                                </td>
                                <td style={{ minHeight: '12mm', verticalAlign: 'top', padding: '2mm' }}>
                                    {isBlankReport ? '' : visionTest.left_eye_fundus || ''}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Detailed History */}
                <div className="section-title">Detailed History: (Recent Past and Treatment History)</div>
                <div className="section-box" style={{ minHeight: '15mm' }}>
                    {isBlankReport ? '' : visionTest.detailed_history || ''}
                </div>

                {/* Medical Conditions Section */}
                <div className="section-title">Medical Conditions:</div>
                <table className="drug-table">
                    <tbody>
                        <tr>
                            <td style={{ width: '33.33%' }}>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_one_eyed) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_one_eyed) ? '✔' : ''}
                                </span>
                                One Eyed
                            </td>
                            <td style={{ width: '33.33%' }}>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_cardiac) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_cardiac) ? '✔' : ''}
                                </span>
                                Cardiac
                            </td>
                            <td style={{ width: '33.33%' }}>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_hypertensive) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_hypertensive) ? '✔' : ''}
                                </span>
                                Hypertension
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_diabetic) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_diabetic) ? '✔' : ''}
                                </span>
                                Diabetes
                            </td>
                            <td>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_asthmatic) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_asthmatic) ? '✔' : ''}
                                </span>
                                Asthma
                            </td>
                            <td>
                                <span className={`checkbox ${(!isBlankReport && visionTest.is_thyroid) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.is_thyroid) ? '✔' : ''}
                                </span>
                                Thyroid
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={3}>
                                <span className={`checkbox ${(!isBlankReport && visionTest.other_conditions) ? 'checked' : ''}`}>
                                    {(!isBlankReport && visionTest.other_conditions) ? '✔' : ''}
                                </span>
                                Others: {isBlankReport ? '________________________' : (visionTest.other_conditions || '________________________')}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Current Medications */}
                {(!isBlankReport && visionTest.drugs_used) || isBlankReport ? (
                    <>
                        <div className="section-title">Current Medications:</div>
                        <div className="section-box" style={{ minHeight: '10mm' }}>
                            {isBlankReport ? '' : visionTest.drugs_used || ''}
                        </div>
                    </>
                ) : null}

                {/* Signature Area */}
                <table className="signature-table">
                    <tbody>
                        <tr>
                            <td className="signature-left">
                                <div className="signature-line"></div>
                                <div className="signature-label">Patient Signature</div>
                            </td>
                            <td className="signature-right">
                                <div className="examiner-info">
                                    <div className="examiner-name">
                                        {isBlankReport ? '___________________' : visionTest.performedBy.name}
                                    </div>
                                    <div className="examiner-title">Vision Test Examiner</div>
                                    <div className="examiner-date">
                                        Date: {isBlankReport ? '__________' : formatDate(visionTest.test_date)}
                                    </div>
                                </div>
                                <div className="signature-line"></div>
                                <div className="signature-label">Examiner Signature & Seal</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Print Button for Screen View */}
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
                            cursor: 'pointer'
                        }}
                    >
                        🖨️ Print Again
                    </button>

                    <button
                        onClick={handleGoBack}
                        style={{
                            padding: '10px 20px',
                            margin: '0 10px',
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
