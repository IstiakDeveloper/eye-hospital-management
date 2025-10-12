<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatientTestGroup extends Model
{
    protected $fillable = [
        'group_number',
        'patient_id',
        'visit_id',
        'total_original_price',
        'total_discount',
        'final_amount',
        'paid_amount',
        'due_amount',
        'payment_status',
        'test_date',
        'completed_at',
        'created_by',
        'hospital_transaction_id'
    ];

    protected $casts = [
        'total_original_price' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'test_date' => 'date',
        'completed_at' => 'datetime'
    ];

    // Relationships
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class);
    }

    public function tests(): HasMany
    {
        return $this->hasMany(PatientMedicalTest::class, 'test_group_id');
    }
    public function payments(): HasMany
    {
        return $this->hasMany(PatientMedicalTestPayment::class, 'test_group_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function hospitalTransaction(): BelongsTo
    {
        return $this->belongsTo(HospitalTransaction::class);
    }

    // Helper Methods
    public static function generateGroupNumber(): string
    {
        return 'MTG-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    public function updatePaymentStatus(): void
    {
        if ($this->paid_amount >= $this->final_amount) {
            $this->payment_status = 'paid';
            $this->due_amount = 0;
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
            $this->due_amount = $this->final_amount - $this->paid_amount;
        } else {
            $this->payment_status = 'pending';
            $this->due_amount = $this->final_amount;
        }
        $this->save();
    }

    public function calculateTotals(): void
    {
        $this->total_original_price = $this->tests->sum('original_price');
        $this->total_discount = $this->tests->sum('discount_amount');
        $this->final_amount = $this->tests->sum('final_price');
        $this->save();
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('test_date', today());
    }
}
