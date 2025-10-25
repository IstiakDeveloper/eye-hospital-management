<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        // Always redirect to the appropriate dashboard based on user permissions
        // Don't use intended() as it might redirect to a dashboard they don't have access to
        return redirect()->to($this->getDashboardRoute());
    }

    private function getDashboardRoute(): string
    {
        $user = auth()->user();

        if (!$user || !$user->role) {
            Log::info('No user role found, using default dashboard');
            return route('dashboard');
        }

        // Load user permissions
        $permissions = $user->role->permissions->pluck('name')->toArray();

        // Check for wildcard permission (Super Admin)
        $hasSuperAdminPermission = in_array('*', $permissions);

        // Permission-based dashboard routing
        // Priority order: Check Admin FIRST, then specific roles

        // 1. Check for Super Admin permission FIRST (wildcard or explicit admin dashboard permission)
        // Super Admin should ALWAYS go to Admin Dashboard
        if ($hasSuperAdminPermission || in_array('admin.dashboard', $permissions)) {
            Log::info("User has admin dashboard permission, redirecting to admin dashboard");
            return route('dashboard');
        }

        // 2. Check for Doctor permissions
        if (in_array('dashboard.doctor', $permissions) && Route::has('doctor.dashboard')) {
            Log::info("User has dashboard.doctor permission, redirecting to doctor.dashboard");
            return route('doctor.dashboard');
        }

        // 3. Check for Receptionist permissions
        if (in_array('dashboard.receptionist', $permissions) && Route::has('receptionist.dashboard')) {
            Log::info("User has dashboard.receptionist permission, redirecting to receptionist.dashboard");
            return route('receptionist.dashboard');
        }

        // 4. Check for Refractionist permissions
        if (in_array('dashboard.refractionist', $permissions) && Route::has('refractionist.dashboard')) {
            Log::info("User has dashboard.refractionist permission, redirecting to refractionist.dashboard");
            return route('refractionist.dashboard');
        }

        // 5. Check for Medicine Seller permissions
        if (in_array('dashboard.medicine-seller', $permissions) && Route::has('medicine-seller.dashboard')) {
            Log::info("User has dashboard.medicine-seller permission, redirecting to medicine-seller.dashboard");
            return route('medicine-seller.dashboard');
        }

        // 6. Check for Optics Seller permissions
        if (in_array('dashboard.optics-seller', $permissions) && Route::has('optics-seller.dashboard')) {
            Log::info("User has dashboard.optics-seller permission, redirecting to optics-seller.dashboard");
            return route('optics-seller.dashboard');
        }

        // 7. Fallback: If no specific dashboard permission found, redirect to a generic page
        Log::warning("No specific dashboard permission found for user {$user->id}, redirecting to default");

        // Check if user has any dashboard access at all
        if (!empty($permissions)) {
            // Redirect to first available dashboard based on any permission
            if (Route::has('dashboard')) {
                return route('dashboard');
            }
        }

        // Ultimate fallback
        Log::error("No dashboard route found for user {$user->id}");
        return route('dashboard');
    }    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
