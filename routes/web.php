<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AppointmentDisplayController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\HospitalAccount\HospitalAccountController;
use App\Http\Controllers\MedicineAccount\MedicineAccountController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\MedicineCornerController;
use App\Http\Controllers\MedicineSellerDashboardController;
use App\Http\Controllers\OpticsAccount\OpticsAccountController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientVisitController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceptionistDashboardController;
use App\Http\Controllers\RefractionistDashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VisionTestController;
use App\Models\Patient;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
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

    if ($user && $user->role) {
        $roleName = $user->role->name;

        $dashboardRoutes = [
            'Receptionist' => 'receptionist.dashboard',
            'Doctor' => 'doctor.dashboard',
            'Refractionist' => 'refractionist.dashboard',
            'Super Admin' => 'dashboard'
        ];

        // Role-based redirect
        $routeName = $dashboardRoutes[$roleName] ?? 'dashboard';

        // Route exists কিনা check করুন
        if (Route::has($routeName)) {
            return redirect()->route($routeName);
        }
    }

    // Fallback to default dashboard
    return redirect()->route('dashboard');
});

Route::middleware(['auth'])->group(function () {
    // Dashboard - All authenticated users
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile - All authenticated users
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Patients - All can view, Receptionist & Super Admin can create/edit/delete
    Route::get('/patients/search', [PatientController::class, 'search'])->name('patients.search');
    Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
    Route::get('/patients/create', [PatientController::class, 'create'])->name('patients.create')->middleware('receptionist');
    Route::post('/patients', [PatientController::class, 'store'])->name('patients.store')->middleware('receptionist');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('patients.show');

    Route::get('/patients/{patient}/edit', [PatientController::class, 'edit'])->name('patients.edit')->middleware('receptionist');
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('patients.update')->middleware('receptionist');
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy')->middleware('receptionist');

    Route::post('patients/calculate-costs', [PatientController::class, 'calculateCosts'])->name('patients.calculate-costs');
    Route::post('patients', [PatientController::class, 'store'])->name('patients.store');
    Route::get('patients', [PatientController::class, 'index'])->name('patients.index');
    Route::get('patients/{patient}/receipt', [PatientController::class, 'receipt'])
        ->name('patients.receipt');

    Route::get('/patients/{patient}/visits/{visit}/receipt', [PatientController::class, 'visitReceipt'])
        ->name('patients.visit.receipt');
    Route::post('/refractionist/start-vision-test', [RefractionistDashboardController::class, 'startVisionTest'])
        ->name('refractionist.start-vision-test');

    // Vision Test Routes - Accessible by Refractionist and Doctor
    Route::middleware(['auth'])->group(function () {
        Route::get('/vision-tests', [VisionTestController::class, 'index'])->name('visiontests.index');
        Route::get('/vision-tests/{visiontest}', [VisionTestController::class, 'show'])->name('visiontests.show');
        Route::get('/vision-tests/{visiontest}/print', [VisionTestController::class, 'print'])->name('visiontests.print');
        Route::get('/visiontests/{patient}/download-blank', [VisionTestController::class, 'downloadBlankReport'])
            ->name('visiontests.download-blank');
    });

    // Refractionist only routes
    Route::middleware(['auth', 'refractionist'])->group(function () {
        // Vision Test Routes
        Route::get('/patients/{patient}/vision-tests/create', [VisionTestController::class, 'create'])->name('visiontests.create');
        Route::post('/patients/{patient}/vision-tests', [VisionTestController::class, 'store'])->name('visiontests.store');
        Route::get('/vision-tests/{visiontest}/edit', [VisionTestController::class, 'edit'])->name('visiontests.edit');
        Route::put('/vision-tests/{visiontest}', [VisionTestController::class, 'update'])->name('visiontests.update');

        // Refractionist Dashboard Routes
        Route::get('/refractionist/dashboard', [RefractionistDashboardController::class, 'index'])->name('refractionist.dashboard');
        Route::post('/refractionist/start-vision-test/{visit}', [RefractionistDashboardController::class, 'startVisionTest'])->name('refractionist.start-vision-test');
        Route::post('/refractionist/mark-priority/{visit}', [RefractionistDashboardController::class, 'markAsPriority'])->name('refractionist.mark-priority');
        Route::get('/refractionist/queue-updates', [RefractionistDashboardController::class, 'getQueueUpdates'])->name('refractionist.queue-updates');
        Route::get('/refractionist/performance', [RefractionistDashboardController::class, 'getTodayPerformance'])->name('refractionist.performance');
    });

    // Doctor Routes
    Route::middleware(['auth', 'doctor'])->prefix('doctor')->name('doctor.')->group(function () {
        Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/patients/{patient}', [DoctorDashboardController::class, 'viewPatient'])->name('view-patient');
        Route::post('/appointments/{appointment}/complete', [DoctorDashboardController::class, 'completeAppointment'])->name('complete-appointment');
        Route::get('/next-patient', [DoctorDashboardController::class, 'getNextPatient'])->name('next-patient');
        Route::get('/performance-stats', [DoctorDashboardController::class, 'getPerformanceStats'])->name('performance-stats');
        Route::get('/search-patients', [DoctorDashboardController::class, 'searchPatients'])->name('search-patients');
        Route::put('/appointments/{appointment}/status', [DoctorDashboardController::class, 'updateAppointmentStatus'])->name('update-appointment-status');

        // Doctor Vision Test Access (Read Only)
        Route::get('/vision-tests', [VisionTestController::class, 'index'])->name('vision-tests.index');
        Route::get('/vision-tests/{visiontest}', [VisionTestController::class, 'show'])->name('vision-tests.show');
        Route::get('/vision-tests/{visiontest}/print', [VisionTestController::class, 'print'])->name('vision-tests.print');
    });

    // Refractionist Dashboard Routes
    Route::middleware(['auth', 'refractionist'])->prefix('refractionist')->name('refractionist.')->group(function () {
        Route::get('/dashboard', [RefractionistDashboardController::class, 'index'])->name('dashboard');
        Route::post('/start-vision-test/{patient}', [RefractionistDashboardController::class, 'startVisionTest'])->name('start-vision-test');
        Route::post('/mark-priority/{patient}', [RefractionistDashboardController::class, 'markAsPriority'])->name('mark-priority');
        Route::get('/queue-position/{patient}', [RefractionistDashboardController::class, 'getQueuePosition'])->name('queue-position');
        Route::get('/queue-updates', [RefractionistDashboardController::class, 'getQueueUpdates'])->name('queue-updates');
        Route::get('/today-performance', [RefractionistDashboardController::class, 'getTodayPerformance'])->name('today-performance');
        Route::get('/performance', [RefractionistDashboardController::class, 'performanceReport'])->name('performance');
    });

    // Appointments - All can view, Receptionist & Super Admin can create/edit/delete
    Route::get('/appointments/today', [AppointmentController::class, 'today'])->name('appointments.today');
    Route::get('/patients/{patient}/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create.patient')->middleware('receptionist');
    Route::put('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status')->middleware('doctor-or-receptionist');
    Route::get('/appointments/{appointment}/print', [AppointmentController::class, 'print'])->name('appointments.print');
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create')->middleware('receptionist');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store')->middleware('receptionist');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::get('/appointments/{appointment}/edit', [AppointmentController::class, 'edit'])->name('appointments.edit')->middleware('receptionist');
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update')->middleware('receptionist');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy')->middleware('receptionist');

    // Prescriptions - All can view, Doctor & Super Admin can create/edit
    Route::get('/patients/{patient}/prescriptions/create', [PrescriptionController::class, 'create'])->name('prescriptions.create.patient')->middleware('doctor');
    Route::post('/patients/{patient}/prescriptions', [PrescriptionController::class, 'store'])->name('prescriptions.store')->middleware('doctor');
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show'])->name('prescriptions.show')->middleware('doctor');
    Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit')->middleware('doctor');
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update')->middleware('doctor');
    Route::get('/prescriptions/{prescription}/print', [PrescriptionController::class, 'print'])->name('prescriptions.print');
    Route::get('/prescriptions/{patient}/download-blank', [PrescriptionController::class, 'downloadBlankPrescription'])
        ->name('prescriptions.download-blank');

    // Super Admin Routes - Only Super Admin
    Route::middleware(['super-admin'])->group(function () {
        // Users
        Route::resource('users', UserController::class);
        // Doctors
        Route::put('/doctors/{doctor}/availability', [DoctorController::class, 'updateAvailability'])->name('doctors.availability');
        Route::resource('doctors', DoctorController::class);
        // Medicines
        Route::put('/medicines/{medicine}/toggle-status', [MedicineController::class, 'toggleStatus'])->name('medicines.toggle');
        Route::resource('medicines', MedicineController::class);
    });
});

