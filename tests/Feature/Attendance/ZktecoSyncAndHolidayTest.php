<?php

use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAttendanceManager(): User
{
    $role = Role::query()->create([
        'name' => 'Attendance Test Role',
        'description' => 'test',
    ]);

    foreach (['attendance.view', 'attendance.manage'] as $name) {
        $permission = Permission::query()->create([
            'name' => $name,
            'display_name' => $name,
            'category' => 'attendance',
            'description' => null,
        ]);
        $role->permissions()->attach($permission);
    }

    return User::factory()->create([
        'role_id' => $role->id,
    ]);
}

test('zkteco sync rejects invalid bearer token', function () {
    config(['zkteco.sync_api_key' => 'correct-key']);

    $response = $this->postJson('/api/zkteco/sync', [
        'device_id' => 1,
        'device_name' => 'Office',
    ], [
        'Authorization' => 'Bearer wrong',
    ]);

    $response->assertUnauthorized();
});

test('zkteco sync stores punches and marks late when after grace', function () {
    config(['zkteco.sync_api_key' => 'sync-key']);

    Employee::query()->create([
        'employee_code' => 'EMP-ZK-42',
        'name' => 'ZKTeco Test Employee',
        'is_active' => true,
        'zkteco_user_id' => 42,
    ]);

    $payload = [
        'device_id' => 1,
        'device_name' => 'Head Office',
        'device_ip' => '192.168.0.15',
        'attendance_data' => [
            [
                'uid' => 42,
                'id' => '42',
                'timestamp' => '2026-05-12 09:20:00',
                'state' => 1,
                'type' => 0,
            ],
            [
                'uid' => 42,
                'id' => '42',
                'timestamp' => '2026-05-12 18:05:00',
                'state' => 1,
                'type' => 0,
            ],
        ],
    ];

    $response = $this->postJson('/api/zkteco/sync', $payload, [
        'Authorization' => 'Bearer sync-key',
    ]);

    $response->assertOk()
        ->assertJsonPath('status', true);

    expect(\App\Models\AttendancePunch::query()->count())->toBe(2);

    $employee = Employee::query()->where('zkteco_user_id', 42)->firstOrFail();

    $day = \App\Models\AttendanceDayRecord::query()
        ->where('employee_id', $employee->id)
        ->whereDate('work_date', '2026-05-12')
        ->first();

    expect($day)->not->toBeNull();
    expect($day->status)->toBe('late');
    expect($day->minutes_late)->toBeGreaterThan(0);
    expect($day->minutes_worked)->toBeGreaterThan(0);
});

test('zkteco sync marks early leave when checkout is before expected time', function () {
    config(['zkteco.sync_api_key' => 'sync-key']);

    Employee::query()->create([
        'employee_code' => 'EMP-ZK-99',
        'name' => 'Early Leave Employee',
        'is_active' => true,
        'zkteco_user_id' => 99,
    ]);

    $payload = [
        'device_id' => 1,
        'device_name' => 'Head Office',
        'device_ip' => '192.168.0.15',
        'attendance_data' => [
            [
                'uid' => 99,
                'id' => '99',
                'timestamp' => '2026-05-13 08:55:00',
                'state' => 1,
                'type' => 0,
            ],
            [
                'uid' => 99,
                'id' => '99',
                'timestamp' => '2026-05-13 16:30:00',
                'state' => 1,
                'type' => 0,
            ],
        ],
    ];

    $this->postJson('/api/zkteco/sync', $payload, [
        'Authorization' => 'Bearer sync-key',
    ])->assertOk();

    $employee = Employee::query()->where('zkteco_user_id', 99)->firstOrFail();

    $day = \App\Models\AttendanceDayRecord::query()
        ->where('employee_id', $employee->id)
        ->whereDate('work_date', '2026-05-13')
        ->first();

    expect($day)->not->toBeNull();
    expect($day->status)->toBe('early_leave');
    expect($day->minutes_early_leave)->toBeGreaterThan(0);
    expect($day->minutes_worked)->toBe(455);
});

