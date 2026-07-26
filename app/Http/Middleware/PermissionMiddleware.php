<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!auth()->check()) {
            abort(403, 'Unauthorized access. Please login.');
        }

        $user = auth()->user();

        // Super Admin bypasses all permission checks
        if ($user->role && $user->role->name === 'Super Admin') {
            return $next($request);
        }

        // Check if user has the required permission
        if (!$user->hasPermission($permission)) {
            // Special handling for dashboard routes - redirect to appropriate dashboard
            if ($permission === 'admin.dashboard' && $request->is('dashboard')) {
                return redirect()->to($this->getAlternativeDashboard($user));
            }

            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }

    /**
     * Get alternative dashboard route based on user permissions
     */
    private function getAlternativeDashboard($user): string
    {
        if (! $user) {
            return route('login');
        }

        return $user->getDashboardRoute();
    }
}
