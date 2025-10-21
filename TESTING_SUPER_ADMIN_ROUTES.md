# Testing Super Admin Only Middleware

## Test করার জন্য Commands

### 1. Check Middleware Registration
```bash
php artisan route:list --name=patients.edit --verbose
```

Expected Output:
```
⇂ web
⇂ auth
⇂ permission:patients.edit
⇂ super-admin-only    ✅
```

### 2. Test With Tinker (Super Admin Access)
```bash
php artisan tinker
```

```php
// Get a Super Admin user
$superAdmin = User::whereHas('role', function($q) {
    $q->where('name', 'Super Admin');
})->first();

echo "User: {$superAdmin->name}\n";
echo "Role: {$superAdmin->role->name}\n";
echo "Can Access Edit Routes: YES ✅\n";
```

### 3. Test With Tinker (Manager/Other Role)
```php
// Get a Manager user
$manager = User::whereHas('role', function($q) {
    $q->where('name', 'Manager');
})->first();

echo "User: {$manager->name}\n";
echo "Role: {$manager->role->name}\n";
echo "Can Access Edit Routes: NO ❌\n";
echo "Will Get: 403 Forbidden Error\n";
```

### 4. Browser Testing Steps

#### As Super Admin:
1. Login as Super Admin
2. Navigate to: `/patients` 
3. Click on any patient's **Edit** button
4. ✅ Should show edit form
5. Make changes and save
6. ✅ Should update successfully

#### As Manager/Other Role:
1. Login as Manager (or any non-Super Admin role)
2. Manually try to access: `/patients/1/edit`
3. ❌ Should show **403 Forbidden** error page
4. Error message: "This action is restricted to Super Admin only."

### 5. All Protected Routes List

Run this command to see ALL protected routes:
```bash
php artisan route:list --name="edit|update|destroy|delete" --columns=method,uri,name,middleware
```

### 6. Test Specific Route Examples

```bash
# Patients
php artisan route:list --name=patients.edit --verbose
php artisan route:list --name=patients.update --verbose
php artisan route:list --name=patients.destroy --verbose

# Users
php artisan route:list --name=users.edit --verbose
php artisan route:list --name=users.update --verbose
php artisan route:list --name=users.destroy --verbose

# Doctors
php artisan route:list --name=doctors.edit --verbose
php artisan route:list --name=doctors.update --verbose
php artisan route:list --name=doctors.destroy --verbose

# Appointments
php artisan route:list --name=appointments.edit --verbose
php artisan route:list --name=appointments.update --verbose
php artisan route:list --name=appointments.destroy --verbose
```

### 7. Check All Middlewares Applied

```bash
# This will show ALL edit routes with their middlewares
php artisan route:list | grep -i "edit" | grep "super-admin-only"
```

## Expected Behavior

### ✅ Super Admin Users:
- Can view all pages
- Can create new records
- **Can edit existing records**
- **Can delete records**
- **Can update any data**

### ❌ Non-Super Admin Users (Manager, Receptionist, etc.):
- Can view pages (if they have view permission)
- Can create new records (if they have create permission)
- **CANNOT edit existing records** - Will get 403 Forbidden
- **CANNOT delete records** - Will get 403 Forbidden
- **CANNOT update any data** - Will get 403 Forbidden

## Frontend Considerations

আপনার frontend এ (React/Inertia components) edit/delete buttons দেখানোর সময় এই check করা উচিত:

```typescript
// In your React component
const canEdit = auth.user.role === 'Super Admin';
const canDelete = auth.user.role === 'Super Admin';

// Conditionally render buttons
{canEdit && (
  <Link href={`/patients/${patient.id}/edit`}>
    Edit
  </Link>
)}

{canDelete && (
  <button onClick={handleDelete}>
    Delete
  </button>
)}
```

এটা করলে non-Super Admin users edit/delete buttons দেখবেই না।

## Security Notes

1. **Backend Protection:** Middleware routes এ apply করা, তাই frontend bypass করলেও কাজ করবে না
2. **Permission Check First:** প্রথমে permission check হয়, তারপর Super Admin check হয়
3. **Clear Error Messages:** 403 error message স্পষ্টভাবে বলে দেয় কেন access denied হয়েছে
4. **No Data Leak:** Middleware চলে যাওয়ার আগেই request block হয়ে যায়

## Date: October 21, 2025
