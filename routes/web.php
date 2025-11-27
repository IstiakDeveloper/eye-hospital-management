<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AppointmentDisplayController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\HospitalAccount\HospitalAccountController;
use App\Http\Controllers\HospitalAccount\AdvanceHouseRentController;
use App\Http\Controllers\HospitalAccount\FixedAssetController;
use App\Http\Controllers\HospitalAccount\FixedAssetVendorController;
use App\Http\Controllers\MainAccountController;
use App\Http\Controllers\MedicalTestController;
use App\Http\Controllers\MedicineAccount\MedicineAccountController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\MedicineCornerController;
use App\Http\Controllers\MedicineVendorController; // NEW: Vendor Controller
use App\Http\Controllers\MedicineSellerDashboardController;
use App\Http\Controllers\OpticsAccount\OpticsAccountController;
use App\Http\Controllers\Optics\OpticsCornerController;
use App\Http\Controllers\Optics\OpticsVendorController;
use App\Http\Controllers\Optics\OpticsReportController;
use App\Http\Controllers\Optics\OpticsSellerDashboardController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientVisitController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\ReceptionistDashboardController;
use App\Http\Controllers\RefractionistDashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VisionTestController;
use App\Models\Patient;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    // Check if user is authenticated
    if (!auth()->check()) {
        return redirect()->route('login');
    }

    $user = auth()->user();

    if (!$user || !$user->role) {
        return redirect()->route('dashboard');
    }

    // Load user permissions
    $permissions = $user->role->permissions->pluck('name')->toArray();

    // Check for wildcard permission (Super Admin)
    $hasSuperAdminPermission = in_array('*', $permissions);

    // Permission-based dashboard routing
    // Priority order: Check Admin FIRST, then specific roles

    // 1. Check for Super Admin permission FIRST (wildcard or explicit admin dashboard permission)
    // Super Admin should ALWAYS go to Admin Dashboard
    if ($hasSuperAdminPermission || in_array('admin.dashboard', $permissions)) {
        return redirect()->route('dashboard');
    }

    // 2. Check for Doctor permissions
    if (in_array('dashboard.doctor', $permissions) && Route::has('doctor.dashboard')) {
        return redirect()->route('doctor.dashboard');
    }

    // 3. Check for Receptionist permissions
    if (in_array('dashboard.receptionist', $permissions) && Route::has('receptionist.dashboard')) {
        return redirect()->route('receptionist.dashboard');
    }

    // 4. Check for Refractionist permissions
    if (in_array('dashboard.refractionist', $permissions) && Route::has('refractionist.dashboard')) {
        return redirect()->route('refractionist.dashboard');
    }

    // 5. Check for Medicine Seller permissions
    if (in_array('dashboard.medicine-seller', $permissions) && Route::has('medicine-seller.dashboard')) {
        return redirect()->route('medicine-seller.dashboard');
    }

    // 6. Check for Optics Seller permissions
    if (in_array('dashboard.optics-seller', $permissions) && Route::has('optics-seller.dashboard')) {
        return redirect()->route('optics-seller.dashboard');
    }

    // 7. Fallback to default dashboard if user has any permissions
    return redirect()->route('dashboard');
});

Route::get('/storage-link', function () {
    Artisan::call('storage:link');
    return response()->json(['message' => 'Storage link created successfully.']);
})->name('storage.link');

Route::get('/migrate', function () {
    Artisan::call('migrate');
    return response()->json(['message' => 'Migrations run successfully.']);
})->name('migrate');

