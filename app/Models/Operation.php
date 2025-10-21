<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operation extends Model
{
    protected $fillable = [
        'operation_code',
        'name',
        'type',
        'price',
        'description',
        'status',
        'created_by'
    ];

    protected $casts = [
        'price' => 'decimal:2'
    ];

    // Relationships
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(OperationBooking::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Accessors
    public function getFormattedPriceAttribute(): string
    {
        return number_format((float)$this->price, 2);
    }

    // Static Methods
    public static function generateOperationCode(): string
    {
        $lastOperation = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastOperation ? ((int) substr($lastOperation->operation_code, 3)) + 1 : 1;

        return 'OP-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    // Boot method for auto-generating operation code
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($operation) {
            if (empty($operation->operation_code)) {
                $operation->operation_code = self::generateOperationCode();
            }
        });
    }

    // Statistics
    public function getTotalBookingsAttribute(): int
    {
        return $this->bookings()->count();
    }

    public function getCompletedBookingsAttribute(): int
    {
        return $this->bookings()->where('status', 'completed')->count();
    }

    public function getTotalRevenueAttribute(): float
    {
        return $this->bookings()
            ->where('status', 'completed')
            ->sum('total_amount');
    }
}
