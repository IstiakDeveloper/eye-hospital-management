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
        'visit_id',

        // Patient complaints
        'complains',

        // Physical examination
        'right_eye_diagnosis',
        'left_eye_diagnosis',
        'right_eye_lids',
        'left_eye_lids',
        'right_eye_conjunctiva',
        'left_eye_conjunctiva',
        'right_eye_cornea',
        'left_eye_cornea',
        'right_eye_anterior_chamber',
        'left_eye_anterior_chamber',
        'right_eye_iris',
        'left_eye_iris',
        'right_eye_pupil',
        'left_eye_pupil',
        'right_eye_lens',
        'left_eye_lens',
        'right_eye_ocular_movements',
        'left_eye_ocular_movements',

        // Vision testing
        'right_eye_vision_without_glass',
        'left_eye_vision_without_glass',
        'right_eye_vision_with_glass',
        'left_eye_vision_with_glass',

        // IOP
        'right_eye_iop',
        'left_eye_iop',

        // Ducts
        'right_eye_ducts',
        'left_eye_ducts',

        // Vital signs
        'blood_pressure',
        'urine_sugar',
        'blood_sugar',

        // Fundus
        'right_eye_fundus',
        'left_eye_fundus',

        // History
        'detailed_history',

        // Medical conditions
        'is_one_eyed',
        'is_diabetic',
        'is_cardiac',
        'is_asthmatic',
        'is_hypertensive',
        'is_thyroid',
        'other_conditions',

        // Drugs
        'drugs_used',

        // Metadata
        'performed_by',
        'test_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'test_date' => 'datetime',
        'is_one_eyed' => 'boolean',
        'is_diabetic' => 'boolean',
        'is_cardiac' => 'boolean',
        'is_asthmatic' => 'boolean',
        'is_hypertensive' => 'boolean',
        'is_thyroid' => 'boolean',
    ];

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();

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

    /**
     * Get the visit associated with this vision test.
     */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_id');
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
