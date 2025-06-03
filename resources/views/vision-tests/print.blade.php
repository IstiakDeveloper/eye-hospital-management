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

        /* Page Setup - Exact A4 Portrait */
        @page {
            size: A4 portrait;
            margin: 0;
        }

        html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #333;
            background: white;
        }

        /* Main Container */
        .report-container {
            width: 180mm;
            min-height: 270mm;
            max-height: 270mm;
            padding: 8mm;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
        }

        /* Header Area for Letterhead */
        .letterhead-space {
            height: 30mm;
            border-bottom: 2px solid #1976d2;
            margin-bottom: 6mm;
        }

        /* Report Header */
        .report-header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 3mm;
            margin-bottom: 4mm;
            text-align: center;
            position: relative;
        }

        .test-number {
            position: absolute;
            left: 0;
            top: 0;
            font-size: 9px;
            color: #666;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #1976d2;
            letter-spacing: 1px;
        }

        .test-date {
            position: absolute;
            right: 0;
            top: 0;
            font-size: 9px;
            color: #666;
        }

        /* Patient Information */
        .patient-section {
            border: 1px solid #1976d2;
            margin-bottom: 4mm;
            background: #f3f7fd;
        }

        .patient-header {
            background: #1976d2;
            color: white;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            padding: 3mm;
            text-align: center;
        }

        .patient-info {
            padding: 2mm;
            font-size: 9px;
        }

        .patient-row {
            margin-bottom: 1mm;
        }

        .patient-label {
            display: inline-block;
            width: 18mm;
            font-weight: bold;
            color: #555;
        }

        .patient-value {
            border-bottom: 1px dotted #999;
            display: inline-block;
            min-width: 25mm;
            margin-right: 8mm;
        }

        /* Vision Test Results */
        .vision-results {
            margin: 4mm 0;
        }

        .section-header {
            background: #1976d2;
            color: white;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            padding: 3mm;
            margin: 3mm 0 0 0;
            text-align: center;
        }

        /* Eye Test Table */
        .eye-test-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 9px;
            border: 1px solid #1976d2;
        }

        .eye-test-table th {
            background: #1976d2;
            color: white;
            border: 1px solid #1976d2;
            padding: 3mm;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
        }

        .eye-test-table td {
            border: 1px solid #ddd;
            padding: 3mm;
            text-align: center;
            font-size: 9px;
        }

        .eye-test-table .test-label {
            background: #f3f7fd;
            font-weight: bold;
            text-align: left;
            width: 30mm;
        }

        .eye-test-table .eye-column {
            width: 30mm;
        }

        .vision-value {
            font-weight: bold;
            color: #1976d2;
            font-size: 10px;
        }

        .power-value {
            font-weight: bold;
            color: #d32f2f;
        }

        .pressure-value {
            font-weight: bold;
            color: #f57c00;
        }

        .eye-test-table tr:nth-child(even) {
            background: #fafafa;
        }

        /* Refraction Table */
        .refraction-section {
            margin: 4mm 0;
        }

        .refraction-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 9px;
            border: 1px solid #1976d2;
        }

        .refraction-table th {
            background: #1976d2;
            color: white;
            border: 1px solid #1976d2;
            padding: 3mm;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
        }

        .refraction-table td {
            border: 1px solid #ddd;
            padding: 3mm;
            text-align: center;
            font-size: 9px;
        }

        .refraction-table .eye-label {
            background: #f3f7fd;
            font-weight: bold;
            text-align: center;
            width: 25mm;
        }

        .sphere-value {
            font-weight: bold;
            color: #1976d2;
        }

        .cylinder-value {
            font-weight: bold;
            color: #d32f2f;
        }

        .axis-value {
            font-weight: bold;
            color: #388e3c;
        }

        /* Notes Section */
        .notes-section {
            margin: 4mm 0;
        }

        .notes-content {
            border: 1px solid #1976d2;
            border-top: none;
            padding: 3mm;
            background: white;
            font-size: 9px;
            min-height: 15mm;
        }

        /* Summary Box */
        .summary-box {
            border-left: 4px solid #4caf50;
            background: #e8f5e8;
            padding: 3mm;
            margin: 4mm 0;
            font-size: 9px;
        }

        .summary-title {
            font-weight: bold;
            color: #2e7d32;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 2mm;
        }

        .summary-content {
            color: #1b5e20;
        }

        /* Signature Area */
        .signature-area {
            position: absolute;
            bottom: 15mm;
            left: 8mm;
            right: 8mm;
            border-top: 1px solid #ddd;
            padding-top: 3mm;
        }

        .signature-row {
            display: block;
            width: 100%;
        }

        .signature-left {
            float: left;
            width: 45%;
            text-align: center;
        }

        .signature-right {
            float: right;
            width: 45%;
            text-align: center;
        }

        .examiner-info {
            text-align: right;
            margin-bottom: 3mm;
            font-size: 9px;
        }

        .examiner-name {
            font-size: 11px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 1mm;
        }

        .examiner-details {
            font-size: 7px;
            color: #666;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            height: 15mm;
            margin-bottom: 2mm;
        }

        .signature-label {
            font-size: 7px;
            font-weight: bold;
            color: #666;
        }

        /* Footer */
        .report-footer {
            position: absolute;
            bottom: 2mm;
            left: 8mm;
            right: 8mm;
            text-align: center;
            font-size: 6px;
            color: #666;
            border-top: 1px dotted #ccc;
            padding-top: 1mm;
        }

        /* Clear float */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }

        /* Print Optimizations */
        @media print {
            html, body {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .report-container {
                width: 180mm !important;
                min-height: 270mm !important;
                max-height: 270mm !important;
                padding: 8mm !important;
                margin: 0 auto !important;
                overflow: hidden !important;
            }

            body {
                page-break-after: avoid !important;
            }

            .patient-section,
            .eye-test-table,
            .refraction-table,
            .signature-area {
                page-break-inside: avoid;
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Letterhead Space -->
        <div class="letterhead-space"></div>

        <!-- Report Header -->
        <div class="report-header">
            <div class="test-number">Test #{{ str_pad($visionTest->id, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="report-title">VISION TEST REPORT</div>
            <div class="test-date">
                Date: {{ \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}<br>
                {{ \Carbon\Carbon::parse($visionTest->test_date)->format('h:i A') }}
            </div>
        </div>

        <!-- Patient Information -->
        <div class="patient-section">
            <div class="patient-header">Patient Information</div>
            <div class="patient-info">
                <div class="patient-row">
                    <span class="patient-label">Name:</span>
                    <span class="patient-value">{{ $visionTest->patient->name }}</span>
                    <span class="patient-label">Age:</span>
                    <span class="patient-value">
                        @if($visionTest->patient->date_of_birth)
                            {{ \Carbon\Carbon::parse($visionTest->patient->date_of_birth)->age }} Years
                        @else
                            N/A
                        @endif
                    </span>
                </div>
                <div class="patient-row">
                    <span class="patient-label">Patient ID:</span>
                    <span class="patient-value">{{ $visionTest->patient->patient_id }}</span>
                    <span class="patient-label">Gender:</span>
                    <span class="patient-value">{{ $visionTest->patient->gender ? ucfirst($visionTest->patient->gender) : 'N/A' }}</span>
                </div>
                <div class="patient-row">
                    <span class="patient-label">Phone:</span>
                    <span class="patient-value">{{ $visionTest->patient->phone ?? 'N/A' }}</span>
                    <span class="patient-label">Test Date:</span>
                    <span class="patient-value">{{ \Carbon\Carbon::parse($visionTest->test_date)->format('d/m/Y') }}</span>
                </div>
            </div>
        </div>

        <!-- Vision Test Results -->
        <div class="vision-results">
            <div class="section-header">Visual Acuity & Eye Pressure</div>
            <table class="eye-test-table">
                <thead>
                    <tr>
                        <th class="test-label">Test Parameter</th>
                        <th class="eye-column">Right Eye (OD)</th>
                        <th class="eye-column">Left Eye (OS)</th>
                        <th style="width: 40mm;">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="test-label">Visual Acuity</td>
                        <td><span class="vision-value">{{ $visionTest->right_eye_vision ?? '-' }}</span></td>
                        <td><span class="vision-value">{{ $visionTest->left_eye_vision ?? '-' }}</span></td>
                        <td>Distance Vision</td>
                    </tr>
                    <tr>
                        <td class="test-label">Eye Power</td>
                        <td><span class="power-value">{{ $visionTest->right_eye_power ?? '-' }}</span></td>
                        <td><span class="power-value">{{ $visionTest->left_eye_power ?? '-' }}</span></td>
                        <td>Diopter (D)</td>
                    </tr>
                    <tr>
                        <td class="test-label">Eye Pressure (IOP)</td>
                        <td><span class="pressure-value">{{ $visionTest->right_eye_pressure ?? '-' }}</span></td>
                        <td><span class="pressure-value">{{ $visionTest->left_eye_pressure ?? '-' }}</span></td>
                        <td>mmHg</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Refraction Results -->
        @if($visionTest->right_eye_sphere || $visionTest->left_eye_sphere || $visionTest->right_eye_cylinder || $visionTest->left_eye_cylinder)
        <div class="refraction-section">
            <div class="section-header">Refraction Results</div>
            <table class="refraction-table">
                <thead>
                    <tr>
                        <th class="eye-label">Eye</th>
                        <th style="width: 25mm;">Sphere (SPH)</th>
                        <th style="width: 25mm;">Cylinder (CYL)</th>
                        <th style="width: 25mm;">Axis</th>
                        <th style="width: 40mm;">Prescription</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="eye-label">Right Eye (OD)</td>
                        <td><span class="sphere-value">{{ $visionTest->right_eye_sphere ?? '-' }}</span></td>
                        <td><span class="cylinder-value">{{ $visionTest->right_eye_cylinder ?? '-' }}</span></td>
                        <td><span class="axis-value">{{ $visionTest->right_eye_axis ?? '-' }}°</span></td>
                        <td>
                            @if($visionTest->right_eye_sphere || $visionTest->right_eye_cylinder)
                                {{ $visionTest->right_eye_sphere ?? '0.00' }}
                                {{ $visionTest->right_eye_cylinder ? ($visionTest->right_eye_cylinder > 0 ? '+' : '') . $visionTest->right_eye_cylinder : '' }}
                                {{ $visionTest->right_eye_axis ? ' x ' . $visionTest->right_eye_axis . '°' : '' }}
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td class="eye-label">Left Eye (OS)</td>
                        <td><span class="sphere-value">{{ $visionTest->left_eye_sphere ?? '-' }}</span></td>
                        <td><span class="cylinder-value">{{ $visionTest->left_eye_cylinder ?? '-' }}</span></td>
                        <td><span class="axis-value">{{ $visionTest->left_eye_axis ?? '-' }}°</span></td>
                        <td>
                            @if($visionTest->left_eye_sphere || $visionTest->left_eye_cylinder)
                                {{ $visionTest->left_eye_sphere ?? '0.00' }}
                                {{ $visionTest->left_eye_cylinder ? ($visionTest->left_eye_cylinder > 0 ? '+' : '') . $visionTest->left_eye_cylinder : '' }}
                                {{ $visionTest->left_eye_axis ? ' x ' . $visionTest->left_eye_axis . '°' : '' }}
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        @endif

        <!-- Clinical Summary -->
        <div class="summary-box">
            <div class="summary-title">Clinical Assessment</div>
            <div class="summary-content">
                @php
                    $summary = [];
                    if ($visionTest->right_eye_vision || $visionTest->left_eye_vision) {
                        $summary[] = "Visual acuity recorded for both eyes";
                    }
                    if ($visionTest->right_eye_pressure || $visionTest->left_eye_pressure) {
                        $summary[] = "Intraocular pressure measured";
                    }
                    if ($visionTest->right_eye_sphere || $visionTest->left_eye_sphere) {
                        $summary[] = "Refractive error assessment completed";
                    }
                    if (empty($summary)) {
                        $summary[] = "Basic vision screening performed";
                    }
                @endphp
                {{ implode(' • ', $summary) }}
            </div>
        </div>

        <!-- Additional Notes -->
        @if($visionTest->additional_notes)
        <div class="section-header">Additional Notes & Observations</div>
        <div class="notes-content">
            {{ $visionTest->additional_notes }}
        </div>
        @endif

        <!-- Signature Area -->
        <div class="signature-area clearfix">
            <div class="signature-row">
                <div class="signature-left">
                    <div class="signature-line"></div>
                    <div class="signature-label">Patient's Signature</div>
                </div>
                <div class="signature-right">
                    <div class="examiner-info">
                        <div class="examiner-name">
                            {{ $visionTest->performedBy->name ?? 'N/A' }}
                        </div>
                        <div class="examiner-details">
                            Vision Test Examiner<br>
                            Employee ID: {{ $visionTest->performedBy->employee_id ?? 'N/A' }}
                        </div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Examiner's Signature & Seal</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="report-footer">
            <strong>Note:</strong> This report is valid for medical consultation • Follow up as recommended by your doctor • Keep for medical records<br>
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }} | Test ID: {{ str_pad($visionTest->id, 6, '0', STR_PAD_LEFT) }}
        </div>
    </div>
</body>
</html>
