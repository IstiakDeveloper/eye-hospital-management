<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Appointment Slip</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A5 portrait;
            margin: 15mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            line-height: 1.2;
            color: #333;
            background: white;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            padding: 10mm 0;
        }

        .slip-container {
            width: 70mm;
            max-width: 70mm;
            border: 2px dashed #666;
            padding: 4mm;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            border-bottom: 1px solid #333;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
        }

        .hospital-name {
            font-size: 11px;
            font-weight: bold;
            color: #2c5aa0;
            letter-spacing: 1px;
        }

        .slip-title {
            font-size: 9px;
            font-weight: bold;
            margin: 1mm 0;
        }

        .slip-meta {
            font-size: 6px;
            color: #666;
        }

        .section {
            margin-bottom: 3mm;
        }

        .section-title {
            font-size: 7px;
            font-weight: bold;
            background: #f5f5f5;
            padding: 1mm;
            text-align: center;
            border: 1px solid #ddd;
            margin-bottom: 2mm;
        }

        .patient-info {
            font-size: 6px;
        }

        .info-row {
            display: flex;
            margin-bottom: 1mm;
        }

        .info-left, .info-right {
            flex: 1;
        }

        .label {
            font-weight: bold;
            color: #555;
            margin-right: 2mm;
        }

        .value {
            color: #333;
        }

        .serial-box {
            text-align: center;
            background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
            border: 2px solid #2c5aa0;
            padding: 3mm;
            margin: 3mm 0;
            border-radius: 2mm;
        }

        .serial-number {
            font-size: 14px;
            font-weight: bold;
            color: #2c5aa0;
            letter-spacing: 1px;
        }

        .serial-label {
            font-size: 6px;
            color: #666;
            margin-top: 1mm;
        }

        .appointment-box {
            border: 2px solid #2c5aa0;
            padding: 2mm;
            text-align: center;
            background: #f8f9fa;
            border-radius: 2mm;
        }

        .apt-date {
            font-size: 8px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 1mm;
        }

        .apt-time {
            font-size: 8px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 1mm;
        }

        .apt-status {
            font-size: 6px;
            background: #fff3cd;
            color: #856404;
            padding: 1mm 2mm;
            border-radius: 1mm;
            display: inline-block;
            font-weight: bold;
        }

        .doctor-box {
            border: 2px solid #28a745;
            padding: 2mm;
            background: #f1f8e9;
            border-radius: 2mm;
        }

        .doctor-name {
            font-size: 8px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 1mm;
        }

        .doctor-spec {
            font-size: 6px;
            color: #388e3c;
            font-style: italic;
            margin-bottom: 1mm;
        }

        .doctor-fee {
            font-size: 7px;
            color: #1976d2;
            font-weight: bold;
        }

        .instructions {
            font-size: 6px;
            color: #666;
            border: 1px dashed #999;
            padding: 2mm;
            background: #fafafa;
            margin: 2mm 0;
            line-height: 1.3;
            border-radius: 1mm;
        }

        .footer {
            text-align: center;
            font-size: 5px;
            color: #999;
            border-top: 1px dotted #ccc;
            padding-top: 1mm;
            margin-top: 2mm;
        }

        /* Print specific styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
                display: block;
            }

            .slip-container {
                margin: 0 auto;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="slip-container">
        <div class="header">
            <div class="hospital-name">EYE HOSPITAL</div>
            <div class="slip-title">APPOINTMENT SLIP</div>
            <div class="slip-meta">#{{ str_pad($appointment->id, 4, '0', STR_PAD_LEFT) }} • {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }}</div>
        </div>

        <div class="section">
            <div class="section-title">PATIENT DETAILS</div>
            <div class="patient-info">
                <div class="info-row">
                    <div class="info-left">
                        <span class="label">Name:</span>
                        <span class="value">{{ Str::limit($appointment->patient->name, 14, '') }}</span>
                    </div>
                    <div class="info-right">
                        <span class="label">Age:</span>
                        <span class="value">
                            @if($appointment->patient->date_of_birth)
                                {{ \Carbon\Carbon::parse($appointment->patient->date_of_birth)->age }}Y
                            @else
                                N/A
                            @endif
                        </span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-left">
                        <span class="label">ID:</span>
                        <span class="value">{{ $appointment->patient->patient_id }}</span>
                    </div>
                    <div class="info-right">
                        <span class="label">Phone:</span>
                        <span class="value">{{ Str::limit($appointment->patient->phone ?? 'N/A', 10, '') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="serial-box">
            <div class="serial-number">{{ $appointment->serial_number ?? str_pad($appointment->id, 3, '0', STR_PAD_LEFT) }}</div>
            <div class="serial-label">YOUR SERIAL NUMBER</div>
        </div>

        <div class="section">
            <div class="section-title">APPOINTMENT</div>
            <div class="appointment-box">
                <div class="apt-date">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('D, d M Y') }}</div>
                <div class="apt-time">{{ \Carbon\Carbon::parse($appointment->appointment_time)->format('h:i A') }}</div>
                <div class="apt-status">{{ strtoupper($appointment->status) }}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">DOCTOR</div>
            <div class="doctor-box">
                <div class="doctor-name">Dr. {{ Str::limit($appointment->doctor->user->name, 18, '') }}</div>
                @if($appointment->doctor->specialization)
                    <div class="doctor-spec">{{ Str::limit($appointment->doctor->specialization, 16, '') }}</div>
                @endif
                <div class="doctor-fee">Consultation: ৳{{ number_format($appointment->doctor->consultation_fee, 0) }}</div>
            </div>
        </div>

        <div class="instructions">
            <strong>Instructions:</strong><br>
            • Arrive 15 minutes early<br>
            • Bring previous medical records<br>
            • Contact: 01XXXXXXXX for changes
        </div>

        <div class="footer">
            Generated: {{ \Carbon\Carbon::now()->format('d/m/Y h:i A') }}<br>
            Valid for scheduled appointment date only
        </div>
    </div>
</body>
</html>
