<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicineSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_sale_id',
        'medicine_stock_id',
        'quantity',
        'unit_price',
        'buy_price',
    ];

    // Exclude computed columns from mass assignment
    protected $guarded = ['total_price', 'profit'];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'buy_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    public function medicineSale(): BelongsTo
    {
        return $this->belongsTo(MedicineSale::class);
    }

    public function medicineStock(): BelongsTo
    {
        return $this->belongsTo(MedicineStock::class);
    }

    public function getTotalPriceAttribute()
    {
        return $this->quantity * $this->unit_price;
    }

    public function getProfitAttribute()
    {
        return ($this->unit_price - $this->buy_price) * $this->quantity;
    }
}
