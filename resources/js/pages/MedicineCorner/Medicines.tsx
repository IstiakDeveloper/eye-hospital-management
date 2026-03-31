import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronDown,
    Download,
    Edit,
    Eye,
    Filter,
    Minus,
    Package,
    Pill,
    Plus,
    Printer,
    Search,
    Settings,
    TrendingDown,
    TrendingUp,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    type: string;
    manufacturer: string;
    standard_sale_price: number;
    actual_sale_price?: number;
    average_buy_price?: number; // ✅ Add average purchase price
    total_stock: number;
    unit: string;
    is_active: boolean;
    has_stock?: boolean;
    stocks_count: number;
    stock_alert?: {
        minimum_stock: number;
        reorder_level: number;
        low_stock_alert: boolean;
        expiry_alert: boolean;
    };
}

interface FilterOptions {
    types: string[];
    manufacturers: string[];
}

interface Stats {
    total_medicines: number;
    active_medicines: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    total_stock_value: number;
}

interface MedicinesPageProps {
    medicines: {
        data: Medicine[];
        links?: any[];
        meta?: any;
        total: number;
        from: number;
        to: number;
    };
    filterOptions: FilterOptions;
    stats: Stats;
    filters: {
        search?: string;
        type?: string;
        manufacturer?: string;
        stock_status?: string;
        active?: boolean;
        sort_by?: string;
        sort_order?: string;
    };
}

