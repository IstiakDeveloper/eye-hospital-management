<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\ZktecoDeviceCommandType;
use App\Http\Controllers\Controller;
use App\Models\AttendanceDevice;
use App\Models\Employee;
use App\Models\ZktecoDeviceCommand;
use App\Services\Attendance\ZktecoCommandService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceDeviceController extends Controller
{
    public function index(Request $request): Response
    {
        $devices = AttendanceDevice::query()->orderBy('external_device_id')->get();
        $employees = Employee::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name', 'zkteco_user_id']);

        $recentCommands = ZktecoDeviceCommand::query()
            ->with(['employee:id,employee_code,name', 'requestedBy:id,name'])
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(fn (ZktecoDeviceCommand $c): array => [
                'id' => $c->id,
                'type' => $c->type->value,
                'type_label' => ucwords(str_replace('_', ' ', $c->type->value)),
                'status' => $c->status->value,
                'employee_label' => $c->employee
                    ? $c->employee->employee_code.' — '.$c->employee->name
                    : null,
                'requested_by' => $c->requestedBy?->name,
                'error_message' => $c->error_message,
                'result' => $c->result,
                'created_at' => $c->created_at?->format('Y-m-d H:i'),
                'completed_at' => $c->completed_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Attendance/Device', [
            'devices' => $devices->map(fn (AttendanceDevice $d): array => [
                'id' => $d->id,
                'external_device_id' => $d->external_device_id,
                'name' => $d->name,
                'ip_address' => $d->ip_address,
                'last_synced_at' => $d->last_synced_at?->format('Y-m-d H:i:s'),
            ]),
            'employees' => $employees->map(fn (Employee $e): array => [
                'id' => $e->id,
                'employee_code' => $e->employee_code,
                'name' => $e->name,
                'zkteco_user_id' => $e->zkteco_user_id,
                'ready_for_device' => $e->zkteco_user_id !== null,
            ]),
            'recentCommands' => $recentCommands,
            'agentConfigHint' => [
                'agent_run_endpoint' => url('/api/zkteco/agent/run'),
                'api_endpoint' => url('/api/zkteco/sync'),
                'commands_endpoint' => url('/api/zkteco/commands'),
                'employees_endpoint' => url('/api/zkteco/employees'),
                'auto_sync_interval_minutes' => config('zkteco.auto_sync_interval_minutes', 5),
            ],
        ]);
    }

    public function queueSync(Request $request, ZktecoCommandService $commandService): RedirectResponse
    {
        $commandService->queue(ZktecoDeviceCommandType::SyncAttendance, $request->user());

        return back()->with('success', 'Sync attendance command queued. Run the ZKTeco agent on the device PC to process it.');
    }

    public function queuePushAll(Request $request, ZktecoCommandService $commandService): RedirectResponse
    {
        $commandService->queue(ZktecoDeviceCommandType::PushAllEmployees, $request->user());

        return back()->with('success', 'Push all employees command queued.');
    }

    public function queuePushEmployee(Request $request, Employee $employee, ZktecoCommandService $commandService): RedirectResponse
    {
        if (! $employee->is_active || $employee->zkteco_user_id === null) {
            return back()->withErrors([
                'employee' => 'Employee must be active and have a ZKTeco user id before pushing to device.',
            ]);
        }

        $commandService->queue(ZktecoDeviceCommandType::PushEmployee, $request->user(), $employee);

        return back()->with('success', "Push queued for {$employee->name}.");
    }

    public function queueRemoveEmployee(Request $request, Employee $employee, ZktecoCommandService $commandService): RedirectResponse
    {
        $commandService->queue(ZktecoDeviceCommandType::RemoveEmployee, $request->user(), $employee);

        return back()->with('success', "Remove queued for {$employee->name}.");
    }

    public function queueRemoveAll(Request $request, ZktecoCommandService $commandService): RedirectResponse
    {
        $commandService->queue(ZktecoDeviceCommandType::RemoveAllEmployees, $request->user());

        return back()->with('success', 'Remove all employees command queued.');
    }
}
