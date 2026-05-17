<?php

use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array{user: User, role: Role}
 */
function employeeCrudActor(array $permissionNames): array
{
    $role = Role::query()->create([
        'name' => 'Emp CRUD '.str_replace('.', '', uniqid('', true)),
        'description' => 'test',
    ]);

    foreach ($permissionNames as $name) {
        $permission = Permission::query()->firstOrCreate(
            ['name' => $name],
            [
                'display_name' => $name,
                'category' => 'employees',
                'description' => null,
            ]
        );
        $role->permissions()->syncWithoutDetaching([$permission->id]);
    }

    $user = User::factory()->create(['role_id' => $role->id]);

    return ['user' => $user, 'role' => $role];
}

/**
 * @return array<string, mixed>
 */
function validEmployeePayload(array $overrides = []): array
{
    return array_merge([
        'employee_code' => '99001',
        'name' => 'Rahim Uddin',
        'phone' => '01700000000',
        'email' => 'rahim@example.com',
        'department' => 'Nursing',
        'designation' => 'Staff Nurse',
        'date_of_join' => '2024-01-15',
        'is_active' => true,
        'zkteco_user_id' => null,
        'user_id' => null,
        'expected_check_in' => '09:00',
        'expected_check_out' => '18:00',
        'grace_minutes' => 10,
        'weekend_days' => [5, 6],
    ], $overrides);
}

test('identifier service suggests next employee code and zkteco user id', function () {
    Employee::query()->create([
        'employee_code' => '000099',
        'name' => 'Existing A',
        'is_active' => true,
        'zkteco_user_id' => 42,
    ]);

    $service = app(\App\Services\Employees\EmployeeIdentifierService::class);

    expect($service->suggestEmployeeCode())->toBe('000100')
        ->and($service->suggestZktecoUserId())->toBe(43);
});

test('create page provides suggested employee code and zkteco user id', function () {
    ['user' => $actor] = employeeCrudActor(['employees.create']);

    Employee::query()->create([
        'employee_code' => '000050',
        'name' => 'Existing',
        'is_active' => true,
        'zkteco_user_id' => 10,
    ]);

    $this->actingAs($actor)
        ->get(route('employees.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Create')
            ->where('suggested.employee_code', '000051')
            ->where('suggested.zkteco_user_id', 11));
});

test('user with employees.create can store employee with attendance schedule', function () {
    ['user' => $actor] = employeeCrudActor(['employees.create']);

    $response = $this->actingAs($actor)->post(route('employees.store'), validEmployeePayload([
        'employee_code' => '88010',
        'weekend_days' => [0, 6],
        'expected_check_in' => '08:30',
        'expected_check_out' => '17:30',
        'grace_minutes' => 15,
    ]));

    $response->assertRedirect(route('employees.index'));
    $response->assertSessionHas('success');

    $employee = Employee::query()->where('employee_code', '88010')->first();
    expect($employee)->not->toBeNull()
        ->and($employee->name)->toBe('Rahim Uddin')
        ->and($employee->department)->toBe('Nursing');

    $setting = EmployeeAttendanceSetting::query()->where('employee_id', $employee->id)->first();
    expect($setting)->not->toBeNull()
        ->and(substr((string) $setting->expected_check_in, 0, 5))->toBe('08:30')
        ->and(substr((string) $setting->expected_check_out, 0, 5))->toBe('17:30')
        ->and($setting->grace_minutes)->toBe(15)
        ->and($setting->weekend_days)->toBe([0, 6]);
});

test('store rejects duplicate employee code and missing weekend days', function () {
    ['user' => $actor] = employeeCrudActor(['employees.create']);

    Employee::factory()->create(['employee_code' => 'DUP-1']);

    $this->actingAs($actor)
        ->post(route('employees.store'), validEmployeePayload(['employee_code' => 'DUP-1']))
        ->assertSessionHasErrors('employee_code');

    $this->actingAs($actor)
        ->post(route('employees.store'), validEmployeePayload(['weekend_days' => []]))
        ->assertSessionHasErrors('weekend_days');

    $this->actingAs($actor)
        ->post(route('employees.store'), validEmployeePayload([
            'expected_check_in' => '18:00',
            'expected_check_out' => '09:00',
        ]))
        ->assertSessionHasErrors('expected_check_out');
});

