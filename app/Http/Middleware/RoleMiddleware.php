<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, $next, $role)
    {
        if (!auth()->user() || auth()->user()->role->name !== $role) {
            abort(403, 'Unauthorized access');
        }
        return $next($request);
    }
}
