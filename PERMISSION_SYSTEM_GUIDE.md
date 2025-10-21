# Permission System Implementation Guide

## Overview
এই ডকুমেন্ট Eye Hospital Management System এর জন্য তৈরি করা Permission System এর সম্পূর্ণ গাইড।

## Database Structure

### Tables Created

#### 1. `permissions` Table
```sql
- id (Primary Key)
- name (Unique) - e.g., 'patients.create', 'appointments.edit'
- display_name - User-friendly name
- module - Module grouping (e.g., 'patients', 'appointments')
- description - Permission description
- timestamps
```

#### 2. `role_permission` Table (Pivot)
```sql
- id
- role_id (Foreign Key -> roles)
- permission_id (Foreign Key -> permissions)
- timestamps
- Unique constraint on (role_id, permission_id)
```

#### 3. `user_permission` Table (Pivot)
```sql
- id
- user_id (Foreign Key -> users)
- permission_id (Foreign Key -> permissions)
- granted (Boolean) - true = granted, false = revoked
- timestamps
- Unique constraint on (user_id, permission_id)
```

## Permissions List

### Dashboard Permissions
- `dashboard.view` - View main dashboard
- `dashboard.receptionist` - View receptionist dashboard
- `dashboard.doctor` - View doctor dashboard
- `dashboard.refractionist` - View refractionist dashboard
- `dashboard.medicine-seller` - View medicine seller dashboard
- `dashboard.optics-seller` - View optics seller dashboard

### Patient Management
- `patients.view` - View patient list and details
- `patients.create` - Create new patients
- `patients.edit` - Edit patient information
- `patients.delete` - Delete patients
- `patients.search` - Search for patients
- `patients.receipt` - View patient receipts

### Visit Management
- `visits.view` - View patient visits
- `visits.create` - Create patient visits
- `visits.edit` - Edit patient visits
- `visits.delete` - Delete patient visits
- `visits.complete` - Mark visits as complete
- `visits.receipt` - View visit receipts

### Appointment Management
- `appointments.view` - View appointments
- `appointments.create` - Create appointments
- `appointments.edit` - Edit appointments
- `appointments.delete` - Delete appointments
- `appointments.status` - Update appointment status
- `appointments.print` - Print appointments

### Vision Test Management
- `vision-tests.view` - View vision tests
- `vision-tests.create` - Create vision tests
- `vision-tests.edit` - Edit vision tests
- `vision-tests.delete` - Delete vision tests
- `vision-tests.print` - Print vision tests

### Prescription Management
- `prescriptions.view` - View prescriptions
- `prescriptions.create` - Create prescriptions
- `prescriptions.edit` - Edit prescriptions
- `prescriptions.delete` - Delete prescriptions
- `prescriptions.print` - Print prescriptions

### User Management
- `users.view` - View users
- `users.create` - Create users
- `users.edit` - Edit users
- `users.delete` - Delete users

### Doctor Management
- `doctors.view` - View doctors
- `doctors.create` - Create doctors
- `doctors.edit` - Edit doctors
- `doctors.delete` - Delete doctors
- `doctors.availability` - Manage doctor availability

### Medicine Management
- `medicines.view` - View medicines
- `medicines.create` - Create medicines
- `medicines.edit` - Edit medicines
- `medicines.delete` - Delete medicines
- `medicines.toggle-status` - Enable/disable medicines

### Medicine Corner
- `medicine-corner.view` - Access medicine corner
- `medicine-corner.stock` - Manage medicine stock
- `medicine-corner.sales` - Manage medicine sales
- `medicine-corner.purchase` - Manage medicine purchases
- `medicine-corner.vendors` - Manage medicine vendors
- `medicine-corner.reports` - View medicine reports

### Medicine Seller
- `medicine-seller.pos` - Use medicine POS system
- `medicine-seller.sales` - View medicine sales
- `medicine-seller.reports` - View medicine seller reports

