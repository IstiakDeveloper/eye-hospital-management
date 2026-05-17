<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = [
        'observed_on',
        'name',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'observed_on' => 'date',
        ];
    }
}