Route::middleware(['auth'])->prefix('receptionist')->name('receptionist.')->group(function () {
    Route::get('/dashboard', [ReceptionistDashboardController::class, 'index'])->name('dashboard');
    Route::post('/quick-search', [ReceptionistDashboardController::class, 'quickSearch'])->name('quick-search');
    Route::post('/quick-register', [ReceptionistDashboardController::class, 'quickRegister'])->name('quick-register');
    Route::get('/today-activity', [ReceptionistDashboardController::class, 'getTodayActivity'])->name('today-activity');
    Route::get('/payment-method-breakdown', [ReceptionistDashboardController::class, 'getTodayPaymentMethodBreakdown'])->name('payment-method-breakdown');
    Route::post('/mark-completed/{patient}', [ReceptionistDashboardController::class, 'markPatientCompleted'])->name('mark-completed');
    Route::get('/hourly-stats', [ReceptionistDashboardController::class, 'getTodayHourlyStats'])->name('hourly-stats');
});

Route::prefix('visits')->name('visits.')->group(function () {
    Route::get('/', [PatientVisitController::class, 'index'])->name('index');
    Route::post('/', [PatientVisitController::class, 'store'])->name('store');
    Route::get('/{visit}', [PatientVisitController::class, 'show'])->name('show');
    Route::get('/{visit}/receipt', [PatientVisitController::class, 'receipt'])->name('receipt');
    Route::patch('/{visit}/status', [PatientVisitController::class, 'updateStatus'])->name('update-status');

    // Queue management
    Route::get('/queue/vision-test', [PatientVisitController::class, 'readyForVisionTest'])->name('ready-for-vision-test');
    Route::get('/queue/prescription', [PatientVisitController::class, 'readyForPrescription'])->name('ready-for-prescription');
});

