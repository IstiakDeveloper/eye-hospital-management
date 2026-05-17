<?php

namespace App\Http\Controllers\Api;

use App\Enums\ZktecoDeviceCommandStatus;
use App\Http\Controllers\Controller;
use App\Models\ZktecoDeviceCommand;
use App\Services\Attendance\ZktecoCommandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZktecoCommandController extends Controller
{
    public function index(Request $request, ZktecoCommandService $commandService): JsonResponse
    {
        if ($request->boolean('claim')) {
            $commands = $commandService->claimPending((int) $request->query('limit', 5));

            return response()->json([
                'success' => true,
                'data' => $commands->map(fn (ZktecoDeviceCommand $c): array => $this->serializeCommand($c)),
            ]);
        }

        $commands = ZktecoDeviceCommand::query()
            ->with('employee:id,employee_code,name,zkteco_user_id')
            ->where('status', ZktecoDeviceCommandStatus::Pending)
            ->orderBy('id')
            ->limit((int) $request->query('limit', 20))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $commands->map(fn (ZktecoDeviceCommand $c): array => $this->serializeCommand($c)),
        ]);
    }

    public function complete(Request $request, ZktecoDeviceCommand $command, ZktecoCommandService $commandService): JsonResponse
    {
        $validated = $request->validate([
            'success' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:2000'],
            'result' => ['nullable', 'array'],
        ]);

        if ($validated['success']) {
            $commandService->markCompleted($command, $validated['result'] ?? []);
        } else {
            $commandService->markFailed(
                $command,
                (string) ($validated['message'] ?? 'Command failed on agent.'),
                $validated['result'] ?? []
            );
        }

        return response()->json([
            'success' => true,
            'data' => $this->serializeCommand($command->fresh(['employee'])),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCommand(ZktecoDeviceCommand $command): array
    {
        return [
            'id' => $command->id,
            'type' => $command->type->value,
            'status' => $command->status->value,
            'employee_id' => $command->employee_id,
            'payload' => $command->payload,
            'employee' => $command->employee ? [
                'id' => $command->employee->id,
                'employee_code' => $command->employee->employee_code,
                'name' => $command->employee->name,
                'zkteco_user_id' => $command->employee->zkteco_user_id,
            ] : null,
            'created_at' => $command->created_at?->toIso8601String(),
        ];
    }
}
