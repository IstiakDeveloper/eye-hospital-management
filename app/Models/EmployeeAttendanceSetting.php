<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeAttendanceSetting extends Model
{
    protected $fillable = [
        'employee_id',
        'expected_check_in',
        'expected_check_out',
        'grace_minutes',
        'weekend_days',
    ];

    protected function casts(): array
    {
        return [
            'grace_minutes' => 'integer',
            'weekend_days' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