Route::middleware(['auth'])->prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/dashboard', [ReportController::class, 'dashboard'])->name('dashboard');
    Route::get('/patients', [ReportController::class, 'patients'])->name('patients');
    Route::get('/doctors', [ReportController::class, 'doctors'])->name('doctors');
    Route::get('/appointments', [ReportController::class, 'appointments'])->name('appointments');
    Route::get('/vision-tests', [ReportController::class, 'visionTests'])->name('vision-tests');
    Route::get('/prescriptions', [ReportController::class, 'prescriptions'])->name('prescriptions');
    Route::get('/revenue', [ReportController::class, 'revenue'])->name('revenue');
    Route::get('/medicines', [ReportController::class, 'medicines'])->name('medicines');
});

Route::get('/appointment-display', [AppointmentDisplayController::class, 'index'])
    ->name('appointment.display');

// API route
Route::get('/api/appointment-display-data', [AppointmentDisplayController::class, 'getData'])
    ->name('api.appointment.display.data');




Route::prefix('medicine-corner')->middleware(['auth', 'super-admin'])->group(function () {
    // Page routes
    Route::get('/stock', [MedicineCornerController::class, 'stock'])->name('medicine.stock');
    Route::get('/medicines', [MedicineCornerController::class, 'medicines'])->name('medicine.list');
    Route::get('/purchase', [MedicineCornerController::class, 'purchase'])->name('medicine.purchase');
    Route::get('/reports', [MedicineCornerController::class, 'reports'])->name('medicine.reports');
    Route::get('/alerts', [MedicineCornerController::class, 'alerts'])->name('medicine.alerts');

    // API routes
    Route::post('/medicine/store', [MedicineCornerController::class, 'storeMedicine']);
    Route::post('/stock/add', [MedicineCornerController::class, 'addStock']);
    Route::post('/stock/adjust', [MedicineCornerController::class, 'adjustStock']);
    Route::put('/medicine/{medicine}', [MedicineCornerController::class, 'updateMedicine']);
    Route::put('/medicine/{medicine}/alert', [MedicineCornerController::class, 'updateStockAlert']);
    Route::get('/medicine/{medicine}/details', [MedicineCornerController::class, 'getMedicineDetails']);

    Route::get('/sales', [MedicineCornerController::class, 'sales'])->name('medicine-corner.sales');
    Route::get('/sales/{sale}', [MedicineCornerController::class, 'saleDetails'])->name('medicine-corner.sale-details');
    Route::get('/sales/{sale}/edit', [MedicineCornerController::class, 'editSale'])->name('medicine-corner.edit-sale');
    Route::put('/sales/{sale}', [MedicineCornerController::class, 'updateSale'])->name('medicine-corner.update-sale');
    Route::put('/sales/{sale}/payment', [MedicineCornerController::class, 'updatePayment'])->name('medicine-corner.update-payment');
    Route::delete('/sales/{sale}', [MedicineCornerController::class, 'deleteSale'])->name('medicine-corner.delete-sale');
    Route::post('/sales/bulk-action', [MedicineCornerController::class, 'bulkAction'])->name('medicine-corner.bulk-action');
    Route::get('/analytics/sales', [MedicineCornerController::class, 'salesAnalytics'])->name('medicine-corner.sales-analytics');
});


