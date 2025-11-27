<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if the user is authenticated and is a super admin
        if (!auth()->check() || auth()->user()->role->name !== 'Super Admin') {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
