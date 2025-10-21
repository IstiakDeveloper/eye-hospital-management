# Route Security Documentation

## Overview
এই document এ দেখানো হয়েছে কিভাবে সকল Edit এবং Delete routes শুধুমাত্র **Super Admin** এর জন্য সীমাবদ্ধ করা হয়েছে।

## Changes Made

### 1. Created SuperAdminOnly Middleware
**Location:** `app/Http/Middleware/SuperAdminOnly.php`

এই middleware check করে:
1. User authenticated কিনা
2. User এর role **Super Admin** কিনা
3. যদি না হয়, তাহলে **403 Forbidden** error দেয়

### 2. Registered Middleware
**Location:** `bootstrap/app.php`
- Added `SuperAdminOnly::class` import
- Registered as `'super-admin-only'` alias in middleware array

### 3. Fixed ProfileController Import
**Location:** `routes/web.php`
- Changed from `use App\Http\Controllers\ProfileController;`
- To: `use App\Http\Controllers\Settings\ProfileController;`

## Verification

Test করার জন্য কমান্ড:
```bash
# Check একটা specific route
php artisan route:list --name=patients.edit --verbose

# Output দেখাবে:
# ⇂ web
# ⇂ auth
# ⇂ permission:patients.edit
# ⇂ super-admin-only    ✅

# Check all user management routes
php artisan route:list --name=users --verbose
```

## Protected Routes

### 1. Patients Management
- ✅ `GET /patients/{patient}/edit` - Edit form দেখা
- ✅ `PUT /patients/{patient}` - Patient update করা
- ✅ `DELETE /patients/{patient}` - Patient delete করা

### 2. Vision Tests
- ✅ `GET /vision-tests/{visiontest}/edit` - Edit form
- ✅ `PUT /vision-tests/{visiontest}` - Update vision test

### 3. Appointments
- ✅ `GET /appointments/{appointment}/edit` - Edit form
- ✅ `PUT /appointments/{appointment}` - Update appointment
- ✅ `DELETE /appointments/{appointment}` - Delete appointment

### 4. Prescriptions
- ✅ `GET /prescriptions/{prescription}/edit` - Edit form
- ✅ `PUT /prescriptions/{prescription}` - Update prescription

### 5. Roles & Permissions Management
- ✅ `GET /roles/{role}/edit` - Edit role
- ✅ `PUT /roles/{role}` - Update role
- ✅ `DELETE /roles/{role}` - Delete role
- ✅ `GET /permissions/{permission}/edit` - Edit permission
- ✅ `PUT /permissions/{permission}` - Update permission
- ✅ `DELETE /permissions/{permission}` - Delete permission

### 6. User Management
- ✅ `GET /users/{user}/edit` - Edit user
- ✅ `PUT /users/{user}` - Update user
- ✅ `PATCH /users/{user}/toggle-status` - Toggle user status
- ✅ `DELETE /users/{user}` - Delete user

### 7. Doctors Management
- ✅ `GET /doctors/{doctor}/edit` - Edit doctor
- ✅ `PUT /doctors/{doctor}` - Update doctor
- ✅ `PUT /doctors/{doctor}/availability` - Update availability
- ✅ `PUT /doctors/{doctor}/toggle-status` - Toggle status
- ✅ `DELETE /doctors/{doctor}` - Delete doctor

### 8. Medicines Management
- ✅ `GET /medicines/{medicine}/edit` - Edit medicine
- ✅ `PUT /medicines/{medicine}` - Update medicine
- ✅ `PUT /medicines/{medicine}/toggle-status` - Toggle status
- ✅ `POST /medicines/bulk-action` - Bulk actions
- ✅ `DELETE /medicines/{medicine}` - Delete medicine

### 9. Patient Visits
- ✅ `GET /visits/{visit}/edit` - Edit visit
- ✅ `PUT /visits/{visit}` - Update visit
- ✅ `PATCH /visits/{visit}/status` - Update status
- ✅ `DELETE /visits/{visit}` - Delete visit

### 10. Medicine Corner
- ✅ `GET /medicine-corner/stock/{id}/edit` - Edit stock
- ✅ `PUT /medicine-corner/stock/{id}` - Update stock
- ✅ `PUT /medicine-corner/medicines/{medicine}` - Update medicine
- ✅ `PUT /medicine-corner/medicines/{medicine}/stock-alert` - Update alert
- ✅ `GET /medicine-corner/sales/{sale}/edit` - Edit sale
- ✅ `PUT /medicine-corner/sales/{sale}` - Update sale
- ✅ `PUT /medicine-corner/sales/{sale}/payment` - Update payment
- ✅ `DELETE /medicine-corner/sales/{sale}` - Delete sale
- ✅ `POST /medicine-corner/sales/bulk-action` - Bulk actions

