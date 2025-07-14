<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_number',
        'patient_id',
        'invoice_id',
        'visit_id',
        'amount',
        'payment_method_id',
        'payment_date',
        'notes',
        'receipt_number',
        'received_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (!$payment->payment_number) {
                $date = now()->format('Ymd');
                $count = self::whereDate('created_at', now())->count();
                $payment->payment_number = 'PAY-' . $date . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            }

            if (!$payment->payment_date) {
                $payment->payment_date = today();
            }
        });

        // Update invoice paid amount when payment is created
        static::created(function ($payment) {
            if ($payment->invoice_id) {
                $invoice = $payment->invoice;
                $invoice->paid_amount += $payment->amount;
                $invoice->save();
            }

            // Update patient totals
            $patient = $payment->patient;
            $patient->total_paid += $payment->amount;
            $patient->total_due -= $payment->amount;
            $patient->save();
        });
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PatientInvoice::class, 'invoice_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function doctorCommissions(): HasMany
    {
        return $this->hasMany(DoctorCommission::class);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('payment_date', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year);
    }

    public function visit()
    {
        return $this->belongsTo(PatientVisit::class, 'visit_id');
    }
}