Route::prefix('medicine-seller')->middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [MedicineSellerDashboardController::class, 'index'])->name('medicine-seller.dashboard');

    // POS System
    Route::get('/pos', [MedicineSellerDashboardController::class, 'pos'])->name('medicine-seller.pos');
    Route::post('/pos/sale', [MedicineSellerDashboardController::class, 'processSale'])->name('medicine-seller.process-sale');

    // Sales Management
    Route::get('/sales', [MedicineSellerDashboardController::class, 'salesHistory'])->name('medicine-seller.sales');
    Route::get('/sales/{sale}', [MedicineSellerDashboardController::class, 'saleDetails'])->name('medicine-seller.sale-details');
    Route::put('/sales/{sale}/payment', [MedicineSellerDashboardController::class, 'updatePayment'])->name('medicine-seller.update-payment');

    // Reports
    Route::get('/my-report', [MedicineSellerDashboardController::class, 'myReport'])->name('medicine-seller.report');

    // API endpoints
    Route::get('/api/search-medicines', [MedicineSellerDashboardController::class, 'searchMedicines'])->name('medicine-seller.search-medicines');
    Route::get('/api/medicine/{medicine}/stock', [MedicineSellerDashboardController::class, 'getMedicineStock'])->name('medicine-seller.medicine-stock');
});

// Default redirect for Medicine Seller
Route::get('/medicine-seller', function () {
    return redirect()->route('medicine-seller.dashboard');
})->middleware(['auth', 'role:Medicine Seller']);


