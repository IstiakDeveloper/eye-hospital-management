<?php

namespace App\Services\Attendance;

use App\Models\AttendancePunch;
use App\Models\Employee;

class EmployeeZktecoResolver
{
    public static function resolveEmployeeId(?int $zkUid, ?string $zkEmployeeCode): ?int
    {
        if ($zkUid !== null) {
            $byUid = Employee::query()->where('zkteco_user_id', $zkUid)->value('id');
            if ($byUid) {
                return (int) $byUid;
            }
        }

        $code = self::normalizeCode($zkEmployeeCode);
        if ($code !== null) {
            $byCode = Employee::query()->where('employee_code', $code)->value('id');
            if ($byCode) {
                return (int) $byCode;
            }
        }

        return null;
    }

    public static function normalizeCode(?string $zkEmployeeCode): ?string
    {
        if ($zkEmployeeCode === null) {
            return null;
        }

        $code = trim($zkEmployeeCode);

        return $code === '' ? null : $code;
    }

    public static function backfillPunchEmployeeIds(): int
    {
        $updated = 0;

        AttendancePunch::query()
            ->whereNull('employee_id')
            ->orderBy('id')
            ->chunkById(500, function ($chunk) use (&$updated): void {
                foreach ($chunk as $punch) {
                    $employeeId = self::resolveEmployeeId($punch->zk_uid, $punch->zk_employee_code);
                    if ($employeeId) {
                        $punch->update(['employee_id' => $employeeId]);
                        $updated++;
                    }
                }
            });

        return $updated;
    }
}
