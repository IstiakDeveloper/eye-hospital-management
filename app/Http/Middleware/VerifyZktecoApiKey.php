<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyZktecoApiKey
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = config('zkteco.sync_api_key');
        if (! is_string($configuredKey) || $configuredKey === '') {
            return response()->json([
                'success' => false,
                'message' => 'ZKTECO_SYNC_API_KEY is not configured on the server.',
            ], 503);
        }

        $token = $request->bearerToken();
        if (! is_string($token) || ! hash_equals($configuredKey, $token)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        return $next($request);
    }
}
