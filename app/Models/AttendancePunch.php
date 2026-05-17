<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendancePunch extends Model
{
    protected $fillable = [
        'attendance_device_id',
        'zk_uid',
        'zk_employee_code',
        'employee_id',
        'punched_at',
        'state',
        'punch_type',
        'attendance_sync_type',
        'dedupe_hash',
    ];

    protected function casts(): array
    {
        return [
            'punched_at' => 'datetime',
            'zk_uid' => 'integer',
            'state' => 'integer',
            'punch_type' => 'integer',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(AttendanceDevice::class, 'attendance_device_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
