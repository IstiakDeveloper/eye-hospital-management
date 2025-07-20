<?php

namespace App\Models;

use App\Events\AppointmentUpdated;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
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
        'visit_id',
        'appointment_date',
        'appointment_time',
        'serial_number',
        'status',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'appointment_date' => 'date',
    ];

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate serial number before saving
        static::creating(function ($appointment) {
            if (!$appointment->serial_number) {
                // Get the count of appointments for this doctor on this date
                $count = self::where('doctor_id', $appointment->doctor_id)
                    ->where('appointment_date', $appointment->appointment_date)
                    ->count();

                // Generate serial number: D{doctor_id}-{YYYYMMDD}-{count+1}
                $appointment->serial_number = 'D' . $appointment->doctor_id . '-'
                    . $appointment->appointment_date->format('Ymd') . '-'
                    . str_pad(($count + 1), 3, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Get the patient for this appointment.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PatientInvoice::class, 'invoice_id');
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->invoice && $this->invoice->status === 'paid';
    }

    /**
     * Get the doctor for this appointment.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the user who created this appointment.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the prescription associated with this appointment.
     */
    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }

    /**
     * Scope a query to only include pending appointments.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include completed appointments.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include cancelled appointments.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope a query to only include today's appointments.
     */
    public function scopeToday($query)
    {
        return $query->where('appointment_date', today());
    }

    public function visit()
    {
        return $this->belongsTo(PatientVisit::class, 'visit_id');
    }


    protected static function booted()
    {
        static::created(function ($appointment) {
            broadcast(new AppointmentUpdated($appointment));
        });

        static::updated(function ($appointment) {
            broadcast(new AppointmentUpdated($appointment));
        });

        static::deleted(function ($appointment) {
            broadcast(new AppointmentUpdated($appointment));
        });
    }
}
