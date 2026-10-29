<?php

use App\Models\HospitalTransaction;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::query()->create([
        'name' => 'Super Admin',
        'description' => 'test',
    ]);

    $this->user = User::factory()->create([
        'name' => 'Md. Saidul Islam',
        'role_id' => $role->id,
    ]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

it('shows who created each hospital transaction without changing the amount', function () {
    $transaction = HospitalTransaction::create([
        'transaction_no' => 'HT-CREATED-BY-001',
        'type' => 'expense',
        'amount' => 900,
        'category' => 'Medicine Purchase',
        'description' => 'Paid medicine purchase',
        'transaction_date' => '2026-10-28',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('hospital-account.transactions'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('HospitalAccount/Transactions')
            ->has('transactions.data', 1)
            ->where('transactions.data.0.created_by.name', 'Md. Saidul Islam')
            ->where('transactions.data.0.amount', '900.00')
            ->where('totals.total_expense', 900)
        );

    expect((float) $transaction->fresh()->amount)->toBe(900.0);
});
