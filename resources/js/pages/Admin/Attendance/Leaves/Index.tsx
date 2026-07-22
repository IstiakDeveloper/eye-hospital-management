import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { differenceInDays, format, parseISO } from 'date-fns';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Filter,
    Printer,
    RefreshCw,
    Search,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLeavesIndex({ leaves, summary, leaveTypes, filters }: any) {
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [leaveTypeId, setLeaveTypeId] = useState(filters.leave_type_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const { data, setData, patch, processing, errors, reset } = useForm({
        status: '',
        admin_remarks: '',
    });

    const openModal = (leave: any) => {
        setSelectedLeave(leave);
        setData({
            status: leave.status === 'pending' ? 'approved' : leave.status,
            admin_remarks: leave.admin_remarks || '',
        });
    };

    const closeModal = () => {
        setSelectedLeave(null);
        reset();
    };

    const submitStatus = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.leaves.status', selectedLeave.id), {
            onSuccess: () => closeModal(),
        });
    };

    const quickApprove = (leaveId: number) => {
        router.patch(
            route('admin.leaves.status', leaveId),
            { status: 'approved', admin_remarks: 'Approved by Admin' },
            { preserveScroll: true }
        );
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.leaves.index'),
            {
                search,
                status,
                leave_type_id: leaveTypeId,
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setLeaveTypeId('');
        setStartDate('');
        setEndDate('');
        router.get(route('admin.leaves.index'), {}, { preserveState: true });
    };

    const calculateDays = (startStr: string, endStr: string) => {
        try {
            const start = parseISO(startStr);
            const end = parseISO(endStr);
            const diff = differenceInDays(end, start);
            return diff >= 0 ? diff + 1 : 1;
        } catch {
            return 1;
        }
    };

    const leaveTypeOptions = [
        { value: '', label: 'All Leave Types' },
        ...(leaveTypes ?? []).map((t: any) => ({
            value: String(t.id),
            label: t.name,
        })),
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
    ];

    return (
        <AdminLayout title="Leave Applications">
            <Head title="Leave Applications" />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-root { max-width: none !important; padding: 0 !important; }
                    .print-title { display: block !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
                }
                .print-title { display: none; }
            `}</style>

            <div className="print-root max-w-7xl mx-auto space-y-6 pb-12">
                {/* Printable Header */}
                <div className="print-title border-b border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Eye Hospital Management</h1>
                    <h2 className="text-lg font-semibold text-gray-700 mt-1">Employee Leave Applications Report</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Printed Date: {format(new Date(), 'MMM d, yyyy h:mm a')} | Total Filtered Records: {leaves.total || leaves.data.length}
                    </p>
                </div>

                {/* Header Title */}
                <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-blue-600" />
                            Leave Applications Management
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review, approve, or reject employee leave requests and print reports.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => window.print()} className="bg-white shadow-sm border-gray-200">
                        <Printer className="w-4 h-4 mr-2 text-gray-600" />
                        Print A4 Report
                    </Button>
                </div>

                {/* Summary Cards Grid */}
                <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Requests</p>
                            <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary?.total || 0}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-sm flex items-center justify-between bg-amber-50/30">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Approval</p>
                            <p className="text-2xl font-extrabold text-amber-700 mt-1">{summary?.pending || 0}</p>
                        </div>
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-emerald-200/80 shadow-sm flex items-center justify-between bg-emerald-50/30">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved</p>
                            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{summary?.approved || 0}</p>
                        </div>
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <UserCheck className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-rose-200/80 shadow-sm flex items-center justify-between bg-rose-50/30">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</p>
                            <p className="text-2xl font-extrabold text-rose-700 mt-1">{summary?.rejected || 0}</p>
                        </div>
                        <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                            <XCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <Card className="no-print">
                    <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleFilter} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                <div>
                                    <Input
                                        placeholder="Search employee/reason..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                                    />
                                </div>
                                <div>
                                    <Select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        options={statusOptions}
                                        placeholder="Select Status"
                                    />
                                </div>
                                <div>
                                    <Select
                                        value={leaveTypeId}
                                        onChange={(e) => setLeaveTypeId(e.target.value)}
                                        options={leaveTypeOptions}
                                        placeholder="Select Leave Type"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="Start Date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        placeholder="End Date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
                                </Button>
                                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Filter className="h-3.5 w-3.5 mr-1" /> Filter Applications
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Applications Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/75">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Category & Dates</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="no-print px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.data.length > 0 ? (
                                    leaves.data.map((leave: any) => {
                                        const durationDays = calculateDays(leave.start_date, leave.end_date);
                                        const isPending = leave.status === 'pending';

                                        return (
                                            <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="no-print h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {leave.employee?.name?.charAt(0) || 'E'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{leave.employee?.name || 'Unknown'}</p>
                                                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                {leave.employee?.employee_code || '--'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="font-bold text-gray-900">{leave.leave_type?.name || 'Leave'}</div>
                                                    <div className="text-xs font-mono text-gray-500 mt-0.5">
                                                        {format(new Date(leave.start_date), 'MMM d, yyyy')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono text-slate-800 border border-slate-200">
                                                        <Clock className="no-print w-3 h-3 text-slate-500" />
                                                        {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate hidden md:table-cell">
                                                    {leave.reason}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                                                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        leave.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                                                    }`}>
                                                        {leave.status}
                                                    </span>
                                                </td>
                                                <td className="no-print px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {isPending ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => quickApprove(leave.id)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Quick Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openModal(leave)}
                                                                className="h-8 text-xs font-semibold"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 mr-1" /> Review
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-mono font-medium bg-gray-100 px-2.5 py-1 rounded-md">
                                                            Completed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No leave applications match the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaves.links && leaves.data.length > 0 && (
                        <div className="no-print px-6 py-3.5 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Showing {leaves.from} to {leaves.to} of {leaves.total} entries
                            </span>
                            <div className="flex items-center gap-1">
                                {leaves.links.map((link: any, idx: number) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Redesigned Clean Review Modal */}
            {selectedLeave && (
                <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 transform transition-all">
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-bold">Review Leave Application</h2>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors text-lg font-bold">
                                ✕
                            </button>
                        </div>

                        {/* Leave Details Summary */}
                        <div className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Applicant</p>
                                        <p className="font-bold text-slate-900 text-sm">{selectedLeave.employee?.name}</p>
                                    </div>
                                    <span className="font-mono text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                        {selectedLeave.employee?.employee_code}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-500">Leave Category:</span>
                                        <p className="font-bold text-slate-800">{selectedLeave.leave_type?.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Duration:</span>
                                        <p className="font-bold text-blue-700">
                                            {calculateDays(selectedLeave.start_date, selectedLeave.end_date)} Days
                                        </p>
                                    </div>
                                </div>

                                <div className="text-xs pt-1 border-t border-slate-200/60">
                                    <span className="text-slate-500">Date Range:</span>
                                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                                        {format(new Date(selectedLeave.start_date), 'MMM d, yyyy')} - {format(new Date(selectedLeave.end_date), 'MMM d, yyyy')}
                                    </p>
                                </div>

                                <div className="text-xs pt-1 border-t border-slate-200/60">
                                    <span className="text-slate-500">Reason:</span>
                                    <p className="text-slate-800 mt-0.5 italic bg-white p-2 rounded border border-slate-200">
                                        "{selectedLeave.reason}"
                                    </p>
                                </div>
                            </div>

                            {/* Status Update Form */}
                            <form onSubmit={submitStatus} className="space-y-4">
                                <Select
                                    label="Decision Status"
                                    required
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    options={[
                                        { value: 'approved', label: 'Approve Leave' },
                                        { value: 'rejected', label: 'Reject Leave' },
                                        { value: 'pending', label: 'Keep Pending' },
                                    ]}
                                    error={errors.status}
                                />

                                <div className="w-full">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        Admin Remarks / Note (Optional)
                                    </label>
                                    <textarea
                                        value={data.admin_remarks}
                                        onChange={(e) => setData('admin_remarks', e.target.value)}
                                        rows={3}
                                        placeholder="Add any internal note or remark for the employee..."
                                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-colors duration-200 resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                        {processing ? 'Saving...' : 'Save Decision'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
