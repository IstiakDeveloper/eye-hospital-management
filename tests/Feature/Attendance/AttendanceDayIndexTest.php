<?php

use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\EmployeeLeave;
use App\Models\EmployeeMovement;
use App\Models\LeaveType;
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

test('attendance report filters records and returns status totals', function () {
    $user = makeAttendanceViewer();
    $employee = Employee::query()->create([
        'employee_code' => 'EMP-002',
        'name' => 'Karim Ahmed',
        'is_active' => true,
    ]);

    AttendanceDayRecord::query()->create([
        'employee_id' => $employee->id,
        'work_date' => '2026-05-15',
        'status' => 'late',
        'minutes_late' => 15,
    ]);
    AttendanceDayRecord::query()->create([
        'employee_id' => $employee->id,
        'work_date' => '2026-05-16',
        'status' => 'absent',
    ]);

    $this->actingAs($user)
        ->get(route('attendance.report', [
            'start_date' => '2026-05-15',
            'end_date' => '2026-05-15',
            'employee_id' => $employee->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Attendance/Report')
            ->where('summary.total', 1)
            ->where('summary.late', 1)
            ->where('summary.absent', 0)
            ->has('records.data', 1)
            ->where('records.data.0.employee.name', 'Karim Ahmed')
            ->where('records.data.0.work_date', '2026-05-15'));
});

test('employee dashboard requires employee view permission and shows attendance summary', function () {
    $role = Role::query()->create([
        'name' => 'Employee Viewer Role',
        'description' => 'test',
    ]);
    $permission = Permission::query()->create([
        'name' => 'employees.view',
        'display_name' => 'View employees',
        'category' => 'employees',
        'description' => null,
    ]);
    $role->permissions()->attach($permission);
    $user = User::factory()->create(['role_id' => $role->id]);

    $employee = Employee::query()->create([
        'employee_code' => 'EMP-003',
        'name' => 'Salma Akter',
        'is_active' => true,
    ]);
    AttendanceDayRecord::query()->create([
        'employee_id' => $employee->id,
        'work_date' => '2026-05-15',
        'status' => 'present',
        'minutes_worked' => 480,
    ]);

    $this->actingAs($user)
        ->get(route('employees.dashboard', [
            'employee_id' => $employee->id,
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-31',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Dashboard')
            ->where('selectedEmployee.name', 'Salma Akter')
            ->where('summary.total', 31)
            ->where('summary.present', 1)
            ->has('attendance', 31)
            ->where('attendance.14.status', 'present')
            ->where('leaveSummary.total', 0)
            ->where('movementSummary.total', 0));
});

test('employee dashboard includes period attendance leave balance and movements', function () {
    $role = Role::query()->create([
        'name' => 'Employee Report Viewer Role',
        'description' => 'test',
    ]);
    $permission = Permission::query()->create([
        'name' => 'employees.view',
        'display_name' => 'View employees',
        'category' => 'employees',
        'description' => null,
    ]);
    $role->permissions()->attach($permission);
    $user = User::factory()->create(['role_id' => $role->id]);

    $employee = Employee::query()->create([
        'employee_code' => 'EMP-004',
        'name' => 'Nusrat Jahan',
        'is_active' => true,
    ]);
    $leaveType = LeaveType::query()->create([
        'name' => 'Annual Leave',
        'days_allowed' => 10,
        'is_active' => true,
    ]);
    EmployeeLeave::query()->create([
        'employee_id' => $employee->id,
        'leave_type_id' => $leaveType->id,
        'start_date' => '2026-05-14',
        'end_date' => '2026-05-17',
        'status' => 'approved',
    ]);
    EmployeeLeave::query()->create([
        'employee_id' => $employee->id,
        'leave_type_id' => $leaveType->id,
        'start_date' => '2026-05-16',
        'end_date' => '2026-05-16',
        'status' => 'pending',
    ]);
    EmployeeMovement::query()->create([
        'employee_id' => $employee->id,
        'date' => '2026-05-16',
        'start_time' => '10:00:00',
        'end_time' => '12:00:00',
        'purpose' => 'Official work',
        'location' => 'Main branch',
        'status' => 'approved',
    ]);

    $this->actingAs($user)
        ->get(route('employees.dashboard', [
            'employee_id' => $employee->id,
            'start_date' => '2026-05-15',
            'end_date' => '2026-05-17',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Employees/Dashboard')
            ->has('attendance', 3)
            ->where('attendance.0.work_date', '2026-05-15')
            ->where('attendance.1.status', 'weekend')
            ->where('attendance.2.status', 'not_recorded')
            ->where('summary.total', 3)
            ->where('leaveSummary.total', 2)
            ->where('leaveSummary.approved_days', 3)
            ->where('leaveBalances.0.allowed_days', 10)
            ->where('leaveBalances.0.used_days', 3)
            ->where('leaveBalances.0.available_days', 7)
            ->where('movementSummary.total', 1)
            ->where('movementSummary.approved', 1)
            ->where('movements.0.purpose', 'Official work'));
});
