<?php

use App\Models\HospitalAccount;
use App\Models\Medicine;
use App\Models\MedicineStock;
use App\Models\MedicineVendor;
use App\Models\MedicineVendorTransaction;
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

it('sends the old vendor dues page to the vendor dues tab', function () {
    $this->get(route('medicine-corner.vendor-dues'))
        ->assertRedirect(route('medicine-vendors.due-report'));
});

it('renders the vendor list and does not change balances', function () {
    $vendor = MedicineVendor::create([
        'name' => 'Square Pharma',
        'phone' => '01710000999',
        'current_balance' => 1500,
        'credit_limit' => 0,
        'balance_type' => 'due',
    ]);

    $this->get(route('medicine-vendors.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineVendor/Index')
            ->where('statistics.total_vendors', 1)
            ->where('statistics.total_dues', 1500)
            ->where('statistics.vendors_with_dues', 1)
            ->has('vendors.data', 1)
        );

    expect((float) $vendor->fresh()->current_balance)->toBe(1500.0)
        ->and((float) $vendor->fresh()->credit_limit)->toBe(0.0);
});

it('renders dues as a list and does not change balances', function () {
    $vendor = MedicineVendor::create([
        'name' => 'Due Vendor',
        'phone' => '01710000888',
        'current_balance' => 250,
        'balance_type' => 'due',
    ]);

    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-DUE-CURRENT',
        'vendor_id' => $vendor->id,
        'type' => 'purchase',
        'amount' => 80,
        'due_amount' => 80,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'Current month purchase',
        'transaction_date' => now()->toDateString(),
        'due_date' => now()->addDays(10)->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->get(route('medicine-vendors.due-report'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineVendor/DueReport')
            ->has('vendorsWithDues', 1)
            ->where('summary.vendor_count', 1)
            ->where('summary.total_dues', 80)
        );

    expect((float) $vendor->fresh()->current_balance)->toBe(250.0);
});

it('filters vendor dues by the selected dates without changing balances', function () {
    $inside = MedicineVendor::create([
        'name' => 'Inside Vendor',
        'phone' => '01710000111',
        'current_balance' => 250,
        'balance_type' => 'due',
    ]);
    $outside = MedicineVendor::create([
        'name' => 'Outside Vendor',
        'phone' => '01710000222',
        'current_balance' => 400,
        'balance_type' => 'due',
    ]);

    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-INSIDE',
        'vendor_id' => $inside->id,
        'type' => 'purchase',
        'amount' => 80,
        'due_amount' => 80,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'March purchase',
        'transaction_date' => '2026-03-15',
        'due_date' => '2026-04-15',
        'created_by' => $this->user->id,
    ]);
    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-OUTSIDE',
        'vendor_id' => $outside->id,
        'type' => 'purchase',
        'amount' => 40,
        'due_amount' => 40,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'Last year purchase',
        'transaction_date' => '2025-01-02',
        'due_date' => '2025-02-02',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('medicine-vendors.due-report', [
        'date_from' => '2026-03-01',
        'date_to' => '2026-03-31',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('vendorsWithDues', 1)
            ->where('vendorsWithDues.0.name', 'Inside Vendor')
            ->where('vendorsWithDues.0.period_due', 80)
            ->where('summary.total_dues', 80)
            ->where('summary.vendor_count', 1)
            ->where('filters.date_from', '2026-03-01')
            ->where('filters.date_to', '2026-03-31')
        );

    expect((float) $inside->fresh()->current_balance)->toBe(250.0)
        ->and((float) $outside->fresh()->current_balance)->toBe(400.0);
});

it('shows every open bill when no dates are selected', function () {
    $old = MedicineVendor::create([
        'name' => 'Old Vendor',
        'phone' => '01710000333',
        'current_balance' => 40,
        'balance_type' => 'due',
    ]);
    $current = MedicineVendor::create([
        'name' => 'Current Vendor',
        'phone' => '01710000444',
        'current_balance' => 80,
        'balance_type' => 'due',
    ]);

    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-OLD',
        'vendor_id' => $old->id,
        'type' => 'purchase',
        'amount' => 40,
        'due_amount' => 40,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'Old purchase',
        'transaction_date' => '2025-01-02',
        'due_date' => '2025-02-02',
        'created_by' => $this->user->id,
    ]);
    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-CURRENT',
        'vendor_id' => $current->id,
        'type' => 'purchase',
        'amount' => 80,
        'due_amount' => 80,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'Current purchase',
        'transaction_date' => now()->toDateString(),
        'due_date' => now()->addDays(10)->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->get(route('medicine-vendors.due-report'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('vendorsWithDues', 2)
            ->where('filters.date_from', '')
            ->where('filters.date_to', '')
            ->where('summary.total_dues', 120)
            ->where('vendorsWithDues', function ($vendors) {
                $oldVendor = collect($vendors)->firstWhere('name', 'Old Vendor');

                expect($oldVendor['transactions'][0]['transaction_no'])->toBe('VT-OLD')
                    ->and($oldVendor['transactions'][0]['purchase_date'])->toBe('2025-01-02');

                return true;
            })
        );

    expect((float) $old->fresh()->current_balance)->toBe(40.0)
        ->and((float) $current->fresh()->current_balance)->toBe(80.0);
});

