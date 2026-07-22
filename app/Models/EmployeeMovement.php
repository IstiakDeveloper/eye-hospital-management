<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class EmployeeMovement extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'purpose',
        'location',
        'status',
        'admin_remarks',
        'approved_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $appends = [
        'start_time_formatted',
        'end_time_formatted',
        'start_timestamp_ms',
    ];

    public function getStartTimeFormattedAttribute(): string
    {
        if (!$this->start_time) return '';
        try {
            return Carbon::createFromFormat('H:i:s', strlen($this->start_time) === 5 ? $this->start_time . ':00' : $this->start_time)->format('h:i A');
        } catch (\Exception $e) {
            try {
                return Carbon::parse($this->start_time)->format('h:i A');
            } catch (\Exception $ex) {
                return (string) $this->start_time;
            }
        }
    }

    public function getEndTimeFormattedAttribute(): ?string
    {
        if (!$this->end_time) return null;
        try {
            return Carbon::createFromFormat('H:i:s', strlen($this->end_time) === 5 ? $this->end_time . ':00' : $this->end_time)->format('h:i A');
        } catch (\Exception $e) {
            try {
                return Carbon::parse($this->end_time)->format('h:i A');
            } catch (\Exception $ex) {
                return (string) $this->end_time;
            }
        }
    }

    public function getStartTimestampMsAttribute(): int
    {
        if ($this->created_at) {
            return $this->created_at->timestamp * 1000;
        }

        try {
            $dateStr = $this->date ? $this->date->format('Y-m-d') : date('Y-m-d');
            return Carbon::parse($dateStr . ' ' . $this->start_time)->timestamp * 1000;
        } catch (\Exception $e) {
            return now()->timestamp * 1000;
        }
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
