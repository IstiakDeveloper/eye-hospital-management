<?php

use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('employee show page renders for users with employees.view', function () {
    $role = Role::query()->create([
        'name' => 'Emp Viewer '.str_replace('.', '', uniqid('', true)),
        'description' => 'test',
    ]);

    $permission = Permission::query()->create([
        'name' => 'employees.view',
        'display_name' => 'View Employees',
        'category' => 'employees',
        'description' => null,
    ]);
    $role->permissions()->attach($permission);

    $actor = User::factory()->create([
        'role_id' => $role->id,
    ]);

    $employee = Employee::query()->create([
        'employee_code' => '88001',
        'name' => 'Show Page Tester',
        'is_active' => true,
        'zkteco_user_id' => 501,
    ]);

    $response = $this->actingAs($actor)->get(route('employees.show', $employee));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Employees/Show')
        ->has('employee')
        ->where('employee.name', 'Show Page Tester')
        ->has('schedule.expected_check_in')
        ->has('sheet.rows'));
});
