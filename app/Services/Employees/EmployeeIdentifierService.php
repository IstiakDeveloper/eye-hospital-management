<?php

namespace App\Services\Employees;

use App\Models\Employee;

class EmployeeIdentifierService
{
    public function suggestEmployeeCode(): string
    {
        $maxNumeric = 0;

        foreach (Employee::query()->pluck('employee_code') as $code) {
            $code = (string) $code;
            if (ctype_digit($code)) {
                $maxNumeric = max($maxNumeric, (int) $code);
            }
        }

        if ($maxNumeric > 0) {
            return str_pad((string) ($maxNumeric + 1), 6, '0', STR_PAD_LEFT);
        }

        $nextId = (int) (Employee::query()->max('id') ?? 0) + 1;

        return str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }

    public function suggestZktecoUserId(): int
    {
        $max = (int) (Employee::query()->max('zkteco_user_id') ?? 0);

        return max($max + 1, 1);
    }
}
