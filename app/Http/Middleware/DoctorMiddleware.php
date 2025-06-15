<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DoctorMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !in_array(auth()->user()->role->name, ['Doctor', 'Super Admin'])) {
            abort(403, 'Only doctors can access this area.');
        }

        return $next($request);
    }
}
