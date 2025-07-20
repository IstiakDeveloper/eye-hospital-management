<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prescription - {{ $prescription->patient->name }}</title>
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

        html,
        body {
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

        /* Main Container - Fixed width */
        .prescription-container {
            width: 180mm;
            /* Fixed width to prevent overflow */
            min-height: 270mm;
            /* Use min-height instead of fixed height */
            max-height: 270mm;
            /* Prevent overflow to next page */
            padding: 8mm;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            /* Prevent content overflow */
        }

        /* Header Area for Letterhead */
        .letterhead-space {
            height: 30mm;
            border-bottom: 2px solid #2c5aa0;
            margin-bottom: 6mm;
        }

        /* Prescription Header - Simple layout */
        .rx-header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 3mm;
            margin-bottom: 4mm;
            text-align: center;
            position: relative;
        }

        .rx-number {
            position: absolute;
            left: 0;
            top: 0;
            font-size: 9px;
            color: #666;
        }

        .prescription-title {
            font-size: 16px;
            font-weight: bold;
            color: #2c5aa0;
            letter-spacing: 1px;
        }

        .rx-date {
            position: absolute;
            right: 0;
            top: 0;
            font-size: 9px;
            color: #666;
        }

        /* Patient Information - Compact format */
        .patient-section {
            border: 1px solid #2c5aa0;
            margin-bottom: 4mm;
            background: #f8f9fa;
        }

        .patient-header {
            background: #2c5aa0;
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

        /* Section Headers */
        .section-header {
            background: #2c5aa0;
            color: white;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            padding: 2mm;
            margin: 3mm 0 0 0;
        }

        .section-content {
            border: 1px solid #2c5aa0;
            border-top: none;
            padding: 3mm;
            background: white;
            font-size: 9px;
            min-height: 8mm;
        }

        /* Medicine Table - Compact */
        .medicine-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 8px;
            border: 1px solid #2c5aa0;
        }

        .medicine-table th {
            background: #2c5aa0;
            color: white;
            border: 1px solid #2c5aa0;
            padding: 2mm;
            text-align: center;
            font-weight: bold;
            font-size: 8px;
        }

        .medicine-table td {
            border: 1px solid #ddd;
            padding: 2mm;
            vertical-align: top;
            font-size: 8px;
        }

        /* Fixed column widths */
        .col-sl {
            width: 8mm;
            text-align: center;
        }

        .col-medicine {
            width: 50mm;
        }

        .col-dosage {
            width: 20mm;
            text-align: center;
        }

        .col-duration {
            width: 15mm;
            text-align: center;
        }

        .col-instructions {
            width: 40mm;
        }

        .medicine-name {
            font-weight: bold;
            color: #2c5aa0;
            font-size: 9px;
        }

        .dosage-highlight {
            font-weight: bold;
            color: #dc3545;
            font-size: 9px;
        }

        .medicine-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        /* Advice Box - Compact */
        .advice-box {
            border-left: 3px solid #f39c12;
            background: #fff8dc;
            padding: 2mm;
            margin: 3mm 0;
            font-size: 8px;
        }

        .advice-title {
            font-weight: bold;
            color: #b7791f;
            font-size: 9px;
            text-transform: uppercase;
            margin-bottom: 1mm;
        }

        /* Follow-up Box - Inline */
        .followup-box {
            border-left: 3px solid #28a745;
            background: #d4edda;
            padding: 2mm;
            margin: 3mm 0;
            display: inline-block;
            font-size: 8px;
        }

        .followup-label {
            font-weight: bold;
            color: #155724;
            font-size: 8px;
        }

        .followup-date {
            font-weight: bold;
            color: #28a745;
            font-size: 10px;
        }

        /* Notes - Simple */
        .notes-box {
            border: 1px dashed #6c757d;
            background: #f8f9fa;
            padding: 2mm;
            margin: 3mm 0 8mm 0;
            font-size: 8px;
        }

        /* Signature Area - Fixed position */
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

        .doctor-info {
            text-align: right;
            margin-bottom: 3mm;
            font-size: 9px;
        }

        .doctor-name {
            font-size: 11px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 1mm;
        }

        .doctor-details {
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
        .prescription-footer {
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


        /* Glasses specific styles - Add these to your existing CSS */
        .glasses-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 8px;
            border: 1px solid #8e44ad;
        }

        .glasses-table th {
            background: #8e44ad;
            color: white;
            border: 1px solid #8e44ad;
            padding: 2mm;
            text-align: center;
            font-weight: bold;
            font-size: 8px;
        }

        .glasses-table td {
            border: 1px solid #ddd;
            padding: 2mm;
            vertical-align: top;
            font-size: 8px;
            text-align: center;
        }

        .glasses-header {
            background: #8e44ad;
            color: white;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            padding: 2mm;
            margin: 3mm 0 0 0;
        }

        .eye-section {
            background: #f8f9fa;
            border: 1px solid #8e44ad;
            margin: 2mm 0;
            font-size: 8px;
        }

        .eye-header {
            background: #8e44ad;
            color: white;
            padding: 2mm;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
        }

        .eye-values {
            padding: 2mm;
            display: flex;
            justify-content: space-between;
        }

        .eye-value {
            text-align: center;
            min-width: 20mm;
        }

        .eye-label {
            font-weight: bold;
            color: #8e44ad;
            font-size: 7px;
        }

        .eye-data {
            font-size: 9px;
            font-weight: bold;
            color: #333;
        }

        .glasses-info-box {
            border-left: 3px solid #8e44ad;
            background: #f3e5f5;
            padding: 2mm;
            margin: 3mm 0;
            font-size: 8px;
        }

        .glasses-frame-info {
            background: #e8f5e8;
            border: 1px solid #4caf50;
            padding: 2mm;
            margin: 2mm 0;
            font-size: 8px;
        }

        .total-price-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 2mm;
            margin: 2mm 0;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            color: #856404;
        }

        /* Print Optimizations */
        @media print {

            html,
            body {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .prescription-container {
                width: 180mm !important;
                min-height: 270mm !important;
                max-height: 270mm !important;
                padding: 8mm !important;
                margin: 0 auto !important;
                overflow: hidden !important;
            }

            /* Force single page */
            body {
                page-break-after: avoid !important;
            }

            /* Prevent page breaks */
            .patient-section,
            .medicine-table,
            .signature-area {
                page-break-inside: avoid;
                page-break-after: avoid;
            }
        }
    </style>
</head>

<body>
    <div class="prescription-container">
        <!-- Letterhead Space -->
        <div class="letterhead-space"></div>

        <!-- Prescription Header -->
        <div class="rx-header">
            <div class="rx-number">Rx #{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="prescription-title">PRESCRIPTION</div>
            <div class="rx-date">
                Date: {{ \Carbon\Carbon::parse($prescription->created_at)->format('d/m/Y') }}<br>
                {{ \Carbon\Carbon::parse($prescription->created_at)->format('h:i A') }}
            </div>
        </div>

        <!-- Patient Information -->
        <div class="patient-section">
            <div class="patient-header">Patient Information</div>
            <div class="patient-info">
                <div class="patient-row">
                    <span class="patient-label">Name:</span>
                    <span class="patient-value">{{ $prescription->patient->name }}</span>
                    <span class="patient-label">Age:</span>
                    <span class="patient-value">
                        @if ($prescription->patient->date_of_birth)
                            {{ \Carbon\Carbon::parse($prescription->patient->date_of_birth)->age }} Years
                        @else
                            N/A
                        @endif
                    </span>
                </div>
                <div class="patient-row">
                    <span class="patient-label">Patient ID:</span>
                    <span class="patient-value">{{ $prescription->patient->patient_id }}</span>
                    <span class="patient-label">Gender:</span>
                    <span
                        class="patient-value">{{ $prescription->patient->gender ? ucfirst($prescription->patient->gender) : 'N/A' }}</span>
                </div>
                <div class="patient-row">
                    <span class="patient-label">Phone:</span>
                    <span class="patient-value">{{ $prescription->patient->phone ?? 'N/A' }}</span>
                    <span class="patient-label">Address:</span>
                    <span class="patient-value">{{ $prescription->patient->address ?? 'N/A' }}</span>
                </div>
            </div>
        </div>

        <!-- Chief Complaint / Diagnosis -->
        @if ($prescription->diagnosis)
            <div class="section-header">Chief Complaint / Diagnosis</div>
            <div class="section-content">
                {{ $prescription->diagnosis }}
            </div>
        @endif

        <!-- Prescription Medicines -->
        <div class="section-header">Prescription</div>
        <table class="medicine-table">
            <thead>
                <tr>
                    <th class="col-sl">S/L</th>
                    <th class="col-medicine">Medicine Name</th>
                    <th class="col-dosage">Dosage</th>
                    <th class="col-duration">Duration</th>
                    <th class="col-instructions">Instructions</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($prescription->prescriptionMedicines as $index => $medicine)
                    <tr>
                        <td class="col-sl">{{ $index + 1 }}</td>
                        <td class="col-medicine">
                            <div class="medicine-name">{{ $medicine->medicine->name }}</div>
                        </td>
                        <td class="col-dosage">
                            <span class="dosage-highlight">{{ $medicine->dosage }}</span>
                        </td>
                        <td class="col-duration">{{ $medicine->duration ?? '-' }}</td>
                        <td class="col-instructions">{{ $medicine->instructions ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Glasses Prescription Section -->
        @if ($prescription->prescriptionGlasses->count() > 0)
            <div class="glasses-header">Optical Prescription</div>

            @foreach ($prescription->prescriptionGlasses as $index => $prescriptionGlass)
                <div style="border: 1px solid #8e44ad; margin: 3mm 0; background: white;">
                    <!-- Glasses Header -->
                    <div
                        style="background: #8e44ad; color: white; padding: 2mm; font-weight: bold; text-align: center; font-size: 9px;">
                        Glasses Prescription #{{ $index + 1 }} -
                        {{ ucfirst($prescriptionGlass->prescription_type) }}
                    </div>

                    <!-- Eye Prescription Values -->
                    <div style="padding: 3mm;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold;">
                                        Eye</th>
                                    <th
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold;">
                                        SPH</th>
                                    <th
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold;">
                                        CYL</th>
                                    <th
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold;">
                                        AXIS</th>
                                    <th
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold;">
                                        ADD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold; background: #ffebee;">
                                        Right Eye (OD)
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->right_eye_sphere)
                                            {{ $prescriptionGlass->right_eye_sphere > 0 ? '+' : '' }}{{ $prescriptionGlass->right_eye_sphere }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->right_eye_cylinder)
                                            {{ $prescriptionGlass->right_eye_cylinder > 0 ? '+' : '' }}{{ $prescriptionGlass->right_eye_cylinder }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        {{ $prescriptionGlass->right_eye_axis ?? '-' }}°
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->right_eye_add)
                                            +{{ $prescriptionGlass->right_eye_add }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style="border: 1px solid #ddd; padding: 2mm; text-align: center; font-weight: bold; background: #e3f2fd;">
                                        Left Eye (OS)
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->left_eye_sphere)
                                            {{ $prescriptionGlass->left_eye_sphere > 0 ? '+' : '' }}{{ $prescriptionGlass->left_eye_sphere }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->left_eye_cylinder)
                                            {{ $prescriptionGlass->left_eye_cylinder > 0 ? '+' : '' }}{{ $prescriptionGlass->left_eye_cylinder }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        {{ $prescriptionGlass->left_eye_axis ?? '-' }}°
                                    </td>
                                    <td style="border: 1px solid #ddd; padding: 2mm; text-align: center;">
                                        @if ($prescriptionGlass->left_eye_add)
                                            +{{ $prescriptionGlass->left_eye_add }}
                                        @else
                                            -
                                        @endif
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Additional Measurements -->
                        @if ($prescriptionGlass->pupillary_distance || $prescriptionGlass->segment_height)
                            <div style="margin-top: 3mm; padding: 2mm; background: #f8f9fa; border: 1px solid #ddd;">
                                <div style="font-weight: bold; margin-bottom: 1mm; color: #8e44ad;">Additional
                                    Measurements:</div>
                                @if ($prescriptionGlass->pupillary_distance)
                                    <span style="margin-right: 5mm;"><strong>PD:</strong>
                                        {{ $prescriptionGlass->pupillary_distance }}mm</span>
                                @endif
                                @if ($prescriptionGlass->segment_height)
                                    <span><strong>Segment Height:</strong>
                                        {{ $prescriptionGlass->segment_height }}mm</span>
                                @endif
                            </div>
                        @endif

                        <!-- Frame Information -->
                        @if ($prescriptionGlass->glasses)
                            <div style="margin-top: 3mm; padding: 2mm; background: #e8f5e8; border: 1px solid #4caf50;">
                                <div style="font-weight: bold; margin-bottom: 1mm; color: #2e7d32;">Selected Frame:
                                </div>
                                <div>
                                    <strong>{{ $prescriptionGlass->glasses->brand }}
                                        {{ $prescriptionGlass->glasses->model }}</strong>
                                    @if ($prescriptionGlass->glasses->color)
                                        - {{ $prescriptionGlass->glasses->color }}
                                    @endif
                                    @if ($prescriptionGlass->glasses->material)
                                        ({{ ucfirst($prescriptionGlass->glasses->material) }})
                                    @endif
                                </div>
                                @if ($prescriptionGlass->glasses->size)
                                    <div style="font-size: 7px; color: #666; margin-top: 1mm;">
                                        Size: {{ $prescriptionGlass->glasses->size }}
                                    </div>
                                @endif
                            </div>
                        @endif

                        <!-- Lens Information -->
                        @if ($prescriptionGlass->lensType)
                            <div style="margin-top: 3mm; padding: 2mm; background: #e1f5fe; border: 1px solid #0288d1;">
                                <div style="font-weight: bold; margin-bottom: 1mm; color: #01579b;">Selected Lens:</div>
                                <div>
                                    <strong>{{ $prescriptionGlass->lensType->name }}</strong>
                                    @if ($prescriptionGlass->lensType->material)
                                        - {{ $prescriptionGlass->lensType->material }}
                                    @endif
                                </div>
                                @if ($prescriptionGlass->lensType->coating)
                                    <div style="font-size: 7px; color: #666; margin-top: 1mm;">
                                        Coating: {{ $prescriptionGlass->lensType->coating }}
                                    </div>
                                @endif
                                @if ($prescriptionGlass->lensType->type !== 'clear')
                                    <div style="font-size: 7px; color: #666; margin-top: 1mm;">
                                        Type: {{ ucfirst($prescriptionGlass->lensType->type) }}
                                    </div>
                                @endif
                            </div>
                        @endif

                        <!-- Special Instructions -->
                        @if ($prescriptionGlass->special_instructions)
                            <div style="margin-top: 3mm; padding: 2mm; background: #fff3e0; border: 1px solid #ff9800;">
                                <div style="font-weight: bold; margin-bottom: 1mm; color: #e65100;">Special
                                    Instructions:</div>
                                <div>{{ $prescriptionGlass->special_instructions }}</div>
                            </div>
                        @endif

                        <!-- Price Information -->
                        @if ($prescriptionGlass->total_price > 0)
                            <div
                                style="margin-top: 3mm; padding: 2mm; background: #fff3cd; border: 1px solid #ffc107; text-align: center;">
                                <div style="font-weight: bold; color: #856404; font-size: 9px;">
                                    Estimated Total: ৳{{ number_format($prescriptionGlass->total_price, 2) }}
                                </div>
                            </div>
                        @endif

                        <!-- Delivery Information -->
                        @if ($prescriptionGlass->expected_delivery)
                            <div style="margin-top: 3mm; padding: 2mm; background: #d4edda; border: 1px solid #28a745;">
                                <div style="font-weight: bold; color: #155724; font-size: 8px;">
                                    Expected Delivery:
                                    {{ \Carbon\Carbon::parse($prescriptionGlass->expected_delivery)->format('d/m/Y') }}
                                </div>
                                <div style="font-size: 7px; color: #666; margin-top: 1mm;">
                                    Status: {{ ucfirst($prescriptionGlass->status) }}
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach

            <!-- Glasses Notes -->
            @if ($prescription->glasses_notes)
                <div
                    style="border-left: 3px solid #8e44ad; background: #f3e5f5; padding: 2mm; margin: 3mm 0; font-size: 8px;">
                    <div style="font-weight: bold; color: #8e44ad; margin-bottom: 1mm;">Glasses Notes:</div>
                    <div>{{ $prescription->glasses_notes }}</div>
                </div>
            @endif

        @endif
        <!-- End Glasses Section -->

        <!-- Medical Advice -->
        @if ($prescription->advice)
            <div class="advice-box">
                <div class="advice-title">Medical Advice</div>
                <div>{{ $prescription->advice }}</div>
            </div>
        @endif

        <!-- Follow-up -->
        @if ($prescription->followup_date)
            <div class="followup-box">
                <span class="followup-label">Next Follow-up:</span>
                <span
                    class="followup-date">{{ \Carbon\Carbon::parse($prescription->followup_date)->format('d/m/Y') }}</span>
            </div>
        @endif

        <!-- Additional Notes -->
        @if ($prescription->notes)
            <div class="section-header">Additional Notes</div>
            <div class="notes-box">
                {{ $prescription->notes }}
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
                    <div class="doctor-info">
                        <div class="doctor-name">Dr. {{ $prescription->doctor->user->name }}</div>
                        <div class="doctor-details">
                            @if ($prescription->doctor->specialization)
                                {{ $prescription->doctor->specialization }}<br>
                            @endif
                            @if ($prescription->doctor->registration_number)
                                BMDC Reg. No: {{ $prescription->doctor->registration_number }}
                            @endif
                        </div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Doctor's Signature & Seal</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="prescription-footer">
            <strong>Important:</strong> Take medicines as prescribed • Do not self-medicate • Keep out of reach of
            children • Valid for 30 days<br>
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }} | Prescription ID:
            {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}
        </div>
    </div>
</body>

</html>
