<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationFundTransaction extends Model
{
    protected $fillable = [
        'transaction_no',
        'type',
        'amount',
        'description',
        'transaction_date',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date'
    ];

    // Relationships
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

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

    public function scopeToday($query)
    {
        return $query->whereDate('transaction_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year);
    }

    public function scopeThisYear($query)
    {
        return $query->whereYear('transaction_date', now()->year);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Accessors
    public function getFormattedAmountAttribute(): string
    {
        return number_format((float)$this->amount, 2);
    }

    public function getTypeNameAttribute(): string
    {
        return $this->type === 'fund_in' ? 'Fund In' : 'Fund Out';
    }

    // Statistics
    public static function getTodayFundIn(): float
    {
        return (float) self::fundIn()->today()->sum('amount');
    }

    public static function getTodayFundOut(): float
    {
        return (float) self::fundOut()->today()->sum('amount');
    }

    public static function getMonthlyFundIn(): float
    {
        return (float) self::fundIn()->thisMonth()->sum('amount');
    }

    public static function getMonthlyFundOut(): float
    {
        return (float) self::fundOut()->thisMonth()->sum('amount');
    }

    public static function getNetFundFlow(?string $startDate = null, ?string $endDate = null): float
    {
        $query = self::query();

        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        } else {
            $query->thisMonth();
        }

        $fundIn = (float) $query->clone()->fundIn()->sum('amount');
        $fundOut = (float) $query->clone()->fundOut()->sum('amount');

        return $fundIn - $fundOut;
    }

    public static function getFundFlowSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $query = self::query();

        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        } else {
            $query->thisMonth();
        }

        return [
            'fund_in' => (float) $query->clone()->fundIn()->sum('amount'),
            'fund_out' => (float) $query->clone()->fundOut()->sum('amount'),
            'net_flow' => self::getNetFundFlow($startDate, $endDate),
            'fund_in_count' => $query->clone()->fundIn()->count(),
            'fund_out_count' => $query->clone()->fundOut()->count(),
        ];
    }
}
