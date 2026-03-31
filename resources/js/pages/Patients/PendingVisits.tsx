import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Patient {
    id: number;
    name: string;
    phone: string;
    age: number;
}

interface Doctor {
    user: {
        name: string;
    };
}

interface Visit {
    id: number;
    patient: Patient;
    selected_doctor: Doctor;
    overall_status: string;
    vision_test_status: string;
    prescription_status: string;
    payment_status: string;
    created_at: string;
    visit_notes?: string;
}

interface Statistics {
    total_pending: number;
    ready_for_vision_test: number;
    ready_for_prescription: number;
    payment_pending: number;
}

interface Props {
    visits: {
        data: Visit[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        per_page: number;
    };
    filters: {
        status_filter?: string;
        payment_filter?: string;
        date_filter?: string;
        per_page?: number;
    };
    statistics: Statistics;
}

export default function PendingVisits({ visits, filters, statistics }: Props) {
    const [selectedVisits, setSelectedVisits] = useState<number[]>([]);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);

    const {
        data: completeData,
        setData: setCompleteData,
        patch: patchComplete,
        processing: processingComplete,
        reset: resetComplete,
    } = useForm({
        completion_type: 'both',
        notes: '',
        skip_vision_test: false,
        skip_prescription: false,
    });

    const {
        data: bulkData,
        setData: setBulkData,
        post: postBulk,
        processing: processingBulk,
        reset: resetBulk,
    } = useForm({
        visit_ids: [] as number[],
        completion_type: 'simple_complete',
        bulk_notes: '',
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'vision_test':
                return 'bg-blue-100 text-blue-800';
            case 'prescription':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-red-100 text-red-800';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleCompleteVisit = (visit: Visit) => {
        setCurrentVisit(visit);
        resetComplete();
        setShowCompleteModal(true);
    };

    const handleBulkComplete = () => {
        if (selectedVisits.length === 0) {
            alert('Please select at least one visit to complete.');
            return;
        }

        setBulkData({
            visit_ids: selectedVisits,
            completion_type: 'simple_complete',
            bulk_notes: '',
        });
        setShowBulkModal(true);
    };

    const submitComplete = () => {
        if (!currentVisit) return;

        patchComplete(route('patients.visits.complete', currentVisit.id), {
            onSuccess: () => {
                setShowCompleteModal(false);
                setCurrentVisit(null);
                resetComplete();
                router.reload();
            },
            onError: (errors) => {
                console.error('Complete visit errors:', errors);
            },
        });
    };

    const submitBulkComplete = () => {
        const submitData = {
            ...bulkData,
            visit_ids: selectedVisits,
        };

        console.log('Submitting bulk complete with data:', submitData);

        postBulk(route('patients.visits.bulk-complete'), {
            data: submitData,
            onSuccess: () => {
                setShowBulkModal(false);
                setSelectedVisits([]);
                resetBulk();
                router.reload();
            },
            onError: (errors) => {
                console.error('Bulk complete errors:', errors);
            },
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const selectableVisits = visits.data.filter((visit) => visit.overall_status !== 'completed').map((visit) => visit.id);
            setSelectedVisits(selectableVisits);
        } else {
            setSelectedVisits([]);
        }
    };

    const handleSelectVisit = (visitId: number, checked: boolean) => {
        if (checked) {
            setSelectedVisits((prev) => [...prev, visitId]);
        } else {
            setSelectedVisits((prev) => prev.filter((id) => id !== visitId));
        }
    };

    const handleFilter = (key: string, value: string | number) => {
        // Clear selected visits when filtering
        setSelectedVisits([]);

        router.get(route('patients.pending-visits'), {
            ...filters,
            [key]: value,
            page: 1, // Reset to first page when filtering
        });
    };

    const handlePerPageChange = (perPage: number) => {
        setSelectedVisits([]);
        router.get(route('patients.pending-visits'), {
            ...filters,
            per_page: perPage,
            page: 1, // Reset to first page
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('patients.pending-visits'), {
            ...filters,
            page: page,
        });
    };

    // Get count of selectable (non-completed) visits
    const selectableVisitsCount = visits.data.filter((visit) => visit.overall_status !== 'completed').length;
    const isAllSelectableSelected = selectedVisits.length === selectableVisitsCount && selectableVisitsCount > 0;

    return (
        <AdminLayout>
            <Head title="Pending Visits" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pending Visits</h1>
                        <p className="text-gray-600">Manage and complete patient visits</p>
                    </div>
                    {selectedVisits.length > 0 && (
                        <button onClick={handleBulkComplete} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                            Complete {selectedVisits.length} Visits
                        </button>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.total_pending}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <span className="text-xl text-red-600">⏳</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Vision Test Ready</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.ready_for_vision_test}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-xl text-blue-600">👁️</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Prescription Ready</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.ready_for_prescription}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                                <span className="text-xl text-yellow-600">📋</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Payment Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.payment_pending}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                <span className="text-xl text-orange-600">💰</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-4 shadow">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Status Filter</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={filters.status_filter || ''}
                                onChange={(e) => handleFilter('status_filter', e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="vision_test">Vision Test</option>
                                <option value="prescription">Prescription</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Payment Status</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={filters.payment_filter || ''}
                                onChange={(e) => handleFilter('payment_filter', e.target.value)}
                            >
                                <option value="">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Date Filter</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={filters.date_filter || ''}
                                onChange={(e) => handleFilter('date_filter', e.target.value)}
                            >
                                <option value="">All Dates</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="last_week">Last Week</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Per Page</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={filters.per_page || 20}
                                onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                            >
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSelectedVisits([]);
                                    router.get(route('patients.pending-visits'));
                                }}
                                className="w-full rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Visits Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow">
                    <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Patient Visits ({visits.total} total)</h2>
                                <p className="text-sm text-gray-600">
                                    Showing {visits.from} to {visits.to} of {visits.total} results
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelectableSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Select All ({selectableVisitsCount} pending)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Select</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Doctor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {visits.data.map((visit) => (
                                    <tr key={visit.id} className={`hover:bg-gray-50 ${visit.overall_status === 'completed' ? 'bg-green-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedVisits.includes(visit.id)}
                                                onChange={(e) => handleSelectVisit(visit.id, e.target.checked)}
                                                disabled={visit.overall_status === 'completed'}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{visit.patient.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {visit.patient.phone} • Age: {visit.patient.age}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{visit.selected_doctor?.user?.name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(visit.overall_status)}`}
                                                >
                                                    {visit.overall_status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <div className="flex gap-1">
                                                    <span
                                                        className={`rounded px-1 py-0.5 text-xs ${visit.vision_test_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                                    >
                                                        Vision: {visit.vision_test_status || 'pending'}
                                                    </span>
                                                    <span
                                                        className={`rounded px-1 py-0.5 text-xs ${visit.prescription_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                                    >
                                                        Prescription: {visit.prescription_status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusColor(visit.payment_status)}`}
                                            >
                                                {visit.payment_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                            {new Date(visit.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {visit.overall_status !== 'completed' ? (
                                                <button
                                                    onClick={() => handleCompleteVisit(visit)}
                                                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                                                >
                                                    Mark Complete
                                                </button>
                                            ) : (
                                                <span className="text-sm font-medium text-green-600">✓ Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {visits.data.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <span className="text-2xl text-gray-400">📋</span>
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No pending visits</h3>
                            <p className="text-gray-500">All visits have been completed or there are no visits to show.</p>
                        </div>
                    )}
                </div>

                {/* Enhanced Pagination */}
                {visits.last_page > 1 && (
                    <div className="rounded-lg border bg-white p-4 shadow">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="text-sm text-gray-700">
                                Showing {visits.from} to {visits.to} of {visits.total} results (Page {visits.current_page} of {visits.last_page})
                            </div>

                            <div className="flex items-center gap-2">
                                {/* First Page */}
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={visits.current_page === 1}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    First
                                </button>

                                {/* Previous Page */}
                                <button
                                    onClick={() => handlePageChange(visits.current_page - 1)}
                                    disabled={visits.current_page === 1}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="hidden items-center gap-1 sm:flex">
                                    {Array.from({ length: Math.min(5, visits.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (visits.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (visits.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (visits.current_page >= visits.last_page - 2) {
                                            pageNum = visits.last_page - 4 + i;
                                        } else {
                                            pageNum = visits.current_page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`rounded-md border px-3 py-2 text-sm ${
                                                    pageNum === visits.current_page
                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Page */}
                                <button
                                    onClick={() => handlePageChange(visits.current_page + 1)}
                                    disabled={visits.current_page === visits.last_page}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>

                                {/* Last Page */}
                                <button
                                    onClick={() => handlePageChange(visits.last_page)}
                                    disabled={visits.current_page === visits.last_page}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Complete Visit Modal */}
            {showCompleteModal && currentVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Complete Visit</h3>
                            <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="mb-2 text-sm text-gray-600">
                                Patient: <span className="font-medium">{currentVisit.patient.name}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Current Status: <span className="font-medium">{currentVisit.overall_status}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Completion Type</label>
                                <select
                                    value={completeData.completion_type}
                                    onChange={(e) => setCompleteData('completion_type', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="vision_only">Vision Test Only</option>
                                    <option value="prescription_only">Prescription Only</option>
                                    <option value="both">Both Vision & Prescription</option>
                                    <option value="simple_complete">Simple Complete</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                <textarea
                                    value={completeData.notes}
                                    onChange={(e) => setCompleteData('notes', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Add completion notes..."
                                />
                            </div>

                            {completeData.completion_type === 'vision_only' && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={completeData.skip_prescription}
                                        onChange={(e) => setCompleteData('skip_prescription', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Skip prescription (complete visit)</span>
                                </label>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowCompleteModal(false)}
                                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                                disabled={processingComplete}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitComplete}
                                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                disabled={processingComplete}
                            >
                                {processingComplete ? 'Processing...' : 'Complete Visit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Complete Modal */}
            {showBulkModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Bulk Complete Visits</h3>
                            <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                You are about to complete <span className="font-medium">{selectedVisits.length}</span> visits
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Completion Type</label>
                                <select
                                    value={bulkData.completion_type}
                                    onChange={(e) => setBulkData('completion_type', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="simple_complete">Simple Complete</option>
                                    <option value="both">Both Vision & Prescription</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Bulk Notes (Optional)</label>
                                <textarea
                                    value={bulkData.bulk_notes}
                                    onChange={(e) => setBulkData('bulk_notes', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Add notes for all selected visits..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                                disabled={processingBulk}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitBulkComplete}
                                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                disabled={processingBulk}
                            >
                                {processingBulk ? 'Processing...' : 'Complete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
