<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_name',
        'action',
        'record_id',
        'old_values',
        'new_values',
        'user_id',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForTable($query, $tableName)
    {
        return $query->where('table_name', $tableName);
    }

    public function scopeForRecord($query, $tableName, $recordId)
    {
        return $query->where('table_name', $tableName)
            ->where('record_id', $recordId);
    }
}