Route::middleware(['auth'])->group(function () {
    // Admin Dashboard - Only for Super Admin (with wildcard permission or explicit admin.dashboard permission)
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware('permission:admin.dashboard');

    // Profile - All authenticated users
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Patients - Permission-based access
    Route::get('/patients/search', [PatientController::class, 'search'])->name('patients.search')->middleware('permission:patients.search');
    Route::get('/patients', [PatientController::class, 'index'])->name('patients.index')->middleware('permission:patients.view');
    Route::get('/patients/create', [PatientController::class, 'create'])->name('patients.create')->middleware('permission:patients.create');
    Route::post('/patients', [PatientController::class, 'store'])->name('patients.store')->middleware('permission:patients.create');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('patients.show')->middleware('permission:patients.view');

    Route::get('/patients/{patient}/edit', [PatientController::class, 'edit'])->name('patients.edit')->middleware(['permission:patients.edit', 'super-admin-only']);
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('patients.update')->middleware(['permission:patients.edit', 'super-admin-only']);
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy')->middleware(['permission:patients.delete', 'super-admin-only']);

    Route::post('patients/calculate-costs', [PatientController::class, 'calculateCosts'])->name('patients.calculate-costs')->middleware('permission:patients.create');
    Route::get('patients/{patient}/receipt', [PatientController::class, 'receipt'])->name('patients.receipt')->middleware('permission:patients.receipt');

    Route::get('/patients/{patient}/visits/{visit}/receipt', [PatientController::class, 'visitReceipt'])->name('patients.visit.receipt')->middleware('permission:visits.receipt');

    // Vision Test Routes - Permission-based
    Route::get('/vision-tests', [VisionTestController::class, 'index'])->name('visiontests.index')->middleware('permission:vision-tests.view');
    Route::get('/vision-tests/{visiontest}', [VisionTestController::class, 'show'])->name('visiontests.show')->middleware('permission:vision-tests.view');
    Route::get('/vision-tests/{visiontest}/print', [VisionTestController::class, 'print'])->name('visiontests.print')->middleware('permission:vision-tests.print');
    Route::get('/visiontests/{patient}/download-blank', [VisionTestController::class, 'downloadBlankReport'])->name('visiontests.download-blank');

    // Refractionist - Vision Test CRUD
    Route::middleware(['permission:vision-tests.create'])->group(function () {
        Route::get('/patients/{patient}/vision-tests/create', [VisionTestController::class, 'create'])->name('visiontests.create');
        Route::post('/patients/{patient}/vision-tests', [VisionTestController::class, 'store'])->name('visiontests.store');
    });

    Route::middleware(['permission:vision-tests.edit', 'super-admin-only'])->group(function () {
        Route::get('/vision-tests/{visiontest}/edit', [VisionTestController::class, 'edit'])->name('visiontests.edit');
        Route::put('/vision-tests/{visiontest}', [VisionTestController::class, 'update'])->name('visiontests.update');
    });

    // Refractionist Dashboard Routes
    Route::middleware(['permission:dashboard.refractionist'])->prefix('refractionist')->name('refractionist.')->group(function () {
        Route::get('/dashboard', [RefractionistDashboardController::class, 'index'])->name('dashboard');
        Route::post('/start-vision-test/{visit}', [RefractionistDashboardController::class, 'startVisionTest'])->name('start-vision-test');
        Route::post('/mark-priority/{visit}', [RefractionistDashboardController::class, 'markAsPriority'])->name('mark-priority');
        Route::get('/queue-position/{patient}', [RefractionistDashboardController::class, 'getQueuePosition'])->name('queue-position');
        Route::get('/queue-updates', [RefractionistDashboardController::class, 'getQueueUpdates'])->name('queue-updates');
        Route::get('/today-performance', [RefractionistDashboardController::class, 'getTodayPerformance'])->name('today-performance');
        Route::get('/performance', [RefractionistDashboardController::class, 'performanceReport'])->name('performance');
    });

    // Doctor Routes - Permission-based
    Route::middleware(['permission:dashboard.doctor'])->prefix('doctor')->name('doctor.')->group(function () {
        Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/patients/{patient}', [DoctorDashboardController::class, 'viewPatient'])->name('view-patient');
        Route::post('/appointments/{appointment}/complete', [DoctorDashboardController::class, 'completeAppointment'])->name('complete-appointment');
        Route::get('/next-patient', [DoctorDashboardController::class, 'getNextPatient'])->name('next-patient');
        Route::get('/performance-stats', [DoctorDashboardController::class, 'getPerformanceStats'])->name('performance-stats');
        Route::get('/search-patients', [DoctorDashboardController::class, 'searchPatients'])->name('search-patients');
        Route::put('/appointments/{appointment}/status', [DoctorDashboardController::class, 'updateAppointmentStatus'])->name('update-appointment-status');
        Route::get('/vision-tests', [VisionTestController::class, 'index'])->name('vision-tests.index');
        Route::get('/vision-tests/{visiontest}', [VisionTestController::class, 'show'])->name('vision-tests.show');
        Route::get('/vision-tests/{visiontest}/print', [VisionTestController::class, 'print'])->name('vision-tests.print');
    });

    // Appointments - Permission-based
    Route::get('/appointments/today', [AppointmentController::class, 'today'])->name('appointments.today')->middleware('permission:appointments.view');
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index')->middleware('permission:appointments.view');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show')->middleware('permission:appointments.view');
    Route::get('/appointments/{appointment}/print', [AppointmentController::class, 'print'])->name('appointments.print')->middleware('permission:appointments.print');

    Route::middleware(['permission:appointments.create'])->group(function () {
        Route::get('/patients/{patient}/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create.patient');
        Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    });

    Route::middleware(['permission:appointments.edit', 'super-admin-only'])->group(function () {
        Route::get('/appointments/{appointment}/edit', [AppointmentController::class, 'edit'])->name('appointments.edit');
        Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
    });

    Route::put('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status')->middleware('permission:appointments.status');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy')->middleware(['permission:appointments.delete', 'super-admin-only']);

    // Prescriptions - Permission-based
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show'])->name('prescriptions.show')->middleware('permission:prescriptions.view');
    Route::get('/prescriptions/{prescription}/print', [PrescriptionController::class, 'print'])->name('prescriptions.print')->middleware('permission:prescriptions.print');
    Route::get('/prescriptions/{patient}/download-blank', [PrescriptionController::class, 'downloadBlankPrescription'])->name('prescriptions.download-blank');

    Route::middleware(['permission:prescriptions.create'])->group(function () {
        Route::get('/patients/{patient}/prescriptions/create', [PrescriptionController::class, 'create'])->name('prescriptions.create.patient');
        Route::post('/patients/{patient}/prescriptions', [PrescriptionController::class, 'store'])->name('prescriptions.store');
    });

    Route::middleware(['permission:prescriptions.edit', 'super-admin-only'])->group(function () {
        Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit');
        Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update');
    });

    // Super Admin Routes - Permission-based
    // IMPORTANT: Specific routes BEFORE dynamic routes to avoid conflicts

    // Role & Permission Management Routes
    Route::middleware(['permission:roles.view'])->group(function () {
        Route::get('/roles-permissions', [RolePermissionController::class, 'index'])->name('roles.index');
    });

    Route::middleware(['permission:roles.create'])->group(function () {
        Route::get('/roles/create', [RolePermissionController::class, 'createRole'])->name('roles.create');
        Route::post('/roles', [RolePermissionController::class, 'storeRole'])->name('roles.store');
    });

    Route::middleware(['permission:roles.edit', 'super-admin-only'])->group(function () {
        Route::get('/roles/{role}/edit', [RolePermissionController::class, 'editRole'])->name('roles.edit');
        Route::put('/roles/{role}', [RolePermissionController::class, 'updateRole'])->name('roles.update');
    });

    Route::middleware(['permission:roles.delete', 'super-admin-only'])->group(function () {
        Route::delete('/roles/{role}', [RolePermissionController::class, 'destroyRole'])->name('roles.destroy');
    });

    Route::middleware(['permission:roles.assign-permissions'])->group(function () {
        Route::get('/roles/{role}/permissions', [RolePermissionController::class, 'assignPermissions'])->name('roles.assign-permissions');
        Route::post('/roles/{role}/permissions', [RolePermissionController::class, 'updatePermissions'])->name('roles.update-permissions');
        Route::get('/api/roles/{role}/permissions', [RolePermissionController::class, 'getRolePermissions'])->name('roles.get-permissions');
    });

    Route::middleware(['permission:permissions.create'])->group(function () {
        Route::get('/permissions/create', [RolePermissionController::class, 'createPermission'])->name('permissions.create');
        Route::post('/permissions', [RolePermissionController::class, 'storePermission'])->name('permissions.store');
    });

    Route::middleware(['permission:permissions.edit', 'super-admin-only'])->group(function () {
        Route::get('/permissions/{permission}/edit', [RolePermissionController::class, 'editPermission'])->name('permissions.edit');
        Route::put('/permissions/{permission}', [RolePermissionController::class, 'updatePermission'])->name('permissions.update');
    });

    Route::middleware(['permission:permissions.delete', 'super-admin-only'])->group(function () {
        Route::delete('/permissions/{permission}', [RolePermissionController::class, 'destroyPermission'])->name('permissions.destroy');
    });

    // User Management Routes

    // Create routes (must come before {user} routes)
    Route::middleware(['permission:users.create'])->group(function () {
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
    });

    // View routes
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
    });

    // Permission management routes (must come before {user} routes)
    Route::middleware(['permission:users.manage-permissions'])->group(function () {
        Route::get('/users/{user}/permissions', [UserController::class, 'managePermissions'])->name('users.permissions');
        Route::post('/users/{user}/permissions', [UserController::class, 'updatePermissions'])->name('users.permissions.update');
    });

    // Edit routes (must come before {user} show route)
    Route::middleware(['permission:users.edit', 'super-admin-only'])->group(function () {
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });

    // Show route (must come after specific routes)
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    // Delete routes
    Route::middleware(['permission:users.delete', 'super-admin-only'])->group(function () {
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::middleware(['permission:doctors.view'])->group(function () {
        Route::prefix('doctors')->name('doctors.')->group(function () {
            Route::put('/{doctor}/availability', [DoctorController::class, 'updateAvailability'])->name('availability')->middleware(['permission:doctors.availability', 'super-admin-only']);
            Route::put('/{doctor}/toggle-status', [DoctorController::class, 'toggleStatus'])->name('toggle')->middleware(['permission:doctors.edit', 'super-admin-only']);
        });
        Route::get('/doctors', [DoctorController::class, 'index'])->name('doctors.index');
        Route::get('/doctors/create', [DoctorController::class, 'create'])->name('doctors.create')->middleware('permission:doctors.create');
        Route::post('/doctors', [DoctorController::class, 'store'])->name('doctors.store')->middleware('permission:doctors.create');
        Route::get('/doctors/{doctor}', [DoctorController::class, 'show'])->name('doctors.show');
        Route::get('/doctors/{doctor}/edit', [DoctorController::class, 'edit'])->name('doctors.edit')->middleware(['permission:doctors.edit', 'super-admin-only']);
        Route::put('/doctors/{doctor}', [DoctorController::class, 'update'])->name('doctors.update')->middleware(['permission:doctors.edit', 'super-admin-only']);
        Route::delete('/doctors/{doctor}', [DoctorController::class, 'destroy'])->name('doctors.destroy')->middleware(['permission:doctors.delete', 'super-admin-only']);
    });

    Route::middleware(['permission:medicines.view'])->group(function () {
        Route::prefix('medicines')->name('medicines.')->group(function () {
            Route::put('/{medicine}/toggle-status', [MedicineController::class, 'toggleStatus'])->name('toggle')->middleware(['permission:medicines.toggle-status', 'super-admin-only']);
            Route::post('/bulk-action', [MedicineController::class, 'bulkAction'])->name('bulk-action')->middleware(['permission:medicines.edit', 'super-admin-only']);
            Route::get('/export', [MedicineController::class, 'export'])->name('export');
        });
        Route::get('/medicines', [MedicineController::class, 'index'])->name('medicines.index');
        Route::get('/medicines/create', [MedicineController::class, 'create'])->name('medicines.create')->middleware('permission:medicines.create');
        Route::post('/medicines', [MedicineController::class, 'store'])->name('medicines.store')->middleware('permission:medicines.create');
        Route::get('/medicines/{medicine}', [MedicineController::class, 'show'])->name('medicines.show');
        Route::get('/medicines/{medicine}/edit', [MedicineController::class, 'edit'])->name('medicines.edit')->middleware(['permission:medicines.edit', 'super-admin-only']);
        Route::put('/medicines/{medicine}', [MedicineController::class, 'update'])->name('medicines.update')->middleware(['permission:medicines.edit', 'super-admin-only']);
        Route::delete('/medicines/{medicine}', [MedicineController::class, 'destroy'])->name('medicines.destroy')->middleware(['permission:medicines.delete', 'super-admin-only']);
    });

    Route::get('/pending-visits', [PatientController::class, 'getPendingVisits'])->name('patients.pending-visits')->middleware('permission:visits.view');
    Route::patch('/visits/{visit}/complete', [PatientController::class, 'markVisitComplete'])->name('patients.visits.complete')->middleware('permission:visits.complete');
    Route::post('/visits/bulk-complete', [PatientController::class, 'bulkCompleteVisits'])->name('patients.visits.bulk-complete')->middleware('permission:visits.complete');
});


