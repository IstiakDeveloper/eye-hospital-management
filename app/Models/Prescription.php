<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_id',
        'visit_id',
        'diagnosis',
        'advice',
        'notes',
        'followup_date',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'followup_date' => 'date',
    ];

    /**
     * Get the patient that owns the prescription.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor that created the prescription.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the appointment associated with the prescription.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the user who created the prescription.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the prescription medicines for this prescription.
     */
    public function prescriptionMedicines(): HasMany
    {
        return $this->hasMany(PrescriptionMedicine::class);
    }

    /**
     * Get all of the medicines for the prescription.
     */
    public function medicines()
    {
        return $this->belongsToMany(Medicine::class, 'prescription_medicines')
            ->withPivot('dosage', 'duration', 'instructions')
            ->withTimestamps();
    }


    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PatientInvoice::class, 'invoice_id');
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->invoice && $this->invoice->status === 'paid';
    }

    public function prescriptionGlasses(): HasMany
    {
        return $this->hasMany(PrescriptionGlasses::class);
    }

    public function getHasGlassesAttribute(): bool
    {
        return $this->prescriptionGlasses()->exists();
    }
}