### Optics Management
- `optics.view` - Access optics module
- `optics.frames` - Manage frames
- `optics.stock` - Manage optics stock
- `optics.sales` - Manage optics sales
- `optics.vendors` - Manage optics vendors
- `optics.purchases` - Manage optics purchases
- `optics.lens-types` - Manage lens types

### Optics Seller
- `optics-seller.pos` - Use optics POS system
- `optics-seller.sales` - View optics sales
- `optics-seller.reports` - View optics seller reports

### Account Management
- `hospital-account.view` - View hospital account
- `hospital-account.fund-in` - Fund in hospital account
- `hospital-account.fund-out` - Fund out hospital account
- `hospital-account.expense` - Manage hospital expenses
- `hospital-account.transactions` - Manage hospital transactions
- `hospital-account.reports` - View hospital reports

- `medicine-account.view` - View medicine account
- `medicine-account.fund-in` - Fund in medicine account
- `medicine-account.fund-out` - Fund out medicine account
- `medicine-account.expense` - Manage medicine expenses
- `medicine-account.reports` - View medicine account reports

- `optics-account.view` - View optics account
- `optics-account.fund-in` - Fund in optics account
- `optics-account.fund-out` - Fund out optics account
- `optics-account.expense` - Manage optics expenses
- `optics-account.reports` - View optics account reports

- `main-account.view` - View main account
- `main-account.vouchers` - View account vouchers
- `main-account.reports` - View main account reports

### Medical Test Management
- `medical-tests.view` - View medical tests
- `medical-tests.create` - Create medical tests
- `medical-tests.edit` - Edit medical tests
- `medical-tests.delete` - Delete medical tests
- `medical-tests.manage-tests` - Manage test masters
- `medical-tests.results` - Update test results
- `medical-tests.payment` - Manage test payments
- `medical-tests.reports` - View medical test reports

### Reports
- `reports.view` - View general reports
- `reports.patients` - View patient reports
- `reports.doctors` - View doctor reports
- `reports.appointments` - View appointment reports
- `reports.revenue` - View revenue reports

### Settings & Profile
- `settings.view` - View system settings
- `settings.edit` - Edit system settings
- `profile.view` - View own profile
- `profile.edit` - Edit own profile

## Role-Based Permission Assignment

### Super Admin
- **All permissions** - Full system access

### Receptionist
- Dashboard: `dashboard.view`, `dashboard.receptionist`
- Patients: View, Create, Edit, Search, Receipt
- Visits: View, Create, Edit, Complete, Receipt
- Appointments: View, Create, Edit, Status, Print
- Vision Tests: View
- Prescriptions: View, Print
- Medical Tests: View, Create, Payment
- Reports: View, Patients, Appointments
- Profile: View, Edit

### Doctor
- Dashboard: `dashboard.view`, `dashboard.doctor`
- Patients: View, Search, Receipt
- Visits: View
- Appointments: View, Status
- Vision Tests: View, Print
- Prescriptions: View, Create, Edit, Print
- Medical Tests: View, Results
- Reports: View, Patients
- Profile: View, Edit

### Refractionist
- Dashboard: `dashboard.view`, `dashboard.refractionist`
- Patients: View, Search
- Visits: View
- Vision Tests: View, Create, Edit, Print
- Profile: View, Edit

### Medicine Seller
- Dashboard: `dashboard.view`, `dashboard.medicine-seller`
- Medicine POS: Full access
- Medicine Sales: View
- Reports: Medicine seller reports
- Patients: Search (for customer lookup)
- Profile: View, Edit

### Optics Seller
- Dashboard: `dashboard.view`, `dashboard.optics-seller`
- Optics POS: Full access
- Optics Sales: View
- Reports: Optics seller reports
- Patients: Search (for customer lookup)
- Profile: View, Edit

## Usage Guide

### 1. Check Permission in Code

#### In Controller
```php
public function create()
{
    if (!auth()->user()->hasPermission('patients.create')) {
        abort(403, 'Unauthorized');
    }
    // Your code here
}
```

