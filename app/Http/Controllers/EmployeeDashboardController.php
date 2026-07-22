<?php

namespace App\Http\Controllers;

use App\Models\AttendanceDayRecord;
use App\Models\EmployeeLeave;
use App\Models\EmployeeMovement;
use App\Services\Attendance\AttendanceDayRecordService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index(Request $request)
    {
        $employee = $request->user()->employee;
        
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found for your user.');
        }

        $now = Carbon::now();
        $todayYmd = $now->toDateString();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        // Auto-ensure attendance records exist for all active employees today
        app(AttendanceDayRecordService::class)->ensureRecordsForDate($now);

        $leaves = EmployeeLeave::with('leaveType')->where('employee_id', $employee->id)->latest()->take(5)->get();
        $movements = EmployeeMovement::where('employee_id', $employee->id)->latest()->take(5)->get();
        
        $attendance = AttendanceDayRecord::where('employee_id', $employee->id)
            ->whereDate('work_date', '>=', $startOfMonth)
            ->whereDate('work_date', '<=', $endOfMonth)
            ->get();

        $recentAttendances = AttendanceDayRecord::where('employee_id', $employee->id)
            ->orderBy('work_date', 'desc')
            ->take(5)
            ->get();

        // Logged in employee's today record
        $todayRecord = AttendanceDayRecord::where('employee_id', $employee->id)
            ->whereDate('work_date', $todayYmd)
            ->first();

        // Check if employee has active open movement today
        $activeMovement = EmployeeMovement::where('employee_id', $employee->id)
            ->whereNull('end_time')
            ->first();

        return Inertia::render('EmployeePortal/Dashboard', [
            'employee' => $employee,
            'recentLeaves' => $leaves,
            'recentMovements' => $movements,
            'recentAttendances' => $recentAttendances,
            'attendanceSummary' => [
                'total_days' => $attendance->count(),
                'present' => $attendance->whereIn('status', ['present', 'late', 'half_day'])->count(),
                'absent' => $attendance->where('status', 'absent')->count(),
                'late' => $attendance->where('status', 'late')->count(),
            ],
            'todayState' => [
                'date_label' => $now->translatedFormat('l, d F Y'),
                'my_status' => $activeMovement ? 'on_movement' : ($todayRecord?->status ?? 'absent'),
                'check_in' => $todayRecord?->first_in_at ? Carbon::parse($todayRecord->first_in_at)->format('h:i A') : null,
                'check_out' => $todayRecord?->last_out_at ? Carbon::parse($todayRecord->last_out_at)->format('h:i A') : null,
                'active_movement' => $activeMovement,
            ],
        ]);
    }
}
