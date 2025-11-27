<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpticsSalePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'optics_sale_id',
        'amount',
        'payment_method',
        'transaction_id',
        'notes',
        'received_by'
    ];

    public function opticsSale()
    {
        return $this->belongsTo(OpticsSale::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
