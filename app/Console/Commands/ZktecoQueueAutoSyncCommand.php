<?php

namespace App\Console\Commands;

use App\Enums\ZktecoDeviceCommandStatus;
use App\Enums\ZktecoDeviceCommandType;
use App\Models\AttendanceDevice;
use App\Models\ZktecoDeviceCommand;
use App\Services\Attendance\ZktecoCommandService;
use Illuminate\Console\Command;

class ZktecoQueueAutoSyncCommand extends Command
{
    protected $signature = 'zkteco:queue-auto-sync';

    protected $description = 'Queue a sync-attendance command for the ZKTeco agent when the interval has elapsed';

    public function handle(ZktecoCommandService $commandService): int
    {
        if (! config('zkteco.auto_sync_enabled', true)) {
            $this->comment('ZKTeco auto sync is disabled.');

            return self::SUCCESS;
        }

        $pending = ZktecoDeviceCommand::query()
            ->where('type', ZktecoDeviceCommandType::SyncAttendance)
            ->whereIn('status', [
                ZktecoDeviceCommandStatus::Pending,
                ZktecoDeviceCommandStatus::Processing,
            ])
            ->exists();

        if ($pending) {
            $this->comment('Sync command already pending or processing.');

            return self::SUCCESS;
        }

        $intervalMinutes = max(1, (int) config('zkteco.auto_sync_interval_minutes', 5));
        $device = AttendanceDevice::query()->orderByDesc('last_synced_at')->first();

        if ($device?->last_synced_at?->gt(now()->subMinutes($intervalMinutes))) {
            $this->comment('Last sync is recent; skipping queue.');

            return self::SUCCESS;
        }

        $commandService->queue(ZktecoDeviceCommandType::SyncAttendance);

        $this->info('Queued sync_attendance for the ZKTeco agent.');

        return self::SUCCESS;
    }
}
