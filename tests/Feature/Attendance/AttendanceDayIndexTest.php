<?php

use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAttendanceViewer(): User
{
    $role = Role::query()->create([
        'name' => 'Attendance Viewer Role',
        'description' => 'test',
    ]);

    $permission = Permission::query()->create([
        'name' => 'attendance.view',
        'display_name' => 'View attendance',
        'category' => 'attendance',
        'description' => null,
    ]);
    $role->permissions()->attach($permission);

    return User::factory()->create([
        'role_id' => $role->id,
    ]);
}

test('attendance day index requires authentication', function () {
    $this->get(route('attendance.day.index'))->assertRedirect('/login');
});

test('attendance day index shows employee rows with check in out and summary', function () {
    $user = makeAttendanceViewer();

    $employee = Employee::query()->create([
        'employee_code' => 'EMP-001',
        'name' => 'Rahim Ahmed',
        'is_active' => true,
        'zkteco_user_id' => 7,
    ]);

    EmployeeAttendanceSetting::query()->create([
        'employee_id' => $employee->id,
        'expected_check_in' => '09:00:00',
        'expected_check_out' => '18:00:00',
        'grace_minutes' => 10,
        'weekend_days' => [5, 6],
    ]);

    AttendanceDayRecord::query()->create([
        'employee_id' => $employee->id,
        'work_date' => '2026-05-15',
        'first_in_at' => '2026-05-15 09:25:00',
        'last_out_at' => '2026-05-15 17:00:00',
        'status' => 'late',
        'minutes_late' => 25,
        'minutes_worked' => 455,
        'minutes_early_leave' => 60,
        'calculated_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('attendance.day.index', ['date' => '2026-05-15']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Attendance/Index')
            ->where('selectedDate', '2026-05-15')
            ->has('rows', 1)
            ->where('rows.0.employee_code', 'EMP-001')
            ->where('rows.0.name', 'Rahim Ahmed')
            ->where('rows.0.check_in', '09:25')
            ->where('rows.0.check_out', '17:00')
            ->where('rows.0.status', 'late')
            ->where('rows.0.minutes_late', 25)
            ->where('rows.0.minutes_worked', 455)
            ->where('rows.0.minutes_early_leave', 60)
            ->where('summary.late', 1)
            ->where('summary.total', 1));
});
