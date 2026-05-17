<?php

use App\Enums\ZktecoDeviceCommandType;
use App\Models\AttendanceDevice;
use App\Models\Employee;
use App\Models\ZktecoDeviceCommand;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('agent bootstrap returns sync flag and claims commands', function () {
    config(['zkteco.sync_api_key' => 'agent-key', 'zkteco.auto_sync_enabled' => true]);

    ZktecoDeviceCommand::query()->create([
        'type' => ZktecoDeviceCommandType::PushAllEmployees,
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/zkteco/agent/run', ['Authorization' => 'Bearer agent-key']);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.sync_attendance', true)
        ->assertJsonCount(1, 'data.commands');

    expect(ZktecoDeviceCommand::query()->first()?->status->value)->toBe('processing');
});

test('agent run post ingests attendance like sync endpoint', function () {
    config(['zkteco.sync_api_key' => 'agent-key']);

    Employee::query()->create([
        'employee_code' => '000301',
        'name' => 'Auto Sync Worker',
        'is_active' => true,
        'zkteco_user_id' => 301,
    ]);

    $payload = [
        'device_id' => 1,
        'device_name' => 'Hospital Device',
        'device_ip' => '192.168.0.16',
        'attendance_data' => [
            [
                'uid' => 301,
                'id' => '000301',
                'timestamp' => '2026-05-16 09:05:00',
                'state' => 1,
                'type' => 0,
            ],
        ],
    ];

    $this->postJson('/api/zkteco/agent/run', $payload, ['Authorization' => 'Bearer agent-key'])
        ->assertOk()
        ->assertJsonPath('success', true);

    expect(\App\Models\AttendancePunch::query()->count())->toBe(1);
    expect(AttendanceDevice::query()->where('external_device_id', 1)->exists())->toBeTrue();
});

test('zkteco queue auto sync artisan command queues sync when stale', function () {
    config([
        'zkteco.auto_sync_enabled' => true,
        'zkteco.auto_sync_interval_minutes' => 5,
    ]);

    AttendanceDevice::query()->create([
        'external_device_id' => 1,
        'name' => 'Old',
        'last_synced_at' => now()->subHours(2),
    ]);

    $this->artisan('zkteco:queue-auto-sync')->assertSuccessful();

    expect(ZktecoDeviceCommand::query()->where('type', ZktecoDeviceCommandType::SyncAttendance)->exists())->toBeTrue();
});
