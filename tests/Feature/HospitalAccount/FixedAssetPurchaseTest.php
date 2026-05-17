<?php

use App\Models\FixedAsset;
use App\Models\FixedAssetPurchase;
use App\Models\FixedAssetVendor;
use App\Models\HospitalAccount;
use App\Models\HospitalTransaction;
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

    HospitalAccount::firstOrCreate([], ['balance' => 100000]);
});

it('shows fixed asset detail without missing payments table', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Test Vendor',
        'phone' => '01700000000',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Office Chair',
        'description' => 'Ergonomic chairs',
        'total_amount' => 10000,
        'paid_amount' => 5000,
        'due_amount' => 5000,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'purchase_number' => 'FAP-TEST-0001',
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 10000,
        'paid_amount' => 5000,
        'due_amount' => 5000,
        'purchase_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $response = $this->get(route('hospital-account.fixed-assets.show', $asset));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('HospitalAccount/FixedAssets/Show')
        ->has('fixedAsset.purchases', 1)
        ->where('fixedAsset.name', 'Office Chair')
        ->where('defaultVendorId', $vendor->id)
    );
});

it('adds quantity to existing asset via show page with full hospital payment', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Chair Vendor',
        'phone' => '01711111111',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Office Chair',
        'description' => 'Chairs',
        'total_amount' => 10000,
        'paid_amount' => 10000,
        'due_amount' => 0,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'purchase_number' => 'FAP-TEST-0001',
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 10000,
        'paid_amount' => 10000,
        'due_amount' => 0,
        'purchase_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $balanceBefore = HospitalAccount::getBalance();

    $response = $this->post(route('hospital-account.fixed-assets.purchases.store', $asset), [
        'quantity' => 5,
        'total_amount' => 15000,
        'purchase_date' => now()->toDateString(),
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $asset->refresh();

    expect($asset->total_amount)->toEqual(25000.0)
        ->and($asset->paid_amount)->toEqual(25000.0)
        ->and($asset->due_amount)->toEqual(0.0)
        ->and($asset->purchases()->count())->toBe(2)
        ->and(HospitalAccount::getBalance())->toEqual($balanceBefore - 15000)
        ->and(
            HospitalTransaction::query()
                ->where('category', 'Fixed Asset Purchase')
                ->where('amount', 15000)
                ->exists()
        )->toBeTrue();
});

it('adds purchase without quantity on show page', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Interior Vendor',
        'phone' => '01777777777',
    ]);

    $asset = FixedAsset::create([
        'name' => 'Interior Design',
        'description' => 'Interior',
        'total_amount' => 100000,
        'paid_amount' => 100000,
        'due_amount' => 0,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'purchase_number' => 'FAP-TEST-0002',
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 100000,
        'paid_amount' => 100000,
        'due_amount' => 0,
        'purchase_date' => '2026-05-01',
        'created_by' => $this->user->id,
    ]);

    $purchaseDate = '2026-05-15';

    $this->post(route('hospital-account.fixed-assets.purchases.store', $asset), [
        'total_amount' => 25000,
        'purchase_date' => $purchaseDate,
    ])->assertRedirect()->assertSessionHas('success');

    $purchase = $asset->purchases()->latest('id')->first();

    expect($purchase->quantity)->toBeNull()
        ->and($purchase->total_amount)->toEqual(25000.0)
        ->and($purchase->purchase_date->toDateString())->toBe($purchaseDate);
});

it('creates new asset with full hospital payment and transaction', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Vendor A',
        'phone' => '01722222222',
    ]);

    $balanceBefore = HospitalAccount::getBalance();
    $purchaseDate = '2026-04-01';

    $response = $this->post(route('hospital-account.fixed-assets.store'), [
        'vendor_id' => $vendor->id,
        'name' => 'Hospital Bed',
        'description' => '10 beds',
        'quantity' => 10,
        'total_amount' => 50000,
        'paid_amount' => 50000,
        'purchase_date' => $purchaseDate,
    ]);

    $response->assertRedirect(route('hospital-account.fixed-assets.index'));
    $response->assertSessionHas('success');

    $asset = FixedAsset::where('name', 'Hospital Bed')->first();

    expect($asset)->not->toBeNull()
        ->and($asset->total_amount)->toEqual(50000.0)
        ->and($asset->paid_amount)->toEqual(50000.0)
        ->and($asset->purchases()->count())->toBe(1)
        ->and(HospitalAccount::getBalance())->toEqual($balanceBefore - 50000);

    $transaction = HospitalTransaction::query()
        ->where('category', 'Fixed Asset Purchase')
        ->where('amount', 50000)
        ->first();

    expect($transaction)->not->toBeNull()
        ->and($transaction->transaction_date->toDateString())->toBe($purchaseDate);
});

it('creates new asset with vendor due when partial payment', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Credit Vendor',
        'phone' => '01788888888',
    ]);

    $balanceBefore = HospitalAccount::getBalance();

    $this->post(route('hospital-account.fixed-assets.store'), [
        'vendor_id' => $vendor->id,
        'name' => 'On Credit Furniture',
        'total_amount' => 100000,
        'paid_amount' => 40000,
        'purchase_date' => now()->toDateString(),
    ])->assertRedirect();

    $asset = FixedAsset::where('name', 'On Credit Furniture')->first();

    expect($asset->total_amount)->toEqual(100000.0)
        ->and($asset->paid_amount)->toEqual(40000.0)
        ->and($asset->due_amount)->toEqual(60000.0)
        ->and($vendor->fresh()->current_balance)->toEqual(60000.0)
        ->and(HospitalAccount::getBalance())->toEqual($balanceBefore - 40000)
        ->and(
            HospitalTransaction::query()
                ->where('category', 'Fixed Asset Purchase')
                ->where('amount', 40000)
                ->exists()
        )->toBeTrue();
});