Route::middleware(['permission:dashboard.receptionist'])->prefix('receptionist')->name('receptionist.')->group(function () {
    Route::get('/dashboard', [ReceptionistDashboardController::class, 'index'])->name('dashboard');
    Route::post('/quick-search', [ReceptionistDashboardController::class, 'quickSearch'])->name('quick-search');
    Route::post('/quick-register', [ReceptionistDashboardController::class, 'quickRegister'])->name('quick-register');
    Route::get('/today-activity', [ReceptionistDashboardController::class, 'getTodayActivity'])->name('today-activity');
    Route::get('/payment-method-breakdown', [ReceptionistDashboardController::class, 'getTodayPaymentMethodBreakdown'])->name('payment-method-breakdown');
    Route::post('/mark-completed/{patient}', [ReceptionistDashboardController::class, 'markPatientCompleted'])->name('mark-completed');
    Route::get('/hourly-stats', [ReceptionistDashboardController::class, 'getTodayHourlyStats'])->name('hourly-stats');
});

Route::middleware(['auth'])->prefix('visits')->name('visits.')->group(function () {
    Route::get('/', [PatientVisitController::class, 'index'])->name('index')->middleware('permission:visits.view');
    Route::get('/{visit}', [PatientVisitController::class, 'show'])->name('show')->middleware('permission:visits.view');
    Route::get('/{visit}/receipt', [PatientVisitController::class, 'receipt'])->name('receipt')->middleware('permission:visits.receipt');

    Route::middleware(['permission:visits.create'])->group(function () {
        Route::post('/', [PatientVisitController::class, 'store'])->name('store');
    });

    Route::middleware(['permission:visits.edit', 'super-admin-only'])->group(function () {
        Route::get('/{visit}/edit', [PatientVisitController::class, 'edit'])->name('edit');
        Route::put('/{visit}', [PatientVisitController::class, 'update'])->name('update');
        Route::patch('/{visit}/status', [PatientVisitController::class, 'updateStatus'])->name('update-status');
    });

    Route::delete('/{visit}', [PatientVisitController::class, 'destroy'])->name('destroy')->middleware(['permission:visits.delete', 'super-admin-only']);

    Route::get('/queue/vision-test', [PatientVisitController::class, 'readyForVisionTest'])->name('ready-for-vision-test');
    Route::get('/queue/prescription', [PatientVisitController::class, 'readyForPrescription'])->name('ready-for-prescription');
});

Route::middleware(['permission:reports.view'])->prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/dashboard', [ReportController::class, 'dashboard'])->name('dashboard');
    Route::get('/patients', [ReportController::class, 'patients'])->name('patients')->middleware('permission:reports.patients');
    Route::get('/doctors', [ReportController::class, 'doctors'])->name('doctors')->middleware('permission:reports.doctors');
    Route::get('/appointments', [ReportController::class, 'appointments'])->name('appointments')->middleware('permission:reports.appointments');
    Route::get('/vision-tests', [ReportController::class, 'visionTests'])->name('vision-tests');
    Route::get('/prescriptions', [ReportController::class, 'prescriptions'])->name('prescriptions');
    Route::get('/revenue', [ReportController::class, 'revenue'])->name('revenue')->middleware('permission:reports.revenue');
    Route::get('/medicines', [ReportController::class, 'medicines'])->name('medicines');
});

Route::get('/appointment-display', [AppointmentDisplayController::class, 'index'])
    ->name('appointment.display');

// API route
Route::get('/api/appointment-display-data', [AppointmentDisplayController::class, 'getData'])
    ->name('api.appointment.display.data');

// Medicine Corner Routes - Permission-based
// Allow access if user has ANY medicine corner permission (not just .view)
Route::prefix('medicine-corner')->middleware(['auth'])->name('medicine-corner.')->group(function () {
    // Dashboard - Requires explicit medicine-corner.view permission
    Route::get('/dashboard', [MedicineCornerController::class, 'dashboard'])->name('dashboard')->middleware('permission:medicine-corner.view');

    // Main Medicine Corner Pages - Individual permissions
    Route::get('/stock', [MedicineCornerController::class, 'stock'])->name('stock')->middleware('permission:medicine-corner.stock');
    Route::get('/medicines', [MedicineCornerController::class, 'medicines'])->name('medicines')->middleware('permission:medicine-corner.view');
    Route::get('/purchase', [MedicineCornerController::class, 'purchase'])->name('purchase')->middleware('permission:medicine-corner.purchase');
    Route::get('/reports', [MedicineCornerController::class, 'reports'])->name('reports')->middleware('permission:medicine-corner.reports');
    Route::get('/alerts', [MedicineCornerController::class, 'alerts'])->name('alerts')->middleware('permission:medicine-corner.stock');

    // Stock Edit Routes (Fixed paths - remove duplicate prefix)
    Route::get('/stock/{id}/edit', [MedicineCornerController::class, 'editStock'])->name('edit-stock')->middleware('super-admin-only');
    Route::put('/stock/{id}', [MedicineCornerController::class, 'updateStock'])->name('update-stock')->middleware('super-admin-only');
    Route::get('/stock/{id}/edit-data', [MedicineCornerController::class, 'getStockForEdit'])->name('stock.edit-data');

    // Medicine & Stock Management
    Route::post('/store-medicine', [MedicineCornerController::class, 'storeMedicine'])->name('store-medicine');
    Route::post('/add-stock', [MedicineCornerController::class, 'addStock'])->name('add-stock');
    Route::post('/adjust-stock', [MedicineCornerController::class, 'adjustStock'])->name('adjust-stock');
    Route::put('/medicines/{medicine}', [MedicineCornerController::class, 'updateMedicine'])->name('update-medicine')->middleware('super-admin-only');
    Route::put('/medicines/{medicine}/stock-alert', [MedicineCornerController::class, 'updateStockAlert'])->name('update-stock-alert')->middleware('super-admin-only');

    // Fixed route for medicine details
    Route::get('/medicines/{id}/details', [MedicineCornerController::class, 'getMedicineDetails'])->name('medicine-details');

    // Sales Management
    Route::get('/sales', [MedicineCornerController::class, 'sales'])->name('sales');
    Route::get('/sales/{sale}', [MedicineCornerController::class, 'saleDetails'])->name('sale-details');
    Route::get('/sales/{sale}/edit', [MedicineCornerController::class, 'editSale'])->name('edit-sale')->middleware('super-admin-only');
    Route::put('/sales/{sale}', [MedicineCornerController::class, 'updateSale'])->name('update-sale')->middleware('super-admin-only');
    Route::put('/sales/{sale}/payment', [MedicineCornerController::class, 'updatePayment'])->name('update-payment')->middleware('super-admin-only');
    Route::delete('/sales/{sale}', [MedicineCornerController::class, 'deleteSale'])->name('delete-sale')->middleware('super-admin-only');
    Route::post('/sales/bulk-action', [MedicineCornerController::class, 'bulkAction'])->name('sales-bulk-action')->middleware('super-admin-only');
    Route::get('/sales-analytics', [MedicineCornerController::class, 'salesAnalytics'])->name('sales-analytics');

    // Vendor Due Management
    Route::get('/vendor-dues', [MedicineCornerController::class, 'vendorDues'])->name('vendor-dues');
    Route::post('/vendor-payment', [MedicineCornerController::class, 'makeVendorPayment'])->name('vendor-payment');
    Route::get('/vendor-purchase-history', [MedicineCornerController::class, 'getVendorPurchaseHistory'])->name('vendor-purchase-history');
    Route::put('/update-stock-payment-status', [MedicineCornerController::class, 'updateStockPaymentStatus'])->name('update-stock-payment-status');
    Route::get('/vendor-purchase-analytics', [MedicineCornerController::class, 'vendorPurchaseAnalytics'])->name('vendor-purchase-analytics');

    // Export Reports
    Route::get('/export-reports', [MedicineCornerController::class, 'exportReports'])->name('export-reports');

    // Medicine Reports

});

