<?php

use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function seedEmployeesViewPermission(Role $role): void
{
    $permission = Permission::query()->create([
        'name' => 'employees.view',
        'display_name' => 'View Employees',
        'category' => 'employees',
        'description' => null,
    ]);
    $role->permissions()->attach($permission);
}

test('super admin can store manual attendance for an employee', function () {
    $role = Role::query()->create([
        'name' => 'Super Admin',
        'description' => 'test',
    ]);
    seedEmployeesViewPermission($role);

    $actor = User::factory()->create([
        'role_id' => $role->id,
    ]);

    $employee = Employee::query()->create([
        'employee_code' => 'MAN-001',
        'name' => 'Manual Attendance Tester',
        'is_active' => true,
        'zkteco_user_id' => null,
    ]);

    $response = $this->actingAs($actor)->from(route('employees.index'))->post(route('employees.manual-attendance.store'), [
        'employee_id' => $employee->id,
        'work_date' => '2026-05-15',
        'status' => 'present',
        'first_in' => '09:05',
        'last_out' => '17:30',
        'minutes_late' => null,
    ]);

    $response->assertRedirect();

    $this->assertTrue(
        AttendanceDayRecord::query()
            ->where('employee_id', $employee->id)
            ->whereDate('work_date', '2026-05-15')
            ->where('status', 'present')
            ->exists()
    );

    $record = AttendanceDayRecord::query()->where('employee_id', $employee->id)->whereDate('work_date', '2026-05-15')->first();
    expect($record->first_in_at?->format('H:i'))->toBe('09:05');
    expect($record->last_out_at?->format('H:i'))->toBe('17:30');
});

test('non super admin cannot store manual attendance', function () {
    $role = Role::query()->create([
        'name' => 'Staff '.str_replace('.', '', uniqid('', true)),
        'description' => 'test',
    ]);
    seedEmployeesViewPermission($role);

    $actor = User::factory()->create([
        'role_id' => $role->id,
    ]);

    $employee = Employee::query()->create([
        'employee_code' => 'MAN-002',
        'name' => 'No Manual',
        'is_active' => true,
        'zkteco_user_id' => null,
    ]);

    $this->actingAs($actor)->from(route('employees.index'))->post(route('employees.manual-attendance.store'), [
        'employee_id' => $employee->id,
        'work_date' => '2026-05-16',
        'status' => 'absent',
    ])->assertForbidden();
});

test('employees index passes manual attendance options to super admin', function () {
    $role = Role::query()->create([
        'name' => 'Super Admin',
        'description' => 'test',
    ]);
    seedEmployeesViewPermission($role);

    $actor = User::factory()->create([
        'role_id' => $role->id,
    ]);

    Employee::query()->create([
        'employee_code' => 'IDX-001',
        'name' => 'List Employee',
        'is_active' => true,
        'zkteco_user_id' => null,
    ]);

    $this->actingAs($actor)->get(route('employees.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Index')
            ->where('canSetManualAttendance', true)
            ->has('employeeOptions.0')
            ->has('statusOptions.0'));
});

test('employees index omits manual attendance data for non super admin', function () {
    $role = Role::query()->create([
        'name' => 'Staff '.str_replace('.', '', uniqid('', true)),
        'description' => 'test',
    ]);
    seedEmployeesViewPermission($role);

    $actor = User::factory()->create([
        'role_id' => $role->id,
    ]);

    Employee::query()->create([
        'employee_code' => 'IDX-002',
        'name' => 'Other',
        'is_active' => true,
        'zkteco_user_id' => null,
    ]);

    $this->actingAs($actor)->get(route('employees.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Index')
            ->where('canSetManualAttendance', false)
            ->where('employeeOptions', [])
            ->where('statusOptions', []));
});
