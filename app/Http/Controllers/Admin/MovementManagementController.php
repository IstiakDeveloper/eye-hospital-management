<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MovementManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeMovement::with(['employee', 'approvedBy']);

        // Search by employee name, code, purpose, or location
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('purpose', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($eq) use ($search) {
                      $eq->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by Employee ID
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        // Date Range Filters
        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->input('end_date'));
        }

        // Status Filter (active vs completed)
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->whereNull('end_time');
            } elseif ($status === 'completed') {
                $query->whereNotNull('end_time');
            }
        }

        $movements = $query->latest('date')->latest('id')->paginate(20)->withQueryString();

        $employees = Employee::select('id', 'name', 'employee_code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Attendance/Movements/Index', [
            'movements' => $movements,
            'employees' => $employees,
            'filters' => $request->only(['search', 'employee_id', 'start_date', 'end_date', 'status']),
        ]);
    }

    public function updateStatus(Request $request, EmployeeMovement $movement)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string|max:1000'
        ]);

        $movement->update([
            'status' => $request->status,
            'admin_remarks' => $request->admin_remarks,
            'approved_by' => $request->user()->id
        ]);

        return back()->with('success', 'Movement status updated.');
    }
}
