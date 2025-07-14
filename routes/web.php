<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceptionistDashboardController;
use App\Http\Controllers\RefractionistDashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VisionTestController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
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

    Route::middleware(['auth', 'refractionist'])->group(function () {
        Route::get('/vision-tests', [VisionTestController::class, 'index'])->name('visiontests.index');
        Route::get('/vision-tests/{visiontest}', [VisionTestController::class, 'show'])->name('visiontests.show');
        Route::get('/vision-tests/{visiontest}/print', [VisionTestController::class, 'print'])->name('visiontests.print');
    });

    // Refractionist only routes
    Route::middleware(['auth', 'refractionist'])->group(function () {
        Route::get('/patients/{patient}/vision-tests/create', [VisionTestController::class, 'create'])->name('visiontests.create');
        Route::post('/patients/{patient}/vision-tests', [VisionTestController::class, 'store'])->name('visiontests.store');
        Route::get('/vision-tests/{visiontest}/edit', [VisionTestController::class, 'edit'])->name('visiontests.edit');
        Route::put('/vision-tests/{visiontest}', [VisionTestController::class, 'update'])->name('visiontests.update');
    });

    // Refractionist Dashboard Routes
    Route::middleware(['auth', 'refractionist'])->prefix('refractionist')->name('refractionist.')->group(function () {
        Route::get('/dashboard', [RefractionistDashboardController::class, 'index'])->name('dashboard');
        Route::post('/start-vision-test/{patient}', [RefractionistDashboardController::class, 'startVisionTest'])->name('start-vision-test');
        Route::post('/mark-priority/{patient}', [RefractionistDashboardController::class, 'markAsPriority'])->name('mark-priority');
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
    Route::get('/prescriptions/{prescription}', [PrescriptionController::class, 'show'])->name('prescriptions.show');
    Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit')->middleware('doctor');
    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update')->middleware('doctor');
    Route::get('/prescriptions/{prescription}/print', [PrescriptionController::class, 'print'])->name('prescriptions.print');

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

Route::middleware(['auth', 'refractionist'])->prefix('refractionist')->name('refractionist.')->group(function () {
    Route::get('/dashboard', [RefractionistDashboardController::class, 'index'])->name('dashboard');
    Route::post('/start-vision-test/{patient}', [RefractionistDashboardController::class, 'startVisionTest'])->name('start-vision-test');
    Route::get('/queue-position/{patient}', [RefractionistDashboardController::class, 'getQueuePosition'])->name('queue-position');
    Route::get('/queue-updates', [RefractionistDashboardController::class, 'getQueueUpdates'])->name('queue-updates');
    Route::post('/mark-priority/{patient}', [RefractionistDashboardController::class, 'markAsPriority'])->name('mark-priority');
    Route::get('/today-performance', [RefractionistDashboardController::class, 'getTodayPerformance'])->name('today-performance');
    Route::get('/performance', [RefractionistDashboardController::class, 'performanceReport'])->name('performance');
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

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
