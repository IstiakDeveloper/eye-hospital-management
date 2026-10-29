<?php

use App\Models\MedicineStock;
use App\Models\MedicineVendor;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::query()->create([
        'name' => 'Medicine Clerk '.uniqid(),
        'description' => 'test',
    ]);

    $this->user = User::factory()->create([
        'role_id' => $role->id,
    ]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

it('lists vendors for purchase entry without creating stock', function () {
    MedicineVendor::create([
        'name' => 'Aristopharma Ltd',
        'company_name' => 'Aristopharma',
        'phone' => '01710001991',
        'current_balance' => 250,
        'credit_limit' => 1000,
        'payment_terms_days' => 30,
        'is_active' => true,
    ]);

    MedicineVendor::create([
        'name' => 'Inactive Vendor',
        'company_name' => 'Closed',
        'phone' => '01710001992',
        'is_active' => false,
    ]);

    $this->get(route('medicine-corner.purchase'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineCorner/Purchase')
            ->has('vendors', 1)
            ->where('vendors.0.name', 'Aristopharma Ltd')
            ->where('vendors.0.company_name', 'Aristopharma')
        );

    expect(MedicineStock::query()->count())->toBe(0);
});
