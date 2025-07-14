<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_name',
        'service_type',
        'base_price',
        'doctor_fee',
        'hospital_fee',
        'description',
        'is_active',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'doctor_fee' => 'decimal:2',
        'hospital_fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('service_type', $type);
    }
}

