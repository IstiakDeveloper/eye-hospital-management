<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'name',
        'phone',
        'email',
        'address',
        'date_of_birth',
        'gender',
        'medical_history',
        'registered_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate patient_id before saving
        static::creating(function ($patient) {
            if (!$patient->patient_id) {
                $patient->patient_id = 'EH-' . date('Y') . '-' . str_pad((Patient::count() + 1), 5, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Get the user who registered this patient.
     */
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    /**
     * Get the vision tests for this patient.
     */
    public function visionTests(): HasMany
    {
        return $this->hasMany(VisionTest::class);
    }



    /**
     * Get the appointments for this patient.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get the prescriptions for this patient.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    /**
     * Get the latest vision test for this patient.
     */
    public function latestVisionTest()
    {
        return $this->visionTests()->latest('test_date')->first();
    }

    /**
     * Get the age of the patient.
     *
     * @return int|null
     */
    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }
}
