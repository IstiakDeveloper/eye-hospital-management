<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Advance House Rent History - {{ $periodTitle }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin: 0 0 5px 0;
        }
        .header p {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 10px;
            border: 1px solid #d1d5db;
        }
        td {
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .opening-balance {
            background-color: #dbeafe !important;
            font-weight: bold;
        }
        .credit {
            color: #059669;
            font-weight: bold;
            text-align: right;
        }
        .debit {
            color: #dc2626;
            font-weight: bold;
            text-align: right;
        }
        .balance {
            color: #2563eb;
            font-weight: bold;
            text-align: right;
        }
        .text-right {
            text-align: right;
        }
        .totals-row {
            background-color: #e5e7eb !important;
            font-weight: bold;
            border-top: 2px solid #9ca3af;
        }
        .summary {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        .summary-card {
            width: 30%;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .summary-card.credit-card {
            border-color: #10b981;
            background-color: #d1fae5;
        }
        .summary-card.debit-card {
            border-color: #ef4444;
            background-color: #fee2e2;
        }
        .summary-card.balance-card {
            border-color: #3b82f6;
            background-color: #dbeafe;
        }
        .summary-card h3 {
            font-size: 11px;
            text-transform: uppercase;
            margin: 0 0 8px 0;
            color: #666;
        }
        .summary-card p {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Advance House Rent History</h1>
        <p>{{ $periodTitle }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 12%;">Date</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 18%;">Payment/Deduction No</th>
                <th style="width: 12%; text-align: right;">Credit (৳)</th>
                <th style="width: 12%; text-align: right;">Debit (৳)</th>
                <th style="width: 13%; text-align: right;">Balance (৳)</th>
            </tr>
        </thead>
        <tbody>
            <!-- Opening Balance -->
            <tr class="opening-balance">
                <td colspan="3"><strong>Opening Balance</strong></td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="balance">{{ number_format($previousBalance, 2) }}</td>
            </tr>

            <!-- Transactions -->
            @forelse($transactions as $transaction)
                <tr>
                    <td><strong>{{ $transaction['date'] }}</strong></td>
                    <td>
                        @if(count($transaction['details']) === 1)
                            {{ $transaction['details'][0]['description'] }}
                        @else
                            <strong>Multiple Transactions:</strong>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 10px;">
                                @foreach($transaction['details'] as $detail)
                                    <li>{{ $detail['description'] }}</li>
                                @endforeach
                            </ul>
                        @endif
                    </td>
                    <td style="font-family: monospace; font-size: 10px;">
                        @if(count($transaction['details']) === 1)
                            {{ $transaction['details'][0]['payment_number'] }}
                        @else
                            @foreach($transaction['details'] as $detail)
                                <div>{{ $detail['payment_number'] }}</div>
                            @endforeach
                        @endif
                    </td>
                    <td class="credit">
                        {{ $transaction['credit'] > 0 ? number_format($transaction['credit'], 2) : '-' }}
                    </td>
                    <td class="debit">
                        {{ $transaction['debit'] > 0 ? number_format($transaction['debit'], 2) : '-' }}
                    </td>
                    <td class="balance">{{ number_format($transaction['balance'], 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 30px; color: #999;">
                        No transactions found for this period
                    </td>
                </tr>
            @endforelse

            <!-- Totals -->
            @if(count($transactions) > 0)
                <tr class="totals-row">
                    <td colspan="3"><strong>Total</strong></td>
                    <td class="credit">{{ number_format($totalCredit, 2) }}</td>
                    <td class="debit">{{ number_format($totalDebit, 2) }}</td>
                    <td class="balance">{{ number_format($finalBalance, 2) }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    @if(count($transactions) > 0)
        <div class="summary">
            <div class="summary-card credit-card">
                <h3>Total Advance Paid</h3>
                <p style="color: #059669;">৳{{ number_format($totalCredit, 2) }}</p>
            </div>
            <div class="summary-card debit-card">
                <h3>Total Rent Deducted</h3>
                <p style="color: #dc2626;">৳{{ number_format($totalDebit, 2) }}</p>
            </div>
            <div class="summary-card balance-card">
                <h3>Closing Balance</h3>
                <p style="color: #2563eb;">৳{{ number_format($finalBalance, 2) }}</p>
            </div>
        </div>
    @endif

    <div class="footer">
        Generated on {{ now()->format('d M Y, h:i A') }} | Eye Hospital Management System
    </div>
</body>
</html>
