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

    /**
     * Safely sync system permissions without altering existing roles, permissions, or user assignments.
     */
    public function syncPermissions()
    {
        $permissions = [
            // Dashboard Permissions
            ['name' => 'dashboard.view', 'display_name' => 'View Dashboard', 'category' => 'dashboard', 'description' => 'Can view main dashboard'],
            ['name' => 'admin.dashboard', 'display_name' => 'View Admin Dashboard', 'category' => 'dashboard', 'description' => 'Can access Super Admin dashboard (comprehensive overview)'],
            ['name' => 'dashboard.receptionist', 'display_name' => 'View Receptionist Dashboard', 'category' => 'dashboard', 'description' => 'Can access receptionist dashboard'],
            ['name' => 'dashboard.doctor', 'display_name' => 'View Doctor Dashboard', 'category' => 'dashboard', 'description' => 'Can access doctor dashboard'],
            ['name' => 'dashboard.refractionist', 'display_name' => 'View Refractionist Dashboard', 'category' => 'dashboard', 'description' => 'Can access refractionist dashboard'],
            ['name' => 'dashboard.medicine-seller', 'display_name' => 'View Medicine Seller Dashboard', 'category' => 'dashboard', 'description' => 'Can access medicine seller dashboard'],
            ['name' => 'dashboard.optics-seller', 'display_name' => 'View Optics Seller Dashboard', 'category' => 'dashboard', 'description' => 'Can access optics seller dashboard'],

            // Patient Permissions
            ['name' => 'patients.view', 'display_name' => 'View Patients', 'category' => 'patients', 'description' => 'Can view patient list and details'],
            ['name' => 'patients.create', 'display_name' => 'Create Patient', 'category' => 'patients', 'description' => 'Can create new patients'],
            ['name' => 'patients.edit', 'display_name' => 'Edit Patient', 'category' => 'patients', 'description' => 'Can edit patient information'],
            ['name' => 'patients.delete', 'display_name' => 'Delete Patient', 'category' => 'patients', 'description' => 'Can delete patients'],
            ['name' => 'patients.search', 'display_name' => 'Search Patients', 'category' => 'patients', 'description' => 'Can search for patients'],
            ['name' => 'patients.receipt', 'display_name' => 'View Patient Receipt', 'category' => 'patients', 'description' => 'Can view patient receipts'],

            // Patient Visit Permissions
            ['name' => 'visits.view', 'display_name' => 'View Visits', 'category' => 'visits', 'description' => 'Can view patient visits'],
            ['name' => 'visits.create', 'display_name' => 'Create Visit', 'category' => 'visits', 'description' => 'Can create patient visits'],
            ['name' => 'visits.edit', 'display_name' => 'Edit Visit', 'category' => 'visits', 'description' => 'Can edit patient visits'],
            ['name' => 'visits.delete', 'display_name' => 'Delete Visit', 'category' => 'visits', 'description' => 'Can delete patient visits'],
            ['name' => 'visits.complete', 'display_name' => 'Complete Visit', 'category' => 'visits', 'description' => 'Can mark visits as complete'],
            ['name' => 'visits.receipt', 'display_name' => 'View Visit Receipt', 'category' => 'visits', 'description' => 'Can view visit receipts'],

            // Appointment Permissions
            ['name' => 'appointments.view', 'display_name' => 'View Appointments', 'category' => 'appointments', 'description' => 'Can view appointments'],
            ['name' => 'appointments.create', 'display_name' => 'Create Appointment', 'category' => 'appointments', 'description' => 'Can create appointments'],
            ['name' => 'appointments.edit', 'display_name' => 'Edit Appointment', 'category' => 'appointments', 'description' => 'Can edit appointments'],
            ['name' => 'appointments.delete', 'display_name' => 'Delete Appointment', 'category' => 'appointments', 'description' => 'Can delete appointments'],
            ['name' => 'appointments.status', 'display_name' => 'Update Appointment Status', 'category' => 'appointments', 'description' => 'Can update appointment status'],
            ['name' => 'appointments.print', 'display_name' => 'Print Appointment', 'category' => 'appointments', 'description' => 'Can print appointments'],

            // Vision Test Permissions
            ['name' => 'vision-tests.view', 'display_name' => 'View Vision Tests', 'category' => 'vision-tests', 'description' => 'Can view vision tests'],
            ['name' => 'vision-tests.create', 'display_name' => 'Create Vision Test', 'category' => 'vision-tests', 'description' => 'Can create vision tests'],
            ['name' => 'vision-tests.edit', 'display_name' => 'Edit Vision Test', 'category' => 'vision-tests', 'description' => 'Can edit vision tests'],
            ['name' => 'vision-tests.delete', 'display_name' => 'Delete Vision Test', 'category' => 'vision-tests', 'description' => 'Can delete vision tests'],
            ['name' => 'vision-tests.print', 'display_name' => 'Print Vision Test', 'category' => 'vision-tests', 'description' => 'Can print vision tests'],

            // Prescription Permissions
            ['name' => 'prescriptions.view', 'display_name' => 'View Prescriptions', 'category' => 'prescriptions', 'description' => 'Can view prescriptions'],
            ['name' => 'prescriptions.create', 'display_name' => 'Create Prescription', 'category' => 'prescriptions', 'description' => 'Can create prescriptions'],
            ['name' => 'prescriptions.edit', 'display_name' => 'Edit Prescription', 'category' => 'prescriptions', 'description' => 'Can edit prescriptions'],
            ['name' => 'prescriptions.delete', 'display_name' => 'Delete Prescription', 'category' => 'prescriptions', 'description' => 'Can delete prescriptions'],
            ['name' => 'prescriptions.print', 'display_name' => 'Print Prescription', 'category' => 'prescriptions', 'description' => 'Can print prescriptions'],

            // User Management Permissions
            ['name' => 'users.view', 'display_name' => 'View Users', 'category' => 'users', 'description' => 'Can view users'],
            ['name' => 'users.create', 'display_name' => 'Create User', 'category' => 'users', 'description' => 'Can create users'],
            ['name' => 'users.edit', 'display_name' => 'Edit User', 'category' => 'users', 'description' => 'Can edit users'],
            ['name' => 'users.delete', 'display_name' => 'Delete User', 'category' => 'users', 'description' => 'Can delete users'],
            ['name' => 'users.manage-permissions', 'display_name' => 'Manage User Permissions', 'category' => 'users', 'description' => 'Can manage individual user permissions'],

            // Doctor Management Permissions
            ['name' => 'doctors.view', 'display_name' => 'View Doctors', 'category' => 'doctors', 'description' => 'Can view doctors'],
            ['name' => 'doctors.create', 'display_name' => 'Create Doctor', 'category' => 'doctors', 'description' => 'Can create doctors'],
            ['name' => 'doctors.edit', 'display_name' => 'Edit Doctor', 'category' => 'doctors', 'description' => 'Can edit doctors'],
            ['name' => 'doctors.delete', 'display_name' => 'Delete Doctor', 'category' => 'doctors', 'description' => 'Can delete doctors'],
            ['name' => 'doctors.availability', 'display_name' => 'Manage Doctor Availability', 'category' => 'doctors', 'description' => 'Can manage doctor availability'],

            // Medicine Management Permissions
            ['name' => 'medicines.view', 'display_name' => 'View Medicines', 'category' => 'medicines', 'description' => 'Can view medicines'],
            ['name' => 'medicines.create', 'display_name' => 'Create Medicine', 'category' => 'medicines', 'description' => 'Can create medicines'],
            ['name' => 'medicines.edit', 'display_name' => 'Edit Medicine', 'category' => 'medicines', 'description' => 'Can edit medicines'],
            ['name' => 'medicines.delete', 'display_name' => 'Delete Medicine', 'category' => 'medicines', 'description' => 'Can delete medicines'],
            ['name' => 'medicines.toggle-status', 'display_name' => 'Toggle Medicine Status', 'category' => 'medicines', 'description' => 'Can enable/disable medicines'],

            // Medicine Corner Permissions
            ['name' => 'medicine-corner.view', 'display_name' => 'View Medicine Corner', 'category' => 'medicine-corner', 'description' => 'Can access medicine corner'],
            ['name' => 'medicine-corner.stock', 'display_name' => 'Manage Medicine Stock', 'category' => 'medicine-corner', 'description' => 'Can manage medicine stock'],
            ['name' => 'medicine-corner.sales', 'display_name' => 'Manage Medicine Sales', 'category' => 'medicine-corner', 'description' => 'Can manage medicine sales'],
            ['name' => 'medicine-corner.purchase', 'display_name' => 'Manage Medicine Purchases', 'category' => 'medicine-corner', 'description' => 'Can manage medicine purchases'],
            ['name' => 'medicine-corner.vendors', 'display_name' => 'Manage Medicine Vendors', 'category' => 'medicine-corner', 'description' => 'Can manage medicine vendors'],
            ['name' => 'medicine-corner.reports', 'display_name' => 'View Medicine Reports', 'category' => 'medicine-corner', 'description' => 'Can view medicine reports'],
            ['name' => 'medicine.reports.buy-sale-stock', 'display_name' => 'View Medicine Buy-Sale-Stock Report', 'category' => 'medicine-corner', 'description' => 'Can view medicine buy-sale-stock report'],
            ['name' => 'medicine.reports.daily-statement', 'display_name' => 'View Medicine Daily Statement', 'category' => 'medicine-corner', 'description' => 'Can view medicine daily statement'],
            ['name' => 'medicine.reports.account-statement', 'display_name' => 'View Medicine Account Statement', 'category' => 'medicine-corner', 'description' => 'Can view medicine account statement'],

            // Medicine Seller Permissions
            ['name' => 'medicine-seller.pos', 'display_name' => 'Medicine POS', 'category' => 'medicine-seller', 'description' => 'Can use medicine POS system'],
            ['name' => 'medicine-seller.sales', 'display_name' => 'View Medicine Sales', 'category' => 'medicine-seller', 'description' => 'Can view medicine sales'],
            ['name' => 'medicine-seller.reports', 'display_name' => 'View Medicine Seller Reports', 'category' => 'medicine-seller', 'description' => 'Can view medicine seller reports'],

            // Optics Permissions
            ['name' => 'optics.view', 'display_name' => 'View Optics', 'category' => 'optics', 'description' => 'Can access optics module'],
            ['name' => 'optics.frames', 'display_name' => 'Manage Frames', 'category' => 'optics', 'description' => 'Can manage frames'],
            ['name' => 'optics.stock', 'display_name' => 'Manage Optics Stock', 'category' => 'optics', 'description' => 'Can manage optics stock'],
            ['name' => 'optics.sales', 'display_name' => 'Manage Optics Sales', 'category' => 'optics', 'description' => 'Can manage optics sales'],
            ['name' => 'optics.vendors', 'display_name' => 'Manage Optics Vendors', 'category' => 'optics', 'description' => 'Can manage optics vendors'],
            ['name' => 'optics.purchases', 'display_name' => 'Manage Optics Purchases', 'category' => 'optics', 'description' => 'Can manage optics purchases'],
            ['name' => 'optics.lens-types', 'display_name' => 'Manage Lens Types', 'category' => 'optics', 'description' => 'Can manage lens types'],
            ['name' => 'optics.reports.buy-sale-stock', 'display_name' => 'View Optics Buy-Sale-Stock Report', 'category' => 'optics', 'description' => 'Can view optics buy-sale-stock report'],
            ['name' => 'optics.reports.daily-statement', 'display_name' => 'View Optics Daily Statement', 'category' => 'optics', 'description' => 'Can view optics daily statement'],
            ['name' => 'optics.reports.account-statement', 'display_name' => 'View Optics Account Statement', 'category' => 'optics', 'description' => 'Can view optics account statement'],

            // Optics Seller Permissions
            ['name' => 'optics-seller.pos', 'display_name' => 'Optics POS', 'category' => 'optics-seller', 'description' => 'Can use optics POS system'],
            ['name' => 'optics-seller.sales', 'display_name' => 'View Optics Sales', 'category' => 'optics-seller', 'description' => 'Can view optics sales'],
            ['name' => 'optics-seller.reports', 'display_name' => 'View Optics Seller Reports', 'category' => 'optics-seller', 'description' => 'Can view optics seller reports'],

            // Account Management Permissions
            ['name' => 'hospital-account.view', 'display_name' => 'View Hospital Account', 'category' => 'hospital-account', 'description' => 'Can view hospital account'],
            ['name' => 'hospital-account.fund-in', 'display_name' => 'Fund In Hospital Account', 'category' => 'hospital-account', 'description' => 'Can add funds to hospital account'],
            ['name' => 'hospital-account.fund-out', 'display_name' => 'Fund Out Hospital Account', 'category' => 'hospital-account', 'description' => 'Can withdraw funds from hospital account'],
            ['name' => 'hospital-account.expense', 'display_name' => 'Manage Hospital Expenses', 'category' => 'hospital-account', 'description' => 'Can manage hospital expenses'],
            ['name' => 'hospital-account.transactions', 'display_name' => 'Manage Hospital Transactions', 'category' => 'hospital-account', 'description' => 'Can manage hospital transactions'],
            ['name' => 'hospital-account.fund-history', 'display_name' => 'View Hospital Fund History', 'category' => 'hospital-account', 'description' => 'Can view hospital fund history'],
            ['name' => 'hospital-account.categories', 'display_name' => 'Manage Hospital Categories', 'category' => 'hospital-account', 'description' => 'Can manage hospital expense/income categories'],
            ['name' => 'hospital-account.fixed-assets', 'display_name' => 'Manage Hospital Fixed Assets', 'category' => 'hospital-account', 'description' => 'Can manage hospital fixed assets'],
            ['name' => 'hospital-account.fixed-asset-vendors', 'display_name' => 'Manage Hospital Asset Vendors', 'category' => 'hospital-account', 'description' => 'Can manage hospital asset vendors'],
            ['name' => 'hospital-account.monthly-report', 'display_name' => 'View Hospital Monthly Report', 'category' => 'hospital-account', 'description' => 'Can view hospital monthly report'],
            ['name' => 'hospital-account.balance-sheet', 'display_name' => 'View Hospital Balance Sheet', 'category' => 'hospital-account', 'description' => 'Can view hospital balance sheet'],
            ['name' => 'hospital-account.reports', 'display_name' => 'View Hospital Reports', 'category' => 'hospital-account', 'description' => 'Can view hospital financial reports'],
            ['name' => 'hospital.reports.medical-test-income', 'display_name' => 'View Medical Test Income Report', 'category' => 'hospital-account', 'description' => 'Can view medical test income report'],
            ['name' => 'hospital.reports.daily-statement', 'display_name' => 'View Hospital Daily Statement', 'category' => 'hospital-account', 'description' => 'Can view hospital daily statement'],
            ['name' => 'hospital.reports.account-statement', 'display_name' => 'View Hospital Account Statement', 'category' => 'hospital-account', 'description' => 'Can view hospital account statement'],
            ['name' => 'hospital.reports.new-patient-income', 'display_name' => 'View New Patient Income Report', 'category' => 'hospital-account', 'description' => 'Can view new patient OPD income report'],
            ['name' => 'hospital.reports.followup-patient-income', 'display_name' => 'View Followup Patient Income Report', 'category' => 'hospital-account', 'description' => 'Can view followup patient OPD income report'],

            ['name' => 'medicine-account.view', 'display_name' => 'View Medicine Account', 'category' => 'medicine-account', 'description' => 'Can view medicine account'],
            ['name' => 'medicine-account.fund-in', 'display_name' => 'Fund In Medicine Account', 'category' => 'medicine-account', 'description' => 'Can add funds to medicine account'],
            ['name' => 'medicine-account.fund-out', 'display_name' => 'Fund Out Medicine Account', 'category' => 'medicine-account', 'description' => 'Can withdraw funds from medicine account'],
            ['name' => 'medicine-account.expense', 'display_name' => 'Manage Medicine Expenses', 'category' => 'medicine-account', 'description' => 'Can manage medicine expenses'],
            ['name' => 'medicine-account.reports', 'display_name' => 'View Medicine Account Reports', 'category' => 'medicine-account', 'description' => 'Can view medicine account reports'],

            ['name' => 'optics-account.view', 'display_name' => 'View Optics Account', 'category' => 'optics-account', 'description' => 'Can view optics account'],
            ['name' => 'optics-account.fund-in', 'display_name' => 'Fund In Optics Account', 'category' => 'optics-account', 'description' => 'Can add funds to optics account'],
            ['name' => 'optics-account.fund-out', 'display_name' => 'Fund Out Optics Account', 'category' => 'optics-account', 'description' => 'Can withdraw funds from optics account'],
            ['name' => 'optics-account.expense', 'display_name' => 'Manage Optics Expenses', 'category' => 'optics-account', 'description' => 'Can manage optics expenses'],
            ['name' => 'optics-account.reports', 'display_name' => 'View Optics Account Reports', 'category' => 'optics-account', 'description' => 'Can view optics account reports'],

            ['name' => 'main-account.view', 'display_name' => 'View Main Account', 'category' => 'main-account', 'description' => 'Can view main account'],
            ['name' => 'main-account.vouchers', 'display_name' => 'View Account Vouchers', 'category' => 'main-account', 'description' => 'Can view account vouchers'],
            ['name' => 'main-account.reports', 'display_name' => 'View Main Account Reports', 'category' => 'main-account', 'description' => 'Can view main account reports'],

            // Medical Test Permissions
            ['name' => 'medical-tests.view', 'display_name' => 'View Medical Tests', 'category' => 'medical-tests', 'description' => 'Can view medical tests'],
            ['name' => 'medical-tests.create', 'display_name' => 'Create Medical Test', 'category' => 'medical-tests', 'description' => 'Can create medical tests'],
            ['name' => 'medical-tests.edit', 'display_name' => 'Edit Medical Test', 'category' => 'medical-tests', 'description' => 'Can edit medical tests'],
            ['name' => 'medical-tests.delete', 'display_name' => 'Delete Medical Test', 'category' => 'medical-tests', 'description' => 'Can delete medical tests'],
            ['name' => 'medical-tests.manage-tests', 'display_name' => 'Manage Test Masters', 'category' => 'medical-tests', 'description' => 'Can manage test masters'],
            ['name' => 'medical-tests.results', 'display_name' => 'Update Test Results', 'category' => 'medical-tests', 'description' => 'Can update test results'],
            ['name' => 'medical-tests.payment', 'display_name' => 'Manage Test Payments', 'category' => 'medical-tests', 'description' => 'Can manage test payments'],
            ['name' => 'medical-tests.reports', 'display_name' => 'View Medical Test Reports', 'category' => 'medical-tests', 'description' => 'Can view medical test reports'],

            // Operation Permissions (Operation Types Management)
            ['name' => 'operations.view', 'display_name' => 'View Operations', 'category' => 'operations', 'description' => 'Can view operation types'],
            ['name' => 'operations.create', 'display_name' => 'Create Operation', 'category' => 'operations', 'description' => 'Can create operation types'],
            ['name' => 'operations.edit', 'display_name' => 'Edit Operation', 'category' => 'operations', 'description' => 'Can edit operation types'],
            ['name' => 'operations.delete', 'display_name' => 'Delete Operation', 'category' => 'operations', 'description' => 'Can delete operation types'],
            ['name' => 'operation.reports.income', 'display_name' => 'View Operation Income Report', 'category' => 'operations', 'description' => 'Can view operation income report'],
            ['name' => 'operation.reports.daily-statement', 'display_name' => 'View Operation Daily Statement', 'category' => 'operations', 'description' => 'Can view operation daily statement'],
            ['name' => 'operation.reports.account-statement', 'display_name' => 'View Operation Account Statement', 'category' => 'operations', 'description' => 'Can view operation account statement'],

            // Operation Booking Permissions
            ['name' => 'operation-bookings.view', 'display_name' => 'View Operation Bookings', 'category' => 'operation-bookings', 'description' => 'Can view operation bookings'],
            ['name' => 'operation-bookings.create', 'display_name' => 'Create Operation Booking', 'category' => 'operation-bookings', 'description' => 'Can create operation bookings'],
            ['name' => 'operation-bookings.edit', 'display_name' => 'Edit Operation Booking', 'category' => 'operation-bookings', 'description' => 'Can edit operation bookings'],
            ['name' => 'operation-bookings.delete', 'display_name' => 'Delete Operation Booking', 'category' => 'operation-bookings', 'description' => 'Can delete operation bookings'],
            ['name' => 'operation-bookings.payment', 'display_name' => 'Manage Operation Payments', 'category' => 'operation-bookings', 'description' => 'Can manage operation payments'],
            ['name' => 'operation-bookings.confirm', 'display_name' => 'Confirm Operation Booking', 'category' => 'operation-bookings', 'description' => 'Can confirm operation bookings'],
            ['name' => 'operation-bookings.complete', 'display_name' => 'Complete Operation', 'category' => 'operation-bookings', 'description' => 'Can mark operations as completed'],
            ['name' => 'operation-bookings.cancel', 'display_name' => 'Cancel Operation Booking', 'category' => 'operation-bookings', 'description' => 'Can cancel operation bookings'],
            ['name' => 'operation-bookings.reschedule', 'display_name' => 'Reschedule Operation', 'category' => 'operation-bookings', 'description' => 'Can reschedule operations'],

            // Report Permissions
            ['name' => 'reports.view', 'display_name' => 'View Reports', 'category' => 'reports', 'description' => 'Can view general reports'],
            ['name' => 'reports.patients', 'display_name' => 'View Patient Reports', 'category' => 'reports', 'description' => 'Can view patient reports'],
            ['name' => 'reports.doctors', 'display_name' => 'View Doctor Reports', 'category' => 'reports', 'description' => 'Can view doctor reports'],
            ['name' => 'reports.appointments', 'display_name' => 'View Appointment Reports', 'category' => 'reports', 'description' => 'Can view appointment reports'],
            ['name' => 'reports.revenue', 'display_name' => 'View Revenue Reports', 'category' => 'reports', 'description' => 'Can view revenue reports'],
            ['name' => 'reports.receipt-payment', 'display_name' => 'View Receipt & Payment Report', 'category' => 'reports', 'description' => 'Can view receipt and payment reports'],
            ['name' => 'reports.income-expenditure', 'display_name' => 'View Income & Expenditure Report', 'category' => 'reports', 'description' => 'Can view income and expenditure reports'],
            ['name' => 'reports.balance-sheet', 'display_name' => 'View Balance Sheet Report', 'category' => 'reports', 'description' => 'Can view balance sheet reports'],

            // Settings Permissions
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'category' => 'settings', 'description' => 'Can view system settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'category' => 'settings', 'description' => 'Can edit system settings'],

            // Profile Permissions
            ['name' => 'profile.view', 'display_name' => 'View Profile', 'category' => 'profile', 'description' => 'Can view own profile'],
            ['name' => 'profile.edit', 'display_name' => 'Edit Profile', 'category' => 'profile', 'description' => 'Can edit own profile'],

            ['name' => 'attendance.view', 'display_name' => 'View Attendance', 'category' => 'attendance', 'description' => 'Can view daily attendance sheet'],
            ['name' => 'attendance.manage', 'display_name' => 'Manage Attendance', 'category' => 'attendance', 'description' => 'Can manage holidays, device sync targets, and per-user attendance settings'],

            ['name' => 'employee-management.view', 'display_name' => 'Employee Management (Show & Create)', 'category' => 'employees', 'description' => 'Grants view & create access for all Employee Management modules (Edit/Delete restricted to Super Admin)'],
            ['name' => 'employees.view', 'display_name' => 'View Employees', 'category' => 'employees', 'description' => 'Can view employee directory (separate from user accounts)'],
            ['name' => 'employees.create', 'display_name' => 'Create Employee', 'category' => 'employees', 'description' => 'Can add employees'],
            ['name' => 'employees.edit', 'display_name' => 'Edit Employee', 'category' => 'employees', 'description' => 'Can edit employees and attendance schedule'],
            ['name' => 'employees.delete', 'display_name' => 'Delete Employee', 'category' => 'employees', 'description' => 'Can delete employees'],

            // Role & Permission Management
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'category' => 'roles_permissions', 'description' => 'Can view roles and permissions'],
            ['name' => 'roles.create', 'display_name' => 'Create Role', 'category' => 'roles_permissions', 'description' => 'Can create new roles'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Role', 'category' => 'roles_permissions', 'description' => 'Can edit existing roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Role', 'category' => 'roles_permissions', 'description' => 'Can delete roles'],
            ['name' => 'roles.assign-permissions', 'display_name' => 'Assign Permissions', 'category' => 'roles_permissions', 'description' => 'Can assign permissions to roles'],
            ['name' => 'permissions.create', 'display_name' => 'Create Permission', 'category' => 'roles_permissions', 'description' => 'Can create new permissions'],
            ['name' => 'permissions.edit', 'display_name' => 'Edit Permission', 'category' => 'roles_permissions', 'description' => 'Can edit existing permissions'],
            ['name' => 'permissions.delete', 'display_name' => 'Delete Permission', 'category' => 'roles_permissions', 'description' => 'Can delete permissions'],
        ];

        $newCount = 0;
        foreach ($permissions as $permission) {
            $created = Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
            if ($created->wasRecentlyCreated) {
                $newCount++;
            }
        }

        // Attach all new permissions to Super Admin role without detaching existing ones
        $superAdmin = Role::where('name', 'Super Admin')->first();
        if ($superAdmin) {
            $allPermissions = Permission::where('name', '!=', '*')->get();
            $superAdmin->permissions()->syncWithoutDetaching($allPermissions->pluck('id'));
        }

        return redirect()->route('roles.index')->with(
            'success',
            $newCount > 0
                ? "Permissions synchronized successfully! {$newCount} new permission(s) added."
                : "All system permissions are already up to date. No new permissions found."
        );
    }
}
