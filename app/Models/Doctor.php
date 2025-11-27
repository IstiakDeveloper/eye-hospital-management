<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'specialization',
        'qualification',
        'bio',
        'consultation_fee',
        'follow_up_fee',
        'is_available',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'consultation_fee' => 'decimal:2',
        'follow_up_fee' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    /**
     * Get the user associated with the doctor.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the appointments for this doctor.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(DoctorCommission::class);
    }

    public function getPendingCommissionsAttribute()
    {
        return $this->commissions()->pending()->sum('commission_amount');
    }

    public function getTotalEarningsAttribute()
    {
        return $this->commissions()->sum('commission_amount');
    }


    /**
     * Get the prescriptions created by this doctor.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    /**
     * Get the doctor's name from the associated user.
     */
    public function getNameAttribute()
    {
        return $this->user->name;
    }

    /**
     * Get today's appointments for this doctor.
     */
    public function getTodayAppointmentsAttribute()
    {
        return $this->appointments()
            ->where('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();
    }

    public function recentAppointments()
    {
        return $this->hasMany(Appointment::class)
            ->with('patient')
            ->whereIn('status', ['pending', 'processing', 'cancelled'])
            ->orderByRaw("FIELD(status, 'processing', 'pending', 'cancelled')")
            ->orderBy('created_at', 'desc');
    }
}
