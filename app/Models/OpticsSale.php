<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OpticsSale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'patient_id',
        'seller_id',
        'glass_fitting_price',
        'total_amount',
        'advance_payment',
        'due_amount',
        'status',
        'notes'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            $sale->invoice_number = 'OPT-' . date('Ymd') . '-' . str_pad(static::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);
        });
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function payments()
    {
        return $this->hasMany(OpticsSalePayment::class);
    }

    public function items()
    {
        return $this->hasMany(OpticsSaleItem::class);
    }

    public function getTotalPaidAttribute()
    {
        return $this->payments->sum('amount') + $this->advance_payment;
    }

    public function getRemainingDueAttribute()
    {
        return $this->total_amount - $this->total_paid;
    }

    public function getItemsTotalAttribute()
    {
        return $this->items->sum('total_price');
    }
}
