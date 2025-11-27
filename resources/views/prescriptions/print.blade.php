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
        .prescription-container {
            width: 200mm;
            padding: 3mm;
            margin: 0 auto;
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
            padding: 0.5mm 2mm;
        }

        .logo-cell {
            width: 20mm;
            text-align: center;
            position: relative;
        }

        .logo-cell img {
            width: 15mm;
            height: 12mm;
            display: block;
            margin: 0 auto;
        }

        .info-cell {
            text-align: left;
            width: auto;
            padding-left: 3mm;
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

        /* Patient Info Table - 3 Column Layout */
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

        /* Diagnosis Section */
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

        .medicine-generic {
            font-size: 8px;
            color: #666;
            font-style: italic;
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

        .eye-right {
            background: #fff5f5;
            font-weight: bold;
        }

        .eye-left {
            background: #f0f8ff;
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

        /* Page Break Control */
        .no-break {
            page-break-inside: avoid;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
    @php
        $isBlankPrescription = isset($isBlankPrescription) && $isBlankPrescription;
    @endphp

    <div class="prescription-container">
        <!-- Hospital Header with Logo -->
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
                                        style="width: 15mm; height: 12mm; display: block; margin: 0 auto;">
                                @else
                                    <div
                                        style="width: 15mm; height: 12mm; border: 2px solid #000; background: #f0f0f0; text-align: center; line-height: 12mm; font-size: 8px; font-weight: bold; margin: 0 auto;">
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

        <!-- Prescription Title with Date and Rx Number -->
        <div class="prescription-title-section">
            <div class="header-left">
                <div class="rx-number">
                    Rx
                    #{{ $isBlankPrescription ? str_repeat('_', 6) : str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}
                </div>
            </div>

            <div class="prescription-title">MEDICAL PRESCRIPTION</div>

            <div class="header-right">
                <div class="date-info">
                    {{ $isBlankPrescription ? '__/__/____' : \Carbon\Carbon::parse($prescription->created_at)->format('d/m/Y') }}
                </div>
                <div class="time-info">
                    {{ $isBlankPrescription ? '__:__ __' : \Carbon\Carbon::parse($prescription->created_at)->format('h:i A') }}
                </div>
            </div>
        </div>

        <!-- Patient Information - 3 Column Layout -->
        <table class="patient-info-table">
            <tr>
                <td class="patient-label">Name:</td>
                <td class="patient-value">{{ $prescription->patient->name }}</td>
                <td style="width: 5mm;"></td>
                <td class="patient-label">Patient ID:</td>
                <td class="patient-value">{{ $prescription->patient->patient_id }}</td>
                <td style="width: 5mm;"></td>
                <td class="patient-label">Gender:</td>
                <td class="patient-value">
                    {{ $prescription->patient->gender ? ucfirst($prescription->patient->gender) : 'N/A' }}</td>
            </tr>
            <tr>
                <td class="patient-label">Age:</td>
                <td class="patient-value">
                    @if ($prescription->patient->date_of_birth)
                        {{ \Carbon\Carbon::parse($prescription->patient->date_of_birth)->age }} Years
                    @else
                        {{ $prescription->patient->age ?? 'N/A' }}
                    @endif
                </td>
                <td style="width: 5mm;"></td>
                <td class="patient-label">Phone:</td>
                <td class="patient-value">{{ $prescription->patient->phone ?? 'N/A' }}</td>
                <td style="width: 5mm;"></td>
                <td class="patient-label">Date:</td>
                <td class="patient-value">
                    {{ $isBlankPrescription ? '__/__/____' : \Carbon\Carbon::parse($prescription->created_at)->format('d/m/Y') }}
                </td>
            </tr>
            <tr>
                <td class="patient-label">Address:</td>
                <td colspan="7" class="patient-value" style="width: auto;">
                    {{ $prescription->patient->address ?? 'N/A' }}</td>
            </tr>
        </table>

        <!-- Diagnosis -->
        <div class="diagnosis-section">
            <div class="section-label">Medical Diagnosis:</div>
            <div class="section-box">
                {{ $isBlankPrescription ? '' : $prescription->diagnosis }}
            </div>
        </div>

        <!-- Medicines -->
        <div class="section-label">Prescribed Medicines:</div>
        <table class="medicine-table no-break">
            <thead>
                <tr>
                    <th style="width: 8%">S/L</th>
                    <th style="width: 40%">Medicine Name</th>
                    <th style="width: 18%">Dosage</th>
                    <th style="width: 15%">Duration</th>
                    <th style="width: 19%">Instructions</th>
                </tr>
            </thead>
            <tbody>
                @if ($isBlankPrescription)
                    {{-- Create 8 empty rows for blank prescription --}}
                    @for ($i = 1; $i <= 8; $i++)
                        <tr>
                            <td style="text-align: center;">{{ $i }}</td>
                            <td style="height: 8mm;"></td>
                            <td style="height: 8mm;"></td>
                            <td style="height: 8mm;"></td>
                            <td style="height: 8mm;"></td>
                        </tr>
                    @endfor
                @else
                    @if ($prescription->prescriptionMedicines->count() > 0)
                        @foreach ($prescription->prescriptionMedicines as $index => $medicine)
                            <tr>
                                <td style="text-align: center;">{{ $index + 1 }}</td>
                                <td>
                                    <div class="medicine-name">{{ $medicine->medicine->name }}</div>
                                    @if ($medicine->medicine->generic_name)
                                        <div class="medicine-generic">({{ $medicine->medicine->generic_name }})</div>
                                    @endif
                                </td>
                                <td class="dosage-cell">{{ $medicine->dosage }}</td>
                                <td style="text-align: center;">{{ $medicine->duration ?? '-' }}</td>
                                <td>
                                    {{ $medicine->instructions ?? '-' }}
                                    @if ($medicine->frequency)
                                        <br><small>({{ $medicine->frequency }})</small>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    @else
                        {{-- Show 3 empty rows if no medicines in regular prescription --}}
                        @for ($i = 1; $i <= 3; $i++)
                            <tr>
                                <td style="text-align: center;">{{ $i }}</td>
                                <td style="height: 8mm;"></td>
                                <td style="height: 8mm;"></td>
                                <td style="height: 8mm;"></td>
                                <td style="height: 8mm;"></td>
                            </tr>
                        @endfor
                    @endif
                @endif
            </tbody>
        </table>

        <!-- Glasses Prescription -->
        @if (!$isBlankPrescription && $prescription->prescriptionGlasses->count() > 0)
            @foreach ($prescription->prescriptionGlasses as $index => $prescriptionGlass)
                <div class="glasses-section no-break">
                    <div class="glasses-header">
                        Optical Prescription -
                        {{ ucfirst(str_replace('_', ' ', $prescriptionGlass->prescription_type)) }}
                    </div>
                    <div class="glasses-content">
                        <!-- Optical Notice -->
                        <div class="optical-notice">
                            This prescription can be used at any optical shop
                        </div>

                        <table class="glasses-table">
                            <thead>
                                <tr>
                                    <th style="width: 25%">Eye</th>
                                    <th style="width: 18%">SPH</th>
                                    <th style="width: 18%">CYL</th>
                                    <th style="width: 18%">AXIS</th>
                                    <th style="width: 18%">ADD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="eye-right">Right Eye (OD)</td>
                                    <td>{{ $prescriptionGlass->right_eye_sphere ? ($prescriptionGlass->right_eye_sphere > 0 ? '+' : '') . $prescriptionGlass->right_eye_sphere : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->right_eye_cylinder ? ($prescriptionGlass->right_eye_cylinder > 0 ? '+' : '') . $prescriptionGlass->right_eye_cylinder : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->right_eye_axis ? $prescriptionGlass->right_eye_axis . '°' : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->right_eye_add ? '+' . $prescriptionGlass->right_eye_add : '-' }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="eye-left">Left Eye (OS)</td>
                                    <td>{{ $prescriptionGlass->left_eye_sphere ? ($prescriptionGlass->left_eye_sphere > 0 ? '+' : '') . $prescriptionGlass->left_eye_sphere : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->left_eye_cylinder ? ($prescriptionGlass->left_eye_cylinder > 0 ? '+' : '') . $prescriptionGlass->left_eye_cylinder : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->left_eye_axis ? $prescriptionGlass->left_eye_axis . '°' : '-' }}
                                    </td>
                                    <td>{{ $prescriptionGlass->left_eye_add ? '+' . $prescriptionGlass->left_eye_add : '-' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        @if ($prescriptionGlass->pupillary_distance || $prescriptionGlass->segment_height)
                            <div class="measurements-box">
                                <strong>Additional Measurements:</strong>
                                @if ($prescriptionGlass->pupillary_distance)
                                    PD: {{ $prescriptionGlass->pupillary_distance }}mm
                                @endif
                                @if ($prescriptionGlass->segment_height)
                                    @if ($prescriptionGlass->pupillary_distance)
                                        |
                                    @endif
                                    Segment Height: {{ $prescriptionGlass->segment_height }}mm
                                @endif
                            </div>
                        @endif

                        @if ($prescriptionGlass->special_instructions)
                            <div class="measurements-box">
                                <strong>Special Instructions:</strong> {{ $prescriptionGlass->special_instructions }}
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach
        @endif

        <!-- Advice -->
        <div class="advice-section">
            <div class="advice-title">Medical Advice & Recommendations:</div>
            <div style="min-height: 15mm;">
                {{ $isBlankPrescription ? '' : $prescription->advice }}
            </div>
        </div>

        <!-- Follow-up -->
        @if (!$isBlankPrescription && $prescription->followup_date)
            <div class="followup-section">
                <span class="followup-label">Next Follow-up:</span>
                <span
                    class="followup-date">{{ \Carbon\Carbon::parse($prescription->followup_date)->format('d/m/Y') }}</span>
            </div>
        @endif

        <!-- Clinical Notes -->
        <div class="notes-section">
            <div class="section-label">Clinical Notes:</div>
            <div class="notes-box">
                {{ $isBlankPrescription ? '' : $prescription->notes }}
            </div>
        </div>

        <!-- Signature -->
        <table class="signature-table">
            <tr>
                <td class="signature-left">
                    <div class="signature-line"></div>
                    <div class="signature-label">Patient's Signature</div>
                </td>
                <td class="signature-right">
                    <div class="doctor-info">
                        <div class="doctor-name">Dr. {{ $prescription->doctor->user->name }}</div>
                        <div class="doctor-details">
                            @if ($prescription->doctor->specialization)
                                {{ $prescription->doctor->specialization }}<br>
                            @endif
                            @if ($prescription->doctor->registration_number)
                                BMDC Reg: {{ $prescription->doctor->registration_number }}<br>
                            @endif
                            License to Practice Medicine
                        </div>
                    </div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Doctor's Signature & Seal</div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="prescription-footer">
            <strong>Important:</strong> Take medicines as prescribed • Valid for 30 days • Keep out of reach of children
            @if (!$isBlankPrescription && $prescription->prescriptionGlasses->count() > 0)
                • Optical prescription valid at any certified optical shop
            @endif
            <br>
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }} |
            @if ($isBlankPrescription)
                Blank Prescription Form
            @else
                Prescription ID: {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }} |
                @if ($prescription->prescriptionMedicines->count() > 0)
                    {{ $prescription->prescriptionMedicines->count() }} Medicine(s)
                @endif
                @if ($prescription->prescriptionGlasses->count() > 0)
                    @if ($prescription->prescriptionMedicines->count() > 0)
                        +
                    @endif
                    {{ $prescription->prescriptionGlasses->count() }} Optical Prescription(s)
                @endif
            @endif
        </div>
    </div>
</body>

</html>