test('zkteco sync links punches by employee code when device uses duplicate uids', function () {
    config(['zkteco.sync_api_key' => 'sync-key']);

    $employee = Employee::query()->create([
        'employee_code' => '000002',
        'name' => 'Erfan Ali',
        'is_active' => true,
        'zkteco_user_id' => 1,
    ]);

    $payload = [
        'device_id' => 1,
        'device_name' => 'Hospital Device',
        'device_ip' => '192.168.0.101',
        'attendance_data' => [
            [
                'uid' => 1,
                'id' => '000002',
                'timestamp' => '2026-05-14 09:00:00',
                'state' => 1,
                'type' => 0,
            ],
            [
                'uid' => 2,
                'id' => '000002',
                'timestamp' => '2026-05-14 18:00:00',
                'state' => 1,
                'type' => 0,
            ],
        ],
    ];

    $this->postJson('/api/zkteco/sync', $payload, [
        'Authorization' => 'Bearer sync-key',
    ])->assertOk();

    $day = \App\Models\AttendanceDayRecord::query()
        ->where('employee_id', $employee->id)
        ->whereDate('work_date', '2026-05-14')
        ->first();

    expect($day)->not->toBeNull();
    expect($day->status)->toBe('present');
    expect($day->first_in_at?->format('H:i'))->toBe('09:00');
    expect($day->last_out_at?->format('H:i'))->toBe('18:00');

    expect(\App\Models\AttendancePunch::query()->where('employee_id', $employee->id)->count())->toBe(2);
});

test('zkteco sync recalculates day records even when all punches were already stored', function () {
    config(['zkteco.sync_api_key' => 'sync-key']);

    $employee = Employee::query()->create([
        'employee_code' => 'EMP-RECALC',
        'name' => 'Recalc Test',
        'is_active' => true,
        'zkteco_user_id' => 55,
    ]);

    $payload = [
        'device_id' => 1,
        'device_name' => 'Head Office',
        'device_ip' => '192.168.0.15',
        'attendance_data' => [
            [
                'uid' => 55,
                'id' => '55',
                'timestamp' => '2026-05-14 09:00:00',
                'state' => 1,
                'type' => 0,
            ],
            [
                'uid' => 55,
                'id' => '55',
                'timestamp' => '2026-05-14 18:00:00',
                'state' => 1,
                'type' => 0,
            ],
        ],
    ];

    $this->postJson('/api/zkteco/sync', $payload, [
        'Authorization' => 'Bearer sync-key',
    ])->assertOk();

    \App\Models\AttendanceDayRecord::query()
        ->where('employee_id', $employee->id)
        ->whereDate('work_date', '2026-05-14')
        ->update(['status' => 'absent', 'minutes_worked' => null]);

    $second = $this->postJson('/api/zkteco/sync', $payload, [
        'Authorization' => 'Bearer sync-key',
    ]);

    $second->assertOk()
        ->assertJsonPath('summary.inserted', 0)
        ->assertJsonPath('summary.skipped', 2)
        ->assertJsonPath('summary.recalculated_days', 1);

    $day = \App\Models\AttendanceDayRecord::query()
        ->where('employee_id', $employee->id)
        ->whereDate('work_date', '2026-05-14')
        ->first();

    expect($day?->status)->toBe('present');
    expect($day?->first_in_at?->format('H:i'))->toBe('09:00');
    expect($day?->last_out_at?->format('H:i'))->toBe('18:00');
});

test('holiday store requires authentication', function () {
    $this->post(route('attendance.holidays.store'), [
        'observed_on' => '2026-12-16',
        'name' => 'Victory Day',
    ])->assertRedirect('/login');
});

test('holiday store succeeds with attendance manage permission', function () {
    $user = makeAttendanceManager();

    $this->actingAs($user)
        ->post(route('attendance.holidays.store'), [
            'observed_on' => '2026-12-16',
            'name' => 'Victory Day',
        ])
        ->assertRedirect(route('attendance.holidays.index'));

    expect(Holiday::query()->count())->toBe(1);
});
