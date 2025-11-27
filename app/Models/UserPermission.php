<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPermission extends Model
{
    use HasFactory;

    protected $table = 'user_permission';

    protected $fillable = [
        'user_id',
        'permission_id',
        'granted',
    ];

    protected $casts = [
        'granted' => 'boolean',
    ];

    /**
     * Get the user that owns this permission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the permission associated with this user permission.
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }
}
