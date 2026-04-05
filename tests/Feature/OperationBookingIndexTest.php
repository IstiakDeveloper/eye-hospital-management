<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
    $this->actingAs(User::factory()->create());
});

it('includes request filters in inertia props', function () {
    $response = $this->get('/operation-bookings?'.http_build_query([
        'status' => 'scheduled',
        'search' => 'test-query',
        'payment_status' => 'partial',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('filters.status', 'scheduled')
        ->where('filters.search', 'test-query')
        ->where('filters.payment_status', 'partial')
        ->where('filters.start_date', '2026-01-01')
        ->where('filters.end_date', '2026-01-31')
    );
});