#### Multiple Permissions (Any)
```php
if (auth()->user()->hasAnyPermission(['patients.edit', 'patients.create'])) {
    // User has at least one of these permissions
}
```

#### Multiple Permissions (All)
```php
if (auth()->user()->hasAllPermissions(['patients.view', 'patients.edit'])) {
    // User has all these permissions
}
```

### 2. Use Permission Middleware in Routes

#### Single Permission
```php
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('permission:patients.create');
```

#### In Route Groups
```php
Route::middleware(['auth', 'permission:patients.create'])->group(function () {
    Route::get('/patients/create', [PatientController::class, 'create']);
    Route::post('/patients', [PatientController::class, 'store']);
});
```

### 3. Check Permission in Blade/Inertia

#### Blade Template
```blade
@can('patients.create')
    <a href="{{ route('patients.create') }}">Create Patient</a>
@endcan
```

#### Inertia/Vue Component (pass from controller)
```php
return Inertia::render('Patients/Index', [
    'canCreate' => auth()->user()->hasPermission('patients.create'),
    'canEdit' => auth()->user()->hasPermission('patients.edit'),
]);
```

### 4. Assign/Revoke Permissions

#### To Role
```php
use App\Models\Role;

$role = Role::find(1);
$role->givePermissionTo('patients.create');
$role->revokePermissionTo('patients.delete');
```

#### To User (Direct Assignment)
```php
use App\Models\User;

$user = User::find(1);
$user->givePermissionTo('reports.revenue'); // Grant
$user->revokePermissionTo('reports.revenue'); // Revoke
```

## Installation Steps

### 1. Run Migration
```bash
php artisan migrate
```

### 2. Seed Permissions
```bash
php artisan db:seed --class=PermissionSeeder
```

### 3. Or Migrate Fresh with Seed
```bash
php artisan migrate:fresh --seed
```

## Middleware Usage

### Available Middleware

1. **`permission:permission.name`** - Check single permission
2. **`role:Role Name`** - Check role (legacy)
3. **`super-admin`** - Super admin only (bypasses permissions)
4. **`doctor`** - Doctor or Super Admin
5. **`receptionist`** - Receptionist or Super Admin
6. **`refractionist`** - Refractionist or Super Admin
7. **`doctor-or-receptionist`** - Doctor, Receptionist, or Super Admin

## Advanced Features

### Override Role Permissions for Individual Users

কোনো user কে তার role এর বাইরে specific permission দেওয়া যায়:

```php
// User এর role এ এই permission না থাকলেও এই user এ দিতে পারবেন
$user->givePermissionTo('reports.revenue');

// User এর role এ এই permission থাকলেও এই user থেকে বাদ দিতে পারবেন
$user->revokePermissionTo('patients.delete');
```

### Permission Checking Logic

1. প্রথমে user এর direct permission check করা হয়
2. যদি direct permission থাকে এবং granted = false, তাহলে access denied
3. যদি direct permission না থাকে, তাহলে role এর permission check করা হয়
4. Super Admin সবসময় সব permission পায়

## Next Steps

1. **Web.php Update**: Route গুলোতে appropriate middleware apply করুন
2. **Controller Update**: Controller methods এ permission check add করুন
3. **Frontend Update**: UI তে permission-based visibility implement করুন
4. **Testing**: সব role দিয়ে test করুন

## Migration Command

```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Only run permission seeder
php artisan db:seed --class=PermissionSeeder
```

## Notes

- Super Admin role সবসময় সব permission পায়
- Existing middleware (doctor, receptionist, etc.) এখনও কাজ করবে
- Permission system হল একটা additional layer of security
- প্রতিটি module এর জন্য আলাদা permissions আছে
- User-level permission override করা যায়

## Support

কোনো সমস্যা হলে এই বিষয়গুলো check করুন:

1. Migration run হয়েছে কিনা
2. Permission seeder run হয়েছে কিনা
3. User এর role properly assigned আছে কিনা
4. Middleware properly registered আছে bootstrap/app.php তে
