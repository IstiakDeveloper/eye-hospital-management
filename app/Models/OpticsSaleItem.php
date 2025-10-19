<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpticsSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'optics_sale_id',
        'item_type',
        'item_id',
        'item_name',
        'quantity',
        'unit_price',
        'total_price'
    ];

    public function opticsSale()
    {
        return $this->belongsTo(OpticsSale::class);
    }

    // Get the related item (polymorphic-like)
    public function getItemAttribute()
    {
        switch ($this->item_type) {
            case 'frame':
            case 'glasses':
                return Glasses::find($this->item_id);
            case 'lens':
            case 'lens_types':
                return LensType::find($this->item_id);
            case 'complete_glasses':
                return CompleteGlasses::find($this->item_id);
            default:
                return null;
        }
    }
}
