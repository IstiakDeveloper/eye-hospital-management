import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import Pagination from '@/components/ui/pagination';
import {
  Search,
  Pill,
  Plus,
  Edit,
  Check,
  X as XIcon,
  Filter,
  Download,
  Building2,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  MoreVertical,
  Package,
  ShoppingCart,
  Zap,
  Timer
} from 'lucide-react';

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
  types: string[];
}

export default function MedicinesIndex({ medicines, types }: MedicinesIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      await router.get(route('medicines.index'), {
        search: searchTerm,
        type: typeFilter,
        status: statusFilter
      }, { preserveState: true });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setTypeFilter(value);
    } else if (name === 'status') {
      setStatusFilter(value);
    }
    router.get(route('medicines.index'), {
      search: searchTerm,
      type: name === 'type' ? value : typeFilter,
      status: name === 'status' ? value : statusFilter
    }, { preserveState: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    router.get(route('medicines.index'), {}, { preserveState: true });
  };

  const toggleMedicineStatus = (id: number, currentStatus: boolean) => {
    router.put(route('medicines.toggle', id), {}, {
      onSuccess: () => {
        // Status will be updated automatically
      },
      preserveState: true
    });
  };

  // Calculate stats
  const totalMedicines = medicines.total;
  const currentPageCount = medicines.data.length;
  const activeMedicines = medicines.data.filter(m => m.is_active).length;
  const inactiveMedicines = medicines.data.filter(m => !m.is_active).length;
  const uniqueTypes = new Set(medicines.data.map(m => m.type)).size;

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-50 text-gray-700 border-gray-200 font-medium">
        <XIcon className="h-3 w-3 mr-1" />
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
      'bg-pink-50 text-pink-700 border-pink-200'
    ];

    const colorIndex = type.length % colors.length;
    return (
      <Badge className={`${colors[colorIndex]} font-medium`}>
        {type}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Medicine Management">
      <Head title="Medicine Management" />

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medicine Management</h1>
            <p className="text-gray-600">Manage your pharmacy inventory and medicine database</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Export Data
            </Button>
            <Button href={route('medicines.create')} leftIcon={<Plus className="h-4 w-4" />} size="lg">
              Add New Medicine
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Medicines</p>
                <p className="text-3xl font-bold text-blue-900">{totalMedicines.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Pill className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-emerald-900">{activeMedicines}</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inactive</p>
                <p className="text-3xl font-bold text-gray-900">{inactiveMedicines}</p>
              </div>
              <div className="p-3 bg-gray-500 rounded-xl">
                <Timer className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Medicine Types</p>
                <p className="text-3xl font-bold text-purple-900">{uniqueTypes}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">This Page</p>
                <p className="text-3xl font-bold text-amber-900">{currentPageCount}</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-600" />
            <span>Search & Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by medicine name, generic name, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={isSearching}
                loadingText="Searching..."
                className="min-w-[120px]"
              >
                Search
              </Button>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
          </form>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>

            <div className="flex flex-wrap gap-3 flex-1">
              <div className="flex-1 min-w-[200px]">
                <select
                  name="type"
                  value={typeFilter}
                  onChange={handleFilterChange}
                  className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">All Types</option>
                  {types?.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select
                  name="status"
                  value={statusFilter}
                  onChange={handleFilterChange}
                  className="flex h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Pill className="h-5 w-5 text-gray-600" />
              <span>Medicine Directory</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                Showing <span className="font-semibold">{medicines.from}</span> to <span className="font-semibold">{medicines.to}</span> of <span className="font-semibold">{medicines.total}</span> medicines
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {medicines.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-800 py-4">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-4 w-4" />
                        <span>Medicine Details</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-800">Generic Name</TableHead>
                    <TableHead className="font-bold text-gray-800">Type & Category</TableHead>
                    <TableHead className="font-bold text-gray-800">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Manufacturer</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-800">Status</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.data.map((medicine, index) => (
                    <TableRow
                      key={medicine.id}
                      className="hover:bg-blue-50 transition-colors duration-200 group"
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {medicine.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{medicine.name}</p>
                            <p className="text-xs text-gray-500">ID #{medicine.id}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {medicine.generic_name || 'N/A'}
                          </p>
                          {medicine.generic_name && (
                            <p className="text-xs text-gray-500">Generic</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getTypeBadge(medicine.type)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {medicine.manufacturer || 'Not specified'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(medicine.is_active)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('medicines.show', medicine.id)}
                            className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('medicines.edit', medicine.id)}
                            className="hover:bg-gray-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMedicineStatus(medicine.id, medicine.is_active)}
                            className={`transition-all duration-300 group-hover:scale-110 ${
                              medicine.is_active
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {medicine.is_active ? (
                              <XIcon className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Pill className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No medicines found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? "No medicines match your current search and filter criteria. Try adjusting your filters."
                  : "Get started by adding your first medicine to the database."
                }
              </p>
              <div className="flex justify-center space-x-3">
                {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button href={route('medicines.create')} leftIcon={<Plus className="h-4 w-4" />}>
                  Add First Medicine
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {medicines.data.length > 0 && (
          <div className="border-t bg-gray-50 px-6 py-4">
            <Pagination links={medicines.links} />
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
