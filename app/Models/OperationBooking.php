<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationBooking extends Model
{
    protected $fillable = [
        'booking_no',
        'operation_id',
        'patient_id',
        'doctor_id',  // Added: Doctor assignment
        'operation_name',
        'operation_price',
        'base_amount',
        'discount_type',
        'discount_value',
        'discount_amount',
        'total_amount',
        'advance_payment',
        'due_amount',
        'payment_status',
        'scheduled_date',
        'scheduled_time',
        'status',
        'notes',
        'cancellation_reason',
        'booked_by',
        'performed_by',
        'completed_at',
        'cancelled_at',
        // Eye surgery specific fields
        'surgery_type',
        'eye_side',
        'lens_type',
        'power',
        'surgery_remarks'
    ];

    protected $casts = [
        'operation_price' => 'decimal:2',
        'base_amount' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'advance_payment' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'scheduled_date' => 'date',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime'
    ];

    // Relationships
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function bookedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OperationPayment::class);
    }

    // Scopes
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopePartialPaid($query)
    {
        return $query->where('payment_status', 'partial');
    }

    public function scopeFullyPaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_date', '>=', today())
            ->where('status', 'scheduled');
    }

    // Accessors
    public function getFormattedTotalAmountAttribute(): string
    {
        return number_format((float)$this->total_amount, 2);
    }

    public function getFormattedAdvancePaymentAttribute(): string
    {
        return number_format((float)$this->advance_payment, 2);
    }

    public function getFormattedDueAmountAttribute(): string
    {
        return number_format((float)$this->due_amount, 2);
    }

    // Static Methods
    public static function generateBookingNo(): string
    {
        $date = date('Ymd');
        $todayBookings = self::whereDate('created_at', today())->count();
        $nextNumber = $todayBookings + 1;

        return 'OB-' . $date . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->booking_no)) {
                $booking->booking_no = self::generateBookingNo();
            }

            // Calculate due amount
            if (!isset($booking->due_amount)) {
                $booking->due_amount = $booking->total_amount - $booking->advance_payment;
            }

            // Set payment status
            if (!isset($booking->payment_status)) {
                if ($booking->advance_payment == 0) {
                    $booking->payment_status = 'pending';
                } elseif ($booking->advance_payment >= $booking->total_amount) {
                    $booking->payment_status = 'paid';
                } else {
                    $booking->payment_status = 'partial';
                }
            }
        });
    }

    // Helper Methods
    public function addPayment(float $amount, string $paymentMethod, ?string $paymentReference = null, ?string $notes = null): OperationPayment
    {
        $payment = OperationPayment::create([
            'operation_booking_id' => $this->id,
            'patient_id' => $this->patient_id,
            'amount' => $amount,
            'payment_type' => $this->determinePaymentType($amount),
            'payment_method' => $paymentMethod,
            'payment_reference' => $paymentReference,
            'payment_date' => now()->toDateString(),
            'notes' => $notes,
            'received_by' => auth()->id()
        ]);

        // Update booking payment details
        $this->increment('advance_payment', $amount);
        $this->decrement('due_amount', $amount);

        if ($this->due_amount <= 0) {
            $this->payment_status = 'paid';
        } elseif ($this->advance_payment > 0) {
            $this->payment_status = 'partial';
        }

        $this->save();

        // Add to Operation Account
        OperationAccount::addIncome(
            amount: $amount,
            category: 'Operation Payment',
            description: "Payment for {$this->operation_name} - Booking: {$this->booking_no}",
            referenceType: 'OperationPayment',
            referenceId: $payment->id,
            date: now()->toDateString()
        );

        return $payment;
    }

    private function determinePaymentType(float $amount): string
    {
        $remainingAmount = $this->total_amount - $this->advance_payment;

        if ($this->advance_payment == 0 && $amount < $this->total_amount) {
            return 'advance';
        } elseif ($amount >= $remainingAmount) {
            return 'full';
        } else {
            return 'partial';
        }
    }

    public function confirmBooking(): void
    {
        $this->update([
            'status' => 'confirmed'
        ]);
    }

    public function markAsCompleted(?int $performedBy = null): void
    {
        $this->update([
            'status' => 'completed',
            'performed_by' => $performedBy ?? auth()->id(),
            'completed_at' => now()
        ]);
    }

    public function cancel(string $reason): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancellation_reason' => $reason,
            'cancelled_at' => now()
        ]);

        // Refund if any payment made - Add to both accounts
        if ($this->advance_payment > 0) {
            // Refund from Operation Account
            OperationAccount::addExpense(
                amount: (float)$this->advance_payment,
                category: 'Operation Refund',
                description: "Refund for cancelled operation - {$this->operation_name} - Booking: {$this->booking_no}",
                date: now()->toDateString()
            );

            // Refund from Hospital Account
            \App\Models\HospitalAccount::addExpense(
                amount: (float)$this->advance_payment,
                category: 'Operation Refund',
                description: "Refund for cancelled operation - {$this->operation_name} - Booking: {$this->booking_no}",
                date: now()->toDateString()
            );
        }
    }

    // Keep old method for backward compatibility
    public function markAsCancelled(string $reason): void
    {
        $this->cancel($reason);
    }

    public function reschedule(string $newDate, ?string $newTime = null): void
    {
        $this->update([
            'scheduled_date' => $newDate,
            'scheduled_time' => $newTime,
            'status' => 'rescheduled'
        ]);
    }
}
