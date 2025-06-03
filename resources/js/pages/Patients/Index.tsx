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
import { formatDate, calculateAge } from '@/lib/utils';
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Calendar,
  FileText,
  Users,
  Filter,
  Download,
  MoreVertical,
  Phone,
  User,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
}

interface PaginationLinks {
  url: string | null;
  label: string;
  active: boolean;
}

interface PatientsIndexProps {
  patients: {
    data: Patient[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
  };
}

export default function PatientsIndex({ patients }: PatientsIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      await router.get(route('patients.index'), { search: searchTerm }, { preserveState: true });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    router.get(route('patients.index'), {}, { preserveState: true });
  };

  // Calculate stats
  const totalPatients = patients.total;
  const currentPageCount = patients.data.length;
  const malePatients = patients.data.filter(p => p.gender === 'male').length;
  const femalePatients = patients.data.filter(p => p.gender === 'female').length;

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return null;

    const genderFormatted = gender.charAt(0).toUpperCase() + gender.slice(1);
    const colorClass = gender === 'male'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-pink-50 text-pink-700 border-pink-200';

    return (
      <Badge className={`${colorClass} font-medium`}>
        {genderFormatted}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Patients Management">
      <Head title="Patients Management" />

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patients Management</h1>
            <p className="text-gray-600">Manage and track all your patients in one place</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Export Data
            </Button>
            <Button href={route('patients.create')} leftIcon={<UserPlus className="h-4 w-4" />} size="lg">
              Add New Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-blue-900">{totalPatients.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">This Page</p>
                <p className="text-3xl font-bold text-emerald-900">{currentPageCount}</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Male Patients</p>
                <p className="text-3xl font-bold text-purple-900">{malePatients}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600 mb-1">Female Patients</p>
                <p className="text-3xl font-bold text-pink-900">{femalePatients}</p>
              </div>
              <div className="p-3 bg-pink-500 rounded-xl">
                <User className="h-6 w-6 text-white" />
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
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, phone, email, or patient ID..."
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
              {searchTerm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span>Patient Directory</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                Showing <span className="font-semibold">{patients.from}</span> to <span className="font-semibold">{patients.to}</span> of <span className="font-semibold">{patients.total}</span> patients
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {patients.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-800 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Patient ID</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-gray-800">Patient Details</TableHead>
                    <TableHead className="font-bold text-gray-800">Contact Info</TableHead>
                    <TableHead className="font-bold text-gray-800">Demographics</TableHead>
                    <TableHead className="font-bold text-gray-800">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Registration</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.data.map((patient, index) => (
                    <TableRow
                      key={patient.id}
                      className="hover:bg-blue-50 transition-colors duration-200 group"
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{patient.patient_id}</p>
                            <p className="text-xs text-gray-500">ID #{index + 1}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">{patient.name}</p>
                          {patient.email && (
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{patient.phone}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          {patient.date_of_birth && (
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {calculateAge(patient.date_of_birth)} years
                              </Badge>
                            </div>
                          )}
                          {getGenderBadge(patient.gender)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{formatDate(patient.created_at)}</p>
                          <p className="text-gray-500">Registered</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('patients.show', patient.id)}
                            className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('patients.edit', patient.id)}
                            className="hover:bg-gray-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('appointments.create.patient', patient.id)}
                            className="hover:bg-green-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            href={route('visiontests.create', patient.id)}
                            className="hover:bg-purple-100 transition-all duration-300 group-hover:scale-110"
                          >
                            <FileText className="h-4 w-4" />
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
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm
                  ? `No patients match your search for "${searchTerm}". Try adjusting your search terms.`
                  : "Get started by adding your first patient to the system."
                }
              </p>
              <div className="flex justify-center space-x-3">
                {searchTerm && (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear Search
                  </Button>
                )}
                <Button href={route('patients.create')} leftIcon={<UserPlus className="h-4 w-4" />}>
                  Add First Patient
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {patients.data.length > 0 && (
          <div className="border-t bg-gray-50 px-6 py-4">
            <Pagination links={patients.links} />
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
