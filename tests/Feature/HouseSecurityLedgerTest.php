<?php

use App\Models\HospitalExpenseCategory;
use App\Models\HospitalTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create a user with appropriate permissions
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Create House Security category
    $this->houseSecurityCategory = HospitalExpenseCategory::create([
        'name' => 'House Security',
        'is_active' => true,
    ]);
});

it('displays the house security ledger page', function () {
    $response = $this->get('/hospital-account/house-security-ledger');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('HouseSecurity/Ledger'));
});

it('shows house security transactions in the ledger', function () {
    // Create some House Security transactions
    HospitalTransaction::create([
        'transaction_no' => 'TXN-001',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 5000,
        'description' => 'Security Guard Salary',
        'transaction_date' => now()->subDays(2),
        'created_by' => $this->user->id,
    ]);

    HospitalTransaction::create([
        'transaction_no' => 'TXN-002',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 3000,
        'description' => 'Security Equipment',
        'transaction_date' => now()->subDays(1),
        'created_by' => $this->user->id,
    ]);

    $response = $this->get('/hospital-account/house-security-ledger');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('ledgerData', 2)
        ->has('totals')
        ->where('totals.total_expense', 8000)
        ->where('totals.balance', 8000)
    );
});

it('filters transactions by date range', function () {
    HospitalTransaction::create([
        'transaction_no' => 'TXN-003',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 5000,
        'description' => 'Old Transaction',
        'transaction_date' => now()->subMonth(),
        'created_by' => $this->user->id,
    ]);

    HospitalTransaction::create([
        'transaction_no' => 'TXN-004',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 3000,
        'description' => 'Recent Transaction',
        'transaction_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $response = $this->get('/hospital-account/house-security-ledger?'.http_build_query([
        'start_date' => now()->subDays(1)->format('Y-m-d'),
        'end_date' => now()->format('Y-m-d'),
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('ledgerData', 1)
        ->where('totals.total_expense', 3000)
    );
});

it('filters transactions by description', function () {
    HospitalTransaction::create([
        'transaction_no' => 'TXN-005',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 5000,
        'description' => 'Security Guard Salary',
        'transaction_date' => now(),
        'created_by' => $this->user->id,
    ]);

    HospitalTransaction::create([
        'transaction_no' => 'TXN-006',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 3000,
        'description' => 'Security Equipment',
        'transaction_date' => now(),
        'created_by' => $this->user->id,
    ]);

    $response = $this->get('/hospital-account/house-security-ledger?'.http_build_query([
        'description' => 'Guard',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('ledgerData', 1)
        ->where('totals.total_expense', 5000)
    );
});

it('calculates running balance correctly', function () {
    HospitalTransaction::create([
        'transaction_no' => 'TXN-007',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 5000,
        'transaction_date' => now()->subDays(2),
        'created_by' => $this->user->id,
    ]);

    HospitalTransaction::create([
        'transaction_no' => 'TXN-008',
        'expense_category_id' => $this->houseSecurityCategory->id,
        'type' => 'expense',
        'amount' => 3000,
        'transaction_date' => now()->subDays(1),
        'created_by' => $this->user->id,
    ]);

    $response = $this->get('/hospital-account/house-security-ledger');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('ledgerData.0.balance', 5000)
        ->where('ledgerData.1.balance', 8000)
        ->where('totals.balance', 8000)
    );
});
