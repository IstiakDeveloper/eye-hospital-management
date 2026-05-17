<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('all employees attendance calendar page renders', function () {
    $role = Role::query()->create([
        'name' => 'Emp Cal Viewer '.str_replace('.', '', uniqid('', true)),
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

    $response = $this->actingAs($actor)->get(route('employees.attendance-calendar'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Employees/AttendanceCalendar')
        ->has('matrix.rows')
        ->has('matrix.day_dates'));
});
