<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany};
use Illuminate\Database\Eloquent\SoftDeletes;

class AdvanceHouseRent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'advance_amount',
        'used_amount',
        'remaining_amount',
        'status',
        'description',
        'payment_date',
        'payment_number',
        'created_by',
    ];

    protected $casts = [
        'advance_amount' => 'decimal:2',
        'used_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($advanceRent) {
            if (!$advanceRent->payment_number) {
                $date = now()->format('Ymd');
                $count = self::whereDate('created_at', now())->count();
                $advanceRent->payment_number = 'ADV-RENT-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }

            // Set remaining amount same as advance amount initially
            if (!$advanceRent->remaining_amount) {
                $advanceRent->remaining_amount = $advanceRent->advance_amount;
            }
        });
    }

    // Relationships
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(AdvanceHouseRentDeduction::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('remaining_amount', '>', 0);
    }

    // Methods
    public function deduct(float $amount, int $month, int $year, ?string $notes = null): AdvanceHouseRentDeduction
    {
        if ($amount > $this->remaining_amount) {
            throw new \Exception('Deduction amount exceeds remaining advance balance');
        }

        $deduction = $this->deductions()->create([
            'month' => $month,
            'year' => $year,
            'amount' => $amount,
            'notes' => $notes,
            'deduction_date' => now(),
            'deducted_by' => auth()->id() ?? 1,
        ]);

        $this->update([
            'used_amount' => bcadd((string)$this->used_amount, (string)$amount, 2),
            'remaining_amount' => bcsub((string)$this->remaining_amount, (string)$amount, 2),
        ]);

        if ($this->remaining_amount <= 0) {
            $this->update(['status' => 'exhausted']);
        }

        return $deduction;
    }

    public static function getActiveBalance(): float
    {
        return self::active()->sum('remaining_amount');
    }
}
