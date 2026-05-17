<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceDayRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'work_date',
        'first_in_at',
        'last_out_at',
        'status',
        'minutes_late',
        'minutes_worked',
        'minutes_early_leave',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date',
            'first_in_at' => 'datetime',
            'last_out_at' => 'datetime',
            'minutes_late' => 'integer',
            'minutes_worked' => 'integer',
            'minutes_early_leave' => 'integer',
            'calculated_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
