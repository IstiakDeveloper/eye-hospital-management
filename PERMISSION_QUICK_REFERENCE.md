# Permission System - Quick Reference Card

## 🚀 Quick Start (3 Commands)

```bash
# 1. Run migration
php artisan migrate

# 2. Seed permissions
php artisan db:seed --class=PermissionSeeder

# 3. Clear cache
php artisan cache:clear
```

## 📋 Common Permission Checks

### In Controller
```php
// Simple check
if (!auth()->user()->hasPermission('patients.create')) {
    abort(403);
}

// Check any permission
if (auth()->user()->hasAnyPermission(['patients.edit', 'patients.create'])) {
    // Code
}

// Check all permissions
if (auth()->user()->hasAllPermissions(['patients.view', 'patients.edit'])) {
    // Code
}
```

### In Routes
```php
// Single permission
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('permission:patients.create');

// Multiple routes with same permission
Route::middleware(['auth', 'permission:patients.create'])->group(function () {
    Route::get('/patients/create', [PatientController::class, 'create']);
    Route::post('/patients', [PatientController::class, 'store']);
});
```

### In Blade
```blade
@can('patients.create')
    <button>Create Patient</button>
@endcan
```

### In Inertia (Controller)
```php
return Inertia::render('Patients/Index', [
    'canCreate' => auth()->user()->hasPermission('patients.create'),
    'canEdit' => auth()->user()->hasPermission('patients.edit'),
    'canDelete' => auth()->user()->hasPermission('patients.delete'),
]);
```

## 🔑 Permission Naming Convention

Format: `module.action`

Examples:
- `patients.view` - View patients
- `patients.create` - Create patient
- `patients.edit` - Edit patient
- `patients.delete` - Delete patient
- `appointments.status` - Update appointment status
- `medicine-corner.stock` - Manage medicine stock

## 👥 Role Permissions Summary

### Super Admin
✅ ALL permissions

### Receptionist
✅ Patients (view, create, edit, search)
✅ Visits (view, create, edit, complete)
✅ Appointments (view, create, edit, status)
✅ Medical Tests (create, payment)

### Doctor
✅ Patients (view, search)
✅ Prescriptions (create, edit, print)
✅ Vision Tests (view, print)
✅ Medical Tests (results)

### Refractionist
✅ Vision Tests (full CRUD)
✅ Patients (view, search)

### Medicine Seller
✅ Medicine POS
✅ Sales viewing
✅ Reports

### Optics Seller
✅ Optics POS
✅ Sales viewing
✅ Reports

## 🛠️ Assign/Revoke Permissions

### To Role
```php
$role = Role::find(1);
$role->givePermissionTo('patients.create');
$role->revokePermissionTo('patients.delete');
```

### To User (Override Role)
```php
$user = User::find(1);
$user->givePermissionTo('reports.revenue'); // Grant
$user->revokePermissionTo('reports.revenue'); // Revoke
```

### Sync All Permissions
```php
$role->syncPermissions(['patients.view', 'patients.create']);
```

## 📊 All Modules & Their Permissions

| Module | Permissions |
|--------|-------------|
| Dashboard | view, receptionist, doctor, refractionist, medicine-seller, optics-seller |
| Patients | view, create, edit, delete, search, receipt |
| Visits | view, create, edit, delete, complete, receipt |
| Appointments | view, create, edit, delete, status, print |
| Vision Tests | view, create, edit, delete, print |
| Prescriptions | view, create, edit, delete, print |
| Users | view, create, edit, delete |
| Doctors | view, create, edit, delete, availability |
| Medicines | view, create, edit, delete, toggle-status |
| Medicine Corner | view, stock, sales, purchase, vendors, reports |
| Medicine Seller | pos, sales, reports |
| Optics | view, frames, stock, sales, vendors, purchases, lens-types |
| Optics Seller | pos, sales, reports |
| Hospital Account | view, fund-in, fund-out, expense, transactions, reports |
| Medicine Account | view, fund-in, fund-out, expense, reports |
| Optics Account | view, fund-in, fund-out, expense, reports |
| Main Account | view, vouchers, reports |
| Medical Tests | view, create, edit, delete, manage-tests, results, payment, reports |
| Reports | view, patients, doctors, appointments, revenue |
| Settings | view, edit |
| Profile | view, edit |

## 🔒 Middleware Options

```php
// Permission check
->middleware('permission:patients.create')

// Role check (legacy)
->middleware('role:Receptionist')

// Super admin only
->middleware('super-admin')

// Doctor only
->middleware('doctor')

// Receptionist only
->middleware('receptionist')

// Refractionist only
->middleware('refractionist')

// Doctor or Receptionist
->middleware('doctor-or-receptionist')
```

## 📝 Permission List Examples

### Patient Module
```
patients.view
patients.create
patients.edit
patients.delete
patients.search
patients.receipt
```

### Medicine Corner Module
```
medicine-corner.view
medicine-corner.stock
medicine-corner.sales
medicine-corner.purchase
medicine-corner.vendors
medicine-corner.reports
```

### Account Modules
```
hospital-account.view
hospital-account.fund-in
hospital-account.fund-out
hospital-account.expense
hospital-account.transactions
hospital-account.reports
```

## ⚡ Advanced Features

### Get All User Permissions
```php
$permissions = auth()->user()->getPermissionNames();
// Returns: ['patients.view', 'patients.create', ...]
```

### Check Permission in Model
```php
class Patient extends Model {
    public function canBeEditedBy(User $user): bool {
        return $user->hasPermission('patients.edit');
    }
}
```

### Mass Permission Assignment
```php
$receptionist = Role::where('name', 'Receptionist')->first();
$permissions = [
    'patients.view',
    'patients.create',
    'appointments.view',
    'appointments.create',
];
$receptionist->syncPermissions($permissions);
```

## 🐛 Troubleshooting

### Permission not working?
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### 403 Error?
1. Check if permission seeder ran
2. Verify user has role assigned
3. Check permission name is correct
4. Verify Super Admin bypass works

### Need to re-seed?
```bash
php artisan db:seed --class=PermissionSeeder
```

## 📖 Full Documentation

- **Complete Guide**: `PERMISSION_SYSTEM_GUIDE.md`
- **Web.php Updates**: `WEB_PHP_UPDATE_GUIDE.md`
- **Summary**: `PERMISSION_IMPLEMENTATION_SUMMARY.md`

---

**বানিয়েছেন**: GitHub Copilot  
**তারিখ**: October 20, 2025  
**Version**: 1.0
