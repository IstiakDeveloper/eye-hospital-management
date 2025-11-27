import React, { useState, useRef } from 'react';
import { X, Printer, Calendar, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Sale {
  id: number;
  transaction_no: string;
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  created_by: {
    name: string;
  };
}

interface SalesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
}

const Input = ({ label, error, className = '', ...props }: any) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

const Button = ({ children, className = '', variant = 'primary', disabled = false, ...props }: any) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
    print: 'bg-purple-600 text-white hover:bg-purple-700 disabled:hover:bg-purple-600',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant as keyof typeof variants]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default function SalesPrintModal({ isOpen, onClose, sales }: SalesPrintModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportingExcel, setExportingExcel] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const safeSales = Array.isArray(sales) ? sales : [];

  const extractCustomerName = (description: string) => {
    const parts = description.split(' - ');
    if (parts.length > 1) {
      const customerPart = parts[1].split(' | ')[0];
      return customerPart || 'N/A';
    }
    return 'N/A';
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN, undefined, null cases
    const numAmount = Number(amount) || 0;
    return `৳${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Optics Sales Report - ${selectedDate}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #000;
          }
          .print-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 8px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
          }
          .header h1 {
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 4px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .header .date {
            color: #2563eb;
            font-size: 11px;
            font-weight: 600;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .summary-card {
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid;
          }
          .summary-card.total {
            background: #eff6ff;
            border-color: #2563eb;
          }
          .summary-card.revenue {
            background: #f0fdf4;
            border-color: #16a34a;
          }
          .summary-card.average {
            background: #fef3f8;
            border-color: #a855f7;
          }
          .summary-card .label {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 3px;
            color: #64748b;
          }
          .summary-card .value {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
          }
          thead {
            background: #2563eb;
          }
          thead th {
            padding: 6px 4px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            border: 1px solid #1d4ed8;
            white-space: nowrap;
          }
          tbody tr {
            border-bottom: 1px solid #e2e8f0;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          tbody td {
            padding: 5px 4px;
            font-size: 9px;
            border: 1px solid #e2e8f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .serial { text-align: center; font-weight: 600; width: 30px; }
          .transaction { color: #2563eb; font-weight: 600; }
          .amount { text-align: right; font-weight: 700; color: #16a34a; }
          .footer {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 2px solid #cbd5e1;
            text-align: center;
            font-size: 9px;
            color: #64748b;
          }
          .footer-value {
            font-weight: 700;
            color: #1e293b;
            font-size: 10px;
          }
          tfoot {
            background: #f8fafc;
            border-top: 2px solid #cbd5e1;
          }
          tfoot td {
            padding: 8px 4px;
            font-weight: 700;
            font-size: 10px;
          }
          @media print {
            body { background: white; }
            .print-container { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportExcel = () => {
    if (safeSales.length === 0) {
      alert('No sales to export!');
      return;
    }

    setExportingExcel(true);

    try {
      const excelData = safeSales.map((sale: Sale, index: number) => ({
        'SL': index + 1,
        'Transaction No': sale.transaction_no,
        'Customer': extractCustomerName(sale.description),
        'Category': sale.category,
        'Amount': sale.amount,
        'Date': new Date(sale.transaction_date).toLocaleDateString(),
        'Created By': sale.created_by.name
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 },  // SL
        { wch: 20 }, // Transaction No
        { wch: 25 }, // Customer
        { wch: 15 }, // Category
        { wch: 15 }, // Amount
        { wch: 15 }, // Date
        { wch: 20 }  // Created By
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Optics Sales');

      const filename = `optics-sales-${selectedDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      setExportingExcel(false);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel. Please try again.');
      setExportingExcel(false);
    }
  };

  const totalSales = safeSales.length;

  // Calculate total revenue - ensure it's a valid number
  const totalRevenue = safeSales.reduce((sum: number, sale: Sale) => {
    const amount = Number(sale.amount) || 0;
    return sum + amount;
  }, 0);

  // Calculate average sale
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Print Sales Report</h3>
                <p className="text-blue-100 text-sm">Professional A4 format report ({totalSales} sales)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <Input
              type="date"
              label="Report Date"
              value={selectedDate}
              onChange={(e: any) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="success"
              onClick={handleExportExcel}
              disabled={totalSales === 0 || exportingExcel}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
            </Button>
            <Button variant="print" onClick={handlePrint} disabled={totalSales === 0}>
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </Button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          {totalSales === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales to print</h3>
              <p className="text-gray-600">Please wait while sales are being loaded...</p>
            </div>
          ) : (
            <div ref={printRef} className="print-container">
              {/* Header */}
              <div className="header">
                <h1>OPTICS SALES REPORT</h1>
                <p className="date">{new Date(selectedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>

              {/* Summary Cards */}
              <div className="summary">
                <div className="summary-card total">
                  <div className="label">Total Sales</div>
                  <div className="value">{totalSales}</div>
                </div>
                <div className="summary-card revenue">
                  <div className="label">Total Revenue</div>
                  <div className="value">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="summary-card average">
                  <div className="label">Average Sale</div>
                  <div className="value">{formatCurrency(averageSale)}</div>
                </div>
              </div>

              {/* Table */}
              <table>
                <thead>
                  <tr>
                    <th className="serial">#</th>
                    <th>Transaction No</th>
                    <th>Customer</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {safeSales.map((sale: Sale, index: number) => (
                    <tr key={sale.id}>
                      <td className="serial">{index + 1}</td>
                      <td className="transaction">{sale.transaction_no}</td>
                      <td>{extractCustomerName(sale.description)}</td>
                      <td>{sale.category}</td>
                      <td className="amount">{formatCurrency(sale.amount)}</td>
                      <td>{new Date(sale.transaction_date).toLocaleDateString()}</td>
                      <td>{sale.created_by.name}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '10px' }}>
                      <strong>Total:</strong>
                    </td>
                    <td className="amount" style={{ fontSize: '12px' }}>
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer */}
              <div className="footer">
                <p>
                  <span className="footer-value">Total Revenue: {formatCurrency(totalRevenue)}</span>
                  {' • '}
                  Total Sales: {totalSales}
                  {' • '}
                  Average Sale: {formatCurrency(averageSale)}
                  {' • '}
                  Generated: {new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
