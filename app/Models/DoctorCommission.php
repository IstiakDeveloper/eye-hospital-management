<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'patient_payment_id',
        'commission_amount',
        'commission_percentage',
        'status',
        'earned_date',
        'paid_date',
        'notes',
    ];

    protected $casts = [
        'commission_amount' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'earned_date' => 'date',
        'paid_date' => 'date',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patientPayment(): BelongsTo
    {
        return $this->belongsTo(PatientPayment::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }
}
