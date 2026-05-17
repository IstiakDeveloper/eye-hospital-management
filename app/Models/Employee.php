<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'name',
        'phone',
        'email',
        'department',
        'designation',
        'date_of_join',
        'is_active',
        'zkteco_user_id',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'date_of_join' => 'date',
            'is_active' => 'boolean',
            'zkteco_user_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employeeAttendanceSetting(): HasOne
    {
        return $this->hasOne(EmployeeAttendanceSetting::class);
    }

    public function attendancePunches(): HasMany
    {
        return $this->hasMany(AttendancePunch::class);
    }

    public function attendanceDayRecords(): HasMany
    {
        return $this->hasMany(AttendanceDayRecord::class);
    }
}
