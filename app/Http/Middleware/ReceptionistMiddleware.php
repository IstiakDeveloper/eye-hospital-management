<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReceptionistMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !in_array(auth()->user()->role->name, ['Receptionist', 'Super Admin'])) {
            abort(403, 'Only receptionists can access this area.');
        }

        return $next($request);
    }
}
