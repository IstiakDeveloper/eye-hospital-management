import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    Building2,
    Check,
    CheckCircle,
    ChevronDown,
    Download,
    Edit,
    Filter,
    Package,
    Pill,
    Plus,
    Search,
    Timer,
    Trash2,
    X as XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Medicine {
    id: number;
    name: string;
    generic_name: string | null;
    type: string;
    manufacturer: string | null;
    description: string | null;
    is_active: boolean;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface FilterOptions {
    types: string[];
    manufacturers: string[];
}

interface Stats {
    total_medicines: number;
    active_medicines: number;
    inactive_medicines: number;
    unique_types: number;
    unique_manufacturers: number;
}

interface MedicinesIndexProps {
    medicines: {
        data: Medicine[];
        links: PaginationLinks[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filterOptions: FilterOptions;
    stats: Stats;
    filters: {
        search: string;
        type: string;
        status: string;
        manufacturer: string;
        sort_by: string;
        sort_order: string;
    };
}

const Button = ({ children, className = '', variant = 'primary', size = 'md', disabled = false, onClick, href, ...props }: any) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
        ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
        success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
        danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    };
    const sizes = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} disabled={disabled} onClick={onClick} {...props}>
            {children}
        </button>
    );
};

const Badge = ({ children, className = '' }: any) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
);

