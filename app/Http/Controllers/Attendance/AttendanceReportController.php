<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\EmployeeLeave;
use App\Models\EmployeeMovement;
use App\Models\Holiday;
use App\Models\LeaveType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceReportController extends Controller
{
    private const STATUSES = [
        'present',
        'late',
        'early_leave',
        'incomplete',
        'absent',
        'holiday',
        'weekend',
    ];

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'status' => ['nullable', 'in:'.implode(',', self::STATUSES)],
        ]);

        $from = Carbon::parse($validated['start_date'] ?? now()->startOfMonth())->startOfDay();
        $to = Carbon::parse($validated['end_date'] ?? now())->endOfDay();
        $filters = [
            'start_date' => $from->toDateString(),
            'end_date' => $to->toDateString(),
            'employee_id' => $validated['employee_id'] ?? '',
            'status' => $validated['status'] ?? '',
        ];

        $query = $this->filteredRecords($filters);
        $summary = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $records = $query
            ->with('employee:id,employee_code,name')
            ->orderByDesc('work_date')
            ->orderBy('employee_id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (AttendanceDayRecord $record): array => $this->recordPayload($record));

        return Inertia::render('Attendance/Report', [
            'employees' => $this->activeEmployees(),
            'records' => $records,
            'filters' => $filters,
            'summary' => $this->summaryPayload($summary),
        ]);
    }

    public function employeeDashboard(Request $request): Response
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        $from = Carbon::parse($validated['start_date'] ?? now()->startOfMonth())->startOfDay();
        $to = Carbon::parse($validated['end_date'] ?? now())->endOfDay();
        $employeeId = $validated['employee_id'] ?? '';
        $filters = [
            'employee_id' => $employeeId,
            'start_date' => $from->toDateString(),
            'end_date' => $to->toDateString(),
        ];

        $summary = $this->summaryPayload([]);
        $employee = null;
        $attendance = [];
        $leaves = [];
        $leaveBalances = [];
        $leaveSummary = [
            'total' => 0,
            'approved' => 0,
            'pending' => 0,
            'rejected' => 0,
            'approved_days' => 0,
        ];
        $movements = [];
        $movementSummary = [
            'total' => 0,
            'approved' => 0,
            'pending' => 0,
            'rejected' => 0,
        ];

        if ($employeeId !== '') {
            $employee = Employee::query()
                ->with('employeeAttendanceSetting')
                ->where('is_active', true)
                ->findOrFail((int) $employeeId);

            $employeeRecords = AttendanceDayRecord::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('work_date', [$from->toDateString(), $to->toDateString()])
                ->get()
                ->keyBy(fn (AttendanceDayRecord $record): string => $record->work_date->format('Y-m-d'));
            $holidayDates = Holiday::query()
                ->whereBetween('observed_on', [$from->toDateString(), $to->toDateString()])
                ->pluck('observed_on')
                ->map(fn ($date): string => Carbon::parse($date)->toDateString())
                ->flip();
            $weekendDays = array_map('intval', $employee->employeeAttendanceSetting?->weekend_days ?? [5, 6]);
            $summaryCounts = [];

            foreach (CarbonPeriod::create($from->toDateString(), $to->toDateString()) as $day) {
                $date = $day->toDateString();
                $record = $employeeRecords->get($date);
                $status = $record?->status;

                if (! $status) {
                    $status = $holidayDates->has($date)
                        ? 'holiday'
                        : (in_array((int) $day->format('w'), $weekendDays, true) ? 'weekend' : 'not_recorded');
                }

                $summaryCounts[$status] = ($summaryCounts[$status] ?? 0) + 1;
                $attendance[] = [
                    'work_date' => $date,
                    'status' => $status,
                    'check_in' => $record?->first_in_at?->format('H:i'),
                    'check_out' => $record?->last_out_at?->format('H:i'),
                    'minutes_late' => $record?->minutes_late,
                    'minutes_worked' => $record?->minutes_worked,
                    'minutes_early_leave' => $record?->minutes_early_leave,
                ];
            }
            $summary = $this->summaryPayload($summaryCounts);

            $leaveRecords = EmployeeLeave::query()
                ->with('leaveType:id,name')
                ->where('employee_id', $employee->id)
                ->whereDate('start_date', '<=', $to->toDateString())
                ->whereDate('end_date', '>=', $from->toDateString())
                ->orderByDesc('start_date')
                ->get();

            $leaveTypes = LeaveType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'days_allowed']);
            $yearCount = $to->year - $from->year + 1;
            $usedDaysByType = [];

            foreach ($leaveRecords as $leave) {
                $overlapStart = $leave->start_date->greaterThan($from) ? $leave->start_date : $from;
                $overlapEnd = $leave->end_date->lessThan($to) ? $leave->end_date : $to;
                $days = (int) $overlapStart->diffInDays($overlapEnd) + 1;
                $status = $leave->status;
                $leaveSummary[$status] = ($leaveSummary[$status] ?? 0) + 1;
                $leaveSummary['total']++;

                if ($status === 'approved') {
                    $leaveSummary['approved_days'] += $days;
                    $usedDaysByType[$leave->leave_type_id] = ($usedDaysByType[$leave->leave_type_id] ?? 0) + $days;
                }

                $leaves[] = [
                    'id' => $leave->id,
                    'leave_type' => $leave->leaveType?->name ?? 'Leave',
                    'start_date' => $leave->start_date->format('Y-m-d'),
                    'end_date' => $leave->end_date->format('Y-m-d'),
                    'days_in_period' => $days,
                    'status' => $status,
                    'reason' => $leave->reason,
                ];
            }

            foreach ($leaveTypes as $leaveType) {
                $used = $usedDaysByType[$leaveType->id] ?? 0;
                $allowed = $leaveType->days_allowed * $yearCount;
                $leaveBalances[] = [
                    'id' => $leaveType->id,
                    'name' => $leaveType->name,
                    'allowed_days' => $allowed,
                    'used_days' => $used,
                    'available_days' => max(0, $allowed - $used),
                ];
            }

            $movementRecords = EmployeeMovement::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orderByDesc('date')
                ->orderByDesc('start_time')
                ->get();

            foreach ($movementRecords as $movement) {
                $movementSummary['total']++;
                $movementSummary[$movement->status] = ($movementSummary[$movement->status] ?? 0) + 1;
                $movements[] = [
                    'id' => $movement->id,
                    'date' => $movement->date->format('Y-m-d'),
                    'start_time' => $movement->start_time_formatted,
                    'end_time' => $movement->end_time_formatted,
                    'purpose' => $movement->purpose,
                    'location' => $movement->location,
                    'status' => $movement->status,
                ];
            }
        }

        return Inertia::render('Employees/Dashboard', [
            'employees' => $this->activeEmployees(),
            'selectedEmployee' => $employee ? [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'department' => $employee->department,
                'designation' => $employee->designation,
            ] : null,
            'attendance' => $attendance,
            'filters' => $filters,
            'summary' => $summary,
            'leaves' => $leaves,
            'leaveBalances' => $leaveBalances,
            'leaveSummary' => $leaveSummary,
            'movements' => $movements,
            'movementSummary' => $movementSummary,
        ]);
    }

    /**
     * @param  array{start_date: string, end_date: string, employee_id?: string|int, status?: string}  $filters
     * @return Builder<AttendanceDayRecord>
     */
    private function filteredRecords(array $filters): Builder
    {
        return AttendanceDayRecord::query()
            ->whereDate('work_date', '>=', $filters['start_date'])
            ->whereDate('work_date', '<=', $filters['end_date'])
            ->when(($filters['employee_id'] ?? '') !== '', fn (Builder $query) => $query->where('employee_id', $filters['employee_id']))
            ->when(($filters['status'] ?? '') !== '', fn (Builder $query) => $query->where('status', $filters['status']));
    }

    private function activeEmployees()
    {
        return Employee::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name']);
    }

    /**
     * @param  array<string, int|string>  $counts
     * @return array<string, int>
     */
    private function summaryPayload(array $counts): array
    {
        $summary = ['total' => 0];
        foreach ([...self::STATUSES, 'not_recorded'] as $status) {
            $summary[$status] = (int) ($counts[$status] ?? 0);
            $summary['total'] += $summary[$status];
        }

        return $summary;
    }

    /**
     * @return array<string, mixed>
     */
    private function recordPayload(AttendanceDayRecord $record): array
    {
        return [
            'id' => $record->id,
            'work_date' => $record->work_date->format('Y-m-d'),
            'status' => $record->status,
            'check_in' => $record->first_in_at?->format('H:i'),
            'check_out' => $record->last_out_at?->format('H:i'),
            'minutes_late' => $record->minutes_late,
            'minutes_worked' => $record->minutes_worked,
            'minutes_early_leave' => $record->minutes_early_leave,
            'employee' => $record->employee ? [
                'id' => $record->employee->id,
                'employee_code' => $record->employee->employee_code,
                'name' => $record->employee->name,
            ] : null,
        ];
    }
}
