<?php

namespace App\Http\Controllers\Api;

use App\Enums\ZktecoDeviceCommandStatus;
use App\Enums\ZktecoDeviceCommandType;
use App\Http\Controllers\Controller;
use App\Models\AttendanceDevice;
use App\Models\ZktecoDeviceCommand;
use App\Services\Attendance\ZktecoCommandService;
use App\Services\Attendance\ZktecoSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ZktecoAgentController extends Controller
{
    /**
     * Single entry for the Windows agent (run on a schedule via bin/auto_run.php).
     *
     * GET  — claim queued device commands + tell agent whether to pull attendance now
     * POST — accept attendance payload from device (same as /api/zkteco/sync)
     */
    public function run(Request $request, ZktecoCommandService $commandService, ZktecoSyncService $syncService): JsonResponse
    {
        if ($request->isMethod('post')) {
            return $this->ingestAttendance($request, $syncService);
        }

        $commands = $commandService->claimPending((int) $request->query('limit', 10));

        $device = AttendanceDevice::query()->orderByDesc('last_synced_at')->first();
        $shouldSync = $this->shouldSyncAttendance($device);

        return response()->json([
            'success' => true,
            'message' => $shouldSync
                ? 'Run attendance sync from device, then report results.'
                : 'Process queued commands. Attendance sync not required yet.',
            'data' => [
                'commands' => $commands->map(fn (ZktecoDeviceCommand $c): array => [
                    'id' => $c->id,
                    'type' => $c->type->value,
                    'employee_id' => $c->employee_id,
                    'employee' => $c->employee ? [
                        'id' => $c->employee->id,
                        'employee_code' => $c->employee->employee_code,
                        'name' => $c->employee->name,
                        'zkteco_user_id' => $c->employee->zkteco_user_id,
                    ] : null,
                ]),
                'sync_attendance' => $shouldSync,
                'auto_sync_enabled' => config('zkteco.auto_sync_enabled', true),
                'auto_sync_interval_minutes' => config('zkteco.auto_sync_interval_minutes', 5),
                'last_synced_at' => $device?->last_synced_at?->toIso8601String(),
                'endpoints' => [
                    'sync_post' => url('/api/zkteco/agent/run'),
                    'sync_legacy_post' => url('/api/zkteco/sync'),
                    'complete_command' => url('/api/zkteco/commands/{id}/complete'),
                ],
            ],
        ]);
    }

    private function ingestAttendance(Request $request, ZktecoSyncService $syncService): JsonResponse
    {
        $payload = $request->all();
        if (! is_array($payload) || $payload === []) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or empty JSON body.',
            ], 422);
        }

        try {
            $summary = $syncService->sync($payload);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('ZKTeco agent attendance ingest failed', ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => 'Sync failed.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'status' => true,
            'message' => 'Attendance data synced successfully.',
            'summary' => $summary,
        ]);
    }

    private function shouldSyncAttendance(?AttendanceDevice $device): bool
    {
        if (! config('zkteco.auto_sync_enabled', true)) {
            return false;
        }

        $hasPendingSyncCommand = ZktecoDeviceCommand::query()
            ->where('type', ZktecoDeviceCommandType::SyncAttendance)
            ->whereIn('status', [
                ZktecoDeviceCommandStatus::Pending,
                ZktecoDeviceCommandStatus::Processing,
            ])
            ->exists();

        if ($hasPendingSyncCommand) {
            return true;
        }

        $intervalMinutes = max(1, (int) config('zkteco.auto_sync_interval_minutes', 5));

        if (! $device?->last_synced_at) {
            return true;
        }

        return $device->last_synced_at->lte(now()->subMinutes($intervalMinutes));
    }
}