### 11. Medicine Vendors
- ✅ `PUT /medicine-vendors/{vendor}` - Update vendor

### 12. Hospital Account
- ✅ `GET /hospital-account/transactions/{transaction}/edit` - Edit transaction
- ✅ `PUT /hospital-account/transactions/{transaction}` - Update transaction
- ✅ `DELETE /hospital-account/transactions/{transaction}` - Delete transaction
- ✅ `GET /hospital-account/fund-transactions/{fundTransaction}/edit` - Edit fund transaction
- ✅ `PUT /hospital-account/fund-transactions/{fundTransaction}` - Update fund transaction
- ✅ `DELETE /hospital-account/fund-transactions/{fundTransaction}` - Delete fund transaction
- ✅ `PUT /hospital-account/categories/{category}` - Update category

### 13. Medicine Account
- ✅ `PUT /medicine-account/categories/{category}` - Update category

### 14. Optics Account
- ✅ `PUT /optics-account/categories/{category}` - Update category

### 15. Optics Corner
- ✅ `GET /optics/frames/{frame}/edit` - Edit frame
- ✅ `PUT /optics/frames/{frame}` - Update frame
- ✅ `PATCH /optics/frames/{frame}/toggle-status` - Toggle frame status
- ✅ `DELETE /optics/frames/{frame}` - Delete frame
- ✅ `GET /optics/stock/{movement}/edit` - Edit stock
- ✅ `PUT /optics/stock/{movement}` - Update stock
- ✅ `DELETE /optics/stock/{movement}` - Delete stock
- ✅ `GET /optics/vendors/{vendor}/edit` - Edit vendor
- ✅ `PUT /optics/vendors/{vendor}` - Update vendor

### 16. Medical Tests
- ✅ `GET /medical-tests/tests` - Test master list (view)
- ✅ `POST /medical-tests/tests` - Create test master
- ✅ `PUT /medical-tests/tests/{test}` - Update test master
- ✅ `DELETE /medical-tests/tests/{test}` - Delete test master
- ✅ `DELETE /medical-tests/{testGroup}/cancel` - Cancel test group

## Middleware Application Pattern

সব routes এ এই pattern ব্যবহার করা হয়েছে:

```php
// Edit routes
Route::get('/resource/{id}/edit', [Controller::class, 'edit'])
    ->middleware(['permission:resource.edit', 'super-admin-only']);

// Update routes
Route::put('/resource/{id}', [Controller::class, 'update'])
    ->middleware(['permission:resource.edit', 'super-admin-only']);

// Delete routes
Route::delete('/resource/{id}', [Controller::class, 'destroy'])
    ->middleware(['permission:resource.delete', 'super-admin-only']);
```

## Testing

### Test করার জন্য:

1. **Super Admin হিসেবে Login করুন:**
   - Edit/Delete buttons দেখা যাবে
   - Edit/Delete operations কাজ করবে

2. **অন্য Role (Manager, Receptionist, etc.) হিসেবে Login করুন:**
   - Edit/Delete buttons হয়তো দেখা যাবে না (Frontend থেকে hide করা থাকলে)
   - যদি manually route এ access করার চেষ্টা করেন, **403 Forbidden** error দেখাবে

### Manual Testing Commands:

```bash
# Test with different users
php artisan tinker

# Check user role
$user = User::find(1);
echo $user->role->name;

# Try to access protected route (will fail for non-Super Admin)
```

## Security Features

1. **Dual Layer Protection:**
   - Permission middleware check করে user এর permission আছে কিনা
   - Super Admin middleware check করে user Super Admin কিনা

2. **403 Forbidden Response:**
   - Non-Super Admin users যদি protected route এ access করতে চায়, clear error message পায়

3. **Route Level Security:**
   - Frontend bypass করে direct API call করলেও middleware protect করবে

## Notes

- **View/Read permissions** সকল authorized users এর জন্য available
- **Create permissions** role specific permissions অনুযায়ী কাজ করে
- **Edit/Delete/Update** শুধুমাত্র Super Admin করতে পারবে
- Status updates (toggle, mark complete) permissions অনুযায়ী কাজ করে, Super Admin only নয়

## Date: October 21, 2025
