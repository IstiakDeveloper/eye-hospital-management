<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineVendorTransaction extends Model
{
    protected $fillable = [
        'transaction_no',
        'vendor_id',
        'type',
        'amount',
        'due_amount',
        'paid_amount',
        'payment_status',
        'reference_type',
        'reference_id',
        'payment_method',
        'cheque_no',
        'cheque_date',
        'description',
        'transaction_date',
        'due_date',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'due_date' => 'date',
        'cheque_date' => 'date',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(MedicineVendor::class, 'vendor_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class, 'vendor_transaction_id');
    }

    // Generate unique transaction number
    public static function generateTransactionNo()
    {
        $prefix = 'VT-';
        $date = now()->format('ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return $prefix . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    // Check if overdue
    public function getIsOverdueAttribute()
    {
        return $this->due_date && $this->due_date < now() && $this->payment_status !== 'paid';
    }
}
