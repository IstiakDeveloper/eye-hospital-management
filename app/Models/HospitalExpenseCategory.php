<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class HospitalExpenseCategory extends Model
{
    /**
     * Posted by purchase, payment, or refund screens. Manual Add Expense cannot use these names.
     *
     * @var list<string>
     */
    public const SYSTEM_CATEGORY_NAMES = [
        'Medicine Purchase',
        'Medicine Vendor Payment',
        'Medicine Purchase Refund',
        'Optics Purchase',
        'Optics Vendor Payment',
        'Fixed Asset Purchase',
        'Fixed Asset Vendor Payment',
    ];

    protected $fillable = ['name', 'is_active', 'allows_manual_entry'];

    protected $casts = [
        'is_active' => 'boolean',
        'allows_manual_entry' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (HospitalExpenseCategory $category): void {
            if (self::isSystemName($category->name)) {
                $category->allows_manual_entry = false;
            }
        });
    }

    public static function isSystemName(?string $name): bool
    {
        return in_array($name, self::SYSTEM_CATEGORY_NAMES, true);
    }

    public function isSystem(): bool
    {
        return self::isSystemName($this->name);
    }

    public function blocksManualEntry(): bool
    {
        return $this->isSystem() || ! $this->allows_manual_entry;
    }

    /**
     * @param  Builder<HospitalExpenseCategory>  $query
     * @return Builder<HospitalExpenseCategory>
     */
    public function scopeForManualEntry(Builder $query): Builder
    {
        return $query->where('allows_manual_entry', true)
            ->whereNotIn('name', self::SYSTEM_CATEGORY_NAMES);
    }

    public static function ensureManualEntry(?int $categoryId, ?string $categoryName): void
    {
        $category = null;
        $name = $categoryName;

        if ($categoryId) {
            $category = static::query()->find($categoryId);
            $name = $category?->name ?? $categoryName;
        } elseif ($categoryName) {
            $category = static::query()->where('name', $categoryName)->first();
        }

        $blocked = self::isSystemName($name) || ($category !== null && ! $category->allows_manual_entry);

        if (! $blocked) {
            return;
        }

        $message = self::isSystemName($name)
            ? 'This category is posted automatically. Enter it from the purchase or payment screen.'
            : 'Manual entry is turned off for this category.';

        throw ValidationException::withMessages([
            'category' => $message,
            'expense_category_id' => $message,
        ]);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(HospitalTransaction::class, 'expense_category_id');
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
