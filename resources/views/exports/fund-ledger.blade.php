<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fund Ledger - PDF Export</title>
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

        .text-green {
            color: #059669;
            font-weight: bold;
        }

        .text-red {
            color: #dc2626;
            font-weight: bold;
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

        tfoot {
            background-color: #f3f4f6;
            font-weight: bold;
        }

        tfoot td {
            border-top: 2px solid #2563eb;
            padding: 10px 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Eye Hospital - Fund Management</h1>
        <h2>Fund Ledger Report</h2>
        <p>
            @if($startDate && $endDate)
                Report Period: {{ $startDate }} to {{ $endDate }}
            @else
                All Transactions
            @endif
            @if($investorName)
                <br>Investor: <strong>{{ $investorName }}</strong>
            @endif
        </p>
    </div>

    <div class="info-grid">
        <div class="info-item">
            <strong>Generated On:</strong>
            {{ date('d M Y, h:i A') }}
        </div>
        <div class="info-item">
            <strong>Total Records:</strong>
            {{ count($ledgerData) }} transactions
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 10%;">Date</th>
                <th style="width: 18%;">Investor Name</th>
                <th style="width: 25%;">Description</th>
                <th style="width: 12%;" class="text-right">Previous Balance</th>
                <th style="width: 12%;" class="text-right">Fund In</th>
                <th style="width: 11%;" class="text-right">Fund Out</th>
                <th style="width: 12%;" class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @forelse($ledgerData as $item)
                <tr>
                    <td>{{ $item['date'] }}</td>
                    <td><strong>{{ $item['investor_name'] }}</strong></td>
                    <td>{{ $item['description'] }}</td>
                    <td class="text-right"><strong>৳{{ number_format($item['previous_balance'], 2) }}</strong></td>
                    <td class="text-right text-green">
                        @if($item['fund_in'] > 0)
                            ৳{{ number_format($item['fund_in'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="text-right text-red">
                        @if($item['fund_out'] > 0)
                            ৳{{ number_format($item['fund_out'], 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="text-right"><strong>৳{{ number_format($item['balance'], 2) }}</strong></td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center">No transactions found</td>
                </tr>
            @endforelse
        </tbody>
        @if(count($ledgerData) > 0)
            <tfoot>
                <tr>
                    <td colspan="4">TOTAL</td>
                    <td class="text-right text-green">৳{{ number_format($totalFundIn, 2) }}</td>
                    <td class="text-right text-red">৳{{ number_format($totalFundOut, 2) }}</td>
                    <td class="text-right">৳{{ number_format($finalBalance, 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <div class="summary-section">
        <div class="summary-box">
            <div class="summary-row">
                <span>Total Fund In:</span>
                <span class="text-green">৳{{ number_format($totalFundIn, 2) }}</span>
            </div>
            <div class="summary-row">
                <span>Total Fund Out:</span>
                <span class="text-red">৳{{ number_format($totalFundOut, 2) }}</span>
            </div>
            <div class="summary-row highlight">
                <span>Final Balance:</span>
                <span>৳{{ number_format($finalBalance, 2) }}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Eye Hospital Management System</strong></p>
        <p>Hospital Account - Fund Ledger Report</p>
        <p>This is a computer-generated document and does not require a signature</p>
    </div>
</body>
</html>
