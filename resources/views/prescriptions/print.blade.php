<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Prescription - {{ $prescription->patient->name }}</title>
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
            line-height: 1.3;
            color: #333;
            background: white;
        }

        /* Main Container - Fixed width */
        .prescription-container {
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
            border-bottom: 2px solid #2c5aa0;
            margin-bottom: 6mm;
            position: relative;
        }

        .hospital-info {
            position: absolute;
            top: 5mm;
            left: 0;
            right: 0;
            text-align: center;
        }

        .hospital-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 2mm;
        }

        .hospital-details {
            font-size: 9px;
            color: #666;
            line-height: 1.4;
        }

        /* Prescription Header */
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

        /* Patient Information */
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
            padding: 3mm;
            font-size: 9px;
        }

        .patient-row {
            margin-bottom: 1.5mm;
        }

        .patient-label {
            display: inline-block;
            width: 20mm;
            font-weight: bold;
            color: #555;
        }

        .patient-value {
            border-bottom: 1px dotted #999;
            display: inline-block;
            min-width: 30mm;
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

        /* Medicine Table */
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

        .col-sl { width: 8mm; text-align: center; }
        .col-medicine { width: 45mm; }
        .col-dosage { width: 18mm; text-align: center; }
        .col-duration { width: 15mm; text-align: center; }
        .col-instructions { width: 35mm; }

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

        /* Glasses Prescription Styles */
        .glasses-section {
            margin: 4mm 0;
        }

        .glasses-header {
            background: #8e44ad;
            color: white;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            padding: 2mm;
        }

        .glasses-prescription {
            border: 1px solid #8e44ad;
            margin: 2mm 0;
            background: white;
        }

        .glasses-type-header {
            background: #9b59b6;
            color: white;
            padding: 2mm;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
        }

        .prescription-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }

        .prescription-table th {
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 2mm;
            text-align: center;
            font-weight: bold;
            color: #333;
            font-size: 8px;
        }

        .prescription-table td {
            border: 1px solid #ddd;
            padding: 2mm;
            text-align: center;
            font-size: 8px;
        }

        .eye-label {
            font-weight: bold;
            text-align: center;
            font-size: 8px;
        }

        .right-eye {
            background: #ffebee;
            color: #c62828;
        }

        .left-eye {
            background: #e3f2fd;
            color: #1565c0;
        }

        .measurements-box {
            margin-top: 2mm;
            padding: 2mm;
            background: #f8f9fa;
            border: 1px solid #ddd;
            font-size: 8px;
        }

        .measurements-title {
            font-weight: bold;
            margin-bottom: 1mm;
            color: #8e44ad;
            font-size: 8px;
        }

        .glasses-notes {
            margin-top: 2mm;
            padding: 2mm;
            background: #fff3e0;
            border: 1px solid #ff9800;
            font-size: 8px;
        }

        .glasses-notes-title {
            font-weight: bold;
            margin-bottom: 1mm;
            color: #e65100;
            font-size: 8px;
        }

        /* Medical Notes */
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

        .notes-box {
            border: 1px dashed #6c757d;
            background: #f8f9fa;
            padding: 2mm;
            margin: 3mm 0 8mm 0;
            font-size: 8px;
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

            .prescription-container {
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
            .medicine-table,
            .glasses-prescription,
            .signature-area {
                page-break-inside: avoid;
                page-break-after: avoid;
            }
        }

        /* Special Optical Shop Notice */
        .optical-notice {
            background: #e8f5e8;
            border: 2px solid #4caf50;
            padding: 3mm;
            margin: 3mm 0;
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: #2e7d32;
        }
    </style>
</head>
<body>
    <div class="prescription-container">
        <!-- Letterhead Space -->
        <div class="letterhead-space">

        </div>

        <!-- Prescription Header -->
        <div class="rx-header">
            <div class="rx-number">Rx #{{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="prescription-title">MEDICAL PRESCRIPTION</div>
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
                        @if($prescription->patient->date_of_birth)
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
                    <span class="patient-value">{{ $prescription->patient->gender ? ucfirst($prescription->patient->gender) : 'N/A' }}</span>
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
        @if($prescription->diagnosis)
        <div class="section-header">Medical Diagnosis</div>
        <div class="section-content">
            {{ $prescription->diagnosis }}
        </div>
        @endif

        <!-- Prescription Medicines -->
        @if($prescription->prescriptionMedicines->count() > 0)
        <div class="section-header">Prescribed Medicines</div>
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
                @foreach($prescription->prescriptionMedicines as $index => $medicine)
                <tr>
                    <td class="col-sl">{{ $index + 1 }}</td>
                    <td class="col-medicine">
                        <div class="medicine-name">{{ $medicine->medicine->name }}</div>
                        @if($medicine->medicine->generic_name)
                            <div style="font-size: 7px; color: #666;">({{ $medicine->medicine->generic_name }})</div>
                        @endif
                    </td>
                    <td class="col-dosage">
                        <span class="dosage-highlight">{{ $medicine->dosage }}</span>
                    </td>
                    <td class="col-duration">{{ $medicine->duration ?? '-' }}</td>
                    <td class="col-instructions">
                        {{ $medicine->instructions ?? '-' }}
                        @if($medicine->frequency)
                            <br><small>({{ $medicine->frequency }})</small>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        <!-- Optical Prescription Section -->
        @if($prescription->prescriptionGlasses->count() > 0)
        <div class="glasses-section">
            <div class="glasses-header">Optical Prescription (Medical Values Only)</div>

            <!-- Optical Shop Notice -->
            <div class="optical-notice">
                📝 IMPORTANT: This prescription can be used at any optical shop. Patient may choose their preferred frames and lenses.
            </div>

            @foreach($prescription->prescriptionGlasses as $index => $prescriptionGlass)
            <div class="glasses-prescription">
                <div class="glasses-type-header">
                    Prescription #{{ $index + 1 }} - {{ ucfirst(str_replace('_', ' ', $prescriptionGlass->prescription_type)) }}
                </div>

                <!-- Eye Prescription Table -->
                <table class="prescription-table">
                    <thead>
                        <tr>
                            <th style="width: 20mm;">Eye</th>
                            <th style="width: 15mm;">SPH</th>
                            <th style="width: 15mm;">CYL</th>
                            <th style="width: 15mm;">AXIS</th>
                            <th style="width: 15mm;">ADD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="eye-label right-eye">Right Eye (OD)</td>
                            <td>
                                @if($prescriptionGlass->right_eye_sphere)
                                    {{ $prescriptionGlass->right_eye_sphere > 0 ? '+' : '' }}{{ $prescriptionGlass->right_eye_sphere }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                @if($prescriptionGlass->right_eye_cylinder)
                                    {{ $prescriptionGlass->right_eye_cylinder > 0 ? '+' : '' }}{{ $prescriptionGlass->right_eye_cylinder }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                {{ $prescriptionGlass->right_eye_axis ?? '-' }}
                                @if($prescriptionGlass->right_eye_axis)°@endif
                            </td>
                            <td>
                                @if($prescriptionGlass->right_eye_add)
                                    +{{ $prescriptionGlass->right_eye_add }}
                                @else
                                    -
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td class="eye-label left-eye">Left Eye (OS)</td>
                            <td>
                                @if($prescriptionGlass->left_eye_sphere)
                                    {{ $prescriptionGlass->left_eye_sphere > 0 ? '+' : '' }}{{ $prescriptionGlass->left_eye_sphere }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                @if($prescriptionGlass->left_eye_cylinder)
                                    {{ $prescriptionGlass->left_eye_cylinder > 0 ? '+' : '' }}{{ $prescriptionGlass->left_eye_cylinder }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                {{ $prescriptionGlass->left_eye_axis ?? '-' }}
                                @if($prescriptionGlass->left_eye_axis)°@endif
                            </td>
                            <td>
                                @if($prescriptionGlass->left_eye_add)
                                    +{{ $prescriptionGlass->left_eye_add }}
                                @else
                                    -
                                @endif
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Additional Measurements -->
                @if($prescriptionGlass->pupillary_distance || $prescriptionGlass->segment_height)
                <div class="measurements-box">
                    <div class="measurements-title">Additional Measurements:</div>
                    @if($prescriptionGlass->pupillary_distance)
                        <strong>PD (Pupillary Distance):</strong> {{ $prescriptionGlass->pupillary_distance }}mm
                    @endif
                    @if($prescriptionGlass->segment_height)
                        @if($prescriptionGlass->pupillary_distance) | @endif
                        <strong>Segment Height:</strong> {{ $prescriptionGlass->segment_height }}mm
                    @endif
                </div>
                @endif

                <!-- Special Medical Instructions -->
                @if($prescriptionGlass->special_instructions)
                <div class="glasses-notes">
                    <div class="glasses-notes-title">Medical Instructions for Optical Lab:</div>
                    {{ $prescriptionGlass->special_instructions }}
                </div>
                @endif
            </div>
            @endforeach

            <!-- General Glasses Notes -->
            @if($prescription->glasses_notes)
            <div class="glasses-notes">
                <div class="glasses-notes-title">Doctor's Optical Notes:</div>
                {{ $prescription->glasses_notes }}
            </div>
            @endif
        </div>
        @endif

        <!-- Medical Advice -->
        @if($prescription->advice)
        <div class="advice-box">
            <div class="advice-title">Medical Advice & Recommendations</div>
            <div>{{ $prescription->advice }}</div>
        </div>
        @endif

        <!-- Follow-up -->
        @if($prescription->followup_date)
        <div class="followup-box">
            <span class="followup-label">Next Follow-up:</span>
            <span class="followup-date">{{ \Carbon\Carbon::parse($prescription->followup_date)->format('d/m/Y') }}</span>
        </div>
        @endif

        <!-- Additional Clinical Notes -->
        @if($prescription->notes)
        <div class="section-header">Clinical Notes</div>
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
                            @if($prescription->doctor->specialization)
                                {{ $prescription->doctor->specialization }}<br>
                            @endif
                            @if($prescription->doctor->registration_number)
                                BMDC Reg. No: {{ $prescription->doctor->registration_number }}<br>
                            @endif
                            <strong>License to Practice Medicine</strong>
                        </div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Doctor's Signature & Seal</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="prescription-footer">
            <strong>Important Medical Information:</strong> Take medicines as prescribed • Do not self-medicate • Keep out of reach of children
            @if($prescription->prescriptionGlasses->count() > 0)
                • Optical prescription valid at any certified optical shop
            @endif
            • Valid for 30 days<br>
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }} |
            Prescription ID: {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }} |
            @if($prescription->prescriptionMedicines->count() > 0)
                {{ $prescription->prescriptionMedicines->count() }} Medicine(s)
            @endif
            @if($prescription->prescriptionGlasses->count() > 0)
                @if($prescription->prescriptionMedicines->count() > 0) + @endif
                {{ $prescription->prescriptionGlasses->count() }} Optical Prescription(s)
            @endif
        </div>
    </div>
</body>
</html>



