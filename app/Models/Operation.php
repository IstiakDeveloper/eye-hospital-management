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

    /**
     * Get Income Report for operations in a specific date range
     */
    public static function getIncomeReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()->where('status', 'active');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('operation_code', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $operations = $query->get();
        $reportData = [];

        foreach ($operations as $operation) {
            // Get all bookings in the date range
            $bookings = \DB::table('operation_bookings')
                ->where('operation_id', $operation->id)
                ->whereBetween('scheduled_date', [$fromDate, $toDate])
                ->whereIn('status', ['scheduled', 'confirmed', 'completed', 'rescheduled'])
                ->select(
                    'id',
                    'operation_price',
                    'base_amount',
                    'discount_amount',
                    'total_amount',
                    'advance_payment',
                    'due_amount',
                    'status'
                )
                ->get();

            if ($bookings->isEmpty()) {
                continue; // Skip operations with no bookings
            }

            $totalBookings = $bookings->count();
            $totalOriginalPrice = $bookings->sum('base_amount');
            $totalDiscount = $bookings->sum('discount_amount');
            $totalIncome = $bookings->sum('total_amount');
            $totalPaid = $bookings->sum('advance_payment');
            $totalDue = $bookings->sum('due_amount');

            // Calculate averages
            $avgOriginalPrice = $totalBookings > 0 ? $totalOriginalPrice / $totalBookings : 0;
            $avgDiscount = $totalBookings > 0 ? $totalDiscount / $totalBookings : 0;
            $avgIncome = $totalBookings > 0 ? $totalIncome / $totalBookings : 0;

            // Count by status
            $scheduled = $bookings->where('status', 'scheduled')->count();
            $confirmed = $bookings->where('status', 'confirmed')->count();
            $completed = $bookings->where('status', 'completed')->count();

            $reportData[] = [
                'id' => $operation->id,
                'sl' => null,
                'name' => $operation->name,
                'operation_code' => $operation->operation_code,
                'type' => $operation->type ?? 'General',
                'standard_price' => $operation->price,

                // Booking Information
                'total_bookings' => $totalBookings,
                'scheduled' => $scheduled,
                'confirmed' => $confirmed,
                'completed' => $completed,
                'avg_original_price' => round($avgOriginalPrice, 2),
                'total_original_price' => round($totalOriginalPrice, 2),

                // Discount Information
                'avg_discount' => round($avgDiscount, 2),
                'total_discount' => round($totalDiscount, 2),

                // Income Information
                'avg_income' => round($avgIncome, 2),
                'total_income' => round($totalIncome, 2),
                'total_paid' => round($totalPaid, 2),
                'total_due' => round($totalDue, 2),
            ];
        }

        return $reportData;
    }
}
