<?php

use App\Models\HospitalAccount;
use App\Models\HospitalDueExpense;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalExpenseVendor;
use App\Models\HospitalExpenseVendorPayment;
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

    HospitalAccount::firstOrCreate([], ['balance' => 500_000]);
});

it('renders due expense page', function () {
    $this->get(route('hospital-account.due-expenses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('HospitalAccount/DueExpense'));
});

it('can create vendor and record due expense with partial payment', function () {
    $category = HospitalExpenseCategory::create(['name' => 'Utility Bills', 'is_active' => true]);

    $this->post(route('hospital-account.due-expenses.vendors.store'), [
        'name' => 'Power Company',
        'phone' => '01711111111',
    ])->assertRedirect();

    $vendor = HospitalExpenseVendor::first();
    expect($vendor)->not->toBeNull();

    $this->post(route('hospital-account.due-expenses.store'), [
        'vendor_id' => $vendor->id,
        'expense_category_id' => $category->id,
        'total_amount' => 100_000,
        'paid_amount' => 30_000,
        'description' => 'Monthly electricity bill',
        'expense_date' => now()->toDateString(),
    ])->assertRedirect();

    $dueExpense = HospitalDueExpense::first();
    expect($dueExpense)
        ->total_amount->toEqual(100_000)
        ->paid_amount->toEqual(30_000)
        ->due_amount->toEqual(70_000);

    $vendor->refresh();
    expect((float) $vendor->current_balance)->toBe(70_000.0);

    $transaction = HospitalTransaction::where('type', 'expense')->first();
    expect($transaction->expense_category_id)->toBe($category->id);
    expect((float) HospitalAccount::getBalance())->toBe(470_000.0);
});

it('can record fully due expense without immediate payment', function () {
    $category = HospitalExpenseCategory::create(['name' => 'Maintenance', 'is_active' => true]);
    $vendor = HospitalExpenseVendor::create([
        'name' => 'Repair Shop',
        'phone' => '01722222222',
        'current_balance' => 0,
    ]);

    $this->post(route('hospital-account.due-expenses.store'), [
        'vendor_id' => $vendor->id,
        'expense_category_id' => $category->id,
        'total_amount' => 50_000,
        'paid_amount' => 0,
        'description' => 'AC repair',
        'expense_date' => now()->toDateString(),
    ])->assertRedirect();

    $vendor->refresh();
    expect((float) $vendor->current_balance)->toBe(50_000.0)
        ->and(HospitalTransaction::where('type', 'expense')->count())->toBe(0);
});

it('records vendor payment under original expense category', function () {
    $utility = HospitalExpenseCategory::create(['name' => 'Utility Bills', 'is_active' => true]);
    $vendor = HospitalExpenseVendor::create([
        'name' => 'Supplier',
        'phone' => '01733333333',
        'current_balance' => 80_000,
    ]);

    HospitalDueExpense::create([
        'expense_no' => 'HDE-TEST-001',
        'vendor_id' => $vendor->id,
        'expense_category_id' => $utility->id,
        'total_amount' => 80_000,
        'paid_amount' => 0,
        'due_amount' => 80_000,
        'description' => 'Electric bill',
        'expense_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->post(route('hospital-account.due-expenses.payment', $vendor), [
        'amount' => 25_000,
        'payment_method' => 'cash',
        'description' => 'Partial settlement',
        'payment_date' => now()->toDateString(),
    ])->assertRedirect();

    $vendor->refresh();
    expect((float) $vendor->current_balance)->toBe(55_000.0)
        ->and(HospitalExpenseVendorPayment::count())->toBe(1);

    $paymentTransaction = HospitalTransaction::query()
        ->where('type', 'expense')
        ->where('reference_type', 'hospital_expense_vendor_payments')
        ->first();

    expect($paymentTransaction)->not->toBeNull()
        ->and($paymentTransaction->expense_category_id)->toBe($utility->id)
        ->and($paymentTransaction->category)->toBe('Utility Bills');
});

it('rejects payment exceeding vendor due', function () {
    $category = HospitalExpenseCategory::create(['name' => 'Other Expense', 'is_active' => true]);
    $vendor = HospitalExpenseVendor::create([
        'name' => 'Small Vendor',
        'phone' => '01744444444',
        'current_balance' => 5_000,
    ]);

    HospitalDueExpense::create([
        'expense_no' => 'HDE-TEST-002',
        'vendor_id' => $vendor->id,
        'expense_category_id' => $category->id,
        'total_amount' => 5_000,
        'paid_amount' => 0,
        'due_amount' => 5_000,
        'description' => 'Small bill',
        'expense_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->post(route('hospital-account.due-expenses.payment', $vendor), [
        'amount' => 10_000,
        'payment_method' => 'cash',
        'payment_date' => now()->toDateString(),
    ])->assertSessionHasErrors('amount');
});

it('renders due expense vendor ledger', function () {
    $vendor = HospitalExpenseVendor::create([
        'name' => 'Ledger Vendor',
        'phone' => '01755555555',
        'current_balance' => 10_000,
    ]);

    $category = HospitalExpenseCategory::create(['name' => 'Utility Bills', 'is_active' => true]);

    HospitalDueExpense::create([
        'expense_no' => 'HDE-LEDGER-001',
        'vendor_id' => $vendor->id,
        'expense_category_id' => $category->id,
        'total_amount' => 10_000,
        'paid_amount' => 0,
        'due_amount' => 10_000,
        'description' => 'Test bill',
        'expense_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.vendor-due-ledger.due-expense', ['vendor_id' => $vendor->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('VendorDue/ExpenseVendorDueLedger')
            ->has('ledgerData', 1)
            ->where('ledgerData.0.vendor_name', 'Ledger Vendor')
            ->where('ledgerData.0.purchase_due', 10000));
});
