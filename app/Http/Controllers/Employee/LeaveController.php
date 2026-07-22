<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeave;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller
{
    private function getLeaveSummary($employeeId)
    {
        $currentYear = date('Y');
        $leaveTypes = LeaveType::where('is_active', true)->get();
        $approvedLeaves = EmployeeLeave::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereYear('start_date', $currentYear)
            ->get();

        return $leaveTypes->map(function ($type) use ($approvedLeaves) {
            $usedDays = 0;
            $typeLeaves = $approvedLeaves->where('leave_type_id', $type->id);
            foreach ($typeLeaves as $leave) {
                $start = Carbon::parse($leave->start_date);
                $end = Carbon::parse($leave->end_date);
                $usedDays += ($start->diffInDays($end) + 1);
            }

            return [
                'id' => $type->id,
                'name' => $type->name,
                'days_allowed' => $type->days_allowed,
                'used_days' => $usedDays,
                'remaining_days' => max(0, $type->days_allowed - $usedDays),
            ];
        });
    }

    public function index(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found.');
        }

        $leaves = EmployeeLeave::with('leaveType')
            ->where('employee_id', $employee->id)
            ->latest('start_date')
            ->latest('id')
            ->paginate(15);

        $leaveSummary = $this->getLeaveSummary($employee->id);

        return Inertia::render('EmployeePortal/Leaves/Index', [
            'leaves' => $leaves,
            'leaveSummary' => $leaveSummary,
        ]);
    }

    public function create(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found.');
        }

        $leaveSummary = $this->getLeaveSummary($employee->id);

        return Inertia::render('EmployeePortal/Leaves/Create', [
            'leaveTypes' => $leaveSummary,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
        ]);

        EmployeeLeave::create([
            'employee_id' => $request->user()->employee->id,
            'leave_type_id' => $request->input('leave_type_id'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'reason' => $request->input('reason'),
            'status' => 'pending',
        ]);

        return redirect()->route('employee.leaves.index')->with('success', 'Leave application submitted successfully.');
    }
}
