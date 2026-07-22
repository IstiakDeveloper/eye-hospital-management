<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'days_allowed',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
