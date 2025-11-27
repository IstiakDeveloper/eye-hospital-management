<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    /**
     * Get the permissions assigned directly to this user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permission')
            ->withPivot('granted')
            ->withTimestamps();
    }

    /**
     * Alias for permissions() - for backward compatibility
     */
    public function userPermissions(): BelongsToMany
    {
        return $this->permissions();
    }

    /**
     * Check if user has a specific permission.
     * Checks both role permissions and direct user permissions.
     */
    public function hasPermission(string $permission): bool
    {
        // Check direct user permission (override)
        $userPermission = $this->permissions()
            ->where('name', $permission)
            ->first();

        if ($userPermission) {
            return $userPermission->pivot->granted;
        }

        // Check role permission
        return $this->role && $this->role->hasPermission($permission);
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Grant a permission directly to this user.
     */
    public function givePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        $this->permissions()->syncWithoutDetaching([
            $permission->id => ['granted' => true]
        ]);
    }

    /**
     * Revoke a permission directly from this user.
     */
    public function revokePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        $this->permissions()->syncWithoutDetaching([
            $permission->id => ['granted' => false]
        ]);
    }

    /**
     * Get all permissions for the user (role + user-specific).
     */
    public function getAllPermissions(): array
    {
        // Check for wildcard permission
        $wildcardPerm = $this->permissions()
            ->where('name', '*')
            ->wherePivot('granted', true)
            ->first();

        if ($wildcardPerm) {
            return ['*'];
        }

        // Get role permissions
        $rolePermissions = [];
        if ($this->role) {
            $rolePermissions = $this->role->permissions()
                ->pluck('name')
                ->toArray();
        }

        // Get user-specific granted permissions
        $userPermissions = $this->permissions()
            ->wherePivot('granted', true)
            ->pluck('name')
            ->toArray();

        // Merge and deduplicate
        return array_values(array_unique(array_merge($rolePermissions, $userPermissions)));
    }
}