export default function Medicines({ medicines, filterOptions, stats, filters }: MedicinesPageProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [localFilters, setLocalFilters] = useState({
        type: filters.type || '',
        manufacturer: filters.manufacturer || '',
        stock_status: filters.stock_status || '',
        active: filters.active ?? true,
        sort_by: filters.sort_by || 'name',
        sort_order: filters.sort_order || 'asc',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

    // Sale price quick edit
    const [showSalePriceModal, setShowSalePriceModal] = useState(false);
    const [salePriceMedicine, setSalePriceMedicine] = useState<Medicine | null>(null);
    const [salePriceInput, setSalePriceInput] = useState<string>('');

    // Auto search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== filters.search) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Apply filters when they change
    useEffect(() => {
        applyFilters();
    }, [localFilters]);

    const applyFilters = () => {
        const params = {
            search: search || undefined,
            ...Object.fromEntries(Object.entries(localFilters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)),
        };

        router.get('/medicine-corner/medicines', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setLocalFilters({
            type: '',
            manufacturer: '',
            stock_status: '',
            active: true,
            sort_by: 'name',
            sort_order: 'asc',
        });
        router.get('/medicine-corner/medicines', { active: true }, { preserveState: true });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
        })
            .format(amount)
            .replace('BDT', '৳');
    };

    const getStockStatus = (medicine: Medicine) => {
        if (!medicine.has_stock || medicine.total_stock <= 0) return 'out';
        if (!medicine.stock_alert) return medicine.total_stock > 0 ? 'normal' : 'out';
        if (medicine.total_stock <= medicine.stock_alert.minimum_stock) return 'low';
        if (medicine.total_stock <= medicine.stock_alert.reorder_level) return 'reorder';
        return 'normal';
    };

    const getStockStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; text: string; icon: any }> = {
            out: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Out of Stock', icon: X },
            low: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Low Stock', icon: TrendingDown },
            reorder: { color: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Reorder Level', icon: Minus },
            normal: { color: 'bg-green-100 text-green-800 border-green-200', text: 'In Stock', icon: TrendingUp },
        };
        return configs[status] || configs.normal;
    };

    const handleSort = (field: string) => {
        const newOrder = localFilters.sort_by === field && localFilters.sort_order === 'asc' ? 'desc' : 'asc';
        setLocalFilters((prev) => ({ ...prev, sort_by: field, sort_order: newOrder }));
    };

    const viewMedicineDetails = async (medicine: Medicine) => {
        try {
            const response = await fetch(`/medicine-corner/medicines/${medicine.id}/details`);
            const data = await response.json();

            if (data.success) {
                setSelectedMedicine({ ...medicine, ...data.medicine });
                setShowMedicineModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch medicine details:', error);
        }
    };

    const openSalePriceEditor = (medicine: Medicine) => {
        setSalePriceMedicine(medicine);
        setSalePriceInput(String(medicine.standard_sale_price ?? 0));
        setShowSalePriceModal(true);
    };

    const submitSalePriceUpdate = () => {
        if (!salePriceMedicine) return;

        const value = parseFloat(salePriceInput);
        if (Number.isNaN(value) || value < 0) return;

        router.put(
            route('medicine-corner.update-sale-price', salePriceMedicine.id),
            { standard_sale_price: value },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowSalePriceModal(false);
                    setSalePriceMedicine(null);
                },
            },
        );
    };

    const hasActiveFilters =
        search || Object.values(localFilters).some((v) => v !== '' && v !== null && v !== undefined && v !== true && v !== 'name' && v !== 'asc');

    const handleExport = (format: 'excel' | 'print') => {
        const params: Record<string, any> = {
            export: format,
        };

        // Add search if present
        if (search) {
            params.search = search;
        }

        // Add filters, but handle active filter specially
        Object.entries(localFilters).forEach(([key, value]) => {
            // Skip empty values
            if (value === '' || value === null || value === undefined) {
                return;
            }

            // For active filter, only add if it's explicitly false (we want inactive too)
            // Don't add if it's true (default behavior)
            if (key === 'active' && value === true) {
                return;
            }

            // Skip default sort values
            if ((key === 'sort_by' && value === 'name') || (key === 'sort_order' && value === 'asc')) {
                return;
            }

            params[key] = value;
        });

        // Create URL with query parameters
        const queryString = new URLSearchParams(params).toString();
        const url = `/medicine-corner/medicines?${queryString}`;

        if (format === 'print') {
            // Open in new window for printing
            window.open(url, '_blank');
        } else {
            // Download Excel file
            window.location.href = url;
        }
    };

    return (
        <AdminLayout>
            <Head title="Medicine Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine Management</h1>
                        <p className="mt-1 text-gray-600">Manage your medicine catalog and inventory ({medicines.total} total medicines)</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport('print')}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                            title="Print Report"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                            title="Download Excel"
                        >
                            <Download className="h-4 w-4" />
                            Excel
                        </button>
                        <button
                            onClick={() => setShowMedicineModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Medicine
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Total</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total_medicines}</p>
                            </div>
                            <Pill className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Active</p>
                                <p className="text-xl font-bold text-green-600">{stats.active_medicines}</p>
                            </div>
                            <Package className="h-5 w-5 text-green-600" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">In Stock</p>
                                <p className="text-xl font-bold text-blue-600">{stats.in_stock}</p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Low Stock</p>
                                <p className="text-xl font-bold text-red-600">{stats.low_stock}</p>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Out of Stock</p>
                                <p className="text-xl font-bold text-gray-600">{stats.out_of_stock}</p>
                            </div>
                            <X className="h-5 w-5 text-gray-600" />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Stock Value</p>
                                <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.total_stock_value)}</p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="p-6">
                        <div className="flex flex-col space-y-4">
                            {/* Search Bar */}
                            <div className="flex space-x-4">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search medicines by name, generic name, manufacturer..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors ${
                                        showFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                                        <select
                                            value={localFilters.type}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, type: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Categories</option>
                                            {filterOptions.types.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Manufacturer</label>
                                        <select
                                            value={localFilters.manufacturer}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, manufacturer: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Manufacturers</option>
                                            {filterOptions.manufacturers.map((manufacturer) => (
                                                <option key={manufacturer} value={manufacturer}>
                                                    {manufacturer}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Stock Status</label>
                                        <select
                                            value={localFilters.stock_status}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, stock_status: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">All Stock Status</option>
                                            <option value="in_stock">In Stock</option>
                                            <option value="low_stock">Low Stock</option>
                                            <option value="reorder_level">Reorder Level</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Sort By</label>
                                        <select
                                            value={localFilters.sort_by}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, sort_by: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="name">Name</option>
                                            <option value="type">Category</option>
                                            <option value="stock">Stock Quantity</option>
                                            <option value="price">Sale Price</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Order</label>
                                        <select
                                            value={localFilters.sort_order}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, sort_order: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {search && <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">Search: "{search}"</span>}
                        {Object.entries(localFilters).map(
                            ([key, value]) =>
                                value &&
                                value !== '' &&
                                value !== true &&
                                value !== 'name' &&
                                value !== 'asc' && (
                                    <span key={key} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                                        {key.replace('_', ' ')}: {value}
                                    </span>
                                ),
                        )}
                    </div>
                )}

                {/* Results Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Showing {medicines.from || 0} to {medicines.to || 0} of {medicines.total} medicines
                    </span>
                    <span>{hasActiveFilters && `${medicines.total} filtered results`}</span>
                </div>

                {/* Medicine Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {medicines.data.map((medicine) => {
                        const stockStatus = getStockStatus(medicine);
                        const statusConfig = getStockStatusConfig(stockStatus);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={medicine.id}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900">{medicine.name}</h3>
                                            {medicine.generic_name && <p className="line-clamp-1 text-sm text-gray-600">{medicine.generic_name}</p>}
                                        </div>
                                        <div
                                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.text}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mb-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Category:</span>
                                            <span className="text-sm font-medium text-gray-900 capitalize">{medicine.type}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Stock:</span>
                                            <span
                                                className={`text-sm font-medium ${
                                                    medicine.total_stock <= 0
                                                        ? 'text-red-600'
                                                        : stockStatus === 'low'
                                                          ? 'text-red-600'
                                                          : stockStatus === 'reorder'
                                                            ? 'text-amber-600'
                                                            : 'text-green-600'
                                                }`}
                                            >
                                                {medicine.total_stock} {medicine.unit}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Batches:</span>
                                            <span className="text-sm text-gray-900">{medicine.stocks_count}</span>
                                        </div>

                                        {medicine.average_buy_price && medicine.average_buy_price > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Avg Buy Price:</span>
                                                <span className="text-sm font-semibold text-amber-600">
                                                    {formatCurrency(medicine.average_buy_price)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Sale Price:</span>
                                            <span className="text-sm font-semibold text-green-600">
                                                {formatCurrency(medicine.standard_sale_price)}
                                            </span>
                                        </div>

                                        {medicine.manufacturer && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Manufacturer:</span>
                                                <span className="ml-2 max-w-[120px] truncate text-sm text-gray-900" title={medicine.manufacturer}>
                                                    {medicine.manufacturer}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stock Progress Bar */}
                                    {medicine.stock_alert && medicine.stock_alert.reorder_level > 0 && (
                                        <div className="mb-4">
                                            <div className="mb-1 flex justify-between text-xs text-gray-600">
                                                <span>Stock Level</span>
                                                <span>
                                                    {medicine.total_stock}/{medicine.stock_alert.reorder_level}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        stockStatus === 'low' || stockStatus === 'out'
                                                            ? 'bg-red-500'
                                                            : stockStatus === 'reorder'
                                                              ? 'bg-amber-500'
                                                              : 'bg-green-500'
                                                    }`}
                                                    style={{
                                                        width: `${Math.min((medicine.total_stock / medicine.stock_alert.reorder_level) * 100, 100)}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                                        <button
                                            onClick={() => viewMedicineDetails(medicine)}
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Details
                                        </button>

                                        <Link
                                            href={`/medicine-corner/purchase?medicine_id=${medicine.id}`}
                                            className="inline-flex items-center justify-center rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                                            title="Add Stock"
                                        >
                                            <Package className="h-4 w-4" />
                                        </Link>

                                        <button
                                            onClick={() => openSalePriceEditor(medicine)}
                                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-700"
                                            title="Edit Medicine"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>

                                        <button
                                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-700"
                                            title="Settings"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {medicines.data.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                        <Pill className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900">No medicines found</h3>
                        <p className="mb-6 text-gray-600">
                            {hasActiveFilters
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first medicine to the inventory.'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                            >
                                <X className="h-4 w-4" />
                                Clear Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowMedicineModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Medicine
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {medicines.links && medicines.data.length > 0 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {medicines.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, {
                                                preserveState: true,
                                                preserveScroll: false,
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : link.url
                                              ? 'cursor-pointer border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Medicine Details Modal */}
                {showMedicineModal && selectedMedicine && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-xl font-semibold text-gray-900">Medicine Details</h2>
                                <button onClick={() => setShowMedicineModal(false)} className="text-gray-400 transition-colors hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Medicine Info */}
                                    <div>
                                        <h3 className="mb-3 text-lg font-medium text-gray-900">{selectedMedicine.name}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Generic Name:</span>
                                                <p className="font-medium text-gray-900">{selectedMedicine.generic_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Category:</span>
                                                <p className="font-medium text-gray-900 capitalize">{selectedMedicine.type}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Manufacturer:</span>
                                                <p className="font-medium text-gray-900">{selectedMedicine.manufacturer || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Unit:</span>
                                                <p className="font-medium text-gray-900">{selectedMedicine.unit}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Sale Price:</span>
                                                <p className="font-semibold text-green-600">{formatCurrency(selectedMedicine.standard_sale_price)}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Status:</span>
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        selectedMedicine.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {selectedMedicine.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Alerts */}
                                    {selectedMedicine.stock_alert && (
                                        <div>
                                            <h4 className="mb-3 font-medium text-gray-900">Stock Alert Settings</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm text-gray-600">Minimum Stock:</span>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedMedicine.stock_alert.minimum_stock} {selectedMedicine.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Reorder Level:</span>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedMedicine.stock_alert.reorder_level} {selectedMedicine.unit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Low Stock Alert:</span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                            selectedMedicine.stock_alert.low_stock_alert
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {selectedMedicine.stock_alert.low_stock_alert ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Expiry Alert:</span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                            selectedMedicine.stock_alert.expiry_alert
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {selectedMedicine.stock_alert.expiry_alert ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex space-x-3 border-t pt-4">
                                        <Link
                                            href={`/medicine-corner/purchase?medicine_id=${selectedMedicine.id}`}
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                                        >
                                            <Package className="h-4 w-4" />
                                            Add Stock
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => openSalePriceEditor(selectedMedicine)}
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit Sale Price
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sale Price Modal */}
                {showSalePriceModal && salePriceMedicine && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                        <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-lg font-semibold text-gray-900">Edit Sale Price</h2>
                                <button
                                    onClick={() => setShowSalePriceModal(false)}
                                    className="text-gray-400 transition-colors hover:text-gray-600"
                                    type="button"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Product: <span className="font-medium text-gray-900">{salePriceMedicine.name}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Sale Price (per unit)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={salePriceInput}
                                        onChange={(e) => setSalePriceInput(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowSalePriceModal(false)}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitSalePriceUpdate}
                                        className="flex-1 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
