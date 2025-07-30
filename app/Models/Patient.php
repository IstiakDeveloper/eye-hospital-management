<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'name',
        'phone',
        'nid_card',
        'email',
        'address',
        'date_of_birth',
        'gender',
        'medical_history',
        'registered_by',
        'qr_code',
        'qr_code_image_path'
    ];

    // Prevent total_paid/total_due from being saved to database
    protected $guarded = ['total_paid', 'total_due'];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    // Add to appends to make these available as attributes
    protected $appends = ['age', 'total_visits', 'last_visit_date'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($patient) {
            if (!$patient->patient_id) {
                $patient->patient_id = static::generatePatientId();
            }
        });

        static::created(function ($patient) {
            $patient->generateQrCode();
        });
    }

    /**
     * Generate unique patient ID
     */
    public static function generatePatientId()
    {
        $lastPatient = static::orderBy('id', 'desc')->first();

        $sequence = $lastPatient ? ((int) $lastPatient->patient_id + 1) : 1;

        return str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }


    /**
     * Generate QR code
     */
    public function generateQrCode()
    {
        $qrCode = 'EH-' . date('Ymd') . '-' . strtoupper(substr(md5($this->id . time()), 0, 6));
        $this->update(['qr_code' => $qrCode]);
        return $qrCode;
    }

    /**
     * Find existing patient by phone or NID
     */
    public static function findExisting($phone, $nidCard = null)
    {
        $query = static::where('phone', $phone);

        if ($nidCard) {
            $query->orWhere('nid_card', $nidCard);
        }

        return $query->first();
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(PatientVisit::class);
    }

    public function currentVisit()
    {
        return $this->hasOne(PatientVisit::class)->latest();
    }

    public function activeVisits()
    {
        return $this->hasMany(PatientVisit::class)
            ->whereNotIn('overall_status', ['completed']);
    }

    public function visionTests(): HasMany
    {
        return $this->hasMany(VisionTest::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PatientPayment::class);
    }

    /**
     * Get patient age
     */
    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }

    /**
     * Get total visits count
     */
    public function getTotalVisitsAttribute()
    {
        return $this->visits()->count();
    }

    /**
     * Check if patient has active visit
     */
    public function hasActiveVisit()
    {
        return $this->activeVisits()->exists();
    }

    /**
     * Get total paid amount across all visits - METHOD instead of attribute
     */
    public function getTotalPaid()
    {
        return $this->visits()->sum('total_paid');
    }

    /**
     * Get total due amount across all visits - METHOD instead of attribute
     */
    public function getTotalDue()
    {
        return $this->visits()->sum('total_due');
    }

    /**
     * Get last visit date
     */
    public function getLastVisitDateAttribute()
    {
        $lastVisit = $this->visits()->latest()->first();
        return $lastVisit ? $lastVisit->created_at : null;
    }

    /**
     * Create new visit for this patient
     */
    public function createNewVisit(array $visitData = [])
    {
        return $this->visits()->create(array_merge([
            'created_by' => auth()->id(),
        ], $visitData));
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeWithTotals($query)
    {
        return $query->withSum('visits as total_paid_sum', 'total_paid')
            ->withSum('visits as total_due_sum', 'total_due');
    }

    public function scopeActive($query)
    {
        return $query->whereHas('activeVisits');
    }

    public function scopeCompleted($query)
    {
        return $query->whereDoesntHave('activeVisits');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
