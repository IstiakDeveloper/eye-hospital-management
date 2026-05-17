<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceDayController extends Controller
{
    public function index(Request $request): Response
    {
        $date = $request->query('date', now()->format('Y-m-d'));
        try {
            $day = Carbon::parse($date, config('app.timezone'))->startOfDay();
        } catch (\Throwable) {
            $day = now()->startOfDay();
        }

        $employees = Employee::query()
            ->with('employeeAttendanceSetting')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $records = AttendanceDayRecord::query()
            ->whereDate('work_date', $day->toDateString())
            ->whereIn('employee_id', $employees->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        $summary = [
            'total' => $employees->count(),
            'present' => 0,
            'late' => 0,
            'early_leave' => 0,
            'absent' => 0,
            'incomplete' => 0,
            'holiday' => 0,
            'weekend' => 0,
        ];

        $rows = $employees->map(function (Employee $employee) use ($records, $day, &$summary) {
            $rec = $records->get($employee->id);
            $status = $rec?->status;

            if ($status && isset($summary[$status])) {
                $summary[$status]++;
            }

            return [
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'work_date' => $day->toDateString(),
                'check_in' => $rec?->first_in_at?->format('H:i'),
                'check_out' => $rec?->last_out_at?->format('H:i'),
                'status' => $status,
                'minutes_late' => $rec?->minutes_late,
                'minutes_worked' => $rec?->minutes_worked,
                'minutes_early_leave' => $rec?->minutes_early_leave,
                'expected_check_in' => $this->formatTimeHm($employee->employeeAttendanceSetting?->expected_check_in, '09:00'),
                'expected_check_out' => $this->formatTimeHm($employee->employeeAttendanceSetting?->expected_check_out, '18:00'),
            ];
        })->values();

        $monthStart = $day->copy()->startOfMonth();
        $monthEnd = $day->copy()->endOfMonth();
        $holidayCount = Holiday::query()
            ->whereBetween('observed_on', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->count();

        return Inertia::render('Attendance/Index', [
            'selectedDate' => $day->toDateString(),
            'selectedDateLabel' => $day->translatedFormat('l, d F Y'),
            'rows' => $rows,
            'summary' => $summary,
            'holidayCountThisMonth' => $holidayCount,
        ]);
    }

    private function formatTimeHm(mixed $value, string $fallback): string
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        return substr((string) $value, 0, 5);
    }
}
