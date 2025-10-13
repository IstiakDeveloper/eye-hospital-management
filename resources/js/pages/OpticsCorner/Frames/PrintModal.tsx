import React, { useState, useRef } from 'react';
import { X, Printer, Calendar, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface Frame {
    id: number;
    sku: string;
    brand: string;
    model: string;
    type: string;
    frame_type: string;
    material: string;
    color?: string;
    gender: string;
    size?: string;
    selling_price: number;
    purchase_price: number;
    stock_quantity: number;
    minimum_stock_level: number;
    is_low_stock: boolean;
    is_active: boolean;
    full_name: string;
    formatted_size: string;
}

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    frames: Frame[];
}

const Input = ({ label, error, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'}`}
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

export default function PrintModal({ isOpen, onClose, frames }: PrintModalProps) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportingExcel, setExportingExcel] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const safeFrames = Array.isArray(frames) ? frames : [];

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Frames Inventory Report - ${selectedDate}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 9px;
                        line-height: 1.3;
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
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #2563eb;
                    }
                    .header h1 {
                        color: #1e293b;
                        font-size: 16px;
                        margin-bottom: 3px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    .header .date {
                        color: #2563eb;
                        font-size: 10px;
                        font-weight: 600;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    .summary-card {
                        padding: 8px;
                        border-radius: 4px;
                        text-align: center;
                        border: 1px solid;
                    }
                    .summary-card.total {
                        background: #eff6ff;
                        border-color: #2563eb;
                    }
                    .summary-card.in-stock {
                        background: #f0fdf4;
                        border-color: #16a34a;
                    }
                    .summary-card.low-stock {
                        background: #fffbeb;
                        border-color: #f59e0b;
                    }
                    .summary-card.out-stock {
                        background: #fef2f2;
                        border-color: #dc2626;
                    }
                    .summary-card .label {
                        font-size: 8px;
                        font-weight: 600;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                        color: #64748b;
                    }
                    .summary-card .value {
                        font-size: 16px;
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
                        padding: 5px 3px;
                        text-align: left;
                        font-size: 7px;
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
                        padding: 4px 3px;
                        font-size: 8px;
                        border: 1px solid #e2e8f0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .serial { text-align: center; font-weight: 600; width: 25px; }
                    .sku { color: #2563eb; font-weight: 600; font-size: 7px; }
                    .brand { font-weight: 600; }
                    .stock-col { text-align: center; font-weight: 700; width: 40px; }
                    .stock-ok { color: #16a34a; }
                    .stock-low { color: #f59e0b; }
                    .stock-out { color: #dc2626; }
                    .price { text-align: right; font-weight: 600; }
                    .profit-pos { color: #16a34a; }
                    .profit-neg { color: #dc2626; }
                    .badge {
                        display: inline-block;
                        padding: 1px 4px;
                        border-radius: 2px;
                        font-size: 6px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .badge-ok { background: #dcfce7; color: #166534; }
                    .badge-low { background: #fef3c7; color: #92400e; }
                    .badge-out { background: #fee2e2; color: #991b1b; }
                    .badge-active { background: #dbeafe; color: #1e40af; }
                    .badge-inactive { background: #f1f5f9; color: #64748b; }
                    .footer {
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #cbd5e1;
                        text-align: center;
                        font-size: 8px;
                        color: #64748b;
                    }
                    .footer-value {
                        font-weight: 700;
                        color: #1e293b;
                        font-size: 9px;
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

    const handleExportExcel = async () => {
        if (safeFrames.length === 0) {
            alert('No frames to export!');
            return;
        }

        setExportingExcel(true);

        try {
            const XLSX = await import('xlsx');

            const excelData = safeFrames.map((frame: Frame, index: number) => ({
                'SL': index + 1,
                'SKU': frame.sku,
                'Brand': frame.brand,
                'Model': frame.model,
                'Type': frame.type.replace('_', ' '),
                'Frame Type': frame.frame_type.replace('_', ' '),
                'Material': frame.material,
                'Color': frame.color || '-',
                'Gender': frame.gender,
                'Size': frame.formatted_size || '-',
                'Stock Quantity': frame.stock_quantity,
                'Minimum Stock': frame.minimum_stock_level,
                'Purchase Price': frame.purchase_price,
                'Selling Price': frame.selling_price,
                'Profit': frame.selling_price - frame.purchase_price,
                'Stock Value': frame.stock_quantity * frame.purchase_price,
                'Stock Status': frame.stock_quantity === 0 ? 'Out of Stock' :
                               frame.is_low_stock ? 'Low Stock' : 'In Stock',
                'Active Status': frame.is_active ? 'Active' : 'Inactive'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 5 },  { wch: 15 }, { wch: 15 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
                { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
                { wch: 15 }, { wch: 12 }
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Frames Inventory');

            const filename = `frames-inventory-${selectedDate}.xlsx`;
            XLSX.writeFile(wb, filename);

            setExportingExcel(false);
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Failed to export Excel. Please try again.');
            setExportingExcel(false);
        }
    };

    const totalFrames = safeFrames.length;
    const inStockCount = safeFrames.filter((f: Frame) => f.stock_quantity > 0 && !f.is_low_stock).length;
    const lowStockCount = safeFrames.filter((f: Frame) => f.is_low_stock).length;
    const outOfStockCount = safeFrames.filter((f: Frame) => f.stock_quantity === 0).length;
    const totalStockValue = safeFrames.reduce((sum: number, f: Frame) => sum + (f.stock_quantity * f.purchase_price), 0);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Printer className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Print Inventory Report</h3>
                                <p className="text-blue-100 text-sm">Professional A4 format report ({totalFrames} frames)</p>
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
                            disabled={totalFrames === 0 || exportingExcel}
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
                        </Button>
                        <Button variant="print" onClick={handlePrint} disabled={totalFrames === 0}>
                            <Printer className="w-4 h-4" />
                            <span>Print Report</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-gray-100">
                    {totalFrames === 0 ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No frames to print</h3>
                            <p className="text-gray-600">Please wait while frames are being loaded...</p>
                        </div>
                    ) : (
                        <div ref={printRef} className="print-container">
                            <div className="header">
                                <h1>FRAMES INVENTORY REPORT</h1>
                                <p className="date">{new Date(selectedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                            </div>

                            <div className="summary">
                                <div className="summary-card total">
                                    <div className="label">Total</div>
                                    <div className="value">{totalFrames}</div>
                                </div>
                                <div className="summary-card in-stock">
                                    <div className="label">In Stock</div>
                                    <div className="value">{inStockCount}</div>
                                </div>
                                <div className="summary-card low-stock">
                                    <div className="label">Low Stock</div>
                                    <div className="value">{lowStockCount}</div>
                                </div>
                                <div className="summary-card out-stock">
                                    <div className="label">Out Stock</div>
                                    <div className="value">{outOfStockCount}</div>
                                </div>
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th className="serial">#</th>
                                        <th>SKU</th>
                                        <th>Brand</th>
                                        <th>Model</th>
                                        <th>Type</th>
                                        <th>Frame</th>
                                        <th>Material</th>
                                        <th>Color</th>
                                        <th>Gender</th>
                                        <th>Size</th>
                                        <th>Stock</th>
                                        <th>Min</th>
                                        <th>Purchase</th>
                                        <th>Selling</th>
                                        <th>Profit</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeFrames.map((frame: Frame, index: number) => {
                                        const profit = frame.selling_price - frame.purchase_price;
                                        const stockStatus = frame.stock_quantity === 0
                                            ? { text: 'Out', class: 'badge-out', color: 'stock-out' }
                                            : frame.is_low_stock
                                            ? { text: 'Low', class: 'badge-low', color: 'stock-low' }
                                            : { text: 'OK', class: 'badge-ok', color: 'stock-ok' };

                                        return (
                                            <tr key={frame.id}>
                                                <td className="serial">{index + 1}</td>
                                                <td className="sku">{frame.sku}</td>
                                                <td className="brand">{frame.brand}</td>
                                                <td>{frame.model}</td>
                                                <td>{frame.type.replace('_', ' ')}</td>
                                                <td>{frame.frame_type.replace('_', ' ')}</td>
                                                <td>{frame.material}</td>
                                                <td>{frame.color || '-'}</td>
                                                <td>{frame.gender}</td>
                                                <td>{frame.formatted_size || '-'}</td>
                                                <td className={`stock-col ${stockStatus.color}`}>
                                                    {frame.stock_quantity}
                                                </td>
                                                <td className="stock-col">{frame.minimum_stock_level}</td>
                                                <td className="price">৳{frame.purchase_price.toLocaleString()}</td>
                                                <td className="price">৳{frame.selling_price.toLocaleString()}</td>
                                                <td className={`price ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                                                    ৳{profit.toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`badge ${stockStatus.class}`}>{stockStatus.text}</span>
                                                    {' '}
                                                    <span className={`badge ${frame.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                                        {frame.is_active ? 'ACT' : 'INA'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="footer">
                                <p>
                                    <span className="footer-value">Total Stock Value: ৳{totalStockValue.toLocaleString()}</span>
                                    {' • '}
                                    Total Frames: {totalFrames}
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
