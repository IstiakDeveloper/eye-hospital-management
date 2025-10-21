# Permission Names Correction

## Issue Found
The permission names were inconsistent between the database and the code checking them.

## Correct Permission Names (As defined in PermissionSeeder)

### Dashboard Permissions:
- ✅ `admin.dashboard` - Super Admin Dashboard
- ✅ `dashboard.receptionist` - Receptionist Dashboard
- ✅ `dashboard.doctor` - Doctor Dashboard
- ✅ `dashboard.refractionist` - Refractionist Dashboard
- ✅ `dashboard.medicine-seller` - Medicine Seller Dashboard
- ✅ `dashboard.optics-seller` - Optics Seller Dashboard

## Files Updated

### 1. `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
**Changed From:**
- `optics-seller.dashboard` → `dashboard.optics-seller`
- `medicine-seller.dashboard` → `dashboard.medicine-seller`
- `refractionist.dashboard` → `dashboard.refractionist`
- `doctor.dashboard` → `dashboard.doctor`
- `receptionist.dashboard` → `dashboard.receptionist`

### 2. `routes/web.php` (Home route `/`)
**Changed From:**
- `optics-seller.dashboard` → `dashboard.optics-seller`
- `medicine-seller.dashboard` → `dashboard.medicine-seller`
- `refractionist.dashboard` → `dashboard.refractionist`
- `doctor.dashboard` → `dashboard.doctor`
- `receptionist.dashboard` → `dashboard.receptionist`

### 3. `resources/js/layouts/admin-layout.tsx`
**Changed From:**
- `optics-seller.dashboard` → `dashboard.optics-seller`
- `medicine-seller.dashboard` → `dashboard.medicine-seller`
- `refractionist.dashboard` → `dashboard.refractionist`
- `doctor.dashboard` → `dashboard.doctor`
- `receptionist.dashboard` → `dashboard.receptionist`

## Verification Checklist

After these changes, verify:

- [ ] Super Admin can access Admin Dashboard (`/dashboard`)
- [ ] Receptionist with `dashboard.receptionist` permission sees Receptionist Dashboard
- [ ] Doctor with `dashboard.doctor` permission sees Doctor Dashboard
- [ ] Refractionist with `dashboard.refractionist` permission sees Refractionist Dashboard
- [ ] Medicine Seller with `dashboard.medicine-seller` permission sees Medicine Seller Dashboard
- [ ] Optics Seller with `dashboard.optics-seller` permission sees Optics Seller Dashboard
- [ ] Manager role with `dashboard.receptionist` permission sees Receptionist Dashboard (not Admin Dashboard)
- [ ] Users without appropriate permissions cannot access Admin Dashboard

## Testing Steps

1. **Create a Manager Role:**
   ```sql
   INSERT INTO roles (name, display_name, description) VALUES ('Manager', 'Manager', 'Store Manager');
   ```

2. **Assign Receptionist Dashboard Permission:**
   ```sql
   -- Get role and permission IDs
   SET @manager_role_id = (SELECT id FROM roles WHERE name = 'Manager');
   SET @receptionist_dashboard_permission_id = (SELECT id FROM permissions WHERE name = 'dashboard.receptionist');
   
   -- Assign permission to role
   INSERT INTO permission_role (permission_id, role_id) 
   VALUES (@receptionist_dashboard_permission_id, @manager_role_id);
   ```

3. **Create a Manager User and Login:**
   - Create user with Manager role
   - Login with that user
   - Verify: Should see **Receptionist Dashboard**, NOT Admin Dashboard

4. **Test Super Admin:**
   - Login as Super Admin
   - Verify: Should see **Admin Dashboard** with all statistics

## Important Notes

### Permission Naming Convention:
- Dashboard permissions use format: `dashboard.{role-slug}`
- Route names use format: `{role-slug}.dashboard`
- This allows for clear separation between permission names and route names

### Why This Format?
- **Permissions** are grouped by category (e.g., `dashboard.*`, `patients.*`, `visits.*`)
- **Routes** are grouped by role/module (e.g., `receptionist.*`, `doctor.*`)
- This makes it easier to manage and understand permissions in the admin panel

### Backend Route Middleware (Already Correct):
```php
// routes/web.php
Route::middleware(['permission:admin.dashboard'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['permission:dashboard.receptionist'])->prefix('receptionist')->name('receptionist.')->group(function () {
    Route::get('/dashboard', [ReceptionistDashboardController::class, 'index'])->name('dashboard');
});

Route::middleware(['permission:dashboard.doctor'])->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');
});

// etc...
```

## Summary

All dashboard routing is now **100% permission-based**:

1. **Login:** System checks user's permissions and redirects to appropriate dashboard
2. **Navigation:** Dashboard link uses permission check to determine correct route
3. **Access Control:** Each dashboard route has permission middleware protection
4. **Role Independence:** Creating new roles with existing permissions works automatically

---

**Last Updated:** October 21, 2025
**Status:** ✅ All files updated and synchronized
