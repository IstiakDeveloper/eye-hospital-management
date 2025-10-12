import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Plus,
    Search,
    Edit3,
    Package,
    AlertTriangle,
    Filter,
    X,
    ToggleLeft,
    ToggleRight,
    Trash2,
    XCircle,
    CheckCircle,
    Printer,
    Calendar
} from 'lucide-react';

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

interface FilterOptions {
    types: string[];
    frame_types: string[];
    materials: string[];
    genders: string[];
    colors: string[];
}

const Button = ({ children, className = '', variant = 'primary', disabled = false, ...props }: any) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200',
        success: 'bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:hover:bg-transparent',
        print: 'bg-purple-600 text-white hover:bg-purple-700 disabled:hover:bg-purple-600'
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

const Input = ({ label, error, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <input
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

const Select = ({ label, error, children, className = '', ...props }: any) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <select
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
                }`}
            {...props}
        >
            {children}
        </select>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

// Print Modal Component
const PrintModal = ({ isOpen, onClose, frames }: any) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Safety check for frames
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

    const totalFrames = safeFrames.length;
    const inStockCount = safeFrames.filter((f: Frame) => f.stock_quantity > 0 && !f.is_low_stock).length;
    const lowStockCount = safeFrames.filter((f: Frame) => f.is_low_stock).length;
    const outOfStockCount = safeFrames.filter((f: Frame) => f.stock_quantity === 0).length;
    const totalStockValue = safeFrames.reduce((sum: number, f: Frame) => sum + (f.stock_quantity * f.purchase_price), 0);

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
                        <Button variant="print" onClick={handlePrint} disabled={totalFrames === 0}>
                            <Printer className="w-4 h-4" />
                            <span>Print Report</span>
                        </Button>
                    </div>
                </div>

                {/* Print Preview */}
                <div className="flex-1 overflow-auto p-6 bg-gray-100">
                    {totalFrames === 0 ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No frames to print</h3>
                            <p className="text-gray-600">Please wait while frames are being loaded...</p>
                        </div>
                    ) : (
                        <div ref={printRef} className="print-container">
                            {/* Header */}
                            <div className="header">
                                <h1>FRAMES INVENTORY REPORT</h1>
                                <p className="date">{new Date(selectedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                            </div>

                            {/* Summary Cards */}
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

                            {/* Table */}
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

                            {/* Footer */}
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
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ frame, isOpen, onClose, onConfirm }: any) => {
    if (!isOpen || !frame) return null;

    const refundAmount = frame.stock_quantity * frame.purchase_price;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Frame</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">{frame.full_name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">SKU:</span> {frame.sku}</p>
                            <p><span className="font-medium">Type:</span> {frame.type.replace('_', ' ')}</p>
                            <p><span className="font-medium">Material:</span> {frame.material}</p>
                            <p><span className="font-medium">Current Stock:</span> {frame.stock_quantity} pieces</p>
                            <p><span className="font-medium">Purchase Price:</span> ৳{frame.purchase_price.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-red-800 mb-1">This action cannot be undone!</p>
                                <ul className="text-red-700 space-y-1">
                                    <li>• Frame will be permanently deleted</li>
                                    <li>• All stock movement history will be removed</li>
                                    <li>• Frame cannot be recovered after deletion</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {frame.stock_quantity > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-800 mb-1">Stock Refund</p>
                                    <p className="text-green-700">
                                        ৳{refundAmount.toLocaleString()} will be refunded to your account
                                        <br />
                                        ({frame.stock_quantity} pieces × ৳{frame.purchase_price.toLocaleString()})
                                    </p>
                                    <p className="text-green-600 text-xs mt-1">
                                        This amount will be added to both Optics Account and Main Account
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                            Delete Frame
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function FramesIndex({ frames, filterOptions }: { frames: any, filterOptions: FilterOptions }) {
    const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') || '');
    const [filters, setFilters] = useState({
        type: new URLSearchParams(window.location.search).get('type') || '',
        frame_type: new URLSearchParams(window.location.search).get('frame_type') || '',
        material: new URLSearchParams(window.location.search).get('material') || '',
        gender: new URLSearchParams(window.location.search).get('gender') || '',
        color: new URLSearchParams(window.location.search).get('color') || '',
        status: new URLSearchParams(window.location.search).get('status') || '',
        low_stock: new URLSearchParams(window.location.search).get('low_stock') === 'true',
        in_stock: new URLSearchParams(window.location.search).get('in_stock') === 'true',
        out_of_stock: new URLSearchParams(window.location.search).get('out_of_stock') === 'true'
    });

    const [showFilters, setShowFilters] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [frameToDelete, setFrameToDelete] = useState<Frame | null>(null);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [allFramesForPrint, setAllFramesForPrint] = useState<Frame[]>([]);
    const [loadingAllFrames, setLoadingAllFrames] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== new URLSearchParams(window.location.search).get('search')) {
                handleSearch();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        handleSearch();
    }, [filters]);

    const handleSearch = () => {
        const params = {
            search: search || undefined,
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== false)
            )
        };

        router.get('/optics/frames', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setSearch('');
        setFilters({
            type: '',
            frame_type: '',
            material: '',
            gender: '',
            color: '',
            status: '',
            low_stock: false,
            in_stock: false,
            out_of_stock: false
        });
        router.get('/optics/frames', {}, { preserveState: true });
    };

    const toggleFrameStatus = (frameId: number, currentStatus: boolean) => {
        router.patch(`/optics/frames/${frameId}/toggle-status`, {}, {
            onSuccess: () => {
                // Refresh the page to show updated status
            }
        });
    };

    const openDeleteModal = (frame: Frame) => {
        setFrameToDelete(frame);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setFrameToDelete(null);
    };

    const confirmDelete = () => {
        if (frameToDelete) {
            router.delete(`/optics/frames/${frameToDelete.id}`, {
                onSuccess: () => {
                    closeDeleteModal();
                },
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    alert('Failed to delete frame. Please try again.');
                }
            });
        }
    };

    const fetchAllFramesForPrint = () => {
        setLoadingAllFrames(true);

        const params = {
            search: search || undefined,
            ...Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== false)
            ),
            all: 'true' // Flag to get all records
        };

        router.get('/optics/frames', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['frames'],
            onSuccess: (page: any) => {
                setAllFramesForPrint(page.props.frames.data || page.props.frames);
                setLoadingAllFrames(false);
                setPrintModalOpen(true);
            },
            onError: () => {
                setLoadingAllFrames(false);
                alert('Failed to load all frames. Please try again.');
            }
        });
    };

    const hasActiveFilters = search || Object.values(filters).some(v => v !== '' && v !== false);

    const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

    const getStockStatus = (frame: Frame) => {
        if (frame.stock_quantity === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
        if (frame.is_low_stock) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
        return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
    };

    return (
        <AdminLayout>
            <Head title="Frames Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Frames Management</h1>
                        <p className="text-gray-600">Manage your frame inventory ({frames.total} total frames)</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            variant="print"
                            onClick={fetchAllFramesForPrint}
                            disabled={loadingAllFrames}
                        >
                            <Printer className="w-4 h-4" />
                            <span>{loadingAllFrames ? 'Loading...' : 'Print Report'}</span>
                        </Button>
                        <Link href="/optics/frames/create">
                            <Button>
                                <Plus className="w-4 h-4" />
                                <span>Add Frame</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6">
                        <div className="flex flex-col space-y-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        placeholder="Search by brand, model, SKU, color, size, material..."
                                        value={search}
                                        onChange={(e: any) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span>Filters</span>
                                </Button>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        <X className="w-4 h-4" />
                                        <span>Clear</span>
                                    </Button>
                                )}
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t">
                                    <Select
                                        label="Status"
                                        value={filters.status}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, status: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Frames</option>
                                        <option value="active">Active Only</option>
                                        <option value="inactive">Inactive Only</option>
                                    </Select>

                                    <Select
                                        label="Type"
                                        value={filters.type}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, type: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Types</option>
                                        {filterOptions.types.map(type => (
                                            <option key={type} value={type} className="capitalize">
                                                {type.replace('_', ' ')}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Frame Type"
                                        value={filters.frame_type}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, frame_type: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Frame Types</option>
                                        {filterOptions.frame_types.map(frameType => (
                                            <option key={frameType} value={frameType} className="capitalize">
                                                {frameType.replace('_', ' ')}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Material"
                                        value={filters.material}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, material: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Materials</option>
                                        {filterOptions.materials.map(material => (
                                            <option key={material} value={material} className="capitalize">
                                                {material}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Gender"
                                        value={filters.gender}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, gender: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Genders</option>
                                        {filterOptions.genders.map(gender => (
                                            <option key={gender} value={gender} className="capitalize">
                                                {gender}
                                            </option>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Color"
                                        value={filters.color}
                                        onChange={(e: any) => {
                                            setFilters(prev => ({ ...prev, color: e.target.value }));
                                        }}
                                    >
                                        <option value="">All Colors</option>
                                        {filterOptions.colors.map(color => color && (
                                            <option key={color} value={color} className="capitalize">
                                                {color}
                                            </option>
                                        ))}
                                    </Select>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Stock Status</label>
                                        <div className="space-y-1">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.low_stock}
                                                    onChange={(e) => {
                                                        setFilters(prev => ({ ...prev, low_stock: e.target.checked }));
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Low Stock</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.out_of_stock}
                                                    onChange={(e) => {
                                                        setFilters(prev => ({ ...prev, out_of_stock: e.target.checked }));
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Out of Stock</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.in_stock}
                                                    onChange={(e) => {
                                                        setFilters(prev => ({ ...prev, in_stock: e.target.checked }));
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">In Stock</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {search && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                Search: "{search}"
                            </span>
                        )}
                        {Object.entries(filters).map(([key, value]) =>
                            value && value !== '' && value !== false && (
                                <span key={key} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                    {key.replace('_', ' ')}: {typeof value === 'boolean' ? 'Yes' : value}
                                </span>
                            )
                        )}
                    </div>
                )}

                {/* Results count */}
                <div className="text-sm text-gray-600">
                    Showing {frames.from || 0} to {frames.to || 0} of {frames.total} frames
                </div>

                {/* Frames Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {frames.data.map((frame: Frame) => {
                        const stockStatus = getStockStatus(frame);

                        return (
                            <div key={frame.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow ${!frame.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{frame.brand}</h3>
                                                {!frame.is_active && (
                                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">Model: {frame.model}</p>
                                            <p className="text-xs text-gray-500">SKU: {frame.sku}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                            {stockStatus.text}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Type:</span>
                                            <span className="capitalize font-medium">{frame.type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Frame:</span>
                                            <span className="capitalize">{frame.frame_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Material:</span>
                                            <span className="capitalize">{frame.material}</span>
                                        </div>
                                        {frame.color && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Color:</span>
                                                <span className="capitalize">{frame.color}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Gender:</span>
                                            <span className="capitalize">{frame.gender}</span>
                                        </div>
                                        {frame.size && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Size:</span>
                                                <span>{frame.formatted_size}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Stock:</span>
                                            <span className={`font-medium ${frame.stock_quantity === 0 ? 'text-red-600' :
                                                frame.is_low_stock ? 'text-orange-600' : 'text-green-600'
                                                }`}>
                                                {frame.stock_quantity} pcs
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="text-xs text-gray-600">Purchase</p>
                                                <p className="font-semibold text-gray-900">{formatCurrency(frame.purchase_price)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600">Selling</p>
                                                <p className="font-semibold text-green-600">{formatCurrency(frame.selling_price)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600">Profit</p>
                                                <p className={`font-semibold ${frame.selling_price - frame.purchase_price >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(frame.selling_price - frame.purchase_price)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex space-x-2">
                                                <Link href={`/optics/frames/${frame.id}/edit`} className="flex-1">
                                                    <Button variant="secondary" className="w-full justify-center text-sm">
                                                        <Edit3 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </Button>
                                                </Link>
                                                <Link href={`/optics/stock/add?item_type=glasses&item_id=${frame.id}`}>
                                                    <Button variant="success" className="text-sm">
                                                        <Package className="w-3 h-3" />
                                                        <span>Stock</span>
                                                    </Button>
                                                </Link>
                                            </div>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => toggleFrameStatus(frame.id, frame.is_active)}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${frame.is_active
                                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {frame.is_active ? (
                                                        <>
                                                            <ToggleLeft className="w-4 h-4" />
                                                            <span>Deactivate</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleRight className="w-4 h-4" />
                                                            <span>Activate</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => openDeleteModal(frame)}
                                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
                                                    title="Delete Frame"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {frames.data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Package className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No frames found</h3>
                        <p className="text-gray-600 mb-4">
                            {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first frame'}
                        </p>
                        {hasActiveFilters ? (
                            <Button onClick={clearFilters}>Clear Filters</Button>
                        ) : (
                            <Link href="/optics/frames/create">
                                <Button>
                                    <Plus className="w-4 h-4" />
                                    <span>Add Frame</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {frames.links && frames.data.length > 0 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {frames.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveState: true,
                                                preserveScroll: false
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                        ? 'bg-blue-600 text-white'
                                        : link.url
                                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Print Modal */}
                <PrintModal
                    isOpen={printModalOpen}
                    onClose={() => {
                        setPrintModalOpen(false);
                        setAllFramesForPrint([]);
                    }}
                    frames={allFramesForPrint}
                />

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    frame={frameToDelete}
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDelete}
                />
            </div>
        </AdminLayout>
    );
}