const Card = ({ children, className = '' }: any) => (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: any) => <div className={`px-6 py-4 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: any) => <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;

const CardContent = ({ children, className = '' }: any) => <div className={className}>{children}</div>;

export default function MedicinesIndex({ medicines, filterOptions, stats, filters }: MedicinesIndexProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [localFilters, setLocalFilters] = useState({
        type: filters?.type || 'all',
        status: filters?.status || 'all',
        manufacturer: filters?.manufacturer || 'all',
        sort_by: filters?.sort_by || 'name',
        sort_order: filters?.sort_order || 'asc',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMedicines, setSelectedMedicines] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters?.search || '')) {
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
            ...Object.fromEntries(Object.entries(localFilters).filter(([_, v]) => v !== 'all' && v !== '' && v !== null)),
        };

        router.get(route('medicines.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setLocalFilters({
            type: 'all',
            status: 'all',
            manufacturer: 'all',
            sort_by: 'name',
            sort_order: 'asc',
        });
        router.get(route('medicines.index'), {}, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const newOrder = localFilters.sort_by === field && localFilters.sort_order === 'asc' ? 'desc' : 'asc';
        setLocalFilters((prev) => ({ ...prev, sort_by: field, sort_order: newOrder }));
    };

    const toggleMedicineStatus = async (id: number) => {
        setIsLoading(true);
        try {
            router.put(
                route('medicines.toggle', id),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsLoading(false),
                },
            );
        } catch (error) {
            setIsLoading(false);
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedMedicines.length === 0) return;

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete selected medicines? This action cannot be undone.')) {
                return;
            }
        }

        setIsLoading(true);
        try {
            router.post(
                route('medicines.bulk-action'),
                {
                    action,
                    medicine_ids: selectedMedicines,
                },
                {
                    preserveState: true,
                    onSuccess: () => setSelectedMedicines([]),
                    onFinish: () => setIsLoading(false),
                },
            );
        } catch (error) {
            setIsLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedMedicines.length === medicines.data.length) {
            setSelectedMedicines([]);
        } else {
            setSelectedMedicines(medicines.data.map((m) => m.id));
        }
    };

    const toggleSelectMedicine = (id: number) => {
        setSelectedMedicines((prev) => (prev.includes(id) ? prev.filter((medId) => medId !== id) : [...prev, id]));
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
            </Badge>
        ) : (
            <Badge className="border-gray-200 bg-gray-50 font-medium text-gray-700">
                <XIcon className="mr-1 h-3 w-3" />
                Inactive
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        const colors = [
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-purple-50 text-purple-700 border-purple-200',
            'bg-green-50 text-green-700 border-green-200',
            'bg-orange-50 text-orange-700 border-orange-200',
            'bg-pink-50 text-pink-700 border-pink-200',
        ];

        const colorIndex = type.length % colors.length;
        return <Badge className={`${colors[colorIndex]} font-medium`}>{type}</Badge>;
    };

    const hasActiveFilters = search || Object.values(localFilters).some((v) => v !== 'all' && v !== 'name' && v !== 'asc');

    // Safe data access
    const medicineData = medicines?.data || [];
    const medicineStats = stats || {
        total_medicines: 0,
        active_medicines: 0,
        inactive_medicines: 0,
        unique_types: 0,
        unique_manufacturers: 0,
    };
    const options = filterOptions || { types: [], manufacturers: [] };

    return (
        <AdminLayout>
            <Head title="Medicine Management" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine Management</h1>
                        <p className="mt-1 text-gray-600">
                            Manage your pharmacy inventory and medicine database ({medicines?.total || 0} total medicines)
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => router.get(route('medicines.export'))}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button href={route('medicines.create')} size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Medicine
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-blue-600">Total</p>
                                    <p className="text-2xl font-bold text-blue-900">{medicineStats.total_medicines}</p>
                                </div>
                                <div className="rounded-lg bg-blue-500 p-2">
                                    <Pill className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-emerald-600">Active</p>
                                    <p className="text-2xl font-bold text-emerald-900">{medicineStats.active_medicines}</p>
                                </div>
                                <div className="rounded-lg bg-emerald-500 p-2">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Inactive</p>
                                    <p className="text-2xl font-bold text-gray-900">{medicineStats.inactive_medicines}</p>
                                </div>
                                <div className="rounded-lg bg-gray-500 p-2">
                                    <Timer className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-purple-600">Types</p>
                                    <p className="text-2xl font-bold text-purple-900">{medicineStats.unique_types}</p>
                                </div>
                                <div className="rounded-lg bg-purple-500 p-2">
                                    <Package className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-amber-600">Brands</p>
                                    <p className="text-2xl font-bold text-amber-900">{medicineStats.unique_manufacturers}</p>
                                </div>
                                <div className="rounded-lg bg-amber-500 p-2">
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card className="shadow-lg">
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                        <CardTitle className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-gray-600" />
                            <span>Search & Filters</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-4">
                            {/* Search Bar */}
                            <div className="flex space-x-4">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by medicine name, generic name, manufacturer, type..."
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
                                        <XIcon className="h-4 w-4" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
                                        <select
                                            value={localFilters.type}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, type: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Types</option>
                                            {options.types.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={localFilters.status}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, status: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="active">Active Only</option>
                                            <option value="inactive">Inactive Only</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Manufacturer</label>
                                        <select
                                            value={localFilters.manufacturer}
                                            onChange={(e) => setLocalFilters((prev) => ({ ...prev, manufacturer: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="all">All Manufacturers</option>
                                            {options.manufacturers.map((manufacturer) => (
                                                <option key={manufacturer} value={manufacturer}>
                                                    {manufacturer}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Sort By</label>
                                        <div className="flex space-x-2">
                                            <select
                                                value={localFilters.sort_by}
                                                onChange={(e) => setLocalFilters((prev) => ({ ...prev, sort_by: e.target.value }))}
                                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="name">Name</option>
                                                <option value="type">Type</option>
                                                <option value="manufacturer">Manufacturer</option>
                                                <option value="status">Status</option>
                                                <option value="created_at">Date Added</option>
                                            </select>
                                            <button
                                                onClick={() =>
                                                    setLocalFilters((prev) => ({
                                                        ...prev,
                                                        sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc',
                                                    }))
                                                }
                                                className="rounded-lg border border-gray-300 px-3 py-2 transition-colors hover:bg-gray-50"
                                            >
                                                <ArrowUpDown className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {search && <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">Search: "{search}"</span>}
                        {Object.entries(localFilters).map(
                            ([key, value]) =>
                                value &&
                                value !== 'all' &&
                                value !== 'name' &&
                                value !== 'asc' && (
                                    <span key={key} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                                        {key.replace('_', ' ')}: {value}
                                    </span>
                                ),
                        )}
                    </div>
                )}

                {/* Bulk Actions */}
                {selectedMedicines.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">{selectedMedicines.length} medicine(s) selected</span>
                                <div className="flex space-x-2">
                                    <Button size="sm" variant="success" onClick={() => handleBulkAction('activate')} disabled={isLoading}>
                                        <Check className="mr-1 h-4 w-4" />
                                        Activate
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleBulkAction('deactivate')} disabled={isLoading}>
                                        <XIcon className="mr-1 h-4 w-4" />
                                        Deactivate
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')} disabled={isLoading}>
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Showing {medicines?.from || 0} to {medicines?.to || 0} of {medicines?.total || 0} medicines
                    </span>
                    <span>{hasActiveFilters && `${medicines?.total || 0} filtered results`}</span>
                </div>

                {/* Main Table */}
                <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                        <CardTitle className="flex items-center space-x-2">
                            <Pill className="h-5 w-5 text-gray-600" />
                            <span>Medicine Directory</span>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        {medicineData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="w-12 px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMedicines.length === medicineData.length && medicineData.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-800">
                                                <button
                                                    onClick={() => handleSort('name')}
                                                    className="flex items-center space-x-2 transition-colors hover:text-blue-600"
                                                >
                                                    <Pill className="h-4 w-4" />
                                                    <span>Medicine Details</span>
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-800">Generic Name</th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-800">
                                                <button
                                                    onClick={() => handleSort('type')}
                                                    className="flex items-center space-x-2 transition-colors hover:text-blue-600"
                                                >
                                                    <span>Type & Category</span>
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-800">
                                                <button
                                                    onClick={() => handleSort('manufacturer')}
                                                    className="flex items-center space-x-2 transition-colors hover:text-blue-600"
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                    <span>Manufacturer</span>
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-left font-bold text-gray-800">
                                                <button
                                                    onClick={() => handleSort('status')}
                                                    className="flex items-center space-x-2 transition-colors hover:text-blue-600"
                                                >
                                                    <span>Status</span>
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </th>
                                            <th className="px-4 py-3 text-right font-bold text-gray-800">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicineData.map((medicine) => (
                                            <tr key={medicine.id} className="group border-b transition-colors duration-200 hover:bg-blue-50">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMedicines.includes(medicine.id)}
                                                        onChange={() => toggleSelectMedicine(medicine.id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                                                            {medicine.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{medicine.name}</p>
                                                            <p className="text-xs text-gray-500">ID #{medicine.id}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{medicine.generic_name || 'N/A'}</p>
                                                        {medicine.generic_name && <p className="text-xs text-gray-500">Generic</p>}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">{getTypeBadge(medicine.type)}</td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-gray-900">{medicine.manufacturer || 'Not specified'}</span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">{getStatusBadge(medicine.is_active)}</td>

                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        {/* <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            href={route('medicines.show', medicine.id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button> */}

                                                        <Button size="sm" variant="ghost" href={route('medicines.edit', medicine.id)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => toggleMedicineStatus(medicine.id)}
                                                            disabled={isLoading}
                                                            className={
                                                                medicine.is_active
                                                                    ? 'text-red-600 hover:bg-red-100'
                                                                    : 'text-green-600 hover:bg-green-100'
                                                            }
                                                        >
                                                            {medicine.is_active ? <XIcon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                                    <Pill className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-gray-900">No medicines found</h3>
                                <p className="mx-auto mb-6 max-w-md text-gray-500">
                                    {hasActiveFilters
                                        ? 'No medicines match your current search and filter criteria. Try adjusting your filters.'
                                        : 'Get started by adding your first medicine to the database.'}
                                </p>
                                <div className="flex justify-center space-x-3">
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={clearFilters}>
                                            <XIcon className="mr-2 h-4 w-4" />
                                            Clear Filters
                                        </Button>
                                    )}
                                    <Button href={route('medicines.create')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add First Medicine
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    {/* Pagination */}
                    {medicineData.length > 0 && medicines?.links && (
                        <div className="border-t bg-gray-50 px-6 py-4">
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
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
