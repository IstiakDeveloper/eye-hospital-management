<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Permission;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use App\Models\VisionTest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function performanceRole(string $name, array $permissions = []): Role
{
    $role = Role::query()->create([
        'name' => $name,
        'description' => $name,
    ]);

    foreach ($permissions as $permissionName) {
        $permission = Permission::query()->create([
            'name' => $permissionName,
            'display_name' => $permissionName,
            'category' => 'test',
        ]);
        $role->permissions()->attach($permission->id);
    }

    return $role;
}

function performanceUser(Role $role): User
{
    return User::factory()->create([
        'role_id' => $role->id,
    ]);
}

test('full page loads include ziggy once and omit the random quote', function () {
    $user = performanceUser(performanceRole('Clerk'));
    $middleware = app(HandleInertiaRequests::class);
    $session = app('session.store');
    $session->start();

    $fullLoad = Request::create('/profile', 'GET');
    $fullLoad->setLaravelSession($session);
    $shared = $middleware->share($fullLoad);

    expect($shared)->not->toHaveKey('quote')
        ->and($shared)->toHaveKey('ziggy');
    expect($shared['ziggy']())->toHaveKeys(['routes', 'location']);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('ziggy')->missing('quote'));

    $inertiaLoad = Request::create('/profile', 'GET');
    $inertiaLoad->setLaravelSession($session);
    $inertiaLoad->headers->set('X-Inertia', 'true');

    expect($middleware->share($inertiaLoad))->not->toHaveKey('ziggy');
});

test('permission names are cached and forgotten when the role changes', function () {
    $role = performanceRole('Reception', ['patients.view']);
    $user = performanceUser($role);

    $this->actingAs($user)
        ->get(route('patients.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.permissions', ['patients.view']));

    expect(Cache::has(User::inertiaPermissionCacheKey($user->id)))->toBeTrue();

    $role->permissions()->detach();

    $this->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.permissions', ['patients.view']));

    User::forgetInertiaPermissionCacheForRole($role->id);

    expect(Cache::has(User::inertiaPermissionCacheKey($user->id)))->toBeFalse();

    $this->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.permissions', []));

    $this->get(route('patients.index'))->assertForbidden();
});

test('a role without the patient permission cannot open the patient list', function () {
    $user = performanceUser(performanceRole('No Access'));

    $this->actingAs($user)
        ->get(route('patients.index'))
        ->assertForbidden();
});

test('doctor dashboard marks vision tests and prescriptions without per-visit queries', function () {
    $user = performanceUser(performanceRole('Doctor', ['dashboard.doctor']));
    $doctor = Doctor::query()->create([
        'user_id' => $user->id,
        'consultation_fee' => 500,
        'is_available' => true,
    ]);
    $patient = Patient::query()->create([
        'patient_id' => 'P-100',
        'name' => 'Queue Patient',
        'phone' => '01700000001',
    ]);
    $visit = PatientVisit::query()->create([
        'visit_id' => 'V-100',
        'patient_id' => $patient->id,
        'selected_doctor_id' => $doctor->id,
        'overall_status' => 'prescription',
        'payment_status' => 'paid',
        'vision_test_status' => 'completed',
        'created_by' => $user->id,
    ]);
    VisionTest::query()->create([
        'patient_id' => $patient->id,
        'visit_id' => $visit->id,
        'test_date' => now(),
        'performed_by' => $user->id,
    ]);
    Prescription::query()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'visit_id' => $visit->id,
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('doctor.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('todaysActiveVisits', 1)
            ->where('todaysActiveVisits.0.has_vision_test', true)
            ->where('todaysActiveVisits.0.has_prescription', true)
            ->where('todaysActiveVisits.0.patient_name', 'Queue Patient')
            ->where('todayStats.total_visits', 1)
            ->has('recentPrescriptions', 1)
            ->where('recentPrescriptions.0.visit_id', 'V-100')
            ->where('recentPrescriptions.0.medicines_count', 0));
});

test('patient index keeps totals from the latest visit without loading every payment', function () {
    $user = performanceUser(performanceRole('Front Desk', ['patients.view']));
    $olderDoctorUser = performanceUser(performanceRole('Older Doctor'));
    $latestDoctorUser = performanceUser(performanceRole('Latest Doctor'));
    $olderDoctor = Doctor::query()->create(['user_id' => $olderDoctorUser->id, 'is_available' => true]);
    $latestDoctor = Doctor::query()->create(['user_id' => $latestDoctorUser->id, 'is_available' => true]);
    $patient = Patient::query()->create([
        'patient_id' => 'P-200',
        'name' => 'Listed Patient',
        'phone' => '01700000002',
        'registered_by' => $user->id,
    ]);

    PatientVisit::query()->create([
        'visit_id' => 'V-200',
        'patient_id' => $patient->id,
        'selected_doctor_id' => $olderDoctor->id,
        'total_paid' => 100,
        'overall_status' => 'completed',
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);
    PatientVisit::query()->create([
        'visit_id' => 'V-201',
        'patient_id' => $patient->id,
        'selected_doctor_id' => $latestDoctor->id,
        'total_paid' => 50,
        'overall_status' => 'completed',
    ]);

    $this->actingAs($user)
        ->get(route('patients.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('patients.data.0.total_visits', 2)
            ->where('patients.data.0.total_paid', 150)
            ->where('patients.data.0.last_doctor', $latestDoctorUser->name)
            ->where('patients.data.0.all_doctors', fn ($names) => collect($names)->sort()->values()->all()
                === collect([$olderDoctorUser->name, $latestDoctorUser->name])->sort()->values()->all()));
});

test('waiting room data is cached and the refractionist average uses one query', function () {
    $doctorUser = performanceUser(performanceRole('Display Doctor'));
    Doctor::query()->create([
        'user_id' => $doctorUser->id,
        'is_available' => true,
    ]);

    $this->get(route('api.appointment.display.data'))
        ->assertOk()
        ->assertJsonCount(1, 'doctors')
        ->assertJsonPath('doctors.0.user.name', $doctorUser->name);

    expect(Cache::has('appointment-display.doctors'))->toBeTrue();

    $refractionist = performanceUser(performanceRole('Refractionist', ['dashboard.refractionist']));
    $patient = Patient::query()->create([
        'patient_id' => 'P-300',
        'name' => 'Waiting Patient',
        'phone' => '01700000003',
    ]);
    PatientVisit::query()->create([
        'visit_id' => 'V-300',
        'patient_id' => $patient->id,
        'payment_status' => 'paid',
        'vision_test_status' => 'pending',
        'overall_status' => 'vision_test',
        'payment_completed_at' => now()->subMinutes(10),
        'final_amount' => 0,
        'total_paid' => 0,
    ]);

    $this->actingAs($refractionist)
        ->get(route('refractionist.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('todayStats.total_waiting', 1)
            ->where('todayStats.avg_waiting_time', fn ($minutes) => $minutes >= 9 && $minutes <= 11));
});
