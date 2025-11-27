<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdvanceHouseRentDeduction extends Model
{
    protected $fillable = [
        'advance_house_rent_id',
        'month',
        'year',
        'amount',
        'notes',
        'deduction_date',
        'deduction_number',
        'deducted_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'deduction_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($deduction) {
            if (!$deduction->deduction_number) {
                $yearMonth = $deduction->year . str_pad($deduction->month, 2, '0', STR_PAD_LEFT);
                $count = self::where('year', $deduction->year)
                    ->where('month', $deduction->month)
                    ->count();
                $deduction->deduction_number = 'RENT-' . $yearMonth . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }
        });
    }

    // Relationships
    public function advanceHouseRent(): BelongsTo
    {
        return $this->belongsTo(AdvanceHouseRent::class);
    }

    public function deductedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deducted_by');
    }

    // Accessor for month name
    public function getMonthNameAttribute(): string
    {
        $months = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        return $months[$this->month] ?? '';
    }
}