Route::post('/patient/{patient}/save-qr', function (Patient $patient, Request $request) {
    try {
        // Log the incoming request for debugging
        Log::info('QR save request received', [
            'patient_id' => $patient->id,
            'patient_code' => $patient->patient_id,
            'current_qr_path' => $patient->qr_code_image_path
        ]);

        // Validate request
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








Route::middleware(['auth', 'super-admin'])->group(function () {

    Route::prefix('hospital-account')->name('hospital-account.')->group(function () {
        Route::get('/', [HospitalAccountController::class, 'index'])->name('dashboard');
        Route::post('/fund-in', [HospitalAccountController::class, 'fundIn'])->name('fund-in');
        Route::post('/fund-out', [HospitalAccountController::class, 'fundOut'])->name('fund-out');
        Route::post('/expense', [HospitalAccountController::class, 'addExpense'])->name('expense');
        Route::get('/transactions', [HospitalAccountController::class, 'transactions'])->name('transactions');
        Route::get('/fund-history', [HospitalAccountController::class, 'fundHistory'])->name('fund-history');
        Route::get('/categories', [HospitalAccountController::class, 'categories'])->name('categories');
        Route::post('/categories', [HospitalAccountController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [HospitalAccountController::class, 'updateCategory'])->name('categories.update');
        Route::get('/monthly-report', [HospitalAccountController::class, 'monthlyReport'])->name('monthly-report');
        Route::get('/balance-sheet', [HospitalAccountController::class, 'balanceSheet'])->name('balance-sheet');
    });

    Route::prefix('medicine-account')->name('medicine-account.')->group(function () {
        Route::get('/', [MedicineAccountController::class, 'index'])->name('dashboard');
        Route::post('/fund-in', [MedicineAccountController::class, 'fundIn'])->name('fund-in');
        Route::post('/fund-out', [MedicineAccountController::class, 'fundOut'])->name('fund-out');
        Route::post('/expense', [MedicineAccountController::class, 'addExpense'])->name('expense');
        Route::get('/transactions', [MedicineAccountController::class, 'transactions'])->name('transactions');
        Route::get('/fund-history', [MedicineAccountController::class, 'fundHistory'])->name('fund-history');
        Route::get('/categories', [MedicineAccountController::class, 'categories'])->name('categories');
        Route::post('/categories', [MedicineAccountController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [MedicineAccountController::class, 'updateCategory'])->name('categories.update');
        Route::get('/monthly-report', [MedicineAccountController::class, 'monthlyReport'])->name('monthly-report');
        Route::get('/balance-sheet', [MedicineAccountController::class, 'balanceSheet'])->name('balance-sheet');
        Route::get('/analytics', [MedicineAccountController::class, 'analytics'])->name('analytics');
        Route::get('/stock-value-report', [MedicineAccountController::class, 'stockValueReport'])->name('stock-value-report');
        Route::post('/export', [MedicineAccountController::class, 'exportReport'])->name('export');
    });

    Route::prefix('optics-account')->name('optics-account.')->group(function () {
        Route::get('/', [OpticsAccountController::class, 'index'])->name('dashboard');
        Route::post('/fund-in', [OpticsAccountController::class, 'fundIn'])->name('fund-in');
        Route::post('/fund-out', [OpticsAccountController::class, 'fundOut'])->name('fund-out');
        Route::post('/expense', [OpticsAccountController::class, 'addExpense'])->name('expense');
        Route::get('/transactions', [OpticsAccountController::class, 'transactions'])->name('transactions');
        Route::get('/fund-history', [OpticsAccountController::class, 'fundHistory'])->name('fund-history');
        Route::get('/categories', [OpticsAccountController::class, 'categories'])->name('categories');
        Route::post('/categories', [OpticsAccountController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [OpticsAccountController::class, 'updateCategory'])->name('categories.update');
        Route::get('/monthly-report', [OpticsAccountController::class, 'monthlyReport'])->name('monthly-report');
        Route::get('/balance-sheet', [OpticsAccountController::class, 'balanceSheet'])->name('balance-sheet');
        Route::get('/analytics', [OpticsAccountController::class, 'analytics'])->name('analytics');
        Route::get('/inventory-report', [OpticsAccountController::class, 'inventoryReport'])->name('inventory-report');
        Route::post('/export', [OpticsAccountController::class, 'exportReport'])->name('export');
    });
});



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
