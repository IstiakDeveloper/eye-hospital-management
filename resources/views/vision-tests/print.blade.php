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

        /* CRITICAL: Font face definition for PDF */
        @font-face {
            font-family: 'Noto Sans Bengali';
            src: url('{{ storage_path("fonts/cache/nato.ttf") }}') format('truetype');
            font-weight: normal;
            font-style: normal;
            unicode-range: U+0980-09FF, U+200C-200D; /* Bengali Unicode range */
        }

        /* Fallback font for missing characters */
        @font-face {
            font-family: 'Bengali Fallback';
            src: url('{{ storage_path("fonts/cache/nato.ttf") }}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        html,
        body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            /* CRITICAL: Font stack with fallbacks */
            font-family: 'Noto Sans Bengali', 'Bengali Fallback', 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #000;
            background: white;
            /* CRITICAL: Text rendering for better Bangla display */
            text-rendering: optimizeLegibility;
            -webkit-font-feature-settings: "liga", "kern";
            font-feature-settings: "liga", "kern";
        }

        /* CRITICAL: Specific Bangla text handling */
        .bangla-text,
        .patient-name,
        .patient-address,
        .complaints-content,
        .diagnosis-content,
        .history-content,
        .medication-content {
            font-family: 'Noto Sans Bengali', 'Bengali Fallback', serif !important;
            font-size: 11px;
            line-height: 1.6;
            word-wrap: break-word;
            text-rendering: optimizeLegibility;
            direction: ltr; /* Left to right for mixed content */
        }

        /* Mixed English-Bangla content */
        .mixed-content {
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.5;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .hospital-address {
            font-size: 10px;
            margin-bottom: 1mm;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .hospital-contact {
            font-size: 10px;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .patient-value {
            border-bottom: 1px solid #000;
            min-height: 4mm;
            width: 30mm;
            padding-left: 1mm;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        /* Complaints Section */
        .complaints-section {
            margin-bottom: 5mm;
        }

        .complaints-label {
            font-weight: bold;
            margin-bottom: 1mm;
            font-size: 11px;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .complaints-box {
            border: 1px solid #000;
            min-height: 10mm;
            padding: 1mm;
            width: 99%;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            line-height: 1.6;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            line-height: 1.6;
        }

        /* History Section */
        .history-section {
            margin: 5mm 0;
        }

        .history-label {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 11px;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .history-box {
            border: 1px solid #000;
            min-height: 15mm;
            padding: 2mm;
            width: 100%;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            line-height: 1.6;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .drug-label {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 11px;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
        }

        .medications-box {
            border: 1px solid #000;
            min-height: 10mm;
            padding: 2mm;
            width: 100%;
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
            line-height: 1.6;
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
            font-family: 'Noto Sans Bengali', Arial, sans-serif;
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

        /* CRITICAL: Print media adjustments */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-synthesis: none;
            }

            * {
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
        }
    </style>
</head>

<body>
    @php
        $isBlankReport = isset($isBlankReport) && $isBlankReport;
    @endphp

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
                                @php
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
                                    <div
                                        style="width: 20mm; height: 15mm; border: 2px solid #000; background: #f0f0f0; text-align: center; line-height: 15mm; font-size: 8px; font-weight: bold; margin: 0 auto;">
                                        LOGO
                                    </div>
                                @endif
                            @endif
                        </td>
                        <td class="info-cell">
                            <div class="hospital-name">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</div>
                            <div class="hospital-address">প্রধান রাস্তা, নওগাঁ মৎস্য ভবনের পাশে, নওগাঁ সদর, নওগাঁ</div>
                            <div class="hospital-contact">মোবাইল: ০১৩০৭-৮৮৫৫৬৬; ইমেইল: niehpc@gamil.com</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Vision Title with Date and QR Code -->
        <div class="vision-title-section">
            <div class="header-left">
                <div class="date-info">
                    {{ $isBlankReport ? '__/__/____' : \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}
                </div>
                <div class="time-info">
                    {{ $isBlankReport ? '__:__ __' : \Carbon\Carbon::parse($visionTest->test_date)->format('h:i A') }}
                </div>
            </div>

            <div class="vision-title">রোগীর বিবরণ</div>

            <!-- QR Code Section -->
            <div class="header-right">
                <div class="barcode-container">
                    @php
                        $patientCode = $visionTest->patient->patient_id;
                    @endphp

                    <div class="barcode-lines">
                        @if (isset($qrCodeBase64) && $qrCodeBase64)
                            <img src="data:image/png;base64,{{ $qrCodeBase64 }}" class="qr-code-image"
                                alt="Patient QR Code">
                        @elseif($visionTest->patient->qr_code_image_path)
                            @php
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
                                <div class="qr-fallback">
                                    <div style="font-weight: bold; font-size: 4px; margin-bottom: 2mm;">FILE MISSING</div>
                                    <div style="font-size: 2px;">{{ $patientCode }}</div>
                                </div>
                            @endif
                        @else
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
                <td class="patient-label">ইনভয়েস:</td>
                <td class="patient-value">
                    {{ $isBlankReport ? 'DEMO-000000' : str_pad($visionTest->id, 6, '0', STR_PAD_LEFT) }}
                </td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">রোগী আইডি:</td>
                <td class="patient-value">{{ $visionTest->patient->patient_id }}</td>
            </tr>
            <tr>
                <td class="patient-label">নাম:</td>
                <td class="patient-value bangla-text">{{ $visionTest->patient->name }}</td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">রোগীর ধরন:</td>
                <td class="patient-value">নিয়মিত</td>
            </tr>
            <tr>
                <td class="patient-label">বয়স:</td>
                <td class="patient-value">
                    @if ($visionTest->patient->date_of_birth)
                        {{ \Carbon\Carbon::parse($visionTest->patient->date_of_birth)->age }} বছর
                    @endif
                </td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">অভিভাবক:</td>
                <td class="patient-value"></td>
            </tr>
            <tr>
                <td class="patient-label">লিঙ্গ:</td>
                <td class="patient-value">
                    @if($visionTest->patient->gender === 'male') পুরুষ
                    @elseif($visionTest->patient->gender === 'female') মহিলা
                    @else {{ $visionTest->patient->gender ? ucfirst($visionTest->patient->gender) : '' }}
                    @endif
                </td>
                <td style="width: 10mm;"></td>
                <td class="patient-label">মোবাইল:</td>
                <td class="patient-value">{{ $visionTest->patient->phone }}</td>
            </tr>
            <tr>
                <td class="patient-label">ঠিকানা:</td>
                <td colspan="4" class="patient-value bangla-text" style="width: auto;">
                    {{ $visionTest->patient->address ?? '' }}
                </td>
            </tr>
        </table>

        <!-- Complaints Section -->
        <div class="complaints-section">
            <div class="complaints-label">অভিযোগ:</div>
            <div class="complaints-box bangla-text">
                {{ $isBlankReport ? '' : $visionTest->complains ?? '' }}
            </div>
        </div>

        <!-- Physical Examination Table -->
        <table class="data-table no-break">
            <thead>
                <tr>
                    <th style="width: 25%;"></th>
                    <th style="width: 37.5%;">ডান চোখ</th>
                    <th style="width: 37.5%;">বাম চোখ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-cell">রোগ নির্ণয়</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_diagnosis ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_diagnosis ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">চোখের পাতা</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_lids ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_lids ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">কনজাংটিভা</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_conjunctiva ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_conjunctiva ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">কর্নিয়া</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_cornea ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_cornea ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">অগ্রকক্ষ</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_anterior_chamber ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_anterior_chamber ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">আইরিস</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_iris ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_iris ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">পুতুল</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_pupil ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_pupil ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">লেন্স</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_lens ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_lens ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">চোখের নড়াচড়া</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_ocular_movements ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_ocular_movements ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Vision Tests Table -->
        <table class="data-table no-break">
            <thead>
                <tr>
                    <th style="width: 25%;"></th>
                    <th style="width: 37.5%;">ডান চোখ</th>
                    <th style="width: 37.5%;">বাম চোখ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-cell">চশমা ছাড়া দৃষ্টি</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->right_eye_vision_without_glass ?? '' }}</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->left_eye_vision_without_glass ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">চশমা সহ দৃষ্টি</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->right_eye_vision_with_glass ?? '' }}</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->left_eye_vision_with_glass ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">চোখের চাপ</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->right_eye_iop ?? '' }}</td>
                    <td class="eye-cell">{{ $isBlankReport ? '' : $visionTest->left_eye_iop ?? '' }}</td>
                </tr>
                <tr>
                    <td class="label-cell">নালী</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_ducts ?? '' }}</td>
                    <td class="eye-cell bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_ducts ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Vitals Section -->
        <table class="vitals-table">
            <tr>
                <td>
                    <div class="vitals-label">রক্তচাপ</div>
                    <div class="vitals-value">{{ $isBlankReport ? '' : $visionTest->blood_pressure ?? '' }}</div>
                </td>
                <td>
                    <div class="vitals-label">প্রস্রাবে চিনি</div>
                    <div class="vitals-value bangla-text">{{ $isBlankReport ? '' : $visionTest->urine_sugar ?? '' }}</div>
                </td>
                <td>
                    <div class="vitals-label">রক্তে চিনি</div>
                    <div class="vitals-value">{{ $isBlankReport ? '' : $visionTest->blood_sugar ?? '' }}</div>
                </td>
            </tr>
        </table>

        <!-- Fundus Section -->
        <table class="fundus-table">
            <thead>
                <tr>
                    <th class="fundus-label">ফান্ডাস:</th>
                    <th style="width: 40%;">ডান চোখ</th>
                    <th style="width: 40%;">বাম চোখ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="fundus-label"></td>
                    <td class="fundus-content bangla-text">{{ $isBlankReport ? '' : $visionTest->right_eye_fundus ?? '' }}</td>
                    <td class="fundus-content bangla-text">{{ $isBlankReport ? '' : $visionTest->left_eye_fundus ?? '' }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Detailed History Section -->
        <div class="history-section">
            <div class="history-label">বিস্তারিত ইতিহাস: (সাম্প্রতিক অতীত এবং চিকিৎসার ইতিহাস)</div>
            <div class="history-box bangla-text">{{ $isBlankReport ? '' : $visionTest->detailed_history ?? '' }}</div>
        </div>

        <!-- Drug Used Section -->
        <div class="drug-label">ব্যবহৃত ঔষধ:</div>
        <table class="drug-table">
            <tr>
                <td style="width: 33.33%;">
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_one_eyed) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_one_eyed) ? '•' : '' }}
                    </span>
                    একচোখা
                </td>
                <td style="width: 33.33%;">
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_cardiac) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_cardiac) ? '•' : '' }}
                    </span>
                    হৃদরোগ
                </td>
                <td style="width: 33.33%;">
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_hypertensive) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_hypertensive) ? '•' : '' }}
                    </span>
                    উচ্চ রক্তচাপ
                </td>
            </tr>
            <tr>
                <td>
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_diabetic) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_diabetic) ? '•' : '' }}
                    </span>
                    ডায়াবেটিস
                </td>
                <td>
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_asthmatic) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_asthmatic) ? '•' : '' }}
                    </span>
                    হাঁপানি
                </td>
                <td>
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->is_thyroid) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->is_thyroid) ? '•' : '' }}
                    </span>
                    থাইরয়েড
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <span class="checkbox {{ (!$isBlankReport && $visionTest->other_conditions) ? 'checked' : '' }}">
                        {{ (!$isBlankReport && $visionTest->other_conditions) ? '•' : '' }}
                    </span>
                    অন্যান্য: {{ $isBlankReport ? '________________________' : ($visionTest->other_conditions ?? '________________________') }}
                </td>
            </tr>
        </table>

        <!-- Current Medications -->
        @if (!$isBlankReport && $visionTest->drugs_used)
            <div class="medications-section">
                <div class="medications-label">বর্তমান ঔষধসমূহ:</div>
                <div class="medications-box bangla-text">{{ $visionTest->drugs_used }}</div>
            </div>
        @elseif($isBlankReport)
            <div class="medications-section">
                <div class="medications-label">বর্তমান ঔষধসমূহ:</div>
                <div class="medications-box bangla-text"></div>
            </div>
        @endif

        <!-- Signature Area -->
        <table class="signature-table">
            <tr>
                <td class="signature-left">
                    <div class="signature-line"></div>
                    <div class="signature-label">রোগীর স্বাক্ষর</div>
                </td>
                <td class="signature-right">
                    <div class="examiner-info">
                        <div class="examiner-name bangla-text">
                            {{ $isBlankReport ? '___________________' : ($visionTest->performedBy->name ?? 'N/A') }}
                        </div>
                        <div class="examiner-title">দৃষ্টি পরীক্ষা পরীক্ষক</div>
                        <div class="examiner-date">
                            তারিখ: {{ $isBlankReport ? '__________' : \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}
                        </div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">পরীক্ষকের স্বাক্ষর ও সিল</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
