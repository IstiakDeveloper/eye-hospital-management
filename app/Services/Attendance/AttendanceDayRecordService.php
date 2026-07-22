<?php

namespace App\Services\Attendance;

use App\Enums\AttendanceDayStatus;
use App\Models\AttendanceDayRecord;
use App\Models\AttendancePunch;
use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceDayRecordService
{
    public function ensureSettings(Employee $employee): EmployeeAttendanceSetting
    {
        return EmployeeAttendanceSetting::query()->firstOrCreate(
            ['employee_id' => $employee->id],
            [
                'expected_check_in' => '09:00:00',
                'expected_check_out' => '18:00:00',
                'grace_minutes' => 10,
                'weekend_days' => [5, 6],
            ]
        );
    }

    /**
     * Ensure every active employee has an AttendanceDayRecord for a given date.
     * If no punch or movement exists, automatically calculate & persist Absent (or Holiday/Weekend).
     */
    public function ensureRecordsForDate(Carbon $date): void
    {
        $ymd = $date->toDateString();

        $activeEmployees = Employee::query()
            ->where('is_active', true)
            ->get();

        $existingRecordEmployeeIds = AttendanceDayRecord::query()
            ->whereDate('work_date', $ymd)
            ->pluck('employee_id')
            ->toArray();

        foreach ($activeEmployees as $employee) {
            if (!in_array($employee->id, $existingRecordEmployeeIds, true)) {
                $this->calculateOneDay($employee, $date);
            }
        }
    }

    /**
     * @param  Collection<int, Employee>  $employees
     */
    public function recalculateForDateRange(Collection $employees, Carbon $from, Carbon $to): int
    {
        $count = 0;
        foreach ($employees as $employee) {
            $cursor = $from->copy()->startOfDay();
            $end = $to->copy()->startOfDay();
            while ($cursor->lte($end)) {
                $this->calculateOneDay($employee, $cursor->copy());
                $count++;
                $cursor->addDay();
            }
        }

        return $count;
    }

    /**
     * @param  array<int>  $employeeIds
     * @param  array<int, string>  $datesYmd  Work dates (Y-m-d) in app timezone
     */
    public function recalculateForEmployeeDates(array $employeeIds, array $datesYmd): int
    {
        $count = 0;
        $employees = Employee::query()->whereIn('id', $employeeIds)->get();
        foreach ($employees as $employee) {
            foreach ($datesYmd as $ymd) {
                $this->calculateOneDay($employee, Carbon::parse($ymd, config('app.timezone'))->startOfDay());
                $count++;
            }
        }

        return $count;
    }

    public function calculateOneDay(Employee $employee, Carbon $workDate): AttendanceDayRecord
    {
        $settings = $this->ensureSettings($employee);
        $tz = config('app.timezone');
        $day = $workDate->copy()->timezone($tz)->startOfDay();

        $start = $day->copy()->startOfDay();
        $end = $day->copy()->endOfDay();

        $punches = AttendancePunch::query()
            ->whereBetween('punched_at', [$start, $end])
            ->where(function ($query) use ($employee): void {
                $query->where('employee_id', $employee->id);

                if ($employee->zkteco_user_id) {
                    $query->orWhere('zk_uid', $employee->zkteco_user_id);
                }

                $code = EmployeeZktecoResolver::normalizeCode($employee->employee_code);
                if ($code !== null) {
                    $query->orWhere('zk_employee_code', $code);
                }
            })
            ->orderBy('punched_at')
            ->get();

        $movements = \App\Models\EmployeeMovement::query()
            ->where('employee_id', $employee->id)
            ->whereDate('date', $day->toDateString())
            ->get();

        $earliestMovementStart = null;
        $latestMovementEnd = null;

        foreach ($movements as $m) {
            if ($m->start_time) {
                $mStart = $day->copy()->setTimeFromTimeString(substr((string) $m->start_time, 0, 5));
                if (!$earliestMovementStart || $mStart->lt($earliestMovementStart)) {
                    $earliestMovementStart = $mStart;
                }
            }
            if ($m->end_time) {
                $mEnd = $day->copy()->setTimeFromTimeString(substr((string) $m->end_time, 0, 5));
                if (!$latestMovementEnd || $mEnd->gt($latestMovementEnd)) {
                    $latestMovementEnd = $mEnd;
                }
            }
        }

        // If NO punches and NO movements exist for this employee on this date
        if ($punches->isEmpty() && !$earliestMovementStart) {
            // Check for Holiday
            if (Holiday::query()->whereDate('observed_on', $day->toDateString())->exists()) {
                return $this->persist($employee, $day, AttendanceDayStatus::Holiday, null, null, null, null, null);
            }

            // Check for Weekend
            $weekendDays = $settings->weekend_days ?? [];
            if (in_array((int) $day->format('w'), array_map('intval', $weekendDays), true)) {
                return $this->persist($employee, $day, AttendanceDayStatus::Weekend, null, null, null, null, null);
            }

            // Default to Absent
            return $this->persist($employee, $day, AttendanceDayStatus::Absent, null, null, null, null, null);
        }

        $punchFirstIn = $punches->first()?->punched_at;
        $punchLastOut = $punches->last()?->punched_at;

        // Determine absolute earliest Check-In time (between ZKTeco punch and Movement start)
        $firstIn = $punchFirstIn;
        if ($earliestMovementStart && (!$firstIn || $earliestMovementStart->lt($firstIn))) {
            $firstIn = $earliestMovementStart;
        }

        // Determine absolute latest Check-Out time (between ZKTeco punch and Movement end)
        $lastOut = $punchLastOut;
        if ($latestMovementEnd && (!$lastOut || $latestMovementEnd->gt($lastOut))) {
            $lastOut = $latestMovementEnd;
        }

        if (!$lastOut) {
            $lastOut = $firstIn;
        }

        $expectedIn = $day->copy()->setTimeFromTimeString((string) $settings->expected_check_in);
        $expectedOut = $day->copy()->setTimeFromTimeString((string) $settings->expected_check_out);
        $graceEnd = $expectedIn->copy()->addMinutes((int) $settings->grace_minutes);

        $singlePunch = ($punches->count() <= 1 && !$latestMovementEnd)
            && ($firstIn && $lastOut && $firstIn->equalTo($lastOut));

        if ($singlePunch) {
            return $this->persist($employee, $day, AttendanceDayStatus::Incomplete, $firstIn, $lastOut, null, null, null);
        }

        $minutesLate = null;
        $minutesWorked = max(0, (int) $firstIn->diffInMinutes($lastOut));
        $minutesEarlyLeave = null;
        $status = AttendanceDayStatus::Present;

        if ($firstIn->gt($graceEnd)) {
            $status = AttendanceDayStatus::Late;
            $minutesLate = max(0, (int) $expectedIn->diffInMinutes($firstIn, false));
        }

        if ($lastOut->lt($expectedOut)) {
            $minutesEarlyLeave = max(0, (int) $lastOut->diffInMinutes($expectedOut, false));
            if ($status === AttendanceDayStatus::Present) {
                $status = AttendanceDayStatus::EarlyLeave;
            }
        }

        return $this->persist($employee, $day, $status, $firstIn, $lastOut, $minutesLate, $minutesWorked, $minutesEarlyLeave);
    }

    private function persist(
        Employee $employee,
        Carbon $workDate,
        AttendanceDayStatus $status,
        ?Carbon $firstIn,
        ?Carbon $lastOut,
        ?int $minutesLate,
        ?int $minutesWorked = null,
        ?int $minutesEarlyLeave = null,
    ): AttendanceDayRecord {
        $workDateYmd = $workDate->toDateString();

        $record = AttendanceDayRecord::query()
            ->where('employee_id', $employee->id)
            ->whereDate('work_date', $workDateYmd)
            ->first();

        $attributes = [
            'first_in_at' => $firstIn,
            'last_out_at' => $lastOut,
            'status' => $status->value,
            'minutes_late' => $minutesLate,
            'minutes_worked' => $minutesWorked,
            'minutes_early_leave' => $minutesEarlyLeave,
            'calculated_at' => now(),
        ];

        if ($record) {
            $record->update($attributes);

            return $record->fresh();
        }

        return AttendanceDayRecord::query()->create([
            'employee_id' => $employee->id,
            'work_date' => $workDateYmd,
            ...$attributes,
        ]);
    }

    public function saveManualDayRecord(
        Employee $employee,
        string $workDateYmd,
        AttendanceDayStatus $status,
        ?string $firstInHi,
        ?string $lastOutHi,
        ?int $minutesLate
    ): AttendanceDayRecord {
        $tz = config('app.timezone');
        $day = Carbon::parse($workDateYmd, $tz)->startOfDay();

        $firstIn = ($firstInHi !== null && $firstInHi !== '')
            ? $day->copy()->setTimeFromTimeString($firstInHi)
            : null;
        $lastOut = ($lastOutHi !== null && $lastOutHi !== '')
            ? $day->copy()->setTimeFromTimeString($lastOutHi)
            : null;

        return $this->persist($employee, $day, $status, $firstIn, $lastOut, $minutesLate, null, null);
    }
}
