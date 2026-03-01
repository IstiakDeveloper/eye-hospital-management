<?php

use App\Models\Medicine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

// ─── Company Stock Report ─────────────────────────────────────────────────────

it('renders the company stock report page', function () {
    $response = $this->get(route('medicine.reports.company-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('MedicineCorner/Reports/CompanyStockReport')
        ->has('reportData')
        ->has('totals')
        ->has('filters')
    );
});

it('returns empty data when no medicines exist', function () {
    $response = $this->get(route('medicine.reports.company-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('reportData', [])
        ->where('totals.total_medicines', 0)
        ->where('totals.total_stock_qty', 0)
        ->where('totals.total_stock_value', 0.0)
    );
});

it('groups medicines by manufacturer in company stock report', function () {
    Medicine::create(['name' => 'Med1', 'manufacturer' => 'ACI', 'track_stock' => true, 'total_stock' => 50, 'average_buy_price' => 10, 'is_active' => true]);
    Medicine::create(['name' => 'Med2', 'manufacturer' => 'ACI', 'track_stock' => true, 'total_stock' => 30, 'average_buy_price' => 5, 'is_active' => true]);
    Medicine::create(['name' => 'Med3', 'manufacturer' => 'Square', 'track_stock' => true, 'total_stock' => 20, 'average_buy_price' => 8, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('reportData', 2)
        ->where('totals.total_medicines', 3)
        ->where('totals.total_stock_qty', 100)
    );
});

it('filters company stock report by search', function () {
    Medicine::create(['name' => 'Med1', 'manufacturer' => 'ACI Limited', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med2', 'manufacturer' => 'Square Pharma', 'track_stock' => true, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-stock', ['search' => 'ACI']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('reportData', 1));
});

it('excludes non-tracked medicines from company stock report', function () {
    Medicine::create(['name' => 'Med1', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med2', 'manufacturer' => 'Square', 'track_stock' => false, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('reportData', 1));
});

it('redirects guests to login for company stock report', function () {
    $this->withMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
    auth()->logout();

    $this->get(route('medicine.reports.company-stock'))->assertRedirect('/login');
});

// ─── Company Medicine Stock Report ───────────────────────────────────────────

it('renders the company medicine stock report page', function () {
    $response = $this->get(route('medicine.reports.company-medicine-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('MedicineCorner/Reports/CompanyMedicineStockReport')
        ->has('reportData')
        ->has('allManufacturers')
        ->has('filters')
    );
});

it('returns medicines grouped under each company', function () {
    Medicine::create(['name' => 'Med A', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med B', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med C', 'manufacturer' => 'Square', 'track_stock' => true, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-medicine-stock'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('reportData', 2)
        ->where('reportData.0.total_medicines', 2)
        ->where('reportData.1.total_medicines', 1)
    );
});

it('filters company medicine stock report by manufacturer', function () {
    Medicine::create(['name' => 'Med1', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med2', 'manufacturer' => 'Square', 'track_stock' => true, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-medicine-stock', ['manufacturer' => 'ACI']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('reportData', 1));
});

it('filters company medicine stock report by search term', function () {
    Medicine::create(['name' => 'Napa Extra', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Seclo 20mg', 'manufacturer' => 'Square', 'track_stock' => true, 'is_active' => true]);

    $response = $this->get(route('medicine.reports.company-medicine-stock', ['search' => 'Napa']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('reportData', 1));
});

it('populates allManufacturers dropdown from tracked medicines', function () {
    Medicine::create(['name' => 'Med1', 'manufacturer' => 'ACI', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med2', 'manufacturer' => 'Square', 'track_stock' => true, 'is_active' => true]);
    Medicine::create(['name' => 'Med3', 'manufacturer' => 'Square', 'track_stock' => false, 'is_active' => true]); // not tracked

    $response = $this->get(route('medicine.reports.company-medicine-stock'));

    $response->assertInertia(fn ($page) => $page->has('allManufacturers', 2));
});

it('redirects guests to login for company medicine stock report', function () {
    $this->withMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
    auth()->logout();

    $this->get(route('medicine.reports.company-medicine-stock'))->assertRedirect('/login');
});
