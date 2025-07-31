<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_type',
        'item_id',
        'movement_type',
        'quantity',
        'previous_stock',
        'new_stock',
        'unit_price',
        'total_amount',
        'reference_type',
        'reference_id',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'previous_stock' => 'integer',
        'new_stock' => 'integer',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function item()
    {
        return match($this->item_type) {
            'glasses' => $this->belongsTo(Glasses::class, 'item_id'),
            'lens_types' => $this->belongsTo(LensType::class, 'item_id'),
            'complete_glasses' => $this->belongsTo(CompleteGlasses::class, 'item_id'),
            default => null,
        };
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function getItemNameAttribute(): string
    {
        $item = $this->item();
        if (!$item) return 'Unknown Item';

        return match($this->item_type) {
            'glasses' => $item->full_name ?? 'Unknown Frame',
            'lens_types' => $item->name ?? 'Unknown Lens',
            'complete_glasses' => $item->full_name ?? 'Unknown Complete Glasses',
            default => 'Unknown Item',
        };
    }

    public function scopeByType($query, $type)
    {
        return $query->where('movement_type', $type);
    }

    public function scopeByItemType($query, $itemType)
    {
        return $query->where('item_type', $itemType);
    }

    public function scopeInward($query)
    {
        return $query->whereIn('movement_type', ['purchase', 'return', 'adjustment'])
                    ->where('quantity', '>', 0);
    }

    public function scopeOutward($query)
    {
        return $query->whereIn('movement_type', ['sale', 'damage', 'adjustment'])
                    ->where('quantity', '<', 0);
    }
}
