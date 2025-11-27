<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DoctorOrReceptionistMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !in_array(auth()->user()->role->name, ['Doctor', 'Receptionist', 'Super Admin'])) {
            abort(403, 'Access denied.');
        }

        return $next($request);
    }
}
