<?php

namespace App\Models;

use App\Enums\ZktecoDeviceCommandStatus;
use App\Enums\ZktecoDeviceCommandType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZktecoDeviceCommand extends Model
{
    protected $fillable = [
        'type',
        'status',
        'employee_id',
        'requested_by',
        'payload',
        'result',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ZktecoDeviceCommandType::class,
            'status' => ZktecoDeviceCommandStatus::class,
            'payload' => 'array',
            'result' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
