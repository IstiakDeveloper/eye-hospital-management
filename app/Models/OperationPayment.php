<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationPayment extends Model
{
    protected $fillable = [
        'payment_no',
        'operation_booking_id',
        'patient_id',
        'amount',
        'payment_type',
        'payment_method',
        'payment_reference',
        'payment_date',
        'notes',
        'received_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date'
    ];

    // Relationships
    public function operationBooking(): BelongsTo
    {
        return $this->belongsTo(OperationBooking::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Scopes
    public function scopeToday($query)
    {
        return $query->whereDate('payment_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year);
    }

    public function scopeByPaymentMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeByPaymentType($query, string $type)
    {
        return $query->where('payment_type', $type);
    }

    // Accessors
    public function getFormattedAmountAttribute(): string
    {
        return number_format((float)$this->amount, 2);
    }

    public function getPaymentMethodNameAttribute(): string
    {
        return match ($this->payment_method) {
            'cash' => 'Cash',
            'card' => 'Card',
            'mobile_banking' => 'Mobile Banking',
            'bank_transfer' => 'Bank Transfer',
            default => ucfirst($this->payment_method)
        };
    }

    public function getPaymentTypeNameAttribute(): string
    {
        return match ($this->payment_type) {
            'advance' => 'Advance Payment',
            'partial' => 'Partial Payment',
            'full' => 'Full Payment',
            'refund' => 'Refund',
            default => ucfirst($this->payment_type)
        };
    }

    // Static Methods
    public static function generatePaymentNo(): string
    {
        $date = date('Ymd');
        $todayPayments = self::whereDate('created_at', today())->count();
        $nextNumber = $todayPayments + 1;

        return 'OPY-' . $date . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->payment_no)) {
                $payment->payment_no = self::generatePaymentNo();
            }
        });
    }

    // Statistics
    public static function getTodayTotal(): float
    {
        return (float) self::whereDate('payment_date', today())->sum('amount');
    }

    public static function getMonthlyTotal(): float
    {
        return (float) self::thisMonth()->sum('amount');
    }

    public static function getPaymentMethodBreakdown(?string $date = null)
    {
        $query = self::query();

        if ($date) {
            $query->whereDate('payment_date', $date);
        } else {
            $query->thisMonth();
        }

        return $query->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();
    }
}
