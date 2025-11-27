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
        if (!$user || !$user->role) {
            return route('login');
        }

        // Load user permissions
        $permissions = $user->role->permissions->pluck('name')->toArray();

        // Priority order: Doctor > Receptionist > Refractionist > Medicine Seller > Optics Seller

        // Check for Doctor permissions
        if (in_array('dashboard.doctor', $permissions) && Route::has('doctor.dashboard')) {
            return route('doctor.dashboard');
        }

        // Check for Receptionist permissions
        if (in_array('dashboard.receptionist', $permissions) && Route::has('receptionist.dashboard')) {
            return route('receptionist.dashboard');
        }

        // Check for Refractionist permissions
        if (in_array('dashboard.refractionist', $permissions) && Route::has('refractionist.dashboard')) {
            return route('refractionist.dashboard');
        }

        // Check for Medicine Seller permissions
        if (in_array('dashboard.medicine-seller', $permissions) && Route::has('medicine-seller.dashboard')) {
            return route('medicine-seller.dashboard');
        }

        // Check for Optics Seller permissions
        if (in_array('dashboard.optics-seller', $permissions) && Route::has('optics-seller.dashboard')) {
            return route('optics-seller.dashboard');
        }

        // Fallback to login if no dashboard found
        return route('login');
    }
}
