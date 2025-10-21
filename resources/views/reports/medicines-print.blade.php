<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medicine Stock Report</title>
    <style>
        @media print {
            @page {
                size: A4 landscape;
                margin: 1cm;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }

        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 12px;
            color: #666;
        }

        .print-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 10px;
            color: #666;
        }

        .btn-print {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 1000;
        }

        .btn-print:hover {
            background: #1d4ed8;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        thead {
            background: linear-gradient(to bottom, #2563eb, #1e40af);
            color: white;
        }

        th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #1e40af;
        }

        td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            font-size: 10px;
        }

        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        tbody tr:hover {
            background-color: #f3f4f6;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-active {
            background: #d1fae5;
            color: #065f46;
        }

        .status-inactive {
            background: #fee2e2;
            color: #991b1b;
        }

        .stock-normal {
            background: #d1fae5;
            color: #065f46;
        }

        .stock-reorder {
            background: #fef3c7;
            color: #92400e;
        }

        .stock-low {
            background: #fed7aa;
            color: #9a3412;
        }

        .stock-out {
            background: #fee2e2;
            color: #991b1b;
        }

        .summary {
            margin-top: 20px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 6px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .summary-item {
            text-align: center;
        }

        .summary-item strong {
            display: block;
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .summary-item span {
            font-size: 11px;
            color: #666;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
    </style>
</head>
<body>
    <button class="btn-print no-print" onclick="window.print()">🖨️ Print Report</button>

    <div class="container">
        <div class="header">
            <h1>Medicine Stock Report</h1>
            <p>Complete inventory listing with stock status and pricing details</p>
        </div>

        <div class="print-info">
            <div>
                <strong>Generated:</strong> {{ $generatedAt }}
            </div>
            <div>
                <strong>Total Medicines:</strong> {{ $medicines->count() }}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 3%;">#</th>
                    <th style="width: 18%;">Medicine Name</th>
                    <th style="width: 13%;">Generic Name</th>
                    <th style="width: 8%;">Type</th>
                    <th style="width: 12%;">Manufacturer</th>
                    <th style="width: 5%;" class="text-center">Unit</th>
                    <th style="width: 6%;" class="text-right">Stock</th>
                    <th style="width: 8%;" class="text-right">Sale Price</th>
                    <th style="width: 8%;" class="text-right">Avg Buy</th>
                    <th style="width: 8%;" class="text-right">Value</th>
                    <th style="width: 6%;" class="text-center">Status</th>
                    <th style="width: 5%;" class="text-center">Stock Status</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalValue = 0;
                    $inStockCount = 0;
                    $lowStockCount = 0;
                    $outOfStockCount = 0;
                @endphp

                @foreach($medicines as $index => $medicine)
                    @php
                        $stockValue = $medicine->total_stock * ($medicine->average_buy_price ?? 0);
                        $totalValue += $stockValue;

                        $stockStatus = 'Normal';
                        $stockClass = 'stock-normal';

                        if ($medicine->total_stock <= 0) {
                            $stockStatus = 'Out';
                            $stockClass = 'stock-out';
                            $outOfStockCount++;
                        } elseif ($medicine->stockAlert && $medicine->total_stock <= $medicine->stockAlert->minimum_stock) {
                            $stockStatus = 'Low';
                            $stockClass = 'stock-low';
                            $lowStockCount++;
                        } elseif ($medicine->stockAlert && $medicine->total_stock <= $medicine->stockAlert->reorder_level) {
                            $stockStatus = 'Reorder';
                            $stockClass = 'stock-reorder';
                        } else {
                            $inStockCount++;
                        }
                    @endphp

                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td><strong>{{ $medicine->name }}</strong></td>
                        <td>{{ $medicine->generic_name ?? 'N/A' }}</td>
                        <td>{{ $medicine->type }}</td>
                        <td>{{ $medicine->manufacturer ?? 'N/A' }}</td>
                        <td class="text-center">{{ $medicine->unit }}</td>
                        <td class="text-right"><strong>{{ number_format($medicine->total_stock) }}</strong></td>
                        <td class="text-right">৳{{ number_format($medicine->standard_sale_price, 2) }}</td>
                        <td class="text-right">৳{{ number_format($medicine->average_buy_price ?? 0, 2) }}</td>
                        <td class="text-right"><strong>৳{{ number_format($stockValue, 2) }}</strong></td>
                        <td class="text-center">
                            <span class="status-badge {{ $medicine->is_active ? 'status-active' : 'status-inactive' }}">
                                {{ $medicine->is_active ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                        <td class="text-center">
                            <span class="status-badge {{ $stockClass }}">{{ $stockStatus }}</span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background: #f3f4f6; font-weight: bold;">
                    <td colspan="9" class="text-right" style="padding: 12px 8px;">
                        <strong>Total Stock Value:</strong>
                    </td>
                    <td class="text-right" style="padding: 12px 8px; font-size: 12px; color: #1e40af;">
                        <strong>৳{{ number_format($totalValue, 2) }}</strong>
                    </td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
        </table>

        <div class="summary">
            <div class="summary-item">
                <strong>{{ $medicines->count() }}</strong>
                <span>Total Medicines</span>
            </div>
            <div class="summary-item">
                <strong style="color: #059669;">{{ $inStockCount }}</strong>
                <span>In Stock</span>
            </div>
            <div class="summary-item">
                <strong style="color: #d97706;">{{ $lowStockCount }}</strong>
                <span>Low Stock</span>
            </div>
            <div class="summary-item">
                <strong style="color: #dc2626;">{{ $outOfStockCount }}</strong>
                <span>Out of Stock</span>
            </div>
            <div class="summary-item">
                <strong style="color: #7c3aed;">৳{{ number_format($totalValue, 2) }}</strong>
                <span>Total Value</span>
            </div>
        </div>

        <div class="footer">
            <p>This is a computer-generated report. Generated on {{ $generatedAt }}</p>
            <p>© {{ date('Y') }} Eye Hospital Management System. All rights reserved.</p>
        </div>
    </div>

    <script>
        // Auto print on load (optional)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
