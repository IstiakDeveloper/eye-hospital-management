<?php

use App\Models\FixedAsset;
use App\Models\FixedAssetPurchase;
use App\Models\FixedAssetVendor;
use App\Models\FixedAssetVendorPayment;
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

it('shows date-wise ledger with opening balance and running balance for a single vendor', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Evolution Medical',
        'phone' => '01700000010',
        'current_balance' => 440_000,
    ]);

    $asset = FixedAsset::create([
        'name' => 'Equipment',
        'description' => 'Test',
        'total_amount' => 940_000,
        'paid_amount' => 400_000,
        'due_amount' => 540_000,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 940_000,
        'paid_amount' => 400_000,
        'purchase_date' => '2025-10-31',
        'created_by' => $this->user->id,
    ]);

    FixedAssetVendorPayment::create([
        'vendor_id' => $vendor->id,
        'payment_no' => 'FAVP-LEDGER-0001',
        'amount' => 100_000,
        'payment_method' => 'cash',
        'payment_date' => '2026-03-02',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.vendor-due-ledger.fixed-asset', [
        'vendor_id' => $vendor->id,
        'start_date' => '2025-12-01',
        'end_date' => '2026-04-30',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('VendorDue/FixedAssetVendorDueLedger')
            ->where('showVendorColumn', false)
            ->has('ledgerData', 2)
            ->where('ledgerData.0.type', 'opening')
            ->where('ledgerData.0.balance', 540_000)
            ->where('ledgerData.1.type', 'payment')
            ->where('ledgerData.1.payment', 100_000)
            ->where('ledgerData.1.balance', 440_000)
            ->where('totals.closing_balance', 440_000)
        );
});

it('shows vendor column when all vendors are selected', function () {
    $vendor = FixedAssetVendor::create([
        'name' => 'Ledger Vendor',
        'phone' => '01700000011',
        'current_balance' => 10_000,
    ]);

    $asset = FixedAsset::create([
        'name' => 'Chair',
        'description' => 'Test',
        'total_amount' => 10_000,
        'paid_amount' => 0,
        'due_amount' => 10_000,
        'status' => 'active',
        'created_by' => $this->user->id,
    ]);

    FixedAssetPurchase::create([
        'fixed_asset_id' => $asset->id,
        'vendor_id' => $vendor->id,
        'total_amount' => 10_000,
        'paid_amount' => 0,
        'purchase_date' => '2026-01-15',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.vendor-due-ledger.fixed-asset', [
        'start_date' => '2026-01-01',
        'end_date' => '2026-04-30',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('showVendorColumn', true)
            ->where('ledgerData.1.vendor_name', 'Ledger Vendor')
            ->where('ledgerData.1.type', 'purchase')
            ->where('ledgerData.1.purchase_due', 10_000)
        );
});
