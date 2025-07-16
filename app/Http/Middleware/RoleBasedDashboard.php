<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleBasedDashboard
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if ($user && $user->role) {
            $roleName = $user->role->name;

            switch ($roleName) {
                case 'receiptionist':
                    return redirect()->route('receiptionist.dashboard');
                case 'doctor':
                    return redirect()->route('doctor.dashboard');
                case 'refractionist':
                    return redirect()->route('refractionist.dashboard');
                default:
                    return $next($request);
            }
        }

        return $next($request);
    }
}
