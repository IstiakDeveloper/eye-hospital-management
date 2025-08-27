<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalFundTransaction extends Model
{
    protected $fillable = [
        'voucher_no',
        'type',
        'amount',
        'purpose',
        'description',
        'date',
        'added_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    // Relationships
    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    // Scopes
    public function scopeFundIn($query)
    {
        return $query->where('type', 'fund_in');
    }

    public function scopeFundOut($query)
    {
        return $query->where('type', 'fund_out');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('date', now()->month)
                    ->whereYear('date', now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('date', now()->year);
    }
}
