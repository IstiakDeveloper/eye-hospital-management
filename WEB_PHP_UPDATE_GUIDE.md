# Web.php Update Guide - Permission Middleware Implementation

## Overview
এই গাইড দেখাবে কিভাবে web.php তে permission middleware apply করতে হবে।

## Current Middleware vs Permission Middleware

### Before (Role-based)
```php
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('receptionist');
```

### After (Permission-based)
```php
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('permission:patients.create');
```

## Recommended Updates for web.php

### 1. Patient Routes
```php
// Current - Keep for backward compatibility
Route::get('/patients/create', [PatientController::class, 'create'])
    ->name('patients.create')
    ->middleware('receptionist'); // OR replace with: ->middleware('permission:patients.create')

Route::post('/patients', [PatientController::class, 'store'])
    ->name('patients.store')
    ->middleware('receptionist'); // OR: ->middleware('permission:patients.create')

Route::get('/patients/{patient}/edit', [PatientController::class, 'edit'])
    ->name('patients.edit')
    ->middleware('receptionist'); // OR: ->middleware('permission:patients.edit')

Route::put('/patients/{patient}', [PatientController::class, 'update'])
    ->name('patients.update')
    ->middleware('receptionist'); // OR: ->middleware('permission:patients.edit')

Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])
    ->name('patients.destroy')
    ->middleware('receptionist'); // OR: ->middleware('permission:patients.delete')
```

### 2. Vision Test Routes (Refractionist)
```php
Route::middleware(['auth', 'permission:vision-tests.create'])->group(function () {
    Route::get('/patients/{patient}/vision-tests/create', [VisionTestController::class, 'create'])
        ->name('visiontests.create');
    Route::post('/patients/{patient}/vision-tests', [VisionTestController::class, 'store'])
        ->name('visiontests.store');
});

Route::middleware(['auth', 'permission:vision-tests.edit'])->group(function () {
    Route::get('/vision-tests/{visiontest}/edit', [VisionTestController::class, 'edit'])
        ->name('visiontests.edit');
    Route::put('/vision-tests/{visiontest}', [VisionTestController::class, 'update'])
        ->name('visiontests.update');
});
```

### 3. Prescription Routes (Doctor)
```php
Route::middleware(['auth', 'permission:prescriptions.create'])->group(function () {
    Route::get('/patients/{patient}/prescriptions/create', [PrescriptionController::class, 'create'])
        ->name('prescriptions.create.patient');
    Route::post('/patients/{patient}/prescriptions', [PrescriptionController::class, 'store'])
        ->name('prescriptions.store');
});

Route::middleware(['auth', 'permission:prescriptions.edit'])->group(function () {
    Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])
        ->name('prescriptions.edit');
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])
        ->name('prescriptions.update');
});
```

### 4. Super Admin Routes
```php
// Option 1: Keep super-admin middleware (recommended for now)
Route::middleware(['super-admin'])->group(function () {
    Route::resource('users', UserController::class);
    Route::resource('doctors', DoctorController::class);
    Route::resource('medicines', MedicineController::class);
});

// Option 2: Use specific permissions
Route::middleware(['permission:users.view'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
});

Route::middleware(['permission:users.create'])->group(function () {
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
});
```

### 5. Medicine Corner Routes
```php
Route::prefix('medicine-corner')
    ->middleware(['auth', 'super-admin']) // Keep this for now
    ->name('medicine-corner.')
    ->group(function () {
        // Main pages - could add permission checks
        Route::get('/stock', [MedicineCornerController::class, 'stock'])
            ->name('stock'); // ->middleware('permission:medicine-corner.stock')

        Route::get('/sales', [MedicineCornerController::class, 'sales'])
            ->name('sales'); // ->middleware('permission:medicine-corner.sales')

        Route::get('/purchase', [MedicineCornerController::class, 'purchase'])
            ->name('purchase'); // ->middleware('permission:medicine-corner.purchase')
    });
```

### 6. Medicine Seller Routes
```php
Route::prefix('medicine-seller')
    ->middleware(['auth'])
    ->group(function () {
        Route::get('/pos', [MedicineSellerDashboardController::class, 'pos'])
            ->name('medicine-seller.pos')
            ->middleware('permission:medicine-seller.pos');

        Route::post('/pos/sale', [MedicineSellerDashboardController::class, 'processSale'])
            ->name('medicine-seller.process-sale')
            ->middleware('permission:medicine-seller.pos');
    });
```

### 7. Optics Seller Routes
```php
Route::prefix('optics-seller')
    ->middleware(['auth'])
    ->group(function () {
        Route::get('/pos', [OpticsSellerDashboardController::class, 'pos'])
            ->name('optics-seller.pos')
            ->middleware('permission:optics-seller.pos');

        Route::post('/pos/sale', [OpticsSellerDashboardController::class, 'processSale'])
            ->name('optics-seller.process-sale')
            ->middleware('permission:optics-seller.pos');
    });
```