test('user can link optional user account when creating employee', function () {
    ['user' => $actor] = employeeCrudActor(['employees.create']);
    ['user' => $linkUser] = employeeCrudActor([]);

    $this->actingAs($actor)
        ->post(route('employees.store'), validEmployeePayload([
            'employee_code' => '88011',
            'user_id' => $linkUser->id,
        ]))
        ->assertRedirect();

    $employee = Employee::query()->where('employee_code', '88011')->first();
    expect($employee?->user_id)->toBe($linkUser->id);

    $this->actingAs($actor)
        ->post(route('employees.store'), validEmployeePayload([
            'employee_code' => '88012',
            'user_id' => $linkUser->id,
        ]))
        ->assertSessionHasErrors('user_id');
});

test('user with employees.edit can update employee and schedule', function () {
    ['user' => $actor] = employeeCrudActor(['employees.edit']);

    $employee = Employee::factory()
        ->withAttendanceSchedule()
        ->create(['employee_code' => '88020', 'name' => 'Before Edit']);

    $this->actingAs($actor)
        ->put(route('employees.update', $employee), validEmployeePayload([
            'employee_code' => '88020',
            'name' => 'After Edit',
            'expected_check_in' => '10:00',
            'expected_check_out' => '19:00',
            'grace_minutes' => 5,
            'weekend_days' => [5],
        ]))
        ->assertRedirect(route('employees.edit', $employee));

    $employee->refresh();
    expect($employee->name)->toBe('After Edit');

    $setting = EmployeeAttendanceSetting::query()->where('employee_id', $employee->id)->first();
    expect(substr((string) $setting->expected_check_in, 0, 5))->toBe('10:00')
        ->and($setting->weekend_days)->toBe([5]);
});

test('edit page requires employees.edit permission', function () {
    $employee = Employee::factory()->create();

    ['user' => $viewer] = employeeCrudActor(['employees.view']);
    $this->actingAs($viewer)
        ->get(route('employees.edit', $employee))
        ->assertForbidden();

    ['user' => $editor] = employeeCrudActor(['employees.edit']);
    $this->actingAs($editor)
        ->get(route('employees.edit', $employee))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Edit')
            ->has('setting.expected_check_in'));
});

test('super admin can delete employee and related attendance data', function () {
    $role = Role::query()->create([
        'name' => 'Super Admin',
        'description' => 'test',
    ]);
    $superAdmin = User::factory()->create(['role_id' => $role->id]);
    expect($superAdmin->isSuperAdmin())->toBeTrue();

    $employee = Employee::factory()->withAttendanceSchedule()->create();
    $employeeId = $employee->id;

    $this->actingAs($superAdmin)
        ->delete(route('employees.destroy', $employee))
        ->assertRedirect(route('employees.index'));

    expect(Employee::query()->find($employeeId))->toBeNull()
        ->and(EmployeeAttendanceSetting::query()->where('employee_id', $employeeId)->exists())->toBeFalse();
});

test('employee show page includes profile schedule and linked user', function () {
    ['user' => $actor] = employeeCrudActor(['employees.view']);
    $linkRole = Role::query()->create(['name' => 'Link Role '.uniqid(), 'description' => 'test']);
    $linkUser = User::factory()->create(['role_id' => $linkRole->id, 'name' => 'Linked Account']);

    $employee = Employee::factory()
        ->withAttendanceSchedule('09:15:00', '18:45:00', 12, [5, 6])
        ->create([
            'employee_code' => '88030',
            'user_id' => $linkUser->id,
        ]);

    $this->actingAs($actor)
        ->get(route('employees.show', $employee))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Show')
            ->where('employee.linked_user.name', 'Linked Account')
            ->where('schedule.expected_check_in', '09:15')
            ->where('schedule.grace_minutes', 12)
            ->has('sheet.rows'));
});

test('employees index lists employees with attendance setting', function () {
    ['user' => $actor] = employeeCrudActor(['employees.view']);

    Employee::factory()
        ->withAttendanceSchedule('08:00:00', '17:00:00')
        ->create(['employee_code' => '88040', 'name' => 'Index Tester']);

    $this->actingAs($actor)
        ->get(route('employees.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Index')
            ->has('employees.data', 1)
            ->where('employees.data.0.name', 'Index Tester')
            ->where('employees.data.0.employee_attendance_setting.expected_check_in', '08:00:00'));
});