// Medicine Reports - Requires authentication and specific permissions
Route::middleware(['auth'])->group(function () {
    Route::get('/medicine/reports/daily-statement', [\App\Http\Controllers\MedicineReportController::class, 'dailyStatement'])->name('medicine.reports.daily-statement')->middleware('permission:medicine.reports.daily-statement');
    Route::get('/medicine/reports/account-statement', [\App\Http\Controllers\MedicineReportController::class, 'accountStatement'])->name('medicine.reports.account-statement')->middleware('permission:medicine.reports.account-statement');
    Route::get('/medicine/reports/account-statement/export', [\App\Http\Controllers\MedicineReportController::class, 'exportAccountStatement'])->name('medicine.reports.account-statement.export')->middleware('permission:medicine.reports.account-statement');
    Route::get('/medicine/reports/buy-sale-stock', [\App\Http\Controllers\MedicineReportController::class, 'buySaleStockReport'])->name('medicine.reports.buy-sale-stock')->middleware('permission:medicine.reports.buy-sale-stock');
});

// Medicine Vendor Management Routes - Permission-based
Route::prefix('medicine-vendors')->middleware(['auth', 'permission:medicine-corner.vendors'])->name('medicine-vendors.')->group(function () {
    // Vendor CRUD
    Route::get('/', [MedicineVendorController::class, 'index'])->name('index');
    Route::post('/', [MedicineVendorController::class, 'store'])->name('store');
    Route::get('/{vendor}', [MedicineVendorController::class, 'show'])->name('show');
    Route::put('/{vendor}', [MedicineVendorController::class, 'update'])->name('update')->middleware('super-admin-only');

    // Vendor Transactions & Payments
    Route::post('/add-stock', [MedicineVendorController::class, 'addStock'])->name('add-stock');
    Route::post('/make-payment', [MedicineVendorController::class, 'makePayment'])->name('make-payment');
    Route::post('/adjust-balance', [MedicineVendorController::class, 'adjustBalance'])->name('adjust-balance');

    // Reports & Analytics
    Route::get('/reports/due-report', [MedicineVendorController::class, 'dueReport'])->name('due-report');
    Route::get('/reports/payment-history', [MedicineVendorController::class, 'paymentHistory'])->name('payment-history');
    Route::get('/reports/analytics', [MedicineVendorController::class, 'analytics'])->name('analytics');

    // AJAX Routes
    Route::get('/api/vendors-for-purchase', [MedicineVendorController::class, 'getVendorsForPurchase'])->name('vendors-for-purchase');
    Route::get('/api/{vendor}/pending-transactions', [MedicineVendorController::class, 'getVendorPendingTransactions'])->name('pending-transactions');

    // Export
    Route::get('/export-report', [MedicineVendorController::class, 'exportReport'])->name('export-report');
});

Route::prefix('medicine-seller')->middleware(['permission:dashboard.medicine-seller'])->group(function () {
    Route::get('/dashboard', [MedicineSellerDashboardController::class, 'index'])->name('medicine-seller.dashboard');
    Route::get('/pos', [MedicineSellerDashboardController::class, 'pos'])->name('medicine-seller.pos')->middleware('permission:medicine-seller.pos');
    Route::post('/pos/sale', [MedicineSellerDashboardController::class, 'processSale'])->name('medicine-seller.process-sale')->middleware('permission:medicine-seller.pos');
    Route::get('/sales', [MedicineSellerDashboardController::class, 'salesHistory'])->name('medicine-seller.sales')->middleware('permission:medicine-seller.sales');
    Route::get('/sales/export', [MedicineSellerDashboardController::class, 'exportSalesHistory'])->name('medicine-seller.sales-export')->middleware('permission:medicine-seller.sales');
    Route::get('/sales/{sale}', [MedicineSellerDashboardController::class, 'saleDetails'])->name('medicine-seller.sale-details')->middleware('permission:medicine-seller.sales');
    Route::put('/sales/{sale}/payment', [MedicineSellerDashboardController::class, 'updatePayment'])->name('medicine-seller.update-payment')->middleware('permission:medicine-seller.sales');
    Route::get('/my-report', [MedicineSellerDashboardController::class, 'myReport'])->name('medicine-seller.report')->middleware('permission:medicine-seller.reports');
    Route::get('/api/search-medicines', [MedicineSellerDashboardController::class, 'searchMedicines'])->name('medicine-seller.search-medicines');
    Route::get('/api/medicine/{medicine}/stock', [MedicineSellerDashboardController::class, 'getMedicineStock'])->name('medicine-seller.medicine-stock');
});

// Default redirect for Medicine Seller
Route::get('/medicine-seller', function () {
    return redirect()->route('medicine-seller.dashboard');
})->middleware(['auth', 'role:Medicine Seller']);

Route::prefix('optics-seller')->middleware(['permission:dashboard.optics-seller'])->group(function () {
    Route::get('/dashboard', [OpticsSellerDashboardController::class, 'index'])->name('optics-seller.dashboard');
    Route::get('/pos', [OpticsSellerDashboardController::class, 'pos'])->name('optics-seller.pos')->middleware('permission:optics-seller.pos');
    Route::post('/pos/sale', [OpticsSellerDashboardController::class, 'processSale'])->name('optics-seller.process-sale')->middleware('permission:optics-seller.pos');
    Route::get('/search-customer', [OpticsSellerDashboardController::class, 'searchCustomer'])->name('search-customer');
    Route::get('/customer/{patient}/details', [OpticsSellerDashboardController::class, 'getCustomerDetails'])->name('customer-details');
    Route::get('/sales', [OpticsSellerDashboardController::class, 'salesHistory'])->name('optics-seller.sales')->middleware('permission:optics-seller.sales');
    Route::get('/sales/export', [OpticsSellerDashboardController::class, 'exportSalesHistory'])->name('optics-seller.sales-export')->middleware('permission:optics-seller.sales');
    Route::get('/sales/{sale}', [OpticsSellerDashboardController::class, 'saleDetails'])->name('optics-seller.sale-details')->middleware('permission:optics-seller.sales');
    Route::post('/sales/{sale}/update-status', [OpticsSellerDashboardController::class, 'updateStatus'])->name('optics-seller.update-status')->middleware('permission:optics-seller.sales');
    Route::post('/sales/{sale}/payment', [OpticsSellerDashboardController::class, 'updatePayment'])->name('optics-seller.add-payment')->middleware('permission:optics-seller.sales');
    Route::get('/my-report', [OpticsSellerDashboardController::class, 'myReport'])->name('optics-seller.report')->middleware('permission:optics-seller.reports');
    Route::get('/api/search-items', [OpticsSellerDashboardController::class, 'searchItems'])->name('optics-seller.search-items');
});


// Default redirect for Optics Seller
Route::get('/optics-seller', function () {
    return redirect()->route('optics-seller.dashboard');
})->middleware(['auth', 'role:Optics Seller']);


