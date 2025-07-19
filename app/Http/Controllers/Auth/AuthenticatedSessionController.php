<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
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

        return redirect()->intended($this->getDashboardRoute());
    }

    private function getDashboardRoute(): string
    {
        $user = auth()->user();

        if ($user && $user->role) {
            $roleName = $user->role->name;

            $dashboardRoutes = [
                'Receptionist' => 'receptionist.dashboard',
                'Doctor' => 'doctor.dashboard',
                'Refractionist' => 'refractionist.dashboard',
                'Super Admin' => 'dashboard'  // Super Admin যোগ করুন
            ];

            // Role-based route return করুন
            $routeName = $dashboardRoutes[$roleName] ?? 'dashboard';

            // Route exists কিনা check করুন
            if (Route::has($routeName)) {
                \Log::info("Redirecting {$roleName} to: {$routeName}");
                return route($routeName);
            } else {
                \Log::warning("Route {$routeName} not found for role {$roleName}, using default");
                return route('dashboard');
            }
        }

        \Log::info('No user role found, using default dashboard');
        return route('dashboard');
    }

    /**
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
