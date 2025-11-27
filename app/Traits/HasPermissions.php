<?php

namespace App\Traits;

use App\Models\Permission;

trait HasPermissions
{
    /**
     * Check if the entity has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        // If this is a User, check both direct and role permissions
        if (method_exists($this, 'permissions')) {
            // Check direct user permission (override)
            $userPermission = $this->permissions()
                ->where('name', $permission)
                ->first();

            if ($userPermission) {
                return $userPermission->pivot->granted;
            }
        }

        // Check role permission (for both User and Role models)
        if ($this instanceof \App\Models\User && $this->role) {
            return $this->role->hasPermission($permission);
        }

        if ($this instanceof \App\Models\Role) {
            return $this->permissions()->where('name', $permission)->exists();
        }

        return false;
    }

    /**
     * Check if has any of the given permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if has all of the given permissions
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Give permission to this entity
     */
    public function givePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        if ($this instanceof \App\Models\User) {
            $this->permissions()->syncWithoutDetaching([
                $permission->id => ['granted' => true]
            ]);
        } elseif ($this instanceof \App\Models\Role) {
            $this->permissions()->syncWithoutDetaching([$permission->id]);
        }
    }

    /**
     * Revoke permission from this entity
     */
    public function revokePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        if ($this instanceof \App\Models\User) {
            $this->permissions()->syncWithoutDetaching([
                $permission->id => ['granted' => false]
            ]);
        } elseif ($this instanceof \App\Models\Role) {
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * Sync permissions (replace all permissions with new ones)
     */
    public function syncPermissions(array $permissions): void
    {
        $permissionIds = Permission::whereIn('name', $permissions)->pluck('id');

        if ($this instanceof \App\Models\User) {
            $syncData = [];
            foreach ($permissionIds as $permissionId) {
                $syncData[$permissionId] = ['granted' => true];
            }
            $this->permissions()->sync($syncData);
        } elseif ($this instanceof \App\Models\Role) {
            $this->permissions()->sync($permissionIds);
        }
    }

    /**
     * Get all permission names
     */
    public function getPermissionNames(): array
    {
        if ($this instanceof \App\Models\User) {
            // Get role permissions
            $rolePermissions = $this->role ? $this->role->permissions->pluck('name')->toArray() : [];

            // Get direct user permissions
            $userPermissions = $this->permissions()
                ->wherePivot('granted', true)
                ->pluck('name')
                ->toArray();

            // Get revoked permissions
            $revokedPermissions = $this->permissions()
                ->wherePivot('granted', false)
                ->pluck('name')
                ->toArray();

            // Merge and remove revoked ones
            $allPermissions = array_unique(array_merge($rolePermissions, $userPermissions));
            return array_values(array_diff($allPermissions, $revokedPermissions));
        }

        if ($this instanceof \App\Models\Role) {
            return $this->permissions->pluck('name')->toArray();
        }

        return [];
    }
}
