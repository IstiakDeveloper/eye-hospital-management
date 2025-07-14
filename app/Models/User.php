<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'is_active',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }


    /**
     * Get the role that the user belongs to.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the doctor profile associated with the user.
     */
    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    /**
     * Get the patients registered by this user.
     */
    public function registeredPatients(): HasMany
    {
        return $this->hasMany(Patient::class, 'registered_by');
    }

    /**
     * Get the vision tests performed by this user.
     */
    public function visionTests(): HasMany
    {
        return $this->hasMany(VisionTest::class, 'performed_by');
    }

    /**
     * Get the appointments created by this user.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'created_by');
    }

    /**
     * Get the prescriptions created by this user.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'created_by');
    }

    /**
     * Check if the user is a doctor.
     *
     * @return bool
     */
    public function isDoctor(): bool
    {
        return $this->role->name === 'Doctor';
    }

    /**
     * Check if the user is a receptionist.
     *
     * @return bool
     */
    public function isReceptionist(): bool
    {
        return $this->role->name === 'Receptionist';
    }

    /**
     * Check if the user is a super admin.
     *
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->role->name === 'Super Admin';
    }

    public function createdTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'created_by');
    }

    public function receivedPayments(): HasMany
    {
        return $this->hasMany(PatientPayment::class, 'received_by');
    }

    public function createdInvoices(): HasMany
    {
        return $this->hasMany(PatientInvoice::class, 'created_by');
    }

    public function createdExpenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'created_by');
    }

    public function approvedExpenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'approved_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
