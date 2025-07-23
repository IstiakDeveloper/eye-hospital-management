<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicineStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'medicine_id',
        'batch_number',
        'expiry_date',
        'quantity',
        'available_quantity',
        'buy_price',
        'sale_price',
        'purchase_date',
        'notes',
        'is_active',
        'added_by',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'purchase_date' => 'date',
        'quantity' => 'integer',
        'available_quantity' => 'integer',
        'buy_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(MedicineSaleItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('available_quantity', '>', 0);
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<=', now());
    }

    public function scopeExpiring($query, $days = 30)
    {
        return $query->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays($days));
    }

    // Helper methods
    public function getProfitPerUnitAttribute()
    {
        return $this->sale_price - $this->buy_price;
    }

    public function getTotalValueAttribute()
    {
        return $this->available_quantity * $this->buy_price;
    }

    public function isExpired(): bool
    {
        return $this->expiry_date <= now();
    }

    public function isExpiring($days = 30): bool
    {
        return $this->expiry_date > now() && $this->expiry_date <= now()->addDays($days);
    }

    public function reduceStock(int $quantity): bool
    {
        if ($this->available_quantity >= $quantity) {
            $this->available_quantity -= $quantity;
            $this->save();
            return true;
        }
        return false;
    }

    public function addStock(int $quantity, string $reason = 'Stock adjustment'): void
    {
        $this->available_quantity += $quantity;
        $this->save();

        // Record transaction
        $this->transactions()->create([
            'type' => 'adjustment',
            'quantity' => $quantity,
            'unit_price' => $this->buy_price,
            'total_amount' => $quantity * $this->buy_price,
            'reason' => $reason,
            'created_by' => auth()->id(),
        ]);
    }
}
