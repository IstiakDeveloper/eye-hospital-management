<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\Attendance\ZktecoCommandService;
use Illuminate\Http\JsonResponse;

class ZktecoEmployeeController extends Controller
{
    public function index(ZktecoCommandService $commandService): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $commandService->employeesForDevice(),
        ]);
    }

    public function show(Employee $employee): JsonResponse
    {
        if (! $employee->is_active || $employee->zkteco_user_id === null) {
            return response()->json([
                'success' => false,
                'message' => 'Employee is inactive or missing ZKTeco user id.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'zkteco_user_id' => $employee->zkteco_user_id,
                'department' => $employee->department,
                'designation' => $employee->designation,
            ],
        ]);
    }
}
