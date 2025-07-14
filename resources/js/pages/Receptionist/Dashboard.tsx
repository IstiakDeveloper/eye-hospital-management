import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  User, Phone, Mail, Search, Plus, Receipt,
  DollarSign, Users, Clock, CheckCircle,
  AlertCircle, TrendingUp, Calendar,
  FileText, Printer, Eye, CreditCard,
  Activity, BarChart3, RefreshCw
} from 'lucide-react';

// Type definitions
interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string;
  email?: string;
  registration_status: string;
  payment_status: string;
  total_paid: number;
  final_amount: number;
  created_at: string;
  doctor_name?: string;
}

interface PaymentSummary {
  id: number;
  amount: number;
  patient_name: string;
  patient_id: string;
  payment_method: string;
  payment_date: string;
  created_at: string;
}

interface DashboardStats {
  today_registrations: number;
  today_revenue: number;
  today_pending_payments: number;
  month_registrations: number;
  month_revenue: number;
  total_patients: number;
  pending_payments_count: number;
  pending_payments_amount: number;
  patients_ready_for_vision_test: number;
  last_registration_time?: string;
  last_payment_time?: string;
}

interface Props {
  stats: DashboardStats;
  recentPatients: Patient[];
  todayPayments: {
    total_amount: number;
    total_count: number;
    average_payment: number;
    payments: PaymentSummary[];
  };
  pendingPatients: Patient[];
}

const ReceptionistDashboard: React.FC<Props> = ({
  stats,
  recentPatients,
  todayPayments,
  pendingPatients
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-search when typing
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = async (): Promise<void> => {
    if (searchTerm.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(route('receptionist.quick-search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ term: searchTerm }),
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickRegister = (): void => {
    router.visit(route('patients.create'));
  };

  const handlePrintReceipt = (patientId: number): void => {
    router.visit(route('patients.receipt', patientId));
  };

  const handleViewPatient = (patientId: number): void => {
    router.visit(route('patients.show', patientId));
  };

  const refreshDashboard = (): void => {
    setRefreshing(true);
    router.reload({
      only: ['stats', 'recentPatients', 'todayPayments', 'pendingPatients'],
      onFinish: () => setRefreshing(false)
    });
  };

  const formatCurrency = (amount: number): string => {
    return `৳${amount.toLocaleString()}`;
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-BD');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AdminLayout title="Receptionist Dashboard">
      <Head title="Receptionist Dashboard" />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
              <p className="text-gray-600 mt-1">Patient registration and payment management</p>
            </div>
            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Today's Registrations</p>
                  <p className="text-3xl font-bold">{stats.today_registrations}</p>
                  <p className="text-blue-200 text-xs mt-1">Total this month: {stats.month_registrations}</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Today's Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.today_revenue)}</p>
                  <p className="text-green-200 text-xs mt-1">Monthly: {formatCurrency(stats.month_revenue)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending Payments</p>
                  <p className="text-3xl font-bold">{stats.pending_payments_count}</p>
                  <p className="text-yellow-200 text-xs mt-1">Amount: {formatCurrency(stats.pending_payments_amount)}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Ready for Vision Test</p>
                  <p className="text-3xl font-bold">{stats.patients_ready_for_vision_test}</p>
                  <p className="text-purple-200 text-xs mt-1">Completed registrations</p>
                </div>
                <Eye className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Search & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Enhanced Patient Search */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl border-2 border-blue-200 p-8">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl inline-block mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Search</h2>
                <p className="text-gray-600">Search by name, phone, ID or scan QR code</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type patient name, phone or scan QR..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white shadow-lg transition-all duration-200"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 py-3 px-4 bg-white rounded-xl border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 12h.01M16 16h.01M12 16h.01" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">QR Code Scanning Enabled</span>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-6 space-y-3 max-h-80 overflow-y-auto">
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="p-4 bg-white border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">{patient.name}</p>
                          <p className="text-gray-600 font-medium">{patient.patient_id} • {patient.phone}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(patient.payment_status)}`}>
                              {patient.payment_status.toUpperCase()}
                            </span>
                            {patient.doctor_name && (
                              <span className="text-sm text-indigo-600 font-medium">Dr. {patient.doctor_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-md hover:shadow-lg"
                            title="View Details"
                          >
                            <User className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(patient.id)}
                            className="p-3 text-green-600 hover:bg-green-100 rounded-xl transition-colors shadow-md hover:shadow-lg"
                            title="Print Receipt"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Today's Activity */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="h-6 w-6 text-purple-600" />
                Quick Actions & Today's Activity
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="font-medium text-gray-700">Today's Registrations</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.today_registrations}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="font-medium text-gray-700">Today's Payments</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{todayPayments.total_count}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <span className="font-medium text-gray-700">Pending Payments</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{stats.today_pending_payments}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.visit(route('patients.create'))}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-6 w-6" />
                  Add New Patient
                </button>

                <button
                  onClick={() => router.visit(route('patients.ready-for-vision-test'))}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                  Vision Test Queue ({stats.patients_ready_for_vision_test})
                </button>
              </div>
            </div>
          </div>

          {/* Recent Patients & Today's Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Patients */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Recent Patients
                </h2>
              </div>

              <div className="p-6">
                {recentPatients.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.payment_status)}`}>
                              {patient.payment_status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{patient.patient_id} • {patient.phone}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatTime(patient.created_at)}</span>
                            <span>{formatCurrency(patient.total_paid)} / {formatCurrency(patient.final_amount)}</span>
                            {patient.doctor_name && <span>Dr. {patient.doctor_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(patient.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent patients</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.visit(route('patients.index'))}
                    className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    View All Patients
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Payments */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-green-600" />
                    Today's Payments
                  </h2>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total: {formatCurrency(todayPayments.total_amount)}</p>
                    <p className="text-xs text-gray-500">Count: {todayPayments.total_count}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {todayPayments.payments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {todayPayments.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{payment.patient_name}</h3>
                          <p className="text-sm text-gray-600">{payment.patient_id} • {payment.payment_method}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(payment.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payments today</p>
                  </div>
                )}

                {todayPayments.total_count > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-green-600 font-semibold">Average Payment</p>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(todayPayments.average_payment)}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-600 font-semibold">Total Count</p>
                        <p className="text-lg font-bold text-blue-700">{todayPayments.total_count}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          {pendingPatients.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  Pending Payments
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2 py-1 rounded-full">
                    {pendingPatients.length}
                  </span>
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingPatients.map((patient) => (
                    <div key={patient.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.payment_status)}`}>
                          {patient.payment_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{patient.patient_id} • {patient.phone}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-600">
                          Due: {formatCurrency(patient.total_due)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View & Process Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Registered: {formatDate(patient.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.visit(route('patients.create'))}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-6 w-6" />
              New Registration
            </button>

            <button
              onClick={() => router.visit(route('patients.index'))}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Users className="h-6 w-6" />
              All Patients
            </button>

            <button
              onClick={() => router.visit(route('patients.ready-for-vision-test'))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Eye className="h-6 w-6" />
              Vision Test Queue
            </button>

            <button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-2xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Printer className="h-6 w-6" />
              Print Reports
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default ReceptionistDashboard;
