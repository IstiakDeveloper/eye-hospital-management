<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'patient_id',
        'prescription_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'payment_method',
        'sale_date',
        'subtotal',
        'discount',
        'tax',
        'total_amount',
        'paid_amount',
        'total_profit',
        'payment_status',
        'sold_by',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'total_profit' => 'decimal:2',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function soldBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sold_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MedicineSaleItem::class);
    }

    public function getDueAmountAttribute()
    {
        return $this->total_amount - $this->paid_amount;
    }

    public function scopeOfStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('sale_date', [$startDate, $endDate]);
    }

    public function updateTotals()
    {
        $this->subtotal = $this->items()->sum('total_price');
        $this->total_profit = $this->items()->sum('profit');
        $this->total_amount = $this->subtotal - $this->discount + $this->tax;
        $this->save();
    }
}

