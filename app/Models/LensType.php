<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LensType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'material',
        'coating',
        'price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function prescriptionGlasses(): HasMany
    {
        return $this->hasMany(PrescriptionGlasses::class);
    }

    public function getFullNameAttribute(): string
    {
        $parts = [$this->name];
        if ($this->type !== 'clear') {
            $parts[] = ucfirst($this->type);
        }
        if ($this->coating) {
            $parts[] = $this->coating;
        }
        return implode(' - ', $parts);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
