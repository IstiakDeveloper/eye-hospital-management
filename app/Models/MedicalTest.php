<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalTest extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'price',
        'category',
        'duration_minutes',
        'is_active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration_minutes' => 'integer'
    ];

    // Relationships
    public function patientTests(): HasMany
    {
        return $this->hasMany(PatientMedicalTest::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // Helper Methods
    public static function getCategories(): array
    {
        return [
            'Laboratory' => 'Laboratory Tests',
            'Radiology' => 'Radiology/Imaging',
            'Cardiology' => 'Cardiology',
            'Pathology' => 'Pathology',
            'Ophthalmology' => 'Eye Tests',
            'Other' => 'Other Tests'
        ];
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2);
    }
}
