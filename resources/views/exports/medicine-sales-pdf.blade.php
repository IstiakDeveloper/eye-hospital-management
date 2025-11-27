<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medicine Sales History - PDF Export</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 22px;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .header h2 {
            font-size: 15px;
            color: #64748b;
            font-weight: normal;
        }

        .header p {
            margin-top: 8px;
            font-size: 11px;
            color: #475569;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
        }

        .info-item {
            font-size: 10px;
        }

        .info-item strong {
            color: #1e293b;
            display: block;
            margin-bottom: 2px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background-color: #2563eb;
            color: white;
            padding: 10px 6px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
        }

        td {
            padding: 8px 6px;
            font-size: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .status-badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            display: inline-block;
        }

        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-partial {
            background-color: #fef3c7;
            color: #92400e;
        }

        .status-pending {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .summary-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }

        .summary-box {
            border: 2px solid #2563eb;
            padding: 15px;
            min-width: 280px;
            background: #eff6ff;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
            color: #1e293b;
        }

        .summary-row.highlight {
            border-top: 2px solid #2563eb;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: 13px;
            color: #1e40af;
        }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #64748b;
        }

        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Eye Hospital - Pharmacy Department</h1>
        <h2>Medicine Sales History Report</h2>
        @if($dateFrom || $dateTo)
            <p>
                Report Period:
                @if($dateFrom) {{ date('d M Y', strtotime($dateFrom)) }} @endif
                @if($dateFrom && $dateTo) to @endif
                @if($dateTo) {{ date('d M Y', strtotime($dateTo)) }} @endif
            </p>
        @endif
    </div>

    <div class="info-grid">
        <div class="info-item">
            <strong>Generated On:</strong>
            {{ date('d M Y, h:i A') }}
        </div>
        <div class="info-item">
            <strong>Total Records:</strong>
            {{ $sales->count() }} transactions
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 13%;">Invoice</th>
                <th style="width: 18%;">Patient</th>
                <th style="width: 10%;">Date</th>
                <th style="width: 8%;">Items</th>
                <th style="width: 11%;" class="text-right">Total</th>
                <th style="width: 11%;" class="text-right">Paid</th>
                <th style="width: 10%;" class="text-right">Due</th>
                <th style="width: 10%;" class="text-right">Profit</th>
                <th style="width: 10%;" class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sales as $index => $sale)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $sale->invoice_number }}</strong></td>
                    <td>{{ $sale->patient->name ?? 'Walk-in' }}</td>
                    <td>{{ date('d M Y', strtotime($sale->sale_date)) }}</td>
                    <td class="text-center">{{ $sale->items->count() }}</td>
                    <td class="text-right"><strong>৳{{ number_format($sale->total_amount, 0) }}</strong></td>
                    <td class="text-right">৳{{ number_format($sale->paid_amount, 0) }}</td>
                    <td class="text-right">৳{{ number_format($sale->due_amount, 0) }}</td>
                    <td class="text-right">৳{{ number_format($sale->total_profit, 0) }}</td>
                    <td class="text-center">
                        <span class="status-badge status-{{ $sale->payment_status }}">
                            {{ ucfirst($sale->payment_status) }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary-section">
        <div class="summary-box">
            <div class="summary-row">
                <span>Total Sales Amount:</span>
                <span><strong>৳{{ number_format($totalSales, 0) }}</strong></span>
            </div>
            <div class="summary-row">
                <span>Total Profit:</span>
                <span><strong>৳{{ number_format($totalProfit, 0) }}</strong></span>
            </div>
            <div class="summary-row highlight">
                <span>Profit Margin:</span>
                <span>{{ $totalSales > 0 ? number_format(($totalProfit / $totalSales) * 100, 1) : 0 }}%</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Eye Hospital Management System</strong></p>
        <p>Pharmacy Department - Medicine Sales Report</p>
        <p>This is a computer-generated document and does not require a signature</p>
    </div>
</body>
</html>
