<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatientVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'visit_id',
        'patient_id',
        'selected_doctor_id',
        'registration_fee',
        'doctor_fee',
        'total_amount',
        'discount_type',
        'discount_value',
        'discount_amount',
        'final_amount',
        'total_paid',
        'total_due',
        'payment_status',
        'vision_test_status',
        'prescription_status',
        'overall_status',
        'payment_completed_at',
        'vision_test_completed_at',
        'prescription_completed_at',
        'visit_notes',
        'chief_complaint',
        'is_followup',
        'created_by',
    ];

    protected $casts = [
        'registration_fee' => 'decimal:2',
        'doctor_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'total_due' => 'decimal:2',
        'is_followup' => 'boolean',
        'payment_completed_at' => 'datetime',
        'vision_test_completed_at' => 'datetime',
        'prescription_completed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($visit) {
            if (!$visit->visit_id) {
                $visit->visit_id = static::generateVisitId();
            }

            // Calculate fees automatically
            $visit->calculateFees();
        });

        static::updating(function ($visit) {
            if ($visit->isDirty(['selected_doctor_id', 'is_followup', 'discount_type', 'discount_value'])) {
                $visit->calculateFees();
            }
        });
    }

    /**
     * Generate unique visit ID
     */
    public static function generateVisitId()
    {
        $prefix = 'PV';
        $date = now()->format('Ymd');
        $lastVisit = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastVisit ? (intval(substr($lastVisit->visit_id, -4)) + 1) : 1;

        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate registration and doctor fees
     */
    public function calculateFees()
    {
        $this->registration_fee = 0.00; // No registration fee
        $this->doctor_fee = $this->getDoctorFee();
        $this->total_amount = $this->doctor_fee; // Only doctor fee
        $this->calculateDiscount();
        $this->final_amount = $this->total_amount - $this->discount_amount;
    }

    /**
     * Calculate discount
     */
    private function calculateDiscount()
    {
        if (!$this->discount_value || $this->discount_value <= 0) {
            $this->discount_amount = 0;
            return;
        }

        if ($this->discount_type === 'percentage') {
            $this->discount_amount = ($this->total_amount * $this->discount_value) / 100;
        } else {
            $this->discount_amount = min($this->discount_value, $this->total_amount);
        }
    }

    /**
     * Get doctor consultation fee
     */
    private function getDoctorFee()
    {
        if (!$this->selected_doctor_id) {
            return 0;
        }

        $doctor = Doctor::find($this->selected_doctor_id);
        if (!$doctor) {
            return 0;
        }

        // Use follow_up_fee if this is a follow-up visit, otherwise use consultation_fee
        return $this->is_followup ? ($doctor->follow_up_fee ?? 0) : $doctor->consultation_fee;
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function selectedDoctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'selected_doctor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PatientPayment::class, 'visit_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(PatientInvoice::class, 'visit_id');
    }

    public function visionTests(): HasMany
    {
        return $this->hasMany(VisionTest::class, 'visit_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'visit_id');
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /**
     * Mark payment as completed
     */
    public function completePayment()
    {
        $this->update([
            'payment_status' => 'paid',
            'overall_status' => 'vision_test',
            'payment_completed_at' => now(),
        ]);
    }

    /**
     * Mark vision test as completed
     */
    public function completeVisionTest()
    {
        $this->update([
            'vision_test_status' => 'completed',
            'overall_status' => 'prescription',
            'vision_test_completed_at' => now(),
        ]);
    }

    /**
     * Mark prescription as completed
     */
    public function completePrescription()
    {
        $this->update([
            'prescription_status' => 'completed',
            'overall_status' => 'completed',
            'prescription_completed_at' => now(),
        ]);
    }

    /**
     * Check if visit can proceed to vision test
     */
    public function canProceedToVisionTest()
    {
        return $this->payment_status === 'paid' &&
            $this->vision_test_status === 'pending' &&
            $this->overall_status === 'vision_test';
    }


    // ============================================
    // SCOPES
    // ============================================

    public function scopeReadyForVisionTest($query)
    {
        return $query->where('payment_status', 'paid')
            ->where('vision_test_status', 'pending')
            ->where('overall_status', 'vision_test');
    }

    public function scopeReadyForPrescription($query)
    {
        return $query->where('vision_test_status', 'completed')
            ->where('prescription_status', 'pending')
            ->where('overall_status', 'prescription');
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('overall_status', ['completed']);
    }

    /**
     * Update total_paid and total_due when payments change
     */
    public function updateTotals()
    {
        $totalPaid = $this->payments()->sum('amount');
        $totalDue = max(0, $this->final_amount - $totalPaid);

        // Update totals first
        $this->updateQuietly([
            'total_paid' => $totalPaid,
            'total_due' => $totalDue,
        ]);

        // Update payment status based on amounts
        if ($totalDue <= 0 && $totalPaid >= $this->final_amount) {
            // Fully paid
            if ($this->payment_status !== 'paid') {
                $this->update([
                    'payment_status' => 'paid',
                    'overall_status' => 'vision_test',
                    'payment_completed_at' => $this->payment_completed_at ?? now(),
                ]);
            }
        } elseif ($totalPaid > 0 && $totalPaid < $this->final_amount) {
            // Partially paid
            $this->updateQuietly(['payment_status' => 'partial']);
        } else {
            // No payment or pending
            $this->updateQuietly(['payment_status' => 'pending']);
        }
    }





    public function getFormattedVisitDateAttribute()
    {
        return $this->created_at->format('M d, Y');
    }

    public function getFormattedVisitTimeAttribute()
    {
        return $this->created_at->format('h:i A');
    }

    public function getStatusBadgeColorAttribute()
    {
        switch ($this->overall_status) {
            case 'payment':
                return 'red';
            case 'vision_test':
                return 'yellow';
            case 'prescription':
                return 'blue';
            case 'completed':
                return 'green';
            default:
                return 'gray';
        }
    }

    public function prescriptions()
    {
        // If prescriptions table has visit_id column
        return $this->hasMany(Prescription::class, 'visit_id');

    }

    public function todaysPrescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id', 'patient_id')
            ->where('doctor_id', $this->selected_doctor_id)
            ->whereDate('created_at', $this->created_at->toDateString());
    }
}
