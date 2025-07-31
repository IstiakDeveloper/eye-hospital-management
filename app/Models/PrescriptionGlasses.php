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
        'frame_price',
        'lens_price',
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
        'frame_price' => 'decimal:2',
        'lens_price' => 'decimal:2',
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
        $sph = $this->right_eye_sphere ? sprintf('%+.2f', $this->right_eye_sphere) : '0.00';
        $cyl = $this->right_eye_cylinder ? sprintf('%+.2f', $this->right_eye_cylinder) : '';
        $axis = $this->right_eye_axis ? "x{$this->right_eye_axis}" : '';
        $add = $this->right_eye_add ? sprintf(' Add %+.2f', $this->right_eye_add) : '';

        return trim("SPH {$sph} {$cyl} {$axis}{$add}");
    }

    public function getLeftEyePrescriptionAttribute(): string
    {
        $sph = $this->left_eye_sphere ? sprintf('%+.2f', $this->left_eye_sphere) : '0.00';
        $cyl = $this->left_eye_cylinder ? sprintf('%+.2f', $this->left_eye_cylinder) : '';
        $axis = $this->left_eye_axis ? "x{$this->left_eye_axis}" : '';
        $add = $this->left_eye_add ? sprintf(' Add %+.2f', $this->left_eye_add) : '';

        return trim("SPH {$sph} {$cyl} {$axis}{$add}");
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }
}
