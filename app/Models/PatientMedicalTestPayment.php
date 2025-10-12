<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMedicalTestPayment extends Model
{
    protected $fillable = [
        'payment_number',
        'patient_medical_test_id',
        'test_group_id', // ✅ Added
        'patient_id',
        'amount',
        'payment_method_id',
        'payment_date',
        'notes',
        'received_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date'
    ];

    // Relationships
    public function patientMedicalTest(): BelongsTo
    {
        return $this->belongsTo(PatientMedicalTest::class);
    }

    public function testGroup(): BelongsTo // ✅ Added
    {
        return $this->belongsTo(PatientTestGroup::class, 'test_group_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Helper Methods
    public static function generatePaymentNumber(): string
    {
        return 'MTP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
}
