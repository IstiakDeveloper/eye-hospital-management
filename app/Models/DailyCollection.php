<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_date',
        'opening_balance',
        'total_income',
        'total_expense',
        'closing_balance',
        'payment_method_breakdown',
        'notes',
        'created_by',
        'is_finalized',
        'finalized_at',
    ];

    protected $casts = [
        'collection_date' => 'date',
        'opening_balance' => 'decimal:2',
        'total_income' => 'decimal:2',
        'total_expense' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'payment_method_breakdown' => 'array',
        'is_finalized' => 'boolean',
        'finalized_at' => 'datetime',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeToday($query)
    {
        return $query->where('collection_date', today());
    }

    public function scopeFinalized($query)
    {
        return $query->where('is_finalized', true);
    }

    public function getNetProfitAttribute()
    {
        return $this->total_income - $this->total_expense;
    }
}
