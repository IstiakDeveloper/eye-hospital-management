<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'installment_amount',
        'due_date',
        'paid_amount',
        'status',
        'paid_date',
        'notes',
    ];

    protected $casts = [
        'installment_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::updating(function ($installment) {
            if ($installment->paid_amount >= $installment->installment_amount) {
                $installment->status = 'paid';
                if (!$installment->paid_date) {
                    $installment->paid_date = today();
                }
            } elseif ($installment->due_date < today() && $installment->status !== 'paid') {
                $installment->status = 'overdue';
            }
        });
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(PatientInvoice::class, 'invoice_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')
                    ->orWhere(function($q) {
                        $q->where('due_date', '<', today())
                          ->where('status', '!=', 'paid');
                    });
    }

    public function getBalanceAttribute()
    {
        return $this->installment_amount - $this->paid_amount;
    }
}
