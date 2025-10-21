# Dashboard Priority Order Fix

## Problem Identified

**Issue:** Super Admin and users with multiple dashboard permissions were being redirected to the wrong dashboard.

**Root Cause:** The permission check priority order was incorrect. The system was checking for specific role permissions (like `dashboard.optics-seller`) BEFORE checking for Super Admin permission (`admin.dashboard` or `*`).

### What Was Happening:

```
1. Check Optics Seller permission ❌ (checked first)
2. Check Medicine Seller permission
3. Check Refractionist permission
4. Check Doctor permission
5. Check Receptionist permission
6. Check Super Admin permission ❌ (checked LAST)
```

**Result:** 
- Super Admin (who has ALL permissions including `dashboard.optics-seller`) would match on step 1
- Super Admin would be redirected to Optics Seller Dashboard ❌
- Manager with `dashboard.doctor` would also go to wrong dashboard if they had multiple permissions

## Solution

**Correct Priority Order:** Check Super Admin FIRST, then specific roles.

```
1. Check Super Admin permission ✅ (check FIRST)
2. Check Doctor permission
3. Check Receptionist permission
4. Check Refractionist permission
5. Check Medicine Seller permission
6. Check Optics Seller permission ✅ (check LAST)
```

**Logic:**
- If user has `*` (wildcard) or `admin.dashboard` → Admin Dashboard
- Else if user has `dashboard.doctor` → Doctor Dashboard
- Else if user has `dashboard.receptionist` → Receptionist Dashboard
- And so on...

## Files Updated

### 1. `resources/js/layouts/admin-layout.tsx`
**Function:** `getDashboardRoute()`

**Changed Priority Order:**
```typescript
// BEFORE (WRONG):
if (hasPermission('dashboard.optics-seller')) { ... }  // ❌ Checked first
// ... other checks ...
if (hasPermission('admin.dashboard') || userPermissions.includes('*')) { ... } // ❌ Checked last

// AFTER (CORRECT):
if (hasPermission('admin.dashboard') || userPermissions.includes('*')) { ... } // ✅ Checked first
// ... other checks ...
if (hasPermission('dashboard.optics-seller')) { ... }  // ✅ Checked last
```

### 2. `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
**Function:** `getDashboardRoute()`

**Changed Priority Order:**
```php
// BEFORE (WRONG):
if (in_array('dashboard.optics-seller', $permissions)) { ... }  // ❌ Checked first
// ... other checks ...
if ($hasSuperAdminPermission || in_array('admin.dashboard', $permissions)) { ... } // ❌ Checked last

// AFTER (CORRECT):
if ($hasSuperAdminPermission || in_array('admin.dashboard', $permissions)) { ... } // ✅ Checked first
// ... other checks ...
if (in_array('dashboard.optics-seller', $permissions)) { ... }  // ✅ Checked last
```

### 3. `routes/web.php` (Home Route `/`)
**Changed Priority Order:**
```php
// BEFORE (WRONG):
if (in_array('dashboard.optics-seller', $permissions)) { ... }  // ❌ Checked first

// AFTER (CORRECT):
if ($hasSuperAdminPermission || in_array('admin.dashboard', $permissions)) { ... } // ✅ Checked first
```

## Why This Order?

### Logical Reasoning:

1. **Super Admin = Highest Authority**
   - Super Admin should ALWAYS see the comprehensive Admin Dashboard
   - Super Admin has ALL permissions, so they will match ANY permission check
   - Therefore, Super Admin check MUST come first

2. **Specific Roles = Lower Priority**
   - Specific roles (Doctor, Receptionist, etc.) have LIMITED permissions
   - They will only match their specific permission
   - Safe to check after Super Admin

3. **Multiple Permissions Scenario**
   - If a user has both `admin.dashboard` AND `dashboard.doctor`:
     - They should see Admin Dashboard (higher authority)
   - If a user has both `dashboard.doctor` AND `dashboard.receptionist`:
     - They should see Doctor Dashboard (checked first in the order)

### Priority Hierarchy:

```
High Priority (Check First)
↓
1. Super Admin (admin.dashboard or *)
2. Doctor (dashboard.doctor)
3. Receptionist (dashboard.receptionist)
4. Refractionist (dashboard.refractionist)
5. Medicine Seller (dashboard.medicine-seller)
6. Optics Seller (dashboard.optics-seller)
↓
Low Priority (Check Last)
```

## Testing Scenarios

### ✅ Test Case 1: Super Admin with All Permissions
**Setup:**
- Role: Super Admin
- Permissions: `*` (wildcard - includes all permissions)

**Expected Result:**
- Should see: **Admin Dashboard** ✅
- Should NOT see: Optics Seller Dashboard ❌

**Test:**
```
1. Login as Super Admin
2. Navigate to home (/)
3. Click on Dashboard link
4. Verify: Admin Dashboard is shown
```

### ✅ Test Case 2: Manager with Doctor Permission
**Setup:**
- Role: Manager
- Permissions: `dashboard.doctor` only

**Expected Result:**
- Should see: **Doctor Dashboard** ✅

**Test:**
```
1. Create Manager role
2. Assign dashboard.doctor permission
3. Create user with Manager role
4. Login and verify: Doctor Dashboard is shown
```

### ✅ Test Case 3: User with Multiple Dashboard Permissions
**Setup:**
- Role: Custom Role
- Permissions: `dashboard.doctor`, `dashboard.receptionist`, `dashboard.optics-seller`

**Expected Result:**
- Should see: **Doctor Dashboard** ✅ (highest in priority after admin)

**Test:**
```
1. Create role with multiple dashboard permissions
2. Login and verify: Doctor Dashboard is shown (not Optics Seller)
```

### ✅ Test Case 4: Optics Seller Only
**Setup:**
- Role: Optics Seller
- Permissions: `dashboard.optics-seller` only

**Expected Result:**
- Should see: **Optics Seller Dashboard** ✅

**Test:**
```
1. Login as Optics Seller
2. Verify: Optics Seller Dashboard is shown
```

## Common Mistakes to Avoid

### ❌ WRONG: Checking specific roles before admin
```typescript
if (hasPermission('dashboard.doctor')) return 'doctor.dashboard';
if (hasPermission('admin.dashboard')) return 'dashboard';
```
**Problem:** Admin with `admin.dashboard` + `dashboard.doctor` will go to Doctor Dashboard

### ✅ CORRECT: Check admin first
```typescript
if (hasPermission('admin.dashboard')) return 'dashboard';
if (hasPermission('dashboard.doctor')) return 'doctor.dashboard';
```
**Result:** Admin always goes to Admin Dashboard

## Key Takeaways

1. **Always check higher authority permissions FIRST**
2. **Super Admin (wildcard `*`) matches ALL permissions**
3. **Priority order matters when users have multiple permissions**
4. **The FIRST matching permission check determines the dashboard**
5. **Test with users having multiple permissions to verify priority**

## Verification Commands

```bash
# Check user permissions
php artisan tinker
>>> $user = \App\Models\User::find(1);
>>> $permissions = $user->role->permissions->pluck('name')->toArray();
>>> print_r($permissions);

# Check if user is Super Admin
>>> in_array('*', $permissions);

# Test dashboard routing
>>> app('App\Http\Controllers\Auth\AuthenticatedSessionController')->getDashboardRoute();
```

---

**Issue:** Dashboard Priority Order
**Status:** ✅ FIXED
**Date:** October 21, 2025
**Impact:** Critical - Affects all users with multiple dashboard permissions
**Solution:** Reorder permission checks to prioritize Super Admin first
