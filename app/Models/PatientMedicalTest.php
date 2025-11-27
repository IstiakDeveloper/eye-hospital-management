<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatientMedicalTest extends Model
{
    protected $fillable = [
        'test_number',
        'patient_id',
        'visit_id',
        'test_group_id', // ✅ Added
        'medical_test_id',
        'original_price',
        'discount_amount',
        'final_price',
        'paid_amount',
        'due_amount',
        'payment_status',
        'test_status',
        'test_date',
        'completed_at',
        'result',
        'notes',
        'report_file',
        'ordered_by',
        'performed_by',
        'created_by',
        'hospital_transaction_id'
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_price' => 'decimal:2',
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

    public function testGroup(): BelongsTo // ✅ Added
    {
        return $this->belongsTo(PatientTestGroup::class, 'test_group_id');
    }

    public function medicalTest(): BelongsTo
    {
        return $this->belongsTo(MedicalTest::class);
    }

    public function orderedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ordered_by');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function hospitalTransaction(): BelongsTo
    {
        return $this->belongsTo(HospitalTransaction::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PatientMedicalTestPayment::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('test_status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('test_status', 'completed');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('test_date', today());
    }

    // Helper Methods
    public static function generateTestNumber(): string
    {
        return 'MT-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    public function updatePaymentStatus(): void
    {
        if ($this->paid_amount >= $this->final_price) {
            $this->payment_status = 'paid';
            $this->due_amount = 0;
        } elseif ($this->paid_amount > 0) {
            $this->payment_status = 'partial';
            $this->due_amount = $this->final_price - $this->paid_amount;
        } else {
            $this->payment_status = 'pending';
            $this->due_amount = $this->final_price;
        }
        $this->save();
    }
}
