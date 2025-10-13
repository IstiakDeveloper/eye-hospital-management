import React, { useState, useEffect } from 'react';
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
    FileSpreadsheet
} from 'lucide-react';
import PrintModal from './PrintModal';

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

    // Safely get frames data
    const framesData = Array.isArray(frames) ? frames : (frames?.data || []);
    const framesTotal = Array.isArray(frames) ? frames.length : (frames?.total || 0);
    const framesFrom = Array.isArray(frames) ? (frames.length > 0 ? 1 : 0) : (frames?.from || 0);
    const framesTo = Array.isArray(frames) ? frames.length : (frames?.to || 0);
    const framesLinks = Array.isArray(frames) ? null : frames?.links;

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
            all: 'true'
        };

        router.get('/optics/frames', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['frames'],
            onSuccess: (page: any) => {
                const allFrames = Array.isArray(page.props.frames)
                    ? page.props.frames
                    : (page.props.frames?.data || []);
                setAllFramesForPrint(allFrames);
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
                        <p className="text-gray-600">Manage your frame inventory ({framesTotal} total frames)</p>
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
                    Showing {framesFrom} to {framesTo} of {framesTotal} frames
                </div>

                {/* Frames Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {framesData.map((frame: Frame) => {
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
                {framesData.length === 0 && (
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
                {framesLinks && framesData.length > 0 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {framesLinks.map((link: any, index: number) => (
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
