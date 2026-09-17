<?php

use App\Models\HospitalExpenseCategory;
use App\Models\HospitalIncomeCategory;
use App\Models\Role;
use App\Models\User;
use App\Support\IncomeExpenditureCumulativeCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::query()->create([
        'name' => 'Report Viewer '.uniqid(),
        'description' => 'test',
    ]);

    $this->user = User::factory()->create([
        'role_id' => $role->id,
    ]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

it('does not include income transactions in expenditure categories', function () {
    $expenseCategory = HospitalExpenseCategory::create([
        'name' => 'Optics Income',
        'is_active' => true,
    ]);
    $incomeCategory = HospitalIncomeCategory::create([
        'name' => 'Optics Income',
        'is_active' => true,
    ]);

    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HT-OPTICS-INCOME-001',
        'type' => 'income',
        'amount' => 1420,
        'category' => 'Optics Income',
        'expense_category_id' => $expenseCategory->id,
        'income_category_id' => $incomeCategory->id,
        'description' => 'Optics Due Payment',
        'transaction_date' => '2026-08-27',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->get(route('reports.income-expenditure', [
        'from_date' => '2026-08-01',
        'to_date' => '2026-08-31',
    ]));

    $response->assertSuccessful();
    $expenses = collect(data_get($response->viewData('page'), 'props.expenses'));
    $totals = data_get($response->viewData('page'), 'props.totals');

    expect($expenses->firstWhere('category', 'Optics Income'))->toBeNull()
        ->and((float) $totals['current_month_expenditure'])->toBe(0.0)
        ->and((float) $totals['cumulative_expenditure'])->toBe(0.0);

    $calculatorTotals = IncomeExpenditureCumulativeCalculator::totalsToDate('2026-08-31');
    expect($calculatorTotals['total_expenditure'])->toBe(0.0);
});

it('still includes genuine expense transactions in expenditure', function () {
    $expenseCategory = HospitalExpenseCategory::create([
        'name' => 'Electricity Test Expense',
        'is_active' => true,
    ]);

    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HT-EXPENSE-001',
        'type' => 'expense',
        'amount' => 500,
        'category' => 'Electricity Test Expense',
        'expense_category_id' => $expenseCategory->id,
        'description' => 'Electricity bill',
        'transaction_date' => '2026-08-10',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->get(route('reports.income-expenditure', [
        'from_date' => '2026-08-01',
        'to_date' => '2026-08-31',
    ]));

    $response->assertSuccessful();
    $expenses = collect(data_get($response->viewData('page'), 'props.expenses'));
    $utility = $expenses->firstWhere('category', 'Electricity Test Expense');

    expect($utility)->not->toBeNull()
        ->and((float) $utility['current_month'])->toBe(500.0)
        ->and((float) $utility['cumulative'])->toBe(500.0);
});
