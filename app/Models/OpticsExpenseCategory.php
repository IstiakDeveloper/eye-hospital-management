<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpticsExpenseCategory extends Model
{
    protected $fillable = ['name', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function transactions(): HasMany
    {
        return $this->hasMany(OpticsTransaction::class, 'expense_category_id');
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->transactions()->sum('amount');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
