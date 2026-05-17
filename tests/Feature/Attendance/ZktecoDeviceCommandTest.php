<?php

use App\Enums\ZktecoDeviceCommandStatus;
use App\Enums\ZktecoDeviceCommandType;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\ZktecoDeviceCommand;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAttendanceManagerForDevice(): User
{
    $role = Role::query()->create([
        'name' => 'Attendance Device Role',
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

    return User::factory()->create(['role_id' => $role->id]);
}

test('zkteco employees api returns active employees with zk uid', function () {
    config(['zkteco.sync_api_key' => 'agent-key']);

    Employee::query()->create([
        'employee_code' => '000101',
        'name' => 'Device Ready',
        'is_active' => true,
        'zkteco_user_id' => 101,
    ]);

    Employee::query()->create([
        'employee_code' => '000102',
        'name' => 'No ZK',
        'is_active' => true,
        'zkteco_user_id' => null,
    ]);

    $this->getJson('/api/zkteco/employees', ['Authorization' => 'Bearer agent-key'])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.employee_code', '000101');
});

test('agent can claim and complete device command', function () {
    config(['zkteco.sync_api_key' => 'agent-key']);

    $employee = Employee::query()->create([
        'employee_code' => '000201',
        'name' => 'Push Me',
        'is_active' => true,
        'zkteco_user_id' => 201,
    ]);

    $command = ZktecoDeviceCommand::query()->create([
        'type' => ZktecoDeviceCommandType::PushEmployee,
        'status' => ZktecoDeviceCommandStatus::Pending,
        'employee_id' => $employee->id,
    ]);

    $claim = $this->getJson('/api/zkteco/commands?claim=1', ['Authorization' => 'Bearer agent-key'])
        ->assertOk()
        ->json('data');

    expect($claim)->toHaveCount(1)
        ->and($claim[0]['id'])->toBe($command->id)
        ->and($claim[0]['type'])->toBe('push_employee');

    $command->refresh();
    expect($command->status)->toBe(ZktecoDeviceCommandStatus::Processing);

    $this->postJson("/api/zkteco/commands/{$command->id}/complete", [
        'success' => true,
        'result' => ['pushed' => 1],
    ], ['Authorization' => 'Bearer agent-key'])->assertOk();

    $command->refresh();
    expect($command->status)->toBe(ZktecoDeviceCommandStatus::Completed);
});

test('attendance device page queues sync command', function () {
    $user = makeAttendanceManagerForDevice();

    $this->actingAs($user)
        ->post(route('attendance.device.sync'))
        ->assertRedirect();

    expect(ZktecoDeviceCommand::query()->where('type', ZktecoDeviceCommandType::SyncAttendance)->exists())->toBeTrue();
});
