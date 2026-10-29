<?php

use App\Models\Medicine;
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

/**
 * @param  array<string, mixed>  $overrides
 */
function makeListedStock(User $user, string $date, int $available, float $buyPrice, array $overrides = []): MedicineStock
{
    $medicine = Medicine::create([
        'name' => $overrides['medicine_name'] ?? 'Ciprocin '.$date,
        'generic_name' => 'Ciprofloxacin',
        'type' => 'Tablet',
        'manufacturer' => 'ACI',
        'unit' => 'pcs',
        'total_stock' => 40,
        'is_active' => true,
    ]);

    $vendor = MedicineVendor::create([
        'name' => 'Square Pharma',
        'company_name' => 'Square',
        'phone' => $overrides['phone'] ?? '017'.random_int(10000000, 99999999),
        'current_balance' => 1500,
        'is_active' => true,
    ]);

    return MedicineStock::create([
        'medicine_id' => $medicine->id,
        'vendor_id' => $vendor->id,
        'batch_number' => 'B-'.$date.'-'.random_int(100, 999),
        'expiry_date' => '2028-01-01',
        'quantity' => $overrides['quantity'] ?? $available,
        'available_quantity' => $available,
        'buy_price' => $buyPrice,
        'sale_price' => 20,
        'purchase_date' => $date,
        'added_by' => $user->id,
    ]);
}

it('lists on-hand stock with the latest purchase first and does not change quantities', function () {
    $older = makeListedStock($this->user, '2026-10-05', 4, 5, ['phone' => '01710001001']);
    $newer = makeListedStock($this->user, '2026-10-20', 12, 10, ['phone' => '01710001002']);
    makeListedStock($this->user, '2026-10-28', 0, 8, ['phone' => '01710001003', 'quantity' => 8]);

    $this->get(route('medicine-corner.stock'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineCorner/Stock')
            ->has('stocks.data', 2)
            ->where('stocks.data.0.id', $newer->id)
            ->where('stocks.data.1.id', $older->id)
            ->where('totalStockValue', 140)
        );

    expect($newer->fresh()->available_quantity)->toBe(12)
        ->and($older->fresh()->available_quantity)->toBe(4)
        ->and($newer->fresh()->quantity)->toBe(12);
});

it('filters the stock list by purchase date without changing quantities', function () {
    $inside = makeListedStock($this->user, '2026-10-05', 4, 5, ['phone' => '01710001011']);
    $outside = makeListedStock($this->user, '2026-09-15', 9, 3, ['phone' => '01710001012']);

    $this->get(route('medicine-corner.stock', [
        'from_date' => '2026-10-01',
        'to_date' => '2026-10-31',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('stocks.data', 1)
            ->where('stocks.data.0.id', $inside->id)
            ->where('filters.from_date', '2026-10-01')
            ->where('filters.to_date', '2026-10-31')
            ->where('totalStockValue', 20)
        );

    expect($inside->fresh()->available_quantity)->toBe(4)
        ->and($outside->fresh()->available_quantity)->toBe(9);
});

it('filters the stock list by vendor without changing quantities', function () {
    $chosen = makeListedStock($this->user, '2026-10-20', 6, 4, ['phone' => '01710001021', 'medicine_name' => 'Chosen med']);
    $other = makeListedStock($this->user, '2026-10-18', 3, 7, ['phone' => '01710001022', 'medicine_name' => 'Other med']);

    $this->get(route('medicine-corner.stock', [
        'vendor_id' => $chosen->vendor_id,
    ]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('stocks.data', 1)
            ->where('stocks.data.0.id', $chosen->id)
            ->where('filters.vendor_id', $chosen->vendor_id)
            ->where('totalStockValue', 24)
        );

    expect($chosen->fresh()->available_quantity)->toBe(6)
        ->and($other->fresh()->available_quantity)->toBe(3);
});
