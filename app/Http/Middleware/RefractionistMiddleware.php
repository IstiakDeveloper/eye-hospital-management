<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RefractionistMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check() || !in_array(auth()->user()->role->name, ['Refractionist', 'Super Admin'])) {
            abort(403, 'Only refractionists can access this area.');
        }

        return $next($request);
    }
}
