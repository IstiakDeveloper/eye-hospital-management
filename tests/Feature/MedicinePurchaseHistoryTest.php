<?php

use App\Models\Medicine;
use App\Models\MedicineStock;
use App\Models\MedicineVendor;
use App\Models\MedicineVendorTransaction;
use App\Models\Role;
use App\Models\StockTransaction;
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

function createHistoryMedicine(string $name): Medicine
{
    return Medicine::create([
        'name' => $name,
        'generic_name' => 'Test generic',
        'type' => 'Tablet',
        'manufacturer' => 'ACI',
        'unit' => 'pcs',
        'total_stock' => 40,
        'is_active' => true,
    ]);
}

function createHistoryVendor(string $phone): MedicineVendor
{
    return MedicineVendor::create([
        'name' => 'Square Pharma',
        'phone' => $phone,
        'current_balance' => 1500,
        'credit_limit' => 5000,
    ]);
}

/**
 * @return array<string, mixed>
 */
function purchasePayload(Medicine $medicine, MedicineVendor $vendor, User $user, string $date, int $quantity, int $available, float $buyPrice): array
{
    return [
        'medicine_id' => $medicine->id,
        'vendor_id' => $vendor->id,
        'batch_number' => 'B-'.$date,
        'expiry_date' => '2028-01-01',
        'quantity' => $quantity,
        'available_quantity' => $available,
        'buy_price' => $buyPrice,
        'sale_price' => 20,
        'purchase_date' => $date,
        'added_by' => $user->id,
    ];
}

it('shows purchased quantity for the selected dates and does not change stock', function () {
    $medicine = createHistoryMedicine('Moxifloxacin');
    $other = createHistoryMedicine('Other drop');
    $vendor = createHistoryVendor('01710000001');

    $inside = MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-10-15', 50, 12, 12.5));
    MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-09-01', 99, 99, 8));
    MedicineStock::create(purchasePayload($other, $vendor, $this->user, '2026-10-15', 7, 7, 5));

    $response = $this->get(route('medicine-corner.medicine-history', [
        'medicine' => $medicine,
        'from_date' => '2026-10-01',
        'to_date' => '2026-10-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('MedicineCorner/MedicineHistory')
        ->where('medicine.name', 'Moxifloxacin')
        ->has('purchases', 1)
        ->where('purchases.0.quantity', 50)
        ->where('purchases.0.vendor_name', 'Square Pharma')
        ->where('purchases.0.buy_price', 12.5)
        ->where('purchases.0.total_amount', 625)
        ->where('purchases.0.was_updated', false)
        ->where('summary.purchase_count', 1)
        ->where('summary.total_quantity', 50)
        ->where('summary.total_amount', 625)
    );

    expect($inside->fresh()->quantity)->toBe(50)
        ->and($inside->fresh()->available_quantity)->toBe(12)
        ->and((float) $vendor->fresh()->current_balance)->toBe(1500.0)
        ->and($medicine->fresh()->total_stock)->toBe(40);
});

it('shows the bill number and whether that purchase was paid or still due', function () {
    $medicine = createHistoryMedicine('Ciprocin 500mg Tab');
    $vendor = createHistoryVendor('01710000021');

    $dueStock = MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-09-15', 30, 0, 13.2));
    $paidStock = MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-09-20', 10, 10, 15));

    MedicineVendorTransaction::create([
        'transaction_no' => 'VT-260915-0001',
        'vendor_id' => $vendor->id,
        'type' => 'purchase',
        'amount' => 396,
        'due_amount' => 396,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'reference_type' => 'medicine_purchase',
        'reference_id' => $dueStock->id,
        'payment_method' => 'cash',
        'description' => 'Medicine purchase - Ciprocin 500mg Tab',
        'transaction_date' => '2026-09-15',
        'due_date' => '2026-11-14',
        'created_by' => $this->user->id,
    ]);

    MedicineVendorTransaction::create([
        'transaction_no' => 'VT-260920-0002',
        'vendor_id' => $vendor->id,
        'type' => 'purchase',
        'amount' => 150,
        'due_amount' => 0,
        'paid_amount' => 150,
        'payment_status' => 'paid',
        'reference_type' => 'medicine_purchase',
        'reference_id' => $paidStock->id,
        'payment_method' => 'cash',
        'description' => 'Medicine purchase paid',
        'transaction_date' => '2026-09-20',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('medicine-corner.medicine-history', [
        'medicine' => $medicine,
        'from_date' => '2026-09-01',
        'to_date' => '2026-09-30',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('purchases', 2)
            ->where('purchases.0.bill_no', 'VT-260920-0002')
            ->where('purchases.0.payment_status', 'paid')
            ->where('purchases.0.quantity', 10)
            ->where('purchases.1.bill_no', 'VT-260915-0001')
            ->where('purchases.1.payment_status', 'pending')
            ->where('purchases.1.due_amount', 396)
            ->where('purchases.1.paid_amount', 0)
            ->where('purchases.1.quantity', 30)
        );

    expect($dueStock->fresh()->quantity)->toBe(30)
        ->and($dueStock->fresh()->available_quantity)->toBe(0)
        ->and($paidStock->fresh()->available_quantity)->toBe(10)
        ->and((float) $vendor->fresh()->current_balance)->toBe(1500.0);
});

it('returns an empty history when nothing was purchased in the range', function () {
    $medicine = createHistoryMedicine('Empty med');
    $vendor = createHistoryVendor('01710000002');
    MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-01-01', 10, 10, 4));

    $response = $this->get(route('medicine-corner.medicine-history', [
        'medicine' => $medicine,
        'from_date' => '2026-10-01',
        'to_date' => '2026-10-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('purchases', 0)
        ->where('summary.purchase_count', 0)
        ->where('summary.total_quantity', 0)
        ->where('summary.total_amount', 0)
    );
});

it('marks a purchase that was edited later', function () {
    $medicine = createHistoryMedicine('Edited med');
    $vendor = createHistoryVendor('01710000003');
    $stock = MedicineStock::create(purchasePayload($medicine, $vendor, $this->user, '2026-10-10', 80, 80, 10));

    StockTransaction::create([
        'medicine_stock_id' => $stock->id,
        'type' => 'adjustment',
        'quantity' => 80,
        'unit_price' => 10,
        'total_amount' => 800,
        'reason' => 'Stock purchase updated - Batch: B-2026-10-10',
        'created_by' => $this->user->id,
    ]);

    $response = $this->get(route('medicine-corner.medicine-history', [
        'medicine' => $medicine,
        'from_date' => '2026-10-01',
        'to_date' => '2026-10-31',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('purchases.0.was_updated', true)
        ->where('purchases.0.quantity', 80)
    );

    expect($stock->fresh()->quantity)->toBe(80);
});

it('rejects a date range that ends before it starts', function () {
    $medicine = createHistoryMedicine('Range med');

    $this->get(route('medicine-corner.medicine-history', [
        'medicine' => $medicine,
        'from_date' => '2026-10-20',
        'to_date' => '2026-10-01',
    ]))->assertSessionHasErrors('to_date');

    expect($medicine->fresh()->total_stock)->toBe(40);
});

it('redirects guests away from purchase history', function () {
    $this->withMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
    auth()->logout();

    $medicine = createHistoryMedicine('Guest med');

    $this->get(route('medicine-corner.medicine-history', $medicine))->assertRedirect('/login');
});
