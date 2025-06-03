<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Slip - {{ $appointment->patient->name }}</title>
    <style>
        /* Reset and Base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Page Setup - Compact Receipt Size */
        @page {
            size: 80mm 100mm;
            margin: 0;
        }

        html, body {
            width: 80mm;
            height: 100mm;
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            font-size: 8px;
            line-height: 1.1;
            color: #333;
            background: white;
        }

        /* Receipt Container */
        .receipt-container {
            width: 80mm;
            height: 100mm;
            padding: 2mm;
            position: relative;
            overflow: hidden;
        }

        /* Header Section */
        .receipt-header {
            text-align: center;
            margin-bottom: 2mm;
            padding-bottom: 1mm;
            border-bottom: 1px solid #333;
        }

        .clinic-name {
            font-size: 10px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 0.5mm;
        }

        .slip-title {
            font-size: 9px;
            font-weight: bold;
            color: #333;
            margin-bottom: 0.5mm;
        }

        .slip-meta {
            font-size: 6px;
            color: #666;
        }

        /* Compact Info Sections */
        .info-section {
            margin-bottom: 2mm;
        }

        .section-title {
            font-size: 7px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 0.5mm 1mm;
            margin-bottom: 1mm;
            text-transform: uppercase;
            text-align: center;
        }

        /* Patient Info - Compact Table */
        .patient-table {
            width: 100%;
            font-size: 7px;
            margin-bottom: 2mm;
        }

        .patient-table td {
            padding: 0.5mm 1mm;
            border-bottom: 1px dotted #ddd;
        }

        .patient-label {
            font-weight: bold;
            width: 15mm;
            color: #555;
        }

        .patient-value {
            color: #333;
        }

        /* Serial Number - Compact */
        .serial-section {
            text-align: center;
            margin: 2mm 0;
            background: #f0f8ff;
            border: 1px solid #2c5aa0;
            padding: 1mm;
        }

        .serial-number {
            font-size: 11px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 0.5mm;
        }

        .serial-label {
            font-size: 6px;
            color: #666;
        }

        /* Appointment Card - Compact */
        .appointment-card {
            border: 1px solid #2c5aa0;
            padding: 1mm;
            background: #f8f9fa;
            text-align: center;
            margin-bottom: 2mm;
        }

        .appointment-date {
            font-size: 8px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 0.5mm;
        }

        .appointment-time {
            font-size: 8px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 0.5mm;
        }

        .appointment-status {
            font-size: 6px;
            padding: 0.5mm 1mm;
            border-radius: 1mm;
            display: inline-block;
            text-transform: uppercase;
            font-weight: bold;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .status-confirmed {
            background: #d4edda;
            color: #155724;
        }

        .status-completed {
            background: #cce5ff;
            color: #004085;
        }

        .status-cancelled {
            background: #f8d7da;
            color: #721c24;
        }

        /* Doctor Info - Compact */
        .doctor-card {
            border: 1px solid #28a745;
            padding: 1mm;
            background: #f1f8e9;
            margin-bottom: 2mm;
        }

        .doctor-name {
            font-size: 8px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 0.5mm;
        }

        .doctor-specialization {
            font-size: 6px;
            color: #388e3c;
            font-style: italic;
            margin-bottom: 0.5mm;
        }

        .consultation-fee {
            font-size: 7px;
            color: #1976d2;
            font-weight: bold;
        }

        /* Instructions - Very Compact */
        .instructions-compact {
            font-size: 6px;
            line-height: 1.2;
            color: #666;
            border: 1px dashed #ccc;
            padding: 1mm;
            background: #fafafa;
            margin-bottom: 1mm;
        }

        /* Footer - Fixed at Bottom */
        .receipt-footer {
            position: absolute;
            bottom: 1mm;
            left: 2mm;
            right: 2mm;
            text-align: center;
            font-size: 5px;
            color: #999;
            border-top: 1px dotted #ccc;
            padding-top: 0.5mm;
        }

        /* Print Styles */
        @media print {
            html, body {
                width: 80mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .receipt-container {
                width: 80mm !important;
                height: 100mm !important;
                padding: 2mm !important;
                overflow: hidden !important;
            }

            /* Force single page */
            body {
                page-break-after: avoid !important;
            }

            .info-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
            <div class="clinic-name">EYE HOSPITAL</div>
            <div class="slip-title">APPOINTMENT SLIP</div>
            <div class="slip-meta">
                Slip #{{ str_pad($appointment->id, 4, '0', STR_PAD_LEFT) }} • {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }}
            </div>
        </div>

        <!-- Patient Information -->
        <div class="info-section">
            <div class="section-title">Patient Details</div>
            <table class="patient-table">
                <tr>
                    <td class="patient-label">Name:</td>
                    <td class="patient-value">{{ $appointment->patient->name }}</td>
                </tr>
                <tr>
                    <td class="patient-label">ID:</td>
                    <td class="patient-value">{{ $appointment->patient->patient_id }}</td>
                </tr>
                <tr>
                    <td class="patient-label">Phone:</td>
                    <td class="patient-value">{{ $appointment->patient->phone ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="patient-label">Age:</td>
                    <td class="patient-value">
                        @if($appointment->patient->date_of_birth)
                            {{ \Carbon\Carbon::parse($appointment->patient->date_of_birth)->age }}Y
                        @else
                            N/A
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <!-- Serial Number -->
        <div class="serial-section">
            <div class="serial-number">{{ $appointment->serial_number ?? str_pad($appointment->id, 3, '0', STR_PAD_LEFT) }}</div>
            <div class="serial-label">YOUR SERIAL NUMBER</div>
        </div>

        <!-- Appointment Details -->
        <div class="info-section">
            <div class="section-title">Appointment Details</div>
            <div class="appointment-card">
                <div class="appointment-date">
                    {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('D, d M Y') }}
                </div>
                <div class="appointment-time">
                    {{ \Carbon\Carbon::parse($appointment->appointment_time)->format('h:i A') }}
                </div>
                <div class="appointment-status status-{{ strtolower($appointment->status) }}">
                    {{ ucfirst($appointment->status) }}
                </div>
            </div>
        </div>

        <!-- Doctor Information -->
        <div class="info-section">
            <div class="section-title">Doctor Details</div>
            <div class="doctor-card">
                <div class="doctor-name">Dr. {{ $appointment->doctor->user->name }}</div>
                @if($appointment->doctor->specialization)
                    <div class="doctor-specialization">{{ $appointment->doctor->specialization }}</div>
                @endif
                <div class="consultation-fee">
                    Fee: ৳{{ number_format($appointment->doctor->consultation_fee, 0) }}
                </div>
            </div>
        </div>

        <!-- Compact Instructions -->
        <div class="instructions-compact">
            <strong>Instructions:</strong> Arrive 15 min early • Bring medical records • Contact: 01XXXXXXXX for changes
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }} | Valid for scheduled date only
        </div>
    </div>
</body>
</html>
