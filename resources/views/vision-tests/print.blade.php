<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vision Test Report - {{ $visionTest->patient->name }}</title>
    <style>
        /* Reset and Base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Page Setup for PDF */
        @page {
            size: A4 portrait;
            margin: 5mm;
        }

        html,
        body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #000;
            background: white;
        }

        /* Main Container */
        .report-container {
            width: 200mm;
            padding: 5mm;
            margin: 0 auto;
        }

        /* Hospital Header with Logo - Centered Layout */
        .hospital-header {
            margin-bottom: 2mm;
            border-bottom: 2px solid #000;
            padding-bottom: 5mm;
            width: 100%;
            text-align: center;
        }

        .header-content {
            display: inline-block;
            text-align: center;
            position: relative;
        }

        .header-table {
            margin: 0 auto;
            border-collapse: collapse;
            vertical-align: middle;
        }

        .header-table td {
            vertical-align: middle;
            padding: 1mm 3mm;
        }

        .logo-cell {
            width: 25mm;
            text-align: center;
            position: relative;
        }

        .logo-cell img {
            width: 20mm;
            height: 15mm;
            display: block;
            margin: 0 auto;
        }

        .info-cell {
            text-align: left;
            width: auto;
            padding-left: 5mm;
        }

        .hospital-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2mm;
        }

        .hospital-address {
            font-size: 10px;
            margin-bottom: 1mm;
        }

        .hospital-contact {
            font-size: 10px;
        }

        /* Vision Title Box with QR Code */
        .vision-title-section {
            width: 100%;
            margin: 2mm auto 2mm auto;
            position: relative;
            height: 25mm;
        }

        .vision-title {
            width: 60mm;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 2mm;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            background: #f5f5f5;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }

        .header-left {
            position: absolute;
            left: 5;
            top: 25;
            width: 25mm;
            font-size: 9px;
            font-weight: bold;
        }

        .header-right {
            position: absolute;
            right: 0;
            top: 0;
            width: 30mm;
            text-align: right;
        }

        .date-info {
            font-weight: bold;
            margin-bottom: 1mm;
        }

        .time-info {
            font-size: 8px;
            color: #666;
        }

        .barcode-container {
            width: 35mm;
            height: 25mm;
            background: #fff;
            text-align: end;
            float: right;
        }

        .barcode-lines {
            margin-bottom: 2mm;
            height: 18mm;
            text-align: end;
            line-height: 18mm;
        }

        .qr-code-image {
            width: 18mm;
            height: 18mm;
            border: 1px solid #ccc;
            object-fit: contain;
            vertical-align: end;
        }

        .qr-fallback {
            width: 18mm;
            height: 18mm;
            border: 2px solid #000;
            background: #fff;
            font-family: monospace;
            font-size: 3px;
            padding: 2mm;
            text-align: center;
            vertical-align: middle;
            display: inline-block;
        }

        .barcode-text {
            font-family: Arial, sans-serif;
            font-size: 5px;
            font-weight: bold;
            margin-bottom: 1mm;
            word-wrap: break-word;
        }

        .test-id {
            font-size: 5px;
            font-weight: bold;
            color: #666;
        }

        /* Patient Info Table */
        .patient-info-table {
            width: 100%;
            margin-bottom: 6mm;
            border-collapse: collapse;
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

        /* Complaints Section */
        .complaints-section {
            margin-bottom: 5mm;
        }

        .complaints-label {
            font-weight: bold;
            margin-bottom: 1mm;
            font-size: 11px;
        }

        .complaints-box {
            border: 1px solid #000;
            min-height: 10mm;
            padding: 1mm;
            width: 99%;
        }

        /* All Tables */
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

        .data-table .label-cell {
            background: #f8f8f8;
            font-weight: bold;
            width: 25%;
        }

        .data-table .eye-cell {
            width: 37.5%;
            text-align: center;
        }

        /* Vitals Table */
        .vitals-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
            font-size: 10px;
            page-break-after: always;
        }

        .vitals-table td {
            border: 1px solid #000;
            padding: 2mm;
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

        /* Fundus Table */
        .fundus-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
            margin-top: 10mm;
            font-size: 10px;

        }

        .fundus-table th,
        .fundus-table td {
            border: 1px solid #000;
            padding: 5mm;
        }

        .fundus-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .fundus-table .fundus-label {
            background: #f8f8f8;
            font-weight: bold;
            width: 20%;
        }

        .fundus-table .fundus-content {
            min-height: 12mm;
            vertical-align: top;
            padding: 2mm;
        }

        /* History Section */
        .history-section {
            margin-top: 5mm;
        }

        .history-label {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 11px;
        }

        .history-box {
            border: 1px solid #000;
            min-height: 15mm;
            padding: 2mm;
            width: 100%;
        }

        /* Drug Used Table */
        .drug-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
            font-size: 10px;
        }

        .drug-table td {
            padding: 1mm 2mm;
            vertical-align: middle;
        }

        .drug-label {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 11px;
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

        /* Medications Section */
        .medications-section {
            margin-bottom: 8mm;
        }

        .medications-label {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 11px;
        }

        .medications-box {
            border: 1px solid #000;
            min-height: 10mm;
            padding: 2mm;
            width: 100%;
        }

        /* Signature Table */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8mm;
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
            height: 10mm;
            margin-bottom: 2mm;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }

        .signature-label {
            font-weight: bold;
            font-size: 8px;
        }

        .examiner-info {
            margin-bottom: 2mm;
            text-align: center;
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

        /* Page Break Control */
        .page-break {
            page-break-before: always;
        }

        .no-break {
            page-break-inside: avoid;
        }

        /* New Page Section - starts on page 2 */
        .page-two-content {
            page-break-before: always;
        }
    </style>
</head>

<body>
    <div class="report-container">
        <!-- Hospital Header with Logo - Centered Layout -->
        <div class="hospital-header">
            <div class="header-content">
                <table class="header-table">
                    <tr>
                        <td class="logo-cell">
                            @php
                                $logoPath = public_path('logo.png');
                                $logoExists = file_exists($logoPath);
                            @endphp

                            @if ($logoExists)
                                <img src="{{ public_path('logo.png') }}" alt="Hospital Logo">
                            @else
                                <!-- Fallback: Base64 encoded logo or placeholder -->
                                @php
                                    // Option 1: Try to get base64 encoded logo
                                    $base64Logo = null;
                                    $storageLogo = storage_path('app/public/logo.png');
                                    if (file_exists($storageLogo)) {
                                        $logoData = file_get_contents($storageLogo);
                                        $base64Logo = base64_encode($logoData);
                                    }
                                @endphp

                                @if ($base64Logo)
                                    <img src="data:image/png;base64,{{ $base64Logo }}" alt="Hospital Logo"
                                        style="width: 20mm; height: 15mm; display: block; margin: 0 auto;">
                                @else
                                    <!-- Final fallback: Placeholder div -->
                                    <div
                                        style="width: 20mm; height: 15mm; border: 2px solid #000; background: #f0f0f0; text-align: center; line-height: 15mm; font-size: 8px; font-weight: bold; margin: 0 auto;">
                                        LOGO
                                    </div>
                                @endif
                            @endif
                        </td>
                        <td class="info-cell">
                            <div class="hospital-name">Naogaon Islamia Chakkhu Hospital and Phaco Center</div>
                            <div class="hospital-address">Main Road, Beside of Naogaon Fisheries Building, Naogaon
                                Sadar, Naogaon</div>
                            <div class="hospital-contact">Mobile: 01307-885566; Email: niehpc@gamil.com</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Vision Title with Date and QR Code -->
        <div class="vision-title-section">
            <div class="header-left">
                <div class="date-info">{{ \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}</div>
                <div class="time-info">{{ \Carbon\Carbon::parse($visionTest->test_date)->format('h:i A') }}</div>
            </div>

            <div class="vision-title">Particulars of Patient</div>

            <!-- Updated QR Code Section in Blade Template -->
            <div class="header-right">
                <div class="barcode-container">
                    @php
                        $patientCode = $visionTest->patient->patient_id;
                    @endphp

                    <!-- QR Code Display -->
                    <div class="barcode-lines">
                        @if (isset($qrCodeBase64) && $qrCodeBase64)
                            <!-- Use base64 image passed from controller -->
                            <img src="data:image/png;base64,{{ $qrCodeBase64 }}" class="qr-code-image"
                                alt="Patient QR Code">
                        @elseif($visionTest->patient->qr_code_image_path)
                            @php
                                // Fallback: try to load image directly and convert to base64
                                $qrImagePath = storage_path('app/public/' . $visionTest->patient->qr_code_image_path);
                                $imageExists = file_exists($qrImagePath);
                                $qrBase64 = null;
                                if ($imageExists) {
                                    $imageData = file_get_contents($qrImagePath);
                                    $qrBase64 = base64_encode($imageData);
                                }
                            @endphp

                            @if ($qrBase64)
                                <img src="data:image/png;base64,{{ $qrBase64 }}" class="qr-code-image"
                                    alt="Patient QR Code">
                            @else
                                <!-- File not found fallback -->
                                <div class="qr-fallback">
                                    <div style="font-weight: bold; font-size: 4px; margin-bottom: 2mm;">FILE MISSING
                                    </div>
                                    <div style="font-size: 2px;">{{ $patientCode }}</div>
                                </div>
                            @endif
                        @else
                            <!-- No QR code available -->
                            <div class="qr-fallback">
                                <div style="font-weight: bold; font-size: 4px; margin-bottom: 2mm;">NO QR</div>
                                <div style="font-size: 2px;">{{ $patientCode }}</div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        <!-- Patient Information -->
        <table class="patient-info-table">
            <tr>
                <td class="patient-label">Invoice:</td>
                <td class="patient-value">{{ str_pad($visionTest->id, 6, '0', STR_PAD_LEFT) }}</td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">Patient ID:</td>
                <td class="patient-value">{{ $visionTest->patient->patient_id }}</td>
            </tr>
            <tr>
                <td class="patient-label">Name:</td>
                <td class="patient-value">{{ $visionTest->patient->name }}</td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">Patient Type:</td>
                <td class="patient-value">Regular</td>
            </tr>
            <tr>
                <td class="patient-label">Age:</td>
                <td class="patient-value">
                    @if ($visionTest->patient->date_of_birth)
                        {{ \Carbon\Carbon::parse($visionTest->patient->date_of_birth)->age }} Years
                    @endif
                </td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">Guardian:</td>
                <td class="patient-value"></td>
            </tr>
            <tr>
                <td class="patient-label">Sex:</td>
                <td class="patient-value">
                    {{ $visionTest->patient->gender ? ucfirst($visionTest->patient->gender) : '' }}</td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">Mobile:</td>
                <td class="patient-value">{{ $visionTest->patient->phone }}</td>
            </tr>
            <tr>
                <td class="patient-label">Address:</td>
                <td colspan="4" class="patient-value" style="width: auto;">{{ $visionTest->patient->address ?? '' }}
                </td>
            </tr>
        </table>

        <!-- Complaints Section -->
        <div class="complaints-section">
            <div class="complaints-label">Complains:</div>
            <div class="complaints-box">{{ $visionTest->complains ?? '' }}</div>
        </div>

        <!-- Physical Examination Table -->
        <table class="data-table no-break">
            <thead>
                <tr>
                    <th style="width: 25%;"></th>
                    <th style="width: 37.5%;">Right Eye</th>
                    <th style="width: 37.5%;">Left Eye</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-cell">Diagnosis</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_diagnosis ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_diagnosis ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Lids</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_lids ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_lids ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Conjunctiva</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_conjunctiva ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_conjunctiva ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Cornea</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_cornea ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_cornea ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Anterior Chamber</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_anterior_chamber ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_anterior_chamber ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Iris</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_iris ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_iris ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Pupil</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_pupil ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_pupil ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Lens</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_lens ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_lens ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Ocular movements</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_ocular_movements ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_ocular_movements ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Vision Tests Table -->
        <table class="data-table no-break">
            <thead>
                <tr>
                    <th style="width: 25%;"></th>
                    <th style="width: 37.5%;">Right Eye</th>
                    <th style="width: 37.5%;">Left Eye</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-cell">Vision Without Glass</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_vision_without_glass ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_vision_without_glass ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Vision With Glass/pinhole</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_vision_with_glass ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_vision_with_glass ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">IOP</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_iop ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_iop ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">Ducts</td>
                    <td class="eye-cell">{{ $visionTest->right_eye_ducts ?? '' }}</td>
                    <td class="eye-cell">{{ $visionTest->left_eye_ducts ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Vitals Section -->
        <table class="vitals-table">
            <tr>
                <td>
                    <div class="vitals-label">B.P</div>
                    <div class="vitals-value">{{ $visionTest->blood_pressure ?? '' }}</div>
                </td>
                <td>
                    <div class="vitals-label">Urine Sugar</div>
                    <div class="vitals-value">{{ $visionTest->urine_sugar ?? '' }}</div>
                </td>
                <td>
                    <div class="vitals-label">Blood Sugar</div>
                    <div class="vitals-value">{{ $visionTest->blood_sugar ?? '' }}</div>
                </td>
            </tr>
        </table>

        <!-- Fundus Section -->
        <table class="fundus-table">
            <thead>
                <tr>
                    <th class="fundus-label">Fundus:</th>
                    <th style="width: 40%;">Right Eye</th>
                    <th style="width: 40%;">Left Eye</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="fundus-label"></td>
                    <td class="fundus-content">{{ $visionTest->right_eye_fundus ?? '' }}</td>
                    <td class="fundus-content">{{ $visionTest->left_eye_fundus ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Detailed History Section -->
        <div class="history-section">
            <div class="history-label">Detailed History: (Immediate Past and Treatment History)</div>
            <div class="history-box">{{ $visionTest->detailed_history ?? '' }}</div>
        </div>

        <!-- Drug Used Section -->
        <div class="drug-label">Drug Used:</div>
        <table class="drug-table">
            <tr>
                <td style="width: 33.33%;">
                    <span
                        class="checkbox {{ $visionTest->is_one_eyed ? 'checked' : '' }}">{{ $visionTest->is_one_eyed ? '•' : '' }}</span>
                    ONE EYED
                </td>
                <td style="width: 33.33%;">
                    <span
                        class="checkbox {{ $visionTest->is_cardiac ? 'checked' : '' }}">{{ $visionTest->is_cardiac ? '•' : '' }}</span>
                    CARDIAC
                </td>
                <td style="width: 33.33%;">
                    <span
                        class="checkbox {{ $visionTest->is_hypertensive ? 'checked' : '' }}">{{ $visionTest->is_hypertensive ? '•' : '' }}</span>
                    HYPERTENSIVE
                </td>
            </tr>
            <tr>
                <td>
                    <span
                        class="checkbox {{ $visionTest->is_diabetic ? 'checked' : '' }}">{{ $visionTest->is_diabetic ? '•' : '' }}</span>
                    DIABETIC
                </td>
                <td>
                    <span
                        class="checkbox {{ $visionTest->is_asthmatic ? 'checked' : '' }}">{{ $visionTest->is_asthmatic ? '•' : '' }}</span>
                    ASTHMATIC
                </td>
                <td>
                    <span
                        class="checkbox {{ $visionTest->is_thyroid ? 'checked' : '' }}">{{ $visionTest->is_thyroid ? '•' : '' }}</span>
                    THYROID
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <span
                        class="checkbox {{ $visionTest->other_conditions ? 'checked' : '' }}">{{ $visionTest->other_conditions ? '•' : '' }}</span>
                    OTHERS: {{ $visionTest->other_conditions ?? '________________________' }}
                </td>
            </tr>
        </table>

        <!-- Current Medications -->
        @if ($visionTest->drugs_used)
            <div class="medications-section">
                <div class="medications-label">Current Medications:</div>
                <div class="medications-box">{{ $visionTest->drugs_used }}</div>
            </div>
        @endif

        <!-- Signature Area -->
        <table class="signature-table">
            <tr>
                <td class="signature-left">
                    <div class="signature-line"></div>
                    <div class="signature-label">Patient's Signature</div>
                </td>
                <td class="signature-right">
                    <div class="examiner-info">
                        <div class="examiner-name">{{ $visionTest->performedBy->name ?? 'N/A' }}</div>
                        <div class="examiner-title">Vision Test Examiner</div>
                        <div class="examiner-date">Date:
                            {{ \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}</div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Examiner's Signature & Seal</div>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
