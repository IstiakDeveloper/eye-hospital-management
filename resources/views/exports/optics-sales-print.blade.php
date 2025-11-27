<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Optics Sales Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 15mm;
            background: white;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
        }

        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 11px;
            margin: 2px 0;
        }

        .filter-info {
            margin: 10px 0;
            padding: 8px;
            background: #f5f5f5;
            border: 1px solid #ddd;
        }

        .filter-info p {
            margin: 3px 0;
            font-size: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        table thead {
            background: #333;
            color: white;
        }

        table th {
            padding: 8px 5px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid #333;
        }

        table th.text-right {
            text-align: right;
        }

        table th.text-center {
            text-align: center;
        }

        table td {
            padding: 6px 5px;
            border: 1px solid #ddd;
            font-size: 10px;
        }

        table td.text-right {
            text-align: right;
        }

        table td.text-center {
            text-align: center;
        }

        table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }

        table tbody tr:hover {
            background: #f0f0f0;
        }

        .total-row {
            font-weight: bold;
            background: #e9e9e9 !important;
            border-top: 2px solid #333;
        }

        .summary {
            margin-top: 20px;
            padding: 10px;
            background: #f5f5f5;
            border: 1px solid #ddd;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 8px;
        }

        .summary-item {
            padding: 8px;
            background: white;
            border: 1px solid #ddd;
        }

        .summary-item label {
            font-size: 9px;
            color: #666;
            display: block;
            margin-bottom: 3px;
        }

        .summary-item .value {
            font-size: 13px;
            font-weight: bold;
            color: #000;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
        }

        @media print {
            body {
                padding: 0;
            }

            .no-print {
                display: none;
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }

            thead {
                display: table-header-group;
            }
        }

        .print-button {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 20px;
            background: #333;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }

        .print-button:hover {
            background: #000;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>

    <div class="header">
        <h1>EYE HOSPITAL - OPTICS SALES REPORT</h1>
        <p>Sales History Report</p>
        <p>Generated: {{ now()->format('d M Y, h:i A') }}</p>
    </div>

    @if($dateFrom || $dateTo)
    <div class="filter-info">
        <strong>Filtered Report:</strong>
        @if($dateFrom)
            <p>From: {{ \Carbon\Carbon::parse($dateFrom)->format('d M Y') }}</p>
        @endif
        @if($dateTo)
            <p>To: {{ \Carbon\Carbon::parse($dateTo)->format('d M Y') }}</p>
        @endif
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">SL</th>
                <th style="width: 12%;">Invoice</th>
                <th style="width: 20%;">Patient Name</th>
                <th style="width: 12%;">Mobile</th>
                <th class="text-right" style="width: 12%;">Total</th>
                <th class="text-right" style="width: 12%;">Cash Receive</th>
                <th class="text-right" style="width: 10%;">Due</th>
                <th style="width: 14%;">Sold By</th>
            </tr>
        </thead>
        <tbody>
            @php
                $serialNo = 1;
                $grandTotal = 0;
                $grandCashReceive = 0;
                $grandDue = 0;
            @endphp

            @forelse($sales as $sale)
                @php
                    $grandTotal += $sale->total_amount;
                    $grandCashReceive += $sale->advance_payment;
                    $grandDue += $sale->due_amount;
                @endphp
                <tr>
                    <td class="text-center">{{ $serialNo++ }}</td>
                    <td><strong>{{ $sale->invoice_number }}</strong></td>
                    <td>{{ $sale->customer_name ?? 'Walk-in Customer' }}</td>
                    <td>{{ $sale->customer_phone ?? 'N/A' }}</td>
                    <td class="text-right"><strong>৳{{ number_format($sale->total_amount, 0) }}</strong></td>
                    <td class="text-right">৳{{ number_format($sale->advance_payment, 0) }}</td>
                    <td class="text-right">
                        <strong style="color: {{ $sale->due_amount > 0 ? '#dc2626' : '#16a34a' }};">
                            ৳{{ number_format($sale->due_amount, 0) }}
                        </strong>
                    </td>
                    <td>{{ $sale->seller->name ?? 'N/A' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center" style="padding: 20px;">
                        No sales records found.
                    </td>
                </tr>
            @endforelse

            @if($sales->count() > 0)
            <tr class="total-row">
                <td colspan="4" class="text-right"><strong>GRAND TOTAL:</strong></td>
                <td class="text-right"><strong>৳{{ number_format($grandTotal, 0) }}</strong></td>
                <td class="text-right"><strong>৳{{ number_format($grandCashReceive, 0) }}</strong></td>
                <td class="text-right"><strong style="color: {{ $grandDue > 0 ? '#dc2626' : '#16a34a' }};">৳{{ number_format($grandDue, 0) }}</strong></td>
                <td></td>
            </tr>
            @endif
        </tbody>
    </table>

    @if($sales->count() > 0)
    <div class="summary">
        <strong>Summary Statistics</strong>
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Transactions</label>
                <div class="value">{{ $sales->count() }}</div>
            </div>
            <div class="summary-item">
                <label>Total Sales Amount</label>
                <div class="value">৳{{ number_format($grandTotal, 0) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Cash Received</label>
                <div class="value" style="color: #16a34a;">৳{{ number_format($grandCashReceive, 0) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Due Amount</label>
                <div class="value" style="color: #dc2626;">৳{{ number_format($grandDue, 0) }}</div>
            </div>
            <div class="summary-item">
                <label>Collection Rate</label>
                <div class="value">{{ $grandTotal > 0 ? number_format(($grandCashReceive / $grandTotal) * 100, 1) : 0 }}%</div>
            </div>
            <div class="summary-item">
                <label>Average Sale</label>
                <div class="value">৳{{ $sales->count() > 0 ? number_format($grandTotal / $sales->count(), 0) : 0 }}</div>
            </div>
        </div>
    </div>
    @endif

    <div class="footer">
        <p>This is a computer-generated report. No signature required.</p>
        <p>Printed on: {{ now()->format('d M Y, h:i A') }}</p>
    </div>

    <script>
        // Auto print on load
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