Route::post('/patient/{patient}/save-qr', function (Patient $patient, Request $request) {
    try {
        // Log the incoming request for debugging
        Log::info('QR save request received', [
            'patient_id' => $patient->id,
            'patient_code' => $patient->patient_id,
            'current_qr_path' => $patient->qr_code_image_path
        ]);

        $request->validate([
            'qr_data_url' => 'required|string',
        ]);

        $dataUrl = $request->qr_data_url;

        // Validate base64 image format
        if (!preg_match('/^data:image\/png;base64,(.+)$/', $dataUrl, $matches)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid image format. Expected PNG base64.'
            ], 400);
        }

        $base64Data = $matches[1];
        $imageData = base64_decode($base64Data);

        // Validate decoded image
        if ($imageData === false) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to decode base64 image data.'
            ], 400);
        }

        // Check minimum image size (at least 1KB)
        if (strlen($imageData) < 1000) {
            return response()->json([
                'success' => false,
                'message' => 'Image data too small. Minimum 1KB required.'
            ], 400);
        }

        // Create directory if not exists
        $directory = 'qr-codes';
        if (!Storage::disk('public')->exists($directory)) {
            Storage::disk('public')->makeDirectory($directory);
        }

        // Generate unique filename
        $filename = $directory . '/patient-' . $patient->patient_id . '-' . time() . '.png';

        // Save image to storage
        if (!Storage::disk('public')->put($filename, $imageData)) {
            Log::error('Failed to save QR image to storage', [
                'filename' => $filename,
                'patient_id' => $patient->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save image to storage.'
            ], 500);
        }

        Log::info('QR image saved to storage', [
            'filename' => $filename,
            'patient_id' => $patient->id,
            'file_size' => strlen($imageData)
        ]);

        // Delete old QR image if exists
        if ($patient->qr_code_image_path && Storage::disk('public')->exists($patient->qr_code_image_path)) {
            Storage::disk('public')->delete($patient->qr_code_image_path);
            Log::info('Old QR image deleted', [
                'old_path' => $patient->qr_code_image_path,
                'patient_id' => $patient->id
            ]);
        }

        // ** CRITICAL FIX: Update patient record with proper error handling **
        try {
            $updateResult = $patient->update([
                'qr_code_image_path' => $filename
            ]);

            if (!$updateResult) {
                Log::error('Failed to update patient record', [
                    'patient_id' => $patient->id,
                    'filename' => $filename
                ]);

                // Delete the uploaded file since DB update failed
                Storage::disk('public')->delete($filename);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update patient record in database.'
                ], 500);
            }

            // Refresh the model to confirm the update
            $patient->refresh();

            Log::info('Patient record updated successfully', [
                'patient_id' => $patient->id,
                'new_qr_path' => $patient->qr_code_image_path,
                'filename' => $filename
            ]);
        } catch (\Exception $dbError) {
            Log::error('Database update error', [
                'patient_id' => $patient->id,
                'filename' => $filename,
                'error' => $dbError->getMessage()
            ]);

            // Delete the uploaded file since DB update failed
            Storage::disk('public')->delete($filename);

            return response()->json([
                'success' => false,
                'message' => 'Database update failed: ' . $dbError->getMessage()
            ], 500);
        }

        // Generate full URL for the image
        $imageUrl = Storage::disk('public')->url($filename);

        // Return success response with detailed info
        return response()->json([
            'success' => true,
            'message' => 'QR code saved successfully!',
            'url' => $imageUrl,
            'filename' => $filename,
            'patient_id' => $patient->patient_id,
            'patient_db_id' => $patient->id,
            'saved_at' => now()->toISOString(),
            'file_size' => strlen($imageData),
            'updated_qr_path' => $patient->qr_code_image_path
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('Validation failed for QR save', [
            'patient_id' => $patient->id,
            'errors' => $e->errors()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        Log::error('QR save failed with exception', [
            'patient_id' => $patient->id,
            'patient_code' => $patient->patient_id,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage(),
            'debug_info' => [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]
        ], 500);
    }
})->name('patient.save-qr');

Route::middleware(['permission:hospital-account.view'])->prefix('hospital-account')->name('hospital-account.')->group(function () {
    Route::get('/', [HospitalAccountController::class, 'index'])->name('dashboard');
    Route::post('/fund-in', [HospitalAccountController::class, 'fundIn'])->name('fund-in');
    Route::post('/fund-out', [HospitalAccountController::class, 'fundOut'])->name('fund-out');
    Route::post('/expense', [HospitalAccountController::class, 'addExpense'])->name('expense');
    Route::post('/other-income', [HospitalAccountController::class, 'addOtherIncome'])->name('other-income');

    // Transaction Routes
    Route::get('/transactions', [HospitalAccountController::class, 'transactions'])->name('transactions');
    Route::get('/transactions/{transaction}/edit', [HospitalAccountController::class, 'editTransaction'])->name('transactions.edit')->middleware('super-admin-only');
    Route::put('/transactions/{transaction}', [HospitalAccountController::class, 'updateTransaction'])->name('transactions.update')->middleware('super-admin-only');
    Route::delete('/transactions/{transaction}', [HospitalAccountController::class, 'deleteTransaction'])->name('transactions.delete')->middleware('super-admin-only');

    // Fund Transaction Routes
    Route::get('/fund-history', [HospitalAccountController::class, 'fundHistory'])->name('fund-history');
    Route::get('/fund-transactions/{fundTransaction}/edit', [HospitalAccountController::class, 'editFundTransaction'])->name('fund-transactions.edit')->middleware('super-admin-only');
    Route::put('/fund-transactions/{fundTransaction}', [HospitalAccountController::class, 'updateFundTransaction'])->name('fund-transactions.update')->middleware('super-admin-only');
    Route::delete('/fund-transactions/{fundTransaction}', [HospitalAccountController::class, 'deleteFundTransaction'])->name('fund-transactions.delete')->middleware('super-admin-only');

    // Category Routes
    Route::get('/categories', [HospitalAccountController::class, 'categories'])->name('categories');
    Route::post('/categories', [HospitalAccountController::class, 'storeCategory'])->name('categories.store');
    Route::post('/income-categories', [HospitalAccountController::class, 'storeIncomeCategory'])->name('income-categories.store');
    Route::put('/categories/{category}', [HospitalAccountController::class, 'updateCategory'])->name('categories.update')->middleware('super-admin-only');
    Route::put('/income-categories/{category}', [HospitalAccountController::class, 'updateIncomeCategory'])->name('income-categories.update')->middleware('super-admin-only');

    // Report Routes
    Route::get('/monthly-report', [HospitalAccountController::class, 'monthlyReport'])->name('monthly-report');
    Route::get('/balance-sheet', [HospitalAccountController::class, 'balanceSheet'])->name('balance-sheet');

    // Advance House Rent Routes
    Route::prefix('advance-rent')->name('advance-rent.')->group(function () {
        Route::get('/', [AdvanceHouseRentController::class, 'index'])->name('index');
        Route::post('/', [AdvanceHouseRentController::class, 'store'])->name('store');
        Route::post('/deduct', [AdvanceHouseRentController::class, 'deduct'])->name('deduct');
        Route::get('/history', [AdvanceHouseRentController::class, 'history'])->name('history');
        Route::get('/deductions', [AdvanceHouseRentController::class, 'deductions'])->name('deductions');
        Route::get('/export', [AdvanceHouseRentController::class, 'export'])->name('export');
    });

    // Fixed Asset Routes
    Route::get('/fixed-assets', [FixedAssetController::class, 'index'])->name('fixed-assets.index');
    Route::get('/fixed-assets/create', [FixedAssetController::class, 'create'])->name('fixed-assets.create');
    Route::post('/fixed-assets', [FixedAssetController::class, 'store'])->name('fixed-assets.store');
    Route::get('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'show'])->name('fixed-assets.show');
    Route::get('/fixed-assets/{fixedAsset}/edit', [FixedAssetController::class, 'edit'])->name('fixed-assets.edit')->middleware('super-admin-only');
    Route::put('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'update'])->name('fixed-assets.update')->middleware('super-admin-only');
    Route::delete('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'destroy'])->name('fixed-assets.destroy')->middleware('super-admin-only');
    Route::post('/fixed-assets/{fixedAsset}/payment', [FixedAssetController::class, 'makePayment'])->name('fixed-assets.payment');
    Route::get('/fixed-assets/{fixedAsset}/payments', [FixedAssetController::class, 'payments'])->name('fixed-assets.payments');

    // Fixed Asset Vendor Routes
    Route::get('/fixed-asset-vendors', [FixedAssetVendorController::class, 'index'])->name('fixed-asset-vendors.index');
    Route::get('/fixed-asset-vendors/create', [FixedAssetVendorController::class, 'create'])->name('fixed-asset-vendors.create');
    Route::post('/fixed-asset-vendors', [FixedAssetVendorController::class, 'store'])->name('fixed-asset-vendors.store');
    Route::get('/fixed-asset-vendors/{fixedAssetVendor}', [FixedAssetVendorController::class, 'show'])->name('fixed-asset-vendors.show');
    Route::get('/fixed-asset-vendors/{fixedAssetVendor}/edit', [FixedAssetVendorController::class, 'edit'])->name('fixed-asset-vendors.edit');
    Route::put('/fixed-asset-vendors/{fixedAssetVendor}', [FixedAssetVendorController::class, 'update'])->name('fixed-asset-vendors.update');
    Route::delete('/fixed-asset-vendors/{fixedAssetVendor}', [FixedAssetVendorController::class, 'destroy'])->name('fixed-asset-vendors.destroy')->middleware('super-admin-only');
    Route::post('/fixed-asset-vendors/{fixedAssetVendor}/payment', [FixedAssetVendorController::class, 'makePayment'])->name('fixed-asset-vendors.payment');

    // Fund Ledger Routes
    Route::get('/fund-ledger', [\App\Http\Controllers\HospitalAccount\FundLedgerController::class, 'index'])->name('fund-ledger');
    Route::get('/fund-ledger/print', [\App\Http\Controllers\HospitalAccount\FundLedgerController::class, 'print'])->name('fund-ledger.print');

    // Vendor Due Ledger Routes
    Route::get('/vendor-due-ledger/fixed-asset', [\App\Http\Controllers\HospitalAccount\VendorDueLedgerController::class, 'fixedAssetVendorDue'])->name('vendor-due-ledger.fixed-asset');
    Route::get('/vendor-due-ledger/medicine', [\App\Http\Controllers\HospitalAccount\VendorDueLedgerController::class, 'medicineVendorDue'])->name('vendor-due-ledger.medicine');
    Route::get('/vendor-due-ledger/optics', [\App\Http\Controllers\HospitalAccount\VendorDueLedgerController::class, 'opticsVendorDue'])->name('vendor-due-ledger.optics');

});

// Hospital Reports - Requires authentication and specific permissions
Route::middleware(['auth'])->group(function () {
    Route::get('/hospital-account/reports/daily-statement', [\App\Http\Controllers\HospitalReportController::class, 'dailyStatement'])->name('reports.daily-statement')->middleware('permission:hospital.reports.daily-statement');
    Route::get('/hospital-account/reports/account-statement', [\App\Http\Controllers\HospitalReportController::class, 'accountStatement'])->name('reports.account-statement')->middleware('permission:hospital.reports.account-statement');
    Route::get('/hospital-account/reports/account-statement/export', [\App\Http\Controllers\HospitalReportController::class, 'exportAccountStatement'])->name('reports.account-statement.export')->middleware('permission:hospital.reports.account-statement');
    Route::get('/hospital-account/reports/medical-test-income', [\App\Http\Controllers\HospitalReportController::class, 'medicalTestIncomeReport'])->name('reports.medical-test-income')->middleware('permission:hospital.reports.medical-test-income');

    // OPD Income Reports
    Route::get('/hospital-account/reports/new-patient-income', [\App\Http\Controllers\Reports\NewPatientIncomeController::class, 'index'])->name('reports.new-patient-income')->middleware('permission:hospital.reports.new-patient-income');
    Route::get('/hospital-account/reports/followup-patient-income', [\App\Http\Controllers\Reports\FollowupPatientIncomeController::class, 'index'])->name('reports.followup-patient-income')->middleware('permission:hospital.reports.followup-patient-income');
});

// Financial Reports Routes - Requires authentication
Route::middleware(['auth'])->prefix('reports')->name('reports.')->group(function () {
    // Receipt & Payment Report
    Route::middleware(['permission:reports.receipt-payment'])->group(function () {
        Route::get('/receipt-payment', [\App\Http\Controllers\Reports\ReceiptPaymentController::class, 'index'])->name('receipt-payment');
        Route::get('/receipt-payment/export', [\App\Http\Controllers\Reports\ReceiptPaymentController::class, 'export'])->name('receipt-payment.export');
        Route::get('/receipt-payment/receipt-details', [\App\Http\Controllers\Reports\ReceiptPaymentController::class, 'getReceiptDetails'])->name('receipt-payment.receipt-details');
        Route::get('/receipt-payment/payment-details', [\App\Http\Controllers\Reports\ReceiptPaymentController::class, 'getPaymentDetails'])->name('receipt-payment.payment-details');
    });

    // Income & Expenditure Report
    Route::middleware(['permission:reports.income-expenditure'])->group(function () {
        Route::get('/income-expenditure', [\App\Http\Controllers\Reports\IncomeExpenditureController::class, 'index'])->name('income-expenditure');
        Route::get('/income-expenditure/export', [\App\Http\Controllers\Reports\IncomeExpenditureController::class, 'export'])->name('income-expenditure.export');
        Route::get('/income-expenditure/income-details/{categoryId}', [\App\Http\Controllers\Reports\IncomeExpenditureController::class, 'getIncomeDetails'])->name('income-expenditure.income-details');
        Route::get('/income-expenditure/expense-details/{categoryId}', [\App\Http\Controllers\Reports\IncomeExpenditureController::class, 'getExpenseDetails'])->name('income-expenditure.expense-details');
    });

    // Balance Sheet Report
    Route::middleware(['permission:reports.balance-sheet'])->group(function () {
        Route::get('/balance-sheet', [\App\Http\Controllers\Reports\BalanceSheetController::class, 'index'])->name('balance-sheet');
        Route::get('/balance-sheet/export', [\App\Http\Controllers\Reports\BalanceSheetController::class, 'export'])->name('balance-sheet.export');
    });
});

Route::middleware(['auth', 'permission:medicine-account.view'])->prefix('medicine-account')->name('medicine-account.')->group(function () {
    Route::get('/', [MedicineAccountController::class, 'index'])->name('dashboard');
    Route::post('/fund-in', [MedicineAccountController::class, 'fundIn'])->name('fund-in');
    Route::post('/fund-out', [MedicineAccountController::class, 'fundOut'])->name('fund-out');
    Route::post('/expense', [MedicineAccountController::class, 'addExpense'])->name('expense');
    Route::get('/transactions', [MedicineAccountController::class, 'transactions'])->name('transactions');
    Route::get('/fund-history', [MedicineAccountController::class, 'fundHistory'])->name('fund-history');
    Route::get('/categories', [MedicineAccountController::class, 'categories'])->name('categories');
    Route::post('/categories', [MedicineAccountController::class, 'storeCategory'])->name('categories.store');
    Route::put('/categories/{category}', [MedicineAccountController::class, 'updateCategory'])->name('categories.update')->middleware('super-admin-only');
    Route::get('/monthly-report', [MedicineAccountController::class, 'monthlyReport'])->name('monthly-report');
    Route::get('/balance-sheet', [MedicineAccountController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/analytics', [MedicineAccountController::class, 'analytics'])->name('analytics');
    Route::get('/stock-value-report', [MedicineAccountController::class, 'stockValueReport'])->name('stock-value-report');
    Route::post('/export', [MedicineAccountController::class, 'exportReport'])->name('export');
});

Route::middleware(['auth', 'permission:optics-account.view'])->prefix('optics-account')->name('optics-account.')->group(function () {
    Route::get('/', [OpticsAccountController::class, 'index'])->name('dashboard');
    Route::post('/fund-in', [OpticsAccountController::class, 'fundIn'])->name('fund-in');
    Route::post('/fund-out', [OpticsAccountController::class, 'fundOut'])->name('fund-out');
    Route::post('/expense', [OpticsAccountController::class, 'addExpense'])->name('expense');
    Route::get('/transactions', [OpticsAccountController::class, 'transactions'])->name('transactions');
    Route::get('/fund-history', [OpticsAccountController::class, 'fundHistory'])->name('fund-history');
    Route::get('/categories', [OpticsAccountController::class, 'categories'])->name('categories');
    Route::post('/categories', [OpticsAccountController::class, 'storeCategory'])->name('categories.store');
    Route::put('/categories/{category}', [OpticsAccountController::class, 'updateCategory'])->name('categories.update')->middleware('super-admin-only');
    Route::get('/monthly-report', [OpticsAccountController::class, 'monthlyReport'])->name('monthly-report');
    Route::get('/balance-sheet', [OpticsAccountController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/analytics', [OpticsAccountController::class, 'analytics'])->name('analytics');
    Route::get('/inventory-report', [OpticsAccountController::class, 'inventoryReport'])->name('inventory-report');
    Route::post('/export', [OpticsAccountController::class, 'exportReport'])->name('export');
});

Route::middleware(['auth', 'permission:operations.view'])->prefix('operation-account')->name('operation-account.')->group(function () {
    Route::get('/', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'index'])->name('dashboard');
    Route::post('/fund-in', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'fundIn'])->name('fund-in');
    Route::post('/fund-out', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'fundOut'])->name('fund-out');
    Route::post('/expense', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'addExpense'])->name('expense');
    Route::post('/other-income', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'addOtherIncome'])->name('other-income');
    Route::get('/transactions', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'transactions'])->name('transactions');
    Route::get('/fund-history', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'fundHistory'])->name('fund-history');
    Route::get('/monthly-report', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'monthlyReport'])->name('monthly-report');
    Route::get('/balance-sheet', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/analytics', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'analytics'])->name('analytics');
    Route::post('/export', [\App\Http\Controllers\OperationAccount\OperationAccountController::class, 'exportReport'])->name('export');

    // Operation Reports
    Route::get('/reports/daily-statement', [\App\Http\Controllers\OperationReportController::class, 'dailyStatement'])->name('reports.daily-statement')->middleware('permission:operation.reports.daily-statement');
    Route::get('/reports/account-statement', [\App\Http\Controllers\OperationReportController::class, 'accountStatement'])->name('reports.account-statement')->middleware('permission:operation.reports.account-statement');
    Route::get('/reports/account-statement/export', [\App\Http\Controllers\OperationReportController::class, 'exportAccountStatement'])->name('reports.account-statement.export')->middleware('permission:operation.reports.account-statement');
    Route::get('/reports/operation-income', [\App\Http\Controllers\OperationReportController::class, 'operationIncomeReport'])->name('reports.operation-income')->middleware('permission:operation.reports.income');
});

Route::middleware(['auth', 'permission:main-account.view'])->prefix('main-account')->name('main-account.')->group(function () {
    Route::get('/', [MainAccountController::class, 'index'])->name('index');
    Route::get('/vouchers', [MainAccountController::class, 'vouchers'])->name('vouchers');
    Route::get('/vouchers/{voucher}', [MainAccountController::class, 'show'])->name('show');
    Route::get('/reports', [MainAccountController::class, 'reports'])->name('reports');
    Route::get('/daily-report', [MainAccountController::class, 'dailyReport'])->name('daily-report');
    Route::get('/monthly-report', [MainAccountController::class, 'monthlyReport'])->name('monthly-report');
    Route::get('/yearly-report', [MainAccountController::class, 'yearlyReport'])->name('yearly-report');
    Route::get('/bank-report', [MainAccountController::class, 'bankReport'])->name('bank-report');
    Route::get('/receipt-payment-report', [MainAccountController::class, 'receiptAndPaymentReport'])
        ->name('main-account.receipt-payment-report');
    Route::get('/income-expenditure-report', [MainAccountController::class, 'incomeExpenditureReport'])
        ->name('main-account.income-expenditure-report');
    Route::get('/balance-sheet', [MainAccountController::class, 'balanceSheet'])
        ->name('main-account.balance-sheet');
});

// Optics Corner Routes - Permission-based
// Allow access if user has ANY optics permission (not just .view)
Route::middleware(['auth'])->prefix('optics')->name('optics.')->group(function () {

    // Dashboard - Requires explicit optics.view permission
    Route::get('/', [OpticsCornerController::class, 'index'])->name('dashboard')->middleware('permission:optics.view');

    // Frames Management - Individual permission
    Route::middleware(['permission:optics.frames'])->group(function () {
        Route::get('/frames', [OpticsCornerController::class, 'frames'])->name('frames');
        Route::get('/frames/create', [OpticsCornerController::class, 'createFrame'])->name('frames.create');
        Route::post('/frames', [OpticsCornerController::class, 'storeFrame'])->name('frames.store');
        Route::get('/frames/{frame}/edit', [OpticsCornerController::class, 'editFrame'])->name('frames.edit')->middleware('super-admin-only');
        Route::put('/frames/{frame}', [OpticsCornerController::class, 'updateFrame'])->name('frames.update')->middleware('super-admin-only');
        Route::patch('/frames/{frame}/toggle-status', [OpticsCornerController::class, 'toggleStatus'])->name('frames.toggle-status')->middleware('super-admin-only');
        Route::delete('/frames/{frame}', [OpticsCornerController::class, 'deleteFrame'])->name('frames.delete')->middleware('super-admin-only');
    });

    // Stock Management - Individual permission
    Route::middleware(['permission:optics.stock'])->group(function () {
        Route::get('/stock', [OpticsCornerController::class, 'stockManagement'])->name('stock');
        Route::get('/stock/add', [OpticsCornerController::class, 'addStock'])->name('stock.add');
        Route::post('/stock', [OpticsCornerController::class, 'storeStock'])->name('stock.store');
        Route::get('/stock/{movement}/edit', [OpticsCornerController::class, 'editStock'])->name('stock.edit')->middleware('super-admin-only');
        Route::put('/stock/{movement}', [OpticsCornerController::class, 'updateStock'])->name('stock.update')->middleware('super-admin-only');
        Route::delete('/stock/{movement}', [OpticsCornerController::class, 'deleteStock'])->name('stock.delete')->middleware('super-admin-only');
    });

    // Sales Management - Individual permission
    Route::middleware(['permission:optics.sales'])->group(function () {
        Route::get('/sales', [OpticsCornerController::class, 'sales'])->name('sales');
        Route::get('/sales/create', [OpticsCornerController::class, 'createSale'])->name('sales.create');
        Route::post('/sales', [OpticsCornerController::class, 'storeSale'])->name('sales.store');
        Route::get('/sales/{sale}/edit', [OpticsCornerController::class, 'editSale'])->name('sales.edit')->middleware('super-admin-only');
        Route::put('/sales/{sale}', [OpticsCornerController::class, 'updateSale'])->name('sales.update')->middleware('super-admin-only');
        Route::delete('/sales/{sale}', [OpticsCornerController::class, 'deleteSale'])->name('sales.delete')->middleware('super-admin-only');
    });

    // Lens Types Management - Individual permission
    Route::middleware(['permission:optics.lens-types'])->group(function () {
        Route::get('/lens-types', [OpticsCornerController::class, 'lensTypes'])->name('lens-types');
        Route::post('/lens-types', [OpticsCornerController::class, 'storeLensType'])->name('lens-types.store');
    });

    // Account Management - Requires view permission
    Route::middleware(['permission:optics.view'])->group(function () {
        Route::get('/account', [OpticsCornerController::class, 'account'])->name('account');
        Route::post('/account/add-fund', [OpticsCornerController::class, 'addFund'])->name('account.add-fund');
        Route::post('/account/add-expense', [OpticsCornerController::class, 'addExpense'])->name('account.add-expense');
    });

    // Reports Page - Requires reports permission for report navigation page
    Route::get('/reports', [OpticsCornerController::class, 'reports'])->name('reports')->middleware('permission:optics.reports');

    // Vendors Management - Individual permission
    Route::middleware(['permission:optics.vendors'])->group(function () {
        Route::get('/vendors', [OpticsVendorController::class, 'index'])->name('vendors.index');
        Route::get('/vendors/create', [OpticsVendorController::class, 'create'])->name('vendors.create');
        Route::post('/vendors', [OpticsVendorController::class, 'store'])->name('vendors.store');
        Route::get('/vendors/{vendor}/edit', [OpticsVendorController::class, 'edit'])->name('vendors.edit')->middleware('super-admin-only');
        Route::put('/vendors/{vendor}', [OpticsVendorController::class, 'update'])->name('vendors.update')->middleware('super-admin-only');
        Route::get('/vendors/{vendor}/transactions', [OpticsVendorController::class, 'transactions'])->name('vendors.transactions');
        Route::post('/vendors/{vendor}/payment', [OpticsVendorController::class, 'makePayment'])->name('vendors.payment');
    });

    // Purchases Management - Individual permission
    Route::middleware(['permission:optics.purchases'])->group(function () {
        Route::get('/purchases', [OpticsVendorController::class, 'purchasesIndex'])->name('purchases.index');
        Route::get('/purchases/create', [OpticsVendorController::class, 'createPurchase'])->name('purchases.create');
        Route::post('/purchases', [OpticsVendorController::class, 'storePurchase'])->name('purchases.store');
        Route::post('/purchases/{purchase}/pay', [OpticsVendorController::class, 'payPurchaseDue'])->name('purchases.pay');
    });
});

// Optics Reports - Separate route group with independent permissions
Route::middleware(['auth'])->prefix('optics')->name('optics.')->group(function () {
    // Daily Statement Report (Bank Report)
    Route::get('/reports/daily-statement', [OpticsReportController::class, 'dailyStatement'])->name('reports.daily-statement')->middleware('permission:optics.reports.daily-statement');

    // Account Statement Report
    Route::get('/reports/account-statement', [OpticsReportController::class, 'accountStatement'])->name('reports.account-statement')->middleware('permission:optics.reports.account-statement');
    Route::get('/reports/account-statement/export', [OpticsReportController::class, 'exportAccountStatement'])->name('reports.account-statement.export')->middleware('permission:optics.reports.account-statement');

    // Buy-Sale-Stock Report
    Route::get('/reports/buy-sale-stock', [OpticsReportController::class, 'buySaleStockReport'])->name('reports.buy-sale-stock')->middleware('permission:optics.reports.buy-sale-stock');
    Route::get('/reports/buy-sale-stock/export', [OpticsReportController::class, 'exportBuySaleStockReport'])->name('reports.buy-sale-stock.export')->middleware('permission:optics.reports.buy-sale-stock');
});



Route::prefix('medical-tests')->name('medical-tests.')->middleware(['auth', 'permission:medical-tests.view'])->group(function () {

    // Test Master Management - Permission-based
    Route::middleware(['permission:medical-tests.manage-tests', 'super-admin-only'])->group(function () {
        Route::get('/tests', [MedicalTestController::class, 'testIndex'])->name('tests.index');
        Route::post('/tests', [MedicalTestController::class, 'storeTest'])->name('tests.store');
        Route::put('/tests/{test}', [MedicalTestController::class, 'updateTest'])->name('tests.update');
        Route::delete('/tests/{test}', [MedicalTestController::class, 'destroyTest'])->name('tests.destroy');
    });

    // IMPORTANT: Specific routes MUST come BEFORE dynamic {testGroup} routes

    // Search patients route (BEFORE {testGroup})
    Route::get('/search-patients', [MedicalTestController::class, 'searchPatients'])->name('search-patients');

    // Create routes (BEFORE {testGroup})
    Route::middleware(['permission:medical-tests.create'])->group(function () {
        Route::get('/create', [MedicalTestController::class, 'create'])->name('create');
        Route::post('/', [MedicalTestController::class, 'store'])->name('store');
    });

    // Reports routes (BEFORE {testGroup})
    Route::middleware(['permission:medical-tests.reports'])->group(function () {
        Route::get('/reports/daily', [MedicalTestController::class, 'dailyReport'])->name('reports.daily');
        Route::get('/reports/monthly', [MedicalTestController::class, 'monthlyReport'])->name('reports.monthly');
        Route::get('/reports/test-wise', [MedicalTestController::class, 'testWiseReport'])->name('reports.test-wise');
    });

    // Patient Test Booking - Index route
    Route::get('/', [MedicalTestController::class, 'index'])->name('index');

    // Dynamic routes with {testGroup} parameter (MUST be LAST)
    Route::get('/{testGroup}', [MedicalTestController::class, 'show'])->name('show');
    Route::get('/{testGroup}/receipt', [MedicalTestController::class, 'receipt'])->name('receipt');
    Route::get('/{testGroup}/print', [MedicalTestController::class, 'printReceipt'])->name('print-receipt');

    Route::middleware(['permission:medical-tests.payment'])->group(function () {
        Route::get('/{testGroup}/payment', [MedicalTestController::class, 'paymentPage'])->name('payment-page');
        Route::post('/{testGroup}/add-payment', [MedicalTestController::class, 'addPayment'])->name('add-payment');
    });

    Route::put('/test/{test}/result', [MedicalTestController::class, 'updateResult'])->name('update-result')->middleware('permission:medical-tests.results');
    Route::delete('/{testGroup}/cancel', [MedicalTestController::class, 'cancel'])->name('cancel')->middleware(['permission:medical-tests.delete', 'super-admin-only']);
});

// ==================== Operation Routes ====================

use App\Http\Controllers\OperationController;
use App\Http\Controllers\OperationBookingController;

// Operation Types Management - Permission-based
Route::middleware(['auth'])->prefix('operations')->name('operations.')->group(function () {
    // IMPORTANT: Specific routes MUST come BEFORE dynamic {operation} routes

    // Create routes (BEFORE {operation})
    Route::middleware(['permission:operations.create'])->group(function () {
        Route::get('/create', [OperationController::class, 'create'])->name('create');
        Route::post('/', [OperationController::class, 'store'])->name('store');
    });

    // Active list route (BEFORE {operation})
    Route::middleware(['permission:operations.view'])->group(function () {
        Route::get('/active/list', [OperationController::class, 'getActiveOperations'])->name('active-list');
    });

    // View routes
    Route::middleware(['permission:operations.view'])->group(function () {
        Route::get('/', [OperationController::class, 'index'])->name('index');
        Route::get('/{operation}', [OperationController::class, 'show'])->name('show');
    });

    // Edit routes (BEFORE {operation} to avoid conflicts)
    Route::middleware(['permission:operations.edit', 'super-admin-only'])->group(function () {
        Route::get('/{operation}/edit', [OperationController::class, 'edit'])->name('edit');
        Route::put('/{operation}', [OperationController::class, 'update'])->name('update');
        Route::patch('/{operation}/toggle-status', [OperationController::class, 'toggleStatus'])->name('toggle-status');
    });

    // Delete routes
    Route::middleware(['permission:operations.delete', 'super-admin-only'])->group(function () {
        Route::delete('/{operation}', [OperationController::class, 'destroy'])->name('destroy');
    });
});

// Operation Bookings - Permission-based
Route::middleware(['auth'])->prefix('operation-bookings')->name('operation-bookings.')->group(function () {
    // IMPORTANT: Specific routes MUST come BEFORE dynamic {operationBooking} routes

    // Create routes (BEFORE {operationBooking})
    Route::middleware(['permission:operation-bookings.create'])->group(function () {
        Route::get('/create', [OperationBookingController::class, 'create'])->name('create');
        Route::post('/', [OperationBookingController::class, 'store'])->name('store');
        Route::get('/search-patients', [OperationBookingController::class, 'searchPatients'])->name('search-patients');
    });

    // Today route (BEFORE {operationBooking})
    Route::middleware(['permission:operation-bookings.view'])->group(function () {
        Route::get('/today', [OperationBookingController::class, 'today'])->name('today');
    });

    // View routes
    Route::middleware(['permission:operation-bookings.view'])->group(function () {
        Route::get('/', [OperationBookingController::class, 'index'])->name('index');
        Route::get('/{operationBooking}', [OperationBookingController::class, 'show'])->name('show');
        Route::get('/{operationBooking}/receipt', [OperationBookingController::class, 'receipt'])->name('receipt');
    });

    // Edit routes (BEFORE other {operationBooking} routes to prioritize /edit)
    Route::middleware(['permission:operation-bookings.edit', 'super-admin-only'])->group(function () {
        Route::get('/{operationBooking}/edit', [OperationBookingController::class, 'edit'])->name('edit');
        Route::put('/{operationBooking}', [OperationBookingController::class, 'update'])->name('update');
    });

    // Payment routes
    Route::middleware(['permission:operation-bookings.payment'])->group(function () {
        Route::post('/{operationBooking}/payment', [OperationBookingController::class, 'addPayment'])->name('add-payment');
    });

    // Confirm route
    Route::middleware(['permission:operation-bookings.confirm'])->group(function () {
        Route::patch('/{operationBooking}/confirm', [OperationBookingController::class, 'confirm'])->name('confirm');
    });

    // Complete route
    Route::middleware(['permission:operation-bookings.complete'])->group(function () {
        Route::patch('/{operationBooking}/complete', [OperationBookingController::class, 'complete'])->name('complete');
    });

    // Cancel route
    Route::middleware(['permission:operation-bookings.cancel'])->group(function () {
        Route::patch('/{operationBooking}/cancel', [OperationBookingController::class, 'cancel'])->name('cancel');
    });

    // Reschedule route
    Route::middleware(['permission:operation-bookings.reschedule'])->group(function () {
        Route::patch('/{operationBooking}/reschedule', [OperationBookingController::class, 'reschedule'])->name('reschedule');
    });

    // Delete route
    Route::middleware(['permission:operation-bookings.delete', 'super-admin-only'])->group(function () {
        Route::delete('/{operationBooking}', [OperationBookingController::class, 'destroy'])->name('destroy');
    });
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
