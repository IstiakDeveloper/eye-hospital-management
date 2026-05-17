<?php

namespace App\Services\Attendance;

use App\Enums\ZktecoDeviceCommandStatus;
use App\Enums\ZktecoDeviceCommandType;
use App\Models\Employee;
use App\Models\User;
use App\Models\ZktecoDeviceCommand;
use Illuminate\Support\Collection;

class ZktecoCommandService
{
    public function queue(
        ZktecoDeviceCommandType $type,
        ?User $requestedBy = null,
        ?Employee $employee = null,
        ?array $payload = null,
    ): ZktecoDeviceCommand {
        return ZktecoDeviceCommand::query()->create([
            'type' => $type,
            'status' => ZktecoDeviceCommandStatus::Pending,
            'employee_id' => $employee?->id,
            'requested_by' => $requestedBy?->id,
            'payload' => $payload,
        ]);
    }

    /**
     * @return Collection<int, ZktecoDeviceCommand>
     */
    public function claimPending(int $limit = 5): Collection
    {
        $commands = ZktecoDeviceCommand::query()
            ->with('employee')
            ->where('status', ZktecoDeviceCommandStatus::Pending)
            ->orderBy('id')
            ->limit($limit)
            ->get();

        foreach ($commands as $command) {
            $command->update([
                'status' => ZktecoDeviceCommandStatus::Processing,
                'started_at' => now(),
            ]);
        }

        return $commands->fresh(['employee']);
    }

    public function markCompleted(ZktecoDeviceCommand $command, array $result = []): ZktecoDeviceCommand
    {
        $command->update([
            'status' => ZktecoDeviceCommandStatus::Completed,
            'result' => $result,
            'error_message' => null,
            'completed_at' => now(),
        ]);

        return $command->fresh();
    }

    public function markFailed(ZktecoDeviceCommand $command, string $message, array $result = []): ZktecoDeviceCommand
    {
        $command->update([
            'status' => ZktecoDeviceCommandStatus::Failed,
            'result' => $result,
            'error_message' => $message,
            'completed_at' => now(),
        ]);

        return $command->fresh();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function employeesForDevice(): array
    {
        return Employee::query()
            ->where('is_active', true)
            ->whereNotNull('zkteco_user_id')
            ->orderBy('employee_code')
            ->get(['id', 'employee_code', 'name', 'zkteco_user_id', 'department', 'designation'])
            ->map(fn (Employee $e): array => [
                'id' => $e->id,
                'employee_code' => $e->employee_code,
                'name' => $e->name,
                'zkteco_user_id' => $e->zkteco_user_id,
                'department' => $e->department,
                'designation' => $e->designation,
            ])
            ->values()
            ->all();
    }
}