### 8. Account Routes
```php
Route::middleware(['auth', 'super-admin'])->group(function () {
    Route::prefix('hospital-account')->name('hospital-account.')->group(function () {
        Route::get('/', [HospitalAccountController::class, 'index'])
            ->name('dashboard'); // ->middleware('permission:hospital-account.view')

        Route::post('/fund-in', [HospitalAccountController::class, 'fundIn'])
            ->name('fund-in'); // ->middleware('permission:hospital-account.fund-in')

        Route::post('/expense', [HospitalAccountController::class, 'addExpense'])
            ->name('expense'); // ->middleware('permission:hospital-account.expense')
    });
});
```

### 9. Medical Test Routes
```php
Route::prefix('medical-tests')->name('medical-tests.')->middleware(['auth'])->group(function () {

    // Test Master Management (Super Admin Only)
    Route::middleware(['permission:medical-tests.manage-tests'])->group(function () {
        Route::get('/tests', [MedicalTestController::class, 'testIndex'])->name('tests.index');
        Route::post('/tests', [MedicalTestController::class, 'storeTest'])->name('tests.store');
        Route::put('/tests/{test}', [MedicalTestController::class, 'updateTest'])->name('tests.update');
        Route::delete('/tests/{test}', [MedicalTestController::class, 'destroyTest'])->name('tests.destroy');
    });

    // Patient Test Booking
    Route::middleware(['permission:medical-tests.create'])->group(function () {
        Route::get('/create', [MedicalTestController::class, 'create'])->name('create');
        Route::post('/', [MedicalTestController::class, 'store'])->name('store');
    });

    // Payment Management
    Route::middleware(['permission:medical-tests.payment'])->group(function () {
        Route::post('/{testGroup}/add-payment', [MedicalTestController::class, 'addPayment'])
            ->name('add-payment');
    });

    // Result Management
    Route::middleware(['permission:medical-tests.results'])->group(function () {
        Route::put('/test/{test}/result', [MedicalTestController::class, 'updateResult'])
            ->name('update-result');
    });
});
```

### 10. Reports Routes
```php
Route::middleware(['auth'])->prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])
        ->name('index')
        ->middleware('permission:reports.view');

    Route::get('/patients', [ReportController::class, 'patients'])
        ->name('patients')
        ->middleware('permission:reports.patients');

    Route::get('/doctors', [ReportController::class, 'doctors'])
        ->name('doctors')
        ->middleware('permission:reports.doctors');

    Route::get('/revenue', [ReportController::class, 'revenue'])
        ->name('revenue')
        ->middleware('permission:reports.revenue');
});
```

## Migration Strategy

### Phase 1: Keep Both (Recommended)
বর্তমানে role-based middleware রাখুন এবং নতুন permission system parallel চালান:

```php
// Both middleware work together
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('receptionist') // Existing
    ->middleware('permission:patients.create'); // New (optional)
```

### Phase 2: Gradual Migration
একটা একটা করে route update করুন:

```php
// Step 1: Test with one route
Route::get('/patients/create', [PatientController::class, 'create'])
    ->middleware('permission:patients.create');

// Step 2: If works well, update more routes
```

### Phase 3: Complete Replacement
সব test successful হলে পুরো replace করুন।

## Testing Checklist

পরিবর্তন করার পর এই জিনিসগুলো test করুন:

- [ ] Super Admin সব route access করতে পারছে
- [ ] Receptionist শুধু তার permission অনুযায়ী access পাচ্ছে
- [ ] Doctor শুধু তার permission অনুযায়ী access পাচ্ছে
- [ ] Refractionist শুধু vision test এ access পাচ্ছে
- [ ] Medicine Seller শুধু medicine POS access পাচ্ছে
- [ ] Optics Seller শুধু optics POS access পাচ্ছে
- [ ] Unauthorized access 403 error দিচ্ছে

## Important Notes

1. **Don't Remove Existing Middleware Yet**: বর্তমান middleware রাখুন, শুধু comment করতে পারেন
2. **Test Thoroughly**: প্রতিটি role দিয়ে সব feature test করুন
3. **Super Admin Bypass**: Super Admin সবসময় সব permission পায়
4. **Database Must Be Seeded**: Permission seeder অবশ্যই run করতে হবে

## Commands to Run

```bash
# 1. Run migrations
php artisan migrate

# 2. Seed permissions
php artisan db:seed --class=PermissionSeeder

# 3. Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 4. Test
php artisan route:list | grep permission
```
