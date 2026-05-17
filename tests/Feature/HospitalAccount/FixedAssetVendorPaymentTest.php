<?php

use App\Models\FixedAssetVendor;
use App\Models\FixedAssetVendorPayment;
use App\Models\HospitalAccount;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

    HospitalAccount::firstOrCreate([], ['balance' => 1_000_000]);
});

it('generates unique payment numbers for multiple vendor payments on the same day', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Vendor Due Test',
        'phone' => '01700000001',
        'current_balance' => 100_000,
    ]);

    $first = $vendor->makePayment(10_000, 'First payment');
    $second = $vendor->makePayment(5_000, 'Second payment');

    expect($first->payment_no)->not->toBe($second->payment_no)
        ->and(FixedAssetVendorPayment::count())->toBe(2);
});

it('can store vendor payment via controller route', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Route Vendor',
        'phone' => '01700000002',
        'current_balance' => 50_000,
    ]);

    $this->post(route('hospital-account.fixed-asset-vendors.payment', $vendor), [
        'amount' => 20_000,
        'payment_method' => 'cash',
        'description' => 'Vendor payment',
        'payment_date' => now()->toDateString(),
    ])->assertRedirect();

    $this->post(route('hospital-account.fixed-asset-vendors.payment', $vendor), [
        'amount' => 15_000,
        'payment_method' => 'cash',
        'description' => 'Second vendor payment',
        'payment_date' => now()->toDateString(),
    ])->assertRedirect();

    $paymentNumbers = FixedAssetVendorPayment::where('vendor_id', $vendor->id)->pluck('payment_no');

    expect($paymentNumbers->unique()->count())->toBe(2);
});

it('calculates outstanding due per purchase after vendor payments', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Outstanding Due Vendor',
        'phone' => '01700000003',
        'current_balance' => 143_800,
    ]);

    $asset = \App\Models\FixedAsset::create([
        'name' => 'Slit Lamp',
        'description' => 'Test',
        'total_amount' => 160_000,
        'paid_amount' => 16_200,
        'due_amount' => 143_800,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    $purchase = \App\Models\FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 160_000,
        'paid_amount' => 16_200,
        'purchase_date' => '2025-10-31',
        'created_by' => $this->user->id,
    ]);

    FixedAssetVendorPayment::create([
        'vendor_id' => $vendor->id,
        'payment_no' => 'FAVP-TEST-OUT-01',
        'amount' => 50_000,
        'payment_method' => 'cash',
        'payment_date' => '2025-11-17',
        'created_by' => $this->user->id,
    ]);

    FixedAssetVendorPayment::create([
        'vendor_id' => $vendor->id,
        'payment_no' => 'FAVP-TEST-OUT-02',
        'amount' => 50_000,
        'payment_method' => 'cash',
        'payment_date' => '2026-01-04',
        'created_by' => $this->user->id,
    ]);

    $outstanding = $vendor->fresh()->outstandingDueByPurchaseId();

    expect($outstanding[$purchase->id])->toBe(43_800.0);
});
