<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeave;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeLeave::with(['employee', 'leaveType', 'approvedBy']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($eq) use ($search) {
                      $eq->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Leave Type filter
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->input('leave_type_id'));
        }

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('start_date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('end_date', '<=', $request->input('end_date'));
        }

        $leaves = $query->latest('start_date')->latest('id')->paginate(15)->withQueryString();

        // Calculate Summary Counts
        $summary = [
            'total' => EmployeeLeave::count(),
            'pending' => EmployeeLeave::where('status', 'pending')->count(),
            'approved' => EmployeeLeave::where('status', 'approved')->count(),
            'rejected' => EmployeeLeave::where('status', 'rejected')->count(),
        ];

        $leaveTypes = LeaveType::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('Admin/Attendance/Leaves/Index', [
            'leaves' => $leaves,
            'summary' => $summary,
            'leaveTypes' => $leaveTypes,
            'filters' => $request->only(['search', 'status', 'leave_type_id', 'start_date', 'end_date']),
        ]);
    }

    public function updateStatus(Request $request, EmployeeLeave $leave)
    {
        if ($leave->status !== 'pending') {
            return back()->with('error', 'This leave application has already been processed and cannot be changed.');
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string|max:1000'
        ]);

        $leave->update([
            'status' => $request->status,
            'admin_remarks' => $request->admin_remarks,
            'approved_by' => $request->user()->id
        ]);

        return back()->with('success', 'Leave application status updated successfully.');
    }
}
