<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Repositories\DoctorRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $userRepository;
    protected $doctorRepository;

    public function __construct(
        UserRepository $userRepository,
        DoctorRepository $doctorRepository
    ) {
        $this->userRepository = $userRepository;
        $this->doctorRepository = $doctorRepository;
    }

    /**
     * Display a listing of users
     * Permission: users.view
     */
    public function index(Request $request)
    {
        $query = User::query()->with(['role', 'permissions']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role_id') && $request->role_id) {
            $query->where('role_id', $request->role_id);
        }

        // Filter by status
        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        $roles = Role::all();
        $authUser = auth()->user();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role_id', 'is_active']),
            'can' => [
                'create' => $authUser->hasPermission('users.create'),
                'edit' => $authUser->hasPermission('users.edit'),
                'delete' => $authUser->hasPermission('users.delete'),
                'view' => $authUser->hasPermission('users.view'),
                'manage_permissions' => $authUser->hasPermission('users.manage-permissions'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new user
     * Permission: users.create
     */
    public function create()
    {
        $roles = Role::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created user
     * Permission: users.create
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        // Don't hash password here - UserRepository will handle it
        $validated['is_active'] = $request->has('is_active') ? $request->is_active : true;

        $user = $this->userRepository->create($validated);

        // If the user is a doctor, create a doctor profile
        $role = Role::find($request->role_id);
        if ($role && $role->name === 'Doctor') {
            return redirect()->route('doctors.create', ['user_id' => $user->id])
                ->with('success', 'User created successfully! Please complete the doctor profile.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User created successfully!');
    }

    /**
     * Display the specified user
     * Permission: users.view
     */
    public function show($id)
    {
        $user = User::with(['role', 'permissions.permission', 'doctor'])
            ->findOrFail($id);

        // Get user's effective permissions
        $userPermissions = $user->getAllPermissions();
        $rolePermissions = $user->role->permissions()->pluck('name')->toArray();

        // Get all available permissions for management
        $allPermissions = Permission::orderBy('category')->orderBy('name')->get();

        $authUser = auth()->user();

        return Inertia::render('Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'role' => $user->role,
                'doctor' => $user->doctor,
            ],
            'userPermissions' => $userPermissions,
            'rolePermissions' => $rolePermissions,
            'allPermissions' => $allPermissions,
            'can' => [
                'edit' => $authUser->hasPermission('users.edit'),
                'delete' => $authUser->hasPermission('users.delete'),
                'manage_permissions' => $authUser->hasPermission('users.manage-permissions'),
            ]
        ]);
    }

    /**
     * Show the form for editing user
     * Permission: users.edit
     */
    public function edit($id)
    {
        $user = User::with(['role', 'permissions.permission'])
            ->findOrFail($id);

        $roles = Role::all();
        $authUser = auth()->user();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'isCurrentUser' => $authUser->id === $user->id,
            'can' => [
                'delete' => $authUser->hasPermission('users.delete'),
                'manage_permissions' => $authUser->hasPermission('users.manage-permissions'),
            ]
        ]);
    }

    /**
     * Update the specified user
     * Permission: users.edit
     */
    public function update(Request $request, $id)
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            abort(404, 'User not found');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        // Don't hash password here - UserRepository will handle it
        // Just remove password if empty
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $success = $this->userRepository->update($id, $validated);

        if (!$success) {
            return back()->with('error', 'Failed to update user.');
        }

        // Refresh user data
        $user = $user->fresh();

        // Handle role change to/from doctor
        $role = Role::find($request->role_id);
        if ($role && $role->name === 'Doctor') {
            if (!$user->doctor) {
                return redirect()->route('doctors.create', ['user_id' => $id])
                    ->with('success', 'User updated successfully! Please complete the doctor profile.');
            } else {
                return redirect()->route('doctors.edit', $user->doctor->id)
                    ->with('success', 'User updated successfully! You can also update the doctor profile.');
            }
        }

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully!');
    }

    /**
     * Remove the specified user
     * Permission: users.delete
     */
    public function destroy($id)
    {
        $authUser = auth()->user();

        // Prevent self-deletion
        if ($id == $authUser->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user = $this->userRepository->findById($id);

        if (!$user) {
            return back()->with('error', 'User not found.');
        }

        // Check if user has a doctor profile
        if ($user->doctor) {
            return back()->with('error', 'Cannot delete user with an active doctor profile. Please delete the doctor profile first.');
        }

        $success = $this->userRepository->delete($id);

        if (!$success) {
            return back()->with('error', 'Failed to delete user.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully!');
    }

    /**
     * Manage user-specific permissions
     * Permission: users.manage-permissions
     */
    public function managePermissions($id)
    {
        $user = User::with(['role.permissions', 'userPermissions.permission'])
            ->findOrFail($id);

        $allPermissions = Permission::orderBy('category')->orderBy('name')->get()
            ->groupBy('category');

        // Get user's current permission status
        $userPermissionStatus = [];
        $rolePermissionNames = $user->role->permissions->pluck('name')->toArray();

        foreach ($allPermissions as $category => $permissions) {
            foreach ($permissions as $permission) {
                $userPerm = $user->userPermissions()
                    ->where('permission_id', $permission->id)
                    ->first();

                $userPermissionStatus[$permission->id] = [
                    'from_role' => in_array($permission->name, $rolePermissionNames),
                    'granted' => $userPerm ? $userPerm->granted : null,
                ];
            }
        }

        return Inertia::render('Users/ManagePermissions', [
            'user' => $user,
            'allPermissions' => $allPermissions,
            'userPermissionStatus' => $userPermissionStatus,
        ]);
    }

    /**
     * Update user-specific permissions
     * Permission: users.manage-permissions
     */
    public function updatePermissions(Request $request, $id)
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            return back()->with('error', 'User not found.');
        }

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*.permission_id' => 'required|exists:permissions,id',
            'permissions.*.granted' => 'required|boolean',
        ]);

        // Clear existing user permissions
        $user->userPermissions()->delete();

        // Add new user-specific permissions
        foreach ($validated['permissions'] as $permission) {
            $user->userPermissions()->create([
                'permission_id' => $permission['permission_id'],
                'granted' => $permission['granted'],
            ]);
        }

        return redirect()->route('users.show', $id)
            ->with('success', 'User permissions updated successfully!');
    }

    /**
     * Toggle user active status
     * Permission: users.edit
     */
    public function toggleStatus($id)
    {
        $authUser = auth()->user();

        if ($id == $authUser->id) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user = $this->userRepository->findById($id);

        if (!$user) {
            return back()->with('error', 'User not found.');
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$status} successfully!");
    }
}
