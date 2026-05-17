<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Attendance\ZktecoSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ZktecoSyncController extends Controller
{
    public function __invoke(Request $request, ZktecoSyncService $syncService): JsonResponse
    {
        $payload = $request->all();
        if (! is_array($payload)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid JSON body.',
            ], 422);
        }

        try {
            $summary = $syncService->sync($payload);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('ZKTeco sync failed', ['exception' => $e]);

            return response()->json([
                'status' => false,
                'message' => 'Sync failed.',
            ], 500);
        }

        return response()->json([
            'status' => true,
            'message' => 'Attendance data synced successfully.',
            'summary' => $summary,
        ]);
    }
}
