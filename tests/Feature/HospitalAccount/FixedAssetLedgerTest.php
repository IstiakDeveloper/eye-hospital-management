<?php

use App\Models\FixedAsset;
use App\Models\FixedAssetPurchase;
use App\Models\FixedAssetVendor;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::query()->create([
        'name' => 'Hospital Accountant '.uniqid(),
        'description' => 'test',
    ]);

    $this->user = User::factory()->create([
        'role_id' => $role->id,
    ]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

it('displays the fixed asset ledger page', function () {
    $this->get(route('hospital-account.fixed-assets.ledger'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('HospitalAccount/FixedAssets/Ledger')
            ->has('ledgerData')
            ->has('vendors')
            ->has('filters')
            ->has('totals')
        );
});

it('shows purchase transactions with running balance', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Medical Equipment Ltd',
        'phone' => '01700000001',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Slit Lamp',
        'description' => 'Diagnostic lamp',
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'description' => 'First unit',
        'total_amount' => 50000,
        'paid_amount' => 20000,
        'purchase_date' => '2026-01-10',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'description' => 'Second unit',
        'total_amount' => 30000,
        'paid_amount' => 30000,
        'purchase_date' => '2026-02-15',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.fixed-assets.ledger'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('HospitalAccount/FixedAssets/Ledger')
            ->has('ledgerData', 2)
            ->where('ledgerData.0.asset_name', 'Slit Lamp')
            ->where('ledgerData.0.purchase_amount', 50000)
            ->where('ledgerData.0.previous_balance', 0)
            ->where('ledgerData.0.balance', 50000)
            ->where('ledgerData.1.purchase_amount', 30000)
            ->where('ledgerData.1.previous_balance', 50000)
            ->where('ledgerData.1.balance', 80000)
            ->where('totals.purchase_amount', 80000)
            ->where('totals.paid_amount', 50000)
            ->where('totals.due_amount', 30000)
            ->where('totals.balance', 80000)
        );
});

it('filters ledger by date range', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Date Filter Vendor',
        'phone' => '01700000002',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Chair',
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 10000,
        'paid_amount' => 10000,
        'purchase_date' => '2026-01-05',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 15000,
        'paid_amount' => 0,
        'purchase_date' => '2026-03-20',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.fixed-assets.ledger', [
        'start_date' => '2026-03-01',
        'end_date' => '2026-03-31',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ledgerData', 1)
            ->where('ledgerData.0.purchase_amount', 15000)
            ->where('totals.purchase_amount', 15000)
        );
});

it('filters ledger by vendor', function () {
    $vendorA = FixedAssetVendor::create([
        'name' => 'Vendor A',
        'phone' => '01700000003',
    ]);
    $vendorB = FixedAssetVendor::create([
        'name' => 'Vendor B',
        'phone' => '01700000004',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Table',
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendorA->id,
        'total_amount' => 8000,
        'paid_amount' => 8000,
        'purchase_date' => '2026-04-01',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendorB->id,
        'total_amount' => 12000,
        'paid_amount' => 0,
        'purchase_date' => '2026-04-02',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.fixed-assets.ledger', [
        'vendor_id' => $vendorB->id,
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ledgerData', 1)
            ->where('ledgerData.0.vendor_name', 'Vendor B')
            ->where('totals.purchase_amount', 12000)
        );
});
