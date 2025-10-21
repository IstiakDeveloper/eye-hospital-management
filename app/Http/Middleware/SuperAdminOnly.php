<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // Check if user has Super Admin role
        $user = Auth::user();

        if (!$user->role || $user->role->name !== 'Super Admin') {
            // Return 403 Forbidden for non-Super Admin users
            abort(403, 'This action is restricted to Super Admin only.');
        }

        return $next($request);
    }
}
