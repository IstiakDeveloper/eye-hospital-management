<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RolePermissionController extends Controller
{
    /**
     * Display roles and permissions management dashboard
     * Permission: roles.view
     */
    public function index()
    {
        $roles = Role::withCount(['users', 'permissions'])->get();
        $permissions = Permission::orderBy('category')->orderBy('name')->get();

        $authUser = auth()->user();

        return Inertia::render('RolePermission/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'permissionsByCategory' => $permissions->groupBy('category'),
            'can' => [
                'create_role' => $authUser->hasPermission('roles.create'),
                'edit_role' => $authUser->hasPermission('roles.edit'),
                'delete_role' => $authUser->hasPermission('roles.delete'),
                'create_permission' => $authUser->hasPermission('permissions.create'),
                'edit_permission' => $authUser->hasPermission('permissions.edit'),
                'delete_permission' => $authUser->hasPermission('permissions.delete'),
                'assign_permissions' => $authUser->hasPermission('roles.assign-permissions'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new role
     * Permission: roles.create
     */
    public function createRole()
    {
        $permissions = Permission::orderBy('category')->orderBy('name')->get();

        return Inertia::render('RolePermission/CreateRole', [
            'permissions' => $permissions,
            'permissionsByCategory' => $permissions->groupBy('category')
        ]);
    }

    /**
     * Store a newly created role
     * Permission: roles.create
     */
    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        // Attach permissions to role
        if (!empty($validated['permissions'])) {
            $role->permissions()->attach($validated['permissions']);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully!');
    }

    /**
     * Show the form for editing a role
     * Permission: roles.edit
     */
    public function editRole(Role $role)
    {
        $role->load('permissions');
        $allPermissions = Permission::orderBy('category')->orderBy('name')->get();

        return Inertia::render('RolePermission/EditRole', [
            'role' => $role,
            'allPermissions' => $allPermissions->groupBy('category'),
            'rolePermissions' => $role->permissions->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update the specified role
     * Permission: roles.edit
     */
    public function updateRole(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:500',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        // Sync permissions
        $role->permissions()->sync($validated['permissions'] ?? []);

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully!');
    }

    /**
     * Remove the specified role
     * Permission: roles.delete
     */
    public function destroyRole(Role $role)
    {
        // Check if role has users
        if ($role->users()->count() > 0) {
            return back()->with('error', 'Cannot delete role that has users assigned. Please reassign users first.');
        }

        // Detach all permissions
        $role->permissions()->detach();

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully!');
    }

    /**
     * Show the form for creating a new permission
     * Permission: permissions.create
     */
    public function createPermission()
    {
        // Get existing categories for dropdown
        $categories = Permission::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();

        return Inertia::render('RolePermission/CreatePermission', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created permission
     * Permission: permissions.create
     */
    public function storePermission(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|max:100',
        ]);

        // Auto-generate slug-style name if needed
        $validated['name'] = Str::slug($validated['name'], '.');

        Permission::create($validated);

        return redirect()->route('roles.index')
            ->with('success', 'Permission created successfully!');
    }

    /**
     * Show the form for editing a permission
     * Permission: permissions.edit
     */
    public function editPermission(Permission $permission)
    {
        $categories = Permission::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();

        return Inertia::render('RolePermission/EditPermission', [
            'permission' => $permission,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified permission
     * Permission: permissions.edit
     */
    public function updatePermission(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|max:100',
        ]);

        $permission->update($validated);

        return redirect()->route('roles.index')
            ->with('success', 'Permission updated successfully!');
    }

    /**
     * Remove the specified permission
     * Permission: permissions.delete
     */
    public function destroyPermission(Permission $permission)
    {
        // Detach from all roles and users
        $permission->roles()->detach();
        $permission->userPermissions()->delete();

        $permission->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Permission deleted successfully!');
    }

    /**
     * Show assign permissions to role page
     * Permission: roles.assign-permissions
     */
    public function assignPermissions(Role $role)
    {
        $role->load('permissions');
        $allPermissions = Permission::orderBy('category')->orderBy('name')->get();

        return Inertia::render('RolePermission/AssignPermissions', [
            'role' => $role,
            'permissions' => $allPermissions,
            'permissionsByCategory' => $allPermissions->groupBy('category'),
            'rolePermissions' => $role->permissions->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update permissions for a role
     * Permission: roles.assign-permissions
     */
    public function updatePermissions(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        // Sync permissions
        $role->permissions()->sync($validated['permissions']);

        return redirect()->route('roles.index')
            ->with('success', "Permissions updated for role: {$role->name}");
    }

    /**
     * Get role permissions (API endpoint)
     */
    public function getRolePermissions(Role $role)
    {
        return response()->json([
            'role' => $role->load('permissions'),
            'permissions' => $role->permissions->pluck('id')->toArray()
        ]);
    }
}
