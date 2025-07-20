<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionGlasses extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'glasses_id',
        'lens_type_id',
        'right_eye_sphere',
        'right_eye_cylinder',
        'right_eye_axis',
        'right_eye_add',
        'left_eye_sphere',
        'left_eye_cylinder',
        'left_eye_axis',
        'left_eye_add',
        'pupillary_distance',
        'segment_height',
        'optical_center_height',
        'prescription_type',
        'special_instructions',
        'total_price',
        'status',
        'expected_delivery',
    ];

    protected $casts = [
        'right_eye_sphere' => 'decimal:2',
        'right_eye_cylinder' => 'decimal:2',
        'right_eye_axis' => 'integer',
        'right_eye_add' => 'decimal:2',
        'left_eye_sphere' => 'decimal:2',
        'left_eye_cylinder' => 'decimal:2',
        'left_eye_axis' => 'integer',
        'left_eye_add' => 'decimal:2',
        'pupillary_distance' => 'decimal:1',
        'segment_height' => 'decimal:1',
        'optical_center_height' => 'decimal:1',
        'total_price' => 'decimal:2',
        'expected_delivery' => 'date',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function glasses(): BelongsTo
    {
        return $this->belongsTo(Glasses::class);
    }

    public function lensType(): BelongsTo
    {
        return $this->belongsTo(LensType::class);
    }

    public function getRightEyePrescriptionAttribute(): string
    {
        $parts = [];
        if ($this->right_eye_sphere) {
            $parts[] = "SPH: " . ($this->right_eye_sphere > 0 ? '+' : '') . $this->right_eye_sphere;
        }
        if ($this->right_eye_cylinder) {
            $parts[] = "CYL: " . ($this->right_eye_cylinder > 0 ? '+' : '') . $this->right_eye_cylinder;
        }
        if ($this->right_eye_axis) {
            $parts[] = "AXIS: " . $this->right_eye_axis . "°";
        }
        if ($this->right_eye_add) {
            $parts[] = "ADD: +" . $this->right_eye_add;
        }
        return implode(' / ', $parts) ?: 'N/A';
    }

    public function getLeftEyePrescriptionAttribute(): string
    {
        $parts = [];
        if ($this->left_eye_sphere) {
            $parts[] = "SPH: " . ($this->left_eye_sphere > 0 ? '+' : '') . $this->left_eye_sphere;
        }
        if ($this->left_eye_cylinder) {
            $parts[] = "CYL: " . ($this->left_eye_cylinder > 0 ? '+' : '') . $this->left_eye_cylinder;
        }
        if ($this->left_eye_axis) {
            $parts[] = "AXIS: " . $this->left_eye_axis . "°";
        }
        if ($this->left_eye_add) {
            $parts[] = "ADD: +" . $this->left_eye_add;
        }
        return implode(' / ', $parts) ?: 'N/A';
    }

    public function getStatusBadgeColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'ordered' => 'blue',
            'ready' => 'green',
            'delivered' => 'gray',
            default => 'gray',
        };
    }
}
