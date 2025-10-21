# Dashboard Permission-Based Routing Fix

## Problem
Previously, the system was redirecting users to different dashboards based on their **role name** (e.g., "Super Admin", "Receptionist", etc.). This caused issues when:
- New roles were created with similar permissions (e.g., "Manager" role with receptionist permissions)
- Users with custom roles couldn't access the correct dashboard
- The Admin Dashboard was accessible to users who shouldn't see it

## Solution
Changed the routing system from **role-based** to **permission-based** routing.

## Changes Made

### 1. AuthenticatedSessionController (`app/Http/Controllers/Auth/AuthenticatedSessionController.php`)
- Updated `getDashboardRoute()` method to check **permissions** instead of role names
- Added permission checks in **CORRECT** priority order:
  1. `admin.dashboard` or `*` (wildcard) - **HIGHEST PRIORITY**
  2. `dashboard.doctor`
  3. `dashboard.receptionist`
  4. `dashboard.refractionist`
  5. `dashboard.medicine-seller`
  6. `dashboard.optics-seller`
  
**IMPORTANT:** Super Admin check MUST come first! Otherwise, Super Admin (who has all permissions) will be redirected to the first dashboard check (like Optics Seller).

### 2. Routes (`routes/web.php`)
- Added `permission:admin.dashboard` middleware to the main admin dashboard route
- Updated home route (`/`) to use permission-based routing instead of role names
- Now only users with `admin.dashboard` permission (or wildcard `*`) can access the Super Admin dashboard

### 3. Permission Seeder (`database/seeders/PermissionSeeder.php`)
- Added new permission: `admin.dashboard`
  - Display Name: "View Admin Dashboard"
  - Category: "dashboard"
  - Description: "Can access Super Admin dashboard (comprehensive overview)"

### 4. Admin Layout (`resources/js/layouts/admin-layout.tsx`)
- Simplified Quick Action buttons
- Now shows only relevant actions for each role:
  - **Super Admin**: Add Patient, Add User (most frequently used)
  - **Receptionist**: Add Patient, Book Test
  - **Doctor**: New Prescription
  - **Refractionist**: Vision Test
  - **Medicine Seller**: Quick Sale
  - **Optics Seller**: Optics Sale

## How It Works Now

### User Login Flow
1. User logs in
2. System loads user's permissions from their role
3. System checks permissions in priority order
4. User is redirected to the appropriate dashboard based on their permissions

### Dashboard Access Control
- **Admin Dashboard** (`/dashboard`): Only users with `admin.dashboard` permission or wildcard `*`
- **Receptionist Dashboard** (`/receptionist/dashboard`): Users with `dashboard.receptionist` permission
- **Doctor Dashboard** (`/doctor/dashboard`): Users with `dashboard.doctor` permission
- **Refractionist Dashboard** (`/refractionist/dashboard`): Users with `dashboard.refractionist` permission
- **Medicine Seller Dashboard** (`/medicine-seller/dashboard`): Users with `dashboard.medicine-seller` permission
- **Optics Seller Dashboard** (`/optics-seller/dashboard`): Users with `dashboard.optics-seller` permission

## Benefits

### 1. Flexibility
- Create custom roles with any combination of permissions
- No need to hardcode role names
- Example: Create a "Manager" role with `dashboard.receptionist` permission → they get receptionist dashboard

### 2. Security
- Admin Dashboard is now protected by permission check
- Only Super Admin (with `*` or `admin.dashboard` permission) can access it
- Other users are redirected to their appropriate dashboard

### 3. Maintainability
- No need to update routing logic when adding new roles
- Just assign the correct dashboard permission to the role
- Permission-based system is more scalable

## Migration Steps

### For Existing Installation:
1. Run the permission seeder to add the new `admin.dashboard` permission:
   ```bash
   php artisan db:seed --class=PermissionSeeder
   ```

2. Ensure Super Admin role has the wildcard `*` permission or explicitly assign `admin.dashboard` permission

3. For custom roles (like "Manager"):
   - Assign the appropriate dashboard permission (e.g., `dashboard.receptionist`)
   - User will automatically be redirected to the correct dashboard

### For New Installation:
- Everything is automatically set up when running seeders

## Testing Checklist

- [ ] Super Admin can access Admin Dashboard
- [ ] Receptionist can access Receptionist Dashboard
- [ ] Doctor can access Doctor Dashboard
- [ ] Refractionist can access Refractionist Dashboard
- [ ] Medicine Seller can access Medicine Seller Dashboard
- [ ] Optics Seller can access Optics Seller Dashboard
- [ ] Custom role (e.g., "Manager" with receptionist permission) accesses correct dashboard
- [ ] Users without appropriate permissions cannot access Admin Dashboard
- [ ] Quick Action buttons show only relevant actions for each role

## Permission List for Dashboard Access

| Dashboard | Required Permission |
|-----------|-------------------|
| Admin Dashboard | `admin.dashboard` or `*` (wildcard) |
| Receptionist Dashboard | `dashboard.receptionist` |
| Doctor Dashboard | `dashboard.doctor` |
| Refractionist Dashboard | `dashboard.refractionist` |
| Medicine Seller Dashboard | `dashboard.medicine-seller` |
| Optics Seller Dashboard | `dashboard.optics-seller` |

## Notes

- The wildcard permission `*` (assigned to Super Admin) grants access to ALL dashboards
- Dashboard permissions are separate from feature permissions (e.g., `patients.view`, `appointments.create`)
- If a user has multiple dashboard permissions, they will be redirected based on the priority order in `AuthenticatedSessionController`
- The priority order ensures that more specific roles are handled first (e.g., seller roles before admin)

## Example Scenarios

### Scenario 1: Manager Role
- Create "Manager" role
- Assign `dashboard.receptionist` permission
- Result: Manager sees Receptionist Dashboard

### Scenario 2: Assistant Doctor
- Create "Assistant Doctor" role
- Assign `dashboard.doctor` permission
- Result: Assistant Doctor sees Doctor Dashboard

### Scenario 3: Head Receptionist
- Create "Head Receptionist" role
- Assign both `dashboard.receptionist` AND `admin.dashboard` permissions
- Result: Head Receptionist sees Admin Dashboard (higher priority)

---

**Last Updated:** October 21, 2025
**Author:** System Administrator
