<?php

namespace App\Services\Attendance;

use App\Models\AttendanceDevice;
use App\Models\AttendancePunch;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ZktecoSyncService
{
    public function __construct(
        protected AttendanceDayRecordService $dayRecordService
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array{
     *     inserted: int,
     *     skipped: int,
     *     recalculated_days: int,
     *     employees_recalculated: array<int, int>,
     *     dates_touched: array<int, string>,
     *     unmapped_zk_uids: array<int, int>
     * }
     */
    public function sync(array $payload): array
    {
        $externalDeviceId = (int) ($payload['device_id'] ?? 0);
        if ($externalDeviceId <= 0) {
            throw new \InvalidArgumentException('device_id is required.');
        }

        $device = AttendanceDevice::query()->updateOrCreate(
            ['external_device_id' => $externalDeviceId],
            [
                'name' => (string) ($payload['device_name'] ?? 'Device '.$externalDeviceId),
                'ip_address' => isset($payload['device_ip']) ? (string) $payload['device_ip'] : null,
                'last_synced_at' => now(),
            ]
        );

        $attendanceData = $payload['attendance_data'] ?? [];
        if (! is_array($attendanceData)) {
            $attendanceData = [];
        }

        $inserted = 0;
        $skipped = 0;
        /** @var array<int, array<string, true>> $employeeDates */
        $employeeDates = [];
        /** @var array<int, array<string, true>> $zkUidDates */
        $zkUidDates = [];

        DB::transaction(function () use ($attendanceData, $device, &$inserted, &$skipped, &$employeeDates, &$zkUidDates): void {
            foreach ($attendanceData as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $parsed = $this->parseAttendanceRow($row, $device->external_device_id);
                if ($parsed === null) {
                    $skipped++;

                    continue;
                }

                $this->trackRecalcTargets($parsed['zk_uid'], $parsed['employee_id'], $parsed['date'], $employeeDates, $zkUidDates);

                if (AttendancePunch::query()->where('dedupe_hash', $parsed['dedupe'])->exists()) {
                    $skipped++;

                    continue;
                }

                AttendancePunch::query()->create([
                    'attendance_device_id' => $device->id,
                    'zk_uid' => $parsed['zk_uid'],
                    'zk_employee_code' => $parsed['zk_code'],
                    'employee_id' => $parsed['employee_id'],
                    'punched_at' => $parsed['punched_at'],
                    'state' => $parsed['state'],
                    'punch_type' => $parsed['punch_type'],
                    'attendance_sync_type' => $parsed['sync_type'],
                    'dedupe_hash' => $parsed['dedupe'],
                ]);

                $inserted++;
            }
        });

        EmployeeZktecoResolver::backfillPunchEmployeeIds();

        $employeesRecalc = $this->resolveEmployeesForRecalc($employeeDates, $zkUidDates);
        $datesFlat = $this->collectDates($employeesRecalc);

        $recalculatedDays = 0;
        if ($employeesRecalc !== [] && $datesFlat !== []) {
            $recalculatedDays = $this->dayRecordService->recalculateForEmployeeDates(
                array_keys($employeesRecalc),
                $datesFlat
            );
        }

        $unmappedZkUids = [];
        foreach (array_keys($zkUidDates) as $zkUid) {
            if (EmployeeZktecoResolver::resolveEmployeeId((int) $zkUid, null) === null) {
                $unmappedZkUids[] = (int) $zkUid;
            }
        }
        sort($unmappedZkUids);

        return [
            'inserted' => $inserted,
            'skipped' => $skipped,
            'recalculated_days' => $recalculatedDays,
            'employees_recalculated' => array_map('intval', array_keys($employeesRecalc)),
            'employees_touched' => array_map('intval', array_keys($employeesRecalc)),
            'users_touched' => [],
            'dates_touched' => $datesFlat,
            'unmapped_zk_uids' => $unmappedZkUids,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{
     *     zk_uid: ?int,
     *     zk_code: ?string,
     *     employee_id: ?int,
     *     punched_at: Carbon,
     *     date: string,
     *     state: ?int,
     *     punch_type: ?int,
     *     sync_type: ?string,
     *     dedupe: string
     * }|null
     */
    protected function parseAttendanceRow(array $row, int $externalDeviceId): ?array
    {
        $zkUid = isset($row['uid']) ? (int) $row['uid'] : null;
        $zkCode = isset($row['id']) ? trim((string) $row['id']) : null;
        if ($zkUid === 0) {
            $zkUid = null;
        }

        $timestamp = $row['timestamp'] ?? null;
        if (! $timestamp) {
            return null;
        }

        try {
            $punchedAt = Carbon::parse($timestamp, config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }

        $state = isset($row['state']) ? (int) $row['state'] : null;
        $punchType = isset($row['type']) ? (int) $row['type'] : null;
        $syncType = isset($row['attendance_type']) ? (string) $row['attendance_type'] : null;

        $employeeId = EmployeeZktecoResolver::resolveEmployeeId($zkUid, $zkCode);

        $dedupe = hash('sha256', implode('|', [
            (string) $externalDeviceId,
            (string) ($zkUid ?? ''),
            (string) ($zkCode ?? ''),
            $punchedAt->format('Y-m-d H:i:s'),
            (string) ($state ?? ''),
            (string) ($punchType ?? ''),
            (string) ($syncType ?? ''),
        ]));

        return [
            'zk_uid' => $zkUid,
            'zk_code' => $zkCode ?: null,
            'employee_id' => $employeeId ? (int) $employeeId : null,
            'punched_at' => $punchedAt,
            'date' => $punchedAt->toDateString(),
            'state' => $state,
            'punch_type' => $punchType,
            'sync_type' => $syncType,
            'dedupe' => $dedupe,
        ];
    }

    /**
     * @param  array<int, array<string, true>>  $employeeDates
     * @param  array<int, array<string, true>>  $zkUidDates
     */
    protected function trackRecalcTargets(
        ?int $zkUid,
        ?int $employeeId,
        string $date,
        array &$employeeDates,
        array &$zkUidDates,
    ): void {
        if ($zkUid !== null) {
            $zkUidDates[$zkUid] = $zkUidDates[$zkUid] ?? [];
            $zkUidDates[$zkUid][$date] = true;
        }

        if ($employeeId !== null) {
            $employeeDates[$employeeId] = $employeeDates[$employeeId] ?? [];
            $employeeDates[$employeeId][$date] = true;
        }
    }

    /**
     * @param  array<int, array<string, true>>  $employeeDates
     * @param  array<int, array<string, true>>  $zkUidDates
     * @return array<int, array<string, true>>
     */
    protected function resolveEmployeesForRecalc(array $employeeDates, array $zkUidDates): array
    {
        foreach ($zkUidDates as $zkUid => $dates) {
            $resolvedId = Employee::query()->where('zkteco_user_id', $zkUid)->value('id');
            if (! $resolvedId) {
                continue;
            }
            $employeeDates[(int) $resolvedId] = array_merge(
                $employeeDates[(int) $resolvedId] ?? [],
                $dates
            );
        }

        return $employeeDates;
    }

    /**
     * @param  array<int, array<string, true>>  $employeeDates
     * @return array<int, string>
     */
    protected function collectDates(array $employeeDates): array
    {
        $dates = [];
        foreach ($employeeDates as $dateMap) {
            foreach (array_keys($dateMap) as $date) {
                $dates[$date] = true;
            }
        }

        return array_keys($dates);
    }
}
