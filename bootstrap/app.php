<?php

use App\Http\Middleware\DoctorMiddleware;
use App\Http\Middleware\DoctorOrReceptionistMiddleware;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ReceptionistMiddleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'super-admin' => SuperAdminMiddleware::class,
            'doctor' => DoctorMiddleware::class,
            'receptionist' => ReceptionistMiddleware::class,
            'doctor-or-receptionist' => DoctorOrReceptionistMiddleware::class,
            
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
