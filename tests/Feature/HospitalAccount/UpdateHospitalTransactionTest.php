<?php

use App\Models\HospitalAccount;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalIncomeCategory;
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
        'role_id' => $role->id,
    ]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);

    HospitalAccount::firstOrCreate([], ['balance' => 50_000]);
});

it('does not assign an expense category when updating an income transaction', function () {
    $incomeCategory = HospitalIncomeCategory::create([
        'name' => 'Optics Income',
        'is_active' => true,
    ]);

    $transaction = HospitalTransaction::create([
        'transaction_no' => 'HT-OPTICS-DUE-001',
        'type' => 'income',
        'amount' => 1420,
        'category' => 'Optics Income',
        'income_category_id' => $incomeCategory->id,
        'expense_category_id' => null,
        'description' => 'Optics Due Payment',
        'transaction_date' => '2026-08-27',
        'created_by' => $this->user->id,
    ]);

    $this->put(route('hospital-account.transactions.update', $transaction), [
        'amount' => 1420,
        'category' => 'Optics Income',
        'expense_category_id' => null,
        'description' => 'Optics Due Payment',
        'date' => '2026-08-27',
    ])->assertRedirect();

    $transaction->refresh();

    expect($transaction->expense_category_id)->toBeNull()
        ->and(HospitalExpenseCategory::query()->where('name', 'Optics Income')->exists())->toBeFalse();
});
