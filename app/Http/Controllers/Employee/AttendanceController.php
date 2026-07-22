<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\AttendanceDayRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user->employee) {
            abort(403, 'Employee profile not found.');
        }

        $month = $request->get('month', date('m'));
        $year = $request->get('year', date('Y'));

        $attendances = AttendanceDayRecord::where('employee_id', $user->employee->id)
            ->whereMonth('work_date', $month)
            ->whereYear('work_date', $year)
            ->orderBy('work_date', 'desc')
            ->get();

        return Inertia::render('EmployeePortal/Attendance/Index', [
            'attendances' => $attendances,
            'currentMonth' => $month,
            'currentYear' => $year,
        ]);
    }
}
