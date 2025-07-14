<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisionTest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'right_eye_vision',
        'left_eye_vision',
        'right_eye_power',
        'left_eye_power',
        'right_eye_pressure',
        'left_eye_pressure',
        'right_eye_sphere',
        'left_eye_sphere',
        'right_eye_cylinder',
        'left_eye_cylinder',
        'right_eye_axis',
        'left_eye_axis',
        'additional_notes',
        'performed_by',
        'test_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'right_eye_power' => 'float',
        'left_eye_power' => 'float',
        'test_date' => 'datetime',
    ];

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();

        // Set test_date to current time if not provided
        static::creating(function ($visionTest) {
            if (!$visionTest->test_date) {
                $visionTest->test_date = now();
            }
        });
    }

    /**
     * Get the patient that owns the vision test.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the user who performed the vision test.
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PatientInvoice::class, 'invoice_id');
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->invoice && $this->invoice->status === 'paid';
    }

}