it('uses the stock purchase date on an open bill', function () {
    $vendor = MedicineVendor::create([
        'name' => 'Stock Vendor',
        'phone' => '01710000555',
        'current_balance' => 396,
        'balance_type' => 'due',
    ]);
    $medicine = Medicine::create([
        'name' => 'Ciprocin 500mg Tab',
        'type' => 'Tablet',
    ]);
    $stock = MedicineStock::create([
        'medicine_id' => $medicine->id,
        'vendor_id' => $vendor->id,
        'batch_number' => 'AUTO-20260915',
        'expiry_date' => '2027-09-15',
        'quantity' => 30,
        'available_quantity' => 0,
        'buy_price' => 13.2,
        'sale_price' => 15,
        'purchase_date' => '2026-09-15',
        'added_by' => $this->user->id,
    ]);

    MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-260915-0001',
        'vendor_id' => $vendor->id,
        'type' => 'purchase',
        'amount' => 396,
        'due_amount' => 396,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'reference_type' => 'medicine_purchase',
        'reference_id' => $stock->id,
        'description' => 'Ciprocin purchase',
        'transaction_date' => '2026-09-16',
        'due_date' => '2026-11-14',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('medicine-vendors.due-report'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('vendorsWithDues.0.transactions.0.purchase_date', '2026-09-15')
            ->where('vendorsWithDues.0.transactions.0.transaction_no', 'VT-260915-0001')
        );

    $this->get(route('medicine-vendors.show', $vendor))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineVendor/Show')
            ->where('vendor.transactions.0.purchase_date', '2026-09-15')
            ->where('vendor.transactions.0.transaction_no', 'VT-260915-0001')
        );

    expect((float) $vendor->fresh()->current_balance)->toBe(396.0);
});

it('pays one open bill and leaves the vendor balance formula unchanged', function () {
    HospitalAccount::query()->firstOrCreate([], ['balance' => 10_000]);

    $vendor = MedicineVendor::create([
        'name' => 'Bill Pay Vendor',
        'phone' => '01710000666',
        'current_balance' => 396,
        'opening_balance' => 0,
        'balance_type' => 'due',
    ]);
    $bill = MedicineVendorTransaction::query()->create([
        'transaction_no' => 'VT-PAY-1',
        'vendor_id' => $vendor->id,
        'type' => 'purchase',
        'amount' => 396,
        'due_amount' => 396,
        'paid_amount' => 0,
        'payment_status' => 'pending',
        'description' => 'Open bill',
        'transaction_date' => '2026-09-15',
        'due_date' => '2026-11-14',
        'created_by' => $this->user->id,
    ]);

    $this->post(route('medicine-vendors.make-payment'), [
        'vendor_id' => $vendor->id,
        'amount' => 396,
        'payment_method' => 'cash',
        'payment_date' => '2026-10-28',
        'description' => 'Payment for bill VT-PAY-1',
        'allocated_transactions' => [$bill->id],
    ])->assertRedirect()->assertSessionHas('success');

    $bill->refresh();
    $vendor->refresh();

    expect($bill->payment_status)->toBe('paid')
        ->and((float) $bill->due_amount)->toBe(0.0)
        ->and((float) $bill->paid_amount)->toBe(396.0)
        ->and((float) $vendor->current_balance)->toBe(0.0)
        ->and($vendor->balance_type)->toBe('due')
        ->and(HospitalAccount::getBalance())->toBe(9604.0);

    $this->get(route('medicine-vendors.due-report'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->has('vendorsWithDues', 0));
});

it('renders the payment list', function () {
    $this->get(route('medicine-vendors.payment-history'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('MedicineVendor/PaymentHistory')
            ->where('totalPayments', 0)
        );
});

it('redirects guests away from the vendor list', function () {
    $this->withMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
    auth()->logout();

    $this->get(route('medicine-vendors.index'))->assertRedirect('/login');
});
