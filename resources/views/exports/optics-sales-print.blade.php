<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales History Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }

        .header h2 {
            font-size: 16px;
            color: #666;
            font-weight: normal;
        }

        .info-section {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
        }

        .info-item {
            font-size: 11px;
        }

        .info-item strong {
            color: #333;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
        }

        th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }

        td {
            font-size: 11px;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .status-badge {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }

        .status-pending { background-color: #fee; color: #c00; }
        .status-ready { background-color: #fef3cd; color: #856404; }
        .status-delivered { background-color: #d4edda; color: #155724; }

        .summary {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }

        .summary-box {
            border: 1px solid #333;
            padding: 15px;
            min-width: 300px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .summary-row.total {
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 8px;
            font-weight: bold;
            font-size: 14px;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        @media print {
            body {
                padding: 10px;
            }

            @page {
                margin: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Eye Hospital - Optics Department</h1>
        <h2>Sales History Report</h2>
        @if($dateFrom || $dateTo)
            <p style="margin-top: 10px; font-size: 12px;">
                Period:
                @if($dateFrom) {{ date('d M Y', strtotime($dateFrom)) }} @endif
                @if($dateFrom && $dateTo) - @endif
                @if($dateTo) {{ date('d M Y', strtotime($dateTo)) }} @endif
            </p>
        @endif
    </div>

    <div class="info-section">
        <div class="info-item">
            <strong>Generated:</strong> {{ date('d M Y h:i A') }}
        </div>
        <div class="info-item">
            <strong>Total Records:</strong> {{ $sales->count() }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Items</th>
                <th class="text-right">Total Amount</th>
                <th class="text-right">Advance</th>
                <th class="text-right">Due</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sales as $index => $sale)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $sale->invoice_number }}</td>
                    <td>{{ $sale->patient->name ?? 'N/A' }}</td>
                    <td>{{ $sale->created_at->format('d M Y') }}</td>
                    <td>{{ $sale->items->count() }} items</td>
                    <td class="text-right">৳{{ number_format($sale->total_amount, 0) }}</td>
                    <td class="text-right">৳{{ number_format($sale->advance_payment, 0) }}</td>
                    <td class="text-right">৳{{ number_format($sale->due_amount, 0) }}</td>
                    <td class="text-center">
                        <span class="status-badge status-{{ $sale->status }}">
                            {{ ucfirst($sale->status) }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-box">
            <div class="summary-row">
                <span>Total Sales:</span>
                <span>৳{{ number_format($totalSales, 0) }}</span>
            </div>
            <div class="summary-row">
                <span>Total Due:</span>
                <span>৳{{ number_format($totalDue, 0) }}</span>
            </div>
            <div class="summary-row total">
                <span>Total Collected:</span>
                <span>৳{{ number_format($totalSales - $totalDue, 0) }}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Eye Hospital Management System - Optics Sales Report</p>
        <p>This is a computer generated report</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
