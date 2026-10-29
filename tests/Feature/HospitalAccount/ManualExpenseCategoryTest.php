<?php

use App\Models\HospitalAccount;
use App\Models\HospitalDueExpense;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalExpenseVendor;
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
    $this->withoutMiddleware(\App\Http\Middleware\SuperAdminOnly::class);

    HospitalAccount::query()->firstOrCreate([], ['balance' => 500_000]);
});

it('hides automatic purchase categories from add expense', function () {
    $this->get(route('hospital-account.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('HospitalAccount/Dashboard')
            ->where('expenseCategories', function ($categories) {
                $names = collect($categories)->pluck('name');

                expect($names->all())
                    ->not->toContain('Medicine Purchase')
                    ->not->toContain('Optics Purchase')
                    ->not->toContain('Medicine Vendor Payment')
                    ->not->toContain('Optics Vendor Payment')
                    ->toContain('Salary');

                return true;
            })
        );

    $this->get(route('hospital-account.due-expenses.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('expenseCategories', function ($categories) {
                $names = collect($categories)->pluck('name');

                expect($names->all())->not->toContain('Medicine Purchase')->not->toContain('Optics Purchase');

                return true;
            })
        );
});

it('rejects a manual medicine purchase expense and leaves the balance unchanged', function () {
    $category = HospitalExpenseCategory::query()->where('name', 'Medicine Purchase')->firstOrFail();

    $this->post(route('hospital-account.expense'), [
        'amount' => 500,
        'category' => 'Medicine Purchase',
        'expense_category_id' => $category->id,
        'description' => 'Typed by hand',
        'date' => '2026-10-28',
    ])->assertRedirect()->assertSessionHasErrors('expense_category_id');

    expect(HospitalTransaction::query()->count())->toBe(0)
        ->and(HospitalAccount::getBalance())->toBe(500_000.0);
});

it('rejects a manual optics purchase expense by category name', function () {
    $this->post(route('hospital-account.expense'), [
        'amount' => 250,
        'category' => 'Optics Purchase',
        'description' => 'Typed by hand',
        'date' => '2026-10-28',
    ])->assertRedirect()->assertSessionHasErrors('category');

    expect(HospitalTransaction::query()->count())->toBe(0)
        ->and(HospitalAccount::getBalance())->toBe(500_000.0);
});

it('still accepts a normal manual expense', function () {
    $category = HospitalExpenseCategory::query()->where('name', 'Salary')->firstOrFail();

    $this->post(route('hospital-account.expense'), [
        'amount' => 1000,
        'category' => 'Salary',
        'expense_category_id' => $category->id,
        'description' => 'October salary',
        'date' => '2026-10-28',
    ])->assertRedirect()->assertSessionHas('success');

    expect(HospitalTransaction::query()->where('category', 'Salary')->count())->toBe(1)
        ->and(HospitalAccount::getBalance())->toBe(499_000.0);
});

it('hides a category when manual entry is turned off', function () {
    $category = HospitalExpenseCategory::query()->create([
        'name' => 'Owner Drawing',
        'is_active' => true,
        'allows_manual_entry' => false,
    ]);

    $this->get(route('hospital-account.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('expenseCategories', function ($categories) {
                expect(collect($categories)->pluck('name')->all())->not->toContain('Owner Drawing');

                return true;
            })
        );

    $this->post(route('hospital-account.expense'), [
        'amount' => 100,
        'category' => 'Owner Drawing',
        'expense_category_id' => $category->id,
        'description' => 'Should stay blocked',
        'date' => '2026-10-28',
    ])->assertRedirect()->assertSessionHasErrors('expense_category_id');

    expect(HospitalTransaction::query()->count())->toBe(0);
});

it('rejects a due expense filed under medicine purchase', function () {
    $category = HospitalExpenseCategory::query()->where('name', 'Medicine Purchase')->firstOrFail();
    $vendor = HospitalExpenseVendor::query()->create([
        'name' => 'Square Pharma',
        'phone' => '01710000000',
        'current_balance' => 0,
    ]);

    $this->post(route('hospital-account.due-expenses.store'), [
        'vendor_id' => $vendor->id,
        'expense_category_id' => $category->id,
        'total_amount' => 396,
        'paid_amount' => 396,
        'description' => 'Manual medicine bill',
        'expense_date' => '2026-10-28',
    ])->assertRedirect()->assertSessionHasErrors('expense_category_id');

    expect(HospitalDueExpense::query()->count())->toBe(0)
        ->and(HospitalAccount::getBalance())->toBe(500_000.0);
});

it('keeps an automatic category off the manual list even if someone tries to allow it', function () {
    $category = HospitalExpenseCategory::query()->where('name', 'Optics Purchase')->firstOrFail();

    $this->put(route('hospital-account.categories.update', $category), [
        'name' => 'Optics Purchase',
        'is_active' => true,
        'allows_manual_entry' => true,
    ])->assertRedirect();

    expect($category->fresh()->allows_manual_entry)->toBeFalse();
});
